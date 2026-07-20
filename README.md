# KAS THREADZ — Website

Luxury embroidery & bespoke tailoring website for **KAS THREADZ**.
Built as a fast, self-contained static site (HTML, CSS, vanilla JS) — no build step, no database, easy to host anywhere.

*Ippari Ippri ni Yadoru Geijutsu — Art in Every Stitch.*

---

## Pages

| File | Page | What it does |
|------|------|--------------|
| `index.html` | Home | Hero, brand story, specialities, fabrics, signature designs, live-studio teaser, process, testimonials |
| `gallery.html` | Designs | Filterable portfolio (Kaftans / Agbada / Senator / Custom) |
| `customize.html` | **Design Studio** | The live customiser — a garment on a stand that updates in real time as the customer picks garment, fabric, colour, sleeve length, garment length (Short / Long) and embroidery (None / Flap & Pocket). Builds an order and sends it to you on WhatsApp or email |
| `embroidery.html` | **Embroidery Only** | Order embroidery on the customer's own material — browse the design library, pick a design, choose material + placement + thread colour, and send the order |
| `about.html` | About | Vision, mission, values and brand identity |
| `contact.html` | Contact | Enquiry form (WhatsApp/email) + contact details |

---

## ⚙️ IMPORTANT — set your contact details

Open **`assets/js/main.js`** and edit the block at the top (`window.KAS_CONFIG`).
This single place feeds the whole site — the footer, the contact page and every
"Send order / WhatsApp" button.

```js
window.KAS_CONFIG = {
  brand:     "KAS THREADZ",
  whatsapp:  "2348000000000",          // ← your WhatsApp, digits only, with country code (234 = Nigeria)
  email:     "orders@kasthreadz.com",  // ← your business email
  phoneNice: "+234 800 000 0000",      // ← shown to visitors
  address:   "Abuja, Nigeria",         // ← your studio location
  instagram: "https://instagram.com/kasthreadz",
  tiktok:    "https://tiktok.com/@kasthreadz",
  facebook:  "https://facebook.com/kasthreadz",
  x:         "https://x.com/kasthreadz"
};
```

> The WhatsApp number **must** be digits only with the country code and no `+`, spaces or dashes.
> Example for Nigeria: `2348012345678`.

---

## Fabrics & prices

The five materials (Express, Focus, Seven Star, Proper Stripes, Noble Thinker) live in
**`assets/js/fabrics.js`** — each has its name, brand, photo thumbnail and a price add-on
(`add:`). The thumbnails are real photos in `assets/img/fabrics/`. The customer picks the
material style there and **any colour** separately — the preview draws the material's
stripe/weave character in the chosen colour.

Garment base prices and the other add-ons are in **`assets/js/customizer.js`**:

```js
const BASE    = { kaftan: 35000, agbada: 120000, senator: 45000, shirt: 25000 };
const EMB_ADD = { none: 0, flap: 15000 };
const LEN_ADD = { short: 0, long: 6000 };
```

The estimate = garment base + fabric add (fabrics.js) + embroidery + length. Adjust the
numbers to your real pricing. The homepage service cards and gallery captions have their
own text you can edit directly in the HTML.

---

## The embroidery design library

All design entries live in **one file: `assets/js/designs.js`** — it feeds the Embroidery
page catalogue, the design picker inside the Design Studio, and the live previews.
The images live in `assets/img/designs/` as transparent PNGs, extracted from your own
files in `Downloads\EMB DESIGNS` (the previews embedded inside the `.EMB` files, plus the
`.DST` files rendered stitch-by-stitch).

Two lists, matching your folders:
- `sets:` — **LD Flap & Pocket pairs** (LD‹n›F on the flap + LD‹n›P on the pocket,
  always shown and ordered together as one set)
- `agbada:` — **Agbada chest panels** (AGD codes). Shown for the agbada garment, and as
  the "Full Panel" option on the Embroidery page.

The names are your real file codes, so an order saying "LD 115 set (flap LD115F + pocket
LD115P)" maps straight to the machine files.

To **add** a design: drop a transparent PNG into `assets/img/designs/` and add one line to
the right list in `designs.js`, e.g. a new pair:
```js
{ id: "ld200", name: "LD 200", flap: "ld200f", pocket: "ld200p" }
```
(The site can extract the preview image hidden inside any Wilcom `.EMB` file — ask Claude
to run the extraction again when you add new EMB files to the folder.)

## Adding your own photos (optional)

The garment illustrations are generated with code, so the site looks complete without photos.
When you have real photography, you can drop images into `assets/img/` and replace any
illustration block or gallery card with an `<img>` — the layout will adapt.

---

## Brand assets

- `assets/img/logo-burgundy.png` — logo for light backgrounds
- `assets/img/logo-cream.png` — logo for dark backgrounds
- `assets/img/logo-white.png` — plain white logo
- `assets/img/favicon-*.png` — browser/tab icons

**Colours:** Burgundy `#521218` · Taupe `#CABFB1` · Off-white `#F8F8F8` · Black `#000000`
**Fonts:** Playfair Display (headings) + Open Sans (body), loaded from Google Fonts.

---

## Viewing / hosting

- **Preview locally:** just double-click `index.html` — it opens in your browser. (An internet
  connection is needed only for the Google Fonts; everything else works offline.)
- **Publish for free:** upload the whole `NEW WEBSITE` folder to any static host —
  Netlify (drag-and-drop), Vercel, GitHub Pages, or Cloudflare Pages. No server required.
- Point your domain (e.g. `kasthreadz.com`) at the host and you're live.

---

Built with care. Every stitch counts. ✦
