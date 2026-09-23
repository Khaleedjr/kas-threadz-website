"use client";

import { useCallback, useEffect, useState } from "react";
import { naira } from "@/lib/catalogue";
import { tierFor, type PreorderGarment, type Stock, type Tier } from "@/lib/preorder";
import { useCatalogue } from "./catalogue-context";
import { whatsappLink } from "@/lib/site";
import { ThreadCount } from "./thread-count";

/** How often the count is refreshed while the Loom is open. */
const REFRESH_MS = 20000;

/**
 * The preorder: how many sets are left of each size, and paying for one in
 * full. The count is live, shared by everyone looking, and a set only leaves
 * it once its payment is confirmed.
 */
export function PreorderPanel({ garment, summary }: { garment: PreorderGarment; summary: string }) {
  const { terms: PREORDER, preorder } = useCatalogue();
  const tier = tierFor(garment.length);
  const [stock, setStock] = useState<Stock | null>(null);
  const [countFailed, setCountFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "" });

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/preorder/stock", { cache: "no-store" });
      if (!res.ok) throw new Error();
      setStock((await res.json()) as Stock);
      setCountFailed(false);
    } catch {
      setCountFailed(true);
    }
  }, []);

  useEffect(() => {
    const first = window.setTimeout(refresh, 0);
    const timer = window.setInterval(refresh, REFRESH_MS);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  const left = stock?.[tier].left;
  const soldOut = left === 0;
  const closed = !preorder.open;

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/preorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ garment, customer }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.url) {
        setError(body.error ?? "Something went wrong. Please try again.");
        setBusy(false);
        refresh();
        return;
      }
      window.location.href = body.url;
    } catch {
      setError("We could not reach the studio. Check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <div className="mt-2 border-t border-dashed pt-5" style={{ borderColor: "var(--line-dashed)" }}>
      <p className="label" style={{ color: "var(--accent)" }}>
        Preorder · first run of {PREORDER.adult.total + PREORDER.children.total} sets
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {(Object.keys(PREORDER) as Tier[]).map((t) => (
          <Count key={t} tier={t} stock={stock} failed={countFailed} active={t === tier} />
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <p className="price text-[24px] font-bold">{naira(PREORDER[tier].price)}</p>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            disabled={soldOut || closed}
            className="rounded-sm px-6 py-[13px] text-[10.5px] font-medium uppercase tracking-[0.2em] disabled:opacity-40"
            style={{ background: "var(--action)", color: "var(--on-action)" }}
          >
            {closed ? "Preorders closed for now" : soldOut ? `${PREORDER[tier].name} sets sold out` : "Preorder and pay"}
          </button>
        )}
        <p className="label" style={{ color: "var(--on-surface-soft)" }}>
          {PREORDER[tier].name} · paid in full now
        </p>
      </div>

      {open && (
        <form onSubmit={pay} className="mt-5 grid max-w-[420px] gap-3">
          <p className="text-[13px]" style={{ color: "var(--on-surface-soft)" }}>
            {summary}. Paystack takes the payment and emails the receipt; the studio follows up on
            WhatsApp about delivery.
          </p>
          <Field label="Name" value={customer.name} autoComplete="name"
            onChange={(v) => setCustomer((c) => ({ ...c, name: v }))} />
          <Field label="Email, for the receipt" type="email" value={customer.email} autoComplete="email"
            onChange={(v) => setCustomer((c) => ({ ...c, email: v }))} />
          <Field label="Phone, on WhatsApp" type="tel" value={customer.phone} autoComplete="tel"
            onChange={(v) => setCustomer((c) => ({ ...c, phone: v }))} />
          {error && (
            <p role="alert" className="text-[13px]" style={{ color: "var(--accent)" }}>
              {error}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={busy || soldOut}
              className="rounded-sm px-6 py-[13px] text-[10.5px] font-medium uppercase tracking-[0.2em] disabled:opacity-50"
              style={{ background: "var(--action)", color: "var(--on-action)" }}
            >
              {busy ? "Opening Paystack" : `Pay ${naira(PREORDER[tier].price)}`}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="label"
              style={{ color: "var(--on-surface-soft)" }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <a href={whatsappLink(`Hello, a question about the jallabiya preorder: ${summary}`)}
        className="label mt-5 inline-block underline underline-offset-4"
        style={{ color: "var(--on-surface-soft)" }}>
        Questions first? WhatsApp the studio
      </a>
    </div>
  );
}

/**
 * One size's count, as a length of thread: the sets still to be had are
 * inked, the ones gone are its ghost, so the thread visibly runs out as the
 * preorder fills.
 */
function Count({ tier, stock, failed, active }: { tier: Tier; stock: Stock | null; failed: boolean; active: boolean }) {
  const PREORDER = useCatalogue().terms;
  const total = PREORDER[tier].total;
  const left = stock?.[tier].left;
  return (
    <div className="rounded-sm border px-3 py-[10px]"
      style={{ borderColor: active ? "var(--accent)" : "var(--line-dashed)" }}>
      <p className="flex items-baseline justify-between gap-2">
        <span className="label" style={{ color: active ? "var(--accent)" : "var(--on-surface-soft)" }}>
          {PREORDER[tier].name} · {naira(PREORDER[tier].price)}
        </span>
        <span className="font-mono text-[12px] tabular-nums" aria-live="polite">
          {left === undefined ? (failed ? "-" : "counting") : left === 0 ? "sold out" : `${left} of ${total} left`}
        </span>
      </p>
      <ThreadCount left={left} total={total} active={active} failed={failed} />
    </div>
  );
}

function Field({ label, value, onChange, type = "text", autoComplete }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="label" style={{ color: "var(--on-surface-soft)" }}>{label}</span>
      <input required type={type} value={value} autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-sm border bg-transparent px-3 py-[10px] text-[14px] outline-none focus:border-[var(--accent)]"
        style={{ borderColor: "var(--line-dashed)" }} />
    </label>
  );
}
