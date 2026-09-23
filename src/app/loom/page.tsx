import type { Metadata } from "next";
import { SiteFooter, SiteNav } from "@/components/site-chrome";
import { Loom } from "./loom";

export const metadata: Metadata = {
  title: "The Loom",
  description:
    "Preorder the jallabiya: choose the cloth, colour, neckline embroidery and size, and pay in full. The first run is 100 sets, adult and children's.",
};

export default function LoomPage() {
  return (
    <div data-register="paper" className="ground-paper flex-1 flex flex-col text-[var(--on-surface)]">
      <SiteNav />
      <Loom />
      <SiteFooter />
    </div>
  );
}
