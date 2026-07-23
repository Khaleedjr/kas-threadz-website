<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes. APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# KAS THREADZ · standing rules

Read `README.md` for how the code is arranged and `brand.md` for why it looks the way it does. `BUILD-MAP.md` is the plan of record. `HANDOFF.md` explains the project to a human.

These rules are binding. Most of them exist because breaking them already cost real time.

## The one idea

**The needle draws everything.** The studio's product is machine embroidery, so the interface uses the machine's vocabulary: chalk guides, running stitch, satin fill, jump threads, tie-off knots, pattern drafting, pins, cut lines. This is not decoration laid on afterwards. If a new element cannot be explained in those terms, it probably does not belong.

**Every design code is real.** `LD 115` on screen is the file named LD 115 on the studio's machine. Never invent a code, never rename one for tidiness, never show a placeholder code. They are data. They are always mono.

## Writing

- **No em dashes or en dashes.** Anywhere: copy, comments, commit messages, documentation. Use a full stop, a comma, a colon, or a middle dot. This is checked.
- Plain, specific, confident. Prices, lead times and deposits are always visible.
- The house speaks in facts about craft, never in luxury vapour.
- No AI attribution or co-author lines in commits.

## Layout

- **A screen fits, on every screen.** Not "works on my window". Size against the viewport: `min-h-dvh`, `clamp()` on gaps and padding, `dvh` caps on anything tall. Verify at a tall window, a short one and a narrow one before calling anything done. Fixed pixel heights are how a cramped picker and a hero falling off the bottom both happened.
- **Nothing is economical with the space it is given.** The subject of a page, the mark or the garment or the design, takes the room. Chrome takes what is left. A configurator whose subject is a thumbnail is a form. A library you scroll the whole window through is a filing cabinet. Panes hold one screen and scroll internally.
- **The register decides everything.** A page sets `data-register="cloth"` or `data-register="paper"` and every child reads the right ground, rules, accent and action colour. Do not hardcode a colour that a token already provides.
- **Browser chrome is brand surface.** Scrollbars, selection, focus rings, form fields and number spinners are styled in `globals.css`. Do not leave a new control looking like an OS widget.

## Three traps that have already bitten

1. **`filter`, `backdrop-filter`, `transform` and a stray `position: relative` all make an element the containing block for `position: fixed` descendants.** This silently broke the reveal nav, then the mobile menu. Full-screen panels are siblings of the header, never children. Full-bleed grounds paint their layers on the element itself, never via an overlay pseudo-element that needs its siblings repositioned.
2. **Never animate a dashed line's `stroke-dashoffset` to fake sewing.** It grows as a solid line and then snaps into dashes, which reads as a seam. Running stitches are discrete elements revealed one at a time, the needle surfacing at the far end of each.
3. **When a client effect replaces server-rendered content that a class is hiding, commit the replacement with `flushSync` before removing the class.** A plain `setState` lands on a later task, so the class comes off while the server's markup is still in the DOM and the browser paints a frame of it. That is what made the finished mark flash before the ceremony. Measured at the instant of reveal, the first path still carried 4,098 characters of the completed stitch run; forcing the commit first brought it to 20, which is one stitch.

## Motion

- One gesture per page. Never two competing.
- Ceremony once per session. The mark sews itself on first arrival, then it is simply there.
- Ceremony is inversely proportional to intent. A first-time visitor gets the full stitching; somebody checking an order gets none.
- Respond to input, never autoplay at the reader.
- Everything honours `prefers-reduced-motion`.

## The house mark

Digitised at build time by `scripts/generate-mark.mjs` into `src/lib/mark-stitches.ts`. **Do not edit that file by hand.** After any change to the logo, run:

```bash
node scripts/generate-mark.mjs
```

It must keep shipping in the server HTML. If a change makes the mark arrive after the page instead of with it, the change is wrong.

At small sizes the mark is the solid logo, never stitched. Stitching dies below about 40px.

## Before you say something is done

```bash
npx tsc --noEmit     # must be clean
npx eslint src scripts   # must be clean
npm run build        # must succeed
```

Then look at it. In a browser. At three window sizes. Screenshots of the thing running are the evidence, not a description of what the code should do.

## Working style

- Verify against the source before claiming anything. These docs are a snapshot and can go stale; the code is the truth.
- Do not declare a design decision "locked" or "final". That is the owner's word to use.
- Prefer building one thing properly over presenting several options as a grid. Judgement happens on artifacts, not descriptions.
- When something is a stand-in, say so in the code and in the summary. The Loom's colour preview tints a photograph because per-colour renders do not exist yet; that is written down rather than glossed over.
- If a fix is not verified, it is not fixed.
