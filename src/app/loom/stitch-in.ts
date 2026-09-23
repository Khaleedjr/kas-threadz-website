import { NECKLINE_FIT } from "@/lib/neckline-fit";
import { STITCHES, STITCH_DURATION, STITCH_FRONT } from "@/lib/stitching";

/*
 * Sewing a neckline into the flat drawing, the way the house mark sews
 * itself on the home page: stitch by stitch, with the needle at the working
 * edge. It runs when a design is chosen, never on arrival: the preview
 * answers the visitor, it does not perform at them.
 *
 * The drawing carries everything this needs (see `necklineLayer` in
 * `jallabiya-flat.ts`): the design under a mask made from its sewing order,
 * a chalk guide of the whole design, and a hidden needle. This only moves
 * them, so the drawing is never rebuilt while the needle runs.
 */

/** How far the needle lifts out of the cloth between stitches, in drawing units. */
const LIFT = 3.5;

export type Stitching = {
  /** finish at once, leaving the design sewn */
  stop: () => void;
  /** put the current stitch back on a drawing that was just rebuilt, such as after a colour change */
  apply: () => void;
};

export function stitchIn(root: HTMLElement, href: string, onDone?: () => void): Stitching {
  const track = NECKLINE_FIT[href]?.track ?? [];
  const points = track.length / 2;
  const start = performance.now();
  let stitch = 0;
  let finished = false;
  let frame = 0;

  const paint = () => {
    const design = root.querySelector<SVGImageElement>('[data-stitch="design"]');
    // the drawing has moved on to another design: nothing here to sew
    if (!design || design.dataset.href !== href) return;
    const t = finished ? 1 : stitch / STITCHES;

    // past the end of the order is fully sewn; at t, everything sewn before t
    const intercept = finished ? STITCH_FRONT * 2 : STITCH_FRONT * t;
    root
      .querySelectorAll('[data-stitch="front"] > *')
      .forEach((f) => f.setAttribute("intercept", String(intercept)));
    root.querySelector('[data-stitch="chalk"]')?.setAttribute("opacity", finished ? "0" : "0.55");

    const needle = root.querySelector<SVGGElement>('[data-stitch="needle"]');
    if (!needle) return;
    if (finished || points < 2) {
      needle.style.display = "none";
      return;
    }
    const [bx, by, bw, bh] = (design.dataset.box ?? "0 0 0 0").split(" ").map(Number);
    // where the front is along the needle's track, between two of its points
    const f = Math.min(points - 1, Math.max(0, t * points - 0.5));
    const i = Math.floor(f);
    const j = Math.min(points - 1, i + 1);
    const k = f - i;
    const x = track[2 * i] + (track[2 * j] - track[2 * i]) * k;
    const y = track[2 * i + 1] + (track[2 * j + 1] - track[2 * i + 1]) * k;
    const lift = stitch % 2 ? -LIFT : 0;
    needle.style.display = "";
    needle.setAttribute("transform", `translate(${bx + x * bw} ${by + y * bh + lift})`);
  };

  const finish = () => {
    if (finished) return;
    finished = true;
    window.clearInterval(keepalive);
    cancelAnimationFrame(frame);
    paint();
    onDone?.();
  };

  // requestAnimationFrame alone stalls in a background tab, which would leave
  // the design half sewn for anyone who switches away and comes back
  const tick = () => {
    if (finished) return;
    stitch = Math.min(STITCHES, Math.floor(((performance.now() - start) / STITCH_DURATION) * STITCHES));
    if (stitch >= STITCHES) return finish();
    paint();
    frame = requestAnimationFrame(tick);
  };
  const keepalive = window.setInterval(tick, 100);

  // the first stitch is painted now, before the browser paints the new
  // drawing, so the finished design never flashes up first
  paint();
  frame = requestAnimationFrame(tick);

  return { stop: finish, apply: paint };
}
