import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@walk/shared", "@walk/ui"]
};

export default nextConfig;
