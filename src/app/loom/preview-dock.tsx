"use client";

import { useEffect, useState, type ReactNode, type RefObject } from "react";

/** How much of the dock's height the garment takes, and how much of the garment it shows. */
const DOCK_HEIGHT = "34dvh";
/** the upper part of the garment: the dress form down past the cuffs, where the embroidery is */
const SHOWN = 0.62;

/**
 * The live preview, docked, for phones.
 *
 * On a phone the preview sits above the steps, so choosing anything scrolls
 * it out of sight. Once it has gone off the top, this slides down and stays:
 * the upper garment, large enough to read the neckline and thread, beside a
 * summary of what has been chosen. Tapping it goes back up to the full
 * preview. On a wide screen the preview is pinned beside the steps already,
 * so this never shows there.
 */
export function PreviewDock({
  watch,
  ratio,
  lines,
  children,
}: {
  /** the full preview; the dock shows once it has scrolled off the top */
  watch: RefObject<HTMLElement | null>;
  /** the drawing's width over its height */
  ratio: number;
  /** the summary beside the garment, first line strongest */
  lines: string[];
  children: ReactNode;
}) {
  const [docked, setDocked] = useState(false);

  useEffect(() => {
    const el = watch.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // gone, or nearly gone, off the top: not merely not reached yet
        setDocked(entry.intersectionRatio < 0.3 && entry.boundingClientRect.top < 0);
      },
      { threshold: [0, 0.3, 0.6] },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [watch]);

  const toTop = () => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    watch.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  };

  return (
    <div
      aria-hidden={!docked}
      inert={!docked}
      className="fixed inset-x-0 top-0 z-30 border-b motion-safe:transition-transform motion-safe:duration-300 lg:hidden"
      style={{
        background: "var(--surface)",
        borderColor: "var(--line)",
        transform: docked ? "none" : "translateY(-105%)",
        boxShadow: docked ? "0 6px 18px rgba(0,0,0,0.12)" : "none",
        transitionTimingFunction: "var(--ease-thread)",
      }}
    >
      <button
        type="button"
        onClick={toTop}
        className="flex w-full items-center gap-4 px-4 pt-2 text-left"
        aria-label="Back to the full preview"
      >
        <span
          className="relative block shrink-0 overflow-hidden"
          style={{ height: DOCK_HEIGHT, width: `calc(${DOCK_HEIGHT} / ${SHOWN} * ${ratio.toFixed(4)})` }}
        >
          <span className="absolute inset-x-0 top-0 block">{children}</span>
        </span>
        <span className="flex min-w-0 flex-col gap-[6px] py-3">
          <span className="label" style={{ color: "var(--accent)" }}>
            Live preview
          </span>
          {lines.map((line, i) => (
            <span
              key={i}
              className={i === lines.length - 1 ? "price text-[18px] font-bold" : "text-[13px] leading-snug"}
              style={i > 0 && i < lines.length - 1 ? { color: "var(--on-surface-soft)" } : undefined}
            >
              {line}
            </span>
          ))}
          <span className="label mt-1" style={{ color: "var(--on-surface-soft)" }}>
            Tap for the full view
          </span>
        </span>
      </button>
    </div>
  );
}
