import Image from "next/image";
import Link from "next/link";
import { GARMENT_LABEL, naira } from "@/lib/catalogue";
import { getContent } from "@/lib/content";
import { requireStudio } from "@/lib/studio-auth";
import { movePiece } from "../actions";
import { ButtonLink, PageHead, Panel, Saved } from "../ui";

export const metadata = { title: "Products" };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireStudio();
  const sp = await searchParams;
  const cat = await getContent();

  return (
    <>
      <PageHead title="Products" note="Everything the site sells: the jallabiya preorder, and the made-to-order pieces in the collection.">
        <ButtonLink href="/studio/products/new" solid>
          Add a piece
        </ButtonLink>
      </PageHead>
      <Saved show={sp.saved === "1"} />
      <Saved show={sp.deleted === "1"}>Deleted. It is off the site from the next page load.</Saved>

      <Panel title="Preorder" className="mb-3">
        <Link href="/studio/products/jallabiya" className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="min-w-0">
            <p className="text-[16px] font-medium">Jallabiya, built in the Loom</p>
            <p className="mt-1 text-[13px] leading-relaxed" style={{ color: "var(--on-surface-soft)" }}>
              Adult {naira(cat.terms.adult.price)} · {cat.terms.adult.total} sets &nbsp;·&nbsp; Children{" "}
              {naira(cat.terms.children.price)} · {cat.terms.children.total} sets &nbsp;·&nbsp;{" "}
              {cat.colours.filter((c) => !c.hidden).length} colours · {cat.fabrics.filter((f) => !f.hidden).length} fabrics
            </p>
          </div>
          <span className="label" style={{ color: cat.preorder.open ? "var(--accent)" : "var(--on-surface-soft)" }}>
            {cat.preorder.open ? "Open" : "Closed"} · Edit
          </span>
        </Link>
      </Panel>

      <Panel title={`Collection · ${cat.pieces.length} pieces`}>
        {cat.pieces.length === 0 ? (
          <p className="text-[13px]" style={{ color: "var(--on-surface-soft)" }}>
            The collection is empty. Add a piece to show it on the site.
          </p>
        ) : (
          <ul className="grid">
            {cat.pieces.map((p, i) => (
              <li key={p.slug} className="grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-3 border-t py-3 first:border-t-0" style={{ borderColor: "var(--line)" }}>
                <span className="relative block aspect-[4/5] w-[56px] overflow-hidden rounded-[2px]" style={{ background: "var(--line)" }}>
                  <Image src={p.image} alt="" fill unoptimized sizes="56px" className="object-cover" />
                </span>
                <Link href={`/studio/products/${p.slug}`} className="min-w-0">
                  <span className="block truncate text-[15px] font-medium">
                    {p.name}
                    {p.hidden && (
                      <span className="label ml-2" style={{ color: "var(--on-surface-soft)" }}>
                        hidden
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block truncate text-[13px]" style={{ color: "var(--on-surface-soft)" }}>
                    {GARMENT_LABEL[p.garment]} · <span className="code">{p.design}</span> · from {naira(p.fromPrice)} · {p.leadDays} days
                  </span>
                </Link>
                <div className="flex items-center gap-1">
                  <form action={movePiece.bind(null, p.slug, -1)}>
                    <button type="submit" disabled={i === 0} aria-label={`Move ${p.name} up`} className="grid h-8 w-8 place-items-center rounded-sm border font-mono disabled:opacity-30" style={{ borderColor: "var(--line-dashed)" }}>
                      &uarr;
                    </button>
                  </form>
                  <form action={movePiece.bind(null, p.slug, 1)}>
                    <button type="submit" disabled={i === cat.pieces.length - 1} aria-label={`Move ${p.name} down`} className="grid h-8 w-8 place-items-center rounded-sm border font-mono disabled:opacity-30" style={{ borderColor: "var(--line-dashed)" }}>
                      &darr;
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-[12px] leading-snug" style={{ color: "var(--on-surface-soft)" }}>
          The first three pieces are the ones on the home page.
        </p>
      </Panel>
    </>
  );
}
