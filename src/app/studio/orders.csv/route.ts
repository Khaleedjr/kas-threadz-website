import { getContent } from "@/lib/content";
import { preorderStore } from "@/lib/preorder-store";
import { orderRow } from "@/lib/studio-orders";
import { signedIn } from "@/lib/studio-auth";

/*
 * Every paid order as a spreadsheet, for the studio only, one line for each
 * build so the workshop can cut from it. The order's delivery and total sit
 * on its first line only, so the columns add up. Opens in Excel, Numbers or
 * Google Sheets.
 */

const HEAD = [
  "Date", "Reference", "Status", "Name", "Phone", "Email",
  "Qty", "Size", "Fabric", "Colour", "Neckline", "Thread", "Each (NGN)", "Line (NGN)",
  "Delivery", "Address", "Delivery fee (NGN)", "Order paid (NGN)", "Note",
];

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

  const cat = await getContent();
  const lines = [HEAD.map(cell).join(",")];
  for (const r of (await store.orders()).map((o) => orderRow(o, cat))) {
    r.items.forEach((i, n) => {
      const firstLine = n === 0;
      lines.push(
        [
          cell(r.date), cell(r.reference), cell(r.statusLabel), cell(r.name), phoneCell(r.phone), cell(r.email),
          cell(i.qty), cell(i.size), cell(i.fabric), cell(i.colour), cell(i.design), cell(i.thread), cell(i.price), cell(i.price * i.qty),
          cell(firstLine && r.delivery ? r.delivery.label : ""),
          cell(firstLine && r.delivery?.method === "delivery" ? [r.delivery.address, r.delivery.city].filter(Boolean).join(", ") : ""),
          cell(firstLine && r.delivery ? r.delivery.fee : ""),
          cell(firstLine ? r.paidNaira : ""),
          cell(firstLine ? r.note : ""),
        ].join(","),
      );
    });
  }
  const day = new Date().toISOString().slice(0, 10);
  // the byte order mark tells Excel the file is UTF-8, so the naira sign and names come through
  return new Response(`﻿${lines.join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kas-threadz-orders-${day}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
