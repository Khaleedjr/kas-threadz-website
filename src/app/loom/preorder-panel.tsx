"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { naira } from "@/lib/catalogue";
import { cart, setsIn, useCart, MAX_SETS } from "@/lib/cart";
import { tierFor, type PreorderGarment, type Stock, type Tier } from "@/lib/preorder";
import { whatsappLink } from "@/lib/site";
import { useCatalogue } from "./catalogue-context";
import { ThreadCount } from "./thread-count";

/** How often the count is refreshed while the Loom is open. */
const REFRESH_MS = 20000;

/**
 * The preorder: how many sets are left of each size, and putting the one
 * built into the cart. More than one can be built and added; they are paid
 * for together at checkout. The count is live and shared by everyone
 * looking, and a set only leaves it once its payment is confirmed.
 */
export function PreorderPanel({ garment, summary }: { garment: PreorderGarment; summary: string }) {
  const { terms: PREORDER, preorder } = useCatalogue();
  const tier = tierFor(garment.length);
  const items = useCart();
  const [stock, setStock] = useState<Stock | null>(null);
  const [countFailed, setCountFailed] = useState(false);
  const [added, setAdded] = useState<string | null>(null);

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

  // a new build is a new question: the last "added" note goes
  const key = `${garment.fabric}|${garment.colour}|${garment.design}|${garment.thread}|${garment.length}`;
  const [shownFor, setShownFor] = useState(key);
  if (shownFor !== key) {
    setShownFor(key);
    setAdded(null);
  }

  const inCart = items.filter((i) => tierFor(i.length) === tier).reduce((n, i) => n + i.qty, 0);
  const left = stock?.[tier].left;
  const soldOut = left === 0;
  const noMore = left !== undefined && left > 0 && inCart >= left;
  const full = setsIn(items) >= MAX_SETS;
  const closed = !preorder.open;
  const sets = setsIn(items);
  const subtotal = items.reduce((n, i) => n + PREORDER[tierFor(i.length)].price * i.qty, 0);

  function add() {
    if (cart.add(garment)) setAdded(summary);
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
        <button
          type="button"
          onClick={add}
          disabled={closed || soldOut || noMore || full}
          className="rounded-sm px-6 py-[13px] text-[10.5px] font-medium uppercase tracking-[0.2em] disabled:opacity-40"
          style={{ background: "var(--action)", color: "var(--on-action)" }}
        >
          {closed
            ? "Preorders closed for now"
            : soldOut
              ? `${PREORDER[tier].name} sets sold out`
              : noMore
                ? "All that are left are in your cart"
                : full
                  ? "Your cart is full"
                  : "Add to cart"}
        </button>
        <p className="label" style={{ color: "var(--on-surface-soft)" }}>
          {PREORDER[tier].name} · paid in full at checkout
        </p>
      </div>

      {added && (
        <p role="status" className="mt-4 text-[13px] leading-relaxed" style={{ color: "var(--on-surface)" }}>
          Added: {added}. Build another to add it too, or check out when you are ready.
        </p>
      )}

      {sets > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-sm border px-4 py-3" style={{ borderColor: "var(--line-dashed)" }}>
          <p className="text-[14px]">
            Your cart · {sets} {sets === 1 ? "set" : "sets"} · <span className="price">{naira(subtotal)}</span>
          </p>
          <div className="ml-auto flex flex-wrap gap-2">
            <Link href="/cart" className="label rounded-sm border px-4 py-[10px]" style={{ borderColor: "var(--on-surface)" }}>
              View cart
            </Link>
            <Link href="/checkout" className="label rounded-sm px-4 py-[10px]" style={{ background: "var(--action)", color: "var(--on-action)" }}>
              Checkout
            </Link>
          </div>
        </div>
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
