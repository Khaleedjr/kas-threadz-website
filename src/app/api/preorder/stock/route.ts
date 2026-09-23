import { preorderStore } from "@/lib/preorder-store";

/** How many sets of each tier are left. Read fresh every time: it is a live count. */
export async function GET() {
  const store = preorderStore();
  if (!store) return Response.json({ error: "The preorder count is not connected yet." }, { status: 503 });
  return Response.json(await store.stock(), { headers: { "Cache-Control": "no-store" } });
}
