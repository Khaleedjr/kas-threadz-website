"use client";

import { useState, useTransition } from "react";
import type { Colour, LoomFabric } from "@/lib/content-defaults";
import { saveColours, saveFabrics } from "../actions";

const cell = "w-full rounded-sm border bg-transparent px-3 py-[9px] text-[14px] outline-none focus:border-[var(--accent)]";
const edge = { borderColor: "var(--line-dashed)" };
const HEX = /^#[0-9a-fA-F]{6}$/;

function move<T>(list: T[], i: number, by: number): T[] {
  const j = i + by;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

function RowTools({ i, count, hidden, onMove, onHide, onRemove, name }: {
  i: number;
  count: number;
  hidden?: boolean;
  onMove: (by: number) => void;
  onHide: () => void;
  onRemove?: () => void;
  name: string;
}) {
  const tool = "grid h-9 min-w-9 place-items-center rounded-sm border px-2 font-mono text-[13px] disabled:opacity-30";
  return (
    <div className="flex items-center gap-1">
      <button type="button" className={tool} style={edge} disabled={i === 0} onClick={() => onMove(-1)} aria-label={`Move ${name} up`}>
        &uarr;
      </button>
      <button type="button" className={tool} style={edge} disabled={i === count - 1} onClick={() => onMove(1)} aria-label={`Move ${name} down`}>
        &darr;
      </button>
      <button type="button" className={`${tool} label`} style={{ ...edge, color: hidden ? "var(--accent)" : undefined }} onClick={onHide}>
        {hidden ? "Show" : "Hide"}
      </button>
      {onRemove && (
        <button type="button" className={`${tool} label`} style={edge} onClick={onRemove} aria-label={`Remove ${name}`}>
          Remove
        </button>
      )}
    </div>
  );
}

function SaveBar({ dirty, pending, result, onSave }: {
  dirty: boolean;
  pending: boolean;
  result: { ok: boolean; message: string } | null;
  onSave: () => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={onSave}
        disabled={pending || !dirty}
        className="rounded-sm px-6 py-[12px] text-[10.5px] font-medium uppercase tracking-[0.2em] disabled:opacity-40"
        style={{ background: "var(--action)", color: "var(--on-action)" }}
      >
        {pending ? "Saving" : "Save"}
      </button>
      {result && (
        <span role="status" className="text-[13px]" style={{ color: result.ok ? "var(--on-surface-soft)" : "var(--accent)" }}>
          {result.message}
        </span>
      )}
      {dirty && !pending && !result && (
        <span className="text-[13px]" style={{ color: "var(--on-surface-soft)" }}>
          Unsaved changes.
        </span>
      )}
    </div>
  );
}

/** The cloth colours the Loom offers: a name and a colour each, in the order shown. */
export function ColoursEditor({ initial }: { initial: Colour[] }) {
  const [list, setList] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, start] = useTransition();
  const change = (next: Colour[]) => {
    setList(next);
    setDirty(true);
    setResult(null);
  };
  const bad = list.some((c) => !c.name.trim() || !HEX.test(c.hex));

  return (
    <div>
      <ul className="grid gap-2">
        {list.map((c, i) => (
          <li key={i} className="grid grid-cols-[44px_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[44px_minmax(0,1fr)_120px_auto]" style={{ opacity: c.hidden ? 0.55 : 1 }}>
            <input
              type="color"
              value={HEX.test(c.hex) ? c.hex : "#000000"}
              onChange={(e) => change(list.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)))}
              aria-label={`Colour of ${c.name || "new colour"}`}
              className="h-10 w-11 cursor-pointer rounded-sm border p-1"
              style={edge}
            />
            <input
              value={c.name}
              placeholder="Name, like Navy Blue"
              onChange={(e) => change(list.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
              className={cell}
              style={edge}
            />
            <input
              value={c.hex}
              onChange={(e) => change(list.map((x, j) => (j === i ? { ...x, hex: e.target.value.trim() } : x)))}
              aria-label={`Code of ${c.name || "new colour"}`}
              className={`${cell} col-span-2 font-mono sm:col-span-1`}
              style={{ ...edge, borderColor: HEX.test(c.hex) ? edge.borderColor : "var(--accent)" }}
            />
            <div className="col-span-2 sm:col-span-1">
              <RowTools
                i={i}
                count={list.length}
                hidden={c.hidden}
                name={c.name}
                onMove={(by) => change(move(list, i, by))}
                onHide={() => change(list.map((x, j) => (j === i ? { ...x, hidden: !x.hidden } : x)))}
                onRemove={() => change(list.filter((_, j) => j !== i))}
              />
            </div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => change([...list, { name: "", hex: "#808080" }])}
        className="label mt-3 rounded-sm border border-dashed px-4 py-[10px]"
        style={edge}
      >
        Add a colour
      </button>
      {bad && (
        <p className="mt-3 text-[13px]" style={{ color: "var(--accent)" }}>
          Every colour needs a name and a code like #22314e.
        </p>
      )}
      <SaveBar
        dirty={dirty && !bad}
        pending={pending}
        result={result}
        onSave={() =>
          start(async () => {
            const r = await saveColours(list.map((c) => ({ ...c, name: c.name.trim(), hex: c.hex.toLowerCase() })));
            setResult(r);
            if (r.ok) setDirty(false);
          })
        }
      />
    </div>
  );
}

/**
 * The cloths the Loom offers. A cloth's key is filed on every order, so an
 * existing cloth keeps its key; only its name, line and finish change.
 */
export function FabricsEditor({ initial }: { initial: LoomFabric[] }) {
  const [list, setList] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, start] = useTransition();
  const change = (next: LoomFabric[]) => {
    setList(next);
    setDirty(true);
    setResult(null);
  };
  const set = (i: number, patch: Partial<LoomFabric>) => change(list.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const bad = list.some((f) => !f.name.trim());

  return (
    <div>
      <ul className="grid gap-3">
        {list.map((f, i) => (
          <li key={f.id || `new-${i}`} className="grid gap-2 rounded-sm border p-3" style={{ ...edge, opacity: f.hidden ? 0.55 : 1 }}>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <input value={f.name} placeholder="Name, like Linen" onChange={(e) => set(i, { name: e.target.value })} className={cell} style={edge} />
              <RowTools
                i={i}
                count={list.length}
                hidden={f.hidden}
                name={f.name}
                onMove={(by) => change(move(list, i, by))}
                onHide={() => set(i, { hidden: !f.hidden })}
                // a cloth that may be on orders is hidden, never removed; a new one can go
                onRemove={f.id ? undefined : () => change(list.filter((_, j) => j !== i))}
              />
            </div>
            <input
              value={f.character}
              placeholder="One line about it, shown under its name"
              maxLength={120}
              onChange={(e) => set(i, { character: e.target.value })}
              className={cell}
              style={edge}
            />
            <div className="flex flex-wrap items-center gap-4 text-[13px]">
              <span className="label" style={{ color: "var(--on-surface-soft)" }}>
                Preview draws it
              </span>
              {(["matte", "sheen"] as const).map((finish) => (
                <label key={finish} className="flex items-center gap-2">
                  <input type="radio" name={`finish-${i}`} checked={f.finish === finish} onChange={() => set(i, { finish })} />
                  {finish === "matte" ? "Matte, like cotton" : "With a sheen, like silk"}
                </label>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => change([...list, { id: "", name: "", character: "", add: 0, finish: "matte" }])}
        className="label mt-3 rounded-sm border border-dashed px-4 py-[10px]"
        style={edge}
      >
        Add a fabric
      </button>
      {bad && (
        <p className="mt-3 text-[13px]" style={{ color: "var(--accent)" }}>
          Every fabric needs a name.
        </p>
      )}
      <SaveBar
        dirty={dirty && !bad}
        pending={pending}
        result={result}
        onSave={() =>
          start(async () => {
            const r = await saveFabrics(list.map((f) => ({ ...f, name: f.name.trim(), character: f.character.trim() })));
            setResult(r);
            if (r.ok) setDirty(false);
          })
        }
      />
    </div>
  );
}
