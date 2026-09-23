/*
 * Paystack, for taking the preorder's payment in full.
 *
 * The secret key lives only in the host's environment as PAYSTACK_SECRET_KEY
 * and is only read here, on the server. Paystack sends the customer back to
 * the site after paying, and separately calls the webhook; either one
 * confirming the payment is enough, and confirming twice does nothing.
 *
 * On this machine, with no key set, payments are simulated so the whole flow
 * can be tried end to end. That never happens in production.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

const API = "https://api.paystack.co";

const secret = () => process.env.PAYSTACK_SECRET_KEY;

/** True when there is no key and this is not production: pretend to pay. */
export const simulated = () => !secret() && process.env.NODE_ENV !== "production";

export const paystackReady = () => Boolean(secret()) || simulated();

/* the simulated payments started on this machine, so they can be "verified" as Paystack would */
const practice = globalThis as unknown as {
  __kasSimulated?: Map<string, { amount: number; metadata: Record<string, unknown> }>;
};
const simulatedPayments = () => (practice.__kasSimulated ??= new Map());

export async function startPayment(input: {
  email: string;
  /** in naira; Paystack takes kobo */
  amount: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}): Promise<string> {
  if (simulated()) {
    simulatedPayments().set(input.reference, { amount: input.amount, metadata: input.metadata });
    const back = new URL(input.callbackUrl);
    back.searchParams.set("reference", input.reference);
    back.searchParams.set("simulated", "1");
    return back.toString();
  }
  const res = await fetch(`${API}/transaction/initialize`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: input.email,
      amount: input.amount * 100,
      currency: "NGN",
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    }),
  });
  const body = await res.json();
  if (!res.ok || !body?.status) throw new Error(body?.message ?? "Paystack would not start the payment");
  return body.data.authorization_url as string;
}

export type Verified = {
  paid: boolean;
  /** in naira */
  amount: number;
  metadata: Record<string, unknown> | null;
};

/** Ask Paystack whether a payment went through, and for how much. */
export async function verifyPayment(reference: string): Promise<Verified> {
  if (simulated()) {
    const p = simulatedPayments().get(reference);
    return { paid: Boolean(p), amount: p?.amount ?? 0, metadata: p?.metadata ?? null };
  }
  const res = await fetch(`${API}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret()}` },
    cache: "no-store",
  });
  const body = await res.json();
  const data = body?.data;
  return {
    paid: Boolean(body?.status) && data?.status === "success" && data?.currency === "NGN",
    amount: Number(data?.amount ?? 0) / 100,
    metadata: data?.metadata ?? null,
  };
}

/** Whether a webhook call really came from Paystack: its body signed with our secret key. */
export function signedByPaystack(rawBody: string, signature: string | null): boolean {
  const key = secret();
  if (!key || !signature) return false;
  const expected = createHmac("sha512", key).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
