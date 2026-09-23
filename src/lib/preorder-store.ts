/*
 * The preorder's count and its orders, kept where every visitor sees the
 * same thing (see `redis.ts`).
 *
 * A set is only counted as sold once its payment is confirmed. While a
 * customer is on Paystack paying, their set is held for them, so two people
 * can never pay for the last one; a hold that is not paid within half an hour
 * lapses and the set goes back. "Left" is what is neither sold nor held.
 *
 * Each paid order is written once and never changed. What the studio adds
 * afterwards, where it is in the workshop and any notes, is kept beside it.
 *
 * Server only.
 */

import type { Redis } from "@upstash/redis";
import type { PreorderCustomer, PreorderGarment, PreorderTerms, Stock, Tier } from "./preorder";
import { memoryAllowed, redis } from "./redis";

const HOLD_MS = 30 * 60 * 1000;

const key = {
  sold: (t: Tier) => `preorder:${t}:sold`,
  holds: (t: Tier) => `preorder:${t}:holds`,
  order: (reference: string) => `preorder:order:${reference}`,
  meta: (reference: string) => `preorder:meta:${reference}`,
};

/* hold a set if one is free: clear lapsed holds, then count what is gone */
const HOLD = `
redis.call('ZREMRANGEBYSCORE', KEYS[2], '-inf', ARGV[1])
local sold = tonumber(redis.call('GET', KEYS[1]) or '0')
local held = redis.call('ZCARD', KEYS[2])
if sold + held >= tonumber(ARGV[3]) then return 0 end
redis.call('ZADD', KEYS[2], ARGV[2], ARGV[4])
return 1`;

/* record a paid order once, however many times its confirmation arrives */
const CONFIRM = `
if redis.call('SET', KEYS[3], ARGV[2], 'NX') then
  redis.call('ZREM', KEYS[2], ARGV[1])
  redis.call('INCR', KEYS[1])
  return 1
end
return 0`;

/** Where an order is in the workshop, in the order it moves through. */
export const ORDER_STATUSES = ["paid", "cutting", "embroidering", "ready", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  paid: "Paid",
  cutting: "Cutting",
  embroidering: "Embroidering",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** What the studio keeps beside an order. */
export type OrderMeta = { status: OrderStatus; note: string; updatedAt: string | null };

/** A paid order, as `recordPayment` writes it. */
export type StoredOrder = {
  reference: string;
  tier: Tier;
  /** in naira */
  paid: number;
  garment?: PreorderGarment;
  /** the cloth and colour by the names the customer saw when they paid */
  described?: { fabric?: string; colour?: string };
  customer?: PreorderCustomer;
  /** when the payment was confirmed, ISO 8601 */
  at: string;
};

/** A paid order with the studio's notes on it. */
export type Order = StoredOrder & OrderMeta;

/** Each size's sets sold and sets held while someone pays, for the studio. */
export type Tally = Record<Tier, { total: number; sold: number; held: number }>;

/* The run's size is the studio's to change, so every count is taken against
   the terms as they stand when it is asked. */
type Store = {
  stock(terms: PreorderTerms): Promise<Stock>;
  /** hold a set of `tier` for this reference, if one of `total` is free */
  hold(tier: Tier, reference: string, total: number): Promise<boolean>;
  release(tier: Tier, reference: string): Promise<void>;
  confirm(tier: Tier, reference: string, order: StoredOrder): Promise<boolean>;
  /** every paid order with its notes, newest first */
  orders(): Promise<Order[]>;
  order(reference: string): Promise<Order | null>;
  /**
   * Move an order along, or note something on it. Cancelling one gives its
   * set back to the count; taking the cancellation back takes it again.
   */
  annotate(reference: string, change: Partial<Pick<OrderMeta, "status" | "note">>): Promise<Order | null>;
  tally(terms: PreorderTerms): Promise<Tally>;
};

const NO_META: OrderMeta = { status: "paid", note: "", updatedAt: null };
const newestFirst = (a: Order, b: Order) => b.at.localeCompare(a.at);
const parse = <T,>(v: unknown): T | null => (typeof v === "string" ? (JSON.parse(v) as T) : ((v as T) ?? null));

/** How a status change moves the sold count: a cancellation gives a set back. */
const soldShift = (from: OrderStatus, to: OrderStatus) =>
  from !== "cancelled" && to === "cancelled" ? -1 : from === "cancelled" && to !== "cancelled" ? 1 : 0;

function redisStore(db: Redis): Store {
  async function withMeta(orders: StoredOrder[]): Promise<Order[]> {
    if (!orders.length) return [];
    const metas = await db.mget<unknown[]>(...orders.map((o) => key.meta(o.reference)));
    return orders.map((o, i) => ({ ...o, ...NO_META, ...(parse<OrderMeta>(metas[i]) ?? {}) }));
  }
  async function one(reference: string): Promise<Order | null> {
    const o = parse<StoredOrder>(await db.get(key.order(reference)));
    return o ? (await withMeta([o]))[0] : null;
  }

  return {
    async stock(terms) {
      const now = Date.now();
      const out = {} as Stock;
      for (const tier of Object.keys(terms) as Tier[]) {
        await db.zremrangebyscore(key.holds(tier), "-inf", now);
        const [sold, held] = await Promise.all([db.get<number>(key.sold(tier)), db.zcard(key.holds(tier))]);
        const total = terms[tier].total;
        out[tier] = { total, left: Math.max(0, total - Number(sold ?? 0) - held) };
      }
      return out;
    },
    async hold(tier, reference, total) {
      const now = Date.now();
      const ok = await db.eval(HOLD, [key.sold(tier), key.holds(tier)], [now, now + HOLD_MS, total, reference]);
      return Number(ok) === 1;
    },
    async release(tier, reference) {
      await db.zrem(key.holds(tier), reference);
    },
    async confirm(tier, reference, order) {
      const ok = await db.eval(
        CONFIRM,
        [key.sold(tier), key.holds(tier), key.order(reference)],
        [reference, JSON.stringify(order)],
      );
      return Number(ok) === 1;
    },
    async orders() {
      // the runs are small, so every order's key can simply be walked
      const keys: string[] = [];
      let cursor = "0";
      do {
        const [next, batch] = await db.scan(cursor, { match: key.order("*"), count: 500 });
        cursor = String(next);
        keys.push(...batch);
      } while (cursor !== "0");
      if (!keys.length) return [];
      const values = await db.mget<unknown[]>(...keys);
      const orders = values.map((v) => parse<StoredOrder>(v)).filter((o): o is StoredOrder => Boolean(o?.reference));
      return (await withMeta(orders)).sort(newestFirst);
    },
    order: one,
    async annotate(reference, change) {
      const current = await one(reference);
      if (!current) return null;
      const next: OrderMeta = {
        status: change.status ?? current.status,
        note: change.note ?? current.note,
        updatedAt: new Date().toISOString(),
      };
      const shift = soldShift(current.status, next.status);
      if (shift) await db.incrby(key.sold(current.tier), shift);
      await db.set(key.meta(reference), JSON.stringify(next));
      return { ...current, ...next };
    },
    async tally(terms) {
      const now = Date.now();
      const out = {} as Tally;
      for (const tier of Object.keys(terms) as Tier[]) {
        await db.zremrangebyscore(key.holds(tier), "-inf", now);
        const [sold, held] = await Promise.all([db.get<number>(key.sold(tier)), db.zcard(key.holds(tier))]);
        out[tier] = { total: terms[tier].total, sold: Number(sold ?? 0), held };
      }
      return out;
    },
  };
}

function memoryStore(): Store {
  const sold: Record<Tier, number> = { adult: 0, children: 0 };
  const holds: Record<Tier, Map<string, number>> = { adult: new Map(), children: new Map() };
  const orders = new Map<string, StoredOrder>();
  const metas = new Map<string, OrderMeta>();
  const lapse = (t: Tier) => {
    const now = Date.now();
    for (const [ref, until] of holds[t]) if (until < now) holds[t].delete(ref);
  };
  const full = (o: StoredOrder): Order => ({ ...o, ...(metas.get(o.reference) ?? NO_META) });
  return {
    async stock(terms) {
      const out = {} as Stock;
      for (const t of Object.keys(terms) as Tier[]) {
        lapse(t);
        out[t] = { total: terms[t].total, left: Math.max(0, terms[t].total - sold[t] - holds[t].size) };
      }
      return out;
    },
    async hold(t, ref, total) {
      lapse(t);
      if (sold[t] + holds[t].size >= total) return false;
      holds[t].set(ref, Date.now() + HOLD_MS);
      return true;
    },
    async release(t, ref) {
      holds[t].delete(ref);
    },
    async confirm(t, ref, order) {
      if (orders.has(ref)) return false;
      orders.set(ref, order);
      holds[t].delete(ref);
      sold[t] += 1;
      return true;
    },
    async orders() {
      return [...orders.values()].map(full).sort(newestFirst);
    },
    async order(reference) {
      const o = orders.get(reference);
      return o ? full(o) : null;
    },
    async annotate(reference, change) {
      const o = orders.get(reference);
      if (!o) return null;
      const current = full(o);
      const next: OrderMeta = {
        status: change.status ?? current.status,
        note: change.note ?? current.note,
        updatedAt: new Date().toISOString(),
      };
      sold[o.tier] += soldShift(current.status, next.status);
      metas.set(reference, next);
      return { ...o, ...next };
    },
    async tally(terms) {
      const out = {} as Tally;
      for (const t of Object.keys(terms) as Tier[]) {
        lapse(t);
        out[t] = { total: terms[t].total, sold: sold[t], held: holds[t].size };
      }
      return out;
    },
  };
}

const globalStore = globalThis as unknown as { __kasPreorderStore?: Store; __kasStoreShape?: number };
/* bumped whenever the store gains a method, so a dev server running since
   before the change builds a fresh stand-in instead of reusing an old one */
const SHAPE = 2;

/** The store, or null when production has no database connected yet. */
export function preorderStore(): Store | null {
  const db = redis();
  if (db) return redisStore(db);
  if (!memoryAllowed()) return null;
  if (globalStore.__kasStoreShape !== SHAPE) {
    globalStore.__kasPreorderStore = memoryStore();
    globalStore.__kasStoreShape = SHAPE;
  }
  return globalStore.__kasPreorderStore!;
}
