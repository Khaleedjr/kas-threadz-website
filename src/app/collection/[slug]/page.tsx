import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteFooter, SiteNav } from "@/components/site-chrome";
import { PieceSchema } from "@/components/structured-data";
import { GARMENT_LABEL, PIECES, naira } from "@/lib/catalogue";

export function generateStaticParams() {
  return PIECES.map((piece) => ({ slug: piece.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const piece = PIECES.find((p) => p.slug === slug);
  if (!piece) return { title: "Not found" };
  return {
    title: piece.name,
    description: `${piece.detail} Stitched with ${piece.design}. From ${naira(piece.fromPrice)}.`,
  };
}

export default async function PiecePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const index = PIECES.findIndex((p) => p.slug === slug);
  if (index === -1) notFound();

  const piece = PIECES[index];
  const prev = PIECES[(index - 1 + PIECES.length) % PIECES.length];
  const next = PIECES[(index + 1) % PIECES.length];

  return (
    /* One piece, one screen. The stage takes whatever height is left over and
       the photograph fits inside it rather than dictating the page. */
    <div
      data-register="cloth"
      className="ground-cloth flex h-dvh flex-col overflow-hidden text-[var(--on-surface)]"
    >
      <PieceSchema slug={piece.slug} />
      <SiteNav />

      <section
        id="main"
        className="relative flex min-h-0 flex-1 flex-col items-center px-6 py-[clamp(8px,1.6vh,18px)] text-center"
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(52% 46% at 50% 42%, var(--color-cloth-raised) 0%, transparent 74%)",
          }}
        />

        <p className="label relative shrink-0" style={{ color: "var(--on-surface-soft)" }}>
          Nº {String(index + 1).padStart(2, "0")} / {String(PIECES.length).padStart(2, "0")} ·{" "}
          {GARMENT_LABEL[piece.garment]}
        </p>

        <div className="relative mt-[clamp(8px,2vh,22px)] min-h-0 w-full flex-1">
          <Image
            src={piece.image}
            alt={piece.alt}
            fill
            priority
            sizes="(max-width: 768px) 90vw, 40vw"
            className="rounded-sm object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.7)]"
          />
        </div>

        <div className="relative shrink-0 pt-[clamp(8px,1.6vh,16px)]">
          <h1 className="text-[clamp(18px,2.2vw,24px)]">{piece.name}</h1>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-thread-dim)]">
            {piece.design} · {piece.designNote}
          </p>
          <p
            className="mx-auto mt-2 max-w-[46ch] text-[12.5px]"
            style={{ color: "var(--on-surface-soft)" }}
          >
            {piece.detail}
          </p>
          <p className="mt-2 text-[11px]" style={{ color: "var(--on-surface-soft)" }}>
            from <span className="price text-[15px]">{naira(piece.fromPrice)}</span>
            <span className="mx-2 opacity-50">·</span>
            <span className="price text-[12px]">{piece.leadDays} days</span>
            <span className="mx-2 opacity-50">·</span>
            <span className="price text-[12px]">50% deposit</span>
          </p>

          <div className="mt-[clamp(8px,1.6vh,18px)] flex flex-wrap justify-center gap-3">
            <Link
              href="/loom"
              className="rounded-sm px-6 py-[13px] text-[10.5px] font-medium uppercase tracking-[0.2em]"
              style={{ background: "var(--action)", color: "var(--on-action)" }}
            >
              Commission this piece
            </Link>
            <Link
              href="/library"
              className="rounded-sm border px-6 py-[13px] text-[10.5px] font-medium uppercase tracking-[0.2em]"
              style={{ borderColor: "var(--line-dashed)", color: "var(--on-surface)" }}
            >
              See {piece.design} in the library
            </Link>
          </div>
        </div>

        <nav className="relative mt-[clamp(8px,1.4vh,18px)] flex w-full max-w-[720px] shrink-0 justify-between gap-6">
          <Link href={`/collection/${prev.slug}`} className="label opacity-70 hover:opacity-100">
            ← {prev.name}
          </Link>
          <Link href={`/collection/${next.slug}`} className="label opacity-70 hover:opacity-100">
            {next.name} →
          </Link>
        </nav>
      </section>

      <SiteFooter />
    </div>
  );
}
