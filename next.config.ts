import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A stray pnpm-lock.yaml in the home dir confuses workspace-root inference.
  turbopack: { root: process.cwd() },
};

export default nextConfig;
