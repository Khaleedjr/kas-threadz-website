import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { SiteFooter, SiteNav } from "@/components/site-chrome";
import { FABRICS } from "@/lib/loom";
import { naira } from "@/lib/catalogue";

export const metadata: Metadata = {
  title: "The Fabrics",
  description:
    "The five house materials: Seven Star, Focus, Proper Stripes, Express and Noble Thinker. Any weave, any colour, or bring your own cloth.",
};

export default function FabricsPage() {
  return (
    <div
      data-register="paper"
      className="ground-paper flex flex-1 flex-col text-[var(--on-surface)]"
    >
      <SiteNav />

      <section id="main" className="px-5 pt-8 pb-4 sm:px-8">
        <p className="label" style={{ color: "var(--accent)" }}>
          {FABRICS.length} house materials
        </p>
        <h1 className="mt-2 text-[clamp(26px,4vw,40px)]">The Fabrics</h1>
        <p
          className="mt-3 max-w-[58ch] text-[14px] leading-[1.72]"
          style={{ color: "var(--on-surface-soft)" }}
        >
          Five cloths, each with its own weave and weight. Any of them can be cut into any garment
          we make, in any colour you choose. If you have your own cloth, bring it and we will
          embroider it as carefully as our own.
        </p>
      </section>

      <section className="px-5 pb-10 sm:px-8">
        <ul>
          {FABRICS.map((fabric) => (
            <li
              key={fabric.id}
              className="grid gap-5 border-t border-dashed py-7 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:gap-8"
              style={{ borderColor: "var(--line-dashed)" }}
            >
              {/* Cut lengths, the way cloth is actually shown. The studio's
                  photographs are narrow strips, so they are presented as
                  strips rather than stretched into a picture. */}
              <ul className="flex flex-col gap-2 self-start">
                {fabric.colourways.map((src) => (
                  <li key={src} className="relative aspect-[6/1] overflow-hidden rounded-sm">
                    <Image
                      src={src}
                      alt={`${fabric.name} cloth`}
                      fill
                      sizes="(max-width: 768px) 100vw, 40vw"
                      className="object-cover"
                    />
                  </li>
                ))}
              </ul>

              <div className="flex flex-col justify-center">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h2 className="text-[clamp(20px,2.6vw,26px)]">{fabric.name}</h2>
                  <p className="price text-[14px]">+{naira(fabric.add)}</p>
                </div>

                <p className="label mt-1" style={{ color: "var(--on-surface-soft)" }}>
                  {fabric.house}
                </p>

                <p className="mt-3 max-w-[52ch] text-[13.5px] leading-[1.72]">{fabric.note}</p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span
                    className="label rounded-full border px-3 py-[6px]"
                    style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
                  >
                    Best for {fabric.bestFor}
                  </span>
                  <span className="label" style={{ color: "var(--on-surface-soft)" }}>
                    {fabric.colourways.length} colourways in stock
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section
        className="border-t border-dashed px-5 py-10 text-center sm:px-8"
        style={{ borderColor: "var(--line-dashed)" }}
      >
        <p className="label" style={{ color: "var(--accent)" }}>
          Material and colour are separate choices
        </p>
        <h2 className="mx-auto mt-2 max-w-[24ch] text-[clamp(20px,2.8vw,30px)]">
          Pick the weave here. Choose the colour in the Loom.
        </h2>
        <p
          className="mx-auto mt-3 max-w-[52ch] text-[13.5px] leading-[1.7]"
          style={{ color: "var(--on-surface-soft)" }}
        >
          The Loom shows the two together before you commit, and lets you see the cloth under
          daylight, indoor bulbs and evening light, because a wine kaftan reads as three different
          garments across them.
        </p>
        <Link
          href="/loom"
          className="mt-6 inline-block rounded-sm px-6 py-[14px] text-[10.5px] font-medium uppercase tracking-[0.2em]"
          style={{ background: "var(--action)", color: "var(--on-action)" }}
        >
          Open the Loom
        </Link>
      </section>

      <SiteFooter />
    </div>
  );
}
