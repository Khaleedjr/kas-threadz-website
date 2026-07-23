import Image from "next/image";
import Link from "next/link";
import { StitchedMark } from "@/components/stitched-mark";
import { RevealNav, ScrollCue, SiteFooter } from "@/components/site-chrome";
import { StudioSchema } from "@/components/structured-data";
import { PIECES, naira } from "@/lib/catalogue";

export default function Home() {
  const featured = PIECES.slice(0, 3);

  return (
    <div data-register="cloth" className="ground-cloth flex-1 flex flex-col text-[var(--on-surface)]">
      <StudioSchema />
      <RevealNav />

      {/* The mark gets the whole first screen. No nav competing with it, and
          nothing below the fold pulling the eye off it. */}
      {/* One centred block, so the mark and everything under it read as a single
          lockup instead of drifting apart on a tall screen. Only the cue is
          pinned to the foot. */}
      <section
        id="main"
        className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-[clamp(26px,5vh,96px)] text-center"
      >
        <StitchedMark className="h-auto w-full max-w-[min(640px,84vw)] max-h-[52dvh]" />

        <p className="mt-[clamp(4px,1vh,14px)] pl-[0.62em] text-[clamp(16px,2.3vw,28px)] font-medium tracking-[0.62em] text-[var(--color-thread)]">
          THREADZ
        </p>

        <p className="label mt-[clamp(18px,3.4vh,38px)]" style={{ color: "var(--on-surface-soft)" }}>
          Bespoke embroidery · Abuja · 55 machine files
        </p>

        <div className="mt-[clamp(12px,2.2vh,24px)] flex flex-wrap justify-center gap-3">
          <Link
            href="/loom"
            className="rounded-sm px-6 py-[14px] text-[10.5px] font-medium uppercase tracking-[0.2em]"
            style={{ background: "var(--action)", color: "var(--on-action)" }}
          >
            Commission a piece
          </Link>
          <Link
            href="/collection"
            className="rounded-sm border px-6 py-[14px] text-[10.5px] font-medium uppercase tracking-[0.2em]"
            style={{ borderColor: "var(--line-dashed)", color: "var(--on-surface)" }}
          >
            See the collection
          </Link>
        </div>

        <div className="absolute inset-x-0 bottom-[clamp(16px,3vh,40px)] flex justify-center">
          <ScrollCue />
        </div>
      </section>

      <section className="px-8 py-12">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="text-[19px]">The Collection</h2>
          <Link href="/collection" className="label opacity-80 hover:opacity-100">
            All pieces →
          </Link>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((piece, index) => (
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
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-[rgba(8,11,15,0.92)] via-[rgba(8,11,15,0.6)] to-transparent px-4 pb-3 pt-14">
                  <div>
                    <p className="font-display text-[14px] font-semibold">{piece.name}</p>
                    <p className="mt-[2px] font-mono text-[9px] tracking-[0.14em] text-[var(--color-thread-dim)]">
                      {piece.design}
                    </p>
                  </div>
                  <p className="price whitespace-nowrap text-[13px]">{naira(piece.fromPrice)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid border-t border-[var(--line)] md:grid-cols-[0.85fr_1.15fr]">
        <div className="relative min-h-[250px]">
          <Image
            src="/img/work/kaftan-grey-side.jpg"
            alt="Grey kaftan photographed from the side on a stand"
            fill
            sizes="(max-width: 768px) 100vw, 40vw"
            className="object-cover object-top"
          />
        </div>
        <div className="flex flex-col items-start justify-center px-8 py-10">
          <p className="label" style={{ color: "var(--accent)" }}>
            The Loom
          </p>
          <h2 className="mt-2 mb-3 text-[25px]">Build it before we cut it.</h2>
          <p
            className="max-w-[46ch] text-[14px] leading-[1.72]"
            style={{ color: "var(--on-surface-soft)" }}
          >
            Fabric, colour, embroidery, measurements. The piece updates as you choose and the
            estimate never hides.
          </p>
          <ul className="my-4 flex flex-wrap gap-2">
            {["01 Fabric", "02 Colour", "03 Embroidery", "04 Measure", "05 Send"].map((step, i) => (
              <li
                key={step}
                className="label rounded-full border px-[10px] py-[5px]"
                style={{
                  borderColor: i === 0 ? "var(--color-thread-dim)" : "var(--line-dashed)",
                  color: i === 0 ? "var(--on-surface)" : "var(--on-surface-soft)",
                }}
              >
                {step}
              </li>
            ))}
          </ul>
          <Link
            href="/loom"
            className="rounded-sm px-6 py-[14px] text-[10.5px] font-medium uppercase tracking-[0.2em]"
            style={{ background: "var(--action)", color: "var(--on-action)" }}
          >
            Open the Loom
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
