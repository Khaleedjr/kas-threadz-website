import Link from "next/link";
import { naira } from "@/lib/catalogue";
import { getContent } from "@/lib/content";
import type { Tier } from "@/lib/preorder";
import { preorderStore } from "@/lib/preorder-store";
import { byStatus, daily, sales, since, taken } from "@/lib/studio-stats";
import { requireStudio } from "@/lib/studio-auth";
import { ThreadCount } from "../../loom/thread-count";
import { DayChart } from "./charts";
import { ButtonLink, Figure, PageHead, Panel, StatusBadge, dateTime } from "./ui";

export const metadata = { title: "Overview" };

const NOT_CONNECTED = (
  <Panel>
    <p className="text-[14px] leading-relaxed" style={{ color: "var(--on-surface-soft)" }}>
      The database is not connected, so there are no orders or counts to show. Connect Upstash Redis
      in the host&apos;s Storage tab and redeploy.
    </p>
  </Panel>
);

export default async function Overview() {
  await requireStudio();
  const store = preorderStore();
  const cat = await getContent();
  if (!store) {
    return (
      <>
        <PageHead title="Overview" />
        {NOT_CONNECTED}
      </>
    );
  }
  const [orders, tally] = await Promise.all([store.orders(), store.tally(cat.terms)]);
  const now = new Date();
  const midnight = new Date(`${new Date(now.getTime() + 3600e3).toISOString().slice(0, 10)}T00:00:00+01:00`);
  const today = since(orders, midnight);
  const week = since(orders, new Date(now.getTime() - 7 * 24 * 3600e3));
  const sold = sales(orders);
  const statuses = byStatus(orders);
  const inWork = statuses.paid + statuses.cutting + statuses.embroidering + statuses.ready;
  const tiers = Object.keys(cat.terms) as Tier[];

  return (
    <>
      <PageHead
        title="Overview"
        note={
          cat.preorder.open
            ? "The jallabiya preorder is open."
            : "The jallabiya preorder is closed: the Loom still builds, but nobody can pay."
        }
      >
        <ButtonLink href="/studio/orders">All orders</ButtonLink>
      </PageHead>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Figure label="Taken" value={naira(taken(orders))} sub={`${sold.length} orders`} />
        <Figure label="Today" value={naira(today.taken)} sub={`${today.orders} orders`} />
        <Figure label="Last 7 days" value={naira(week.taken)} sub={`${week.orders} orders`} />
        <Figure label="In the workshop" value={String(inWork)} sub={`${statuses.ready} ready to go`} />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Panel title="Orders, last 30 days">
          <DayChart days={daily(orders, 30)} />
        </Panel>
        <Panel title="Sets left">
          <div className="grid gap-4">
            {tiers.map((t) => {
              const { total, sold: s, held } = tally[t];
              const left = Math.max(0, total - s - held);
              return (
                <div key={t}>
                  <p className="flex items-baseline justify-between gap-2">
                    <span className="label" style={{ color: "var(--on-surface-soft)" }}>
                      {cat.terms[t].name} · {naira(cat.terms[t].price)}
                    </span>
                    <span className="font-mono text-[12px] tabular-nums">
                      {left} of {total} left
                    </span>
                  </p>
                  <ThreadCount left={left} total={total} active={t === "adult"} failed={false} />
                  <p className="label mt-1" style={{ color: "var(--on-surface-soft)" }}>
                    {s} sold{held ? ` · ${held} being paid for now` : ""}
                  </p>
                </div>
              );
            })}
            <Link href="/studio/products/jallabiya" className="label underline underline-offset-4" style={{ color: "var(--accent)" }}>
              Change prices or sets
            </Link>
          </div>
        </Panel>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <Panel title="Where the orders are">
          <ul className="grid gap-2">
            {(Object.keys(statuses) as Array<keyof typeof statuses>).map((s) => (
              <li key={s}>
                <Link href={`/studio/orders?status=${s}`} className="flex items-center justify-between gap-3 py-1">
                  <StatusBadge status={s} />
                  <span className="font-mono text-[13px] tabular-nums">{statuses[s]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Latest orders" action={<Link href="/studio/orders" className="label underline underline-offset-4">See all</Link>}>
          {orders.length === 0 ? (
            <p className="text-[13px]" style={{ color: "var(--on-surface-soft)" }}>
              No paid orders yet. Each one appears here as soon as Paystack confirms it.
            </p>
          ) : (
            <ul className="grid">
              {orders.slice(0, 6).map((o) => (
                <li key={o.reference} className="border-t first:border-t-0" style={{ borderColor: "var(--line)" }}>
                  <Link href={`/studio/orders/${o.reference}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-3">
                    <span className="truncate text-[14px] font-medium">{o.customer?.name ?? o.reference}</span>
                    <span className="price text-[13px]">{naira(o.paid)}</span>
                    <span className="label truncate" style={{ color: "var(--on-surface-soft)" }}>
                      {dateTime(o.at)} · {o.garment ? `${o.garment.length}″` : ""}
                    </span>
                    <StatusBadge status={o.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
