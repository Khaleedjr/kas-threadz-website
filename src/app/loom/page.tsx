import type { Metadata } from "next";
import { SiteFooter, SiteNav } from "@/components/site-chrome";
import { getCatalogue } from "@/lib/content";
import { CatalogueProvider } from "./catalogue-context";
import { Loom } from "./loom";

export const metadata: Metadata = {
  title: "Design Yours",
  description:
    "Preorder the jallabiya: choose the cloth, colour, embroidery design and size, and pay in full. The first run is 100 sets, adult and children's.",
};

export default async function LoomPage() {
  const catalogue = await getCatalogue();
  return (
    <div data-register="paper" className="ground-paper flex-1 flex flex-col text-[var(--on-surface)]">
      <SiteNav />
      <CatalogueProvider value={catalogue}>
        <Loom />
      </CatalogueProvider>
      <SiteFooter />
    </div>
  );
}
