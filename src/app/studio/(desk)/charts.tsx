import { naira } from "@/lib/catalogue";

const short = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", timeZone: "UTC" });

/**
 * Orders by day, as a row of columns: each day's sales in the cut red, the
 * money in its label. Plain SVG, drawn on the server.
 */
export function DayChart({ days }: { days: Array<{ day: string; orders: number; taken: number }> }) {
  const most = Math.max(1, ...days.map((d) => d.orders));
  const total = days.reduce((n, d) => n + d.orders, 0);
  const money = days.reduce((n, d) => n + d.taken, 0);
  const w = 100 / days.length;
  return (
    <figure>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="block h-[clamp(120px,22vh,200px)] w-full" role="img" aria-label={`${total} orders over ${days.length} days`}>
        <line x1="0" y1="39.8" x2="100" y2="39.8" stroke="var(--line-dashed)" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
        {days.map((d, i) => {
          const h = (d.orders / most) * 36;
          return (
            <rect key={d.day} x={i * w + w * 0.18} y={40 - h} width={w * 0.64} height={h} fill="var(--accent)" opacity={d.orders ? 0.9 : 0}>
              <title>{`${short.format(new Date(`${d.day}T00:00:00Z`))}: ${d.orders} orders, ${naira(d.taken)}`}</title>
            </rect>
          );
        })}
      </svg>
      <figcaption className="mt-2 flex flex-wrap justify-between gap-2">
        <span className="label" style={{ color: "var(--on-surface-soft)" }}>
          {short.format(new Date(`${days[0].day}T00:00:00Z`))} to {short.format(new Date(`${days[days.length - 1].day}T00:00:00Z`))}
        </span>
        <span className="label" style={{ color: "var(--on-surface-soft)" }}>
          {total} orders · {naira(money)}{total ? ` · most in a day: ${most}` : ""}
        </span>
      </figcaption>
    </figure>
  );
}
