import Link from "next/link";
import type { ReactNode } from "react";
import { STATUS_LABEL, type OrderStatus } from "@/lib/preorder-store";

/* The desk's own pieces, drawn in the paper register like the rest of the site. */

export function PageHead({ title, note, children }: { title: string; note?: string; children?: ReactNode }) {
  return (
    <div className="mb-[clamp(18px,3vw,28px)] flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[clamp(22px,2.6vw,28px)]">{title}</h1>
        {note && (
          <p className="mt-2 max-w-[62ch] text-[14px] leading-relaxed" style={{ color: "var(--on-surface-soft)" }}>
            {note}
          </p>
        )}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Panel({ title, action, children, className = "" }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-sm border p-[clamp(14px,2vw,20px)] ${className}`} style={{ borderColor: "var(--line-dashed)" }}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && (
            <h2 className="label" style={{ color: "var(--on-surface-soft)" }}>
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Figure({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col justify-between rounded-sm border px-4 py-3" style={{ borderColor: "var(--line-dashed)" }}>
      <span className="label" style={{ color: "var(--on-surface-soft)" }}>
        {label}
      </span>
      <span className="price mt-2 text-[clamp(20px,2.2vw,26px)] font-bold">{value}</span>
      {sub && (
        <span className="label mt-1" style={{ color: "var(--on-surface-soft)" }}>
          {sub}
        </span>
      )}
    </div>
  );
}

/* each step of the workshop in its own mark: the tailor's blue while it is
   being made, the cut red at the needle, ink once it is done */
const STATUS_TONE: Record<OrderStatus, { dot: string; text: string }> = {
  paid: { dot: "var(--on-surface-soft)", text: "var(--on-surface)" },
  cutting: { dot: "var(--color-pin)", text: "var(--color-pin)" },
  embroidering: { dot: "var(--accent)", text: "var(--accent)" },
  ready: { dot: "var(--on-surface)", text: "var(--on-surface)" },
  delivered: { dot: "transparent", text: "var(--on-surface-soft)" },
  cancelled: { dot: "transparent", text: "var(--on-surface-soft)" },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const tone = STATUS_TONE[status];
  return (
    <span
      className="label inline-flex items-center gap-[7px] whitespace-nowrap"
      style={{ color: tone.text, textDecoration: status === "cancelled" ? "line-through" : undefined }}
    >
      <span
        aria-hidden
        className="inline-block h-[7px] w-[7px] rounded-full"
        style={{ background: tone.dot, boxShadow: `inset 0 0 0 1px ${tone.text}` }}
      />
      {STATUS_LABEL[status]}
    </span>
  );
}

/** A ranked list, each row with a bar for its share. */
export function Bars({ rows, empty = "Nothing yet." }: { rows: Array<[string, number]>; empty?: string }) {
  if (!rows.length) {
    return (
      <p className="text-[13px]" style={{ color: "var(--on-surface-soft)" }}>
        {empty}
      </p>
    );
  }
  const most = Math.max(...rows.map(([, n]) => n));
  return (
    <ul className="grid gap-[10px]">
      {rows.map(([name, n]) => (
        <li key={name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
          <span className="truncate text-[13px]">{name}</span>
          <span className="font-mono text-[12px] tabular-nums">{n}</span>
          <span className="col-span-2 block h-[5px] rounded-full" style={{ background: "var(--line)" }}>
            <span
              className="block h-full rounded-full"
              style={{ width: `${Math.max(4, (n / most) * 100)}%`, background: "var(--accent)" }}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Saved({ show, children = "Saved. The site shows it from the next page load." }: { show: boolean; children?: ReactNode }) {
  if (!show) return null;
  return (
    <p role="status" className="mb-5 rounded-sm border px-4 py-3 text-[13px]" style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>
      {children}
    </p>
  );
}

export function ButtonLink({ href, children, solid = false }: { href: string; children: ReactNode; solid?: boolean }) {
  return (
    <Link
      href={href}
      className="rounded-sm border px-4 py-[10px] text-[10.5px] font-medium uppercase tracking-[0.2em]"
      style={
        solid
          ? { background: "var(--action)", color: "var(--on-action)", borderColor: "var(--action)" }
          : { borderColor: "var(--on-surface)", color: "var(--on-surface)" }
      }
    >
      {children}
    </Link>
  );
}

export const fieldClass =
  "w-full rounded-sm border bg-transparent px-3 py-[10px] text-[14px] outline-none focus:border-[var(--accent)]";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className="label" style={{ color: "var(--on-surface-soft)" }}>
        {label}
      </span>
      {children}
      {hint && (
        <span className="text-[12px] leading-snug" style={{ color: "var(--on-surface-soft)" }}>
          {hint}
        </span>
      )}
    </label>
  );
}

export function SubmitButton({ children }: { children: ReactNode }) {
  return (
    <button
      type="submit"
      className="rounded-sm px-6 py-[12px] text-[10.5px] font-medium uppercase tracking-[0.2em]"
      style={{ background: "var(--action)", color: "var(--on-action)" }}
    >
      {children}
    </button>
  );
}

const when = new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" });
const day = new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeZone: "Africa/Lagos" });
export const dateTime = (iso: string) => when.format(new Date(iso));
export const dateOnly = (iso: string) => day.format(new Date(iso));
