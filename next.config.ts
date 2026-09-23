import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // photographs the studio uploads in its dashboard, kept in Vercel Blob
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
};

export default nextConfig;
