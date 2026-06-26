/* electron-builder configuration (moved out of package.json so it can read the
 * Apple signing/notarization creds from .env and toggle behaviour on them).
 *
 * Build + publish flow:
 *   pnpm dist            # builds, signs+notarizes (if creds present), outputs dist-app/
 *   then upload dist-app/{Strix-Prep.dmg, *.zip, *.blockmap, latest-mac.yml}
 *        to https://strixprep.com/downloads/   (Vercel Blob or public/downloads)
 *
 * The Mac auto-updater reads latest-mac.yml + the .zip from that same URL.
 * The marketing "Download for Mac" button points at Strix-Prep.dmg there.
 */
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

// --- Make .env vars visible to electron-builder (Next loads .env, this doesn't).
function loadDotEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    if (process.env[key] !== undefined) continue;
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}
loadDotEnv(path.join(__dirname, ".env"));

// --- Notarization (App Store Connect API key). The .env holds the key contents
// in APPLE_PRIVATE_KEY; notarytool needs it as a .p8 file, so materialize it and
// expose the standard env vars electron-builder/notarytool look for.
const TEAM_ID = process.env.APPLE_TEAM_ID;
const KEY_ID = process.env.APPLE_KEY_ID;
const ISSUER = process.env.APPLE_API_ISSUER; // required for API-key notarization
let privateKey = process.env.APPLE_PRIVATE_KEY;

// Signing is opt-in: `STRIX_SIGN=1 pnpm dist` to sign + notarize. Default builds
// unsigned (download works; the in-app updater uses its open-download fallback).
const sign = process.env.STRIX_SIGN === "1";
let notarize = false;

if (sign && TEAM_ID && KEY_ID && privateKey && ISSUER) {
  privateKey = privateKey.replace(/\\n/g, "\n"); // un-escape single-line .env form
  const keyPath = path.join(os.tmpdir(), `AuthKey_${KEY_ID}.p8`);
  fs.writeFileSync(keyPath, privateKey, { mode: 0o600 });
  process.env.APPLE_API_KEY = keyPath;
  process.env.APPLE_API_KEY_ID = KEY_ID;
  process.env.APPLE_API_ISSUER = ISSUER;
  notarize = { teamId: TEAM_ID };
} else if (sign) {
  const missing = [
    !TEAM_ID && "APPLE_TEAM_ID",
    !KEY_ID && "APPLE_KEY_ID",
    !privateKey && "APPLE_PRIVATE_KEY",
    !ISSUER && "APPLE_API_ISSUER",
  ].filter(Boolean);
  console.warn(
    `[electron-builder] STRIX_SIGN set but notarization OFF — missing ${missing.join(", ")} in .env. ` +
      "(Signing also needs a 'Developer ID Application' cert in your keychain.)",
  );
} else {
  console.log("[electron-builder] Building UNSIGNED — set STRIX_SIGN=1 (+ Apple creds) to sign & notarize.");
}

/** @type {import('electron-builder').Configuration} */
module.exports = {
  appId: "com.strixprep.app",
  productName: "Strix",
  afterPack: "scripts/after-pack.cjs",
  files: [
    "package.json",
    "electron/**/*",
    // The Next app deps run from the bundled standalone server (Resources/server),
    // not the asar — keep them out so only the Electron main deps (electron-updater
    // + closure, resolved by electron-builder's pnpm support) ship in the app.
    "!node_modules/next/**",
    "!node_modules/react/**",
    "!node_modules/react-dom/**",
    "!node_modules/@supabase/**",
    "!node_modules/katex/**",
    "!node_modules/sanitize-html/**",
    "!node_modules/lucide-react/**",
    "!node_modules/zod/**",
  ],
  extraResources: [{ from: ".next/standalone", to: "server" }],
  directories: { output: "dist-app" },
  // Auto-update feed. Defaults to the pretty domain (which redirects to the Blob
  // store); set DOWNLOADS_URL to the store's .../downloads/ base to fetch direct.
  publish: [
    { provider: "generic", url: process.env.DOWNLOADS_URL || "https://strixprep.com/downloads/" },
  ],
  mac: {
    target: ["dmg", "zip"], // dmg = manual download, zip = auto-update feed
    category: "public.app-category.education",
    icon: "build/icon.icns",
    gatekeeperAssess: false,
    // null identity => ad-hoc/unsigned (download works, auto-install does not).
    identity: sign ? undefined : null,
    // Hardened runtime + entitlements only matter for a real signed/notarized build.
    hardenedRuntime: sign,
    ...(sign
      ? {
          entitlements: "build/entitlements.mac.plist",
          entitlementsInherit: "build/entitlements.mac.plist",
        }
      : {}),
    notarize,
  },
  dmg: { artifactName: "Strix-Prep.dmg" }, // stable URL for the download button
};
