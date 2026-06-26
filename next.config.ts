import type { NextConfig } from "next";

// The Mac build (update.sh) uploads its artifacts to a Vercel Blob store; this
// makes strixprep.com/downloads/* serve them from there. Set DOWNLOADS_BLOB_BASE
// to the store's base URL (printed by update.sh) in the Vercel project env.
const downloadsBase = process.env.DOWNLOADS_BLOB_BASE;
async function redirects() {
  if (!downloadsBase) return [];
  return [
    {
      source: "/downloads/:path*",
      destination: `${downloadsBase}/downloads/:path*`,
      permanent: false,
    },
  ];
}

// The Electron desktop build needs a self-contained `standalone` server plus
// explicit roots (a stray ~/pnpm-lock.yaml otherwise confuses workspace-root
// inference). But those same options misplace the build output on Vercel and
// 404 every route — so on Vercel (VERCEL=1) use a pristine default config.
const nextConfig: NextConfig = process.env.VERCEL
  ? { redirects }
  : {
      output: "standalone",
      turbopack: { root: process.cwd() },
      outputFileTracingRoot: process.cwd(),
      redirects,
    };

export default nextConfig;
