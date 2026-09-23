"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { DESIGNS, GARMENT_LABEL, NECKLINES, naira, type Garment } from "@/lib/catalogue";
import { COLOURS, FABRICS, type LoomConfig } from "@/lib/loom";
import { ADULT_LENGTHS, CHILD_SIZES, PREORDER, tierFor } from "@/lib/preorder";
import { FLAT_RATIO, LENGTH_RANGE } from "@/lib/jallabiya-flat";
import { THREADS, threadFilter, threadTones } from "@/lib/loom-preview";
import { GarmentPreview } from "./garment-preview";
import { FLATS, GarmentFlat } from "./garment-flat";
import { ZoomStage } from "./zoom-stage";
import { PreorderPanel } from "./preorder-panel";

/* The 3D preview (`garment-3d.tsx`, `src/lib/jallabiya-3d.ts`) is set aside
   for now: the Loom shows the drawn view only. The files are kept so it can
   be brought back; nothing here imports them, so three.js is not loaded. */

/* The Loom is being built out one garment at a time. The jallabiya is open;
   the kaftan and agbada are listed so the range reads, but held until their
   previews are brought up to the same standard. */
const GARMENTS: Garment[] = ["jallabiya", "kaftan", "agbada"];
const COMING_SOON = new Set<Garment>(["kaftan", "agbada"]);

/** A garment only takes the designs its own construction allows. */
function designsFor(garment: Garment) {
  if (garment === "jallabiya") return NECKLINES;
  const family = garment === "agbada" ? "AGD" : "LD";
  return DESIGNS.filter((d) => d.family === family);
}

export function Loom() {
  const [config, setConfig] = useState<LoomConfig>({
    garment: "jallabiya",
    fabric: "cotton",
    colour: "#22314e",
    design: NECKLINES[0].code,
    thread: "original",
    measurements: { height: LENGTH_RANGE.standard, fit: "regular" },
  });

  const available = useMemo(() => designsFor(config.garment), [config.garment]);
  const design = available.find((d) => d.code === config.design) ?? available[0];
  const fabric = FABRICS.find((f) => f.id === config.fabric)!;
  const colour = COLOURS.find((c) => c.hex === config.colour)!;
  const thread = THREADS.find((t) => t.id === config.thread) ?? THREADS[0];
  // how the design is recoloured for the thread; null keeps its own colours
  const tones = useMemo(() => threadTones(config.thread, colour.hex), [config.thread, colour.hex]);
  const flat = FLATS[config.garment];
  const necklines = config.garment === "jallabiya";
  const length = config.measurements.height ?? LENGTH_RANGE.standard;
  const tier = tierFor(length);
  const child = CHILD_SIZES.find((c) => c.length === length);

  /* the shape of the pane the preview is shown in: the jallabiya's drawing is
     cropped tight to the garment, so it is taller and narrower than the rest */
  const paneRatio = flat ? flat.ratio : config.garment === "jallabiya" ? FLAT_RATIO : 500 / 660;

  const drawn = (
    <ZoomStage
      ratio={paneRatio}
      // the jallabiya's neckline sits high in its frame, above the long body
      focus={config.garment === "jallabiya" ? { x: 0.5, y: 0.066 } : undefined}
    >
      {flat ? (
        <GarmentFlat garment={config.garment} colour={colour.hex} design={design ?? null} />
      ) : (
        <GarmentPreview
          garment={config.garment}
          colour={colour.hex}
          fabric={fabric}
          design={design ?? null}
          thread={tones}
          length={config.measurements.height}
        />
      )}
    </ZoomStage>
  );

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
    /* minmax(0, …) so a zoomed preview scrolls inside its pane instead of
       pushing its column, and the page, wider than the screen */
    <div
      id="main"
      className="grid flex-1 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
    >
      {/* The preview is pinned for the whole draft and takes the column it is
          given. A configurator whose subject is a thumbnail is a form. */}
      <section className="relative flex flex-col border-b border-[var(--line)] px-6 py-6 lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <p className="label shrink-0" style={{ color: "var(--on-surface-soft)" }}>
          Live preview · pinned
        </p>
        <span
          className="absolute left-5 top-12 h-[9px] w-[9px] rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.35)]"
          style={{ background: "var(--accent)" }}
          aria-hidden
        />
        <span
          className="absolute right-5 top-12 h-[9px] w-[9px] rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.35)]"
          style={{ background: "var(--color-pin)" }}
          aria-hidden
        />

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 pt-4">
          {/* the figure holds one screen: it is sized off the height it has,
              not off a fixed pixel width, so it never runs past the fold */}
          {/* the width it can take is bounded by the height it has, at the
              drawing's own shape, as well as by the column it sits in. The
              height left is the screen less the nav, the label and the zoom row. */}
          <div
            className="w-full"
            // as wide as the height left over allows at the pane's shape, so the
            // garment is as big as the screen can hold without scrolling
            style={{ maxWidth: `min(92%, 900px, calc((100dvh - 250px) * ${paneRatio.toFixed(4)}))` }}
          >
            {drawn}
            <p className="sr-only">
              {GARMENT_LABEL[config.garment]} in {colour.name} {fabric.name}
              {design ? `, embroidered ${design.code}` : ""}
              {design && tones ? ` in ${thread.name.toLowerCase()} thread` : ""}.
            </p>
          </div>
        </div>
      </section>

      {/* the draft */}
      <section className="px-8 py-8">
        <h1 className="text-[22px]">Build it before we cut it.</h1>

        <Step n="01" title="Garment">
          <div className="flex flex-wrap gap-2">
            {GARMENTS.map((g) =>
              COMING_SOON.has(g) ? (
                <span
                  key={g}
                  aria-disabled
                  className="label flex cursor-not-allowed flex-col items-center rounded-sm border border-dashed px-3 py-[6px] leading-tight"
                  style={{ borderColor: "var(--line-dashed)", color: "var(--on-surface-soft)" }}
                >
                  <span className="opacity-60">{GARMENT_LABEL[g]}</span>
                  <span className="mt-[3px] text-[8px] tracking-[0.16em]" style={{ color: "var(--accent)" }}>
                    Coming soon
                  </span>
                </span>
              ) : (
                <Choice key={g} active={config.garment === g} onClick={() => set("garment", g)}>
                  {GARMENT_LABEL[g]}
                </Choice>
              ),
            )}
          </div>
        </Step>

        <Step n="02" title="Fabric" note={fabric.character}>
          <div className="flex flex-wrap gap-2">
            {FABRICS.map((f) => (
              <Choice
                key={f.id}
                active={config.fabric === f.id}
                onClick={() => set("fabric", f.id)}
              >
                {f.name}
              </Choice>
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
          {/* Every design is shown whole, in its own thread colours. A
              neckline is shown on the chosen cloth, since that is the question
              the picker is answering. The strip scrolls inside its own box so
              it can never run into the next step. */}
          <div className="max-h-[min(34dvh,300px)] overflow-y-auto pb-1 pr-1">
            <ul
              className={`grid gap-2 ${
                necklines
                  ? "grid-cols-[repeat(auto-fill,minmax(84px,1fr))]"
                  : "grid-cols-[repeat(auto-fill,minmax(56px,1fr))]"
              }`}
            >
              {available.map((d) => (
                <li key={d.code}>
                  <button
                    type="button"
                    onClick={() => set("design", d.code)}
                    aria-pressed={design?.code === d.code}
                    title={`${d.code} · ${d.label}`}
                    className={`flex w-full flex-col items-center justify-between rounded-sm border p-[6px] ${
                      necklines ? "h-[96px]" : "h-[104px]"
                    }`}
                    style={{
                      borderColor: design?.code === d.code ? "var(--accent)" : "var(--line-dashed)",
                      background: design?.code === d.code ? "rgba(157,59,44,0.06)" : undefined,
                    }}
                  >
                    <span
                      className="relative min-h-0 w-full flex-1 rounded-[2px]"
                      style={necklines ? { background: colour.hex } : undefined}
                    >
                      <Image
                        src={d.image}
                        alt=""
                        fill
                        sizes="96px"
                        className={necklines ? "object-contain p-[5px]" : "object-contain"}
                        style={
                          necklines
                            ? tones
                              ? { filter: "url(#loom-thread)" }
                              : undefined
                            : { opacity: 0.85 }
                        }
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

          {/* The thread. "As designed" keeps each design's own colours; any
              other runs the whole design in that thread, its light and dark
              kept, so the tiles above and the preview both show it. */}
          {necklines && (
            <div className="mt-4">
              <p className="label mb-2" style={{ color: "var(--on-surface-soft)" }}>
                Thread · {thread.name}
              </p>
              <div className="flex flex-wrap gap-2">
                {THREADS.map((t) => {
                  const swatch =
                    t.id === "original"
                      ? "conic-gradient(#c9a227 0 25%, #3fb8b0 0 50%, #7c6ee0 0 75%, #e38b3a 0)"
                      : t.id === "tonal"
                        ? `radial-gradient(circle, ${threadTones("tonal", colour.hex)!.mid} 0 45%, ${colour.hex} 46%)`
                        : (t.hex as string);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => set("thread", t.id)}
                      aria-pressed={config.thread === t.id}
                      // named as thread: several share a name with a cloth colour above
                      title={t.id === "original" ? "Thread as designed" : `${t.name} thread`}
                      className="h-6 w-6 rounded-full"
                      style={{
                        background: swatch,
                        boxShadow:
                          config.thread === t.id
                            ? "0 0 0 1.5px var(--accent)"
                            : "inset 0 0 0 1px rgba(0,0,0,0.2)",
                      }}
                    >
                      <span className="sr-only">
                        {t.id === "original" ? "Thread as designed" : `${t.name} thread`}
                      </span>
                    </button>
                  );
                })}
              </div>
              {tones && (
                // the tiles above borrow this to show each design in the chosen thread
                <svg width="0" height="0" className="absolute" aria-hidden focusable="false">
                  <filter
                    id="loom-thread"
                    colorInterpolationFilters="sRGB"
                    dangerouslySetInnerHTML={{ __html: threadFilter(tones) }}
                  />
                </svg>
              )}
            </div>
          )}
        </Step>

        <Step
          n="05"
          title="Size"
          note={child ? `${length} inches · children, ${child.age}` : `${length} inches · adult`}
        >
          {/* Cut to a standard length, shoulder to hem: children by age, adults
              every inch from 54 to 62. The size sets the price and which count
              the set comes out of. The exact fit is taken at the fitting. */}
          {([
            ["children", CHILD_SIZES.map((c) => ({ length: c.length, age: c.age }))],
            ["adult", ADULT_LENGTHS.map((l) => ({ length: l, age: "" }))],
          ] as const).map(([t, sizes]) => (
            <div key={t} className="mb-3">
              <p className="label mb-2" style={{ color: "var(--on-surface-soft)" }}>
                {PREORDER[t].name} · {naira(PREORDER[t].price)}
              </p>
              <div className="flex flex-wrap gap-2">
                {sizes.map(({ length: h, age }) => (
                  <Choice
                    key={h}
                    active={length === h}
                    onClick={() =>
                      setConfig((c) => ({ ...c, measurements: { ...c.measurements, height: h } }))
                    }
                  >
                    {h}&Prime;{age ? ` · ${age}` : ""}
                  </Choice>
                ))}
              </div>
            </div>
          ))}
          <p className="label" style={{ color: "var(--on-surface-soft)" }}>
            Between sizes, take the longer: a jallabiya can be taken up, not let down.
            {tier === "children" ? " The preview shows the design at adult proportions." : ""}
          </p>
        </Step>

        {design && (
          <PreorderPanel
            garment={{
              fabric: config.fabric,
              colour: config.colour,
              design: design.code,
              thread: config.thread,
              length,
            }}
            summary={`Jallabiya, ${child ? `children ${length}″ (${child.age})` : `adult ${length}″`}, ${colour.name.toLowerCase()} ${fabric.name.toLowerCase()}, ${design.code}, ${config.thread === "original" ? "thread as designed" : `${thread.name.toLowerCase()} thread`}`}
          />
        )}
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
