"use client";

import Image from "next/image";
import type { Garment } from "@/lib/catalogue";
import { designAsset, type PreviewDesign } from "@/lib/loom-preview";

/** A design placement box on a flat, in % of the trimmed frame. */
type Slot = { part: "panel"; x: number; y: number; w: number; h: number };

/**
 * The garments the studio has illustrated as flats.
 *
 * The agbada is a blank template: cream cloth, no embroidery. The Loom
 * multiplies the chosen colour through the cloth, and lays the chosen design
 * onto the chest panel as its own stencil, so both the colour and the design
 * step change what is shown. The ratio is the trimmed size that
 * `scripts/garment-flats.py` reports.
 */
export const FLATS: Partial<Record<Garment, { ratio: number; slot: Slot }>> = {
  agbada: {
    ratio: 1.0778,
    slot: { part: "panel", x: 50, y: 37, w: 25, h: 35 },
  },
};

export function GarmentFlat({
  garment,
  colour,
  design,
}: {
  garment: Garment;
  colour: string;
  design: PreviewDesign | null;
}) {
  const flat = FLATS[garment];
  if (!flat) return null;

  const { slot } = flat;
  const asset = designAsset(design, slot.part);

  return (
    <div
      className="relative mx-auto w-full"
      style={{ aspectRatio: flat.ratio, isolation: "isolate" }}
    >
      {/* the illustration, its ground keyed away to the Loom's own paper */}
      <Image
        src={`/img/garments/${garment}.png`}
        alt={`${garment} illustrated as a flat`}
        fill
        priority
        sizes="(max-width: 1024px) 92vw, 44vw"
        className="object-contain"
      />
      {/* the cloth colour, multiplied through the cloth only */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-[background-color] duration-300"
        style={{
          background: colour,
          mixBlendMode: "multiply",
          WebkitMaskImage: `url("/img/garments/${garment}-cloth.png")`,
          maskImage: `url("/img/garments/${garment}-cloth.png")`,
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
        }}
      />
      {/* the chosen design, in its own thread colours, on the chest panel */}
      {asset && (
        <span
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            left: `${slot.x - slot.w / 2}%`,
            top: `${slot.y - slot.h / 2}%`,
            width: `${slot.w}%`,
            height: `${slot.h}%`,
            backgroundImage: `url("${asset}")`,
            backgroundSize: "contain",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            filter: "drop-shadow(0 0.6px 0.5px rgba(0, 0, 0, 0.4))",
          }}
        />
      )}
    </div>
  );
}
