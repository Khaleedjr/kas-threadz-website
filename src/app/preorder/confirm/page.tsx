import Link from "next/link";
import type { Metadata } from "next";
import { SiteFooter, SiteNav } from "@/components/site-chrome";
import { naira } from "@/lib/catalogue";
import { PREORDER, type PreorderGarment, type PreorderCustomer, type Tier } from "@/lib/preorder";
import { describe, recordPayment } from "@/lib/preorder-server";
import { preorderStore } from "@/lib/preorder-store";
import { verifyPayment } from "@/lib/paystack";
import { whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Your preorder",
  robots: { index: false },
};

/*
 * Where Paystack sends the customer after paying. The payment is checked with
 * Paystack here, on the server, never taken on the page's word: only then is
 * it recorded and the set counted as sold. A payment that did not go through
 * releases the set held for it.
 */
export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { reference: raw } = await searchParams;
  const reference = typeof raw === "string" ? raw.slice(0, 64) : "";
  const verified = reference ? await verifyPayment(reference).catch(() => null) : null;
  const meta = (verified?.metadata ?? {}) as {
    tier?: Tier;
    garment?: PreorderGarment;
    customer?: PreorderCustomer;
  };
  const outcome = verified && reference ? await recordPayment(reference, verified) : "invalid";
  const paid = outcome !== "invalid";

  if (!paid && reference && meta.tier && meta.tier in PREORDER) {
    await preorderStore()?.release(meta.tier, reference);
  }

  const words = meta.garment ? describe(meta.garment) : null;
  const first = meta.customer?.name.split(" ")[0];

  return (
    <div data-register="paper" className="ground-paper flex flex-1 flex-col text-[var(--on-surface)]">
      <SiteNav />
      <section id="main" className="mx-auto flex w-full max-w-[560px] flex-1 flex-col justify-center px-5 py-16">
        {paid && words && meta.tier ? (
          <>
            <p className="label" style={{ color: "var(--accent)" }}>
              Preorder confirmed
            </p>
            <h1 className="mt-3 text-[clamp(28px,4.5vw,44px)]">
              {first ? `Thank you, ${first}.` : "Thank you."} It is paid for and on the list.
            </h1>
            <p className="mt-4 text-[14px] leading-[1.72]" style={{ color: "var(--on-surface-soft)" }}>
              Your jallabiya is one of the first {PREORDER.adult.total + PREORDER.children.total} sets.
              Paystack has sent the receipt to your email, and the studio will be in touch on WhatsApp
              about delivery.
            </p>
            <dl
              className="mt-8 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t border-dashed pt-5 text-[13px]"
              style={{ borderColor: "var(--line-dashed)" }}
            >
              {[
                ["Reference", reference],
                ["Size", words.size],
                ["Fabric", words.fabric],
                ["Colour", words.colour],
                ["Neckline", words.design],
                ["Thread", words.thread],
                ["Paid", naira(PREORDER[meta.tier].price)],
              ].map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="label" style={{ color: "var(--on-surface-soft)" }}>
                    {k}
                  </dt>
                  <dd className={k === "Reference" ? "font-mono" : ""}>{v}</dd>
                </div>
              ))}
            </dl>
          </>
        ) : (
          <>
            <p className="label" style={{ color: "var(--accent)" }}>
              Not paid
            </p>
            <h1 className="mt-3 text-[clamp(28px,4.5vw,44px)]">The payment did not go through.</h1>
            <p className="mt-4 text-[14px] leading-[1.72]" style={{ color: "var(--on-surface-soft)" }}>
              Nothing has been taken. Your set has gone back on the list, so you can try again from
              the Loom, or message the studio if something looks wrong.
            </p>
          </>
        )}
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/loom"
            className="rounded-sm px-6 py-[13px] text-[10.5px] font-medium uppercase tracking-[0.2em]"
            style={{ background: "var(--action)", color: "var(--on-action)" }}
          >
            {paid ? "Back to the Loom" : "Try again"}
          </Link>
          <a
            href={whatsappLink(reference ? `Hello, about my preorder ${reference}` : undefined)}
            className="rounded-sm border px-6 py-[13px] text-[10.5px] font-medium uppercase tracking-[0.2em]"
            style={{ borderColor: "var(--line-dashed)" }}
          >
            WhatsApp the studio
          </a>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
