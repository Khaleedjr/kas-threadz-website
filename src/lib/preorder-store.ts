/*
 * The preorder's count and its orders, kept where every visitor sees the
 * same thing (see `redis.ts`).
 *
 * A set is only counted as sold once its payment is confirmed. While a
 * customer is on Paystack paying, the sets in their order are held for
 * them, all or none, so two people can never pay for the last one; a hold
 * that is not paid within half an hour lapses and the sets go back. "Left"
 * is what is neither sold nor held.
 *
 * Before the customer pays, the order as the server priced it is kept too,
 * so the payment is checked against that and never against anything the
 * payment itself carries. Each paid order is written once and never
 * changed; what the studio adds afterwards is kept beside it.
 *
 * Server only.
 */

import type { Redis } from "@upstash/redis";
import type { PreorderCustomer, PreorderGarment, PreorderTerms, Stock, Tier } from "./preorder";
import { memoryAllowed, redis } from "./redis";

const HOLD_MS = 30 * 60 * 1000;
/** How long a priced, unpaid order is kept for its payment to come back to. */
const PENDING_S = 3 * 24 * 60 * 60;

const key = {
  sold: (t: Tier) => `preorder:${t}:sold`,
  holds: (t: Tier) => `preorder:${t}:holds`,
  order: (reference: string) => `preorder:order:${reference}`,
  meta: (reference: string) => `preorder:meta:${reference}`,
  pending: (reference: string) => `preorder:pending:${reference}`,
};

/* Hold every set in an order if there are enough of each size, or none.
   1 held; 2 not enough adult sets; 3 not enough children's. */
const HOLD = `
redis.call('ZREMRANGEBYSCORE', KEYS[2], '-inf', ARGV[1])
redis.call('ZREMRANGEBYSCORE', KEYS[4], '-inf', ARGV[1])
local a = tonumber(ARGV[4])
local c = tonumber(ARGV[6])
if a > 0 and tonumber(redis.call('GET', KEYS[1]) or '0') + redis.call('ZCARD', KEYS[2]) + a > tonumber(ARGV[5]) then return 2 end
if c > 0 and tonumber(redis.call('GET', KEYS[3]) or '0') + redis.call('ZCARD', KEYS[4]) + c > tonumber(ARGV[7]) then return 3 end
for i = 1, a do redis.call('ZADD', KEYS[2], ARGV[2], ARGV[3] .. '#' .. i) end
for i = 1, c do redis.call('ZADD', KEYS[4], ARGV[2], ARGV[3] .. '#' .. i) end
return 1`;

/* Record a paid order once, however many times its confirmation arrives:
   its holds are let go and its sets counted as sold. A hold under the bare
   reference is the first preorders' one-set kind. */
const CONFIRM = `
if redis.call('SET', KEYS[1], ARGV[1], 'NX') then
  local a = tonumber(ARGV[3])
  local c = tonumber(ARGV[4])
  redis.call('ZREM', KEYS[3], ARGV[2])
  redis.call('ZREM', KEYS[5], ARGV[2])
  for i = 1, a do redis.call('ZREM', KEYS[3], ARGV[2] .. '#' .. i) end
  for i = 1, c do redis.call('ZREM', KEYS[5], ARGV[2] .. '#' .. i) end
  if a > 0 then redis.call('INCRBY', KEYS[2], a) end
  if c > 0 then redis.call('INCRBY', KEYS[4], c) end
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

/** One line of an order: a build, its size's price, and how many of it. */
export type OrderItem = {
  garment: PreorderGarment;
  tier: Tier;
  /** each, in naira */
  price: number;
  qty: number;
  /** the cloth and colour by the names the customer saw when they paid */
  described?: { fabric?: string; colour?: string };
};

export type Delivery = {
  method: "delivery" | "pickup";
  zone: string | null;
  label: string;
  eta: string;
  /** in naira: nothing to collect, or when the order is over the free line */
  fee: number;
  free: boolean;
  address?: string;
  city?: string;
  notes?: string;
};

/** A paid order, as `recordPayment` writes it. */
export type StoredOrder = {
  reference: string;
  /** everything paid, delivery included, in naira */
  paid: number;
  customer?: PreorderCustomer;
  /** when the payment was confirmed, ISO 8601 */
  at: string;
  items?: OrderItem[];
  delivery?: Delivery;
  /** the sets alone, before delivery */
  subtotal?: number;
  /* the first preorders were one set each, written with these instead of items */
  tier?: Tier;
  garment?: PreorderGarment;
  described?: { fabric?: string; colour?: string };
};

/** A paid order with the studio's notes on it. */
export type Order = StoredOrder & OrderMeta;

/** An order the server has priced and held sets for, waiting on its payment. */
export type PendingOrder = {
  reference: string;
  items: OrderItem[];
  delivery: Delivery;
  subtotal: number;
  /** what the payment must come to, in naira */
  total: number;
  customer: PreorderCustomer;
  createdAt: string;
};

/** Every line of an order, the first one-set preorders included. */
export function itemsOf(o: StoredOrder): OrderItem[] {
  if (o.items?.length) return o.items;
  return o.garment && o.tier ? [{ garment: o.garment, tier: o.tier, price: o.paid, qty: 1, described: o.described }] : [];
}

/** How many sets of each size an order holds. */
export function countsOf(items: OrderItem[]): Record<Tier, number> {
  const out: Record<Tier, number> = { adult: 0, children: 0 };
  for (const i of items) out[i.tier] += i.qty;
  return out;
}

/** Each size's sets sold and sets held while someone pays, for the studio. */
export type Tally = Record<Tier, { total: number; sold: number; held: number }>;

export type HoldResult = "held" | Tier;

type Store = {
  stock(terms: PreorderTerms): Promise<Stock>;
  /** hold every set of an order, or none: the size there are not enough of, if any */
  hold(reference: string, counts: Record<Tier, number>, terms: PreorderTerms): Promise<HoldResult>;
  release(reference: string, counts: Record<Tier, number>): Promise<void>;
  savePending(order: PendingOrder): Promise<void>;
  pending(reference: string): Promise<PendingOrder | null>;
  /** record a paid order, once: false if it already was */
  confirm(order: StoredOrder): Promise<boolean>;
  /** every paid order with its notes, newest first */
  orders(): Promise<Order[]>;
  order(reference: string): Promise<Order | null>;
  /**
   * Move an order along, or note something on it. Cancelling one gives its
   * sets back to the count; taking the cancellation back takes them again.
   */
  annotate(reference: string, change: Partial<Pick<OrderMeta, "status" | "note">>): Promise<Order | null>;
  tally(terms: PreorderTerms): Promise<Tally>;
};

const NO_META: OrderMeta = { status: "paid", note: "", updatedAt: null };
const newestFirst = (a: Order, b: Order) => b.at.localeCompare(a.at);
const parse = <T,>(v: unknown): T | null => (typeof v === "string" ? (JSON.parse(v) as T) : ((v as T) ?? null));
const members = (reference: string, n: number) => Array.from({ length: n }, (_, i) => `${reference}#${i + 1}`);

/** How a status change moves the sold count: a cancellation gives the sets back. */
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
    async hold(reference, counts, terms) {
      const now = Date.now();
      const r = Number(
        await db.eval(
          HOLD,
          [key.sold("adult"), key.holds("adult"), key.sold("children"), key.holds("children")],
          [now, now + HOLD_MS, reference, counts.adult, terms.adult.total, counts.children, terms.children.total],
        ),
      );
      return r === 1 ? "held" : r === 2 ? "adult" : "children";
    },
    async release(reference, counts) {
      for (const tier of Object.keys(counts) as Tier[]) {
        if (counts[tier]) await db.zrem(key.holds(tier), ...members(reference, counts[tier]));
      }
    },
    async savePending(order) {
      await db.set(key.pending(order.reference), JSON.stringify(order), { ex: PENDING_S });
    },
    async pending(reference) {
      return parse<PendingOrder>(await db.get(key.pending(reference)));
    },
    async confirm(order) {
      const counts = countsOf(itemsOf(order));
      const ok = await db.eval(
        CONFIRM,
        [key.order(order.reference), key.sold("adult"), key.holds("adult"), key.sold("children"), key.holds("children")],
        [JSON.stringify(order), order.reference, counts.adult, counts.children],
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
      if (shift) {
        const counts = countsOf(itemsOf(current));
        for (const tier of Object.keys(counts) as Tier[]) {
          if (counts[tier]) await db.incrby(key.sold(tier), shift * counts[tier]);
        }
      }
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
  const pendings = new Map<string, PendingOrder>();
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
    async hold(reference, counts, terms) {
      for (const t of Object.keys(counts) as Tier[]) {
        lapse(t);
        if (counts[t] && sold[t] + holds[t].size + counts[t] > terms[t].total) return t;
      }
      const until = Date.now() + HOLD_MS;
      for (const t of Object.keys(counts) as Tier[]) for (const m of members(reference, counts[t])) holds[t].set(m, until);
      return "held";
    },
    async release(reference, counts) {
      for (const t of Object.keys(counts) as Tier[]) for (const m of members(reference, counts[t])) holds[t].delete(m);
    },
    async savePending(order) {
      pendings.set(order.reference, order);
    },
    async pending(reference) {
      return pendings.get(reference) ?? null;
    },
    async confirm(order) {
      if (orders.has(order.reference)) return false;
      orders.set(order.reference, order);
      const counts = countsOf(itemsOf(order));
      for (const t of Object.keys(counts) as Tier[]) {
        holds[t].delete(order.reference);
        for (const m of members(order.reference, counts[t])) holds[t].delete(m);
        sold[t] += counts[t];
      }
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
      const shift = soldShift(current.status, next.status);
      const counts = countsOf(itemsOf(o));
      for (const t of Object.keys(counts) as Tier[]) sold[t] += shift * counts[t];
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
/* bumped whenever the store changes shape, so a dev server running since
   before the change builds a fresh stand-in instead of reusing an old one */
const SHAPE = 3;

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
