/**
 * The Loom's configuration.
 *
 * This object is the whole point: it is what the customer built, what the
 * estimate is calculated from, and what the studio receives. It says nothing
 * about how it is drawn. Today a 2D preview renders it; when the showroom is
 * built a 3D renderer will take the same object unchanged.
 */

import type { Garment } from "./catalogue";

export type LoomConfig = {
  garment: Garment;
  fabric: string;
  colour: string;
  design: string | null;
  /** the thread the design is run in: "original" keeps the design's own colours */
  thread: string;
  measurements: Measurements;
};

export type Measurements = {
  /** the standard length, in inches. Jallabiya runs 54 to 62. */
  height?: number;
  fit: "regular" | "slim" | "relaxed";
};

export type Fabric = {
  id: string;
  name: string;
  /** one line, for the Loom where space is tight */
  character: string;
  /** what this cloth adds to the base price */
  add: number;
};

/* Two cloths for now. The fuller material library is coming back later, so
   the fabrics page is held on a coming-soon note in the meantime. */
export const FABRICS: Fabric[] = [
  {
    id: "cotton",
    name: "Cotton",
    character: "Matte and breathable. The everyday cloth that wears all day.",
    add: 0,
  },
  {
    id: "silk",
    name: "Silk",
    character: "A soft sheen that lifts the colour. The one for an occasion.",
    add: 15000,
  },
];

export const COLOURS: Array<{ hex: string; name: string }> = [
  { hex: "#f4f3ef", name: "White" },
  { hex: "#1b1819", name: "Black" },
  { hex: "#5a3d29", name: "Brown" },
  { hex: "#cbb188", name: "Carton" },
  { hex: "#5b1a22", name: "Maroon" },
  { hex: "#22314e", name: "Navy Blue" },
  { hex: "#8fbadd", name: "Sky Blue" },
  { hex: "#4a4b4f", name: "Dark Ash" },
  { hex: "#b6bbc1", name: "Silver" },
  { hex: "#6a4a33", name: "Coffee Brown" },
  { hex: "#4b5334", name: "Army Green" },
];

export const GARMENT_BASE: Record<Garment, number> = {
  senator: 25000,
  kaftan: 35000,
  jallabiya: 45000,
  agbada: 120000,
};

export const EMBROIDERY_ADD = 15000;

export function estimate(config: LoomConfig): number {
  const fabric = FABRICS.find((f) => f.id === config.fabric);
  return (
    GARMENT_BASE[config.garment] +
    (fabric?.add ?? 0) +
    (config.design ? EMBROIDERY_ADD : 0)
  );
}
