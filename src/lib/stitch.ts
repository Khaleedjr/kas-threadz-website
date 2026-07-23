/**
 * Stitch primitives.
 *
 * The house mark is digitised ahead of time by `scripts/generate-mark.mjs`,
 * which reads the logo and emits `mark-stitches.ts`. That is where the satin
 * fill logic lives, because it only needs to run when the logo changes.
 *
 * What is left here is the stitching the site draws for itself.
 */

export type Stitch = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** thread weight for this pass */
  w: number;
  /** how much light this pass catches */
  o: number;
};

/** Deterministic wobble. Real stitching is never machine-perfect, but it must
 *  not shimmer between renders. */
function makeRandom(seed: number) {
  let s = seed;
  return () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff - 0.5);
}

/**
 * A running stitch: discrete lengths of thread with a gap between them.
 * Deterministic, so it renders on the server with no client JavaScript.
 *
 * Never fake this by animating a dashed line's `stroke-dashoffset`. It grows
 * as a solid line and then snaps into dashes, which reads as a seam rather
 * than as sewing.
 */
export function runningStitch(
  length: number,
  options: { stitch?: number; gap?: number; weight?: number; seed?: number } = {},
): Stitch[] {
  const { stitch = 8.2, gap = 5.2, weight = 2.6, seed = 7 } = options;
  const rand = makeRandom(seed);
  const out: Stitch[] = [];
  for (let x = 1; x + stitch <= length - 1; x += stitch + gap) {
    const y = rand() * 0.5;
    out.push({
      x1: x,
      y1: y,
      x2: x + stitch,
      y2: y,
      w: weight + rand() * 0.5,
      o: 0.78 + Math.abs(rand()) * 0.3,
    });
  }
  return out;
}
