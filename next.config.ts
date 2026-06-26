import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Electron desktop app.
  output: "standalone",
  // A stray pnpm-lock.yaml in the home dir confuses workspace-root inference.
  turbopack: { root: process.cwd() },
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
