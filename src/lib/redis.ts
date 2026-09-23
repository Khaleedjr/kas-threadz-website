/*
 * The site's one database: Upstash Redis, which Vercel adds from its
 * Storage tab. It keeps the preorder count, the paid orders and the content
 * the studio edits in its dashboard.
 *
 * Server only: it holds the database token.
 */

import { Redis } from "@upstash/redis";

let client: Redis | null | undefined;

/** The database, or null when none is connected. */
export function redis(): Redis | null {
  if (client !== undefined) return client;
  // Vercel's Upstash integration names these KV_REST_API_*; Upstash's own are UPSTASH_REDIS_REST_*
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  client = url && token ? new Redis({ url, token }) : null;
  return client;
}

/**
 * On this machine, with no database connected, a stand-in kept in memory so
 * the site can be worked on. It forgets on every restart and is never used
 * in production.
 */
export const memoryAllowed = () => process.env.NODE_ENV !== "production";
