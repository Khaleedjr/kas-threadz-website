"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { DESIGNS, GARMENT_LABEL, naira, type Garment } from "@/lib/catalogue";
import {
  COLOURS,
  FABRICS,
  GARMENT_PREVIEW,
  LIGHTING,
  estimate,
  type LightingKey,
  type LoomConfig,
} from "@/lib/loom";

const GARMENTS: Garment[] = ["kaftan", "senator", "jallabiya", "agbada"];

/** A garment only takes the designs its own construction allows. */
function designsFor(garment: Garment) {
  const family = garment === "agbada" ? "AGD" : garment === "jallabiya" ? "AF" : "LD";
  return DESIGNS.filter((d) => d.family === family);
}

export function Loom() {
  const [config, setConfig] = useState<LoomConfig>({
    garment: "kaftan",
    fabric: "sevenstar",
    colour: "#20364f",
    design: "LD 115",
    measurements: { fit: "regular" },
  });
  const [light, setLight] = useState<LightingKey>("daylight");

  const available = useMemo(() => designsFor(config.garment), [config.garment]);
  const design = available.find((d) => d.code === config.design) ?? available[0];
  const fabric = FABRICS.find((f) => f.id === config.fabric)!;
  const colour = COLOURS.find((c) => c.hex === config.colour)!;
  const preview = GARMENT_PREVIEW[config.garment];
  const total = estimate({ ...config, design: design?.code ?? null });

  function set<K extends keyof LoomConfig>(key: K, value: LoomConfig[K]) {
    setConfig((c) => {
      const next = { ...c, [key]: value };
      if (key === "garment") {
        next.design = designsFor(value as Garment)[0]?.code ?? null;
      }
      return next;
    });
  }

  return (
    <div id="main" className="grid flex-1 lg:grid-cols-[0.9fr_1.1fr]">
      {/* The preview is pinned for the whole draft and takes the column it is
          given. A configurator whose subject is a thumbnail is a form. */}
      <section className="relative flex flex-col border-b border-[var(--line)] px-6 py-6 lg:sticky lg:top-0 lg:h-dvh lg:border-b-0 lg:border-r">
        <p className="label shrink-0" style={{ color: "var(--on-surface-soft)" }}>
          Live preview · pinned
        </p>
        <span
          className="absolute left-5 top-12 h-[9px] w-[9px] rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.35)]"
          style={{ background: "var(--accent)" }}
          aria-hidden
        />
        <span
          className="absolute bottom-8 right-8 h-[9px] w-[9px] rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.35)]"
          style={{ background: "var(--color-pin)" }}
          aria-hidden
        />

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 pt-4">
          <div className="relative w-full max-w-[min(560px,92%)]">
            <Image
              key={preview.src}
              src={preview.src}
              alt={`${GARMENT_LABEL[config.garment]} in ${colour.name} ${fabric.name}. ${preview.alt}`}
              width={420}
              height={560}
              priority
              className="h-auto w-full max-h-[62dvh] rounded-sm object-contain"
              style={{ filter: LIGHTING[light].filter }}
            />
            {/* The cloth colour over the photograph, until per-colour renders exist.
                Two passes: `color` carries the hue, `multiply` carries the depth,
                because hue alone leaves every dark colour looking like grey. */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-sm mix-blend-color"
              style={{ background: colour.hex, opacity: 0.95, filter: LIGHTING[light].filter }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-sm mix-blend-multiply"
              style={{ background: colour.hex, opacity: 0.42, filter: LIGHTING[light].filter }}
            />
          </div>

          {/* the light switch */}
          <div className="w-full max-w-[min(560px,92%)] shrink-0">
            <p className="label mb-2" style={{ color: "var(--on-surface-soft)" }}>
              See it under
            </p>
            <div className="flex gap-2">
              {(Object.keys(LIGHTING) as LightingKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setLight(key)}
                  aria-pressed={light === key}
                  className="label flex-1 rounded-sm border px-2 py-[9px] transition-colors"
                  style={{
                    borderColor: light === key ? "var(--accent)" : "var(--line-dashed)",
                    color: light === key ? "var(--accent)" : "var(--on-surface-soft)",
                  }}
                >
                  {LIGHTING[key].label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11.5px]" style={{ color: "var(--on-surface-soft)" }}>
              {LIGHTING[light].note}
            </p>
          </div>
        </div>
      </section>

      {/* the draft */}
      <section className="px-8 py-8">
        <h1 className="text-[22px]">Build it before we cut it.</h1>

        <Step n="01" title="Garment">
          <div className="flex flex-wrap gap-2">
            {GARMENTS.map((g) => (
              <Choice key={g} active={config.garment === g} onClick={() => set("garment", g)}>
                {GARMENT_LABEL[g]}
              </Choice>
            ))}
          </div>
        </Step>

        <Step n="02" title="Fabric" note={fabric.character}>
          <div className="flex flex-wrap gap-2">
            {FABRICS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => set("fabric", f.id)}
                aria-pressed={config.fabric === f.id}
                title={`${f.name} · ${f.house}`}
                className="h-10 w-10 rounded-sm bg-cover bg-center transition-shadow"
                style={{
                  backgroundImage: `url(${f.swatch})`,
                  boxShadow:
                    config.fabric === f.id
                      ? "0 0 0 1.5px var(--accent)"
                      : "inset 0 0 0 1px rgba(0,0,0,0.18)",
                }}
              >
                <span className="sr-only">{f.name}</span>
              </button>
            ))}
          </div>
        </Step>

        <Step n="03" title="Colour" note={colour.name}>
          <div className="flex flex-wrap gap-2">
            {COLOURS.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => set("colour", c.hex)}
                aria-pressed={config.colour === c.hex}
                title={c.name}
                className="h-6 w-6 rounded-full"
                style={{
                  background: c.hex,
                  boxShadow:
                    config.colour === c.hex
                      ? "0 0 0 1.5px var(--accent)"
                      : "inset 0 0 0 1px rgba(0,0,0,0.2)",
                }}
              >
                <span className="sr-only">{c.name}</span>
              </button>
            ))}
          </div>
        </Step>

        <Step
          n="04"
          title="Embroidery"
          note={design ? `${design.code} · ${design.placement}` : "None"}
        >
          {/* Every design is shown whole. The tiles are tall enough for an AGD
              panel and an LD placket band alike, and the strip scrolls inside
              its own box so it can never run into the next step. */}
          <div className="max-h-[min(34dvh,300px)] overflow-y-auto pb-1 pr-1">
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(56px,1fr))] gap-2">
              {available.map((d) => (
                <li key={d.code}>
                  <button
                    type="button"
                    onClick={() => set("design", d.code)}
                    aria-pressed={design?.code === d.code}
                    title={`${d.code} · ${d.label}`}
                    className="flex h-[104px] w-full flex-col items-center justify-between rounded-sm border p-[6px]"
                    style={{
                      borderColor: design?.code === d.code ? "var(--accent)" : "var(--line-dashed)",
                      background: design?.code === d.code ? "rgba(157,59,44,0.06)" : undefined,
                    }}
                  >
                    <span className="relative min-h-0 w-full flex-1">
                      <Image
                        src={d.image}
                        alt=""
                        fill
                        sizes="72px"
                        className="object-contain"
                        style={{ opacity: 0.85 }}
                      />
                    </span>
                    <span
                      className="mt-1 block w-full truncate font-mono text-[8px] tracking-[0.08em]"
                      style={{
                        color:
                          design?.code === d.code ? "var(--accent)" : "var(--on-surface-soft)",
                      }}
                    >
                      {d.code}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </Step>

        <Step n="05" title="Measurements" note="Leave blank and we take them at the fitting.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(["chest", "shoulder", "sleeve", "length", "neck"] as const).map((field) => (
              <label key={field} className="block">
                <span className="label block" style={{ color: "var(--on-surface-soft)" }}>
                  {field} (in)
                </span>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={config.measurements[field] ?? ""}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      measurements: {
                        ...c.measurements,
                        [field]: e.target.value === "" ? undefined : Number(e.target.value),
                      },
                    }))
                  }
                  className="mt-1 w-full px-2 py-[7px] text-[12px]"
                  placeholder="·"
                />
              </label>
            ))}
          </div>
        </Step>

        <div className="mt-2 flex flex-wrap items-center gap-4 border-t border-dashed pt-5"
          style={{ borderColor: "var(--line-dashed)" }}>
          <p className="price text-[24px] font-bold">{naira(total)}</p>
          <a
            href={`https://wa.me/2349121942684?text=${encodeURIComponent(orderText(config, design?.code, total))}`}
            className="rounded-sm px-6 py-[13px] text-[10.5px] font-medium uppercase tracking-[0.2em]"
            style={{ background: "var(--action)", color: "var(--on-action)" }}
          >
            Send to the studio
          </a>
          <p className="label" style={{ color: "var(--on-surface-soft)" }}>
            Estimate · 50% deposit · 14 days
          </p>
        </div>
      </section>
    </div>
  );
}

function Step({
  n,
  title,
  note,
  children,
}: {
  n: string;
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative mt-6 border-t border-dashed pt-5 pb-6 pl-6"
      style={{ borderColor: "var(--line-dashed)" }}
    >
      <span
        className="absolute left-0 top-[22px] h-[9px] w-[9px] rounded-full"
        style={{ background: "var(--accent)" }}
        aria-hidden
      />
      <p className="label" style={{ color: "var(--on-surface-soft)" }}>
        Step {n} · {title}
      </p>
      {note && <p className="mt-1 mb-3 font-display text-[15px] font-semibold">{note}</p>}
      <div className={note ? "" : "mt-3"}>{children}</div>
    </div>
  );
}

function Choice({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="label rounded-sm border px-3 py-[9px] transition-colors"
      style={{
        borderColor: active ? "var(--accent)" : "var(--line-dashed)",
        color: active ? "var(--accent)" : "var(--on-surface-soft)",
      }}
    >
      {children}
    </button>
  );
}

function orderText(config: LoomConfig, design: string | undefined, total: number) {
  const m = config.measurements;
  const measured = [
    m.chest && `Chest ${m.chest}"`,
    m.shoulder && `Shoulder ${m.shoulder}"`,
    m.sleeve && `Sleeve ${m.sleeve}"`,
    m.length && `Length ${m.length}"`,
    m.neck && `Neck ${m.neck}"`,
  ].filter(Boolean);

  return [
    "KAS THREADZ · commission",
    "............................",
    `Garment: ${GARMENT_LABEL[config.garment]}`,
    `Fabric: ${FABRICS.find((f) => f.id === config.fabric)?.name}`,
    `Colour: ${COLOURS.find((c) => c.hex === config.colour)?.name}`,
    `Embroidery: ${design ?? "none"}`,
    measured.length ? `Measurements: ${measured.join(" · ")}` : "Measurements: to be taken",
    `Fit: ${config.measurements.fit}`,
    "",
    `Estimate: ${naira(total)}`,
    "(Built in the Loom)",
  ].join("\n");
}
