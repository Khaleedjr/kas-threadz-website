/*
 * The receipt, sent: an email to the customer with the receipt picture
 * attached and a link to it, and a copy to the studio if it wants one.
 * Sent through Resend once three settings are in the host's environment:
 *
 *   RESEND_API_KEY       the key from resend.com
 *   ORDER_EMAIL_FROM     who it is from, on a domain Resend has verified,
 *                        for example: KAS THREADZ <orders@kasthreadz.com>
 *   ORDER_EMAIL_STUDIO   optional: where the studio's copy goes
 *
 * Without them nothing is sent, and the customer still has the receipt on
 * the page they land on after paying, and Paystack's own emailed receipt.
 * Server only.
 */

import { naira } from "./catalogue";
import type { Catalogue } from "./content-defaults";
import { describe } from "./preorder-server";
import { itemsOf, type StoredOrder } from "./preorder-store";
import { receiptImage, receiptPath } from "./receipt";
import { SITE, whatsappLink } from "./site";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const mailReady = () => Boolean(process.env.RESEND_API_KEY && process.env.ORDER_EMAIL_FROM);

export async function sendReceipt(order: StoredOrder, cat: Catalogue, origin: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_EMAIL_FROM;
  const to = order.customer?.email;
  if (!key || !from || !to) return false;

  const png = Buffer.from(await (await receiptImage(order, cat, origin)).arrayBuffer());
  const link = `${origin}${receiptPath(order.reference)}`;
  const first = order.customer?.name.split(" ")[0] ?? "";
  const lines = itemsOf(order).map((i) => {
    const w = describe(i.garment, cat);
    return `${i.qty} × ${i.garment.length}″ ${cat.terms[w.tier].name.toLowerCase()}, ${i.described?.colour ?? w.colour} ${(i.described?.fabric ?? w.fabric).toLowerCase()}, ${i.garment.design}, ${w.thread === "As designed" ? "thread as designed" : `${w.thread.toLowerCase()} thread`}: ${naira(i.price * i.qty)}`;
  });
  const d = order.delivery;
  const delivery = d
    ? d.method === "pickup"
      ? "Collect from the atelier in Abuja. We message you on WhatsApp when it is ready."
      : `Delivery to ${[d.address, d.city, d.label].filter(Boolean).join(", ")}: ${d.fee ? naira(d.fee) : "free"}, ${d.eta.toLowerCase()} once it is made.`
    : "";

  const text = [
    `Thank you${first ? `, ${first}` : ""}. Your order is paid for and on the list.`,
    "",
    `Order ${order.reference}`,
    ...lines,
    delivery,
    `Paid: ${naira(order.paid)}`,
    "",
    `Your receipt: ${link}`,
    `Questions: WhatsApp ${SITE.phoneDisplay}`,
  ].join("\n");

  const html = `<!doctype html><html><body style="margin:0;background:#f2eee5;font-family:Helvetica,Arial,sans-serif;color:#232a33">
<div style="max-width:560px;margin:0 auto;padding:32px 24px">
<p style="font:12px monospace;letter-spacing:3px;text-transform:uppercase;color:#9d3b2c;margin:0">KAS THREADZ · Receipt</p>
<h1 style="font-size:26px;margin:12px 0 6px">Thank you${first ? `, ${esc(first)}` : ""}.</h1>
<p style="font-size:15px;line-height:1.6;color:#5d6673;margin:0 0 20px">Your order is paid for and on the list. Your receipt is attached, with a picture of each jallabiya as you built it.</p>
<a href="${esc(link)}"><img src="${esc(link)}" alt="Your receipt" width="512" style="display:block;width:100%;height:auto;border:1px solid rgba(35,42,51,.16)"></a>
<p style="font:13px monospace;letter-spacing:1px;margin:20px 0 6px">${esc(order.reference)}</p>
<ul style="font-size:14px;line-height:1.6;padding-left:18px;margin:0 0 12px">${lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>
<p style="font-size:14px;line-height:1.6;margin:0 0 6px">${esc(delivery)}</p>
<p style="font:16px monospace;margin:0 0 24px"><strong>Paid: ${esc(naira(order.paid))}</strong></p>
<p style="font-size:14px;line-height:1.6;color:#5d6673;margin:0">Questions? <a href="${esc(whatsappLink(`Hello, about my order ${order.reference}`))}" style="color:#9d3b2c">WhatsApp the studio</a> on ${esc(SITE.phoneDisplay)}.</p>
</div></body></html>`;

  const studio = process.env.ORDER_EMAIL_STUDIO;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      ...(studio ? { bcc: [studio] } : {}),
      subject: `Your KAS THREADZ order ${order.reference}`,
      html,
      text,
      attachments: [{ filename: `KAS-THREADZ-${order.reference}.png`, content: png.toString("base64") }],
    }),
  });
  if (!res.ok) {
    console.error("The receipt email was not sent.", res.status, await res.text().catch(() => ""));
    return false;
  }
  return true;
}
