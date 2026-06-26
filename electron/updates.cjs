const { app } = require("electron");

// Stable Mac download page/file for the manual fallback (unsigned builds can
// download but not self-install). Overridable at build time.
const DOWNLOAD_URL =
  process.env.STRIX_DOWNLOAD_URL || "https://strixprep.com/downloads/Strix-Prep.dmg";

// Encapsulates electron-updater. Streams a single `state` object to the renderer
// on every transition so the UI (popup + Settings) can render off one source.
// No-op in dev / when the updater isn't available.
function registerUpdates({ ipcMain, shell, getWindow }) {
  let state = {
    status: "idle", // idle | checking | available | downloading | downloaded | up-to-date | error | dev
    currentVersion: app.getVersion(),
    version: null, // version offered by the feed
    progress: 0,
    error: null,
    downloadUrl: DOWNLOAD_URL,
    canInstall: false, // true once an update is downloaded and ready to apply
  };

  const send = (patch) => {
    state = { ...state, ...patch };
    const win = getWindow && getWindow();
    if (win && !win.isDestroyed()) win.webContents.send("updates:event", state);
  };

  // Only the packaged app has a real feed (app-update.yml). Keep dev inert.
  let autoUpdater = null;
  if (app.isPackaged) {
    try {
      ({ autoUpdater } = require("electron-updater"));
    } catch (e) {
      autoUpdater = null;
    }
  }

  if (autoUpdater) {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on("checking-for-update", () => send({ status: "checking", error: null }));
    autoUpdater.on("update-available", (info) =>
      send({ status: "downloading", version: info?.version || null, progress: 0 }),
    );
    autoUpdater.on("update-not-available", () => send({ status: "up-to-date" }));
    autoUpdater.on("download-progress", (p) =>
      send({ status: "downloading", progress: Math.round(p?.percent || 0) }),
    );
    autoUpdater.on("update-downloaded", (info) =>
      send({ status: "downloaded", version: info?.version || state.version, canInstall: true }),
    );
    autoUpdater.on("error", (err) =>
      // A failed check/download (e.g. an unsigned build) leaves the manual
      // download fallback usable; surface the error but keep any known version.
      send({ status: "error", error: String(err && err.message ? err.message : err) }),
    );

    // First check shortly after launch, then hourly.
    const check = () => autoUpdater.checkForUpdates().catch(() => {});
    setTimeout(check, 8000);
    setInterval(check, 60 * 60 * 1000);
  } else {
    state.status = "dev";
  }

  ipcMain.handle("updates:state", () => state);
  ipcMain.handle("updates:check", async () => {
    if (!autoUpdater) return state;
    send({ status: "checking", error: null });
    try {
      await autoUpdater.checkForUpdates();
    } catch (e) {
      send({ status: "error", error: String(e && e.message ? e.message : e) });
    }
    return state;
  });
  ipcMain.handle("updates:install", () => {
    if (autoUpdater && state.canInstall) autoUpdater.quitAndInstall();
    return true;
  });
  ipcMain.handle("updates:openDownload", () => {
    shell.openExternal(state.downloadUrl);
    return true;
  });
}

module.exports = { registerUpdates, DOWNLOAD_URL };
