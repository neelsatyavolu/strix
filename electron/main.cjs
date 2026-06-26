const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const { spawn } = require("node:child_process");
const http = require("node:http");
const { registerAiIpc } = require("./ai.cjs");

// Dev: load the running `next dev` server. Packaged: spawn the bundled Next
// standalone server (with Electron's node) and load it locally.
const DEV_URL = process.env.PROCTORLY_URL || "http://localhost:3000";
const PROD_PORT = 41637;
const OAUTH_PORT = 41639; // loopback for Google OAuth (Google blocks embedded webviews)

// Open Google's consent page in the system browser and resolve with the
// loopback redirect URL (which carries the auth code).
function googleLoopback(authUrl) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (!req.url || !req.url.startsWith("/auth/callback")) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end("<!doctype html><meta charset=utf-8><body style=\"font-family:-apple-system;display:grid;place-items:center;height:90vh;color:#1d1d1f\"><div style=\"text-align:center\"><h2>Signed in to Proctorly</h2><p>You can close this tab and return to the app.</p></div>");
      const full = `http://127.0.0.1:${OAUTH_PORT}${req.url}`;
      try { server.close(); } catch { /* */ }
      resolve(full);
    });
    server.on("error", reject);
    server.listen(OAUTH_PORT, "127.0.0.1", () => shell.openExternal(authUrl));
    setTimeout(() => { try { server.close(); } catch { /* */ } reject(new Error("Google sign-in timed out.")); }, 180000);
  });
}

let win;
let serverProc;
let appUrl = DEV_URL;

function startBundledServer() {
  const serverDir = path.join(process.resourcesPath, "server");
  const serverJs = path.join(serverDir, "server.js");
  const env = {
    ...process.env,
    ELECTRON_RUN_AS_NODE: "1",
    NODE_ENV: "production",
    PORT: String(PROD_PORT),
    HOSTNAME: "127.0.0.1",
  };
  try {
    Object.assign(env, JSON.parse(fs.readFileSync(path.join(serverDir, "runtime-env.json"), "utf8")));
  } catch { /* runtime env optional */ }
  serverProc = spawn(process.execPath, [serverJs], { cwd: serverDir, env, stdio: "ignore" });
  appUrl = `http://127.0.0.1:${PROD_PORT}`;
}

async function waitForServer(url, tries = 80) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { method: "HEAD" });
      if (r.status < 500) return true;
    } catch { /* not up yet */ }
    await new Promise((res) => setTimeout(res, 250));
  }
  return false;
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 832,
    minWidth: 980,
    minHeight: 640,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 13, y: 13 },
    backgroundColor: "#0e0e10",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.once("ready-to-show", () => win.show());
  win.loadURL(appUrl);

  if (process.env.PROCTORLY_CAPTURE) {
    win.webContents.on("did-finish-load", () => {
      setTimeout(async () => {
        try { fs.writeFileSync(process.env.PROCTORLY_CAPTURE, (await win.webContents.capturePage()).toPNG()); }
        catch (e) { console.error("capture failed", e); }
        app.quit();
      }, 4000);
    });
  }
}

app.whenReady().then(async () => {
  registerAiIpc(ipcMain, shell);
  ipcMain.handle("auth:google", (_e, authUrl) => googleLoopback(authUrl));
  if (app.isPackaged) {
    startBundledServer();
    await waitForServer(appUrl + "/");
  }
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
app.on("quit", () => { if (serverProc) serverProc.kill(); });
