import { naira } from "@/lib/catalogue";
import { getCatalogue } from "@/lib/content";
import { newReference, priceCheckout } from "@/lib/preorder-server";
import { countsOf, preorderStore } from "@/lib/preorder-store";
import { paystackReady, startPayment } from "@/lib/paystack";

/*
 * Check out a cart: check every build, price it all here from the studio's
 * own prices and delivery fees, hold every set in it, keep the order as
 * priced, and hand the customer to Paystack to pay exactly that. Nothing the
 * page sends sets a price.
 */
export async function POST(request: Request) {
  const store = preorderStore();
  if (!store || !paystackReady()) {
    return Response.json({ error: "Orders are not taking payment yet. Please WhatsApp the studio." }, { status: 503 });
  }
  const cat = await getCatalogue();
  if (!cat.preorder.open) {
    return Response.json({ error: "Preorders are closed for now. Please WhatsApp the studio." }, { status: 409 });
  }

  const priced = priceCheckout(await request.json().catch(() => null), cat);
  if ("error" in priced) return Response.json({ error: priced.error }, { status: 400 });

  const reference = newReference();
  const counts = countsOf(priced.items);
  const held = await store.hold(reference, counts, cat.terms);
  if (held !== "held") {
    const left = (await store.stock(cat.terms))[held].left;
    return Response.json(
      {
        error:
          left === 0
            ? `The ${cat.terms[held].name.toLowerCase()} sets are all taken.`
            : `Only ${left} ${cat.terms[held].name.toLowerCase()} ${left === 1 ? "set is" : "sets are"} left. Take some out of your cart and try again.`,
      },
      { status: 409 },
    );
  }

  try {
    await store.savePending({ ...priced, reference, createdAt: new Date().toISOString() });
    const sets = priced.items.reduce((n, i) => n + i.qty, 0);
    const summary = priced.items
      .map((i) => `${i.qty} × ${i.garment.length}" ${i.described?.colour ?? ""} ${i.described?.fabric?.toLowerCase() ?? ""}, ${i.garment.design}`)
      .join("; ")
      .slice(0, 480);
    const url = await startPayment({
      email: priced.customer.email,
      amount: priced.total,
      reference,
      callbackUrl: `${new URL(request.url).origin}/preorder/confirm`,
      // shown on the transaction in the Paystack dashboard; the order itself is kept here
      metadata: {
        sets,
        custom_fields: [
          { display_name: "Name", variable_name: "name", value: priced.customer.name },
          { display_name: "Phone", variable_name: "phone", value: priced.customer.phone },
          { display_name: "Order", variable_name: "order", value: summary },
          {
            display_name: "Delivery",
            variable_name: "delivery",
            value: `${priced.delivery.label}, ${priced.delivery.fee ? naira(priced.delivery.fee) : "no fee"}`,
          },
        ],
      },
    });
    return Response.json({ url, reference });
  } catch {
    await store.release(reference, counts);
    return Response.json({ error: "We could not reach Paystack. Please try again in a moment." }, { status: 502 });
  }
}
