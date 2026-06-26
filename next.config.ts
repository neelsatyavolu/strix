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

// The desktop app loads the deployed site over HTTPS rather than bundling a
// server, so there's no standalone build to special-case — same config here
// and on Vercel.
const nextConfig: NextConfig = { redirects };

export default nextConfig;
