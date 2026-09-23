"use client";

/*
 * The cart: the jallabiyas a visitor has built and put aside, kept in their
 * own browser until they check out. It is a convenience for one person on
 * one device; nothing is held or charged until checkout, where the server
 * checks every item and every price again.
 */

import { useSyncExternalStore } from "react";
import type { PreorderGarment } from "./preorder";

export type CartItem = PreorderGarment & {
  /** tells two lines apart, even two identical builds */
  id: string;
  qty: number;
};

const KEY = "kas-cart-v1";
/** No one line of the cart holds more than this many sets. */
export const MAX_QTY = 10;
/** Nor the whole cart. */
export const MAX_SETS = 20;

const EMPTY: CartItem[] = [];
let cache: CartItem[] | null = null;
const listeners = new Set<() => void>();

function read(): CartItem[] {
  if (cache) return cache;
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(raw) ? (raw as CartItem[]).filter((i) => i && typeof i.id === "string") : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: CartItem[]) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // private windows and full storage: the cart lasts for this visit only
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // another tab changed the cart
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** The cart, kept current. Empty on the server and on the first paint. */
export function useCart(): CartItem[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export const setsIn = (items: CartItem[]) => items.reduce((n, i) => n + i.qty, 0);

const same = (a: PreorderGarment, b: PreorderGarment) =>
  a.fabric === b.fabric && a.colour === b.colour && a.design === b.design && a.thread === b.thread && a.length === b.length;

export const cart = {
  /** Add a build, or one more of it if the same build is already in the cart. */
  add(garment: PreorderGarment) {
    const items = read();
    if (setsIn(items) >= MAX_SETS) return false;
    const line = items.find((i) => same(i, garment));
    if (line) {
      if (line.qty >= MAX_QTY) return false;
      write(items.map((i) => (i.id === line.id ? { ...i, qty: i.qty + 1 } : i)));
    } else {
      const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());
      write([...items, { ...garment, id, qty: 1 }]);
    }
    return true;
  },
  setQty(id: string, qty: number) {
    const items = read();
    const others = setsIn(items.filter((i) => i.id !== id));
    const q = Math.max(1, Math.min(MAX_QTY, MAX_SETS - others, Math.round(qty)));
    write(items.map((i) => (i.id === id ? { ...i, qty: q } : i)));
  },
  remove(id: string) {
    write(read().filter((i) => i.id !== id));
  },
  clear() {
    write([]);
  },
};
