# KAS THREADZ · Brand System

**Chosen by Outis 2026-07-23** (Khalid delegated colour authority: *"pick the one wey room go dey"*, *"we fit change logo color · na smalls"*). Superseded rounds are in `proofs/`.

---

## The concept

**The needle draws everything.** Every structural line on the site is a stitch, laid by a single needle, over cloth. Not a decorative theme: the studio's product *is* machine embroidery, and the site's visual language is the machine's own vocabulary · chalk guides, running stitch, satin fill, jump threads, tie-off knots, pattern drafting, pins, cut lines.

This was chosen over three earlier palette-first rounds that all read as competent-template. The lesson, recorded so it isn't repeated: **system-first design (palettes, tokens, layout skeletons) never reads as ingenious. Concept first, then derive colour, type and layout from it.**

## The architecture: paper & cloth

| Register | Means | Pages |
|---|---|---|
| **Cloth** (dark) | browsing, dreaming, committing | Home, Collection, individual pieces, Atelier |
| **Paper** (light) | planning, specifying, tracking | The Loom, Design Library, measurements, order tracking, invoices, admin |

The visitor crosses between them and the crossing means something: you stop admiring and start drafting, which is what a tailor actually does. It also solves legibility structurally · all dense functional UI and small type lives on paper, and dark is reserved for big type over photography.

**The bridge:** one line runs through the whole site and only changes material with context. Gold-bone **thread** on cloth → graphite **draft line** and red **cut line** on paper → **leader lines and dimension marks** wherever specs are shown. Never a cut, always a change of medium.

## Motion discipline

1. **One gesture per page.** Never two competing.
2. **Ceremony once per session.** The mark stitches itself on first arrival, then it is simply there.
3. **Ceremony is inversely proportional to intent.** First-time visitor gets the full stitching; someone checking an order gets zero animation and lands straight on the paper tracking sheet.
4. **Respond to input, never autoplay at the reader.** The thread moves when you scroll. The lamp moves with your hand.
5. **Never animate a dashed line's `stroke-dashoffset` to "draw" a stitch.** It grows solid then snaps to the dash pattern and reads as a seam flash. Running stitches must be discrete `<line>` elements revealed one by one, the needle surfacing at the far end of each.
6. **Nothing may reflow when the mark arrives.** The mark is digitised at build time and ships in the server HTML, so it paints with the page rather than a beat after it, and sewing changes nothing but pixels.

## Layout discipline

**A screen fits, on every screen.** Not "works at my window size". Sizes are expressed against the viewport · `min-h-dvh` for the hero, `clamp()` on gaps and padding, `max-h` in `dvh` on anything tall · and verified at a tall window, a short one, and a narrow one before it is called done. Fixed pixel heights are the bug that produced a cramped picker and a hero that fell off the bottom.

**The homepage gives the mark the whole first screen.** No nav at rest; the nav fades in from the top once you scroll past the hero, carrying the small solid lockup. A quiet scroll cue sits at the foot of the hero. Every other page keeps the ordinary always-present nav.

**Order in the lockup:** mark, then THREADZ set beneath it in Jost, letterspaced and at full thread contrast. The logo already carries its own woven bars, so a stitched rule between the two was one line too many.

**Never nest a fixed overlay inside a filtered or repositioned ancestor.** This bit twice. `filter`, `backdrop-filter` and `transform` all make an element the containing block for `position: fixed` descendants, and `position: relative` on a wrapper does the same job by accident. It cost us a reveal nav that mounted invisibly inside the flow, and a mobile menu that collapsed to the height of the bar it was nested in. Full-screen panels are siblings of the header, never children. `.ground-cloth` paints its weave, tooth and lift as background layers on the element itself for the same reason.

**Nothing may be economical with the space it is given.** The subject of a page · the mark, the garment, the design · takes the room; the chrome takes what is left. A configurator whose subject is a thumbnail is a form, and a library you scroll the whole window through is a filing cabinet. Panes hold one screen and scroll internally.

**Browser chrome is brand surface.** Scrollbars, selection, focus rings, form fields and number spinners all ship with the OS's taste unless they are overridden. They are styled per register in `globals.css`.

**Money is never incidental.** Prices use `.price` · mono, weight 500, tabular figures, full contrast. Never dimmed into secondary text.

**Labels over photography** use `.chip-over-photo`, which carries its own scrim. A border and thin type will vanish over a pale studio backdrop.

**The current page is always marked**, in the desktop nav with a dashed accent stitch under the label, and in the mobile menu with the accent colour plus a "Here" tag.

---

## Palette · "Ink & Bone"

Colour is a **materials list**, not a mood board. Every colour has a job.

| Token | Value | Job |
|---|---|---|
| `--color-cloth` | `#14181f` | the cloth ground |
| `--color-cloth-deep` | `#0b0e13` | its shadow / page base |
| `--color-cloth-raised` | `#1b212b` | raised cloth surface |
| `--color-thread` | `#f4efe3` | the thread · type and CTAs on cloth |
| `--color-thread-dim` | `#cbc2ad` | thread in shadow · accents, micro-labels |
| `--color-thread-bright` | `#fffdf7` | thread catching light · satin highlights |
| `--color-paper` | `#f2eee5` | pattern paper ground |
| `--color-paper-shade` | `#e7e1d3` | folded / recessed paper |
| `--color-ink` | `#232a33` | drafting ink · type and CTAs on paper |
| `--color-ink-soft` | `#5d6673` | secondary ink |
| `--color-cut` | `#9d3b2c` | the tailor's red · cut lines, current state, selection |
| `--color-pin` | `#3a6079` | the tailor's blue · pins, notes, secondary marks |

Register switching is a data attribute: `data-register="cloth" | "paper"` sets `--surface`, `--on-surface`, `--line`, `--accent`, `--action` for everything inside it. Tokens live in `src/app/globals.css`.

**Rejected and why:** anything burgundy-led as UI chrome (three rounds; reads as "all very red" and every Nigerian luxury brand does it). Warm brown-black grounds. Burgundy survives only as *cloth* (a garment colour) and in the logo itself.

## Typography

| Role | Face | Notes |
|---|---|---|
| Display | **Syne** 600-800 | The stitched mark and all headings. Heavy strokes take satin fill beautifully. |
| Body / UI | **Jost** 300-500 | Light weight default; it is a quiet face and should stay quiet. |
| Codes & annotations | **JetBrains Mono** 400-500 | Every machine code (LD 115, AGD 26, AF 63), measurement, price spec and drafting label. A code is data, never prose. |

Wired via `next/font/google` in `src/app/layout.tsx`. Letterspacing above ~0.14em is for micro-labels only, never for anything read as a sentence.

## The mark

The house logo is a needle and thread passing through **KAS**, over woven fabric bars, with THREADZ set beneath. The needle is already in the mark, which is why the concept fits.

- **Hero:** the mark satin-stitched, 1,042 stitches digitised from `public/img/brand/logo-white.png` by `scripts/generate-mark.mjs`. On a first visit an animated needle lays every stitch; after that it is simply there.
- **Nav and small sizes:** the solid logo PNG, never stitched. Stitching dies below about 40px. Cream on cloth, burgundy on paper.
- **Favicon:** the white mark, at `src/app/icon.png`.

**Open:** the logo's original vector source (AI, SVG or EPS). It would sharpen edges, allow free scaling, and, the real prize, let us separate the needle layer so the animated needle *becomes* the logo's needle and settles into place at the end of the sequence.

## The stitch engine

The shape is rasterised and read row by row. Every run of ink becomes **one discrete stitch** whose ends land on the shape's own edge, with about 1.5u of overshoot so the thread covers the boundary. Runs wider than a satin stitch can span split into staggered segments, which is genuine tatami fill and what a digitiser does with a broad area. Per-stitch weight and sheen vary so full coverage never reads as flat paint. Coverage sits at about 96%.

This runs **once, at build time**, in `scripts/generate-mark.mjs`. The output is grouped by thread weight and sheen into nine paths and written to `src/lib/mark-stitches.ts`, so the mark is nine DOM nodes in the server HTML rather than a thousand elements built in the browser. Re-run the script after any change to the logo.

**Rejected approach:** one long line per row sliced by a `clipPath`. It has no real stitch ends and reads as a hatch laid over the letters.

## Voice

Plain, specific, confident. Prices, lead times and deposits always visible (from-price, 14-day standard, 72h fast-track, 50% deposit). The house speaks in facts about craft, *"the needle runs the actual file named LD 115"*, never in luxury vapour. Tagline: **Art in every stitch.** The old pseudo-Japanese line is retired.

## Known debts

- Thread-on-cloth contrast fails at small sizes, so stitched and thread-coloured type is capped at display sizes.
- The old studio photography (9 images) will look thin next to the rest; a reshoot is needed.
- Atelier copy is placeholder-grade and needs a real writing pass.
