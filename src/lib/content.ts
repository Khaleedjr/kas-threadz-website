/*
 * The content the studio edits in its dashboard: the Loom's colours and
 * fabrics, the preorder's prices and set counts, the collection and the
 * photographs. Kept in the database as one document.
 *
 * Pages read it through a cache, and every save clears that cache, so an
 * edit is on the site at the next page load. Whatever is missing or
 * malformed falls back to the defaults, so the site never loses its colours
 * or its prices to a bad edit.
 *
 * Server only.
 */

import { unstable_cache } from "next/cache";
import { GARMENT_LABEL, type Garment } from "./catalogue";
import { DEFAULT_CATALOGUE, type Catalogue, type Photo } from "./content-defaults";
import { memoryAllowed, redis } from "./redis";

const KEY = "content:catalogue";
/** The cache tag every read carries and every save clears. */
export const CONTENT_TAG = "content";

const HEX = /^#[0-9a-f]{6}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const GARMENTS = Object.keys(GARMENT_LABEL) as Garment[];

const text = (v: unknown, max = 400) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const whole = (v: unknown, min = 0) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isInteger(n) && n >= min ? n : null;
};
const photo = (v: unknown): Photo | null => {
  const p = v as Partial<Photo> | null;
  return p && typeof p.url === "string" && p.url ? { url: p.url, alt: text(p.alt, 200) } : null;
};

/** A stored document, checked field by field. Whatever does not pass keeps its default. */
export function normalise(raw: unknown): Catalogue {
  const r = (raw ?? {}) as Partial<Record<keyof Catalogue, unknown>>;
  const d = DEFAULT_CATALOGUE;

  const colours = Array.isArray(r.colours)
    ? r.colours
        .map((c) => ({ name: text(c?.name, 40), hex: text(c?.hex, 7).toLowerCase(), hidden: Boolean(c?.hidden) }))
        .filter((c) => c.name && HEX.test(c.hex))
    : d.colours;

  const fabrics = Array.isArray(r.fabrics)
    ? r.fabrics
        .map((f) => ({
          id: text(f?.id, 40),
          name: text(f?.name, 40),
          character: text(f?.character, 120),
          add: 0,
          finish: f?.finish === "sheen" ? ("sheen" as const) : ("matte" as const),
          hidden: Boolean(f?.hidden),
        }))
        .filter((f) => f.name && SLUG.test(f.id))
    : d.fabrics;

  const t = (r.terms ?? {}) as Partial<Catalogue["terms"]>;
  const tier = (k: keyof Catalogue["terms"]) => ({
    name: d.terms[k].name,
    price: whole(t[k]?.price, 100) ?? d.terms[k].price,
    total: whole(t[k]?.total) ?? d.terms[k].total,
  });

  const p = (r.preorder ?? {}) as Partial<Catalogue["preorder"]>;

  const pieces = Array.isArray(r.pieces)
    ? r.pieces
        .map((x) => ({
          slug: text(x?.slug, 60),
          name: text(x?.name, 60),
          garment: GARMENTS.includes(x?.garment) ? (x.garment as Garment) : "kaftan",
          design: text(x?.design, 30),
          designNote: text(x?.designNote, 80),
          detail: text(x?.detail, 400),
          fromPrice: whole(x?.fromPrice, 0) ?? 0,
          leadDays: whole(x?.leadDays, 1) ?? 14,
          image: text(x?.image, 500),
          alt: text(x?.alt, 200),
          hidden: Boolean(x?.hidden),
        }))
        .filter((x) => SLUG.test(x.slug) && x.name && x.image)
    : d.pieces;

  const ph = (r.photos ?? {}) as Partial<Record<keyof Catalogue["photos"], unknown>>;

  return {
    // an emptied list would leave the Loom with nothing to offer: keep the defaults
    colours: colours.length ? colours : d.colours,
    fabrics: fabrics.length ? fabrics : d.fabrics,
    terms: { adult: tier("adult"), children: tier("children") },
    preorder: {
      open: typeof p.open === "boolean" ? p.open : d.preorder.open,
      description: typeof p.description === "string" ? text(p.description, 300) : d.preorder.description,
    },
    pieces,
    photos: { homeLoom: photo(ph.homeLoom), atelier: photo(ph.atelier) },
  };
}

/* on this machine without a database, edits are kept in memory */
const memory = globalThis as unknown as { __kasContent?: unknown };

async function readStored(): Promise<unknown> {
  const db = redis();
  if (db) {
    const v = await db.get<unknown>(KEY);
    return typeof v === "string" ? JSON.parse(v) : v;
  }
  return memoryAllowed() ? (memory.__kasContent ?? null) : null;
}

/** Everything the studio has set, hidden things included: for the dashboard. Never cached. */
export async function getContent(): Promise<Catalogue> {
  try {
    return normalise(await readStored());
  } catch (err) {
    console.error("The content could not be read; using the built-in content.", err);
    return DEFAULT_CATALOGUE;
  }
}

/** What the site offers: the content with everything hidden taken out. */
export const getCatalogue = unstable_cache(
  async (): Promise<Catalogue> => {
    const all = await getContent();
    const colours = all.colours.filter((c) => !c.hidden);
    const fabrics = all.fabrics.filter((f) => !f.hidden);
    return {
      ...all,
      colours: colours.length ? colours : DEFAULT_CATALOGUE.colours,
      fabrics: fabrics.length ? fabrics : DEFAULT_CATALOGUE.fabrics,
      pieces: all.pieces.filter((x) => !x.hidden),
    };
  },
  ["catalogue"],
  { tags: [CONTENT_TAG], revalidate: 600 },
);

/**
 * Save part of the content. The caller clears the cache (`updateTag`), which
 * only a server action may do.
 */
export async function saveContent(change: Partial<Catalogue>): Promise<Catalogue> {
  const next = normalise({ ...(await getContent()), ...change });
  const db = redis();
  if (db) await db.set(KEY, JSON.stringify(next));
  else if (memoryAllowed()) memory.__kasContent = next;
  else throw new Error("No database is connected.");
  return next;
}
