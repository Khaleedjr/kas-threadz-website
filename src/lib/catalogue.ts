/**
 * House catalogue.
 *
 * The design codes are the studio's real machine-file names. An order naming
 * LD 115 maps straight to the file the embroidery head runs. They are data,
 * never decoration, and are always set in mono.
 */

export type Garment = "kaftan" | "senator" | "jallabiya" | "agbada";

export type Piece = {
  slug: string;
  name: string;
  garment: Garment;
  /** house design code stitched on this piece */
  design: string;
  designNote: string;
  detail: string;
  fromPrice: number;
  leadDays: number;
  image: string;
  alt: string;
};

export const PIECES: Piece[] = [
  {
    slug: "onyx-and-gold",
    name: "Onyx & Gold",
    garment: "kaftan",
    design: "LD 184",
    designNote: "Flap & pocket set",
    detail: "Gold placket run finished with a crystal point.",
    fromPrice: 53000,
    leadDays: 14,
    image: "/img/work/kaftan-black.jpg",
    alt: "Black kaftan with a gold placket run and crystal point detail",
  },
  {
    slug: "maroon-tassel",
    name: "Maroon Tassel Jallab",
    garment: "jallabiya",
    design: "AF 63",
    designNote: "Neckline run",
    detail: "Cream scrollwork around the neck opening, gold cord tassel, matched cuffs.",
    fromPrice: 51000,
    leadDays: 14,
    image: "/img/work/jallab-maroon.jpg",
    alt: "Maroon jallabiya with cream scrollwork and a gold cord tassel",
  },
  {
    slug: "the-trader",
    name: "The Trader Agbada",
    garment: "agbada",
    design: "AGD 26",
    designNote: "Chest panel",
    detail: "Candlestick-chart panel, commissioned. Three pieces with matching cap.",
    fromPrice: 120000,
    leadDays: 21,
    image: "/img/work/agbada-maroon.jpg",
    alt: "Maroon agbada with a candlestick chart embroidered on the chest panel",
  },
  {
    slug: "slate-chain",
    name: "Slate Chain Kaftan",
    garment: "kaftan",
    design: "LD 108",
    designNote: "Flap & pocket set",
    detail: "Chain-link placket with a matched pocket frame.",
    fromPrice: 49000,
    leadDays: 14,
    image: "/img/work/kaftan-grey.jpg",
    alt: "Grey kaftan with chain-link placket embroidery",
  },
  {
    slug: "ivory-heritage",
    name: "Ivory Heritage Kaftan",
    garment: "kaftan",
    design: "LD 115",
    designNote: "Flap & pocket set",
    detail: "Cross-stitch placket and pocket frame in cocoa thread.",
    fromPrice: 47000,
    leadDays: 14,
    image: "/img/work/kaftan-cream.jpg",
    alt: "Cream kaftan with cocoa cross-stitch placket and pocket frame",
  },
  {
    slug: "royal-blue",
    name: "Royal Blue Agbada",
    garment: "agbada",
    design: "AGD 12",
    designNote: "Chest panel",
    detail: "Tonal chest panel with stone detailing across the yoke.",
    fromPrice: 120000,
    leadDays: 21,
    image: "/img/work/agbada-blue.jpg",
    alt: "Royal blue agbada with a tonal embroidered chest panel",
  },
];

/**
 * The design library. Every code is a real file on the studio's machine:
 * an order naming LD 115 maps straight to what the embroidery head runs.
 *
 * `family` mirrors how the studio files them, and each family belongs to a
 * placement the garment actually has. A kaftan takes a flap-and-pocket pair,
 * a jallabiya takes a run around the neck opening, an agbada takes a chest
 * panel. Placement is not a free choice; it is how these clothes are made.
 */
export type DesignFamily = "LD" | "AF" | "AGD";

export type Design = {
  code: string;
  family: DesignFamily;
  label: string;
  placement: string;
  garment: Garment;
  /** transparent PNG of the design, extracted from the machine file */
  image: string;
};

const LD_CODES = [51, 57, 58, 76, 84, 108, 109, 115, 160, 184, 192];
const AF_CODES = ["46", "47C", "47F", "48F", "54F", "56F", "58", "59", "61", "62", "63"];
const AGD_CODES = ["001", "002", "1", "2", "3", "4", "5", "6", "8", "9", "10",
  "11", "12", "15", "17", "18", "19", "20", "23", "25", "26"];

export const DESIGNS: Design[] = [
  ...LD_CODES.map((n): Design => ({
    code: `LD ${n}`,
    family: "LD",
    label: "Flap & pocket set",
    placement: "Placket & pocket",
    garment: "kaftan",
    image: `/img/designs/ld${n}f.png`,
  })),
  ...AF_CODES.map((n): Design => ({
    code: `AF ${n}`,
    family: "AF",
    label: "Neckline run",
    placement: "Neck opening & placket",
    garment: "jallabiya",
    image: `/img/designs/af${n.toLowerCase()}.png`,
  })),
  ...AGD_CODES.map((n): Design => ({
    code: `AGD ${n}`,
    family: "AGD",
    label: "Chest panel",
    placement: "Chest panel",
    garment: "agbada",
    image: `/img/designs/agd${n.toLowerCase()}.png`,
  })),
];

export const GARMENT_LABEL: Record<Garment, string> = {
  kaftan: "Kaftan",
  senator: "Senator",
  jallabiya: "Jallabiya",
  agbada: "Agbada",
};

export function naira(amount: number) {
  return "₦" + amount.toLocaleString("en-NG");
}
