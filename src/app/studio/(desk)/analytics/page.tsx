import { naira } from "@/lib/catalogue";
import { getContent } from "@/lib/content";
import { STATUS_LABEL, preorderStore } from "@/lib/preorder-store";
import { requireStudio } from "@/lib/studio-auth";
import { breakdowns, byStatus, customers, daily, sales, taken } from "@/lib/studio-stats";
import { DayChart } from "../charts";
import { Bars, Figure, PageHead, Panel } from "../ui";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  await requireStudio();
  const cat = await getContent();
  const orders = (await preorderStore()?.orders()) ?? [];
  const sold = sales(orders);
  const money = taken(orders);
  const b = breakdowns(orders, cat);
  const people = customers(orders);
  const statuses = byStatus(orders);
  const cancelled = statuses.cancelled;

  return (
    <>
      <PageHead title="Analytics" note="What has sold, what sells best, and who is buying. Cancelled orders are left out of the money and the rankings." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Figure label="Taken" value={naira(money)} />
        <Figure label="Orders" value={String(sold.length)} sub={cancelled ? `${cancelled} cancelled` : undefined} />
        <Figure label="Average order" value={naira(sold.length ? Math.round(money / sold.length) : 0)} />
        <Figure label="Customers" value={String(people.length)} sub={`${people.filter((p) => p.orders > 1).length} came back`} />
      </div>

      <Panel title="Orders by day, last 90 days" className="mt-3">
        <DayChart days={daily(orders, 90)} />
      </Panel>

      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Panel title="Colours">
          <Bars rows={b.colour} />
        </Panel>
        <Panel title="Necklines">
          <Bars rows={b.design} />
        </Panel>
        <Panel title="Sizes">
          <Bars rows={b.tier} />
          <div className="mt-5">
            <Bars rows={b.length} />
          </div>
        </Panel>
        <Panel title="Fabrics">
          <Bars rows={b.fabric} />
        </Panel>
        <Panel title="Thread">
          <Bars rows={b.thread} />
        </Panel>
        <Panel title="In the workshop">
          <Bars rows={(Object.keys(statuses) as Array<keyof typeof statuses>).map((s) => [STATUS_LABEL[s], statuses[s]] as [string, number]).filter(([, n]) => n > 0)} />
        </Panel>
      </div>

      <Panel title="Visitors" className="mt-3">
        <p className="text-[14px] leading-relaxed" style={{ color: "var(--on-surface-soft)" }}>
          How many people visit, from where and on which pages is counted by Vercel Web Analytics, without cookies. Turn it on
          once in the Vercel project&apos;s Analytics tab; the figures then appear there.
        </p>
        <a
          href="https://vercel.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="label mt-3 inline-block underline underline-offset-4"
          style={{ color: "var(--accent)" }}
        >
          Open Vercel
        </a>
      </Panel>
    </>
  );
}
