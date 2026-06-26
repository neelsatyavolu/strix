const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const http = require("node:http");
const { registerAiIpc } = require("./ai.cjs");
const { registerUpdates } = require("./updates.cjs");

// The window loads the deployed site directly. Dev: the local `next dev` server;
// packaged: production on Vercel. STRIX_URL overrides either (e.g. a preview URL).
const OAUTH_PORT = 41639; // loopback for Google OAuth (Google blocks embedded webviews)

// Open Google's consent page in the system browser and resolve with the
// loopback redirect URL (which carries the auth code).
function googleLoopback(authUrl) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (!req.url || !req.url.startsWith("/auth/callback")) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end("<!doctype html><meta charset=utf-8><body style=\"font-family:-apple-system;display:grid;place-items:center;height:90vh;color:#1d1d1f\"><div style=\"text-align:center\"><h2>Signed in to Strix</h2><p>You can close this tab and return to the app.</p></div>");
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
const appUrl =
  process.env.STRIX_URL || (app.isPackaged ? "https://strixprep.com" : "http://localhost:3000");

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
  // The desktop app boots straight into the SPA; / is the marketing landing.
  win.loadURL(appUrl + "/app");

  if (process.env.STRIX_CAPTURE) {
    win.webContents.on("did-finish-load", () => {
      setTimeout(async () => {
        try { fs.writeFileSync(process.env.STRIX_CAPTURE, (await win.webContents.capturePage()).toPNG()); }
        catch (e) { console.error("capture failed", e); }
        app.quit();
      }, 4000);
    });
  }
}

app.whenReady().then(() => {
  registerAiIpc(ipcMain, shell);
  ipcMain.handle("auth:google", (_e, authUrl) => googleLoopback(authUrl));
  // Auto-update: checks the generic feed (app-update.yml -> strixprep.com/downloads)
  // and streams lifecycle events to the renderer. No-op in dev (not packaged).
  registerUpdates({ ipcMain, shell, getWindow: () => win });
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
