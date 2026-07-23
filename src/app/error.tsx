"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // stands in for the error reporter until one is wired up
    console.error(error);
  }, [error]);

  return (
    <div
      data-register="cloth"
      className="ground-cloth flex h-dvh flex-col items-center justify-center px-6 text-center text-[var(--on-surface)]"
    >
      <p className="label" style={{ color: "var(--accent)" }}>
        A dropped stitch
      </p>
      <h1 className="mt-3 text-[clamp(24px,3.4vw,36px)]">Something came apart here.</h1>
      <p
        className="mt-3 max-w-[46ch] text-[14px] leading-[1.7]"
        style={{ color: "var(--on-surface-soft)" }}
      >
        Not your doing. Try again, and if it keeps happening the studio is on WhatsApp and will
        answer faster than this page will.
      </p>

      {error.digest && (
        <p className="label mt-4" style={{ color: "var(--on-surface-soft)" }}>
          Ref {error.digest}
        </p>
      )}

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-sm px-6 py-[14px] text-[10.5px] font-medium uppercase tracking-[0.2em]"
          style={{ background: "var(--action)", color: "var(--on-action)" }}
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-sm border px-6 py-[14px] text-[10.5px] font-medium uppercase tracking-[0.2em]"
          style={{ borderColor: "var(--line-dashed)", color: "var(--on-surface)" }}
        >
          Back to the house
        </Link>
      </div>
    </div>
  );
}
