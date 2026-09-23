import { getCatalogue } from "@/lib/content";
import { preorderStore } from "@/lib/preorder-store";

/** How many sets of each tier are left. Read fresh every time: it is a live count. */
export async function GET() {
  const store = preorderStore();
  if (!store) return Response.json({ error: "The preorder count is not connected yet." }, { status: 503 });
  const { terms } = await getCatalogue();
  return Response.json(await store.stock(terms), { headers: { "Cache-Control": "no-store" } });
}
