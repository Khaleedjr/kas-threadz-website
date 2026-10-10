"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { DESIGNS, GARMENT_LABEL, NECKLINES, designName, type Garment } from "@/lib/catalogue";
import type { LoomConfig } from "@/lib/loom";
import { FINISH_WORDS, extrasWords, tierFor } from "@/lib/preorder";
import { drawnFabric } from "@/lib/content-defaults";
import { useCatalogue } from "./catalogue-context";
import {
  FLAT_RATIO,
  LENGTH_RANGE,
  buildJallabiyaFlat,
  flatCallouts,
  type FlatState,
  type FlatView,
} from "@/lib/jallabiya-flat";
import { THREADS, designAsset, threadTones } from "@/lib/loom-preview";
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
  FinishChoices,
  SizeChoices,
  Soon,
  type Fit,
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
type SheetId = "design" | "tassel" | "fabric" | "colour" | "sleeves" | "size";

/**
 * How high on the screen the part being changed is brought before its sheet
 * rises, as a share of the screen's height: the designs take the most room,
 * so the neckline goes nearest the top.
 */
const CLEAR_OF_SHEET: Record<SheetId, number> = {
  design: 0.12,
  tassel: 0.2,
  fabric: 0.26,
  colour: 0.26,
  sleeves: 0.3,
  size: 0.3,
};

/* The finishing a jallabiya can take or leave: each part's name, and its two
   choices as the steps, the sheets and the order all call them. */
const FINISHING = {
  sleeves: { name: "Sleeves", ...FINISH_WORDS.sleeves },
  tassel: { name: "Pendant", ...FINISH_WORDS.tassel },
};

/* What the Loom opens on, on every screen: white cloth with the first
   design, the studio's choice, with embroidered cuffs and the gold pendant.
   A build shown on the home page opens it set to that build instead. */
const OPENING = { colour: "#f4f3ef", design: NECKLINES[0].code, sleeves: true, tassel: true };

export function Loom({ opening }: { opening?: { colour: string; design: string } } = {}) {
  const { colours: COLOURS, fabrics: FABRICS, terms: PREORDER, preorder } = useCatalogue();
  const start = { ...OPENING, ...opening };
  const [config, setConfig] = useState<LoomConfig>(() => ({
    garment: "jallabiya",
    // the opening cloth and colour, if the studio still offers them: cotton,
    // or the first cloth that can be ordered now
    fabric: (FABRICS.find((f) => f.id === "cotton" && !f.soon) ?? FABRICS.find((f) => !f.soon) ?? FABRICS[0]).id,
    colour: (COLOURS.find((c) => c.hex === start.colour) ?? COLOURS[0]).hex,
    design: start.design,
    thread: "original",
    sleeves: start.sleeves,
    tassel: start.tassel,
    measurements: { height: LENGTH_RANGE.standard, fit: "regular" },
  }));
  /* the sheet that is open, and the one last opened, which it keeps showing
     while it slides away */
  const [sheet, setSheet] = useState<SheetId | null>(null);
  const [shown, setShown] = useState<SheetId>("design");

  const available = useMemo(() => designsFor(config.garment), [config.garment]);
  const design = available.find((d) => d.code === config.design) ?? available[0];
  // the design as it is read: a neckline by its name, anything else by its code
  const named = design ? designName(design.code) : "";
  const fabric = FABRICS.find((f) => f.id === config.fabric) ?? FABRICS[0];
  const colour = COLOURS.find((c) => c.hex === config.colour) ?? COLOURS[0];
  const thread = THREADS.find((t) => t.id === config.thread) ?? THREADS[0];
  // how the design is recoloured for the thread; null keeps its own colours
  const tones = useMemo(() => threadTones(config.thread, colour.hex), [config.thread, colour.hex]);
  const flat = FLATS[config.garment];
  const necklines = config.garment === "jallabiya";
  const length = config.measurements.height ?? LENGTH_RANGE.standard;
  const tier = tierFor(length);

  /* the finishing choices, each drawn as the garment itself up close, in the
     cloth, colour, design and thread chosen, either way. The steps and a
     phone's sheet each get their own drawings: two drawings on one page must
     not share ids, and the steps are hidden on a phone, where a picture
     borrowing their ids would come out blank. */
  const finishing = useMemo(() => {
    if (!necklines) return null;
    const base: FlatState = {
      color: colour.hex,
      fabric: drawnFabric(fabric).id,
      neckline: designAsset(design ?? null, "neckline"),
      thread: tones,
      length,
      sleeves: config.sleeves,
      tassel: config.tassel,
    };
    const group = (key: "sleeves" | "tassel", view: FlatView, where: Fit) => ({
      name: FINISHING[key].name,
      options: [true, false].map((on) => ({
        value: on,
        label: on ? FINISHING[key].on : FINISHING[key].off,
        picture: buildJallabiyaFlat({ ...base, [key]: on, variant: `${where}-${view}-${on}` }, view),
      })),
    });
    const both = (where: Fit) => ({ sleeves: group("sleeves", "cuff", where), tassel: group("tassel", "pendant", where) });
    return { steps: both("steps"), sheet: both("sheet") };
  }, [necklines, colour.hex, fabric, design, tones, length, config.sleeves, config.tassel]);
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
          { id: "design", label: "Design", value: `${named}, ${threadWords}`, ...callouts.design },
          {
            id: "tassel",
            label: FINISHING.tassel.name,
            value: config.tassel ? FINISHING.tassel.on : FINISHING.tassel.off,
            ...callouts.tassel,
          },
          { id: "colour", label: "Colour", value: colour.name, ...callouts.colour },
          {
            id: "sleeves",
            label: FINISHING.sleeves.name,
            value: config.sleeves ? FINISHING.sleeves.on : FINISHING.sleeves.off,
            ...callouts.sleeves,
          },
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
      note: design ? `${named} · ${threadWords}` : "None",
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
    tassel: {
      label: FINISHING.tassel.name,
      note: config.tassel ? FINISHING.tassel.on : FINISHING.tassel.off,
      body: finishing && (
        <FinishChoices
          {...finishing.sheet.tassel}
          value={config.tassel}
          onPick={(on) => {
            set("tassel", on);
            closeSheet();
          }}
          fit="sheet"
        />
      ),
    },
    sleeves: {
      label: FINISHING.sleeves.name,
      note: config.sleeves ? FINISHING.sleeves.on : FINISHING.sleeves.off,
      body: finishing && (
        <FinishChoices
          {...finishing.sheet.sleeves}
          value={config.sleeves}
          onPick={(on) => {
            set("sleeves", on);
            closeSheet();
          }}
          fit="sheet"
        />
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
          // drawn matte or with a sheen, whatever the studio calls the cloth
          fabric={drawnFabric(fabric)}
          design={design ?? null}
          thread={tones}
          length={config.measurements.height}
          sleeves={necklines && config.sleeves}
          tassel={necklines && config.tassel}
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
              {design ? `, embroidered ${named}` : ""}
              {design && tones ? ` in ${thread.name.toLowerCase()} thread` : ""}
              {necklines ? `, ${extrasWords(config)}` : ""}.
            </p>
          </div>
        </div>
      </section>

      {/* the draft */}
      <section className="px-8 py-8">
        <h1 className="text-[22px]">See it before we sew it.</h1>
        {preorder.description && (
          <p className="mt-2 max-w-[52ch] text-[14px] leading-relaxed" style={{ color: "var(--on-surface-soft)" }}>
            {preorder.description}
          </p>
        )}

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
                  <Soon key={g} name={GARMENT_LABEL[g]} />
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
            note={design ? `${named} · ${design.placement}` : "None"}
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

          {finishing && (
            <Step
              n="05"
              title="Finishing"
              note={`${config.sleeves ? FINISHING.sleeves.on : FINISHING.sleeves.off} · ${config.tassel ? FINISHING.tassel.on : FINISHING.tassel.off}`}
            >
              <div className="flex flex-wrap gap-x-8 gap-y-5">
                <FinishChoices {...finishing.steps.sleeves} value={config.sleeves} onPick={(on) => set("sleeves", on)} fit="steps" />
                <FinishChoices {...finishing.steps.tassel} value={config.tassel} onPick={(on) => set("tassel", on)} fit="steps" />
              </div>
            </Step>
          )}

          <Step n={finishing ? "06" : "05"} title="Size" note={`${length} inches · ${PREORDER[tier].name.toLowerCase()}`}>
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
              sleeves: config.sleeves,
              tassel: config.tassel,
            }}
            summary={`Jallabiya, ${PREORDER[tier].name.toLowerCase()} ${length}″, ${colour.name.toLowerCase()} ${fabric.name.toLowerCase()}, ${named}, ${threadWords}, ${extrasWords(config)}`}
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
