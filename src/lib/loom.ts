/**
 * The Loom's configuration.
 *
 * This object is the whole point: it is what the customer built, what the
 * estimate is calculated from, and what the studio receives. It says nothing
 * about how it is drawn. Today a 2D preview renders it; when the showroom is
 * built a 3D renderer will take the same object unchanged.
 */

import type { Garment } from "./catalogue";

export type LightingKey = "daylight" | "tungsten" | "evening";

export type LoomConfig = {
  garment: Garment;
  fabric: string;
  colour: string;
  design: string | null;
  measurements: Measurements;
};

export type Measurements = {
  chest?: number;
  shoulder?: number;
  sleeve?: number;
  length?: number;
  neck?: number;
  fit: "regular" | "slim" | "relaxed";
};

export type Fabric = {
  id: string;
  name: string;
  house: string;
  character: string;
  add: number;
  swatch: string;
};

export const FABRICS: Fabric[] = [
  { id: "sevenstar", name: "Seven Star", house: "Florence · Wool Premium", character: "Smooth solid wool. The one to pick when the embroidery is the point.", add: 18000, swatch: "/img/fabrics/seven-royal.jpg" },
  { id: "focus", name: "Focus", house: "Florence · Wool Premium", character: "Tonal satin stripe that catches light rather than colour.", add: 15000, swatch: "/img/fabrics/focus-navy.jpg" },
  { id: "properstripes", name: "Proper Stripes", house: "Premium Stripe", character: "Bold pinstripe with real spacing. Carries a room on its own.", add: 14000, swatch: "/img/fabrics/proper-charcoal.jpg" },
  { id: "express", name: "Express", house: "Noble Thinker", character: "Fine pinstripe with a dry, crisp hand.", add: 12000, swatch: "/img/fabrics/express-beige.jpg" },
  { id: "noblethinker", name: "Noble Thinker", house: "Elegance Beyond Time", character: "Everyday fine stripe. Drapes easily, resists creasing.", add: 10000, swatch: "/img/fabrics/noble-tan.jpg" },
];

export const COLOURS: Array<{ hex: string; name: string }> = [
  { hex: "#20364f", name: "Navy" },
  { hex: "#2f4a3d", name: "Emerald" },
  { hex: "#4a3728", name: "Chocolate" },
  { hex: "#1a1518", name: "Black" },
  { hex: "#e9e2d6", name: "Cream" },
  { hex: "#521218", name: "Burgundy" },
  { hex: "#5a5560", name: "Slate" },
  { hex: "#b99a6b", name: "Gold" },
];

/**
 * Preview photography per garment. Until there are renders for every colour,
 * the preview at least has to be the garment you actually chose.
 */
export const GARMENT_PREVIEW: Record<Garment, { src: string; alt: string }> = {
  kaftan: { src: "/img/work/kaftan-grey-side.jpg", alt: "Kaftan on the stand, side view" },
  senator: { src: "/img/work/kaftan-blue.jpg", alt: "Senator tunic, front view" },
  jallabiya: { src: "/img/work/jallab-maroon.jpg", alt: "Jallabiya with tasselled placket" },
  agbada: { src: "/img/work/agbada-blue.jpg", alt: "Agbada with embroidered chest panel" },
};

export const GARMENT_BASE: Record<Garment, number> = {
  senator: 25000,
  kaftan: 35000,
  jallabiya: 45000,
  agbada: 120000,
};

export const EMBROIDERY_ADD = 15000;

/**
 * Cloth changes character with the light it is under, and that is the single
 * biggest reason people hesitate to buy fabric they cannot touch. Each option
 * is a filter applied to the preview, not a different photograph.
 */
export const LIGHTING: Record<LightingKey, { label: string; note: string; filter: string }> = {
  daylight: {
    label: "Daylight",
    note: "Midday, outdoors. The truest reading of the colour.",
    filter: "saturate(1) brightness(1) hue-rotate(0deg)",
  },
  tungsten: {
    label: "Tungsten",
    note: "Indoor bulbs. Warmer, and a shade heavier.",
    filter: "saturate(1.06) brightness(0.96) sepia(0.16) hue-rotate(-6deg)",
  },
  evening: {
    label: "Evening",
    note: "Reception lighting. Cooler and deeper, the way it reads at an owambe.",
    filter: "saturate(0.92) brightness(0.82) hue-rotate(6deg) contrast(1.05)",
  },
};

export function estimate(config: LoomConfig): number {
  const fabric = FABRICS.find((f) => f.id === config.fabric);
  return (
    GARMENT_BASE[config.garment] +
    (fabric?.add ?? 0) +
    (config.design ? EMBROIDERY_ADD : 0)
  );
}
