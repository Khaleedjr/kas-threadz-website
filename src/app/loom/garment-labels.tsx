"use client";

import type { FlatCallout } from "@/lib/jallabiya-flat";

export type GarmentLabel = FlatCallout & {
  id: string;
  label: string;
  /** what is chosen now, for a screen reader; everyone else sees it on the garment */
  value: string;
};

const pct = (n: number) => `${n * 100}%`;

/**
 * The build, labelled on the garment on a phone, the way a spec drawing is:
 * each label sits in the paper beside the garment, clear of it, with a line
 * that runs out of it, bends, and ends in a pin on the part it names.
 * Tapping a label opens that choice.
 */
export function GarmentLabels({
  labels,
  open,
  onOpen,
}: {
  labels: GarmentLabel[];
  /** the label whose choice is open, if any */
  open: string | null;
  /** `partY` is where the named part is on the screen, so it can be kept in sight */
  onOpen: (id: string, partY: number) => void;
}) {
  return (
    /* a size container, so on a short phone, where the garment is drawn
       smaller, the labels are set smaller with it. Nothing fixed lives in
       here: a container is the containing block for its fixed descendants. */
    <div className="@container absolute inset-0 lg:hidden">
      {/* The lines, in the frame's own fractions. The stroke keeps to a hair
          at any size, and a paper edge either side keeps it readable where
          it crosses dark cloth. */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {labels.map((l) => {
          const points = [l.anchor, l.elbow, l.target].map((p) => `${p.x * 100},${p.y * 100}`).join(" ");
          return (
            <g key={l.id} fill="none" strokeLinejoin="miter" strokeLinecap="round">
              <polyline
                points={points}
                vectorEffect="non-scaling-stroke"
                strokeWidth={3}
                style={{ stroke: "var(--color-paper)", strokeOpacity: 0.85 }}
              />
              <polyline
                points={points}
                vectorEffect="non-scaling-stroke"
                strokeWidth={1}
                style={{ stroke: "var(--color-ink)", strokeOpacity: 0.8 }}
              />
            </g>
          );
        })}
      </svg>

      {/* the pins, on the parts */}
      {labels.map((l) => (
        <span
          key={`${l.id}-pin`}
          aria-hidden
          className="pointer-events-none absolute h-[9px] w-[9px] rounded-full @max-[250px]:h-[8px] @max-[250px]:w-[8px]"
          style={{
            left: pct(l.target.x),
            top: pct(l.target.y),
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(circle at 35% 30%, #8fb2c8, var(--color-pin) 55%, #22394a)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.45), 0 0 0 1.5px rgba(242,238,229,0.7)",
          }}
        />
      ))}

      {labels.map((l) => (
        <button
          key={l.id}
          type="button"
          onClick={(e) => {
            const box = e.currentTarget.parentElement!.getBoundingClientRect();
            onOpen(l.id, box.top + l.target.y * box.height);
          }}
          aria-haspopup="dialog"
          aria-expanded={open === l.id}
          aria-label={`${l.label}: ${l.value}. Change`}
          className="pointer-events-auto absolute whitespace-nowrap rounded-[2px] border px-[10px] py-[7px] font-mono text-[9px] uppercase leading-none tracking-[0.22em] shadow-[0_2px_6px_rgba(0,0,0,0.14)] transition-colors before:absolute before:-inset-[8px] before:content-[''] @max-[250px]:px-[8px] @max-[250px]:py-[6px] @max-[250px]:text-[8px]"
          style={{
            left: pct(l.anchor.x),
            top: pct(l.anchor.y),
            transform: l.side === "left" ? "translate(-100%, -50%)" : "translate(0, -50%)",
            background: "var(--color-paper)",
            borderColor: open === l.id ? "var(--accent)" : "var(--line-dashed)",
            color: open === l.id ? "var(--accent)" : "var(--color-ink)",
          }}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
