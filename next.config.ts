import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: ["thewaitlist.lvh.me", "*.lvh.me"],
};

export default nextConfig;
