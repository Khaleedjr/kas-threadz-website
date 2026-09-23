/*
 * The studio's way in: one password, kept only in the host's environment as
 * STUDIO_PASSWORD, never in the code. Signing in sets a cookie that proves
 * it for twelve hours. The cookie is signed with the password itself, so
 * changing the password signs everybody out.
 *
 * Server only: read by the studio's page, its actions and its download.
 */

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const STUDIO_COOKIE = "kas_studio";
/** How long a sign-in lasts, in seconds. */
export const STUDIO_SESSION = 12 * 60 * 60;

const password = () => process.env.STUDIO_PASSWORD ?? "";

/** Whether a password has been set on the host at all. */
export const studioReady = () => password().length > 0;

const same = (a: string, b: string) => {
  // hashed first, so the comparison takes as long whatever the lengths
  const x = createHash("sha256").update(a).digest();
  const y = createHash("sha256").update(b).digest();
  return timingSafeEqual(x, y);
};

const sign = (until: number) =>
  createHmac("sha256", password()).update(`kas-studio:${until}`).digest("hex");

export function passwordMatches(attempt: string): boolean {
  return studioReady() && same(attempt, password());
}

/** A new cookie value: when it runs out, and the signature over that. */
export function newSession(): string {
  const until = Date.now() + STUDIO_SESSION * 1000;
  return `${until}.${sign(until)}`;
}

/** Whether this request carries a live, genuine sign-in. */
export async function signedIn(): Promise<boolean> {
  if (!studioReady()) return false;
  const value = (await cookies()).get(STUDIO_COOKIE)?.value ?? "";
  const [raw, signature = ""] = value.split(".");
  const until = Number(raw);
  if (!Number.isFinite(until) || until < Date.now()) return false;
  return same(signature, sign(until));
}
