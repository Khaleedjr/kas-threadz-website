"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { naira } from "@/lib/catalogue";
import { setsIn, useCart } from "@/lib/cart";
import { buildWords } from "@/lib/build-words";
import { deliveryFor } from "@/lib/shipping";
import { useCatalogue } from "../loom/catalogue-context";
import { BuildPicture, useShortfall } from "../cart/cart-view";

const CONTACT_KEY = "kas-checkout-contact";

const field = "w-full rounded-sm border bg-transparent px-3 py-[11px] text-[14px] outline-none focus:border-[var(--accent)]";
const edge = { borderColor: "var(--line-dashed)" };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className="label" style={{ color: "var(--on-surface-soft)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

/**
 * Checkout: who it is for, where it goes, and paying for all of it at once.
 * The totals here are for reading; the server works them out again from
 * its own prices before a naira is taken.
 */
export function CheckoutForm() {
  const cat = useCatalogue();
  const items = useCart();
  const short = useShortfall(items);
  const zones = cat.shipping.zones.filter((z) => !z.hidden);

  const [contact, setContact] = useState({ name: "", email: "", phone: "" });
  const [method, setMethod] = useState<"delivery" | "pickup">("delivery");
  const [zone, setZone] = useState(zones[0]?.id ?? "");
  const [address, setAddress] = useState({ address: "", city: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // a returning customer's details, kept in their own browser
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CONTACT_KEY) ?? "null");
      if (saved && typeof saved === "object") {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- read once, after the page is in the browser
        setContact((c) => ({ ...c, ...saved }));
      }
    } catch {
      // nothing kept, or storage is closed to us
    }
  }, []);

  const sets = setsIn(items);
  const subtotal = items.reduce((n, i) => n + buildWords(i, cat).price * i.qty, 0);
  const choice = method === "pickup" ? ({ method: "pickup" } as const) : ({ method: "delivery", zone } as const);
  const delivery = deliveryFor(cat.shipping, choice, subtotal);
  const total = subtotal + (delivery?.fee ?? 0);
  const unavailable = items.some((i) => buildWords(i, cat).unavailable);

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      localStorage.setItem(CONTACT_KEY, JSON.stringify(contact));
    } catch {
      // keeping the details is a convenience only
    }
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(({ fabric, colour, design, thread, length, qty }) => ({ fabric, colour, design, thread, length, qty })),
          customer: contact,
          delivery: { method, zone, ...address },
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.url) {
        setError(body.error ?? "Something went wrong. Please try again.");
        setBusy(false);
        return;
      }
      window.location.href = body.url;
    } catch {
      setError("We could not reach the studio. Check your connection and try again.");
      setBusy(false);
    }
  }

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

  const blocked = busy || short.length > 0 || unavailable || !cat.preorder.open || !delivery;

  return (
    <form onSubmit={pay} className="grid items-start gap-[clamp(20px,4vw,48px)] lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <div className="grid gap-[clamp(20px,3vw,32px)]">
        <section className="grid gap-3">
          <h2 className="label" style={{ color: "var(--accent)" }}>
            1 · You
          </h2>
          <Field label="Name">
            <input required value={contact.name} autoComplete="name" onChange={(e) => setContact({ ...contact, name: e.target.value })} className={field} style={edge} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Email, for the receipt">
              <input required type="email" value={contact.email} autoComplete="email" onChange={(e) => setContact({ ...contact, email: e.target.value })} className={field} style={edge} />
            </Field>
            <Field label="Phone, on WhatsApp">
              <input required type="tel" value={contact.phone} autoComplete="tel" onChange={(e) => setContact({ ...contact, phone: e.target.value })} className={field} style={edge} />
            </Field>
          </div>
        </section>

        <section className="grid gap-3">
          <h2 className="label" style={{ color: "var(--accent)" }}>
            2 · Delivery
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {(["delivery", "pickup"] as const)
              .filter((m) => m === "delivery" || cat.shipping.pickup.on)
              .map((m) => (
                <label key={m} className="flex cursor-pointer items-start gap-3 rounded-sm border p-3" style={{ borderColor: method === m ? "var(--accent)" : "var(--line-dashed)" }}>
                  <input type="radio" name="method" checked={method === m} onChange={() => setMethod(m)} className="mt-[3px]" />
                  <span className="text-[14px] leading-snug">
                    {m === "delivery" ? "Deliver it to me" : cat.shipping.pickup.label}
                    <span className="block text-[12px]" style={{ color: "var(--on-surface-soft)" }}>
                      {m === "delivery" ? "To your state, by courier" : "No delivery fee"}
                    </span>
                  </span>
                </label>
              ))}
          </div>

          {method === "delivery" ? (
            <>
              <Field label="Deliver to">
                <select value={zone} onChange={(e) => setZone(e.target.value)} className={field} style={edge}>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.label} · {naira(z.fee)} · {z.eta}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Address">
                <input required value={address.address} autoComplete="street-address" onChange={(e) => setAddress({ ...address, address: e.target.value })} className={field} style={edge} />
              </Field>
              <Field label="Town or city">
                <input required value={address.city} autoComplete="address-level2" onChange={(e) => setAddress({ ...address, city: e.target.value })} className={field} style={edge} />
              </Field>
            </>
          ) : (
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--on-surface-soft)" }}>
              {cat.shipping.pickup.note}
            </p>
          )}
          <Field label="Anything we should know (optional)">
            <textarea rows={2} value={address.notes} onChange={(e) => setAddress({ ...address, notes: e.target.value })} className={field} style={edge} />
          </Field>
        </section>
      </div>

      <aside className="rounded-sm border p-[clamp(16px,2.5vw,24px)] lg:sticky lg:top-6" style={{ borderColor: "var(--line-dashed)" }}>
        <h2 className="label" style={{ color: "var(--accent)" }}>
          3 · Your order
        </h2>
        <ul className="mt-3 grid gap-3">
          {items.map((i) => {
            const w = buildWords(i, cat);
            return (
              <li key={i.id} className="flex items-center gap-3">
                <BuildPicture item={i} width={44} />
                <span className="min-w-0 flex-1 text-[13px] leading-snug">
                  {i.qty > 1 && <span className="font-mono">{i.qty} × </span>}
                  {w.size}, {w.cloth}
                  <span className="block text-[12px]" style={{ color: "var(--on-surface-soft)" }}>
                    <span className="font-mono">{w.design}</span> · {w.thread}
                  </span>
                </span>
                <span className="price text-[13px]">{naira(w.price * i.qty)}</span>
              </li>
            );
          })}
        </ul>
        <dl className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] gap-y-2 border-t border-dashed pt-4 text-[14px]" style={{ borderColor: "var(--line-dashed)" }}>
          <dt style={{ color: "var(--on-surface-soft)" }}>
            {sets} {sets === 1 ? "set" : "sets"}
          </dt>
          <dd className="price">{naira(subtotal)}</dd>
          <dt style={{ color: "var(--on-surface-soft)" }}>{method === "pickup" ? "Collect" : "Delivery"}</dt>
          <dd className="price">{!delivery ? "Choose" : delivery.fee ? naira(delivery.fee) : "Free"}</dd>
          <dt className="pt-2 text-[15px] font-medium">To pay</dt>
          <dd className="price pt-2 text-[22px] font-bold">{naira(total)}</dd>
        </dl>
        {method === "delivery" && cat.shipping.freeFrom > 0 && !delivery?.free && (
          <p className="mt-2 text-[12px]" style={{ color: "var(--on-surface-soft)" }}>
            Delivery is free on orders of {naira(cat.shipping.freeFrom)} or more.
          </p>
        )}
        {short.map((s) => (
          <p key={s.tier} role="alert" className="mt-3 text-[13px]" style={{ color: "var(--accent)" }}>
            {s.left === 0
              ? `The ${cat.terms[s.tier].name.toLowerCase()} sets are all taken.`
              : `Only ${s.left} ${cat.terms[s.tier].name.toLowerCase()} ${s.left === 1 ? "set is" : "sets are"} left: change your cart first.`}
          </p>
        ))}
        {error && (
          <p role="alert" className="mt-3 text-[13px]" style={{ color: "var(--accent)" }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={blocked}
          className="mt-5 w-full rounded-sm px-6 py-[14px] text-[10.5px] font-medium uppercase tracking-[0.2em] disabled:opacity-40"
          style={{ background: "var(--action)", color: "var(--on-action)" }}
        >
          {!cat.preorder.open ? "Preorders closed for now" : busy ? "Opening Paystack" : `Pay ${naira(total)}`}
        </button>
        <p className="mt-3 text-[12px] leading-relaxed" style={{ color: "var(--on-surface-soft)" }}>
          Paid in full with Paystack, by card, bank transfer or USSD. Your receipt, with a picture of each jallabiya as you built it,
          comes to your email once it is paid.
        </p>
        <Link href="/cart" className="label mt-4 inline-block underline underline-offset-4" style={{ color: "var(--on-surface-soft)" }}>
          Change the cart
        </Link>
      </aside>
    </form>
  );
}
