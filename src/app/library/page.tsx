import Link from "next/link";
import type { Metadata } from "next";
import { SiteFooter, SiteNav } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "The Design Library",
  description:
    "The full library of the studio's embroidery designs is coming soon. The jallabiya can be ordered in Design Yours now, in every one of its designs.",
};

/*
 * Coming soon, like the fabrics: none of the library's designs can be ordered
 * yet, since Design Yours has its own for the jallabiya. The library itself
 * is kept in `library.tsx`, ready to come back here when they can be.
 */
export default function LibraryPage() {
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
          The design library
        </p>
        <h1 className="mt-3 text-[clamp(30px,5vw,52px)]">Coming soon.</h1>
        <p
          className="mx-auto mt-4 max-w-[46ch] text-[14px] leading-[1.72]"
          style={{ color: "var(--on-surface-soft)" }}
        >
          The studio&rsquo;s full library of embroidery designs is on its way. In the meantime you can
          order the jallabiya in any of its designs, with the price always shown. Kaftan and agbada
          designs are coming soon.
        </p>
        <Link
          href="/loom"
          className="mt-8 inline-block rounded-sm px-6 py-[14px] text-[10.5px] font-medium uppercase tracking-[0.2em]"
          style={{ background: "var(--action)", color: "var(--on-action)" }}
        >
          Start designing
        </Link>
      </section>

      <SiteFooter />
    </div>
  );
}
