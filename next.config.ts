import type { NextConfig } from "next";

// The Electron desktop build needs a self-contained `standalone` server plus
// explicit roots (a stray ~/pnpm-lock.yaml otherwise confuses workspace-root
// inference). But those same options misplace the build output on Vercel and
// 404 every route — so on Vercel (VERCEL=1) use a pristine default config.
const nextConfig: NextConfig = process.env.VERCEL
  ? {}
  : {
      output: "standalone",
      turbopack: { root: process.cwd() },
      outputFileTracingRoot: process.cwd(),
    };

export default nextConfig;
