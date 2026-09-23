/*
 * The receipt: a picture of each jallabiya as it was built, in its cloth,
 * colour, neckline and thread, with the order written out beside it, on
 * the house's paper. Drawn on the server from the same drawing the Loom
 * shows, so the customer keeps exactly what they paid for.
 *
 * The receipt's address carries a signature, so an order can only be seen
 * by someone it was given to. Server only.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { ImageResponse } from "next/og";
import { naira } from "./catalogue";
import type { Catalogue } from "./content-defaults";
import { FLAT_RATIO, buildJallabiyaFlat } from "./jallabiya-flat";
import { THREADS, threadTones } from "./loom-preview";
import { NECKLINES } from "./catalogue";
import { describe } from "./preorder-server";
import { itemsOf, type OrderItem, type StoredOrder } from "./preorder-store";
import { SITE } from "./site";

/* ------------------------------------------------------------ the address */

const secret = () =>
  process.env.RECEIPT_SECRET || process.env.PAYSTACK_SECRET_KEY || process.env.STUDIO_PASSWORD || "kas-threadz-local";

/** The signature a receipt's address carries: the reference, signed. */
export const receiptKey = (reference: string) =>
  createHmac("sha256", secret()).update(`receipt:${reference}`).digest("hex").slice(0, 32);

export const receiptPath = (reference: string) => `/receipt/${reference}.png?k=${receiptKey(reference)}`;

export function receiptKeyMatches(reference: string, key: string | null): boolean {
  if (!key) return false;
  const a = Buffer.from(receiptKey(reference));
  const b = Buffer.from(key.slice(0, 64));
  return a.length === b.length && timingSafeEqual(a, b);
}

/* ------------------------------------------------------------ the drawing */

const PAPER = "#f2eee5";
const INK = "#232a33";
const SOFT = "#5d6673";
const CUT = "#9d3b2c";
const LINE = "rgba(35,42,51,0.28)";

/* the images the drawing links to, read once per server and kept */
const assets = new Map<string, Promise<string>>();
function asDataUri(origin: string, path: string, type: string): Promise<string> {
  let p = assets.get(path);
  if (!p) {
    p = fetch(`${origin}${path}`).then(async (r) => {
      if (!r.ok) throw new Error(`${path}: ${r.status}`);
      return `data:${type};base64,${Buffer.from(await r.arrayBuffer()).toString("base64")}`;
    });
    p.catch(() => assets.delete(path));
    assets.set(path, p);
  }
  return p;
}

const fonts = new Map<string, Promise<ArrayBuffer>>();
function font(origin: string, file: string) {
  let p = fonts.get(file);
  if (!p) {
    p = fetch(`${origin}/fonts/receipt/${file}`).then((r) => {
      if (!r.ok) throw new Error(`${file}: ${r.status}`);
      return r.arrayBuffer();
    });
    p.catch(() => fonts.delete(file));
    fonts.set(file, p);
  }
  return p;
}

/** One jallabiya, drawn as the Loom draws it, finished, as an image the receipt can hold. */
async function garmentImage(item: OrderItem, cat: Catalogue, origin: string): Promise<string> {
  const g = item.garment;
  const design = NECKLINES.find((n) => n.code === g.design);
  const fabric = cat.fabrics.find((f) => f.id === g.fabric);
  let svg = buildJallabiyaFlat({
    color: g.colour,
    fabric: fabric?.finish === "sheen" || g.fabric === "silk" ? "silk" : "cotton",
    neckline: design?.image ?? null,
    thread: threadTones(g.thread, g.colour),
    length: g.length,
  });
  // the stitching machinery is for sewing it in on the page; the receipt shows it sewn
  svg = svg
    .replace(/<g data-stitch="needle"[\s\S]*?<\/g>/, "")
    .replace(/<image data-stitch="chalk"[^>]*\/>/, "")
    .replace(/ mask="url\(#sewn[^)]*\)"/g, "");
  const links = [...new Set([...svg.matchAll(/href="(\/img\/[^"]+\.png)"/g)].map((m) => m[1]))];
  for (const path of links) {
    if (path.endsWith("-order.png")) continue;
    svg = svg.split(`href="${path}"`).join(`href="${await asDataUri(origin, path, "image/png")}"`);
  }
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

const when = new Intl.DateTimeFormat("en-NG", { dateStyle: "long", timeStyle: "short", timeZone: "Africa/Lagos" });

/** How many of an order's builds are drawn; the rest are listed in words. */
const DRAWN = 6;

export async function receiptImage(order: StoredOrder, cat: Catalogue, origin: string): Promise<ImageResponse> {
  const items = itemsOf(order);
  const drawn = items.slice(0, DRAWN);
  const pictures = await Promise.all(drawn.map((i) => garmentImage(i, cat, origin)));
  const logo = await asDataUri(origin, "/img/brand/logo-burgundy.png", "image/png");
  const [syne, jost, jostMedium, mono, monoMedium, nairaSign, nairaSignMedium] = await Promise.all([
    font(origin, "Syne-Bold.ttf"),
    font(origin, "Jost-Regular.ttf"),
    font(origin, "Jost-Medium.ttf"),
    font(origin, "JetBrainsMono-Regular.ttf"),
    font(origin, "JetBrainsMono-Medium.ttf"),
    // JetBrains Mono has no naira sign: these hold only that one, from Noto Sans Mono
    font(origin, "Naira-Regular.ttf"),
    font(origin, "Naira-Medium.ttf"),
  ]);

  const W = 1080;
  const pad = 64;
  const single = items.length === 1;
  const perRow = single ? 1 : items.length === 2 || items.length === 4 ? 2 : 3;
  const gap = 24;
  const cardW = single ? W - pad * 2 : Math.floor((W - pad * 2 - gap * (perRow - 1)) / perRow);
  const picW = single ? 330 : Math.min(cardW - 40, perRow === 2 ? 300 : 240);
  const picH = Math.round(picW / FLAT_RATIO);
  const rows = Math.ceil(drawn.length / perRow);
  const cardH = single ? picH + 48 : picH + 250;
  const extra = items.length > DRAWN ? 60 : 0;
  const H = 300 + rows * cardH + (rows - 1) * gap + extra + 470;

  const sets = items.reduce((n, i) => n + i.qty, 0);
  const subtotal = order.subtotal ?? items.reduce((n, i) => n + i.price * i.qty, 0);
  const d = order.delivery;
  const first = order.customer?.name.split(" ")[0];

  const label = (text: string, color = SOFT) => (
    <div style={{ fontFamily: "Mono, Naira", fontSize: 17, letterSpacing: 3.5, textTransform: "uppercase", color }}>{text}</div>
  );

  const lineOf = (item: OrderItem) => {
    const w = describe(item.garment, cat);
    const thread = THREADS.find((t) => t.id === item.garment.thread);
    return {
      size: `${item.garment.length}″ ${cat.terms[w.tier].name.toLowerCase()}`,
      cloth: `${item.described?.colour || w.colour} ${(item.described?.fabric || w.fabric).toLowerCase()}`,
      design: item.garment.design,
      thread: !thread || thread.id === "original" ? "thread as designed" : `${thread.name.toLowerCase()} thread`,
    };
  };

  const details = (item: OrderItem, big: boolean) => {
    const l = lineOf(item);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: big ? 14 : 8 }}>
        {label(big ? "Jallabiya" : `Jallabiya · ${l.size}`, CUT)}
        {big && <div style={{ fontFamily: "Syne", fontSize: 44, color: INK }}>{l.size}</div>}
        <div style={{ fontFamily: "Jost", fontSize: big ? 30 : 22, color: INK }}>{l.cloth}</div>
        <div style={{ display: "flex", fontFamily: "Mono, Naira", fontSize: big ? 26 : 19, color: INK, letterSpacing: 1 }}>{l.design}</div>
        <div style={{ fontFamily: "Jost", fontSize: big ? 24 : 19, color: SOFT }}>{l.thread}</div>
        <div style={{ display: "flex", fontFamily: "Mono, Naira", fontSize: big ? 28 : 21, color: INK, marginTop: big ? 12 : 4 }}>
          {item.qty > 1 ? `${item.qty} × ${naira(item.price)}` : naira(item.price)}
        </div>
      </div>
    );
  };

  const row = (name: string, value: string, strong = false) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <div style={{ fontFamily: strong ? "Jost Medium" : "Jost", fontSize: strong ? 30 : 24, color: strong ? INK : SOFT }}>{name}</div>
      <div style={{ fontFamily: strong ? "Mono Medium, Naira Medium" : "Mono, Naira", fontSize: strong ? 40 : 24, color: INK }}>{value}</div>
    </div>
  );

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: PAPER, padding: pad, color: INK }}>
        {/* the header: the mark, and what this is */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} width={92} height={104} alt="" />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
            {label("Receipt · paid in full", CUT)}
            <div style={{ fontFamily: "Mono, Naira", fontSize: 24, letterSpacing: 2, color: INK }}>{order.reference}</div>
            <div style={{ fontFamily: "Jost", fontSize: 22, color: SOFT }}>{when.format(new Date(order.at))}</div>
          </div>
        </div>
        <div style={{ display: "flex", fontFamily: "Syne", fontSize: 50, marginTop: 30, color: INK }}>
          {first ? `Thank you, ${first}.` : "Thank you."}
        </div>
        <div style={{ display: "flex", fontFamily: "Jost", fontSize: 25, color: SOFT, marginTop: 8 }}>
          {sets === 1 ? "One jallabiya, cut to order in Abuja." : `${sets} jallabiyas, cut to order in Abuja.`}
        </div>

        {/* the builds */}
        <div style={{ display: "flex", flexWrap: "wrap", gap, marginTop: 36 }}>
          {drawn.map((item, i) =>
            single ? (
              <div key={i} style={{ display: "flex", gap: 48, alignItems: "center", width: cardW, height: cardH, padding: 24, border: `2px dashed ${LINE}`, borderRadius: 4 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pictures[i]} width={picW} height={picH} alt="" />
                {details(item, true)}
              </div>
            ) : (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: cardW, height: cardH, padding: 20, border: `2px dashed ${LINE}`, borderRadius: 4 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pictures[i]} width={picW} height={picH} alt="" />
                <div style={{ display: "flex", width: "100%", marginTop: 16 }}>{details(item, false)}</div>
              </div>
            ),
          )}
        </div>
        {items.length > DRAWN && (
          <div style={{ display: "flex", fontFamily: "Jost", fontSize: 24, color: SOFT, marginTop: 20 }}>
            {`and ${items.length - DRAWN} more ${items.length - DRAWN === 1 ? "build" : "builds"}, listed in your order.`}
          </div>
        )}

        {/* the money and where it goes */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 40, paddingTop: 28, borderTop: `2px dashed ${LINE}` }}>
          {row(`${sets} ${sets === 1 ? "set" : "sets"}`, naira(subtotal))}
          {d && row(d.method === "pickup" ? "Collect from the atelier" : `Delivery · ${d.label}`, d.fee === 0 ? "Free" : naira(d.fee))}
          {row("Paid", naira(order.paid), true)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 28 }}>
          {label(d?.method === "pickup" ? "Collect" : "Deliver to")}
          <div style={{ display: "flex", fontFamily: "Jost", fontSize: 24, color: INK }}>
            {d
              ? d.method === "pickup"
                ? "The atelier in Abuja. We message you on WhatsApp when it is ready."
                : [order.customer?.name, d.address, d.city].filter(Boolean).join(", ")
              : order.customer?.name ?? ""}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "auto", paddingTop: 24, borderTop: `1px solid ${LINE}` }}>
          {label(`KAS THREADZ · Abuja · WhatsApp ${SITE.phoneDisplay}`)}
          {label("Art in every stitch", CUT)}
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      fonts: [
        { name: "Syne", data: await syne, weight: 700, style: "normal" },
        { name: "Jost", data: await jost, weight: 400, style: "normal" },
        { name: "Jost Medium", data: await jostMedium, weight: 500, style: "normal" },
        { name: "Mono", data: await mono, weight: 400, style: "normal" },
        { name: "Mono Medium", data: await monoMedium, weight: 500, style: "normal" },
        { name: "Naira", data: await nairaSign, weight: 400, style: "normal" },
        { name: "Naira Medium", data: await nairaSignMedium, weight: 500, style: "normal" },
      ],
      headers: { "Cache-Control": "private, max-age=3600" },
    },
  );
}
