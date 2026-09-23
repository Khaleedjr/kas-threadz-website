/*
 * The studio's figures, worked out from the orders themselves: what has
 * been taken, what sells, who buys. Server only.
 */

import { naira } from "./catalogue";
import type { Catalogue } from "./content-defaults";
import { describe } from "./preorder-server";
import type { Order, OrderStatus } from "./preorder-store";

/** Orders that count as sales: every one not cancelled. */
export const sales = (orders: Order[]) => orders.filter((o) => o.status !== "cancelled");

export const taken = (orders: Order[]) => sales(orders).reduce((n, o) => n + o.paid, 0);

const DAY = 24 * 60 * 60 * 1000;
/** A day as the studio lives it, in Abuja. */
const lagosDay = (iso: string) => new Date(new Date(iso).getTime() + 60 * 60 * 1000).toISOString().slice(0, 10);

/** Sales and money for each of the last `days` days, oldest first. */
export function daily(orders: Order[], days = 30) {
  const today = lagosDay(new Date().toISOString());
  const out: Array<{ day: string; orders: number; taken: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(new Date(`${today}T00:00:00Z`).getTime() - i * DAY).toISOString().slice(0, 10);
    out.push({ day, orders: 0, taken: 0 });
  }
  const index = new Map(out.map((d, i) => [d.day, i]));
  for (const o of sales(orders)) {
    const i = index.get(lagosDay(o.at));
    if (i !== undefined) {
      out[i].orders += 1;
      out[i].taken += o.paid;
    }
  }
  return out;
}

/** How many sales since a moment, and what they took. */
export function since(orders: Order[], from: Date) {
  const s = sales(orders).filter((o) => new Date(o.at) >= from);
  return { orders: s.length, taken: s.reduce((n, o) => n + o.paid, 0) };
}

export function byStatus(orders: Order[]): Record<OrderStatus, number> {
  const out = { paid: 0, cutting: 0, embroidering: 0, ready: 0, delivered: 0, cancelled: 0 };
  for (const o of orders) out[o.status] += 1;
  return out;
}

/** What sells: each colour, neckline, cloth, thread, size and length, most first. */
export function breakdowns(orders: Order[], cat: Catalogue) {
  const tally = () => new Map<string, number>();
  const b = {
    colour: tally(),
    design: tally(),
    fabric: tally(),
    thread: tally(),
    tier: tally(),
    length: tally(),
  };
  for (const o of sales(orders)) {
    if (!o.garment) continue;
    const w = describe(o.garment, cat);
    const add = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);
    add(b.colour, o.described?.colour || w.colour);
    add(b.design, w.design);
    add(b.fabric, o.described?.fabric || w.fabric);
    add(b.thread, w.thread);
    add(b.tier, cat.terms[w.tier].name);
    add(b.length, `${o.garment.length}″`);
  }
  const ranked = (m: Map<string, number>) => [...m.entries()].sort((a, z) => z[1] - a[1]);
  return {
    colour: ranked(b.colour),
    design: ranked(b.design),
    fabric: ranked(b.fabric),
    thread: ranked(b.thread),
    tier: ranked(b.tier),
    length: ranked(b.length),
  };
}

export type Customer = {
  /** how they are told apart: their email, or their phone if they gave none */
  key: string;
  name: string;
  email: string;
  phone: string;
  orders: number;
  spent: number;
  first: string;
  last: string;
};

/** Everyone who has bought, with what they have spent, best customers first. */
export function customers(orders: Order[]): Customer[] {
  const map = new Map<string, Customer>();
  for (const o of orders) {
    const c = o.customer;
    if (!c) continue;
    const key = (c.email || c.phone).toLowerCase();
    const counted = o.status === "cancelled" ? 0 : 1;
    const seen = map.get(key);
    if (seen) {
      seen.orders += counted;
      seen.spent += counted ? o.paid : 0;
      if (o.at < seen.first) seen.first = o.at;
      if (o.at > seen.last) {
        seen.last = o.at;
        seen.name = c.name || seen.name;
        seen.phone = c.phone || seen.phone;
      }
    } else {
      map.set(key, {
        key,
        name: c.name,
        email: c.email,
        phone: c.phone,
        orders: counted,
        spent: counted ? o.paid : 0,
        first: o.at,
        last: o.at,
      });
    }
  }
  return [...map.values()].sort((a, z) => z.spent - a.spent || z.last.localeCompare(a.last));
}

export const money = naira;
