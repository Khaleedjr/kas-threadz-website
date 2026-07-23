/**
 * Digitise the house mark once, at build time.
 *
 * The stitch engine used to run in the browser on every visit: fetch the logo,
 * decode it, rasterise it, then lay a thousand stitches. That work is identical
 * every time and it is why the mark used to appear a beat after the page. Here
 * it happens once and ships as data, so the mark renders with the first paint.
 *
 * Re-run this whenever the logo changes:
 *   node scripts/generate-mark.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(HERE, "../public/img/brand/logo-white.png");
const OUT = resolve(HERE, "../src/lib/mark-stitches.ts");

/* ---- the stitch settings, matched to the hero's scale ---- */
const TARGET_WIDTH = 700; // working resolution
const CROP_BOTTOM = 0.885; // the file sets THREADZ beneath the mark; the lockup adds it back as type
const ROW = 5.6; // distance between stitch rows
const MAX_STITCH = 46; // longest single satin stitch; wider runs become tatami
const OVERSHOOT = 1.6; // thread laps over the edge of the shape
const WEIGHT = 5.9; // nominal thread weight
const ALPHA = 120; // above this a pixel counts as ink

/* ------------------------------------------------------------------ *
 * A very small PNG reader. Enough for 8-bit RGBA or grey+alpha, which
 * is what the brand exports are. Avoids pulling a decoder into the
 * dependency tree for one build step.
 * ------------------------------------------------------------------ */
function decodePng(buffer) {
  const SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < 8; i++) {
    if (buffer[i] !== SIGNATURE[i]) throw new Error("Not a PNG file");
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colourType = 0;
  let interlace = 0;
  const data = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const body = buffer.subarray(offset + 8, offset + 8 + length);

    if (type === "IHDR") {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      bitDepth = body[8];
      colourType = body[9];
      interlace = body[12];
    } else if (type === "IDAT") {
      data.push(body);
    } else if (type === "IEND") {
      break;
    }
    offset += 12 + length; // length + type + body + crc
  }

  if (bitDepth !== 8) throw new Error(`Unsupported bit depth: ${bitDepth}`);
  if (interlace !== 0) throw new Error("Interlaced PNGs are not supported");
  const channels = colourType === 6 ? 4 : colourType === 4 ? 2 : 0;
  if (!channels) throw new Error(`Unsupported colour type: ${colourType} (need an alpha channel)`);

  const raw = inflateSync(Buffer.concat(data));
  const stride = width * channels;
  const pixels = Buffer.alloc(height * stride);

  // undo the per-scanline filters
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const out = pixels.subarray(y * stride, (y + 1) * stride);
    const prior = y > 0 ? pixels.subarray((y - 1) * stride, y * stride) : null;

    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? out[i - channels] : 0;
      const b = prior ? prior[i] : 0;
      const c = prior && i >= channels ? prior[i - channels] : 0;
      let value = line[i];

      if (filter === 1) value += a;
      else if (filter === 2) value += b;
      else if (filter === 3) value += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        value += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      } else if (filter !== 0) {
        throw new Error(`Unknown scanline filter: ${filter}`);
      }
      out[i] = value & 0xff;
    }
  }

  // we only care how opaque each pixel is
  const alpha = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    alpha[i] = pixels[i * channels + (channels - 1)];
  }
  return { width, height, alpha };
}

/** Box-average the alpha down to the working resolution. */
function downsample(src, targetWidth) {
  const scale = src.width / targetWidth;
  const width = targetWidth;
  const height = Math.round(src.height / scale);
  const alpha = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    const y0 = Math.floor(y * scale);
    const y1 = Math.min(src.height, Math.max(y0 + 1, Math.floor((y + 1) * scale)));
    for (let x = 0; x < width; x++) {
      const x0 = Math.floor(x * scale);
      const x1 = Math.min(src.width, Math.max(x0 + 1, Math.floor((x + 1) * scale)));
      let sum = 0;
      let count = 0;
      for (let sy = y0; sy < y1; sy++) {
        for (let sx = x0; sx < x1; sx++) {
          sum += src.alpha[sy * src.width + sx];
          count++;
        }
      }
      alpha[y * width + x] = count ? Math.round(sum / count) : 0;
    }
  }
  return { width, height, alpha };
}

/* deterministic wobble: real satin is never machine-perfect, but the mark
   must not shimmer between builds */
let seed = 21;
const random = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff - 0.5);

function layStitches(raster) {
  const readableHeight = Math.round(raster.height * CROP_BOTTOM);
  const ink = (x, y) => raster.alpha[y * raster.width + x] > ALPHA;

  let minX = raster.width;
  let maxX = 0;
  let minY = readableHeight;
  let maxY = 0;
  for (let y = 0; y < readableHeight; y++) {
    for (let x = 0; x < raster.width; x++) {
      if (!ink(x, y)) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  const stitches = [];
  let rowIndex = 0;
  for (let y = minY; y <= maxY; y += ROW, rowIndex++) {
    const row = Math.round(y);
    const spans = [];
    let x = minX;
    while (x <= maxX) {
      if (ink(x, row)) {
        const start = x;
        while (x <= maxX && ink(x, row)) x++;
        spans.push([start, x - 1]);
      } else {
        x++;
      }
    }

    for (const [x0, x1] of spans) {
      const span = x1 - x0;
      if (span < 1.5) continue;
      const parts = Math.max(1, Math.ceil(span / MAX_STITCH));
      const seg = span / parts;
      // stagger the split points row to row so a broad area reads as fill
      const jog = parts > 1 ? ((rowIndex % 2) * seg) / 2 : 0;

      for (let k = 0; k < parts; k++) {
        let a = x0 + k * seg - (k > 0 ? jog : 0);
        let b = x0 + (k + 1) * seg - (k < parts - 1 ? jog : 0);
        if (k === 0) a -= OVERSHOOT;
        if (k === parts - 1) b += OVERSHOOT;
        const yy = y + random() * 0.6;
        stitches.push({
          x1: +(a + random() * 0.4).toFixed(1),
          y1: +yy.toFixed(1),
          x2: +(b + random() * 0.4).toFixed(1),
          y2: +yy.toFixed(1),
          w: +(WEIGHT + random() * WEIGHT * 0.22).toFixed(2),
          o: +(0.9 + Math.abs(random()) * 0.2).toFixed(2),
        });
      }
    }
  }

  return { stitches, bounds: { minX, minY, maxX, maxY } };
}

/**
 * A thousand `<line>` elements will stall a mid-range phone. Stitches are
 * grouped by rounded weight and sheen so the mark ships as a handful of
 * multi-move paths, and each group keeps the stitch order so the ceremony can
 * still reveal them one at a time.
 */
function bucket(stitches) {
  const groups = new Map();
  stitches.forEach((s, index) => {
    const w = Math.round(s.w * 2) / 2;
    const o = Math.round(s.o * 20) / 20;
    const key = `${w}:${o}`;
    if (!groups.has(key)) groups.set(key, { w, o, order: [], coords: [] });
    const group = groups.get(key);
    group.order.push(index);
    group.coords.push(s.x1, s.y1, s.x2, s.y2);
  });
  return [...groups.values()];
}

/* ---- run ---- */
const png = decodePng(readFileSync(SOURCE));
const raster = downsample(png, TARGET_WIDTH);
const { stitches, bounds } = layStitches(raster);
const groups = bucket(stitches);
const pad = 24;

const file = `// Generated by scripts/generate-mark.mjs. Do not edit by hand.
// Re-run \`node scripts/generate-mark.mjs\` after changing the logo.
//
// The house mark, already digitised: ${stitches.length} stitches in
// ${groups.length} thread groups. Shipping it as data means the mark renders
// with the page instead of a beat after it.

export type MarkGroup = {
  /** thread weight for this pass */
  w: number;
  /** how much light this pass catches */
  o: number;
  /** stitch index of each segment, so the ceremony can reveal them in order */
  order: number[];
  /** x1, y1, x2, y2 per segment, flattened */
  coords: number[];
};

export const MARK_TOTAL = ${stitches.length};

export const MARK_VIEWBOX = "${bounds.minX - pad} ${bounds.minY - pad} ${
  bounds.maxX - bounds.minX + pad * 2
} ${bounds.maxY - bounds.minY + pad * 2}";

export const MARK_ASPECT = "${bounds.maxX - bounds.minX + pad * 2} / ${
  bounds.maxY - bounds.minY + pad * 2
}";

export const MARK_GROUPS: MarkGroup[] = ${JSON.stringify(groups)};
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, file);

console.log(
  `mark: ${stitches.length} stitches, ${groups.length} groups, viewBox ${bounds.minX - pad} ${
    bounds.minY - pad
  } ${bounds.maxX - bounds.minX + pad * 2} ${bounds.maxY - bounds.minY + pad * 2}`,
);
console.log(`written to ${OUT}`);
