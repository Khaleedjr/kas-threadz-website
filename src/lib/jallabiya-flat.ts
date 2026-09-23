/* ============================================================
   KAS THREADZ · the jallabiya, drawn flat

   Traced from the studio's reference sketch, kept at
   design-sources/jallabiya-flat-reference.webp: a jallabiya on a dress
   form, drawn in thin ink over linen and lit softly from the front.
   Every line is the sketch's own, measured off it and fitted, in the
   sketch's own units (its shoulders are 18.5 inches across, at 19.7
   units to the inch). The sketch is a kaftan's length; the jallabiya
   runs on to the length chosen in the Loom, 54 to 62 inches, so the
   hem visibly drops as the length goes up.

   The garment itself is plain, no trim at the neck or the cuffs: the
   neckline chosen in the Loom is the only embroidery on it, placed
   with its arm tips on the shoulder seams as everywhere else.
   ============================================================ */

import { luminance, shade } from "./garment";
import { NECKLINE_FIT } from "./neckline-fit";
import { STITCH_FRONT, chalkFor } from "./stitching";
import { threadFilter, type ThreadTones } from "./loom-preview";

export type FlatState = {
  color: string;
  fabric: string;
  neckline?: string | null;
  /** inches, from the side neck point to the hem */
  length?: number;
  /** the thread the design is run in; left out, it keeps its own colours */
  thread?: ThreadTones | null;
};

/** The Loom's Length step offers these, in inches. The drawing's frame fits the longest. */
export const LENGTH_RANGE = { min: 54, max: 62, standard: 58 };

/** the sketch's centre line */
const C = 517;
const PX_PER_IN = 19.7;
/** the side neck point, which the length is measured from */
const NECK_Y = 96;
/** the ink the sketch is drawn in */
const INK = "#3b3d42";

type P = [number, number];
const r2 = (n: number) => Math.round(n * 100) / 100;
/** a point given as half width from the centre line, on the right side or the left */
const at = (side: 1 | -1, [h, y]: P) => `${r2(C + side * h)} ${r2(y)}`;

/* ---------------------------------------------------------------- the cut */
/* Each curve is [start, control, control, end] in (half width, y), fitted
   to points traced off the sketch; none is more than 4 units off it. */

const SHOULDER_NECK: P = [73, 101];
const SHOULDER_POINT: P = [186, 150];
const UNDERARM: P = [151, 410];
const CUFF_OUTER: P = [282, 619];
const CUFF_INNER: P = [184, 628];

const SLEEVE_OUTER: [P, P, P, P] = [SHOULDER_POINT, [250.3, 274.6], [253.2, 478.9], CUFF_OUTER];
const ARMHOLE: [P, P, P, P] = [SHOULDER_POINT, [162.3, 218.3], [151.7, 334.3], UNDERARM];
const SLEEVE_INNER: [P, P, P, P] = [UNDERARM, [170.6, 473.7], [173.3, 560.7], CUFF_INNER];
const CUFF_EDGE: [P, P, P, P] = [CUFF_OUTER, [262, 634], [205, 642], CUFF_INNER];
/** the edge of the opening, against the dress form's neck */
const NECK_INNER: [P, P, P, P] = [[58, 97], [58.4, 125.6], [24.8, 139], [0, 139]];
/** the seam where the neck band meets the body */
const NECK_OUTER: [P, P, P, P] = [SHOULDER_NECK, [90, 133.5], [30, 160], [0, 160]];

/** The body's side seam falls in a straight line, flaring a little to the hem. */
const sideAt = (y: number) => UNDERARM[0] + (y - UNDERARM[1]) * 0.0435;

/** how much lower the hem is at the centre than at the side seams */
const HEM_SWEEP = 26;
/** the turned hem, and the split at each side seam */
const HEM_FOLD = 23;
const SLIT = 110;

function lengthOf(state: FlatState) {
  const inches = Math.min(LENGTH_RANGE.max, Math.max(LENGTH_RANGE.min, state.length ?? LENGTH_RANGE.standard));
  const hemMid = NECK_Y + inches * PX_PER_IN;
  const hemSide = hemMid - HEM_SWEEP;
  return { hemMid, hemSide, half: sideAt(hemSide) };
}

/** A cubic, written from its start (the pen is already there). */
const curve = (side: 1 | -1, c: [P, P, P, P], reverse = false) => {
  const [, b, d, e] = reverse ? [c[3], c[2], c[1], c[0]] : c;
  return `C ${at(side, b)} ${at(side, d)} ${at(side, e)}`;
};

/** A smooth line through points (Catmull-Rom, as cubics), the pen already at the first. */
function smooth(pts: Array<[number, number]>): string {
  let d = "";
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    d +=
      ` C ${r2(p1[0] + (p2[0] - p0[0]) / 6)} ${r2(p1[1] + (p2[1] - p0[1]) / 6)}` +
      ` ${r2(p2[0] - (p3[0] - p1[0]) / 6)} ${r2(p2[1] - (p3[1] - p1[1]) / 6)}` +
      ` ${r2(p2[0])} ${r2(p2[1])}`;
  }
  return d;
}

/** The hem from the left side seam to the right: nearly level, dipping a little at the centre. */
function hemPoints(hemMid: number, half: number, lift = 0): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  const n = 16;
  // the fold line sits higher, where the side seams are a little closer in
  const reach = lift ? sideAt(hemMid - HEM_SWEEP - lift) : half;
  for (let i = 0; i <= n; i++) {
    const t = -1 + (2 * i) / n;
    pts.push([C + t * reach, hemMid - lift - HEM_SWEEP * Math.abs(t) ** 3.2]);
  }
  return pts;
}

function bodyPath(state: FlatState): string {
  const { hemMid, half } = lengthOf(state);
  const hem = hemPoints(hemMid, half);
  return [
    `M ${at(-1, NECK_INNER[0])}`,
    curve(-1, NECK_INNER),
    curve(1, NECK_INNER, true),
    `L ${at(1, SHOULDER_NECK)}`,
    `L ${at(1, SHOULDER_POINT)}`,
    curve(1, ARMHOLE),
    `L ${r2(C + half)} ${r2(hem[hem.length - 1][1])}`,
    // the hem, right to left
    `L ${r2(hem[hem.length - 1][0])} ${r2(hem[hem.length - 1][1])}`,
    smooth([...hem].reverse()),
    `L ${at(-1, UNDERARM)}`,
    curve(-1, ARMHOLE, true),
    `L ${at(-1, SHOULDER_NECK)}`,
    "Z",
  ].join(" ");
}

function sleevePath(side: 1 | -1): string {
  return [
    `M ${at(side, SHOULDER_POINT)}`,
    curve(side, SLEEVE_OUTER),
    curve(side, CUFF_EDGE),
    curve(side, SLEEVE_INNER, true),
    curve(side, ARMHOLE, true),
    "Z",
  ].join(" ");
}

/** The back panel, where it shows through the split at the side seam. */
function backPeek(state: FlatState, side: 1 | -1): string {
  const { hemSide, half } = lengthOf(state);
  const top = hemSide - SLIT;
  const t: P = [sideAt(top), top];
  return [
    `M ${at(side, t)}`,
    `C ${at(side, [sideAt(top + 40) + 1.5, top + 40])} ${at(side, [half + 7, hemSide - 30])} ${at(side, [half + 9, hemSide - 1])}`,
    `Q ${at(side, [half + 8, hemSide + 5])} ${at(side, [half - 4, hemSide + 6])}`,
    `L ${at(side, [half - 24, hemSide + 4])}`,
    `L ${at(side, [sideAt(top) - 20, top])}`,
    "Z",
  ].join(" ");
}

/** The back panel's visible edge and hem, for the ink. */
function backPeekLine(state: FlatState, side: 1 | -1): string {
  const { hemSide, half } = lengthOf(state);
  const top = hemSide - SLIT;
  return [
    `M ${at(side, [sideAt(top), top])}`,
    `C ${at(side, [sideAt(top + 40) + 1.5, top + 40])} ${at(side, [half + 7, hemSide - 30])} ${at(side, [half + 9, hemSide - 1])}`,
    `Q ${at(side, [half + 8, hemSide + 5])} ${at(side, [half - 1, hemSide + 6])}`,
  ].join(" ");
}

/* ------------------------------------------------------------- the design */

/** The shoulder seam's height at a given half width. */
function shoulderY(h: number): number {
  const [nh, ny] = SHOULDER_NECK;
  const [sh, sy] = SHOULDER_POINT;
  return ny + ((h - nh) / (sh - nh)) * (sy - ny);
}

/* The arm tips sit at this share of the shoulder width, just under the
   seam. A design that is mostly drop is held to a height, ending about the
   waist, and meets the seams nearer the neck instead. */
const TIP_SHARE = 0.77;
const TIP_DROP = 4;
const DESIGN_MAX_H = 500;

/**
 * The neckline, and everything that sews it in.
 *
 * It is always drawn fully sewn: the reveal mask's front sits past the end of
 * the order. Stitching it in only moves that front and shows the chalk guide
 * and the needle, which `stitch-in.ts` does in the page, so the drawing never
 * has to be rebuilt while the needle runs.
 */
function necklineLayer(
  href: string,
  id: string,
  lum: number,
  thread: ThreadTones | null,
): { art: string; needle: string; defs: string } {
  const fit = NECKLINE_FIT[href];
  if (!fit) return { art: "", needle: "", defs: "" };
  let w = (TIP_SHARE * SHOULDER_POINT[0]) / fit.span;
  let h = w / fit.ratio;
  if (h > DESIGN_MAX_H) {
    h = DESIGN_MAX_H;
    w = h * fit.ratio;
  }
  const tipHalf = w * fit.span;
  const tipY = shoulderY(tipHalf) + TIP_DROP;
  const x = r2(C - w / 2), y = r2(tipY - fit.tip * h), iw = r2(w), ih = r2(h);
  const box = `x="${x}" y="${y}" width="${iw}" height="${ih}"`;
  const order = href.replace(/\.png$/, "-order.png");
  const funcs = ["R", "G", "B"]
    .map((c) => `<feFunc${c} type="linear" slope="${-STITCH_FRONT}" intercept="${STITCH_FRONT * 2}"/>`)
    .join("");
  const chalk = chalkFor(lum);
  const defs =
    `<filter id="front${id}" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB">` +
    `<feComponentTransfer data-stitch="front">${funcs}</feComponentTransfer></filter>` +
    `<mask id="sewn${id}" maskUnits="userSpaceOnUse" ${box}>` +
    `<image href="${order}" ${box} preserveAspectRatio="none" filter="url(#front${id})"/></mask>` +
    `<filter id="chalk${id}" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB">` +
    `<feFlood flood-color="${chalk}"/><feComposite in2="SourceAlpha" operator="in"/></filter>` +
    // run in one thread: the design's light and dark kept, on the thread's tones
    (thread
      ? `<filter id="thread${id}" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB">${threadFilter(thread)}</filter>`
      : "");
  const tone = thread ? ` filter="url(#thread${id})"` : "";
  const art =
    `<g clip-path="url(#body${id})">` +
    `<image data-stitch="chalk" href="${href}" ${box} preserveAspectRatio="none" filter="url(#chalk${id})" opacity="0"/>` +
    `<g filter="url(#emb${id})"><image data-stitch="design" data-href="${href}" data-box="${x} ${y} ${iw} ${ih}" href="${href}" ${box} preserveAspectRatio="none" mask="url(#sewn${id})"${tone}/></g>` +
    `</g>`;
  // the needle, as the house mark draws it: steel, an eye, and a bright point
  // where the thread goes into the cloth. Hidden until it is sewing.
  const needle =
    `<g data-stitch="needle" style="display:none" pointer-events="none">` +
    `<circle r="11" fill="none" stroke="#fffaf0" stroke-width="1.6" opacity="0.35" filter="url(#glow${id})"/>` +
    `<line x1="6" y1="-40" x2="1.4" y2="-9" stroke="#2c2f35" stroke-opacity="0.45" stroke-width="4.2" stroke-linecap="round"/>` +
    `<line x1="6" y1="-40" x2="1.4" y2="-9" stroke="#e8edf4" stroke-width="2.8" stroke-linecap="round"/>` +
    `<circle cx="5.3" cy="-33" r="2" fill="none" stroke="#8d96a2" stroke-width="1.1"/>` +
    `<circle r="3.6" fill="#fffaf0" stroke="#2c2f35" stroke-opacity="0.5" stroke-width="1"/>` +
    `</g>`;
  return { art, needle, defs };
}

/* ------------------------------------------------------------------ draw */

function hashId(s: FlatState): string {
  const t = s.thread;
  const key = [s.color, s.fabric, s.length ?? "", s.neckline ?? "", t ? `${t.dark}${t.mid}${t.light}` : ""].join("|");
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return "j" + h.toString(36);
}

/**
 * The crop, tight to the garment: from just over the dress form's top to
 * just under the longest hem, and from cuff to cuff with room for the soft
 * shadow. It is fixed at the longest length, so choosing a shorter one
 * visibly raises the hem rather than rescaling the whole garment.
 */
const FRAME = (() => {
  const top = 34;
  const bottom = NECK_Y + LENGTH_RANGE.max * PX_PER_IN + 32;
  const half = CUFF_OUTER[0] + 40;
  return { x: C - half, y: top, w: 2 * half, h: bottom - top };
})();

/** The drawing's width over its height, for the pane that shows it. */
export const FLAT_RATIO = FRAME.w / FRAME.h;

export function buildJallabiyaFlat(state: FlatState): string {
  const s = state;
  const id = hashId(s);
  const silk = s.fabric === "silk";
  const lum = luminance(s.color);
  const { hemMid, half } = lengthOf(s);

  const body = bodyPath(s);
  const sleeves = [sleevePath(1), sleevePath(-1)];
  const full = `x="${r2(FRAME.x)}" y="${r2(FRAME.y)}" width="${r2(FRAME.w)}" height="${r2(FRAME.h)}"`;

  /* the linen: its shadows multiplied into the colour, and on darker cloth
     the bright faces of its threads, which is all of it that shows there */
  const weaveDark = r2(silk ? 0.45 : lum > 0.8 ? 0.72 : lum > 0.45 ? 0.9 : 0.8);
  const weaveLight = r2(silk ? 0.06 : lum < 0.08 ? 0.2 : lum < 0.3 ? 0.13 : 0.05);
  const surface = (clip: string) =>
    `<rect ${full} fill="url(#ln${id})" opacity="${weaveDark}" clip-path="url(#${clip})" style="mix-blend-mode:multiply"/>` +
    `<rect ${full} fill="url(#lh${id})" opacity="${weaveLight}" clip-path="url(#${clip})"/>`;

  const inner = lum > 0.42 ? shade(s.color, -58) : shade(s.color, 46);

  /* ---- behind the garment: the back panel at the splits, the back of the
     neck band, and the dress form's neck ---- */
  let back = "";
  for (const side of [1, -1] as const) {
    back += `<path d="${backPeek(s, side)}" fill="${shade(s.color, -14)}"/>`;
    back += `<path d="${backPeekLine(s, side)}" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>`;
  }
  const bandBack =
    `M ${at(-1, SHOULDER_NECK)} Q ${C} ${NECK_Y - 16} ${at(1, SHOULDER_NECK)} ` +
    `L ${at(1, NECK_INNER[0])} Q ${C} ${NECK_Y - 4} ${at(-1, NECK_INNER[0])} Z`;
  back += `<path d="${bandBack}" fill="${shade(s.color, -22)}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`;

  const form =
    `<path d="M ${C - 49} 62 C ${C - 49} 78 ${C - 56} 90 ${C - 60} 110 L ${C - 62} 170 L ${C + 62} 170 ` +
    `L ${C + 60} 110 C ${C + 56} 90 ${C + 49} 78 ${C + 49} 62 A 49 13 0 0 1 ${C - 49} 62 Z" fill="url(#formSide${id})"/>` +
    `<ellipse cx="${C}" cy="62" rx="49" ry="13" fill="url(#formTop${id})"/>` +
    `<path d="M ${C - 49} 62 A 49 13 0 0 0 ${C + 49} 62" fill="none" stroke="#fffaf2" stroke-opacity="0.7" stroke-width="1.2"/>`;

  /* ---- the body ---- */
  let front = `<path d="${body}" fill="${s.color}"/>`;
  front += surface(`body${id}`);
  front += `<path d="${body}" fill="url(#light${id})"/>`;
  front += `<path d="${body}" fill="url(#glow${id})"/>`;
  front += `<path d="${body}" fill="url(#sides${id})"/>`;
  if (silk) front += `<path d="${body}" fill="url(#sheen${id})"/>`;
  // the shade the sleeves leave on the body's sides, where they hang close
  front += `<g clip-path="url(#body${id})" filter="url(#soft${id})">`;
  for (const side of [1, -1] as const) {
    front += `<path d="M ${at(side, [UNDERARM[0] - 4, UNDERARM[1] - 30])} L ${at(side, [sideAt(640) - 6, 640])}" stroke="#000" stroke-opacity="0.16" stroke-width="16" stroke-linecap="round"/>`;
  }
  front += `</g>`;

  // the turned hem and the split at each side
  const fold = hemPoints(hemMid, half, HEM_FOLD);
  front += `<path d="M ${r2(fold[0][0])} ${r2(fold[0][1])}${smooth(fold)}" fill="none" stroke="${INK}" stroke-opacity="0.75" stroke-width="1.3"/>`;

  // the neck slit, closed at its foot with a bar tack. It is drawn before the
  // design: the embroidery is worked around the opening, over its edges
  front += `<path d="M ${C} ${NECK_OUTER[3][1]} L ${C} ${NECK_OUTER[3][1] + 108}" stroke="${INK}" stroke-width="1.5"/>`;
  front += `<path d="M ${C - 5} ${NECK_OUTER[3][1] + 109} L ${C + 5} ${NECK_OUTER[3][1] + 109}" stroke="${inner}" stroke-opacity="0.9" stroke-width="2.4" stroke-linecap="round"/>`;

  /* the neckline design, under the neck band */
  const design = s.neckline
    ? necklineLayer(s.neckline, id, lum, s.thread ?? null)
    : { art: "", needle: "", defs: "" };

  /* ---- the neck band and the neck slit ---- */
  const band =
    `M ${at(-1, NECK_INNER[0])} ${curve(-1, NECK_INNER)} ${curve(1, NECK_INNER, true)} ` +
    `L ${at(1, SHOULDER_NECK)} ${curve(1, NECK_OUTER)} ${curve(-1, NECK_OUTER, true)} Z`;
  let neck = `<path d="${band}" fill="${s.color}"/>`;
  neck += `<path d="${band}" fill="url(#bandShade${id})"/>`;
  neck += surface(`band${id}`);
  neck += `<path d="M ${at(-1, SHOULDER_NECK)} ${curve(-1, NECK_OUTER)} ${curve(1, NECK_OUTER, true)}" fill="none" stroke="${INK}" stroke-width="1.6"/>`;
  neck += `<path d="M ${at(-1, NECK_INNER[0])} ${curve(-1, NECK_INNER)} ${curve(1, NECK_INNER, true)}" fill="none" stroke="${INK}" stroke-width="1.8"/>`;

  /* ---- the sleeves ---- */
  let arms = "";
  sleeves.forEach((sp, i) => {
    const side = i === 0 ? 1 : -1;
    arms += `<path d="${sp}" fill="${s.color}"/>`;
    arms += surface(`sl${i}${id}`);
    arms += `<path d="${sp}" fill="url(#sleeve${i}${id})"/>`;
    if (silk) arms += `<path d="${sp}" fill="url(#sheen${id})"/>`;
    // the sleeve head sits just below the seam, a touch in shadow
    arms += `<g clip-path="url(#sl${i}${id})" filter="url(#soft${id})"><path d="M ${at(side, SHOULDER_POINT)} ${curve(side, ARMHOLE)}" fill="none" stroke="#000" stroke-opacity="0.13" stroke-width="12"/></g>`;
    // the turned cuff
    const k = 15;
    arms += `<path d="M ${at(side, [CUFF_OUTER[0] - 1.5, CUFF_OUTER[1] - k])} C ${at(side, [262 - 1.5, 634 - k])} ${at(side, [205 + 1, 642 - k])} ${at(side, [CUFF_INNER[0] + 1.5, CUFF_INNER[1] - k])}" fill="none" stroke="${INK}" stroke-opacity="0.75" stroke-width="1.3"/>`;
    arms += `<path d="${sp}" fill="none" stroke="${INK}" stroke-width="1.9" stroke-linejoin="round"/>`;
  });

  const outline = `<path d="${body}" fill="none" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;

  /* ---- paint ---- */
  const sleeveGrad = (i: number) => {
    const side = i === 0 ? 1 : -1;
    // across the sleeve at its middle, from the side facing the body to the outside
    const a = [C + side * 172, 400];
    const b = [C + side * 262, 380];
    return (
      `<linearGradient id="sleeve${i}${id}" gradientUnits="userSpaceOnUse" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}">` +
      `<stop offset="0" stop-color="#000" stop-opacity="0.28"/>` +
      `<stop offset="0.3" stop-color="#000" stop-opacity="0.07"/>` +
      `<stop offset="0.6" stop-color="#fff" stop-opacity="${silk ? 0.16 : lum > 0.5 ? 0.1 : 0.05}"/>` +
      `<stop offset="1" stop-color="#000" stop-opacity="0.15"/></linearGradient>`
    );
  };
  const defs =
    `<pattern id="ln${id}" width="160" height="160" patternUnits="userSpaceOnUse"><image href="/img/cloth/linen.png" width="160" height="160"/></pattern>` +
    `<pattern id="lh${id}" width="160" height="160" patternUnits="userSpaceOnUse"><image href="/img/cloth/linen-hi.png" width="160" height="160"/></pattern>` +
    `<clipPath id="body${id}"><path d="${body}"/></clipPath>` +
    `<clipPath id="band${id}"><path d="${band}"/></clipPath>` +
    sleeves.map((sp, i) => `<clipPath id="sl${i}${id}"><path d="${sp}"/></clipPath>`).join("") +
    /* soft light from the upper left, and the lower body a shade further from it */
    `<linearGradient id="light${id}" gradientUnits="userSpaceOnUse" x1="${C - 260}" y1="120" x2="${C + 200}" y2="${hemMid}">` +
    `<stop offset="0" stop-color="#fff" stop-opacity="${lum > 0.5 ? 0.12 : 0.08}"/>` +
    `<stop offset="0.45" stop-color="#fff" stop-opacity="0"/>` +
    `<stop offset="1" stop-color="#000" stop-opacity="0.1"/></linearGradient>` +
    /* the front panel catching the light down its middle, as the sketch has it */
    `<linearGradient id="glow${id}" gradientUnits="userSpaceOnUse" x1="${C - 190}" y1="0" x2="${C + 190}" y2="0">` +
    `<stop offset="0.18" stop-color="#fff" stop-opacity="0"/>` +
    `<stop offset="0.46" stop-color="#fff" stop-opacity="${lum > 0.5 ? 0.2 : lum > 0.15 ? 0.1 : 0.06}"/>` +
    `<stop offset="0.82" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    /* and turning away from it at the sides */
    `<linearGradient id="sides${id}" gradientUnits="userSpaceOnUse" x1="${C - 190}" y1="0" x2="${C + 190}" y2="0">` +
    `<stop offset="0" stop-color="#000" stop-opacity="0.27"/>` +
    `<stop offset="0.08" stop-color="#000" stop-opacity="0.12"/>` +
    `<stop offset="0.2" stop-color="#000" stop-opacity="0.02"/>` +
    `<stop offset="0.3" stop-color="#000" stop-opacity="0"/>` +
    `<stop offset="0.7" stop-color="#000" stop-opacity="0"/>` +
    `<stop offset="0.8" stop-color="#000" stop-opacity="0.02"/>` +
    `<stop offset="0.92" stop-color="#000" stop-opacity="0.12"/>` +
    `<stop offset="1" stop-color="#000" stop-opacity="0.27"/></linearGradient>` +
    `<linearGradient id="bandShade${id}" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="#000" stop-opacity="0.1"/><stop offset="1" stop-color="#fff" stop-opacity="0.05"/></linearGradient>` +
    (silk
      ? `<linearGradient id="sheen${id}" x1="0" y1="0" x2="1" y2="0.15">` +
        `<stop offset="0" stop-color="#fff" stop-opacity="0"/>` +
        `<stop offset="0.36" stop-color="#fff" stop-opacity="0.2"/>` +
        `<stop offset="0.5" stop-color="#fff" stop-opacity="0.04"/>` +
        `<stop offset="0.66" stop-color="#fff" stop-opacity="0.12"/>` +
        `<stop offset="0.8" stop-color="#fff" stop-opacity="0"/></linearGradient>`
      : "") +
    sleeveGrad(0) +
    sleeveGrad(1) +
    /* the dress form: a painted neck, lit from the left, its top a flat cap */
    `<linearGradient id="formSide${id}" x1="0" y1="0" x2="1" y2="0">` +
    `<stop offset="0" stop-color="#d3c8b7"/><stop offset="0.3" stop-color="#e9e2d6"/>` +
    `<stop offset="0.62" stop-color="#e2d9cc"/><stop offset="1" stop-color="#c6baa7"/></linearGradient>` +
    `<linearGradient id="formTop${id}" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="#ddd4c6"/><stop offset="1" stop-color="#f1ebe1"/></linearGradient>` +
    `<filter id="soft${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>` +
    `<filter id="emb${id}" x="-5%" y="-5%" width="110%" height="110%"><feDropShadow dx="0" dy="0.8" stdDeviation="0.5" flood-color="#000" flood-opacity="0.4"/></filter>` +
    `<filter id="glow${id}" x="-300%" y="-300%" width="700%" height="700%"><feGaussianBlur stdDeviation="3"/></filter>` +
    design.defs +
    `<filter id="drop${id}" x="-20%" y="-10%" width="140%" height="120%"><feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#2a1c14" flood-opacity="0.2"/></filter>`;

  return `<svg class="garment-svg" viewBox="${r2(FRAME.x)} ${r2(FRAME.y)} ${r2(FRAME.w)} ${r2(FRAME.h)}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="jallabiya preview">
    <defs>${defs}</defs>
    <g filter="url(#drop${id})">${back}${form}${front}${design.art}${neck}${arms}${outline}</g>
    ${design.needle}
  </svg>`;
}
