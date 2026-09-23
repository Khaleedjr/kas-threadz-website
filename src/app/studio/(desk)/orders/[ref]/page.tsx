import Link from "next/link";
import { notFound } from "next/navigation";
import { getContent } from "@/lib/content";
import { ORDER_STATUSES, STATUS_LABEL, preorderStore } from "@/lib/preorder-store";
import { requireStudio } from "@/lib/studio-auth";
import { orderRow } from "@/lib/studio-orders";
import { updateOrder } from "../../actions";
import { PageHead, Panel, Saved, StatusBadge, SubmitButton, dateTime, fieldClass } from "../../ui";

export const metadata = { title: "Order" };

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ ref: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireStudio();
  const { ref } = await params;
  const { saved } = await searchParams;
  const reference = decodeURIComponent(ref).slice(0, 64);
  const order = await preorderStore()?.order(reference);
  if (!order) notFound();
  const r = orderRow(order, await getContent());
  const first = r.name.split(" ")[0] || "there";
  // a ready message the studio can send as it is, or change
  const message = `Hello ${first}, this is KAS THREADZ about your jallabiya (${r.reference}). It is now ${STATUS_LABEL[r.status].toLowerCase()}.`;

  const facts: Array<[string, React.ReactNode]> = [
    ["Size", r.size],
    ["Fabric", r.fabric],
    ["Colour", r.colour],
    ["Neckline", <span key="d" className="code">{r.design}</span>],
    ["Thread", r.thread],
    ["Paid", <span key="p" className="price">{r.paid}</span>],
    ["Paid on", r.date],
    ["Reference", <span key="r" className="code text-[12px]">{r.reference}</span>],
  ];

  return (
    <>
      <Link href="/studio/orders" className="label mb-4 inline-block underline underline-offset-4" style={{ color: "var(--on-surface-soft)" }}>
        All orders
      </Link>
      <PageHead title={r.name || r.reference} note={`${r.size}, ${r.colour.toLowerCase()} ${r.fabric.toLowerCase()}, ${r.design}.`}>
        <StatusBadge status={r.status} />
      </PageHead>
      <Saved show={saved === "1"}>Saved.</Saved>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Panel title="The order">
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-3 text-[14px]">
            {facts.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="label pt-[3px]" style={{ color: "var(--on-surface-soft)" }}>
                  {k}
                </dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <div className="grid content-start gap-3">
          <Panel title="Customer">
            <p className="text-[15px] font-medium">{r.name}</p>
            {r.whatsapp && (
              <a
                href={`${r.whatsapp}?text=${encodeURIComponent(message)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block underline underline-offset-4"
                style={{ color: "var(--accent)" }}
              >
                {r.phone} · message on WhatsApp
              </a>
            )}
            {r.email && (
              <a href={`mailto:${r.email}`} className="mt-2 block break-all text-[13px]" style={{ color: "var(--on-surface-soft)" }}>
                {r.email}
              </a>
            )}
            <Link
              href={`/studio/orders?q=${encodeURIComponent(r.email || r.phone)}`}
              className="label mt-3 inline-block underline underline-offset-4"
              style={{ color: "var(--on-surface-soft)" }}
            >
              Their other orders
            </Link>
          </Panel>

          <Panel title="In the workshop">
            <form action={updateOrder.bind(null, r.reference)} className="grid gap-3">
              <select name="status" defaultValue={r.status} className={fieldClass} style={{ borderColor: "var(--line-dashed)" }}>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
              <textarea
                name="note"
                defaultValue={r.note}
                rows={4}
                placeholder="Notes: measurements taken, delivery address, anything to remember"
                className={fieldClass}
                style={{ borderColor: "var(--line-dashed)" }}
              />
              <p className="text-[12px] leading-snug" style={{ color: "var(--on-surface-soft)" }}>
                Cancelling gives the set back to the count on the Loom. Refunds are made in Paystack.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <SubmitButton>Save</SubmitButton>
                {order.updatedAt && (
                  <span className="label" style={{ color: "var(--on-surface-soft)" }}>
                    Last changed {dateTime(order.updatedAt)}
                  </span>
                )}
              </div>
            </form>
          </Panel>
        </div>
      </div>
    </>
  );
}
