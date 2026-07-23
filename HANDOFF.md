# KAS THREADZ · Handoff

For Khalid, and for whoever (or whatever) picks the work up next.

This is a **full replacement** for the old site, not an update to it. Different framework, different brand, different architecture. Nothing from the old repo is imported except the images.

---

## 1. Seeing it running, in ten minutes

You need [Node.js 20 or newer](https://nodejs.org). Then, in a terminal, inside the project folder:

```bash
npm install
npm run dev
```

Open **http://localhost:3000**. That is the whole site, running on your machine. Nothing is published and nobody else can see it.

To check it works the way it will in production:

```bash
npm run build
npm run start
```

### Putting it online so others can see it

The site is entirely static right now, which means hosting is free and takes about five minutes.

**Vercel** (made by the same people as the framework, easiest path):

1. Push this project to a GitHub repository you own.
2. Sign in at [vercel.com](https://vercel.com) with that GitHub account.
3. **Add New → Project**, pick the repository, press **Deploy**. Change nothing; the defaults are right.
4. You get a URL like `kas-threadz.vercel.app`. Every push to the main branch redeploys automatically.

**Pointing kasthreadz.com at it:** in the Vercel project, **Settings → Domains**, add the domain, and copy the two DNS records it gives you into wherever the domain was bought. It takes a few minutes to go live.

**Netlify or Cloudflare Pages** work identically if you prefer them. Build command `npm run build`, and they detect the rest.

### One thing to change before going live

`src/lib/site.ts` holds the studio's details in one place: the domain, the WhatsApp number, the Instagram handle, the opening hours. If any of it is wrong, fix it there and it corrects across the whole site, including what Google reads.

---

## 2. What exists today

Seven pages, all working, all fast, no database and no accounts.

| Page | What it does |
| --- | --- |
| **Home** | The house mark sews itself on your first visit, then three featured pieces and a route into the Loom. |
| **Collection** | Every piece, tagged by garment, with its design code and starting price. |
| **A piece** | One garment on a dark stage, with its code, detail, price, lead time and deposit, and a link to the design it is stitched with. |
| **Design Library** | All 43 machine files, filterable by garment. The designs themselves are the interface. |
| **The Loom** | Build a commission: garment, fabric, colour, embroidery, measurements. The estimate is always visible, and the finished order goes to WhatsApp already written out. |
| **Atelier** | The five-step story of how a piece is made. |
| **Commission** | Sends you into the Loom rather than making you fill a second form. |

### What the Loom sends you

When a customer presses **Send to the studio**, WhatsApp opens on their phone with a message already typed:

```
KAS THREADZ · commission
............................
Garment: Kaftan
Fabric: Seven Star
Colour: Navy
Embroidery: LD 115
Measurements: Chest 40" · Shoulder 18" · Length 44"
Fit: regular
Estimate: ₦68,000
(Built in the Loom)
```

They press send. It arrives on your normal WhatsApp.

### Three things worth knowing

**The design codes are real.** `LD 115` on the site is the file named LD 115 on your machine. That is the point of the whole site, and it must stay true. If a code changes, change it in `src/lib/catalogue.ts`.

**Prices are estimates and say so.** Garment base, plus fabric, plus embroidery. Set in `src/lib/loom.ts`.

**The house mark is sewn, not drawn.** It is 1,042 individual stitches worked out from your logo file. If the logo ever changes, run `node scripts/generate-mark.mjs` once and it re-does itself.

---

## 3. What it still needs from you

These are not code problems. They are the difference between a good site and a convincing one.

### Blocking, in order of impact

1. **Photographs.** There are nine garment images and they are the ceiling on how good this can look. What is needed: every piece front and back on a plain ground, a few on a person, and close-ups of the stitching. The embroidery detail matters most, because nobody else's close-ups look like yours.

   **The fabric photographs need redoing too.** The fourteen we have are small crops, 420 pixels wide and anywhere from 66 to 508 tall, so they cannot be shown large without going soft. The fabrics page presents them as narrow bands, which is honest and looks deliberate, but a proper set would let the cloth fill the page. Shoot each material flat, evenly lit, square on, at least 2000 pixels wide, one frame per colourway.
2. **The EMB and DST files** from `Downloads\EMB DESIGNS`. These unlock two things nobody in this market has: pressing play on a design and watching its real needle path run, and pricing embroidery by its true stitch count (`AGD 26 · 41,208 stitches · ₦18,400`).
3. **The logo's original file** (`.ai`, `.svg` or `.eps`), not the PNG. Sharper at every size, and it lets the needle in the logo become the needle that does the sewing.

### Questions only you can answer

- Is **senator wear** a product line? The market searches for it by name and it is not on the site yet.
- Are the **2,000+ pieces / 100% hand-finished / 72h fast-track** figures true? Unverifiable claims are currently left off.
- Two **real testimonials**, with names, ideally faces.
- Current **fabric prices**, and are all five materials still stocked?
- Does **kasthreadz.com** exist, and does `orders@kasthreadz.com` receive mail?
- Are the **lead times** right: 14 days standard, 21 for agbada, 72h fast-track?
- What is the **alteration policy**? Saying it plainly converts better than not saying it.

---

## 4. The phases

### Phase 1 · the brand (built, minus the assets above)

Everything in section 2. Static, free to host, no database. What is missing is a server-side record of orders, so that no commission exists only inside a chat thread. That needs a database, which means phase 2.

### Phase 2 · commerce

The point of this phase is that money and trust stop depending on somebody remembering to reply.

- **Accounts by phone number** with an SMS code. Email is secondary in this market. Use Termii or Twilio Verify.
- **Saved measurement profiles**, named and reusable: "Me", "Dad", "Ade". Men buy for their fathers and brothers.
- **Paystack** for card, transfer and USSD. A 50% deposit puts the piece into production, the balance is paid on completion.
- **Order tracking**, and this is the one that matters most: a page per order that moves through fabric cut, embroidery running, finishing, ready, with **a photograph at every stage** and a WhatsApp message when each one lands. Watching your own agbada being made is what makes people come back and tell people.
- **An admin board** for you: every order on one screen, one tap to change status and attach a photo, from your phone. Without this the tracking dies the week you get busy. Build it at the same time, not after.
- **Naira and dollar pricing**, because the diaspora orders for weddings and Sallah and is badly served.

Roughly: Postgres on Neon, Drizzle for the queries, Paystack, the WhatsApp Cloud API, Cloudflare R2 for the photographs.

### Phase 3 · the showroom

The virtual fitting: a mannequin that takes the customer's saved measurements and wears the garment they configured, turnable, in their fabric and colour, with their embroidery on it.

Garments modelled and cloth-simulated in Blender or Marvelous Designer, exported as compressed 3D files, rendered in the browser with React Three Fiber. Fabrics become real materials photographed up close. Embroidery goes on as a raised layer generated from the DST files.

**An honest warning:** live cloth simulation in a browser, over Nigerian mobile data, is the wrong target and will disappoint. The version that works is pre-simulated garments on a mannequin that reshapes to measurements, falling back to a spin-around video on weaker phones. Plan for that one.

The groundwork is already laid: the Loom's configuration is a plain object that says nothing about how it is drawn, so a 3D renderer can take the same object unchanged. Nothing built now gets thrown away.

### Ideas parked, with reasons

The full list is in `BUILD-MAP.md`. The ones most worth doing:

- **The Loom as a shared link** two people open at once, so a groom and six groomsmen configure together. This is the wedding order, which is where the money is.
- **Your measurements drawn as a pattern piece**, with your numbers and name on it. The most shareable thing the site could make.
- **A thread passport** for every finished order: fabric, thread colours, machine files, stitch count, dates. Like a certificate with a watch.
- **Commissioned motifs.** Someone brings an idea, you digitise it, they approve the stitch preview. The Trader Agbada already proves people want this.

---

## 5. If an AI agent picks this up

Read `AGENTS.md` first. It is short and it is binding.

The order to read things in: `AGENTS.md`, then `README.md` for how the code is arranged, then `brand.md` for why it looks the way it does, then `BUILD-MAP.md` for what is next.

---

## 6. Who to ask

The site was designed and built by Outis with Khalid. Decisions about colour, type and layout are recorded with their reasoning in `brand.md`, including the things that were tried and rejected, so that nobody re-litigates them by accident.
