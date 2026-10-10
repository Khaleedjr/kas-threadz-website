import { NECKLINES } from "./catalogue";

/*
 * A few finished jallabiyas the home page shows, drawn the way Design Yours
 * draws them. Each opens Design Yours already set to it, at its own address
 * (`/loom/<slug>`), built ahead like the Loom itself, so it arrives set and
 * never flickers from the opening build to this one.
 *
 * All in cotton with embroidered cuffs and the gold pendant, the way the
 * Loom opens. A build whose colour the studio stops offering is left off the
 * home page.
 */
export type FeaturedBuild = {
  slug: string;
  /** a design's code, as carts and orders keep it */
  design: string;
  /** a cloth colour, by its hex as the studio's colour list keeps it */
  colour: string;
};

const design = (shown: number) => NECKLINES[shown - 1].code;

export const FEATURED: FeaturedBuild[] = [
  { slug: "design-01-white", design: design(1), colour: "#f4f3ef" },
  { slug: "design-07-black", design: design(7), colour: "#1b1819" },
];
