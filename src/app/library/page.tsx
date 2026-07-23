import type { Metadata } from "next";
import { SiteFooter, SiteNav } from "@/components/site-chrome";
import { Library } from "./library";

export const metadata: Metadata = {
  title: "The Design Library",
  description:
    "Every embroidery design in the house library, by its real machine-file code. LD flap and pocket sets, AF neckline runs, AGD chest panels.",
};

export default function LibraryPage() {
  return (
    <div
      data-register="paper"
      className="ground-paper flex h-dvh flex-col overflow-hidden text-[var(--on-surface)]"
    >
      <SiteNav />
      <Library />
      <SiteFooter />
    </div>
  );
}
