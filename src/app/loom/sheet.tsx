"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

/**
 * A picker that rises from the foot of a phone's screen, opened from a tag
 * pinned on the garment.
 *
 * It covers the lower part of the page only, so the garment stays in sight
 * above it, and it goes as soon as a choice is made, so the change is
 * watched on the garment rather than in a list. It is a sibling of the
 * page's content, never inside anything transformed or filtered, since that
 * would pin it to that element instead of the screen.
 */
export function Sheet({
  open,
  label,
  note,
  onClose,
  children,
}: {
  open: boolean;
  label: string;
  /** what is chosen now, under the label */
  note?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const root = document.documentElement;
    const overflow = root.style.overflow;
    // the page stays where it is underneath while a choice is made
    root.style.overflow = "hidden";
    panel.current?.focus({ preventScroll: true });

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      // keep the keyboard inside the sheet while it is open
      const el = panel.current;
      if (e.key !== "Tab" || !el) return;
      const items = el.querySelectorAll<HTMLElement>("button:not([disabled]), a[href]");
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const at = document.activeElement;
      if (e.shiftKey && (at === first || at === el)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && at === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      root.style.overflow = overflow;
      opener?.focus({ preventScroll: true });
    };
  }, [open, onClose]);

  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className="fixed inset-0 z-[48] touch-none motion-safe:transition-opacity motion-safe:duration-300 lg:hidden"
        style={{
          background: "rgba(24, 20, 16, 0.2)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-hidden={!open}
        inert={!open}
        tabIndex={-1}
        className="ground-paper fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[70dvh] max-w-[640px] flex-col rounded-t-[4px] outline-none motion-safe:transition-transform motion-safe:duration-300 lg:hidden"
        style={{
          color: "var(--on-surface)",
          transform: open ? "none" : "translateY(104%)",
          transitionTimingFunction: "var(--ease-thread)",
          boxShadow: open ? "0 -12px 32px rgba(0,0,0,0.18)" : "none",
        }}
      >
        <div
          className="flex shrink-0 items-start justify-between gap-4 border-b border-dashed px-5 pb-3 pt-4"
          style={{ borderColor: "var(--line-dashed)" }}
        >
          <div className="min-w-0">
            <p id={titleId} className="label" style={{ color: "var(--color-pin)" }}>
              {label}
            </p>
            {note && <p className="mt-1 truncate font-display text-[15px] font-semibold">{note}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="label shrink-0 rounded-sm border px-4 py-[10px]"
            style={{ borderColor: "var(--line-dashed)", color: "var(--on-surface-soft)" }}
          >
            Done
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(22px,env(safe-area-inset-bottom))] pt-4">
          {children}
        </div>
      </div>
    </>
  );
}
