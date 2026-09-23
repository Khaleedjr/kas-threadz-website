import { getCatalogue } from "@/lib/content";
import { preorderStore } from "@/lib/preorder-store";
import { receiptImage, receiptKeyMatches } from "@/lib/receipt";

/*
 * A paid order's receipt, as a picture. Only with the signature its address
 * was given with: an order is the customer's and the studio's alone.
 */
export async function GET(request: Request, { params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const reference = decodeURIComponent(ref).replace(/\.png$/i, "").slice(0, 64);
  const url = new URL(request.url);
  if (!receiptKeyMatches(reference, url.searchParams.get("k"))) return new Response("Not found.", { status: 404 });
  const order = await preorderStore()?.order(reference);
  if (!order) return new Response("Not found.", { status: 404 });
  try {
    return await receiptImage(order, await getCatalogue(), url.origin);
  } catch (err) {
    console.error("The receipt could not be drawn.", err);
    return new Response("The receipt could not be drawn just now. Please try again.", { status: 500 });
  }
}
