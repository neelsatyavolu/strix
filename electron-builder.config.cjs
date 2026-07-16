/* electron-builder configuration.
 *
 * Builds (default unsigned for local iteration):
 *   pnpm dist                 # unsigned .app / .dmg / .zip → dist-app/
 *   pnpm dist:signed          # Developer ID sign (1Password), no notarize
 *   pnpm dist:release         # Developer ID + notarize + staple (public download)
 *   ./update.sh               # official ship: version bump + dist:release + Blob upload
 *
 * Credentials (prefer 1Password via scripts/load-apple-creds.sh — see APPLE_SIGNING.md):
 *   Signing:  CSC_LINK (base64 p12 or path) + CSC_KEY_PASSWORD
 *             or APPLE_CERTIFICATE + APPLE_CERTIFICATE_PASSWORD (shared / Tauri names)
 *   Identity: CSC_NAME or APPLE_SIGNING_IDENTITY
 *             (default: Developer ID Application: Ramakrishna Satyavolu (VTQW687WBQ))
 *   Notary:   APPLE_API_KEY (path to .p8) + APPLE_API_KEY_ID + APPLE_API_ISSUER
 *             Shared loader uses APPLE_API_KEY=id + APPLE_API_KEY_PATH=path; we remap below.
 *   Legacy .env: APPLE_PRIVATE_KEY (pem contents) + APPLE_KEY_ID + APPLE_API_ISSUER + APPLE_TEAM_ID
 *
 * Opt-in flags:
 *   STRIX_SIGN=1|0            force sign / force unsigned
 *   STRIX_NOTARIZE=1|0        force notarize on / off (default: on when notary env is complete)
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
loadDotEnv(path.join(__dirname, ".env.local"));

// electron-builder rejects the "Developer ID Application:" prefix — it picks
// the cert type itself. Full CN is fine for codesign(1); strip for CSC_NAME.
const DEFAULT_IDENTITY = "Ramakrishna Satyavolu (VTQW687WBQ)";
const DEFAULT_IDENTITY_FULL =
  "Developer ID Application: Ramakrishna Satyavolu (VTQW687WBQ)";

function stripAppleIdentityPrefix(name) {
  if (!name) return name;
  return name
    .replace(/^Developer ID Application:\s*/i, "")
    .replace(/^Developer ID Installer:\s*/i, "")
    .replace(/^Apple Development:\s*/i, "")
    .replace(/^Apple Distribution:\s*/i, "")
    .trim();
}

// --- Map shared / Tauri env names → electron-builder (CSC_* + notarytool).
// Prefer CSC_KEYCHAIN (our loader imports the p12 correctly). Do NOT set CSC_LINK
// from APPLE_CERTIFICATE when a keychain is already prepared — EB's CSC_LINK
// import hits a set-key-partition-list password bug on recent macOS.
if (
  !process.env.CSC_LINK &&
  process.env.APPLE_CERTIFICATE &&
  !process.env.CSC_KEYCHAIN
) {
  process.env.CSC_LINK = process.env.APPLE_CERTIFICATE;
}
if (
  !process.env.CSC_KEY_PASSWORD &&
  process.env.APPLE_CERTIFICATE_PASSWORD &&
  !process.env.CSC_KEYCHAIN
) {
  process.env.CSC_KEY_PASSWORD = process.env.APPLE_CERTIFICATE_PASSWORD;
}
{
  const rawName =
    process.env.CSC_NAME ||
    process.env.APPLE_SIGNING_IDENTITY ||
    (process.env.CSC_LINK || process.env.CSC_KEYCHAIN ? DEFAULT_IDENTITY_FULL : undefined);
  if (rawName) {
    process.env.CSC_NAME = stripAppleIdentityPrefix(rawName);
  }
}

// Shared loader: APPLE_API_KEY = key id, APPLE_API_KEY_PATH = path to .p8
// electron-builder: APPLE_API_KEY = path (or contents), APPLE_API_KEY_ID = id
if (process.env.APPLE_API_KEY_PATH && fs.existsSync(process.env.APPLE_API_KEY_PATH)) {
  const looksLikePath =
    process.env.APPLE_API_KEY &&
    (process.env.APPLE_API_KEY.includes(path.sep) || process.env.APPLE_API_KEY.endsWith(".p8"));
  if (!looksLikePath) {
    if (!process.env.APPLE_API_KEY_ID && process.env.APPLE_API_KEY) {
      process.env.APPLE_API_KEY_ID = process.env.APPLE_API_KEY;
    }
    process.env.APPLE_API_KEY = process.env.APPLE_API_KEY_PATH;
  } else if (!process.env.APPLE_API_KEY) {
    process.env.APPLE_API_KEY = process.env.APPLE_API_KEY_PATH;
  }
}

// Legacy .env: materialize APPLE_PRIVATE_KEY → temp AuthKey_*.p8
const legacyKeyId = process.env.APPLE_KEY_ID || process.env.APPLE_API_KEY_ID;
let legacyPrivateKey = process.env.APPLE_PRIVATE_KEY;
if (legacyPrivateKey && legacyKeyId && process.env.APPLE_API_ISSUER) {
  if (!process.env.APPLE_API_KEY || !String(process.env.APPLE_API_KEY).includes(path.sep)) {
    legacyPrivateKey = legacyPrivateKey.replace(/\\n/g, "\n");
    const keyPath = path.join(os.tmpdir(), `AuthKey_${legacyKeyId}.p8`);
    fs.writeFileSync(keyPath, legacyPrivateKey, { mode: 0o600 });
    process.env.APPLE_API_KEY = keyPath;
    process.env.APPLE_API_KEY_ID = legacyKeyId;
  }
}

// CSC_LINK (imported p12) OR keychain identity (CSC_NAME / CSC_KEYCHAIN from our loader).
const hasCsc = Boolean(process.env.CSC_LINK || process.env.CSC_KEYCHAIN || process.env.CSC_NAME);
const forceUnsigned =
  process.env.STRIX_SIGN === "0" || process.env.CSC_IDENTITY_AUTO_DISCOVERY === "false";
const forceSign = process.env.STRIX_SIGN === "1";
// Sign when explicitly requested, or when signing material is in the env.
const sign = !forceUnsigned && (forceSign || hasCsc);

const hasNotaryEnv = Boolean(
  process.env.APPLE_API_KEY &&
    process.env.APPLE_API_KEY_ID &&
    process.env.APPLE_API_ISSUER,
);
// Notarize only on signed builds when notary env is present, unless STRIX_NOTARIZE=0.
const notarize =
  sign && hasNotaryEnv && process.env.STRIX_NOTARIZE !== "0"
    ? true
    : false;

if (sign) {
  const identity = process.env.CSC_NAME || DEFAULT_IDENTITY;
  // ensure prefix-stripped for EB
  process.env.CSC_NAME = stripAppleIdentityPrefix(identity);
  console.log(
    `[electron-builder] Signing with identity: ${identity}` +
      (process.env.CSC_LINK
        ? " (CSC_LINK)"
        : process.env.CSC_KEYCHAIN
          ? " (CSC_KEYCHAIN)"
          : " (login keychain)"),
  );
  if (notarize) {
    console.log(
      `[electron-builder] Notarization ON (API key ${process.env.APPLE_API_KEY_ID}, team ${process.env.APPLE_TEAM_ID || "?"})`,
    );
  } else if (process.env.STRIX_NOTARIZE === "0") {
    console.log("[electron-builder] Notarization OFF (STRIX_NOTARIZE=0).");
  } else {
    console.warn(
      "[electron-builder] Notarization OFF — need APPLE_API_KEY (path) + APPLE_API_KEY_ID + APPLE_API_ISSUER " +
        "(load via scripts/load-apple-creds.sh or set in env).",
    );
  }
} else {
  console.log(
    "[electron-builder] Building UNSIGNED — run `pnpm dist:signed` / `pnpm dist:release`, " +
      "or set STRIX_SIGN=1 after loading Apple creds.",
  );
}

/** @type {import('electron-builder').Configuration} */
module.exports = {
  appId: "com.strixprep.app",
  productName: "Strix",
  files: [
    "package.json",
    "electron/**/*",
    // The window loads the deployed site over HTTPS — the Next app and its deps
    // are not bundled. Keep them out of the asar so only the Electron main deps
    // (electron-updater + closure) ship in the app.
    "!node_modules/next/**",
    "!node_modules/react/**",
    "!node_modules/react-dom/**",
    "!node_modules/@supabase/**",
    "!node_modules/katex/**",
    "!node_modules/sanitize-html/**",
    "!node_modules/lucide-react/**",
    "!node_modules/zod/**",
  ],
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
    identity: sign ? stripAppleIdentityPrefix(process.env.CSC_NAME || DEFAULT_IDENTITY) : null,
    // Hardened runtime + entitlements only matter for a real signed/notarized build.
    hardenedRuntime: sign,
    ...(sign
      ? {
          entitlements: "build/entitlements.mac.plist",
          entitlementsInherit: "build/entitlements.mac.plist",
        }
      : {}),
    // false skips; true + complete APPLE_API_* env runs notarytool + staple on the .app
    notarize,
  },
  dmg: { artifactName: "Strix-Prep.dmg" }, // stable URL for the download button
};
