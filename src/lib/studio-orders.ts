/*
 * The paid orders as the studio reads them: every field in words, in the
 * order it is worked from. Shared by the desk's pages and its spreadsheet.
 * Server only.
 */

import { naira } from "./catalogue";
import type { Catalogue } from "./content-defaults";
import type { PreorderGarment } from "./preorder";
import { describe } from "./preorder-server";
import { STATUS_LABEL, itemsOf, type Delivery, type Order, type OrderStatus } from "./preorder-store";

export type ItemRow = {
  garment: PreorderGarment;
  qty: number;
  size: string;
  fabric: string;
  colour: string;
  design: string;
  thread: string;
  /** each, in naira */
  price: number;
};

export type OrderRow = {
  reference: string;
  status: OrderStatus;
  statusLabel: string;
  note: string;
  /** when it was paid, ISO 8601, for sorting */
  at: string;
  /** when it was paid, in Abuja */
  date: string;
  name: string;
  email: string;
  phone: string;
  /** a WhatsApp chat with the customer, when the number can be read */
  whatsapp: string | null;
  items: ItemRow[];
  sets: number;
  /** the order in a line, for lists */
  summary: string;
  delivery: Delivery | null;
  /** where it goes, in a line */
  deliveryText: string;
  subtotal: number;
  paid: string;
  paidNaira: number;
};

const when = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Lagos",
});

/** A Nigerian number as WhatsApp wants it: country code, no plus, no leading nought. */
export function whatsappFor(phone: string): string | null {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 11) digits = `234${digits.slice(1)}`;
  return digits.length >= 10 ? `https://wa.me/${digits}` : null;
}

export const threadWords = (thread: string) => (thread === "As designed" ? "thread as designed" : `${thread.toLowerCase()} thread`);

export function orderRow(o: Order, cat: Catalogue): OrderRow {
  const items: ItemRow[] = itemsOf(o).map((i) => {
    const w = describe(i.garment, cat);
    return {
      garment: i.garment,
      qty: i.qty,
      size: w.size,
      // the names the customer paid for, before any the studio has given since
      fabric: i.described?.fabric || w.fabric,
      colour: i.described?.colour || w.colour,
      design: w.design,
      thread: w.thread,
      price: i.price,
    };
  });
  const sets = items.reduce((n, i) => n + i.qty, 0);
  const phone = o.customer?.phone ?? "";
  const d = o.delivery ?? null;
  const first = items[0];
  return {
    reference: o.reference,
    status: o.status,
    statusLabel: STATUS_LABEL[o.status],
    note: o.note,
    at: o.at,
    date: when.format(new Date(o.at)),
    name: o.customer?.name ?? "",
    email: o.customer?.email ?? "",
    phone,
    whatsapp: phone ? whatsappFor(phone) : null,
    items,
    sets,
    summary: first
      ? items.length === 1 && first.qty === 1
        ? `${first.size}, ${first.colour} ${first.fabric.toLowerCase()}, ${first.design}`
        : `${sets} sets: ${items.map((i) => `${i.qty > 1 ? `${i.qty} × ` : ""}${i.garment.length}″ ${i.colour.toLowerCase()}`).join(", ")}`
      : "",
    delivery: d,
    deliveryText: d
      ? d.method === "pickup"
        ? "Collect from the atelier"
        : `${[d.address, d.city].filter(Boolean).join(", ")} (${d.label})`
      : "",
    subtotal: o.subtotal ?? items.reduce((n, i) => n + i.price * i.qty, 0),
    paid: naira(o.paid),
    paidNaira: o.paid,
  };
}
