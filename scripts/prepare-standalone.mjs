// Prepare the Next standalone build for bundling inside Electron:
//  1. copy static assets + public into the standalone dir (Next omits them),
//  2. write runtime-env.json with the server-only secrets the bundled server
//     needs at runtime (read by electron/main.cjs and passed to the server).
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SA = path.join(ROOT, ".next/standalone");

if (!fs.existsSync(SA)) {
  console.error("No .next/standalone — run `next build` (output: 'standalone') first.");
  process.exit(1);
}

fs.cpSync(path.join(ROOT, ".next/static"), path.join(SA, ".next/static"), { recursive: true });
if (fs.existsSync(path.join(ROOT, "public"))) {
  fs.cpSync(path.join(ROOT, "public"), path.join(SA, "public"), { recursive: true });
}

const env = {};
try {
  for (const line of fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
  }
} catch { /* no .env.local */ }

const KEYS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_URL",
  "SUPABASE_JWT_SECRET",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];
const runtime = { NEXT_PUBLIC_SITE_URL: "https://proctorly-rho.vercel.app" };
for (const k of KEYS) if (env[k]) runtime[k] = env[k];
fs.writeFileSync(path.join(SA, "runtime-env.json"), JSON.stringify(runtime, null, 2));

console.log(`standalone prepared: static+public copied; runtime-env.json has ${Object.keys(runtime).length} keys`);
