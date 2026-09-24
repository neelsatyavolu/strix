const fs = require("node:fs");
const crypto = require("node:crypto");

// Anonymous daily heartbeat for the Mac app (install counts on analytics.n3el.dev).
//
// At most one POST per UTC day with a random install ID, app version, macOS
// version, CPU arch and channel. No account, email, file path or practice data.
// Fire-and-forget: failures are silent and simply retried on the next tick.
// The user can turn it off in Settings; when off, nothing is sent.
//
// Kept free of Electron imports so it can be unit-tested with plain Node.

const ENDPOINT = "https://analytics.n3el.dev/v1/heartbeat";
const PRODUCT = "strix";
const TIMEOUT_MS = 10000;
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const utcDay = (date) => date.toISOString().slice(0, 10);

function readState(file) {
  try {
    const saved = JSON.parse(fs.readFileSync(file, "utf8"));
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    return {}; // first run or unreadable file
  }
}

function writeState(file, state) {
  try { fs.writeFileSync(file, JSON.stringify(state)); }
  catch { /* best effort; worst case we ping again later */ }
}

// info: { version, platform, os_version, arch, channel }
function createHeartbeat({ stateFile, info, fetchImpl = globalThis.fetch, now = () => new Date() }) {
  let sending = false;

  const isEnabled = () => readState(stateFile).enabled !== false;

  function setEnabled(on) {
    writeState(stateFile, { ...readState(stateFile), enabled: Boolean(on) });
    return Boolean(on);
  }

  // Sends today's heartbeat if enabled and not yet sent. Resolves true if sent.
  async function tick() {
    const state = readState(stateFile);
    if (state.enabled === false || sending) return false;
    const day = utcDay(now());
    if (state.lastSentDay === day) return false;

    const installId = UUID_V4.test(state.installId || "") ? state.installId : crypto.randomUUID();
    if (installId !== state.installId) writeState(stateFile, { ...state, installId });

    sending = true;
    try {
      const res = await fetchImpl(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body: JSON.stringify({ product: PRODUCT, install_id: installId, ...info }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res || !res.ok) return false;
      // Re-read so an opt-out made while the request was in flight is kept.
      writeState(stateFile, { ...readState(stateFile), installId, lastSentDay: day });
      return true;
    } catch {
      return false;
    } finally {
      sending = false;
    }
  }

  return { tick, isEnabled, setEnabled };
}

module.exports = { createHeartbeat, ENDPOINT };
