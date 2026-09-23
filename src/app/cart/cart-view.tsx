"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NECKLINES, naira } from "@/lib/catalogue";
import { cart, setsIn, useCart, MAX_QTY, type CartItem } from "@/lib/cart";
import { buildWords } from "@/lib/build-words";
import { drawnFabric } from "@/lib/content-defaults";
import { threadTones } from "@/lib/loom-preview";
import type { Stock, Tier } from "@/lib/preorder";
import { useCatalogue } from "../loom/catalogue-context";
import { GarmentPreview } from "../loom/garment-preview";

/** A build, drawn small, as the Loom drew it. */
export function BuildPicture({ item, width = 96 }: { item: CartItem; width?: number }) {
  const cat = useCatalogue();
  const w = buildWords(item, cat);
  const design = NECKLINES.find((n) => n.code === item.design) ?? null;
  const fabric = w.fabric ?? cat.fabrics[0];
  return (
    <div style={{ width }} className="shrink-0" aria-hidden>
      <GarmentPreview
        garment="jallabiya"
        colour={item.colour}
        fabric={drawnFabric(fabric)}
        design={design}
        thread={threadTones(item.thread, item.colour)}
        length={item.length}
      />
    </div>
  );
}

function useStock() {
  const [stock, setStock] = useState<Stock | null>(null);
  useEffect(() => {
    let live = true;
    fetch("/api/preorder/stock", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => live && setStock(s))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return stock;
}

/** How far a cart is over what is left of each size, if it is. */
export function useShortfall(items: CartItem[]) {
  const cat = useCatalogue();
  const stock = useStock();
  const short: Array<{ tier: Tier; left: number; want: number }> = [];
  if (stock) {
    for (const tier of Object.keys(cat.terms) as Tier[]) {
      const want = items.filter((i) => buildWords(i, cat).tier === tier).reduce((n, i) => n + i.qty, 0);
      if (want > stock[tier].left) short.push({ tier, left: stock[tier].left, want });
    }
  }
  return short;
}

export function CartView() {
  const cat = useCatalogue();
  const items = useCart();
  const short = useShortfall(items);
  const sets = setsIn(items);
  const subtotal = items.reduce((n, i) => n + buildWords(i, cat).price * i.qty, 0);
  const unavailable = items.some((i) => buildWords(i, cat).unavailable);

  if (!items.length) {
    return (
      <div className="py-10">
        <p className="text-[15px]" style={{ color: "var(--on-surface-soft)" }}>
          Your cart is empty.
        </p>
        <Link href="/loom" className="mt-6 inline-block rounded-sm px-6 py-[13px] text-[10.5px] font-medium uppercase tracking-[0.2em]" style={{ background: "var(--action)", color: "var(--on-action)" }}>
          Build a jallabiya
        </Link>
      </div>
    );
  }

  return (
    <div className="grid items-start gap-[clamp(20px,4vw,48px)] lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <ul className="grid gap-3">
        {items.map((item) => {
          const w = buildWords(item, cat);
          return (
            <li key={item.id} className="flex gap-[clamp(12px,2.5vw,24px)] rounded-sm border p-[clamp(12px,2vw,18px)]" style={{ borderColor: "var(--line-dashed)" }}>
              <BuildPicture item={item} width={88} />
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="label" style={{ color: "var(--accent)" }}>
                  Jallabiya · {w.size}
                </p>
                <p className="mt-2 text-[15px]">{w.cloth}</p>
                <p className="mt-1 text-[13px]" style={{ color: "var(--on-surface-soft)" }}>
                  <span className="font-mono">{w.design}</span> · {w.thread}
                </p>
                {w.unavailable && (
                  <p className="mt-2 text-[12px]" style={{ color: "var(--accent)" }}>
                    This colour or cloth is no longer offered. Remove it and build it again.
                  </p>
                )}
                <div className="mt-auto flex flex-wrap items-center gap-3 pt-3">
                  <div className="flex items-center rounded-sm border" style={{ borderColor: "var(--line-dashed)" }}>
                    <button type="button" aria-label="One fewer" disabled={item.qty <= 1} onClick={() => cart.setQty(item.id, item.qty - 1)} className="grid h-9 w-9 place-items-center font-mono disabled:opacity-30">
                      &minus;
                    </button>
                    <span className="w-8 text-center font-mono text-[14px] tabular-nums" aria-label={`${item.qty} of this`}>
                      {item.qty}
                    </span>
                    <button type="button" aria-label="One more" disabled={item.qty >= MAX_QTY} onClick={() => cart.setQty(item.id, item.qty + 1)} className="grid h-9 w-9 place-items-center font-mono disabled:opacity-30">
                      +
                    </button>
                  </div>
                  <span className="price text-[15px]">{naira(w.price * item.qty)}</span>
                  <button type="button" onClick={() => cart.remove(item.id)} className="label ml-auto underline underline-offset-4" style={{ color: "var(--on-surface-soft)" }}>
                    Remove
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <aside className="rounded-sm border p-[clamp(16px,2.5vw,24px)] lg:sticky lg:top-6" style={{ borderColor: "var(--line-dashed)" }}>
        <p className="label" style={{ color: "var(--on-surface-soft)" }}>
          Your cart
        </p>
        <p className="mt-3 flex items-baseline justify-between gap-3 text-[15px]">
          {sets} {sets === 1 ? "set" : "sets"}
          <span className="price text-[22px] font-bold">{naira(subtotal)}</span>
        </p>
        <p className="mt-2 text-[13px] leading-relaxed" style={{ color: "var(--on-surface-soft)" }}>
          Delivery is worked out at checkout, or collect from the atelier for nothing.
          {cat.shipping.freeFrom > 0 && ` Delivery is free on orders of ${naira(cat.shipping.freeFrom)} or more.`}
        </p>
        {short.map((s) => (
          <p key={s.tier} role="alert" className="mt-3 text-[13px]" style={{ color: "var(--accent)" }}>
            {s.left === 0
              ? `The ${cat.terms[s.tier].name.toLowerCase()} sets are all taken.`
              : `Only ${s.left} ${cat.terms[s.tier].name.toLowerCase()} ${s.left === 1 ? "set is" : "sets are"} left; your cart has ${s.want}.`}
          </p>
        ))}
        <div className="mt-5 grid gap-2">
          {short.length || unavailable || !cat.preorder.open ? (
            <span className="rounded-sm px-6 py-[13px] text-center text-[10.5px] font-medium uppercase tracking-[0.2em] opacity-40" style={{ background: "var(--action)", color: "var(--on-action)" }}>
              {cat.preorder.open ? "Checkout" : "Preorders closed for now"}
            </span>
          ) : (
            <Link href="/checkout" className="rounded-sm px-6 py-[13px] text-center text-[10.5px] font-medium uppercase tracking-[0.2em]" style={{ background: "var(--action)", color: "var(--on-action)" }}>
              Checkout
            </Link>
          )}
          <Link href="/loom" className="label rounded-sm border px-6 py-[12px] text-center" style={{ borderColor: "var(--line-dashed)" }}>
            Build another
          </Link>
        </div>
      </aside>
    </div>
  );
}
