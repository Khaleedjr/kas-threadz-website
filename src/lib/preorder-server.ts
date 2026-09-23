/*
 * The preorder's server side: checking an order is one the studio offers,
 * describing it for the studio, and recording it once it is paid. Server
 * only, like the store and Paystack beside it.
 */

import { NECKLINES } from "./catalogue";
import type { Catalogue } from "./content-defaults";
import { THREADS } from "./loom-preview";
import {
  isOfferedLength,
  tierFor,
  type PreorderCustomer,
  type PreorderGarment,
  type PreorderTerms,
  type Tier,
} from "./preorder";
import { preorderStore } from "./preorder-store";
import type { Verified } from "./paystack";

/** Check an order against what the studio offers now. Returns the reason if it is not. */
export function checkOrder(
  input: unknown,
  cat: Catalogue,
): { garment: PreorderGarment; customer: PreorderCustomer } | { error: string } {
  const o = (input ?? {}) as Record<string, unknown>;
  const g = (o.garment ?? {}) as Record<string, unknown>;
  const c = (o.customer ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  const garment: PreorderGarment = {
    fabric: str(g.fabric),
    colour: str(g.colour),
    design: str(g.design),
    thread: str(g.thread) || "original",
    length: Number(g.length),
  };
  if (!cat.fabrics.some((f) => f.id === garment.fabric)) return { error: "Choose a fabric." };
  if (!cat.colours.some((x) => x.hex === garment.colour)) return { error: "Choose a colour." };
  if (!NECKLINES.some((n) => n.code === garment.design)) return { error: "Choose a neckline design." };
  if (!THREADS.some((t) => t.id === garment.thread)) return { error: "Choose a thread." };
  if (!isOfferedLength(garment.length)) return { error: "Choose a length." };

  const customer: PreorderCustomer = {
    name: str(c.name).slice(0, 80),
    email: str(c.email).toLowerCase().slice(0, 120),
    phone: str(c.phone).replace(/[^\d+]/g, "").slice(0, 16),
  };
  if (customer.name.length < 2) return { error: "Add your name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) return { error: "Add an email address for the receipt." };
  if (customer.phone.replace(/\D/g, "").length < 10) return { error: "Add a phone number we can reach you on." };
  return { garment, customer };
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
 * Record a payment Paystack has confirmed, if it is for a preorder and for
 * the full price of its tier. Recording the same payment again does nothing.
 *
 * The price checked is the one the customer was charged, carried on the
 * payment itself, so a price changed in the studio while they were paying
 * never turns a good payment away. It is never below the lower of that and
 * the price now, so the page cannot talk it down.
 */
export async function recordPayment(
  reference: string,
  v: Verified,
  terms: PreorderTerms,
): Promise<"recorded" | "already" | "invalid"> {
  const meta = (v.metadata ?? {}) as {
    tier?: Tier;
    price?: number;
    garment?: PreorderGarment;
    described?: { fabric?: string; colour?: string };
    customer?: PreorderCustomer;
  };
  const tier = meta.tier;
  if (!v.paid || !tier || !(tier in terms)) return "invalid";
  const due = Math.min(terms[tier].price, Number(meta.price) || terms[tier].price);
  if (v.amount < due) return "invalid";
  const store = preorderStore();
  if (!store) return "invalid";
  const done = await store.confirm(tier, reference, {
    reference,
    tier,
    paid: v.amount,
    garment: meta.garment,
    described: meta.described,
    customer: meta.customer,
    at: new Date().toISOString(),
  });
  return done ? "recorded" : "already";
}
