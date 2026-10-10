import Image from "next/image";
import Link from "next/link";
import { StitchedMark } from "@/components/stitched-mark";
import { RevealNav, ScrollCue, SiteFooter } from "@/components/site-chrome";
import { StudioSchema } from "@/components/structured-data";
import { NECKLINES, naira } from "@/lib/catalogue";
import { getCatalogue } from "@/lib/content";
import { drawnFabric } from "@/lib/content-defaults";
import { FEATURED } from "@/lib/featured-builds";
import { FLAT_RATIO, LENGTH_RANGE, buildJallabiyaFlat } from "@/lib/jallabiya-flat";

export default async function Home() {
  const { photos, pieces, colours, fabrics, terms } = await getCatalogue();

  /* A few finished jallabiyas, drawn as Design Yours draws them, in the cloth
     it opens on. Drawn here on the server, so they arrive with the page. */
  const cloth = fabrics.find((f) => f.id === "cotton" && !f.soon) ?? fabrics.find((f) => !f.soon) ?? fabrics[0];
  const builds = FEATURED.flatMap((b) => {
    const colour = colours.find((c) => c.hex === b.colour);
    const design = NECKLINES.find((n) => n.code === b.design);
    if (!colour || !design) return [];
    const drawing = buildJallabiyaFlat({
      color: colour.hex,
      fabric: drawnFabric(cloth).id,
      neckline: design.image,
      length: LENGTH_RANGE.standard,
      sleeves: true,
      tassel: true,
      variant: `home-${b.slug}`,
    });
    return [{ slug: b.slug, name: design.name, colour: colour.name, drawing }];
  });

  return (
    <div data-register="cloth" className="ground-cloth flex-1 flex flex-col text-[var(--on-surface)]">
      <StudioSchema pieces={pieces} />
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
          Custom embroidery · Abuja
        </p>

        <div className="mt-[clamp(12px,2.2vh,24px)] flex flex-wrap justify-center gap-3">
          <Link
            href="/loom"
            className="rounded-sm px-6 py-[14px] text-[10.5px] font-medium uppercase tracking-[0.2em]"
            style={{ background: "var(--action)", color: "var(--on-action)" }}
          >
            Design yours
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

      <section className="mx-auto w-full max-w-[calc(680px+2*clamp(16px,4vw,32px))] px-[clamp(16px,4vw,32px)] py-12">
        <div className="mb-5 flex items-baseline justify-between gap-4">
          <h2 className="text-[19px]">The Jallabiya</h2>
          <Link href="/loom" className="label opacity-80 hover:opacity-100">
            Design yours →
          </Link>
        </div>

        {/* each opens Design Yours already set to it */}
        <ul className="grid grid-cols-2 gap-[clamp(10px,2vw,16px)]">
          {builds.map((b) => (
            <li key={b.slug}>
              {/* on the home page's own cloth, with a pool of light behind the garment so a dark one still reads */}
              <Link
                href={`/loom/${b.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-sm border transition-colors hover:border-[var(--line-dashed)]"
                style={{
                  borderColor: "var(--line)",
                  background: "radial-gradient(70% 52% at 50% 40%, rgba(244, 239, 227, 0.085), rgba(244, 239, 227, 0) 72%)",
                }}
                aria-label={`${b.name} in ${b.colour}: open it in Design Yours`}
              >
                <div className="px-[10%] pt-[clamp(12px,2vw,20px)] pb-2">
                  <div
                    className="garment-stage transition-transform duration-700 ease-[var(--ease-thread)] group-hover:scale-[1.03]"
                    style={{ aspectRatio: FLAT_RATIO }}
                    dangerouslySetInnerHTML={{ __html: b.drawing }}
                  />
                </div>
                <div className="@container mt-auto border-t px-[clamp(10px,1.6vw,16px)] py-3" style={{ borderColor: "var(--line)" }}>
                  {/* side by side when the card has room for both, else the price under the name, the same on every card */}
                  <div className="flex flex-col @min-[170px]:flex-row @min-[170px]:items-baseline @min-[170px]:justify-between @min-[170px]:gap-2">
                    <p className="whitespace-nowrap font-display text-[14px] font-semibold">{b.name}</p>
                    <p className="price whitespace-nowrap text-[13px]">{naira(terms.adult.price)}</p>
                  </div>
                  <p className="mt-[3px] font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--color-thread-dim)]">
                    {b.colour} {cloth.name.toLowerCase()}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid border-t border-[var(--line)] md:grid-cols-[0.85fr_1.15fr]">
        <div className="relative min-h-[250px]">
          <Image
            src={photos.homeLoom?.url ?? "/img/work/kaftan-grey-side.jpg"}
            alt={photos.homeLoom?.alt ?? "Grey kaftan photographed from the side on a stand"}
            fill
            sizes="(max-width: 768px) 100vw, 40vw"
            className="object-cover object-top"
          />
        </div>
        <div className="flex flex-col items-start justify-center px-8 py-10">
          <p className="label" style={{ color: "var(--accent)" }}>
            Design Yours
          </p>
          <h2 className="mt-2 mb-3 text-[25px]">See it before we sew it.</h2>
          <p
            className="max-w-[46ch] text-[14px] leading-[1.72]"
            style={{ color: "var(--on-surface-soft)" }}
          >
            Fabric, colour, embroidery, measurements. The picture changes as you choose, and the
            price is always shown.
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
            Start designing
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
