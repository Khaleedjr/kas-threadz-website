import type { MetadataRoute } from "next";
import { PIECES } from "@/lib/catalogue";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/collection", "/library", "/loom", "/atelier"];

  return [
    ...pages.map((path) => ({
      url: `${SITE.url}${path}`,
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : 0.8,
    })),
    ...PIECES.map((piece) => ({
      url: `${SITE.url}/collection/${piece.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
