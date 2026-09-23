/*
 * How a chosen neckline is sewn into the cloth, shared by the flat preview
 * (`src/app/loom/stitch-in.ts`) and the 3D one (`jallabiya-3d.ts`) so the
 * two sew at the same pace.
 *
 * Every neckline carries its sewing order (see `scripts/neckline-designs.py`):
 * 0 is the first stitch, 1 the last. A design shows wherever its order is
 * below the mark sewn so far, and the mark moves in whole stitches.
 */

/** How long the needle takes. The house mark takes 4.2s; a neckline is less thread. */
export const STITCH_DURATION = 3400;

/** Stitches, each a discrete step of the sewing order, as the machine lays them. */
export const STITCHES = 110;

/**
 * How sharp the stitching front is: the design fades in over this fraction
 * of its sewing order, one sixtieth, a stitch or so wide.
 */
export const STITCH_FRONT = 60;

/** Tailor's chalk for the guide sewn over: blue on light cloth, white on dark. */
export const chalkFor = (luminance: number) => (luminance > 0.45 ? "#6f84a3" : "#f3efe6");
