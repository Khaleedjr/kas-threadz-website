import type { MetadataRoute } from "next";
import { getCatalogue } from "@/lib/content";
import { SITE } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { pieces } = await getCatalogue();
  const pages = ["", "/collection", "/fabrics", "/library", "/loom", "/atelier"];

  return [
    ...pages.map((path) => ({
      url: `${SITE.url}${path}`,
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : 0.8,
    })),
    ...pieces.map((piece) => ({
      url: `${SITE.url}/collection/${piece.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
