import { getCatalogue } from "@/lib/content";
import { preorderStore } from "@/lib/preorder-store";
import { orderRow } from "@/lib/studio-orders";
import { signedIn } from "@/lib/studio-auth";

/*
 * Every paid preorder as a spreadsheet, for the studio only. Opens in Excel,
 * Numbers or Google Sheets.
 */

const COLUMNS = [
  ["Date", "date"],
  ["Reference", "reference"],
  ["Status", "statusLabel"],
  ["Name", "name"],
  ["Phone", "phone"],
  ["Email", "email"],
  ["Size", "size"],
  ["Fabric", "fabric"],
  ["Colour", "colour"],
  ["Neckline", "design"],
  ["Thread", "thread"],
  ["Paid (NGN)", "paidNaira"],
  ["Note", "note"],
] as const;

/** One cell: quoted, and never read by a spreadsheet as a formula. */
function cell(value: string | number): string {
  let v = String(value);
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
  return `"${v.replace(/"/g, '""')}"`;
}

/**
 * A phone number kept as written: a spreadsheet would otherwise read it as a
 * number and drop its leading nought. The order check lets only digits and a
 * plus through, so wrapping it this way can carry nothing else.
 */
const phoneCell = (phone: string) => (/^\+?\d+$/.test(phone) ? `"=""${phone}"""` : cell(phone));

export async function GET() {
  if (!(await signedIn())) return new Response("Sign in at /studio first.", { status: 401 });
  const store = preorderStore();
  if (!store) return new Response("The preorder database is not connected.", { status: 503 });

  const cat = await getCatalogue();
  const rows = (await store.orders()).map((o) => orderRow(o, cat));
  const lines = [
    COLUMNS.map(([title]) => cell(title)).join(","),
    ...rows.map((r) => COLUMNS.map(([, k]) => (k === "phone" ? phoneCell(r.phone) : cell(r[k]))).join(",")),
  ];
  const day = new Date().toISOString().slice(0, 10);
  // the byte order mark tells Excel the file is UTF-8, so ₦ and names come through
  return new Response(`\uFEFF${lines.join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kas-threadz-preorders-${day}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
