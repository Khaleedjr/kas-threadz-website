/* ============================================================
   KAS THREADZ · parametric garment illustration

   A ghost mannequin product shot, drawn rather than photographed.
   No hanger, no stand, no figure: the garment holds its own shape
   over a soft contact shadow.

   The rule that makes it read as cloth rather than as a flat shape:
   every colour on the garment is derived from the cloth colour by
   `shade()`. The fill is a gradient from a lighter tone through the
   colour to a darker one, seams are drawn in the darkest tone, and a
   stripe is woven in the lightest. Laying grey or black over the top
   instead is what made the earlier version look washed out.
   ============================================================ */

import type { Garment } from "./catalogue";

export type GarmentState = {
  type: Garment;
  color: string;
  fabric: string;
};

/** A placement box for a design overlay, in % of the rendered frame. `x` and `y` are its centre. */
export type Anchor = { x: number; y: number; w: number; h: number };

export type Anchors = {
  /** the band that runs down the placket */
  flap: Anchor;
  /** the chest pocket, where the garment has one */
  pocket: Anchor | null;
};

type Preset = {
  shoulderHalf: number;
  neckW: number;
  neckDrop: number;
  chestHalf: number;
  waistHalf: number;
  hemHalf: number;
  hemY: number;
  sleeveEndY: number;
  sleeveFlare: number;
  collar: "kaftan" | "jallab" | "agbada";
  buttons: number;
  pocket?: boolean;
  robe?: boolean;
  drapeHalf?: number;
  /** how far the tunic worn underneath falls below the robe's hem */
  tunicDrop?: number;
};

type Frame = { x: number; y: number; w: number; h: number };

const CX = 250; // horizontal centre of the 500 wide canvas
const SY = 158; // the shoulder line
const ARMHOLE_Y = 96; // how far the armhole sits below the shoulder
const r2 = (n: number) => Math.round(n * 100) / 100;

/* Silhouette presets. Square shoulders and near straight sides, which is
   how these garments actually hang on a stand. */
const PRESET: Record<Garment, Preset> = {
  kaftan: {
    shoulderHalf: 97, neckW: 24, neckDrop: 16, chestHalf: 84, waistHalf: 82,
    hemHalf: 95, hemY: 566, sleeveEndY: 432, sleeveFlare: 16,
    collar: "kaftan", buttons: 3, pocket: true,
  },
  /* the mid length top: the same block, stopped at the thigh */
  senator: {
    shoulderHalf: 95, neckW: 23, neckDrop: 16, chestHalf: 82, waistHalf: 80,
    hemHalf: 92, hemY: 468, sleeveEndY: 400, sleeveFlare: 15,
    collar: "kaftan", buttons: 3, pocket: true,
  },
  jallabiya: {
    shoulderHalf: 99, neckW: 23, neckDrop: 15, chestHalf: 86, waistHalf: 84,
    hemHalf: 96, hemY: 566, sleeveEndY: 432, sleeveFlare: 16,
    collar: "jallab", buttons: 0,
  },
  /* The agbada is not a wide tunic. It is a drape: the cloth falls away from
     a normal shoulder in one long sweep, turns at the sleeve corner, and comes
     back to the body at the opening the arm passes through. The tunic worn
     under it shows below the hem. */
  /* Measured off the studio's own agbada photograph. The shoulders are narrow
     and the drape is enormous, which is the whole character of the garment:
     a wing that flares to its widest at the chest, then a long diagonal edge
     falling back in to the body. */
  agbada: {
    shoulderHalf: 68, neckW: 26, neckDrop: 24, chestHalf: 140, waistHalf: 138,
    hemHalf: 113, hemY: 678, sleeveEndY: 432, sleeveFlare: 0,
    collar: "agbada", buttons: 0, robe: true, drapeHalf: 163, tunicDrop: 0,
  },
};

/** Short, stable id for this state, so the server and client agree (FNV-1a). */
function hashId(s: GarmentState): string {
  const key = [s.type, s.color, s.fabric].join("|");
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36).padStart(5, "0").slice(0, 6);
}

/** Lighten or darken a hex colour by amt, in the range -100 to 100. */
export function shade(hex: string, amt: number): string {
  let c = hex.replace("#", "");
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const num = parseInt(c, 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const r = clamp((num >> 16) + amt);
  const g = clamp(((num >> 8) & 0xff) + amt);
  const b = clamp((num & 0xff) + amt);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * The crop the garment is photographed in. Tight to the silhouette so the
 * piece fills the frame like a product shot, then padded out to a fixed
 * 500:660 so the stage and the design overlays keep lining up.
 */
const FRAME_RATIO = 500 / 660;
function frame(p: Preset): Frame {
  const halfW = p.robe
    ? (p.drapeHalf as number)
    : Math.max(p.shoulderHalf + p.sleeveFlare * 0.8, p.hemHalf);
  const top = SY - 52; // just above the collar
  // a robe has to leave room for the tunic showing beneath it
  const bottom = p.hemY + (p.robe ? (p.tunicDrop ?? 0) + 26 : 22);
  let w = (halfW + 16) * 2;
  let h = bottom - top;
  if (w / h > FRAME_RATIO) h = w / FRAME_RATIO;
  else w = h * FRAME_RATIO;
  return { x: CX - w / 2, y: top - (h - (bottom - top)) / 2, w, h };
}

/** The cloth's own surface: its weave drawn in tones of the colour itself. */
function fabricDefs(fabric: string, color: string, id: string) {
  const light = shade(color, 26);
  const dark = shade(color, -22);
  const darker = shade(color, -40);
  let pattern = "";
  let patternRef = "";

  const tex = (body: string, w: number, h: number, transform = "") => {
    pattern = `<pattern id="tex${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse"${transform}>${body}</pattern>`;
    patternRef = `tex${id}`;
  };

  if (fabric === "express") {
    /* Express · very fine pinstripe */
    tex(`<line x1="1" y1="0" x2="1" y2="6" stroke="${light}" stroke-opacity="0.55" stroke-width="0.9"/>`, 6, 6);
  } else if (fabric === "noblethinker") {
    /* Noble Thinker · everyday fine stripe, a shade wider apart */
    tex(`<line x1="1.5" y1="0" x2="1.5" y2="9" stroke="${light}" stroke-opacity="0.5" stroke-width="1"/>`, 9, 9);
  } else if (fabric === "properstripes") {
    /* Proper Stripes · bold classic pinstripe with real spacing */
    tex(
      `<line x1="3" y1="0" x2="3" y2="26" stroke="${light}" stroke-opacity="0.75" stroke-width="1.6"/>` +
      `<line x1="3" y1="0" x2="3" y2="26" stroke="${light}" stroke-opacity="0.25" stroke-width="3.4"/>`,
      26, 26,
    );
  } else if (fabric === "focus") {
    /* Focus · tonal satin stripe bands */
    tex(
      `<rect width="9" height="30" fill="${light}" fill-opacity="0.16"/>` +
      `<rect x="9" width="2" height="30" fill="${darker}" fill-opacity="0.18"/>` +
      `<rect x="18" width="4" height="30" fill="${darker}" fill-opacity="0.12"/>`,
      30, 30,
    );
  } else {
    /* Cotton and silk are both smooth, with only a whisper of twill in the
       weave. Silk takes the sheen below; cotton stays matte. */
    tex(`<line x1="0" y1="0" x2="0" y2="7" stroke="${darker}" stroke-opacity="0.06" stroke-width="1"/>`, 7, 7, ` patternTransform="rotate(63)"`);
  }

  const sheen = fabric === "silk" || fabric === "focus";
  const gradId = `grad${id}`;
  const grad =
    `<linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${light}"/>` +
    `<stop offset="0.5" stop-color="${color}"/>` +
    `<stop offset="1" stop-color="${dark}"/></linearGradient>`;
  const sheenGrad = sheen
    ? `<linearGradient id="sheen${id}" x1="0" y1="0" x2="1" y2="0">` +
      `<stop offset="0" stop-color="#ffffff" stop-opacity="0"/>` +
      `<stop offset="0.42" stop-color="#ffffff" stop-opacity="0.22"/>` +
      `<stop offset="0.55" stop-color="#ffffff" stop-opacity="0"/></linearGradient>`
    : "";

  return { defs: grad + sheenGrad + pattern, gradId, patternRef, sheen, dark, darker, light };
}

/** Relative luminance of a hex colour, 0 to 1. The 3D preview matches its stitching thread by it. */
export function luminance(hex: string): number {
  const n = parseInt(hex.replace("#", ""), 16);
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 0xff) + 0.0722 * lin(n & 0xff);
}

/** The torso: square shoulders, straight boxy sides. */
function torsoPath(o: Preset): string {
  const nL = CX - o.neckW, nR = CX + o.neckW;
  const armY = SY + ARMHOLE_Y;
  const midY = (armY + o.hemY) / 2;
  return [
    `M ${nL} ${SY}`,
    `L ${CX - o.shoulderHalf} ${SY + 15}`,
    `L ${CX - o.chestHalf} ${armY}`,
    `Q ${CX - o.waistHalf} ${midY} ${CX - o.hemHalf} ${o.hemY}`,
    `Q ${CX} ${o.hemY + 14} ${CX + o.hemHalf} ${o.hemY}`,
    `Q ${CX + o.waistHalf} ${midY} ${CX + o.chestHalf} ${armY}`,
    `L ${CX + o.shoulderHalf} ${SY + 15}`,
    `L ${nR} ${SY}`,
    `Q ${CX} ${SY + o.neckDrop} ${nL} ${SY}`,
    "Z",
  ].join(" ");
}

/** One sleeve, a straight tube falling to a cuff. */
function sleevePath(side: number, o: Preset): string {
  const shX = CX + side * (o.shoulderHalf - 1);
  const armpitX = CX + side * (o.chestHalf - 1);
  const outTop = CX + side * (o.shoulderHalf + o.sleeveFlare);
  const cuffOut = CX + side * (o.shoulderHalf + o.sleeveFlare * 0.8);
  const cuffIn = CX + side * (o.chestHalf + 3);
  const endY = o.sleeveEndY;
  return [
    `M ${shX} ${SY + 12}`,
    `Q ${outTop} ${SY + 56} ${cuffOut} ${endY - 5}`,
    `Q ${(cuffOut + cuffIn) / 2} ${endY + 9} ${cuffIn} ${endY - 2}`,
    `L ${armpitX} ${SY + ARMHOLE_Y + 6}`,
    "Z",
  ].join(" ");
}

/* the agbada's landmarks, shared by the outline and the folds drawn on it */
const DRAPE = {
  shoulderY: SY + 8,
  /** the wing at its widest, level with the chest */
  wingY: 313,
  /** where the wing's long lower edge rejoins the body */
  openY: 502,
  openHalf: 100,
  /** the inner tunic showing through the robe's front opening */
  tunicHalf: 62,
};

/**
 * The agbada. The cloth flares from a normal shoulder out to the wing, falls
 * vertically to the sleeve's bottom edge, comes back in along the underside,
 * and the body then drops to a level hem.
 *
 * Two earlier attempts are worth not repeating: a plain wide trapezoid reads
 * as a poncho, and throwing the flare as one long curve balloons it into a
 * mushroom. The flare has to arrive at its width and then hang straight.
 */
/**
 * The agbada's body: a plain A line from a narrow shoulder to the hem. The
 * wings hang over it, which is why it is drawn separately. Treating the whole
 * garment as one outline is what kept giving a cape.
 */
function robePath(o: Preset): string {
  const { shoulderY } = DRAPE;
  const bh = o.hemHalf;
  return [
    `M ${CX - o.neckW} ${SY}`,
    `L ${CX - o.shoulderHalf} ${shoulderY}`,
    `C ${CX - o.shoulderHalf - 6} ${shoulderY + 150} ${CX - bh + 4} ${o.hemY - 190} ${CX - bh} ${o.hemY}`,
    `Q ${CX} ${o.hemY + 18} ${CX + bh} ${o.hemY}`,
    `C ${CX + bh - 4} ${o.hemY - 190} ${CX + o.shoulderHalf + 6} ${shoulderY + 150} ${CX + o.shoulderHalf} ${shoulderY}`,
    `L ${CX + o.neckW} ${SY}`,
    `Q ${CX} ${SY + o.neckDrop} ${CX - o.neckW} ${SY}`,
    "Z",
  ].join(" ");
}

/**
 * One wing: the great fall of cloth from the shoulder out to the widest point
 * and back in along its lower edge, closing up the body's own side. Laid over
 * the body, so that edge reads as a fold across it.
 */
function wingPath(o: Preset, side: number): string {
  const dh = o.drapeHalf as number;
  const { shoulderY, wingY, openY, openHalf } = DRAPE;
  const s = side;
  return [
    `M ${CX + s * o.shoulderHalf} ${shoulderY}`,
    // held close to a straight diagonal, or the shoulder domes
    `C ${CX + s * (o.shoulderHalf + 34)} ${shoulderY + 50} ${CX + s * (dh - 22)} ${wingY - 58} ${CX + s * dh} ${wingY}`,
    `Q ${CX + s * (dh + 2)} ${wingY + 22} ${CX + s * (dh - 18)} ${wingY + 34}`,
    // the long lower edge, landing on the body's side
    `L ${CX + s * openHalf} ${openY}`,
    // and back up that side to the shoulder it hangs from
    `C ${CX + s * (openHalf - 2)} ${openY - 160} ${CX + s * (o.shoulderHalf + 4)} ${shoulderY + 90} ${CX + s * o.shoulderHalf} ${shoulderY}`,
    "Z",
  ].join(" ");
}

export function build(state: GarmentState): string {
  const s = state;
  const o = PRESET[s.type] ?? PRESET.kaftan;
  const fr = frame(o);
  const id = hashId(s);
  const f = fabricDefs(s.fabric, s.color, id);
  const clipId = `clip${id}`;
  const isRobe = !!o.robe;
  const body = isRobe ? robePath(o) : torsoPath(o);
  const fillRef = `url(#${f.gradId})`;
  const armY = SY + ARMHOLE_Y;
  const neckY = SY + o.neckDrop;
  const seam = f.darker;

  const groundY = o.hemY + 6;

  /* the sleeves are laid first, so the body overlaps them at the armhole */
  let sleeves = "";
  if (!isRobe) {
    for (const sd of [-1, 1]) {
      const sp = sleevePath(sd, o);
      sleeves += `<path d="${sp}" fill="${fillRef}" stroke="${seam}" stroke-opacity="0.45" stroke-width="1.1"/>`;
      sleeves += `<path d="${sp}" fill="url(#shc${id})"/>`;
      const inX = CX + sd * (o.chestHalf - 1);
      sleeves += `<line x1="${inX}" y1="${armY + 2}" x2="${inX}" y2="${o.sleeveEndY - 14}" stroke="${seam}" stroke-opacity="0.3" stroke-width="1"/>`;
    }
  }

  /* weave, sheen and the roundness of the body, all clipped to the torso */
  let over = "";
  if (f.patternRef) {
    over += `<rect x="${r2(fr.x)}" y="${r2(fr.y)}" width="${r2(fr.w)}" height="${r2(fr.h)}" fill="url(#${f.patternRef})" clip-path="url(#${clipId})"/>`;
  }
  over += `<path d="${body}" fill="url(#shc${id})" clip-path="url(#${clipId})"/>`;
  if (f.sheen) {
    over += `<rect x="${r2(fr.x)}" y="${r2(fr.y)}" width="${r2(fr.w)}" height="${r2(fr.h)}" fill="url(#sheen${id})" clip-path="url(#${clipId})"/>`;
  }
  over += `<path d="${body}" fill="none" stroke="${seam}" stroke-opacity="0.4" stroke-width="1.2"/>`;

  /* the wings, hung over the body so their lower edge reads as a fold on it */
  let wings = "";
  let wingClip = "";
  if (isRobe) {
    const wl = wingPath(o, -1);
    const wr = wingPath(o, 1);
    wingClip = `<clipPath id="wcl${id}"><path d="${wl}"/><path d="${wr}"/></clipPath>`;
    wings = `<path d="${wl}" fill="${fillRef}"/><path d="${wr}" fill="${fillRef}"/>`;
    if (f.patternRef) {
      wings += `<rect x="${r2(fr.x)}" y="${r2(fr.y)}" width="${r2(fr.w)}" height="${r2(fr.h)}" fill="url(#${f.patternRef})" clip-path="url(#wcl${id})"/>`;
    }
    /* a shade deeper than the body they hang in front of */
    wings += `<path d="${wl}" fill="url(#shc${id})"/><path d="${wr}" fill="url(#shc${id})"/>`;
    wings += `<path d="${wl}" fill="${f.dark}" fill-opacity="0.07"/><path d="${wr}" fill="${f.dark}" fill-opacity="0.07"/>`;
    wings += `<path d="${wl}" fill="none" stroke="${seam}" stroke-opacity="0.42" stroke-width="1.3"/><path d="${wr}" fill="none" stroke="${seam}" stroke-opacity="0.42" stroke-width="1.3"/>`;
  }

  /* ---- how each garment is actually made up ---- */
  let details = `<path d="M ${CX - o.neckW + 5} ${SY + 2} Q ${CX} ${neckY + 6} ${CX + o.neckW - 5} ${SY + 2}" fill="none" stroke="${seam}" stroke-opacity="0.4" stroke-width="1.6"/>`;

  if (o.collar === "kaftan") {
    const pTop = neckY + 2;
    const pBot = SY + (o.hemY > 500 ? 218 : 190);
    details += `<rect x="${CX - 7}" y="${pTop}" width="14" height="${pBot - pTop}" rx="2" fill="${f.dark}" fill-opacity="0.14" stroke="${seam}" stroke-opacity="0.45" stroke-width="1.2"/>`;
    for (let i = 0; i < o.buttons; i++) {
      const y = pTop + 22 + (i * (pBot - pTop - 44)) / Math.max(o.buttons - 1, 1);
      details += `<circle cx="${CX}" cy="${r2(y)}" r="3.1" fill="${f.light}" stroke="${seam}" stroke-opacity="0.55"/>`;
    }
    if (o.pocket) {
      details += `<rect x="${CX + 28}" y="${SY + 86}" width="48" height="60" rx="2" fill="${f.dark}" fill-opacity="0.10" stroke="${seam}" stroke-opacity="0.45" stroke-width="1.2"/>`;
    }
  } else if (o.collar === "jallab") {
    /* Only the neck slit. The neckline embroidery frames it and carries its
       own drop down the chest, so a drawn placket and tassel would sit on top
       of the design rather than under it. */
    const sTop = neckY + 2, sBot = neckY + 66;
    details += `<line x1="${CX}" y1="${sTop}" x2="${CX}" y2="${sBot}" stroke="${seam}" stroke-opacity="0.55" stroke-width="1.4"/>`;
    details += `<line x1="${CX + 1.4}" y1="${sTop}" x2="${CX + 1.4}" y2="${sBot - 2}" stroke="${f.light}" stroke-opacity="0.18" stroke-width="1"/>`;
  } else {
    /* The agbada. What sells it is the drape: the cloth gathers at the
       shoulder and runs in long folds out to the sleeve corner, so the folds
       all radiate from one point rather than hanging parallel. */
    const dh = o.drapeHalf as number;
    const { shoulderY, wingY, openY, openHalf, tunicHalf } = DRAPE;

    /* The tunic worn underneath, showing through the robe's front opening.
       This is the panel the chest design is actually stitched on. */
    const tTop = SY + 2;
    const tBot = o.hemY - 8;
    details += `<path d="M ${CX - tunicHalf} ${tTop} L ${CX - tunicHalf - 4} ${tBot} Q ${CX} ${tBot + 12} ${CX + tunicHalf + 4} ${tBot} L ${CX + tunicHalf} ${tTop} Z" fill="${f.light}" fill-opacity="0.16"/>`;
    /* the robe's front edges, either side of the opening */
    details += `<line x1="${CX - tunicHalf}" y1="${tTop + 4}" x2="${CX - tunicHalf - 4}" y2="${tBot}" stroke="${seam}" stroke-opacity="0.34" stroke-width="1.5"/>`;
    details += `<line x1="${CX + tunicHalf}" y1="${tTop + 4}" x2="${CX + tunicHalf + 4}" y2="${tBot}" stroke="${seam}" stroke-opacity="0.34" stroke-width="1.5"/>`;
    /* the tunic's own placket, running down the centre of it */
    details += `<line x1="${CX}" y1="${neckY + 8}" x2="${CX}" y2="${tBot - 6}" stroke="${seam}" stroke-opacity="0.13" stroke-width="1.2"/>`;
    /* the neck facing */
    details += `<path d="M ${CX - o.neckW - 6} ${SY + 3} Q ${CX} ${neckY + 12} ${CX + o.neckW + 6} ${SY + 3}" fill="none" stroke="${seam}" stroke-opacity="0.4" stroke-width="2"/>`;

    for (const sd of [-1, 1]) {
      /* the shoulder the whole wing is thrown from */
      details += `<path d="M ${CX + sd * (o.shoulderHalf - 6)} ${shoulderY + 6} C ${CX + sd * (o.shoulderHalf + 40)} ${shoulderY + 74} ${CX + sd * (dh - 46)} ${wingY - 78} ${CX + sd * (dh - 30)} ${wingY + 14}" fill="none" stroke="${seam}" stroke-opacity="0.2" stroke-width="1.5"/>`;
      /* the folds the cloth gathers into, all falling from that one point */
      details += `<path d="M ${CX + sd * (o.shoulderHalf - 22)} ${shoulderY + 20} C ${CX + sd * (o.shoulderHalf + 16)} ${shoulderY + 110} ${CX + sd * (dh - 88)} ${wingY + 30} ${CX + sd * (openHalf - 6)} ${openY - 20}" fill="none" stroke="${seam}" stroke-opacity="0.13" stroke-width="1.3"/>`;
      details += `<path d="M ${CX + sd * (tunicHalf + 14)} ${shoulderY + 40} C ${CX + sd * (tunicHalf + 40)} ${wingY - 40} ${CX + sd * (openHalf - 30)} ${openY - 90} ${CX + sd * (openHalf - 26)} ${o.hemY - 60}" fill="none" stroke="${seam}" stroke-opacity="0.1" stroke-width="1.2"/>`;
      /* the wing's lower edge, and the shadow that gathers under it */
      details += `<path d="M ${CX + sd * (dh - 18)} ${wingY + 34} L ${CX + sd * openHalf} ${openY} L ${CX + sd * (openHalf - 22)} ${openY - 6} L ${CX + sd * (dh - 54)} ${wingY + 30} Z" fill="${f.dark}" fill-opacity="0.12"/>`;
      details += `<line x1="${CX + sd * (dh - 18)}" y1="${wingY + 34}" x2="${CX + sd * openHalf}" y2="${openY}" stroke="${seam}" stroke-opacity="0.3" stroke-width="1.4"/>`;
    }

    /* the hem, turned back on itself */
    details += `<path d="M ${CX - o.hemHalf + 6} ${o.hemY - 13} Q ${CX} ${o.hemY + 4} ${CX + o.hemHalf - 6} ${o.hemY - 13}" fill="none" stroke="${seam}" stroke-opacity="0.24" stroke-width="1.3"/>`;
  }

  /* the cuff seams */
  if (!isRobe) {
    const cy = o.sleeveEndY - 16;
    const cuffOut = o.shoulderHalf + o.sleeveFlare * 0.8;
    const cuffIn = o.chestHalf + 3;
    details += `<line x1="${CX - cuffOut + 2}" y1="${cy}" x2="${CX - cuffIn - 2}" y2="${cy + 3}" stroke="${seam}" stroke-opacity="0.35" stroke-width="1.2"/>`;
    details += `<line x1="${CX + cuffIn + 2}" y1="${cy + 3}" x2="${CX + cuffOut - 2}" y2="${cy}" stroke="${seam}" stroke-opacity="0.35" stroke-width="1.2"/>`;
  }

  /* the mandarin band, lit on top and shadowed underneath */
  let collar = "";
  if (!isRobe) {
    const nL = CX - o.neckW, nR = CX + o.neckW;
    collar =
      `<path d="M ${nL} ${SY + 2} Q ${CX} ${neckY + 6} ${nR} ${SY + 2} L ${nR + 3} ${SY - 9} Q ${CX} ${neckY - 12} ${nL - 3} ${SY - 9} Z" fill="url(#collar${id})" stroke="${seam}" stroke-opacity="0.45" stroke-width="1.1"/>` +
      `<path d="M ${nL} ${SY + 3} Q ${CX} ${neckY + 7} ${nR} ${SY + 3}" fill="none" stroke="${seam}" stroke-opacity="0.35" stroke-width="1.4"/>`;
  }

  const shadeDefs =
    `<linearGradient id="shc${id}" x1="0" y1="0" x2="1" y2="0">` +
    `<stop offset="0" stop-color="#000" stop-opacity="0.13"/>` +
    `<stop offset="0.10" stop-color="#000" stop-opacity="0.04"/>` +
    `<stop offset="0.5" stop-color="#fff" stop-opacity="0.02"/>` +
    `<stop offset="0.90" stop-color="#000" stop-opacity="0.04"/>` +
    `<stop offset="1" stop-color="#000" stop-opacity="0.13"/></linearGradient>` +
    `<linearGradient id="collar${id}" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${f.light}"/><stop offset="1" stop-color="${f.dark}"/></linearGradient>`;

  return `<svg class="garment-svg" viewBox="${r2(fr.x)} ${r2(fr.y)} ${r2(fr.w)} ${r2(fr.h)}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${s.type} preview">
    <defs>${f.defs}${shadeDefs}<clipPath id="${clipId}"><path d="${body}"/></clipPath>${wingClip}
      <filter id="soft${id}" x="-25%" y="-25%" width="150%" height="150%">
        <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#241012" flood-opacity="0.22"/>
      </filter>
      <filter id="ao${id}" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="7"/></filter>
    </defs>
    <ellipse cx="${CX}" cy="${groundY}" rx="${(isRobe ? 96 : o.hemHalf) * 0.94}" ry="13" fill="#000" opacity="0.2" filter="url(#ao${id})"/>
    <g filter="url(#soft${id})">${sleeves}<path d="${body}" fill="${fillRef}" stroke="${seam}" stroke-opacity="0.4" stroke-width="1.2"/>${over}${wings}${collar}${details}</g>
  </svg>`;
}

/**
 * Where a design sits, in % of the same crop `build` renders into. The stage
 * carries the 500:660 ratio, so these line up exactly.
 */
export function anchors(type: Garment): Anchors {
  const o = PRESET[type] ?? PRESET.kaftan;
  const fr = frame(o);
  const px = (v: number) => ((v - fr.x) / fr.w) * 100;
  const py = (v: number) => ((v - fr.y) / fr.h) * 100;
  const pw = (v: number) => (v / fr.w) * 100;
  const ph = (v: number) => (v / fr.h) * 100;
  const neckY = SY + o.neckDrop;

  if (o.robe) {
    /* the chest panel is stitched on the tunic showing through the opening,
       so it is set to that panel's width and not to the robe's */
    return {
      flap: { x: 50, y: py(SY + 118), w: pw(100), h: ph(212) },
      pocket: null,
    };
  }
  return {
    flap: { x: 50, y: py(neckY + 104), w: pw(58), h: ph(190) },
    pocket: o.pocket ? { x: px(CX + 52), y: py(SY + 116), w: pw(40), h: ph(48) } : null,
  };
}

/** One design, laid on the cloth in its own thread colours. */
export function overlay(a: Anchor | null, url: string): string {
  if (!a) return "";
  return (
    `<div class="design-overlay" style="left:${r2(a.x)}%;top:${r2(a.y)}%;width:${r2(a.w)}%;height:${r2(a.h)}%;` +
    `background-image:url('${url}');background-position:center;"></div>`
  );
}
