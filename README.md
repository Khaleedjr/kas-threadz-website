# KAS THREADZ

The website for KAS THREADZ, a luxury embroidery and bespoke tailoring house in Abuja. Kaftan, senator, jallabiya and agbada, cut to measure and embroidered from the studio's own machine files.

This is a complete rebuild. It replaces the previous static HTML site entirely.

```bash
npm install
npm run dev        # http://localhost:3000
```

---

## What makes this site different

Every design code on the site is a real embroidery-machine file. Choosing `LD 115` in the Loom means the embroidery head runs the file named LD 115. The codes are data, never decoration, and they are set in mono wherever they appear.

The design language follows from that: **the needle draws everything.** The house mark is satin-stitched on screen by an animated needle, structural rules are running stitches, and the interface borrows the vocabulary of the workshop rather than of the web.

## The two registers

The site has two grounds and the visitor moves between them.

| Register | What it is for | Pages |
| --- | --- | --- |
| **Cloth** (dark) | browsing, dreaming, committing | Home, Collection, individual pieces, Atelier |
| **Paper** (light) | planning, specifying, tracking | The Design Library, The Loom |

A page declares its world with `data-register="cloth"` or `data-register="paper"` and every child picks up the right ground, rules, accent and action colour automatically. This also solves legibility: dense functional interface and small type live on paper, and dark is reserved for large type over photography.

Full design system: [`brand.md`](./brand.md). Roadmap, requirements and idea backlog: [`BUILD-MAP.md`](./BUILD-MAP.md).

## Stack

- **Next.js 16** (App Router) and TypeScript
- **Tailwind v4**, with brand tokens declared in `@theme` in `src/app/globals.css`
- **next/font** for Syne, Jost and JetBrains Mono
- No UI library. The components here are few and specific.

## Layout

```
scripts/
  generate-mark.mjs     digitises the logo into stitch data (build-time)
src/
  app/
    layout.tsx          fonts, metadata, the pre-paint ceremony guard
    globals.css         brand tokens, register switch, browser chrome
    page.tsx            home (cloth)
    collection/         grid and individual piece pages (cloth)
    library/            the design library (paper)
    loom/               the configurator (paper)
    atelier/            the studio story (cloth)
    commission/         redirects into the Loom
    icon.png            favicon, generated from the house mark
  components/
    site-chrome.tsx     nav, reveal nav, mobile menu, footer
    stitched-mark.tsx   the satin-stitched house mark
    running-rule.tsx    a rule sewn as a running stitch
  lib/
    catalogue.ts        pieces and the design library
    loom.ts             configurator data, pricing, lighting
    stitch.ts           stitch primitives
    mark-stitches.ts    generated; do not edit by hand
public/img/
  brand/ designs/ fabrics/ work/
```

## The house mark

The mark is not an image and not a font. It is 1,042 individual stitches, digitised from `public/img/brand/logo-white.png` at build time.

```bash
node scripts/generate-mark.mjs   # re-run after changing the logo
```

The script decodes the PNG, reads it row by row, and turns every run of ink into one discrete stitch whose ends land on the shape's own edge. Runs too wide for a single satin stitch are split into a staggered tatami fill, which is what a digitiser does with a broad area. The output is grouped by thread weight and sheen into nine paths, so the mark is nine DOM nodes rather than a thousand.

Because it ships as data, the finished mark is in the server HTML and paints with the rest of the page. On a first visit an inline script hides it before paint and the component sews it stitch by stitch; after that, `sessionStorage` remembers and the mark is simply there. Without JavaScript it renders finished.

That server-first arrangement is also why the component empties the paths with `flushSync` on its first frame, before it lifts the hiding class. See trap 3 under Conventions.

## Conventions

- **Prices** use the `.price` class: mono, weight 500, tabular figures, full contrast. Money is never dimmed into secondary text.
- **Machine codes** are always mono.
- **Micro-labels** use `.label`. Letterspacing above about `0.14em` is for labels only, never for anything read as a sentence.
- **Labels over photography** use `.chip-over-photo`, which carries its own scrim.
- **A screen fits on every screen.** Sizes are expressed against the viewport (`min-h-dvh`, `clamp()`, `dvh` caps), and verified at a tall window, a short one and a narrow one.
- **No em dashes**, in code comments or in copy.

Three traps worth knowing, because all of them have already cost time:

1. `filter`, `backdrop-filter`, `transform` and a stray `position: relative` all make an element the containing block for `position: fixed` descendants. Full-screen panels are siblings of the header, never children.
2. Never animate a dashed line's `stroke-dashoffset` to fake sewing. It grows as a solid line and then snaps into dashes. Running stitches are discrete elements revealed one at a time.
3. When a client effect replaces server-rendered content that a class is hiding, commit the replacement with `flushSync` before removing the class. A plain `setState` is applied on a later task, so the class comes off while the server's markup is still in the DOM and the browser can paint a frame of it. This is what made the finished mark flash before the ceremony.

## Ordering

Phase 1 ends in a structured WhatsApp handoff. The Loom composes the full commission (garment, fabric, colour, design, measurements, estimate) and hands it to `wa.me`. Server-side order logging, deposits and tracking arrive in phase 2; see `BUILD-MAP.md`.

The studio's number lives in `src/components/site-chrome.tsx` and `src/app/loom/loom.tsx`.

## Still needed from the studio

1. The **EMB/DST source files**, which unlock stitch playback and stitch-count pricing.
2. The **logo's vector source** (AI, SVG or EPS), for a sharper mark at any size.
3. A **photography reshoot**. The nine images here are the studio's existing set and will look thin beside the rest.
4. Confirmation on senator wear as a named line, real testimonials, current fabric pricing, and whether `kasthreadz.com` exists.
