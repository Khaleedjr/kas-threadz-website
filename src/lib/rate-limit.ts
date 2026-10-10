/*
 * A limit on how often one visitor can try something: signing in to the
 * studio, or starting a checkout that holds sets. Counted in the database,
 * so it holds across every server the site runs on. With no database
 * connected, the count is kept on the one server, which is enough on this
 * machine.
 *
 * Server only.
 */

import { headers } from "next/headers";
import { redis } from "./redis";

/* count one more, and start the window's clock on the first */
const COUNT = `
local n = redis.call('INCRBY', KEYS[1], ARGV[1])
if n == tonumber(ARGV[1]) then redis.call('EXPIRE', KEYS[1], ARGV[2]) end
return n`;

const local = globalThis as unknown as { __kasLimits?: Map<string, { n: number; until: number }> };
const counts = () => (local.__kasLimits ??= new Map());

/** The visitor's address, as the host saw it. Vercel sets it, so a visitor cannot write their own. */
export async function visitor(): Promise<string> {
  const h = await headers();
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/**
 * Count `weight` more tries at `what` by `who`, and say whether they are
 * still inside `max` for the last `windowS` seconds.
 */
export async function withinLimit(what: string, who: string, max: number, windowS: number, weight = 1): Promise<boolean> {
  const key = `limit:${what}:${who}`;
  const db = redis();
  if (db) {
    try {
      return Number(await db.eval(COUNT, [key], [weight, windowS])) <= max;
    } catch (err) {
      // the database being down should not lock everybody out
      console.error("The limit could not be counted.", err);
      return true;
    }
  }
  const now = Date.now();
  const c = counts().get(key);
  const next = c && c.until > now ? { n: c.n + weight, until: c.until } : { n: weight, until: now + windowS * 1000 };
  counts().set(key, next);
  return next.n <= max;
}
