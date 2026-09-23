"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { naira } from "@/lib/catalogue";
import { COLOURS, FABRICS } from "@/lib/loom";
import { THREADS, threadFilter, threadTones, type ThreadTones } from "@/lib/loom-preview";
import { ADULT_LENGTHS, CHILD_LENGTHS, PREORDER, type Tier } from "@/lib/preorder";

/*
 * The Loom's choices, drawn once and used in two places: the steps beside
 * the preview on a wide screen, and the sheet a tag on the garment opens on
 * a phone. In the sheet every target is sized for a finger and says what it
 * is, since there is no step heading above it.
 */

/** Where a set of choices is shown: the steps, or a phone's sheet. */
export type Fit = "steps" | "sheet";

type Tile = { code: string; label: string; image: string };

export function FabricChoices({
  value,
  onPick,
  fit,
}: {
  value: string;
  onPick: (id: string) => void;
  fit: Fit;
}) {
  if (fit === "steps") {
    return (
      <div className="flex flex-wrap gap-2">
        {FABRICS.map((f) => (
          <Choice key={f.id} active={value === f.id} onClick={() => onPick(f.id)}>
            {f.name}
          </Choice>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3">
      {FABRICS.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onPick(f.id)}
          aria-pressed={value === f.id}
          className="flex flex-col gap-2 rounded-sm border p-4 text-left"
          style={{
            borderColor: value === f.id ? "var(--accent)" : "var(--line-dashed)",
            background: value === f.id ? "rgba(157,59,44,0.06)" : undefined,
          }}
        >
          <span
            className="font-display text-[16px] font-semibold"
            style={{ color: value === f.id ? "var(--accent)" : undefined }}
          >
            {f.name}
          </span>
          <span className="text-[13px] leading-snug" style={{ color: "var(--on-surface-soft)" }}>
            {f.character}
          </span>
        </button>
      ))}
    </div>
  );
}

export function ColourChoices({
  value,
  onPick,
  fit,
}: {
  value: string;
  onPick: (hex: string) => void;
  fit: Fit;
}) {
  const ring = (on: boolean) => (on ? "0 0 0 1.5px var(--accent)" : "inset 0 0 0 1px rgba(0,0,0,0.2)");
  if (fit === "steps") {
    return (
      <div className="flex flex-wrap gap-2">
        {COLOURS.map((c) => (
          <button
            key={c.hex}
            type="button"
            onClick={() => onPick(c.hex)}
            aria-pressed={value === c.hex}
            title={c.name}
            className="h-6 w-6 rounded-full"
            style={{ background: c.hex, boxShadow: ring(value === c.hex) }}
          >
            <span className="sr-only">{c.name}</span>
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-4 gap-x-2 gap-y-4">
      {COLOURS.map((c) => (
        <button
          key={c.hex}
          type="button"
          onClick={() => onPick(c.hex)}
          aria-pressed={value === c.hex}
          className="flex flex-col items-center gap-2"
        >
          <span
            className="block h-10 w-10 rounded-full"
            style={{
              background: c.hex,
              boxShadow:
                value === c.hex
                  ? "0 0 0 2px var(--surface), 0 0 0 3.5px var(--accent)"
                  : "inset 0 0 0 1px rgba(0,0,0,0.2)",
            }}
          />
          <span
            className="text-center font-mono text-[9px] uppercase leading-tight tracking-[0.12em]"
            style={{ color: value === c.hex ? "var(--accent)" : "var(--on-surface-soft)" }}
          >
            {c.name}
          </span>
        </button>
      ))}
    </div>
  );
}

/**
 * The designs, each shown whole. A neckline is shown on the chosen cloth and
 * in the chosen thread, since that is the question the picker is answering.
 */
export function DesignChoices({
  designs,
  value,
  colour,
  threaded,
  necklines,
  onPick,
  fit,
}: {
  designs: Tile[];
  value: string | undefined;
  colour: string;
  /** whether a thread other than the design's own is chosen; the tiles then borrow its filter */
  threaded: boolean;
  necklines: boolean;
  onPick: (code: string) => void;
  fit: Fit;
}) {
  const sheet = fit === "sheet";
  return (
    <ul
      className={`grid gap-2 ${
        sheet
          ? "grid-cols-4 sm:grid-cols-5"
          : necklines
            ? "grid-cols-[repeat(auto-fill,minmax(84px,1fr))]"
            : "grid-cols-[repeat(auto-fill,minmax(56px,1fr))]"
      }`}
    >
      {designs.map((d) => {
        const on = value === d.code;
        return (
          <li key={d.code}>
            <button
              type="button"
              onClick={() => onPick(d.code)}
              aria-pressed={on}
              title={`${d.code} · ${d.label}`}
              className={`flex w-full flex-col items-center justify-between rounded-sm border p-[6px] ${
                sheet ? "h-[104px]" : necklines ? "h-[96px]" : "h-[104px]"
              }`}
              style={{
                borderColor: on ? "var(--accent)" : "var(--line-dashed)",
                background: on ? "rgba(157,59,44,0.06)" : undefined,
              }}
            >
              <span
                className="relative min-h-0 w-full flex-1 rounded-[2px]"
                style={necklines ? { background: colour } : undefined}
              >
                <Image
                  src={d.image}
                  alt=""
                  fill
                  sizes="104px"
                  className={necklines ? "object-contain p-[5px]" : "object-contain"}
                  style={
                    necklines
                      ? threaded
                        ? { filter: "url(#loom-thread)" }
                        : undefined
                      : { opacity: 0.85 }
                  }
                />
              </span>
              <span
                // the whole code, always: it is the file's name on the machine
                className={`mt-1 block w-full truncate font-mono ${sheet ? "text-[8.5px] tracking-[0.02em]" : "text-[8px] tracking-[0.08em]"}`}
                style={{ color: on ? "var(--accent)" : "var(--on-surface-soft)" }}
              >
                {d.code}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** How a thread is shown as a swatch: "as designed" as the colours a design comes in. */
export function threadSwatch(id: string, cloth: string): string {
  const t = THREADS.find((x) => x.id === id);
  if (!t || t.id === "original") return "conic-gradient(#c9a227 0 25%, #3fb8b0 0 50%, #7c6ee0 0 75%, #e38b3a 0)";
  if (t.id === "tonal") return `radial-gradient(circle, ${threadTones("tonal", cloth)!.mid} 0 45%, ${cloth} 46%)`;
  return t.hex as string;
}

/**
 * The thread. "As designed" keeps each design's own colours; any other runs
 * the whole design in that thread, its light and dark kept.
 */
export function ThreadChoices({
  value,
  colour,
  onPick,
  fit,
}: {
  value: string;
  colour: string;
  onPick: (id: string) => void;
  fit: Fit;
}) {
  const sheet = fit === "sheet";
  const current = THREADS.find((t) => t.id === value) ?? THREADS[0];
  return (
    <div>
      <p className="label mb-2" style={{ color: "var(--on-surface-soft)" }}>
        Thread · {current.name}
      </p>
      <div
        className={
          sheet
            ? "-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 pt-[3px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            : "flex flex-wrap gap-2"
        }
      >
        {THREADS.map((t) => {
          // named as thread: several share a name with a cloth colour
          const name = t.id === "original" ? "Thread as designed" : `${t.name} thread`;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onPick(t.id)}
              aria-pressed={value === t.id}
              title={name}
              className={`shrink-0 rounded-full ${sheet ? "h-9 w-9" : "h-6 w-6"}`}
              style={{
                background: threadSwatch(t.id, colour),
                boxShadow:
                  value === t.id
                    ? sheet
                      ? "0 0 0 2px var(--surface), 0 0 0 3.5px var(--accent)"
                      : "0 0 0 1.5px var(--accent)"
                    : "inset 0 0 0 1px rgba(0,0,0,0.2)",
              }}
            >
              <span className="sr-only">{name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** The filter the design tiles borrow to show each design in the chosen thread. */
export function ThreadFilter({ tones }: { tones: ThreadTones | null }) {
  if (!tones) return null;
  return (
    <svg width="0" height="0" className="absolute" aria-hidden focusable="false">
      <filter
        id="loom-thread"
        colorInterpolationFilters="sRGB"
        dangerouslySetInnerHTML={{ __html: threadFilter(tones) }}
      />
    </svg>
  );
}

/**
 * The lengths it is cut in, shoulder to hem. The size sets the price and
 * which count the set comes out of; the exact fit is taken at the fitting.
 */
export function SizeChoices({
  value,
  onPick,
  fit,
}: {
  value: number;
  onPick: (length: number) => void;
  fit: Fit;
}) {
  const groups: Array<[Tier, number[]]> = [
    ["children", CHILD_LENGTHS],
    ["adult", ADULT_LENGTHS],
  ];
  return (
    <div>
      {groups.map(([tier, lengths]) => (
        <div key={tier} className={fit === "sheet" ? "mb-5" : "mb-3"}>
          <p className="label mb-2" style={{ color: "var(--on-surface-soft)" }}>
            {PREORDER[tier].name} · {naira(PREORDER[tier].price)}
          </p>
          <div className="flex flex-wrap gap-2">
            {lengths.map((l) => (
              <Choice key={l} active={value === l} onClick={() => onPick(l)} fit={fit}>
                {l}&Prime;
              </Choice>
            ))}
          </div>
        </div>
      ))}
      <p className="label leading-relaxed" style={{ color: "var(--on-surface-soft)" }}>
        Measured shoulder to hem. Between sizes, take the longer: a jallabiya can be taken up, not
        let down.
        {value < ADULT_LENGTHS[0] ? " The preview shows the design at adult proportions." : ""}
      </p>
    </div>
  );
}

export function Choice({
  active,
  onClick,
  fit = "steps",
  children,
}: {
  active: boolean;
  onClick: () => void;
  fit?: Fit;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`label rounded-sm border transition-colors ${
        fit === "sheet" ? "min-w-[60px] px-4 py-[13px]" : "px-3 py-[9px]"
      }`}
      style={{
        borderColor: active ? "var(--accent)" : "var(--line-dashed)",
        color: active ? "var(--accent)" : "var(--on-surface-soft)",
        background: active && fit === "sheet" ? "rgba(157,59,44,0.06)" : undefined,
      }}
    >
      {children}
    </button>
  );
}
