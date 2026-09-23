"use client";

import type { ReactNode } from "react";

/** A submit button that asks first, for the things that cannot be undone. */
export function ConfirmButton({ message, children }: { message: string; children: ReactNode }) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      className="label underline underline-offset-4"
      style={{ color: "var(--accent)" }}
    >
      {children}
    </button>
  );
}
