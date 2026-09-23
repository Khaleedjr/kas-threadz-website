import Link from "next/link";
import { getContent } from "@/lib/content";
import { ORDER_STATUSES, STATUS_LABEL, preorderStore, type OrderStatus } from "@/lib/preorder-store";
import { requireStudio } from "@/lib/studio-auth";
import { orderRow } from "@/lib/studio-orders";
import { PageHead, Panel, StatusBadge, fieldClass } from "../ui";

export const metadata = { title: "Orders" };

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireStudio();
  const sp = await searchParams;
  const status = typeof sp.status === "string" && (ORDER_STATUSES as readonly string[]).includes(sp.status) ? (sp.status as OrderStatus) : null;
  const tier = sp.tier === "adult" || sp.tier === "children" ? sp.tier : null;
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase().slice(0, 80) : "";

  const store = preorderStore();
  const cat = await getContent();
  const all = store ? await store.orders() : [];
  const rows = all
    .filter((o) => !status || o.status === status)
    .filter((o) => !tier || o.tier === tier)
    .filter((o) => {
      if (!q) return true;
      const c = o.customer;
      const digits = q.replace(/\D/g, "");
      return (
        o.reference.toLowerCase().includes(q) ||
        c?.name.toLowerCase().includes(q) ||
        c?.email.toLowerCase().includes(q) ||
        (digits.length >= 4 && c?.phone.replace(/\D/g, "").includes(digits))
      );
    })
    .map((o) => orderRow(o, cat));

  return (
    <>
      <PageHead title="Orders" note={`${all.length} paid ${all.length === 1 ? "order" : "orders"} in all. Open one to move it along the workshop or add a note.`}>
        {all.length > 0 && (
          <a
            href="/studio/orders.csv"
            className="rounded-sm border px-4 py-[10px] text-[10.5px] font-medium uppercase tracking-[0.2em]"
            style={{ borderColor: "var(--on-surface)", color: "var(--on-surface)" }}
          >
            Download spreadsheet
          </a>
        )}
      </PageHead>

      {!store && (
        <Panel className="mb-4">
          <p className="text-[14px]" style={{ color: "var(--on-surface-soft)" }}>
            The database is not connected, so there are no orders to show.
          </p>
        </Panel>
      )}

      {/* the filters are a plain form: the page reads them from the address, so a filtered list can be bookmarked */}
      <form className="mb-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]" role="search">
        <input name="q" defaultValue={q} placeholder="Search name, email, phone or reference" className={fieldClass} style={{ borderColor: "var(--line-dashed)" }} />
        <select name="status" defaultValue={status ?? ""} className={fieldClass} style={{ borderColor: "var(--line-dashed)" }}>
          <option value="">Every status</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select name="tier" defaultValue={tier ?? ""} className={fieldClass} style={{ borderColor: "var(--line-dashed)" }}>
          <option value="">Every size</option>
          <option value="adult">Adult</option>
          <option value="children">Children</option>
        </select>
        <button type="submit" className="label rounded-sm border px-4 py-[10px]" style={{ borderColor: "var(--on-surface)" }}>
          Show
        </button>
      </form>

      {(status || tier || q) && (
        <p className="label mb-3" style={{ color: "var(--on-surface-soft)" }}>
          {rows.length} shown ·{" "}
          <Link href="/studio/orders" className="underline underline-offset-4" style={{ color: "var(--accent)" }}>
            Clear
          </Link>
        </p>
      )}

      {rows.length === 0 ? (
        <p className="mt-6 text-[14px]" style={{ color: "var(--on-surface-soft)" }}>
          {all.length ? "No orders match." : "No paid orders yet. Each one appears here as soon as Paystack confirms it."}
        </p>
      ) : (
        <>
          {/* a wide screen: one line an order, in a pane that scrolls on its own */}
          <div className="hidden max-h-[calc(100dvh-260px)] overflow-auto rounded-sm border lg:block" style={{ borderColor: "var(--line-dashed)" }}>
            <table className="w-full border-collapse text-left text-[13px]">
              <thead className="sticky top-0 z-[1]" style={{ background: "var(--surface)" }}>
                <tr>
                  {["Date", "Customer", "Order", "Status", "Paid"].map((h) => (
                    <th key={h} className="label border-b px-3 py-3 font-normal" style={{ borderColor: "var(--line-dashed)", color: "var(--on-surface-soft)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.reference} className="align-top transition-colors hover:bg-[rgba(157,59,44,0.04)]">
                    <td className="border-b px-3 py-3" style={{ borderColor: "var(--line)" }}>
                      <Link href={`/studio/orders/${r.reference}`} className="block">
                        {r.date}
                        <span className="code mt-1 block text-[10px]" style={{ color: "var(--on-surface-soft)" }}>
                          {r.reference}
                        </span>
                      </Link>
                    </td>
                    <td className="border-b px-3 py-3" style={{ borderColor: "var(--line)" }}>
                      <Link href={`/studio/orders/${r.reference}`} className="block">
                        <span className="block font-medium">{r.name}</span>
                        <span className="mt-1 block text-[12px]" style={{ color: "var(--on-surface-soft)" }}>
                          {r.phone}
                        </span>
                      </Link>
                    </td>
                    <td className="border-b px-3 py-3" style={{ borderColor: "var(--line)" }}>
                      {r.size} · {r.colour} {r.fabric.toLowerCase()}
                      <span className="mt-1 block text-[12px]" style={{ color: "var(--on-surface-soft)" }}>
                        <span className="code">{r.design}</span> · {r.thread === "As designed" ? "thread as designed" : `${r.thread.toLowerCase()} thread`}
                      </span>
                    </td>
                    <td className="border-b px-3 py-3" style={{ borderColor: "var(--line)" }}>
                      <StatusBadge status={r.status} />
                      {r.note && (
                        <span className="mt-1 block max-w-[24ch] truncate text-[12px]" style={{ color: "var(--on-surface-soft)" }}>
                          {r.note}
                        </span>
                      )}
                    </td>
                    <td className="price border-b px-3 py-3" style={{ borderColor: "var(--line)" }}>
                      {r.paid}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* a phone: one card an order */}
          <ul className="grid gap-3 lg:hidden">
            {rows.map((r) => (
              <li key={r.reference}>
                <Link href={`/studio/orders/${r.reference}`} className="block rounded-sm border px-4 py-3" style={{ borderColor: "var(--line-dashed)" }}>
                  <p className="flex items-baseline justify-between gap-3">
                    <span className="label" style={{ color: "var(--on-surface-soft)" }}>
                      {r.date}
                    </span>
                    <span className="price text-[14px]">{r.paid}</span>
                  </p>
                  <p className="mt-2 font-medium">{r.name}</p>
                  <p className="mt-1 text-[13px] leading-relaxed">
                    {r.size} · {r.colour} {r.fabric.toLowerCase()} · <span className="code text-[12px]">{r.design}</span>
                  </p>
                  <p className="mt-2">
                    <StatusBadge status={r.status} />
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
