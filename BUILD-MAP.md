# KAS THREADZ · Build Map

Design system: `brand.md`. Mocks and proofs: `proofs/`. This file is the plan of record.

---

## Where we are

Phase 1 is built and running. Seven routes, all responding, typecheck clean, verified at tall, short and narrow viewports.

| Built | Notes |
|---|---|
| Brand tokens and the register switch | `globals.css`, `data-register="cloth" \| "paper"` |
| Typography | Syne / Jost / JetBrains Mono via `next/font` |
| The stitched house mark | digitised at build time, 1,042 stitches, 9 paths |
| Site chrome | reveal nav, mobile menu, active-page marking, footer |
| Home (cloth) | full-screen hero, collection rail, Loom teaser |
| Collection + piece pages (cloth) | dark stage, prev/next, statically generated |
| Design Library (paper) | filterable grid of all 43 machine files |
| The Loom (paper) | garment, fabric, colour, embroidery, measurements, estimate, **light switch** |
| Atelier (cloth) | story and five-step process |
| Browser chrome | scrollbars, selection, focus, form fields, favicon |
| Docs | `README.md`, `brand.md`, this file |

## What is left in phase 1

1. **Order logging.** The Loom hands off to WhatsApp; it must write the order server-side first so nothing exists only in a chat thread. Needs the database.
2. **Real copy for the Atelier**, and a decision on the inherited stats and testimonials.
3. **Photography reshoot.** The nine existing images are the ceiling on how good this can look.
4. **Logo vector**, for a sharper mark and the needle-settles-into-place moment.

## The proofs (keep: they are the spec for how things move)

| File | What it proves |
|---|---|
| `needle.html` | The founding concept: one needle draws every structural line. |
| `mix.html` | The archive layer: specimen-plate annotations, dimension lines, leader labels. |
| `thread.html` | Scroll behaviour: one unbroken thread becomes every line, ends in a tie-off knot. |
| `cutting.html` | The paper register: drafting, seam allowances, notches, pins, red tracing wheel. |
| `night.html` | Lamp-reveal inspection mode (single-page use only; hiding content fights conversion). |
| `hero.html` | The satin-stitch engine on type. |
| `logo.html` | The satin-stitch engine on the real house mark. |
| `mocks.html` | All six pages in the final system. |

## Phase 2 · commerce

Phone-OTP auth (Termii/Twilio Verify · email is secondary in this market), saved **measurement profiles** (named, reusable, family), Paystack (card / transfer / USSD) with 50% deposit model, orders + `order_events`, **Track an order** with a photo per stage, WhatsApp Cloud API notifications, admin pipeline board with one-tap status + photo upload, NGN and USD display for diaspora.

## Phase 3 · the showroom

3D configurator (React Three Fiber), garments modelled and cloth-simmed in Marvelous Designer / Blender, exported as Draco-compressed glTF with KTX2 textures; fabrics as PBR materials derived from macro photography; embroidery as normal-mapped decals; **mannequin morphs to the customer's saved measurements.**

**Reality check:** live cloth simulation in-browser on Nigerian mobile data is the wrong target. The achievable version is pre-simulated garments on a morphable mannequin with a decal embroidery layer. Degrades to pre-rendered turntables on weak devices.

### What phase 1 must do now so phase 3 is possible
1. **The configuration object is the bridge.** `{garment, fabric, colour, design, placement, measurements}` must be serializable and independent of how it is rendered. Phase 1 renders it 2D; phase 3 hands the identical object to a 3D renderer.
2. **Preview sits behind a renderer interface.** `Renderer2D` now, `Renderer3D` later · a component swap, not a rewrite.
3. **Measurements are a first-class entity**, not form fields. Named, saved, reusable.
4. **Asset structure holds glTF + PBR later.** Fabric macro photography shot once, correctly.

---

## Idea backlog (approved / parked)

### ★ Approved by Outis 2026-07-23
- **Fabric light switch.** Daylight / tungsten / evening toggle on every fabric and colour preview. Colour anxiety is the top reason people don't buy cloth online, and a wine kaftan genuinely looks like three garments under those lights. Cheap; disproportionately reassuring. → *build in phase 1 alongside the Loom.*
- **The Loom as a shared session.** One live configurator link two people can open at once · a groom with six groomsmen, or a customer on a call with Khalid. Solves the wedding/group order, which is where the money is in this market. Nobody local has it. → *phase 2 (needs accounts + realtime).*

### Signature features (the reasons to visit)
- **Stitch-path playback / scrubber.** Hover or scrub a design in the library and watch its real needle path run in order · the DST as a timeline. The single most ownable feature on the site. *Needs DST files.*
- **Price by stitch count.** Quote embroidery from the true DST stitch count: `AGD 26 · 41,208 stitches · ₦18,400`. Radical pricing transparency; turns the machine files into a customer-facing asset. *Needs DST files.*
- **Your measurements become a pattern piece.** Entering measurements draws *your* pattern panel on the cutting table, with your numbers, name and date. The most shareable artifact the site could produce.
- **Lamp inspection mode.** The `night.html` mechanic as a single-piece feature: a work lamp follows the cursor and only what it lights is visible, with stitch annotations readable inside the light. Inspection becomes the interaction. **One page only** · hiding content fights conversion.
- **Specs toggle.** The archive/annotation layer (`mix.html`) as an on-demand control, not a permanent state: turn it on and whatever you're looking at gets dimension lines, leader labels, stitch type, thread weight, file name. Charming, and easily overdone · must be opt-in.
- **Thread passport.** Every finished order gets a provenance card: piece, fabric, thread colours, machine files, stitch count, dates, maker. Like a watch certificate. Printable label with a QR that opens it.
- **Motif commissions.** Customer submits an idea or image, studio digitises it, customer approves a stitch preview before it goes on the garment. High margin, deeply on-brand · "The Trader Agbada" with its candlestick-chart panel already proves the demand.
- **Watch it stitched.** Any piece page can replay how its embroidery was made. Ties the library, the product and the atelier story together.

### Commerce & trust
- **Order tracking as the trust engine.** A stage-by-stage order page where Khalid uploads a photo at each step (fabric cut → embroidery running → finishing → ready), each firing a WhatsApp notification. Watching your own agbada get made is retention and referral in one feature.
- **Deposit model.** 50% to enter production, balance on completion. Always stated up front.
- **Family / multiple measurement profiles.** Named and reusable ("Me", "Dad", "Ade") · men buy for fathers and brothers.
- **NGN + USD pricing.** The diaspora orders for weddings and Sallah from abroad and is badly served.
- **Capacity honesty.** Show real remaining commission slots per week. Real scarcity, never a fake timer.
- **Policy clarity as conversion.** Lead time, fast-track price, deposit, and a stated alteration policy visible before the ask. Ambiguity is the killer in bespoke; clarity is free trust.
- **Real testimonials only.** Two with names and faces, or none. Everything unverifiable gets cut, including the inherited 2K+/100%/72h stats until Khalid confirms them.
- **Instagram as the funnel.** Embed the live feed; Meta Pixel from day one. Instagram is the top of this funnel, not search.

### Studio-side (without this, the system dies the week Khalid gets busy)
- **Admin pipeline board.** Order states, one-tap status updates with photo upload from a phone.
- **Catalogue and price management.** No code changes to add a piece or move a price.
- **EMB/DST uploader.** Drop a machine file in, get the preview render, stitch count and catalogue entry automatically.

### Product line
- **Senator wear as a named product.** The short fitted tunic over slim trousers. The old site had it hidden inside a "Short/Long" toggle; the market searches for it by name constantly. *Needs Khalid's confirmation.*
- **The cap (fila / hula) as an add-on SKU.** Agbada already sells as a set with a cap; it photographs beautifully.

---

## Technical requirements by page

| Page | 2D / assets | 3D | Backend |
|---|---|---|---|
| Home | Campaign photography (reshoot), logo vector | · | Featured pieces (static config first) |
| Collection | Ghost-mannequin + on-model per piece | P3: glTF turntables | `pieces` table |
| Design Library | 55 mask PNGs (have), re-renders from DST | · | `designs` table; **stitch playback needs Khalid's EMB/DST** |
| The Loom | Fabric swatches (macro reshoot), mask overlays, light switch | P3: R3F configurator | Pricing rules, draft persistence, measurement profiles |
| Commission | · | · | Paystack, deposits, `orders`, OTP auth, WhatsApp handoff |
| Track | Stage photos from Khalid | · | `order_events`, media storage, WhatsApp notifications |
| Atelier | Studio photo + film shoot | · | · |
| Admin | · | · | Pipeline board, catalogue CRUD, EMB/DST uploader → auto preview |

## Stack

Next 16 (App Router) + TypeScript + Tailwind v4 · Zustand (configurator state) · Framer Motion · Postgres (Neon) + Drizzle · Paystack · WhatsApp Cloud API · Resend · Cloudflare R2 · Vercel · Plausible/PostHog + Meta Pixel (Instagram is the funnel) · Sentry.
**DST service:** Python + pyembroidery, parses EMB/DST → stitch sequence JSON + previews. Feeds library playback, stitch-count pricing, and phase-3 decals.

---

## Open asks from Khalid

1. **EMB/DST source files** (`Downloads\EMB DESIGNS`) · unlocks stitch playback, stitch-count pricing, 3D embroidery.
2. **Logo vector** (AI / SVG / EPS) · sharper mark, free scaling, and lets the animated needle become the logo's own needle.
3. Confirm senator wear as a named product line.
4. Real testimonials (2 with names/faces) · everything unverifiable gets cut.
5. Current fabric stock and pricing.
6. Does `kasthreadz.com` / `orders@kasthreadz.com` actually exist?
7. Photography: can we shoot? (ghost-mannequin front/back, on-model, macro stitch detail, studio/process.)
