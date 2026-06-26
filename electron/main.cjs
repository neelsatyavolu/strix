const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const { registerAiIpc } = require("./ai.cjs");

// In dev we load the running Next server; in a packaged build this is replaced
// by a bundled local server URL (see packaging step).
const APP_URL = process.env.PROCTORLY_URL || "http://localhost:3000";

let win;

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
  win.loadURL(APP_URL);

  // Dev-only: capture the window to a PNG then quit (used to verify rendering).
  if (process.env.PROCTORLY_CAPTURE) {
    win.webContents.on("did-finish-load", () => {
      setTimeout(async () => {
        try {
          const img = await win.webContents.capturePage();
          fs.writeFileSync(process.env.PROCTORLY_CAPTURE, img.toPNG());
        } catch (e) {
          console.error("capture failed", e);
        }
        app.quit();
      }, 4000);
    });
  }
}

app.whenReady().then(() => {
  registerAiIpc(ipcMain, shell);
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
