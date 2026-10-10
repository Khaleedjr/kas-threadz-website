/*
 * Which browser started an order. The checkout marks the browser it was
 * started in, and the page Paystack sends the customer back to shows the
 * order's name, address and receipt only to that browser. Anyone else who
 * has the reference, from a screenshot or a forwarded message, sees that it
 * is paid and nothing more.
 *
 * Each entry is a reference and its receipt signature, so the cookie cannot
 * be written by hand. Server only.
 */

import { cookies } from "next/headers";
import { receiptKey, receiptKeyMatches } from "./receipt";

const BUYER_COOKIE = "kas_orders";
/** the last few orders started in this browser */
const KEPT = 5;
const KEPT_S = 30 * 24 * 60 * 60;

const entries = (value: string) =>
  value
    .split("|")
    .map((e) => {
      const dot = e.lastIndexOf(".");
      return { reference: e.slice(0, dot), key: e.slice(dot + 1) };
    })
    .filter((e) => e.reference && e.key);

/** Mark this browser as the one that started the order. */
export async function markBuyer(reference: string): Promise<void> {
  const jar = await cookies();
  const kept = entries(jar.get(BUYER_COOKIE)?.value ?? "").filter((e) => e.reference !== reference);
  const next = [{ reference, key: receiptKey(reference) }, ...kept].slice(0, KEPT);
  jar.set(BUYER_COOKIE, next.map((e) => `${e.reference}.${e.key}`).join("|"), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // lax, so it comes back with the customer when Paystack sends them here
    sameSite: "lax",
    path: "/preorder",
    maxAge: KEPT_S,
  });
}

/** Whether this browser started the order. */
export async function isBuyer(reference: string): Promise<boolean> {
  const value = (await cookies()).get(BUYER_COOKIE)?.value ?? "";
  return entries(value).some((e) => e.reference === reference && receiptKeyMatches(reference, e.key));
}
