/*
 * What the studio edits in its dashboard, and what the site stands on when
 * nothing has been edited yet. Plain data, so both the server and the page
 * can read it.
 */

import { PIECES, type Piece } from "./catalogue";
import { COLOURS, FABRICS, type Fabric } from "./loom";
import { PREORDER, type PreorderTerms } from "./preorder";

export type Colour = { hex: string; name: string; hidden?: boolean };

/**
 * A cloth as the Loom offers it. `finish` is how the preview draws it: matte
 * like cotton, or with a sheen like silk. A new cloth takes one of the two
 * until it has its own drawing.
 */
export type LoomFabric = Fabric & { finish: "matte" | "sheen"; hidden?: boolean };

/** A made-to-order piece in the collection. */
export type ShopPiece = Piece & { hidden?: boolean };

export type Photo = { url: string; alt: string };

/**
 * Everything the studio edits. The dashboard sees all of it; the site sees
 * it with whatever is hidden taken out (see `getCatalogue`).
 */
export type Catalogue = {
  colours: Colour[];
  fabrics: LoomFabric[];
  /** the jallabiya preorder's prices and set counts */
  terms: PreorderTerms;
  preorder: {
    /** closed, the Loom still builds but nobody can pay */
    open: boolean;
    /** a line under the Loom's heading */
    description: string;
  };
  pieces: ShopPiece[];
  photos: {
    /** the home page's photograph beside the Loom */
    homeLoom: Photo | null;
    /** the atelier page's photograph */
    atelier: Photo | null;
  };
};

export const DEFAULT_CATALOGUE: Catalogue = {
  colours: COLOURS,
  fabrics: FABRICS.map((f) => ({ ...f, finish: f.id === "silk" ? "sheen" : "matte" })),
  terms: PREORDER,
  preorder: {
    open: true,
    description:
      "Cut to your length in the cloth, colour and neckline you choose. One price covers all of it, paid in full to hold your set.",
  },
  pieces: PIECES,
  photos: { homeLoom: null, atelier: null },
};

/** The fabric as the drawing knows it: every sheen cloth drawn as silk, every matte one as cotton. */
export const drawnFabric = (f: LoomFabric): Fabric => ({ ...f, id: f.finish === "sheen" ? "silk" : "cotton" });
