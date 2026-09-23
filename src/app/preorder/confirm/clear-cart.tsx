"use client";

import { useEffect } from "react";
import { cart } from "@/lib/cart";

/** Once an order is paid, what was in the cart has been bought. */
export function ClearCart() {
  useEffect(() => {
    cart.clear();
  }, []);
  return null;
}
