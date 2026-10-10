import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // lets the dev server be opened at 127.0.0.1 as well as localhost; without
  // it the page's scripts are refused and the mark never sews. Dev only.
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    // photographs the studio uploads in its dashboard, kept in Vercel Blob
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // no other site can frame these pages, so a click cannot be stolen through one
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          // a file is read as the type it is sent as, never guessed
          { key: "X-Content-Type-Options", value: "nosniff" },
          // other sites are told only which site a visitor came from, never the page
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
