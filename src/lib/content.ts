/*
 * The site's editable content, read from Sanity: the Loom's colours and
 * fabrics, the preorder's prices and set counts, and the photographs.
 *
 * Read on the server and kept for a minute, so an edit published in the
 * studio is on the site within about a minute. Anything missing, malformed
 * or unreachable falls back to the defaults in `content-defaults.ts`, so the
 * site never loses its colours or its prices to a bad edit or an outage.
 *
 * Server only.
 */

import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId, sanityConnected } from "@/sanity/env";
import { DEFAULT_CATALOGUE, type Catalogue, type Colour, type LoomFabric, type Photo } from "./content-defaults";

/** How long a read is kept before Sanity is asked again, in seconds. */
const FRESH_FOR = 60;

const client = sanityConnected
  ? createClient({ projectId, dataset, apiVersion, useCdn: false, perspective: "published" })
  : null;

const QUERY = `{
  "colours": *[_type == "colour" && available != false] | order(coalesce(position, 9999) asc, name asc) { name, hex },
  "fabrics": *[_type == "fabric" && available != false] | order(coalesce(position, 9999) asc, name asc) {
    "id": key.current, name, character, finish
  },
  "terms": *[_id == "preorderSettings"][0] { adultPrice, adultSets, childrenPrice, childrenSets },
  "photos": *[_id == "sitePhotos"][0] {
    "homeLoom": homeLoom { "url": asset->url, alt },
    "atelier": atelier { "url": asset->url, alt },
    "pieces": pieces[] { piece, "url": photo.asset->url, "alt": photo.alt }
  }
}`;

type Raw = {
  colours?: Array<{ name?: string; hex?: string }>;
  fabrics?: Array<{ id?: string; name?: string; character?: string; finish?: string }>;
  terms?: { adultPrice?: number; adultSets?: number; childrenPrice?: number; childrenSets?: number } | null;
  photos?: {
    homeLoom?: { url?: string; alt?: string } | null;
    atelier?: { url?: string; alt?: string } | null;
    pieces?: Array<{ piece?: string; url?: string; alt?: string }> | null;
  } | null;
};

const HEX = /^#[0-9a-fA-F]{6}$/;
const count = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n >= 0;

function photoOf(p?: { url?: string; alt?: string } | null): Photo | null {
  return p?.url ? { url: p.url, alt: p.alt ?? "" } : null;
}

/** Sanity's answer, checked field by field; whatever does not pass keeps its default. */
function shape(raw: Raw): Catalogue {
  const d = DEFAULT_CATALOGUE;

  const colours: Colour[] = (raw.colours ?? [])
    .filter((c) => c.name && c.hex && HEX.test(c.hex))
    .map((c) => ({ name: c.name!, hex: c.hex!.toLowerCase() }));

  const fabrics: LoomFabric[] = (raw.fabrics ?? [])
    .filter((f) => f.id && f.name)
    .map((f) => ({
      id: f.id!,
      name: f.name!,
      character: f.character ?? "",
      add: 0,
      finish: f.finish === "sheen" ? "sheen" : "matte",
    }));

  const t = raw.terms;
  const terms = {
    adult: {
      ...d.terms.adult,
      price: count(t?.adultPrice) && t.adultPrice > 0 ? t.adultPrice : d.terms.adult.price,
      total: count(t?.adultSets) ? t.adultSets : d.terms.adult.total,
    },
    children: {
      ...d.terms.children,
      price: count(t?.childrenPrice) && t.childrenPrice > 0 ? t.childrenPrice : d.terms.children.price,
      total: count(t?.childrenSets) ? t.childrenSets : d.terms.children.total,
    },
  };

  const pieces: Record<string, Photo> = {};
  for (const p of raw.photos?.pieces ?? []) {
    const photo = photoOf(p);
    if (p.piece && photo) pieces[p.piece] = photo;
  }

  return {
    // an emptied list would leave the Loom with nothing to offer: keep the defaults
    colours: colours.length ? colours : d.colours,
    fabrics: fabrics.length ? fabrics : d.fabrics,
    terms,
    photos: {
      homeLoom: photoOf(raw.photos?.homeLoom),
      atelier: photoOf(raw.photos?.atelier),
      pieces,
    },
  };
}

/** The content as it stands, or the defaults when Sanity is not connected or not answering. */
export async function getCatalogue(): Promise<Catalogue> {
  if (!client) return DEFAULT_CATALOGUE;
  try {
    const raw = await client.fetch<Raw>(QUERY, {}, { next: { revalidate: FRESH_FOR, tags: ["content"] } });
    return shape(raw ?? {});
  } catch (err) {
    console.error("Sanity could not be read; using the built-in content.", err);
    return DEFAULT_CATALOGUE;
  }
}
