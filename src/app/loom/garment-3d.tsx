"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { JallabiyaStage, canRender3D } from "@/lib/jallabiya-3d";
import { STAGE_3D_RATIO, type ThreadTones } from "@/lib/loom-preview";

/**
 * The jallabiya in 3D. The stage itself lives in `jallabiya-3d.ts`; this
 * component mounts it, passes the Loom's choices through, and holds the
 * buttons that turn and zoom it. Loaded on the client only: there is nothing
 * to render on the server, and three.js stays out of every other page.
 */
export default function Garment3D({
  colour,
  fabric,
  neckline,
  thread,
  fallback,
}: {
  colour: string;
  fabric: string;
  neckline: string | null;
  /** the thread the neckline is run in; null keeps its own colours */
  thread: ThreadTones | null;
  /** what to show where WebGL is not available */
  fallback: ReactNode;
}) {
  const host = useRef<HTMLDivElement>(null);
  const stage = useRef<JallabiyaStage | null>(null);
  const [supported] = useState(canRender3D);

  useEffect(() => {
    if (!supported || !host.current) return;
    const s = new JallabiyaStage(host.current);
    stage.current = s;
    return () => {
      s.dispose();
      stage.current = null;
    };
  }, [supported]);

  useEffect(() => {
    stage.current?.setCloth(colour, fabric);
  }, [colour, fabric, supported]);

  useEffect(() => {
    stage.current?.setThread(thread);
  }, [thread, supported]);

  /* a newly chosen neckline is stitched in; the one there on arrival is simply there */
  const seen = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const sew = seen.current !== undefined && seen.current !== neckline;
    seen.current = neckline;
    stage.current?.setDesign(neckline, sew);
  }, [neckline, supported]);

  if (!supported) return <>{fallback}</>;

  return (
    <div>
      <div
        ref={host}
        className="relative w-full cursor-grab touch-none select-none active:cursor-grabbing"
        style={{ aspectRatio: STAGE_3D_RATIO }}
      />

      {/* below the stage, not over it, so they never sit on the cloth */}
      <div className="mt-2 flex items-center justify-end gap-1">
        <span className="label mr-auto min-w-0 truncate" style={{ color: "var(--on-surface-soft)" }}>
          <span className="[@media(pointer:coarse)]:hidden">Drag to turn · scroll to zoom</span>
          <span className="hidden [@media(pointer:coarse)]:inline">Drag to turn · pinch</span>
        </span>
        <StageButton label="Front view" onClick={() => stage.current?.view("front")}>
          Front
        </StageButton>
        <StageButton label="Side view" onClick={() => stage.current?.view("side")}>
          Side
        </StageButton>
        <StageButton label="Back view" onClick={() => stage.current?.view("back")}>
          Back
        </StageButton>
        <StageButton label="Zoom out" onClick={() => stage.current?.zoom(-1)}>
          <span className="text-[15px]">&minus;</span>
        </StageButton>
        <StageButton label="Zoom in" onClick={() => stage.current?.zoom(1)}>
          <span className="text-[15px]">+</span>
        </StageButton>
      </div>
    </div>
  );
}

function StageButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid h-8 min-w-8 shrink-0 place-items-center whitespace-nowrap rounded-sm border px-2 font-mono text-[9px] uppercase leading-none tracking-[0.12em] transition-colors"
      style={{
        borderColor: "var(--line-dashed)",
        color: "var(--on-surface)",
        background: "var(--surface)",
      }}
    >
      {children}
    </button>
  );
}
