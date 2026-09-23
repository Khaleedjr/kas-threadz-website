/*
 * What the studio edits in Sanity, and what the site falls back on when
 * Sanity has nothing to say: before it is connected, if it cannot be
 * reached, or if a list has been emptied. Plain data, so both the server and
 * the page can read it.
 */

import type { Piece } from "./catalogue";
import { COLOURS, FABRICS, type Fabric } from "./loom";
import { PREORDER, type PreorderTerms } from "./preorder";

export type Colour = { hex: string; name: string };

/**
 * A cloth as the Loom offers it. `finish` is how the preview draws it: matte
 * like cotton, or with a sheen like silk. A new cloth takes one of the two
 * until it has its own drawing.
 */
export type LoomFabric = Fabric & { finish: "matte" | "sheen" };

export type Photo = { url: string; alt: string };

export type Catalogue = {
  colours: Colour[];
  fabrics: LoomFabric[];
  terms: PreorderTerms;
  photos: {
    /** the home page's photograph beside the Loom */
    homeLoom: Photo | null;
    /** the atelier page's photograph */
    atelier: Photo | null;
    /** a collection piece's photograph, by its slug */
    pieces: Record<string, Photo>;
  };
};

export const DEFAULT_CATALOGUE: Catalogue = {
  colours: COLOURS,
  fabrics: FABRICS.map((f) => ({ ...f, finish: f.id === "silk" ? "sheen" : "matte" })),
  terms: PREORDER,
  photos: { homeLoom: null, atelier: null, pieces: {} },
};

/** The fabric as the drawing knows it: every sheen cloth drawn as silk, every matte one as cotton. */
export const drawnFabric = (f: LoomFabric): Fabric => ({ ...f, id: f.finish === "sheen" ? "silk" : "cotton" });

/** A collection piece's photograph: the studio's, if it has set one, or the piece's own. */
export const piecePhoto = (piece: Piece, photos: Catalogue["photos"]): Photo =>
  photos.pieces[piece.slug] ?? { url: piece.image, alt: piece.alt };
