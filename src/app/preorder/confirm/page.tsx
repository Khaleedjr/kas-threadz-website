import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { after } from "next/server";
import { SiteFooter, SiteNav } from "@/components/site-chrome";
import { naira } from "@/lib/catalogue";
import { getCatalogue } from "@/lib/content";
import { mailReady, sendReceipt } from "@/lib/order-mail";
import { describe, recordPayment } from "@/lib/preorder-server";
import { countsOf, itemsOf, preorderStore } from "@/lib/preorder-store";
import { verifyPayment } from "@/lib/paystack";
import { receiptPath } from "@/lib/receipt";
import { whatsappLink } from "@/lib/site";
import { ClearCart } from "./clear-cart";

export const metadata: Metadata = {
  title: "Your order",
  robots: { index: false },
};

/*
 * Where Paystack sends the customer after paying. The payment is checked with
 * Paystack here, on the server, never taken on the page's word: only then is
 * it recorded and its sets counted as sold, and the receipt drawn and sent.
 * A payment that did not go through lets its sets go back.
 */
export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { reference: raw } = await searchParams;
  const reference = typeof raw === "string" ? raw.slice(0, 64) : "";
  const verified = reference ? await verifyPayment(reference).catch(() => null) : null;
  const cat = await getCatalogue();
  const { outcome, order } =
    verified && reference ? await recordPayment(reference, verified, cat) : { outcome: "invalid" as const, order: null };
  const paid = outcome !== "invalid" && order !== null;

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
  if (outcome === "recorded" && order) {
    // the email goes once, after this page has gone to the customer
    after(() => sendReceipt(order, cat, origin).catch((err) => console.error("Receipt email failed.", err)));
  }
  if (!paid && reference) {
    const pending = await preorderStore()?.pending(reference);
    if (pending) await preorderStore()?.release(reference, countsOf(pending.items));
  }

  const items = order ? itemsOf(order) : [];
  const first = order?.customer?.name.split(" ")[0];
  const receipt = order ? receiptPath(order.reference) : null;
  const d = order?.delivery;

  return (
    <div data-register="paper" className="ground-paper flex flex-1 flex-col text-[var(--on-surface)]">
      <SiteNav />
      <section id="main" className="mx-auto grid w-full max-w-[1100px] flex-1 items-start gap-[clamp(24px,4vw,56px)] px-5 py-[clamp(32px,6vw,64px)] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {paid && order ? (
          <>
            <ClearCart />
            <div className="md:sticky md:top-8">
              <p className="label" style={{ color: "var(--accent)" }}>
                Order confirmed
              </p>
              <h1 className="mt-3 text-[clamp(28px,4.5vw,44px)]">
                {first ? `Thank you, ${first}.` : "Thank you."} It is paid for and on the list.
              </h1>
              <p className="mt-4 text-[14px] leading-[1.72]" style={{ color: "var(--on-surface-soft)" }}>
                Your receipt is below: keep it, or save the picture.{" "}
                {mailReady()
                  ? `It is also on its way to ${order.customer?.email ?? "your email"}, with Paystack's own.`
                  : "Paystack has emailed its own receipt too."}{" "}
                The studio will be in touch on WhatsApp{d?.method === "pickup" ? " when it is ready to collect" : " about delivery"}.
              </p>
              <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 border-t border-dashed pt-5 text-[14px]" style={{ borderColor: "var(--line-dashed)" }}>
                <dt className="label" style={{ color: "var(--on-surface-soft)" }}>Reference</dt>
                <dd className="font-mono">{order.reference}</dd>
                {items.map((i, n) => {
                  const w = describe(i.garment, cat);
                  return (
                    <div key={n} className="contents">
                      <dt className="label" style={{ color: "var(--on-surface-soft)" }}>{i.qty > 1 ? `${i.qty} ×` : "Set"}</dt>
                      <dd>
                        {i.garment.length}″ {cat.terms[w.tier].name.toLowerCase()}, {i.described?.colour ?? w.colour}{" "}
                        {(i.described?.fabric ?? w.fabric).toLowerCase()}, <span className="font-mono text-[13px]">{i.garment.design}</span>,{" "}
                        {w.thread === "As designed" ? "thread as designed" : `${w.thread.toLowerCase()} thread`}
                      </dd>
                    </div>
                  );
                })}
                {d && (
                  <>
                    <dt className="label" style={{ color: "var(--on-surface-soft)" }}>{d.method === "pickup" ? "Collect" : "Delivery"}</dt>
                    <dd>
                      {d.method === "pickup" ? "From the atelier in Abuja" : [d.address, d.city, d.label].filter(Boolean).join(", ")}
                      {d.method === "delivery" && ` · ${d.fee ? naira(d.fee) : "free"}`}
                    </dd>
                  </>
                )}
                <dt className="label" style={{ color: "var(--on-surface-soft)" }}>Paid</dt>
                <dd className="price text-[16px]">{naira(order.paid)}</dd>
              </dl>
              <div className="mt-8 flex flex-wrap gap-3">
                {receipt && (
                  <a
                    href={receipt}
                    download={`KAS-THREADZ-${order.reference}.png`}
                    className="rounded-sm px-6 py-[13px] text-[10.5px] font-medium uppercase tracking-[0.2em]"
                    style={{ background: "var(--action)", color: "var(--on-action)" }}
                  >
                    Save the receipt
                  </a>
                )}
                <a
                  href={whatsappLink(`Hello, about my order ${order.reference}`)}
                  className="rounded-sm border px-6 py-[13px] text-[10.5px] font-medium uppercase tracking-[0.2em]"
                  style={{ borderColor: "var(--line-dashed)" }}
                >
                  WhatsApp the studio
                </a>
              </div>
            </div>
            {receipt && (
              <a href={receipt} target="_blank" rel="noopener" className="block">
                {/* drawn on the server when first opened; the picture itself is the receipt */}
                <Image
                  src={receipt}
                  alt={`Receipt for order ${order.reference}, with a picture of each jallabiya as it was built`}
                  width={1080}
                  height={1600}
                  unoptimized
                  priority
                  className="h-auto w-full rounded-sm border"
                  style={{ borderColor: "var(--line)" }}
                />
              </a>
            )}
          </>
        ) : (
          <div className="md:col-span-2 mx-auto max-w-[560px]">
            <p className="label" style={{ color: "var(--accent)" }}>
              Not paid
            </p>
            <h1 className="mt-3 text-[clamp(28px,4.5vw,44px)]">The payment did not go through.</h1>
            <p className="mt-4 text-[14px] leading-[1.72]" style={{ color: "var(--on-surface-soft)" }}>
              Nothing has been taken. Your sets have gone back on the list and your cart is as you left it, so you can try again, or
              message the studio if something looks wrong.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/checkout"
                className="rounded-sm px-6 py-[13px] text-[10.5px] font-medium uppercase tracking-[0.2em]"
                style={{ background: "var(--action)", color: "var(--on-action)" }}
              >
                Try again
              </Link>
              <a
                href={whatsappLink(reference ? `Hello, about my order ${reference}` : undefined)}
                className="rounded-sm border px-6 py-[13px] text-[10.5px] font-medium uppercase tracking-[0.2em]"
                style={{ borderColor: "var(--line-dashed)" }}
              >
                WhatsApp the studio
              </a>
            </div>
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
