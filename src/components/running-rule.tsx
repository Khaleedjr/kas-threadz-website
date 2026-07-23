import { runningStitch } from "@/lib/stitch";

/**
 * A rule sewn as a running stitch. Deterministic, so it renders on the server
 * with no client JS at all.
 */
export function RunningRule({
  length = 620,
  className,
  color = "currentColor",
  seed = 7,
}: {
  length?: number;
  className?: string;
  color?: string;
  seed?: number;
}) {
  const stitches = runningStitch(length, { seed });

  return (
    <svg
      viewBox={`0 0 ${length} 8`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {stitches.map((s, i) => (
        <line
          key={i}
          x1={s.x1.toFixed(1)}
          y1={(s.y1 + 4).toFixed(1)}
          x2={s.x2.toFixed(1)}
          y2={(s.y2 + 4).toFixed(1)}
          stroke={color}
          strokeWidth={s.w.toFixed(2)}
          strokeLinecap="round"
          opacity={s.o.toFixed(2)}
        />
      ))}
    </svg>
  );
}
