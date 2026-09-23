/*
 * The preorder's server side: checking a cart is one the studio offers and
 * pricing it, describing an order for the studio, and recording it once it
 * is paid. Server only, like the store and Paystack beside it.
 */

import { NECKLINES } from "./catalogue";
import type { Catalogue } from "./content-defaults";
import { THREADS } from "./loom-preview";
import { isOfferedLength, tierFor, type PreorderCustomer, type PreorderGarment } from "./preorder";
import { preorderStore, type Delivery, type OrderItem, type PendingOrder, type StoredOrder } from "./preorder-store";
import { deliveryFor } from "./shipping";
import type { Verified } from "./paystack";

/** No one line holds more than this many sets, nor the whole order more than the second. */
export const LIMITS = { qty: 10, sets: 20, lines: 20 };

const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Check one build against what the studio offers now. Returns the reason if it is not. */
export function checkGarment(input: unknown, cat: Catalogue): PreorderGarment | { error: string } {
  const g = (input ?? {}) as Record<string, unknown>;
  const garment: PreorderGarment = {
    fabric: str(g.fabric, 40),
    colour: str(g.colour, 7).toLowerCase(),
    design: str(g.design, 40),
    thread: str(g.thread, 20) || "original",
    length: Number(g.length),
  };
  if (!cat.fabrics.some((f) => f.id === garment.fabric)) return { error: "One of the fabrics in your cart is no longer offered." };
  if (!cat.colours.some((x) => x.hex === garment.colour)) return { error: "One of the colours in your cart is no longer offered." };
  if (!NECKLINES.some((n) => n.code === garment.design)) return { error: "One of the neckline designs in your cart is no longer offered." };
  if (!THREADS.some((t) => t.id === garment.thread)) return { error: "Choose a thread." };
  if (!isOfferedLength(garment.length)) return { error: "Choose a length." };
  return garment;
}

/**
 * Check a whole checkout: every build, how many, who it is for and where it
 * goes, and price it here, from the studio's own prices and delivery fees,
 * never from anything the page sent. Returns the order ready to hold and
 * pay for, or the reason it cannot be.
 */
export function priceCheckout(input: unknown, cat: Catalogue): Omit<PendingOrder, "reference" | "createdAt"> | { error: string } {
  const o = (input ?? {}) as Record<string, unknown>;
  const lines = Array.isArray(o.items) ? o.items : [];
  if (!lines.length) return { error: "Your cart is empty." };
  if (lines.length > LIMITS.lines) return { error: `A cart can hold up to ${LIMITS.lines} different builds.` };

  const items: OrderItem[] = [];
  for (const line of lines) {
    const garment = checkGarment(line, cat);
    if ("error" in garment) return garment;
    const qty = Number((line as { qty?: unknown }).qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > LIMITS.qty) return { error: `Each build can be ordered up to ${LIMITS.qty} times.` };
    const tier = tierFor(garment.length);
    const words = describe(garment, cat);
    items.push({ garment, tier, price: cat.terms[tier].price, qty, described: { fabric: words.fabric, colour: words.colour } });
  }
  const sets = items.reduce((n, i) => n + i.qty, 0);
  if (sets > LIMITS.sets) return { error: `One order can hold up to ${LIMITS.sets} sets.` };

  const c = (o.customer ?? {}) as Record<string, unknown>;
  const customer: PreorderCustomer = {
    name: str(c.name, 80),
    email: str(c.email, 120).toLowerCase(),
    phone: str(c.phone, 24).replace(/[^\d+]/g, "").slice(0, 16),
  };
  if (customer.name.length < 2) return { error: "Add your name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) return { error: "Add an email address for the receipt." };
  if (customer.phone.replace(/\D/g, "").length < 10) return { error: "Add a phone number we can reach you on." };

  const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);
  const d = (o.delivery ?? {}) as Record<string, unknown>;
  const choice = d.method === "pickup" ? ({ method: "pickup" } as const) : ({ method: "delivery", zone: str(d.zone, 60) } as const);
  const priced = deliveryFor(cat.shipping, choice, subtotal);
  if (!priced) return { error: choice.method === "pickup" ? "Collecting is not on offer just now." : "Choose where to deliver to." };
  const delivery: Delivery = { ...priced };
  if (priced.method === "delivery") {
    delivery.address = str(d.address, 200);
    delivery.city = str(d.city, 80);
    if (delivery.address.length < 5) return { error: "Add the delivery address." };
    if (delivery.city.length < 2) return { error: "Add the town or city." };
  }
  delivery.notes = str(d.notes, 300);

  return { items, delivery, subtotal, total: subtotal + delivery.fee, customer };
}

/**
 * The order in words, as the studio reads it. A colour or fabric since taken
 * off the Loom still reads, by its code, so old orders never go blank.
 */
export function describe(g: PreorderGarment, cat: Catalogue) {
  const tier = tierFor(g.length);
  return {
    tier,
    size: `${g.length} inches (${tier === "children" ? "children" : "adult"})`,
    fabric: cat.fabrics.find((f) => f.id === g.fabric)?.name ?? g.fabric,
    colour: cat.colours.find((x) => x.hex === g.colour)?.name ?? g.colour,
    design: g.design,
    thread: THREADS.find((t) => t.id === g.thread)?.name ?? g.thread,
  };
}

/** A reference Paystack and the studio both file the order under. */
export const newReference = () =>
  `KT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

/**
 * Record a payment Paystack has confirmed, once. Recording it again does
 * nothing.
 *
 * The payment is checked against the order the server priced and kept
 * before sending the customer to pay, never against anything the payment
 * itself carries, since a payment's details can be written by whoever
 * starts it. The first preorders, one set each and started before orders
 * were kept this way, are checked against today's price for their size.
 */
export async function recordPayment(
  reference: string,
  v: Verified,
  cat: Catalogue,
): Promise<{ outcome: "recorded" | "already" | "invalid"; order: StoredOrder | null }> {
  const store = preorderStore();
  if (!store || !v.paid) return { outcome: "invalid", order: null };

  const pending = await store.pending(reference);
  let order: StoredOrder | null = null;
  if (pending) {
    if (v.amount < pending.total) return { outcome: "invalid", order: null };
    order = {
      reference,
      paid: v.amount,
      customer: pending.customer,
      at: new Date().toISOString(),
      items: pending.items,
      delivery: pending.delivery,
      subtotal: pending.subtotal,
    };
  } else {
    const meta = (v.metadata ?? {}) as {
      tier?: keyof Catalogue["terms"];
      garment?: PreorderGarment;
      described?: { fabric?: string; colour?: string };
      customer?: PreorderCustomer;
    };
    const tier = meta.tier;
    if (!tier || !(tier in cat.terms) || !meta.garment || v.amount < cat.terms[tier].price) {
      return { outcome: "invalid", order: null };
    }
    order = {
      reference,
      paid: v.amount,
      customer: meta.customer,
      at: new Date().toISOString(),
      tier,
      garment: meta.garment,
      described: meta.described,
    };
  }

  const recorded = await store.confirm(order);
  if (recorded) return { outcome: "recorded", order };
  return { outcome: "already", order: await store.order(reference) };
}
