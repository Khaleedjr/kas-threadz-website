/**
 * How the Loom paints a configuration.
 *
 * `loom.ts` says what was built, `garment.ts` holds the pattern it is drawn
 * from, and this file finds the artwork it is embroidered with. The three are
 * kept apart so that when the showroom arrives only the drawing changes.
 *
 * A design is shown in the thread colours it was digitised in unless another
 * thread is chosen, in which case it is run in that one colour.
 */

import { luminance, shade } from "./garment";

/**
 * The 3D pane's width over its height: the garment, cuff to cuff and neck to
 * hem, with a little air, so the whole of it fills the pane.
 */
export const STAGE_3D_RATIO = 0.62;

/** What the preview needs to know about the chosen design. */
export type PreviewDesign = { code: string; image: string };

/**
 * The file for one design in one slot.
 *
 * The library files a kaftan design as a pair: `f` is the band that runs down
 * the placket, `p` is the piece that sits on the pocket. An agbada design is a
 * single chest panel, and a jallabiya neckline is its own whole image.
 */
export function designAsset(
  design: PreviewDesign | null,
  part: "placket" | "pocket" | "neckline" | "panel",
): string | null {
  if (!design) return null;
  if (part === "neckline") return design.image;
  const slug = design.code.toLowerCase().replace(/\s+/g, "");
  if (slug.startsWith("ld")) {
    if (part === "placket") return `/img/designs/${slug}f.png`;
    if (part === "pocket") return `/img/designs/${slug}p.png`;
    return null;
  }
  if (part === "panel") return `/img/designs/${slug}.png`;
  return null;
}

/**
 * The threads a design can be run in. "As designed" keeps the colours the
 * design was digitised in; any other runs the whole design in that one
 * thread, and "Tonal" in a shade of the cloth itself, a step lighter or
 * darker so it reads.
 */
export type Thread = { id: string; name: string; hex: string | null };

export const THREADS: Thread[] = [
  { id: "original", name: "As designed", hex: null },
  { id: "gold", name: "Gold", hex: "#c9a227" },
  { id: "silver", name: "Silver", hex: "#c3c8cf" },
  { id: "white", name: "White", hex: "#f6f4ee" },
  { id: "cream", name: "Cream", hex: "#e6d8b8" },
  { id: "black", name: "Black", hex: "#1f1c1d" },
  { id: "brown", name: "Brown", hex: "#6b4a2f" },
  { id: "navy", name: "Navy", hex: "#26395f" },
  { id: "maroon", name: "Maroon", hex: "#74222d" },
  { id: "tonal", name: "Tonal", hex: null },
];

/** A thread as three tones: the shadows of the stitches, the thread itself, and where it catches the light. */
export type ThreadTones = { dark: string; mid: string; light: string };

/**
 * How a design is recoloured for a thread, or null to keep its own colours.
 *
 * The design's own light and dark are kept and mapped onto the thread's
 * tones, dark to dark and light to light, so a two-colour design is still
 * readable in one thread: its darker parts simply run a deeper shade.
 */
export function threadTones(id: string, cloth: string): ThreadTones | null {
  const thread = THREADS.find((t) => t.id === id);
  if (!thread || thread.id === "original") return null;
  const mid =
    thread.id === "tonal"
      ? shade(cloth, luminance(cloth) > 0.4 ? -48 : 48)
      : (thread.hex as string);
  return { dark: shade(mid, -84), mid, light: shade(mid, 68) };
}

/**
 * A thread's tones as the three-step tables an SVG `feComponentTransfer`
 * reads: the design's darkest parts take `dark`, its middle `mid`, its
 * lightest `light`. Used by the flat drawing and the design tiles alike.
 */
export function toneTables(t: ThreadTones): { r: string; g: string; b: string } {
  const ch = (hex: string) => {
    const n = parseInt(hex.replace("#", ""), 16);
    return [(n >> 16) / 255, ((n >> 8) & 0xff) / 255, (n & 0xff) / 255].map((v) => v.toFixed(3));
  };
  const [d, m, l] = [ch(t.dark), ch(t.mid), ch(t.light)];
  return { r: `${d[0]} ${m[0]} ${l[0]}`, g: `${d[1]} ${m[1]} ${l[1]}`, b: `${d[2]} ${m[2]} ${l[2]}` };
}

/** The filter body that turns a design into one thread: to grey, then onto the thread's tones. */
export function threadFilter(t: ThreadTones): string {
  const tab = toneTables(t);
  return (
    `<feColorMatrix type="matrix" values="0.299 0.587 0.114 0 0 0.299 0.587 0.114 0 0 0.299 0.587 0.114 0 0 0 0 0 1 0"/>` +
    `<feComponentTransfer><feFuncR type="table" tableValues="${tab.r}"/>` +
    `<feFuncG type="table" tableValues="${tab.g}"/><feFuncB type="table" tableValues="${tab.b}"/></feComponentTransfer>`
  );
}
