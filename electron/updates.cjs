const { app } = require("electron");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const https = require("node:https");
const crypto = require("node:crypto");
const { spawn, execFile } = require("node:child_process");

// Self-contained macOS auto-updater that works for UNSIGNED builds.
//
// electron-updater (Squirrel.Mac) refuses to self-install an app that isn't
// code-signed, so "Restart to install" was a dead button. This updater bypasses
// Squirrel entirely: it reads the same latest-mac.yml feed, downloads the .zip,
// verifies its sha512, extracts the new Strix.app, then swaps the running bundle
// in place and relaunches. It works without signing because files we download
// programmatically never get the Gatekeeper quarantine flag.
//
// The renderer contract (state shape + IPC channels) is unchanged, so the popup
// and Settings UI render off the same `state` object as before.

const FEED_BASE = (process.env.DOWNLOADS_URL || "https://strixprep.com/downloads/").replace(/\/*$/, "/");
const DOWNLOAD_URL = process.env.STRIX_DOWNLOAD_URL || "https://strixprep.com/downloads/Strix-Prep.dmg";
const APP_NAME = "Strix.app";

// --- small helpers -----------------------------------------------------------

const msg = (e) => String(e && e.message ? e.message : e);

// Follow redirects (strixprep.com/downloads/* redirects to the Blob store).
function httpGet(url, onResponse, redirects = 0) {
  const req = https.get(url, { headers: { "user-agent": "Strix-Updater" } }, (resp) => {
    const code = resp.statusCode || 0;
    if ([301, 302, 303, 307, 308].includes(code) && resp.headers.location && redirects < 5) {
      resp.resume();
      return httpGet(new URL(resp.headers.location, url).toString(), onResponse, redirects + 1);
    }
    onResponse(resp);
  });
  req.on("error", (err) => onResponse(null, err));
  return req;
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    httpGet(url, (resp, err) => {
      if (err) return reject(err);
      if (resp.statusCode !== 200) {
        resp.resume();
        return reject(new Error(`HTTP ${resp.statusCode} fetching feed`));
      }
      let body = "";
      resp.setEncoding("utf8");
      resp.on("data", (c) => (body += c));
      resp.on("end", () => resolve(body));
      resp.on("error", reject);
    });
  });
}

// Stream a download to disk, reporting percent and returning its base64 sha512.
function downloadFile(url, dest, onProgress) {
  return new Promise((resolve, reject) => {
    httpGet(url, (resp, err) => {
      if (err) return reject(err);
      if (resp.statusCode !== 200) {
        resp.resume();
        return reject(new Error(`HTTP ${resp.statusCode} downloading update`));
      }
      const total = Number(resp.headers["content-length"]) || 0;
      const hash = crypto.createHash("sha512");
      const file = fs.createWriteStream(dest);
      let got = 0;
      let lastPct = -1;
      resp.on("data", (chunk) => {
        got += chunk.length;
        hash.update(chunk);
        if (total) {
          const pct = Math.round((got / total) * 100);
          if (pct !== lastPct) { lastPct = pct; onProgress(pct); }
        }
      });
      resp.on("error", reject);
      file.on("error", reject);
      resp.pipe(file);
      file.on("finish", () => file.close(() => resolve(hash.digest("base64"))));
    });
  });
}

// Numeric semver compare; returns true if `a` is strictly newer than `b`.
function isNewer(a, b) {
  const parse = (v) => String(v || "0").split("-")[0].split(".").map((n) => parseInt(n, 10) || 0);
  const [a1 = 0, a2 = 0, a3 = 0] = parse(a);
  const [b1 = 0, b2 = 0, b3 = 0] = parse(b);
  if (a1 !== b1) return a1 > b1;
  if (a2 !== b2) return a2 > b2;
  return a3 > b3;
}

// The running app bundle, e.g. /Applications/Strix.app — or null if we can't
// locate it or it isn't safely swappable (read-only / translocated / no perms).
function swappableBundlePath() {
  const exe = app.getPath("exe");
  const marker = ".app/Contents/MacOS/";
  const i = exe.indexOf(marker);
  if (i === -1) return null;
  const appPath = exe.slice(0, i + 4);
  if (appPath.includes("/AppTranslocation/")) return null; // running from the dmg
  try {
    fs.accessSync(path.dirname(appPath), fs.constants.W_OK);
  } catch {
    return null;
  }
  return appPath;
}

// Single-quote a path for safe interpolation into the bash swap script.
const shq = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;

function registerUpdates({ ipcMain, shell, getWindow }) {
  let state = {
    status: "idle", // idle | checking | available | downloading | downloaded | up-to-date | error | dev
    currentVersion: app.getVersion(),
    version: null,
    progress: 0,
    error: null,
    downloadUrl: DOWNLOAD_URL,
    canInstall: false, // true once a verified update is staged and ready to swap
  };
  let staged = null; // { version, appPath } — extracted Strix.app awaiting the swap
  let busy = false;

  const send = (patch) => {
    state = { ...state, ...patch };
    const win = getWindow && getWindow();
    if (win && !win.isDestroyed()) win.webContents.send("updates:event", state);
  };

  // Inert in dev — there's no packaged bundle to replace.
  if (!app.isPackaged) {
    state.status = "dev";
    ipcMain.handle("updates:state", () => state);
    ipcMain.handle("updates:check", () => state);
    ipcMain.handle("updates:install", () => true);
    ipcMain.handle("updates:openDownload", () => { shell.openExternal(DOWNLOAD_URL); return true; });
    return;
  }

  async function downloadAndStage(version, file, expectedSha) {
    send({ status: "downloading", version, progress: 0, error: null });
    const zipPath = path.join(os.tmpdir(), `strix-update-${version}.zip`);
    const gotSha = await downloadFile(FEED_BASE + file, zipPath, (p) => send({ progress: p }));
    if (expectedSha && gotSha !== expectedSha) throw new Error("Update failed verification (checksum mismatch)");

    // Extract with ditto (handles .app symlinks/metadata that plain unzip mangles).
    const dir = path.join(os.tmpdir(), `strix-update-${version}`);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    await new Promise((resolve, reject) => {
      execFile("/usr/bin/ditto", ["-x", "-k", zipPath, dir], (err) => (err ? reject(err) : resolve()));
    });
    const appPath = path.join(dir, APP_NAME);
    if (!fs.existsSync(appPath)) throw new Error("Update package was missing the app bundle");

    fs.rmSync(zipPath, { force: true });
    staged = { version, appPath };
    send({ status: "downloaded", version, progress: 100, canInstall: true });
  }

  async function check({ autoDownload }) {
    if (busy) return state;
    busy = true;
    send({ status: "checking", error: null });
    try {
      const yml = await fetchText(FEED_BASE + "latest-mac.yml");
      const version = (yml.match(/^version:\s*(.+)$/m) || [])[1]?.trim();
      const file = (yml.match(/^path:\s*(.+)$/m) || [])[1]?.trim();
      const sha = (yml.match(/^sha512:\s*(.+)$/m) || [])[1]?.trim();
      if (!version || !file) throw new Error("Couldn't read the update feed");

      if (!isNewer(version, state.currentVersion)) {
        staged = null;
        send({ status: "up-to-date", version, canInstall: false });
      } else if (staged && staged.version === version) {
        send({ status: "downloaded", version, canInstall: true }); // already staged
      } else {
        send({ status: "available", version, canInstall: false });
        if (autoDownload) await downloadAndStage(version, file, sha);
      }
    } catch (e) {
      // A failed check/download still leaves the manual dmg download usable.
      send({ status: "error", error: msg(e), canInstall: !!staged });
    } finally {
      busy = false;
    }
    return state;
  }

  // Swap the running bundle for the staged one, then relaunch. The actual move
  // happens in a detached script that waits for THIS process to exit first.
  function install() {
    if (!staged) { shell.openExternal(state.downloadUrl); return true; }
    const appPath = swappableBundlePath();
    if (!appPath) { shell.openExternal(state.downloadUrl); return true; } // can't swap -> manual

    const script = [
      "#!/bin/bash",
      "set -e",
      `APP=${shq(appPath)}`,
      `NEW=${shq(staged.appPath)}`,
      `while /bin/kill -0 ${process.pid} 2>/dev/null; do /bin/sleep 0.2; done`,
      `/usr/bin/ditto "$NEW" "$APP.update-tmp"`,
      `/bin/rm -rf "$APP"`,
      `/bin/mv "$APP.update-tmp" "$APP"`,
      `/usr/bin/xattr -dr com.apple.quarantine "$APP" 2>/dev/null || true`,
      `/usr/bin/open "$APP"`,
      `/bin/rm -rf ${shq(path.dirname(staged.appPath))}`,
    ].join("\n");

    const scriptPath = path.join(os.tmpdir(), `strix-swap-${staged.version}.sh`);
    try {
      fs.writeFileSync(scriptPath, script, { mode: 0o755 });
      const child = spawn("/bin/bash", [scriptPath], { detached: true, stdio: "ignore" });
      child.unref();
    } catch (e) {
      send({ status: "error", error: msg(e) });
      shell.openExternal(state.downloadUrl);
      return true;
    }
    setTimeout(() => app.quit(), 250);
    return true;
  }

  // First check shortly after launch, then hourly. Auto-download in the background.
  setTimeout(() => check({ autoDownload: true }), 8000);
  setInterval(() => check({ autoDownload: true }), 60 * 60 * 1000);

  ipcMain.handle("updates:state", () => state);
  ipcMain.handle("updates:check", () => check({ autoDownload: true }));
  ipcMain.handle("updates:install", () => install());
  ipcMain.handle("updates:openDownload", () => { shell.openExternal(state.downloadUrl); return true; });
}

module.exports = { registerUpdates, DOWNLOAD_URL };
