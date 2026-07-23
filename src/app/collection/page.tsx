import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { SiteFooter, SiteNav } from "@/components/site-chrome";
import { GARMENT_LABEL, PIECES, naira } from "@/lib/catalogue";

export const metadata: Metadata = {
  title: "The Collection",
  description:
    "Kaftan, jallabiya and agbada pieces from the Abuja atelier, each with the house design code it is stitched from.",
};

export default function CollectionPage() {
  return (
    <div data-register="cloth" className="ground-cloth flex-1 flex flex-col text-[var(--on-surface)]">
      <SiteNav />

      <section id="main" className="px-8 pt-12 pb-6">
        <p className="label" style={{ color: "var(--accent)" }}>
          {PIECES.length} pieces
        </p>
        <h1 className="mt-2 text-[clamp(28px,4vw,42px)]">The Collection</h1>
        <p className="mt-3 max-w-[52ch] text-[14px] leading-[1.72]" style={{ color: "var(--on-surface-soft)" }}>
          Every piece is cut to measure and stitched from the house library. The code under each
          name is the machine file it is embroidered with.
        </p>
      </section>

      <section className="px-8 pb-14">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PIECES.map((piece, index) => (
            <li key={piece.slug}>
              <Link
                href={`/collection/${piece.slug}`}
                className="group relative block aspect-[3/4] overflow-hidden rounded-sm bg-[var(--color-cloth-deep)]"
              >
                <Image
                  src={piece.image}
                  alt={piece.alt}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover object-top transition-transform duration-700 ease-[var(--ease-thread)] group-hover:scale-[1.04]"
                />
                <span className="chip-over-photo absolute left-4 top-4 rounded-full px-[11px] py-[5px]">
                  {GARMENT_LABEL[piece.garment]}
                </span>
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-[rgba(8,11,15,0.92)] via-[rgba(8,11,15,0.6)] to-transparent px-4 pb-3 pt-14">
                  <div>
                    <p className="font-display text-[15px] font-semibold">{piece.name}</p>
                    <p className="mt-[2px] font-mono text-[9px] tracking-[0.14em] text-[var(--color-thread-dim)]">
                      {piece.design} · {piece.designNote}
                    </p>
                  </div>
                  <p className="price whitespace-nowrap text-[13px]">{naira(piece.fromPrice)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <SiteFooter />
    </div>
  );
}
