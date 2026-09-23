"use client";

import { useState, useTransition } from "react";
import type { Shipping, Zone } from "@/lib/shipping";
import { saveShipping } from "../actions";

const cell = "w-full rounded-sm border bg-transparent px-3 py-[9px] text-[14px] outline-none focus:border-[var(--accent)]";
const edge = { borderColor: "var(--line-dashed)" };

/** Where the studio delivers and what it costs, collecting instead, and the free delivery line. */
export function ShippingEditor({ initial }: { initial: Shipping }) {
  const [s, setS] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, start] = useTransition();
  const change = (next: Shipping) => {
    setS(next);
    setDirty(true);
    setResult(null);
  };
  const setZone = (i: number, patch: Partial<Zone>) => change({ ...s, zones: s.zones.map((z, j) => (j === i ? { ...z, ...patch } : z)) });
  const bad = s.zones.some((z) => !z.label.trim());

  return (
    <div className="grid gap-3 2xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <section className="rounded-sm border p-[clamp(14px,2vw,20px)]" style={edge}>
        <h2 className="label mb-4" style={{ color: "var(--on-surface-soft)" }}>
          Delivery zones · {s.zones.filter((z) => !z.hidden).length} offered
        </h2>
        <div className="hidden grid-cols-[minmax(0,1fr)_110px_170px_auto] gap-2 px-1 pb-2 sm:grid">
          {["Place", "Fee, naira", "Takes", ""].map((h) => (
            <span key={h} className="label" style={{ color: "var(--on-surface-soft)" }}>
              {h}
            </span>
          ))}
        </div>
        <ul className="grid gap-2">
          {s.zones.map((z, i) => (
            <li key={z.id || `new-${i}`} className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_110px_170px_auto]" style={{ opacity: z.hidden ? 0.5 : 1 }}>
              <input value={z.label} placeholder="Place, like Lagos (Iddo)" onChange={(e) => setZone(i, { label: e.target.value })} className={`${cell} col-span-2 sm:col-span-1`} style={edge} />
              <input value={z.fee} inputMode="numeric" aria-label={`Fee to ${z.label}`} onChange={(e) => setZone(i, { fee: Number(e.target.value.replace(/\D/g, "")) || 0 })} className={`${cell} font-mono`} style={edge} />
              <input value={z.eta} aria-label={`How long to ${z.label}`} onChange={(e) => setZone(i, { eta: e.target.value })} className={cell} style={edge} />
              <div className="col-span-2 flex gap-1 sm:col-span-1">
                <button type="button" onClick={() => setZone(i, { hidden: !z.hidden })} className="label h-10 rounded-sm border px-3" style={{ ...edge, color: z.hidden ? "var(--accent)" : undefined }}>
                  {z.hidden ? "Show" : "Hide"}
                </button>
                <button type="button" onClick={() => change({ ...s, zones: s.zones.filter((_, j) => j !== i) })} className="label h-10 rounded-sm border px-3" style={edge} aria-label={`Remove ${z.label}`}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => change({ ...s, zones: [...s.zones, { id: "", label: "", fee: 2000, eta: "2 to 5 business days" }] })} className="label mt-3 rounded-sm border border-dashed px-4 py-[10px]" style={edge}>
          Add a place
        </button>
      </section>

      <div className="grid content-start gap-3">
        <section className="rounded-sm border p-[clamp(14px,2vw,20px)]" style={edge}>
          <h2 className="label mb-4" style={{ color: "var(--on-surface-soft)" }}>
            Free delivery
          </h2>
          <label className="grid gap-1">
            <span className="text-[13px]">Orders worth this much or more are delivered free, in naira. 0 for never.</span>
            <input value={s.freeFrom} inputMode="numeric" onChange={(e) => change({ ...s, freeFrom: Number(e.target.value.replace(/\D/g, "")) || 0 })} className={`${cell} font-mono`} style={edge} />
          </label>
        </section>
        <section className="rounded-sm border p-[clamp(14px,2vw,20px)]" style={edge}>
          <h2 className="label mb-4" style={{ color: "var(--on-surface-soft)" }}>
            Collecting
          </h2>
          <label className="flex items-start gap-3">
            <input type="checkbox" checked={s.pickup.on} onChange={(e) => change({ ...s, pickup: { ...s.pickup, on: e.target.checked } })} className="mt-[3px] h-4 w-4" />
            <span className="text-[14px]">Customers can collect from the atelier, for nothing</span>
          </label>
          <div className="mt-3 grid gap-2">
            <input value={s.pickup.label} onChange={(e) => change({ ...s, pickup: { ...s.pickup, label: e.target.value } })} className={cell} style={edge} aria-label="What the choice is called" />
            <textarea rows={3} value={s.pickup.note} onChange={(e) => change({ ...s, pickup: { ...s.pickup, note: e.target.value } })} className={cell} style={edge} aria-label="What customers are told about collecting" />
          </div>
        </section>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={pending || !dirty || bad}
            onClick={() =>
              start(async () => {
                const r = await saveShipping({ ...s, zones: s.zones.map((z) => ({ ...z, label: z.label.trim(), eta: z.eta.trim() })) });
                setResult(r);
                if (r.ok) setDirty(false);
              })
            }
            className="rounded-sm px-6 py-[12px] text-[10.5px] font-medium uppercase tracking-[0.2em] disabled:opacity-40"
            style={{ background: "var(--action)", color: "var(--on-action)" }}
          >
            {pending ? "Saving" : "Save"}
          </button>
          {bad && (
            <span className="text-[13px]" style={{ color: "var(--accent)" }}>
              Every place needs a name.
            </span>
          )}
          {result && (
            <span role="status" className="text-[13px]" style={{ color: result.ok ? "var(--on-surface-soft)" : "var(--accent)" }}>
              {result.message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
