import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // photographs the studio uploads in Sanity
    remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io" }],
  },
};

export default nextConfig;
