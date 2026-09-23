import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // the studio's page is private, and never to be listed
    rules: { userAgent: "*", allow: "/", disallow: "/studio" },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
