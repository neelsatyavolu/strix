const fs = require("node:fs");
const path = require("node:path");

// electron-builder's extraResources copy drops the Next `standalone` node_modules
// (pnpm symlinks). Without it the bundled server throws "Cannot find module 'next'"
// → ERR_CONNECTION_REFUSED → black window. Copy it ourselves, preserving the
// relative pnpm symlinks (they resolve within the copied tree, incl. .pnpm/).
module.exports = async function afterPack(context) {
  const appName = context.packager.appInfo.productFilename;
  const dest = path.join(
    context.appOutDir,
    `${appName}.app`,
    "Contents",
    "Resources",
    "server",
    "node_modules",
  );
  const src = path.join(process.cwd(), ".next", "standalone", "node_modules");
  if (!fs.existsSync(src)) {
    throw new Error(`[afterPack] standalone node_modules missing: ${src} — run next build first`);
  }
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(src, dest, { recursive: true, verbatimSymlinks: true });
  console.log(`[afterPack] copied standalone node_modules -> ${dest}`);
};
