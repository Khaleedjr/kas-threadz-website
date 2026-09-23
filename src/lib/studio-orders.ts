/*
 * The paid orders as the studio reads them: every field in words, in the
 * order it is worked from. Shared by the studio's page and its spreadsheet.
 * Server only.
 */

import { naira } from "./catalogue";
import { describe } from "./preorder-server";
import type { StoredOrder } from "./preorder-store";

export type OrderRow = {
  reference: string;
  /** when it was paid, in Abuja */
  date: string;
  name: string;
  email: string;
  phone: string;
  /** a WhatsApp chat with the customer, when the number can be read */
  whatsapp: string | null;
  size: string;
  fabric: string;
  colour: string;
  design: string;
  thread: string;
  paid: string;
  paidNaira: number;
};

const when = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Lagos",
});

/** A Nigerian number as WhatsApp wants it: country code, no plus, no leading nought. */
function whatsappFor(phone: string): string | null {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 11) digits = `234${digits.slice(1)}`;
  return digits.length >= 10 ? `https://wa.me/${digits}` : null;
}

export function orderRow(o: StoredOrder): OrderRow {
  const words = o.garment ? describe(o.garment) : null;
  const phone = o.customer?.phone ?? "";
  return {
    reference: o.reference,
    date: when.format(new Date(o.at)),
    name: o.customer?.name ?? "",
    email: o.customer?.email ?? "",
    phone,
    whatsapp: phone ? whatsappFor(phone) : null,
    size: words?.size ?? o.tier,
    fabric: words?.fabric ?? "",
    colour: words?.colour ?? "",
    design: words?.design ?? "",
    thread: words?.thread ?? "",
    paid: naira(o.paid),
    paidNaira: o.paid,
  };
}
