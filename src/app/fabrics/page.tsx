import Link from "next/link";
import type { Metadata } from "next";
import { SiteFooter, SiteNav } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "The Fabrics",
  description:
    "The full material library is being restocked. Cotton and silk are available to commission in the Loom now.",
};

export default function FabricsPage() {
  return (
    <div
      data-register="paper"
      className="ground-paper flex flex-1 flex-col text-[var(--on-surface)]"
    >
      <SiteNav />

      <section
        id="main"
        className="flex flex-1 flex-col items-center justify-center px-5 py-16 text-center sm:px-8"
      >
        <p className="label" style={{ color: "var(--accent)" }}>
          The material library
        </p>
        <h1 className="mt-3 text-[clamp(30px,5vw,52px)]">Coming soon.</h1>
        <p
          className="mx-auto mt-4 max-w-[46ch] text-[14px] leading-[1.72]"
          style={{ color: "var(--on-surface-soft)" }}
        >
          The full cloth library is being restocked. In the meantime the Loom cuts in cotton and
          silk, in every house colour, with the estimate always visible.
        </p>
        <Link
          href="/loom"
          className="mt-8 inline-block rounded-sm px-6 py-[14px] text-[10.5px] font-medium uppercase tracking-[0.2em]"
          style={{ background: "var(--action)", color: "var(--on-action)" }}
        >
          Open the Loom
        </Link>
      </section>

      <SiteFooter />
    </div>
  );
}
