"use client";

import { useEffect, useState } from "react";
import { MARK_ASPECT, MARK_GROUPS, MARK_TOTAL, MARK_VIEWBOX } from "@/lib/mark-stitches";

const CEREMONY_KEY = "kas-mark-sewn";

/** Build the `d` for one thread group, up to a given stitch in the order. */
function pathFor(group: (typeof MARK_GROUPS)[number], upTo: number) {
  let d = "";
  for (let i = 0; i < group.order.length; i++) {
    if (group.order[i] >= upTo) break;
    const c = i * 4;
    d += `M${group.coords[c]} ${group.coords[c + 1]}L${group.coords[c + 2]} ${group.coords[c + 3]}`;
  }
  return d;
}

/**
 * The house mark, satin-stitched.
 *
 * The stitches are digitised at build time, so the finished mark is in the
 * HTML and paints with everything else. Nothing is fetched, decoded or
 * rasterised in the browser, and there is no beat of empty space before it
 * arrives.
 *
 * Ceremony runs once per session: on a first arrival the needle lays every
 * stitch. After that the mark is simply there, because anyone who came back to
 * get something done should not be made to watch a performance again.
 */
export function StitchedMark({
  className,
  onDone,
}: {
  className?: string;
  onDone?: () => void;
}) {
  // Rendered on the server as the finished mark. A first-time visitor has it
  // hidden pre-paint by the inline script in the layout, then sewn.
  const [drawn, setDrawn] = useState(MARK_TOTAL);
  const [needle, setNeedle] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const reveal = () => document.documentElement.classList.remove("kas-sew-pending");

    let sewn = true;
    try {
      sewn = sessionStorage.getItem(CEREMONY_KEY) === "1";
    } catch {
      // private browsing: treat as already sewn rather than replaying every load
    }
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (sewn || reduced) {
      reveal();
      onDone?.();
      return;
    }

    // rebuild the stitch order so the needle can follow it
    const points: Array<{ x: number; y: number }> = new Array(MARK_TOTAL);
    for (const group of MARK_GROUPS) {
      group.order.forEach((stitchIndex, i) => {
        const c = i * 4;
        points[stitchIndex] = { x: group.coords[c + 2], y: group.coords[c + 3] };
      });
    }

    const total = 4200;
    const per = total / MARK_TOTAL;
    const start = performance.now();
    let frame = 0;
    let finished = false;
    let revealed = false;

    // requestAnimationFrame alone stalls in a background tab, which would leave
    // the mark half-sewn for anyone who opens the site and comes back to it
    const tick = () => {
      if (finished) return;
      const n = Math.min(MARK_TOTAL, Math.floor((performance.now() - start) / per));
      setDrawn(n);
      // uncover only once the first frame has emptied it, so the finished mark
      // is never glimpsed before it is sewn
      if (!revealed) {
        revealed = true;
        reveal();
      }
      const p = points[Math.max(0, n - 1)];
      if (p) setNeedle(p);
      if (n < MARK_TOTAL) {
        frame = requestAnimationFrame(tick);
      } else {
        finished = true;
        window.clearInterval(keepalive);
        setNeedle(null);
        try {
          sessionStorage.setItem(CEREMONY_KEY, "1");
        } catch {
          /* nothing to remember it with; the ceremony simply runs again */
        }
        onDone?.();
      }
    };
    const keepalive = window.setInterval(tick, 100);
    frame = requestAnimationFrame(tick);

    return () => {
      finished = true;
      window.clearInterval(keepalive);
      cancelAnimationFrame(frame);
    };
  }, [onDone]);

  return (
    <svg
      viewBox={MARK_VIEWBOX}
      className={className}
      role="img"
      aria-label="KAS THREADZ"
      style={{ overflow: "visible", aspectRatio: MARK_ASPECT }}
    >
      <defs>
        <linearGradient id="kas-thread" x1="0" y1="0" x2="0" y2="700" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--color-thread-bright)" />
          <stop offset="0.36" stopColor="var(--color-thread)" />
          <stop offset="0.68" stopColor="var(--color-thread-dim)" />
          <stop offset="1" stopColor="#efe8d9" />
        </linearGradient>
        <filter id="kas-thread-shadow" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="1.1" stdDeviation="0.8" floodColor="#000" floodOpacity="0.62" />
        </filter>
        <filter id="kas-needle-glow" x="-300%" y="-300%" width="700%" height="700%">
          <feGaussianBlur stdDeviation="2.8" />
        </filter>
      </defs>

      <g className="kas-mark-paths" filter="url(#kas-thread-shadow)">
        {MARK_GROUPS.map((group, i) => (
          <path
            key={i}
            d={pathFor(group, drawn)}
            stroke="url(#kas-thread)"
            strokeWidth={group.w}
            strokeLinecap="round"
            opacity={group.o}
            fill="none"
          />
        ))}
      </g>

      {needle && (
        <g transform={`translate(${needle.x},${needle.y})`}>
          <circle
            r="10"
            fill="none"
            stroke="var(--color-thread)"
            strokeWidth="1.4"
            opacity="0.3"
            filter="url(#kas-needle-glow)"
          />
          <line x1="4" y1="-29" x2="1" y2="-8" stroke="#e8edf4" strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="3.6" cy="-23" r="1.6" fill="none" stroke="#e8edf4" strokeWidth="1.1" />
          <circle r="3.3" fill="var(--color-thread-bright)" />
        </g>
      )}
    </svg>
  );
}
