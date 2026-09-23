/*
 * Fills a new Sanity project with the site's content as it stands today: the
 * Loom's colours and fabrics and the preorder's prices and set counts, so
 * the studio starts from what is live rather than from nothing.
 *
 * Run it once, after the project exists:
 *
 *   node scripts/seed-sanity.mjs
 *
 * It reads NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET and
 * SANITY_API_WRITE_TOKEN from .env.local. The token needs Editor rights;
 * delete it in Sanity once this has run. Running it again only fills in what
 * is missing: nothing the studio has edited is overwritten.
 */

import { readFileSync } from "node:fs";
import { createClient } from "@sanity/client";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")]),
);

const projectId = env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const token = env.SANITY_API_WRITE_TOKEN;
if (!projectId || !token) {
  console.error("Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_WRITE_TOKEN in .env.local first.");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token,
  useCdn: false,
});

// the same values as src/lib/loom.ts and src/lib/preorder.ts
const COLOURS = [
  ["#f4f3ef", "White"], ["#1b1819", "Black"], ["#5a3d29", "Brown"], ["#cbb188", "Carton"],
  ["#5b1a22", "Maroon"], ["#22314e", "Navy Blue"], ["#8fbadd", "Sky Blue"], ["#4a4b4f", "Dark Ash"],
  ["#b6bbc1", "Silver"], ["#6a4a33", "Coffee Brown"], ["#4b5334", "Army Green"],
];
const FABRICS = [
  ["cotton", "Cotton", "Matte and breathable. The everyday cloth that wears all day.", "matte"],
  ["silk", "Silk", "A soft sheen that lifts the colour. The one for an occasion.", "sheen"],
];

const tx = client.transaction();
COLOURS.forEach(([hex, name], i) =>
  tx.createIfNotExists({ _id: `colour-${hex.slice(1)}`, _type: "colour", name, hex, available: true, position: i + 1 }),
);
FABRICS.forEach(([key, name, character, finish], i) =>
  tx.createIfNotExists({
    _id: `fabric-${key}`,
    _type: "fabric",
    name,
    key: { _type: "slug", current: key },
    character,
    finish,
    available: true,
    position: i + 1,
  }),
);
tx.createIfNotExists({
  _id: "preorderSettings",
  _type: "preorderSettings",
  adultPrice: 15000,
  adultSets: 70,
  childrenPrice: 12000,
  childrenSets: 30,
});
tx.createIfNotExists({ _id: "sitePhotos", _type: "sitePhotos" });

await tx.commit();
console.log("Sanity now holds the site's colours, fabrics, prices and set counts.");
