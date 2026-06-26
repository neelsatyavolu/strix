const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const { spawn } = require("node:child_process");
const { registerAiIpc } = require("./ai.cjs");

// Dev: load the running `next dev` server. Packaged: spawn the bundled Next
// standalone server (with Electron's node) and load it locally.
const DEV_URL = process.env.PROCTORLY_URL || "http://localhost:3000";
const PROD_PORT = 41637;

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
