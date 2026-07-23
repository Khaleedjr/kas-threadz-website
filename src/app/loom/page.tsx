import type { Metadata } from "next";
import { SiteFooter, SiteNav } from "@/components/site-chrome";
import { Loom } from "./loom";

export const metadata: Metadata = {
  title: "The Loom",
  description:
    "Build your piece before we cut it: fabric, colour, embroidery and measurements, with the estimate always visible.",
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
