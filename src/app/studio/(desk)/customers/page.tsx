import Link from "next/link";
import { naira } from "@/lib/catalogue";
import { preorderStore } from "@/lib/preorder-store";
import { requireStudio } from "@/lib/studio-auth";
import { customers } from "@/lib/studio-stats";
import { Figure, PageHead, dateOnly } from "../ui";

export const metadata = { title: "Customers" };

/** A Nigerian number as WhatsApp wants it. */
const wa = (phone: string) => {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("0") && d.length === 11) d = `234${d.slice(1)}`;
  return d.length >= 10 ? `https://wa.me/${d}` : null;
};

export default async function CustomersPage() {
  await requireStudio();
  const orders = (await preorderStore()?.orders()) ?? [];
  const list = customers(orders);
  const repeat = list.filter((c) => c.orders > 1).length;
  const spent = list.reduce((n, c) => n + c.spent, 0);

  return (
    <>
      <PageHead title="Customers" note="Everyone who has paid for an order, best customers first. Open one to see their orders." />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Figure label="Customers" value={String(list.length)} />
        <Figure label="Came back" value={String(repeat)} sub="more than one order" />
        <Figure label="Average spent" value={naira(list.length ? Math.round(spent / list.length) : 0)} />
      </div>

      {list.length === 0 ? (
        <p className="mt-6 text-[14px]" style={{ color: "var(--on-surface-soft)" }}>
          No customers yet.
        </p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {list.map((c) => {
            const chat = c.phone ? wa(c.phone) : null;
            return (
              <li key={c.key} className="rounded-sm border px-4 py-3" style={{ borderColor: "var(--line-dashed)" }}>
                <div className="flex items-baseline justify-between gap-3">
                  <Link href={`/studio/orders?q=${encodeURIComponent(c.email || c.phone)}`} className="truncate text-[15px] font-medium underline-offset-4 hover:underline">
                    {c.name || "No name given"}
                  </Link>
                  <span className="price shrink-0 text-[14px]">{naira(c.spent)}</span>
                </div>
                <p className="label mt-1" style={{ color: "var(--on-surface-soft)" }}>
                  {c.orders} {c.orders === 1 ? "order" : "orders"} · first {dateOnly(c.first)}
                  {c.last !== c.first ? ` · last ${dateOnly(c.last)}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
                  {chat ? (
                    <a href={chat} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4" style={{ color: "var(--accent)" }}>
                      {c.phone} · WhatsApp
                    </a>
                  ) : (
                    c.phone && <span>{c.phone}</span>
                  )}
                  {c.email && (
                    <a href={`mailto:${c.email}`} className="break-all" style={{ color: "var(--on-surface-soft)" }}>
                      {c.email}
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
