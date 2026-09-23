import { getCatalogue } from "@/lib/content";
import { checkOrder, describe, newReference } from "@/lib/preorder-server";
import { preorderStore } from "@/lib/preorder-store";
import { paystackReady, startPayment } from "@/lib/paystack";

/*
 * Start a preorder: check it, hold a set for the customer, and hand them to
 * Paystack to pay the full price. The price is set here, from the size, never
 * taken from the page.
 */
export async function POST(request: Request) {
  const store = preorderStore();
  if (!store || !paystackReady()) {
    return Response.json({ error: "Preorders are not taking payment yet. Please WhatsApp the studio." }, { status: 503 });
  }

  const cat = await getCatalogue();
  if (!cat.preorder.open) {
    return Response.json({ error: "Preorders are closed for now. Please WhatsApp the studio." }, { status: 409 });
  }
  const order = checkOrder(await request.json().catch(() => null), cat);
  if ("error" in order) return Response.json({ error: order.error }, { status: 400 });

  const words = describe(order.garment, cat);
  const { tier } = words;
  const reference = newReference();
  const { price, total, name } = cat.terms[tier];
  if (!(await store.hold(tier, reference, total))) {
    return Response.json({ error: `The ${name.toLowerCase()} sets are all taken.` }, { status: 409 });
  }

  try {
    const url = await startPayment({
      email: order.customer.email,
      amount: price,
      reference,
      callbackUrl: `${new URL(request.url).origin}/preorder/confirm`,
      metadata: {
        tier,
        // the price charged, so the payment is checked against it even if it changes meanwhile
        price,
        garment: order.garment,
        // the order in the words the customer saw, kept whatever the studio renames later
        described: { fabric: words.fabric, colour: words.colour },
        customer: order.customer,
        // shown on the transaction in the Paystack dashboard
        custom_fields: [
          { display_name: "Name", variable_name: "name", value: order.customer.name },
          { display_name: "Phone", variable_name: "phone", value: order.customer.phone },
          { display_name: "Size", variable_name: "size", value: words.size },
          { display_name: "Fabric", variable_name: "fabric", value: words.fabric },
          { display_name: "Colour", variable_name: "colour", value: words.colour },
          { display_name: "Neckline", variable_name: "design", value: words.design },
          { display_name: "Thread", variable_name: "thread", value: words.thread },
        ],
      },
    });
    return Response.json({ url, reference });
  } catch {
    await store.release(tier, reference);
    return Response.json({ error: "We could not reach Paystack. Please try again in a moment." }, { status: 502 });
  }
}
