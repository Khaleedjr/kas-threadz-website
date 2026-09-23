/*
 * The preorder's count, kept where every visitor sees the same number: an
 * Upstash Redis database, which Vercel adds from its Storage tab.
 *
 * A set is only counted as sold once its payment is confirmed. While a
 * customer is on Paystack paying, their set is held for them, so two people
 * can never pay for the last one; a hold that is not paid within half an hour
 * lapses and the set goes back. "Left" is what is neither sold nor held.
 *
 * Server only: imported from route handlers and server pages, never from the
 * page code, because it holds the database token.
 */

import { Redis } from "@upstash/redis";
import { PREORDER, type Stock, type Tier } from "./preorder";

const HOLD_MS = 30 * 60 * 1000;

const key = {
  sold: (t: Tier) => `preorder:${t}:sold`,
  holds: (t: Tier) => `preorder:${t}:holds`,
  order: (reference: string) => `preorder:order:${reference}`,
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

type Store = {
  stock(): Promise<Stock>;
  hold(tier: Tier, reference: string): Promise<boolean>;
  release(tier: Tier, reference: string): Promise<void>;
  confirm(tier: Tier, reference: string, order: object): Promise<boolean>;
};

function redisStore(redis: Redis): Store {
  return {
    async stock() {
      const now = Date.now();
      const out = {} as Stock;
      for (const tier of Object.keys(PREORDER) as Tier[]) {
        await redis.zremrangebyscore(key.holds(tier), "-inf", now);
        const [sold, held] = await Promise.all([
          redis.get<number>(key.sold(tier)),
          redis.zcard(key.holds(tier)),
        ]);
        const total = PREORDER[tier].total;
        out[tier] = { total, left: Math.max(0, total - Number(sold ?? 0) - held) };
      }
      return out;
    },
    async hold(tier, reference) {
      const now = Date.now();
      const ok = await redis.eval(
        HOLD,
        [key.sold(tier), key.holds(tier)],
        [now, now + HOLD_MS, PREORDER[tier].total, reference],
      );
      return Number(ok) === 1;
    },
    async release(tier, reference) {
      await redis.zrem(key.holds(tier), reference);
    },
    async confirm(tier, reference, order) {
      const ok = await redis.eval(
        CONFIRM,
        [key.sold(tier), key.holds(tier), key.order(reference)],
        [reference, JSON.stringify(order)],
      );
      return Number(ok) === 1;
    },
  };
}

/*
 * On this machine, before the database is connected, a stand-in kept in
 * memory, so the Loom can be worked on. It forgets on every restart and is
 * never used in production.
 */
function memoryStore(): Store {
  const sold: Record<Tier, number> = { adult: 0, children: 0 };
  const holds: Record<Tier, Map<string, number>> = { adult: new Map(), children: new Map() };
  const orders = new Set<string>();
  const lapse = (t: Tier) => {
    const now = Date.now();
    for (const [ref, until] of holds[t]) if (until < now) holds[t].delete(ref);
  };
  return {
    async stock() {
      const out = {} as Stock;
      for (const t of Object.keys(PREORDER) as Tier[]) {
        lapse(t);
        out[t] = { total: PREORDER[t].total, left: Math.max(0, PREORDER[t].total - sold[t] - holds[t].size) };
      }
      return out;
    },
    async hold(t, ref) {
      lapse(t);
      if (sold[t] + holds[t].size >= PREORDER[t].total) return false;
      holds[t].set(ref, Date.now() + HOLD_MS);
      return true;
    },
    async release(t, ref) {
      holds[t].delete(ref);
    },
    async confirm(t, ref) {
      if (orders.has(ref)) return false;
      orders.add(ref);
      holds[t].delete(ref);
      sold[t] += 1;
      return true;
    },
  };
}

const globalStore = globalThis as unknown as { __kasPreorderStore?: Store };

/** The store, or null when production has no database connected yet. */
export function preorderStore(): Store | null {
  // Vercel's Upstash integration names these KV_REST_API_*; Upstash's own are UPSTASH_REDIS_REST_*
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return redisStore(new Redis({ url, token }));
  if (process.env.NODE_ENV === "production") return null;
  globalStore.__kasPreorderStore ??= memoryStore();
  return globalStore.__kasPreorderStore;
}
