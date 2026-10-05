/*
 * A build in words, for the cart and checkout pages: its size, cloth,
 * neckline, thread, cuffs and pendant, and what it costs. Plain, so the page can use it.
 */

import { designName } from "./catalogue";
import type { Catalogue } from "./content-defaults";
import { THREADS } from "./loom-preview";
import { extrasWords, tierFor, type PreorderGarment } from "./preorder";

export function buildWords(g: PreorderGarment, cat: Catalogue) {
  const tier = tierFor(g.length);
  const colour = cat.colours.find((c) => c.hex === g.colour);
  const fabric = cat.fabrics.find((f) => f.id === g.fabric);
  const thread = THREADS.find((t) => t.id === g.thread);
  return {
    tier,
    size: `${g.length}″ ${cat.terms[tier].name.toLowerCase()}`,
    cloth: `${colour?.name ?? g.colour} ${(fabric?.name ?? g.fabric).toLowerCase()}`,
    design: designName(g.design),
    thread: !thread || thread.id === "original" ? "thread as designed" : `${thread.name.toLowerCase()} thread`,
    extras: extrasWords(g),
    price: cat.terms[tier].price,
    /** a colour or cloth the studio has since taken off the Loom, or a cloth not offered yet */
    unavailable: !colour || !fabric || Boolean(fabric.soon),
    fabric,
  };
}
