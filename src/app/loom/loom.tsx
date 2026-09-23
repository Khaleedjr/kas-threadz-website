"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { DESIGNS, GARMENT_LABEL, NECKLINES, type Garment } from "@/lib/catalogue";
import { COLOURS, FABRICS, type LoomConfig } from "@/lib/loom";
import { PREORDER, tierFor } from "@/lib/preorder";
import { FLAT_RATIO, LENGTH_RANGE, flatCallouts } from "@/lib/jallabiya-flat";
import { THREADS, threadTones } from "@/lib/loom-preview";
import { GarmentPreview } from "./garment-preview";
import { FLATS, GarmentFlat } from "./garment-flat";
import { ZoomStage } from "./zoom-stage";
import { PreorderPanel } from "./preorder-panel";
import { GarmentLabels, type GarmentLabel } from "./garment-labels";
import { Sheet } from "./sheet";
import {
  Choice,
  ColourChoices,
  DesignChoices,
  FabricChoices,
  SizeChoices,
  ThreadChoices,
  ThreadFilter,
} from "./pickers";

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

/** The choices a label beside the garment opens, on a phone. */
type SheetId = "design" | "fabric" | "colour" | "size";

/**
 * How high on the screen the part being changed is brought before its sheet
 * rises, as a share of the screen's height: the designs take the most room,
 * so the neckline goes nearest the top.
 */
const CLEAR_OF_SHEET: Record<SheetId, number> = { design: 0.12, fabric: 0.26, colour: 0.26, size: 0.3 };

/* What the Loom opens on. A phone opens on white cloth with Neckline 11,
   the studio's choice for the small screen; a wide screen on navy with the
   first neckline. */
const OPENING = {
  phone: { colour: "#f4f3ef", design: "Neckline 11" },
  wide: { colour: "#22314e", design: NECKLINES[0].code },
};

export function Loom({ phone = false }: { phone?: boolean }) {
  const [config, setConfig] = useState<LoomConfig>(() => ({
    garment: "jallabiya",
    fabric: "cotton",
    colour: OPENING[phone ? "phone" : "wide"].colour,
    design: OPENING[phone ? "phone" : "wide"].design,
    thread: "original",
    measurements: { height: LENGTH_RANGE.standard, fit: "regular" },
  }));
  /* the sheet that is open, and the one last opened, which it keeps showing
     while it slides away */
  const [sheet, setSheet] = useState<SheetId | null>(null);
  const [shown, setShown] = useState<SheetId>("design");

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
  const threadWords =
    config.thread === "original" ? "thread as designed" : `${thread.name.toLowerCase()} thread`;

  function set<K extends keyof LoomConfig>(key: K, value: LoomConfig[K]) {
    setConfig((c) => {
      const next = { ...c, [key]: value };
      if (key === "garment") {
        next.design = designsFor(value as Garment)[0]?.code ?? null;
      }
      return next;
    });
  }
  const setLength = (h: number) =>
    setConfig((c) => ({ ...c, measurements: { ...c.measurements, height: h } }));

  const closeSheet = useCallback(() => setSheet(null), []);

  const openSheet = useCallback((id: string, partY: number) => {
    const which = id as SheetId;
    // bring the part being changed up clear of the sheet, so the change is seen
    const clear = window.innerHeight * CLEAR_OF_SHEET[which];
    if (partY > clear) {
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollBy({ top: partY - clear, behavior: reduced ? "auto" : "smooth" });
    }
    setShown(which);
    setSheet(which);
  }, []);

  // the sheets are a phone's; widened past one, the steps take over
  useEffect(() => {
    const wide = matchMedia("(min-width: 1024px)");
    const onChange = () => wide.matches && setSheet(null);
    wide.addEventListener("change", onChange);
    return () => wide.removeEventListener("change", onChange);
  }, []);

  /* the build, labelled beside the garment on a phone, top to bottom */
  const callouts = flatCallouts({ length, neckline: necklines ? design?.image : null });
  const labels: GarmentLabel[] =
    necklines && design
      ? [
          { id: "design", label: "Design", value: `${design.code}, ${threadWords}`, ...callouts.design },
          { id: "colour", label: "Colour", value: colour.name, ...callouts.colour },
          { id: "fabric", label: "Fabric", value: fabric.name, ...callouts.fabric },
          { id: "size", label: "Size", value: `${length} inches, ${PREORDER[tier].name.toLowerCase()}`, ...callouts.size },
        ]
      : [];

  /* the shape of the pane the preview is shown in: the jallabiya's drawing is
     cropped tight to the garment, so it is taller and narrower than the rest */
  const paneRatio = flat ? flat.ratio : config.garment === "jallabiya" ? FLAT_RATIO : 500 / 660;

  /* Each choice, as the sheet shows it. A pick closes the sheet, so the
     garment is in full view as it changes; the thread is the exception, since
     it recolours the designs in the sheet as well, to choose between them. */
  const sheets: Record<SheetId, { label: string; note: string; body: ReactNode }> = {
    design: {
      label: "Design",
      note: design ? `${design.code} · ${threadWords}` : "None",
      body: (
        <>
          {necklines && (
            <div className="mb-5">
              <ThreadChoices value={config.thread} colour={colour.hex} onPick={(t) => set("thread", t)} fit="sheet" />
            </div>
          )}
          <DesignChoices
            designs={available}
            value={design?.code}
            colour={colour.hex}
            threaded={Boolean(tones)}
            necklines={necklines}
            onPick={(code) => {
              set("design", code);
              closeSheet();
            }}
            fit="sheet"
          />
        </>
      ),
    },
    fabric: {
      label: "Fabric",
      note: fabric.name,
      body: (
        <FabricChoices
          value={config.fabric}
          onPick={(id) => {
            set("fabric", id);
            closeSheet();
          }}
          fit="sheet"
        />
      ),
    },
    colour: {
      label: "Colour",
      note: colour.name,
      body: (
        <ColourChoices
          value={config.colour}
          onPick={(hex) => {
            set("colour", hex);
            closeSheet();
          }}
          fit="sheet"
        />
      ),
    },
    size: {
      label: "Size",
      note: `${length} inches · ${PREORDER[tier].name.toLowerCase()}`,
      body: (
        <SizeChoices
          value={length}
          onPick={(h) => {
            setLength(h);
            closeSheet();
          }}
          fit="sheet"
        />
      ),
    },
  };

  const drawn = (
    <ZoomStage
      ratio={paneRatio}
      // the jallabiya's neckline sits high in its frame, above the long body
      focus={config.garment === "jallabiya" ? { x: 0.5, y: 0.066 } : undefined}
      overlay={labels.length ? <GarmentLabels labels={labels} open={sheet} onOpen={openSheet} /> : undefined}
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

  return (
    /* minmax(0, …) so a zoomed preview scrolls inside its pane instead of
       pushing its column, and the page, wider than the screen */
    <div
      id="main"
      className="grid flex-1 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
    >
      {/* the tiles in the steps and the sheet borrow this to show each design in the chosen thread */}
      <ThreadFilter tones={tones} />

      {/* The preview is pinned for the whole draft and takes the column it is
          given. A configurator whose subject is a thumbnail is a form. */}
      <section className="relative flex flex-col border-b border-[var(--line)] px-6 py-6 lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <p className="label shrink-0" style={{ color: "var(--on-surface-soft)" }}>
          {labels.length ? (
            <>
              {/* on a phone the caption is the instruction, short enough for one line */}
              <span className="lg:hidden">Tap a label to change it</span>
              <span className="hidden lg:inline">Live preview · pinned</span>
            </>
          ) : (
            "Live preview · pinned"
          )}
        </p>
        <span
          className={`absolute left-5 top-12 h-[9px] w-[9px] rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.35)] ${labels.length ? "hidden lg:block" : ""}`}
          style={{ background: "var(--accent)" }}
          aria-hidden
        />
        <span
          className={`absolute right-5 top-12 h-[9px] w-[9px] rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.35)] ${labels.length ? "hidden lg:block" : ""}`}
          style={{ background: "var(--color-pin)" }}
          aria-hidden
        />

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 pt-4">
          {/* the figure holds one screen: the width it can take is bounded by
              the height it has, at the drawing's own shape, as well as by the
              column it sits in. The height left is the screen less the nav,
              the label and the zoom row. */}
          {/* on a phone a little shorter than the screen allows, so the
              labels have paper beside it and the price is nearer */}
          <div
            className="w-full [--preview-share:0.86] lg:[--preview-share:1]"
            style={{
              maxWidth: `min(92%, 900px, calc((100dvh - 250px) * var(--preview-share) * ${paneRatio.toFixed(4)}))`,
            }}
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

        {/* on a phone the choices are the labels on the garment; the steps are for a wide screen */}
        {labels.length > 0 && (
          <p className="label mt-3 leading-relaxed lg:hidden" style={{ color: "var(--on-surface-soft)" }}>
            Kaftan and agbada coming soon
          </p>
        )}

        <div className={labels.length ? "hidden lg:block" : undefined}>
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
            <FabricChoices value={config.fabric} onPick={(id) => set("fabric", id)} fit="steps" />
          </Step>

          <Step n="03" title="Colour" note={colour.name}>
            <ColourChoices value={config.colour} onPick={(hex) => set("colour", hex)} fit="steps" />
          </Step>

          <Step
            n="04"
            title="Embroidery"
            note={design ? `${design.code} · ${design.placement}` : "None"}
          >
            {/* the strip scrolls inside its own box so it can never run into the next step */}
            <div className="max-h-[min(34dvh,300px)] overflow-y-auto pb-1 pr-1">
              <DesignChoices
                designs={available}
                value={design?.code}
                colour={colour.hex}
                threaded={Boolean(tones)}
                necklines={necklines}
                onPick={(code) => set("design", code)}
                fit="steps"
              />
            </div>
            {necklines && (
              <div className="mt-4">
                <ThreadChoices value={config.thread} colour={colour.hex} onPick={(t) => set("thread", t)} fit="steps" />
              </div>
            )}
          </Step>

          <Step n="05" title="Size" note={`${length} inches · ${PREORDER[tier].name.toLowerCase()}`}>
            <SizeChoices value={length} onPick={setLength} fit="steps" />
          </Step>
        </div>

        {design && (
          <PreorderPanel
            garment={{
              fabric: config.fabric,
              colour: config.colour,
              design: design.code,
              thread: config.thread,
              length,
            }}
            summary={`Jallabiya, ${PREORDER[tier].name.toLowerCase()} ${length}″, ${colour.name.toLowerCase()} ${fabric.name.toLowerCase()}, ${design.code}, ${threadWords}`}
          />
        )}
      </section>

      {labels.length > 0 && (
        <Sheet open={sheet !== null} label={sheets[shown].label} note={sheets[shown].note} onClose={closeSheet}>
          {sheets[shown].body}
        </Sheet>
      )}
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
  children: ReactNode;
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
