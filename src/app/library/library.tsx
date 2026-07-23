"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { DESIGNS, type DesignFamily } from "@/lib/catalogue";

const FAMILY_NOTE: Record<DesignFamily, string> = {
  LD: "Flap & pocket pairs, always stitched together.",
  AF: "Runs that follow the neck opening and continue down the placket.",
  AGD: "Full chest panels for the agbada.",
};

const FILTERS: Array<{ key: DesignFamily | "ALL"; label: string }> = [
  { key: "ALL", label: "All" },
  { key: "LD", label: "Kaftan" },
  { key: "AF", label: "Jallabiya" },
  { key: "AGD", label: "Agbada" },
];

export function Library() {
  const [family, setFamily] = useState<DesignFamily | "ALL">("ALL");
  const [selected, setSelected] = useState(
    () => DESIGNS.find((d) => d.code === "LD 115") ?? DESIGNS[0],
  );

  const shown = useMemo(
    () => (family === "ALL" ? DESIGNS : DESIGNS.filter((d) => d.family === family)),
    [family],
  );

  const count = (key: DesignFamily | "ALL") =>
    key === "ALL" ? DESIGNS.length : DESIGNS.filter((d) => d.family === key).length;

  return (
    <div id="main" className="flex min-h-0 flex-1 flex-col">
      <header className="shrink-0 px-5 pt-5 pb-4 sm:px-7">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-[clamp(18px,2.4vw,22px)]">The Design Library</h1>
          <p className="label" style={{ color: "var(--on-surface-soft)" }}>
            {DESIGNS.length} machine files
          </p>
        </div>
        <p
          className="mt-2 max-w-[62ch] text-[12.5px] leading-[1.6]"
          style={{ color: "var(--on-surface-soft)" }}
        >
          The studio&rsquo;s own files, not a catalogue drawn for the web. Picking{" "}
          <span className="font-mono">LD 115</span> means the embroidery head runs the file named
          LD 115.
        </p>

        {/* Filter by the garment each family actually belongs on. Placement is
            decided by how the clothes are made, not by preference. */}
        <div className="mt-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = family === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFamily(f.key)}
                aria-pressed={active}
                className="label rounded-full border px-3 py-[7px] transition-colors"
                style={{
                  borderColor: active ? "var(--accent)" : "var(--line-dashed)",
                  color: active ? "var(--accent)" : "var(--on-surface-soft)",
                  background: active ? "rgba(157,59,44,0.07)" : undefined,
                }}
              >
                {f.label} <span className="opacity-60">{count(f.key)}</span>
              </button>
            );
          })}
        </div>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_minmax(340px,26vw)]">
        {/* the assets are the interface: you see the stitching, not a row of codes */}
        <div className="min-h-0 overflow-y-auto px-5 pb-6 sm:px-7">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {shown.map((design) => {
              const active = design.code === selected.code;
              return (
                <li key={design.code}>
                  <button
                    type="button"
                    onClick={() => setSelected(design)}
                    aria-pressed={active}
                    className="flex w-full flex-col items-center rounded-sm border p-3 transition-colors"
                    style={{
                      borderColor: active ? "var(--accent)" : "var(--line-dashed)",
                      background: active ? "rgba(157,59,44,0.06)" : "rgba(255,255,255,0.4)",
                    }}
                  >
                    <span className="relative block h-[132px] w-full">
                      <Image
                        src={design.image}
                        alt={`${design.code}, ${design.label}`}
                        fill
                        sizes="(max-width: 640px) 45vw, 180px"
                        className="object-contain"
                      />
                    </span>
                    <span
                      className="mt-3 font-mono text-[11px] tracking-[0.1em]"
                      style={{ color: active ? "var(--accent)" : "var(--on-surface)" }}
                    >
                      {design.code}
                    </span>
                    <span className="label mt-[3px]" style={{ color: "var(--on-surface-soft)" }}>
                      {design.family === "LD"
                        ? "Flap & pocket"
                        : design.family === "AF"
                          ? "Neckline"
                          : "Chest panel"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* the specimen: worth the room on a wide screen, redundant on a narrow one */}
        <aside
          className="hidden min-h-0 flex-col border-l px-7 py-6 lg:flex"
          style={{ borderColor: "var(--line)" }}
        >
          <div className="relative min-h-0 flex-1">
            <Image
              src={selected.image}
              alt={`${selected.code}, ${selected.label}`}
              fill
              sizes="(max-width: 1024px) 0px, 26vw"
              className="object-contain"
            />
          </div>
          <div className="shrink-0 pt-4">
            <p className="font-mono text-[12px]">{selected.code}</p>
            <p
              className="mt-1 text-[11.5px] leading-[1.55]"
              style={{ color: "var(--on-surface-soft)" }}
            >
              {FAMILY_NOTE[selected.family]}
            </p>
            <span
              className="label mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-[7px]"
              style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
              title="Available once the studio's machine files are loaded"
            >
              ▶ Play the stitch path
            </span>
            <Link
              href="/loom"
              className="mt-3 block w-full rounded-sm py-[11px] text-center text-[10.5px] font-medium uppercase tracking-[0.2em]"
              style={{ background: "var(--action)", color: "var(--on-action)" }}
            >
              Put it on a garment
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
