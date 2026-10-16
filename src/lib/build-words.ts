/*
 * A build in words, for the cart and checkout pages: its size, cloth,
 * design, thread, cuffs and pendant, and what it costs. Plain, so the page can use it.
 */

import { NO_DESIGN, designName } from "./catalogue";
import type { Catalogue } from "./content-defaults";
import { THREADS } from "./loom-preview";
import { extrasWords, tierFor, type PreorderGarment } from "./preorder";

/**
 * The thread a design is run in, in words, by the thread's name. Nothing at
 * all for a build with no design: there is nothing sewn to have a thread.
 */
export const threadPhrase = (name: string | undefined, plain: boolean) =>
  plain ? "" : !name || name === "As designed" ? "thread as designed" : `${name.toLowerCase()} thread`;

export function buildWords(g: PreorderGarment, cat: Catalogue) {
  const tier = tierFor(g.length);
  const colour = cat.colours.find((c) => c.hex === g.colour);
  const fabric = cat.fabrics.find((f) => f.id === g.fabric);
  const thread = THREADS.find((t) => t.id === g.thread);
  const plain = g.design === NO_DESIGN;
  return {
    tier,
    size: `${g.length}″ ${cat.terms[tier].name.toLowerCase()}`,
    cloth: `${colour?.name ?? g.colour} ${(fabric?.name ?? g.fabric).toLowerCase()}`,
    design: designName(g.design),
    plain,
    thread: threadPhrase(thread?.name, plain),
    extras: extrasWords(g),
    price: cat.terms[tier].price,
    /** a colour or cloth the studio has since taken off the Loom, or a cloth not offered yet */
    unavailable: !colour || !fabric || Boolean(fabric.soon),
    fabric,
  };
}
