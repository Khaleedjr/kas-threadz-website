import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteFooter, SiteNav } from "@/components/site-chrome";
import { getCatalogue } from "@/lib/content";
import { FEATURED } from "@/lib/featured-builds";
import { CatalogueProvider } from "../catalogue-context";
import { Loom } from "../loom";

/*
 * Design Yours, opened set to one of the builds the home page shows. Built
 * ahead for each of them; any other address here is not found.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return FEATURED.map((b) => ({ build: b.slug }));
}

export const metadata: Metadata = {
  title: "Design Yours",
  description:
    "Preorder the jallabiya: choose the cloth, colour, embroidery design and size, and pay in full. The first run is 100 sets, adult and children's.",
  // the same page as Design Yours, only opened on another build
  alternates: { canonical: "/loom" },
};

export default async function FeaturedLoomPage({ params }: { params: Promise<{ build: string }> }) {
  const { build } = await params;
  const featured = FEATURED.find((b) => b.slug === build);
  if (!featured) notFound();
  const catalogue = await getCatalogue();
  return (
    <div data-register="paper" className="ground-paper flex-1 flex flex-col text-[var(--on-surface)]">
      <SiteNav />
      <CatalogueProvider value={catalogue}>
        <Loom opening={{ colour: featured.colour, design: featured.design }} />
      </CatalogueProvider>
      <SiteFooter />
    </div>
  );
}
