import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits .next/standalone with only the traced runtime deps, so the Docker
  // image doesn't need node_modules. See DEPLOYMENT.md.
  output: "standalone",

  // better-sqlite3 is a native module; keep it out of the bundle.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
