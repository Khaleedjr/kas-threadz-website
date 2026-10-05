import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // lets the dev server be opened at 127.0.0.1 as well as localhost; without
  // it the page's scripts are refused and the mark never sews. Dev only.
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    // photographs the studio uploads in its dashboard, kept in Vercel Blob
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
};

export default nextConfig;
