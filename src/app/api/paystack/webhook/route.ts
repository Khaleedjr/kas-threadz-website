import { after } from "next/server";
import { getCatalogue } from "@/lib/content";
import { sendReceipt } from "@/lib/order-mail";
import { recordPayment } from "@/lib/preorder-server";
import { signedByPaystack, verifyPayment } from "@/lib/paystack";

/*
 * Paystack calls this when a payment succeeds, whether or not the customer
 * made it back to the site. Its signature is checked, and the payment is
 * confirmed with Paystack again before it is counted.
 *
 * Set in the Paystack dashboard, Settings, API Keys & Webhooks:
 * https://kasthreadz.com/api/paystack/webhook
 */
export async function POST(request: Request) {
  const raw = await request.text();
  if (!signedByPaystack(raw, request.headers.get("x-paystack-signature"))) {
    return new Response("Not signed by Paystack", { status: 401 });
  }
  const event = JSON.parse(raw) as { event?: string; data?: { reference?: string } };
  const reference = event.data?.reference;
  if (event.event === "charge.success" && reference) {
    const cat = await getCatalogue();
    const { outcome, order } = await recordPayment(reference, await verifyPayment(reference), cat);
    // the customer never came back to the site: the receipt still goes to them
    if (outcome === "recorded" && order) {
      const origin = new URL(request.url).origin;
      after(() => sendReceipt(order, cat, origin).catch((err) => console.error("Receipt email failed.", err)));
    }
  }
  // Paystack only needs to hear it arrived
  return new Response("ok");
}
