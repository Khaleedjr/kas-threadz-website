import Link from "next/link";
import type { Metadata } from "next";
import { SiteFooter, SiteNav } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "The Collection",
  description:
    "The studio's collection of kaftans, jallabiyas and agbadas is coming soon. The jallabiya can be ordered in Design Yours now.",
};

/*
 * Coming soon, like the fabrics and the library: the jallabiya is ordered in
 * Design Yours for now. The collection itself is kept in `collection.tsx`,
 * ready to come back here.
 */
export default function CollectionPage() {
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
          The collection
        </p>
        <h1 className="mt-3 text-[clamp(30px,5vw,52px)]">Coming soon.</h1>
        <p
          className="mx-auto mt-4 max-w-[46ch] text-[14px] leading-[1.72]"
          style={{ color: "var(--on-surface-soft)" }}
        >
          The studio&rsquo;s kaftans, jallabiyas and agbadas, cut to measure, are on their way. In
          the meantime you can design and order the jallabiya, with the price always shown.
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
