"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/** How far in the preview goes. The design files hold their detail to 4x. */
const MIN = 1;
const MAX = 4;
const STEP = 1.5;

const clampZ = (z: number) => Math.min(MAX, Math.max(MIN, z));

/** The part of the garment in view, as fractions of the whole garment. */
type Window = { x: number; y: number; w: number; h: number };

/**
 * The live preview, with a loupe.
 *
 * Zooming redraws the garment larger rather than magnifying a picture of it,
 * so the vector cloth and the design files stay sharp at every level, and
 * the view is a real scrolling pane: a wheel, a trackpad, a finger or a drag
 * all move around it. A map of the whole garment shows which part is in view
 * and takes a click or a drag to go anywhere else, so nothing is ever out of
 * reach once zoomed in.
 */
export function ZoomStage({
  children,
  ratio = 500 / 660,
  focus = { x: 0.5, y: 0.18 },
  start,
}: {
  children: ReactNode;
  /** the garment's width over its height */
  ratio?: number;
  /** where the buttons zoom in towards from 1x: the neckline, by default */
  focus?: { x: number; y: number };
  /**
   * The view to open on, when it should not be the whole garment: a zoom,
   * and the point of the garment (as fractions) to put at the top centre of
   * the pane. FIT still goes back to the whole garment.
   */
  start?: { zoom: number; x: number; y: number };
}) {
  const port = useRef<HTMLDivElement>(null);
  const [z, setZ] = useState(() => clampZ(start?.zoom ?? 1));
  const zRef = useRef(clampZ(start?.zoom ?? 1));
  const [view, setView] = useState<Window>({ x: 0, y: 0, w: 1, h: 1 });
  const [dragging, setDragging] = useState(false);
  /** the garment point to hold under a point of the pane through a zoom */
  const hold = useRef<{ fx: number; fy: number; vx: number; vy: number } | null>(
    start ? { fx: start.x, fy: start.y, vx: 0.5, vy: 0 } : null,
  );

  const measure = useCallback(() => {
    const el = port.current;
    if (!el) return;
    setView({
      x: el.scrollLeft / el.scrollWidth,
      y: el.scrollTop / el.scrollHeight,
      w: el.clientWidth / el.scrollWidth,
      h: el.clientHeight / el.scrollHeight,
    });
  }, []);

  /** Zoom to `next`, keeping the garment point under pane point (vx, vy) where it is. */
  const zoomTo = useCallback((next: number, vx = 0.5, vy = 0.5) => {
    const el = port.current;
    if (!el) return;
    const nz = clampZ(next);
    if (Math.abs(nz - zRef.current) < 0.001) return;
    hold.current = {
      fx: (el.scrollLeft + vx * el.clientWidth) / el.scrollWidth,
      fy: (el.scrollTop + vy * el.clientHeight) / el.scrollHeight,
      vx,
      vy,
    };
    zRef.current = nz;
    setZ(nz);
  }, []);

  /* once the larger garment is laid out, scroll so the held point is back
     under the pointer, before the browser paints */
  useLayoutEffect(() => {
    const el = port.current;
    const h = hold.current;
    if (el && h) {
      el.scrollLeft = h.fx * el.scrollWidth - h.vx * el.clientWidth;
      el.scrollTop = h.fy * el.scrollHeight - h.vy * el.clientHeight;
      hold.current = null;
    }
    measure();
  }, [z, measure]);

  /* A trackpad pinch arrives as a wheel event with ctrl held, and a touch
     pinch as two fingers. Both need non-passive listeners, to stop the page
     zooming instead. A plain wheel scrolls the pane, or the page at 1x. */
  useEffect(() => {
    const el = port.current;
    if (!el) return;
    const at = (x: number, y: number) => {
      const r = el.getBoundingClientRect();
      return { vx: (x - r.left) / r.width, vy: (y - r.top) / r.height };
    };
    function onWheel(e: WheelEvent) {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const p = at(e.clientX, e.clientY);
      zoomTo(zRef.current * Math.exp(-e.deltaY * 0.01), p.vx, p.vy);
    }
    let pinch: { spread: number; z: number } | null = null;
    const spread = (t: TouchList) =>
      Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    function onTouchStart(e: TouchEvent) {
      if (e.touches.length === 2) pinch = { spread: spread(e.touches), z: zRef.current };
    }
    function onTouchMove(e: TouchEvent) {
      if (e.touches.length !== 2 || !pinch) return;
      e.preventDefault();
      const p = at(
        (e.touches[0].clientX + e.touches[1].clientX) / 2,
        (e.touches[0].clientY + e.touches[1].clientY) / 2,
      );
      zoomTo(pinch.z * (spread(e.touches) / pinch.spread), p.vx, p.vy);
    }
    function onTouchEnd(e: TouchEvent) {
      if (e.touches.length < 2) pinch = null;
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [zoomTo]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  /* dragging with a mouse; fingers already scroll the pane natively */
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType !== "mouse" || e.button !== 0 || zRef.current <= 1) return;
    const el = port.current!;
    el.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop };
    setDragging(true);
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const el = port.current!;
    el.scrollLeft = d.left - (e.clientX - d.x);
    el.scrollTop = d.top - (e.clientY - d.y);
  }
  function onPointerUp() {
    drag.current = null;
    setDragging(false);
  }

  function onDoubleClick(e: React.MouseEvent) {
    if (zRef.current > 1) {
      zoomTo(1);
      return;
    }
    const r = port.current!.getBoundingClientRect();
    zoomTo(2.5, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  }

  function nudge(dir: 1 | -1) {
    const el = port.current;
    if (!el) return;
    const next = dir > 0 ? zRef.current * STEP : zRef.current / STEP;
    if (next <= MIN + 0.01) return zoomTo(1);
    // Hold the embroidery where it sits in the pane while it is in view, so
    // each step goes further into it. Otherwise, the middle of the pane.
    const vx = (focus.x * el.scrollWidth - el.scrollLeft) / el.clientWidth;
    const vy = (focus.y * el.scrollHeight - el.scrollTop) / el.clientHeight;
    const inView = vx >= 0 && vx <= 1 && vy >= 0 && vy <= 1;
    zoomTo(next, inView ? vx : 0.5, inView ? vy : 0.5);
  }

  /* the map: point anywhere on it to centre the pane there */
  const mapDrag = useRef(false);
  function goTo(e: React.PointerEvent) {
    const el = port.current!;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const fx = (e.clientX - r.left) / r.width;
    const fy = (e.clientY - r.top) / r.height;
    el.scrollLeft = fx * el.scrollWidth - el.clientWidth / 2;
    el.scrollTop = fy * el.scrollHeight - el.clientHeight / 2;
  }

  const zoomed = z > 1;

  return (
    <div>
      <div className="relative">
        <div
          ref={port}
          onScroll={measure}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onDoubleClick={onDoubleClick}
          className="relative select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{
            aspectRatio: ratio,
            overflow: zoomed ? "auto" : "hidden",
            touchAction: zoomed ? "pan-x pan-y" : "pan-y",
            cursor: zoomed ? (dragging ? "grabbing" : "grab") : "zoom-in",
          }}
        >
          <div style={{ width: `${z * 100}%` }}>{children}</div>
        </div>

        {/* the pane's edge, drawn only once there is something beyond it */}
        {zoomed && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-sm"
            style={{ boxShadow: "inset 0 0 0 1px var(--line-dashed)" }}
          />
        )}

        {/* the map of the whole garment, with the part in view marked. It
            sits bottom right, where a long garment leaves empty paper, not
            top right, where it would cover a shoulder */}
        {zoomed && (
          <div
            className="absolute bottom-2 right-2 w-[22%] min-w-[58px] cursor-crosshair touch-none overflow-hidden rounded-sm shadow-[0_2px_10px_rgba(0,0,0,0.18)]"
            style={{ background: "var(--surface)", border: "1px solid var(--line-dashed)" }}
            onPointerDown={(e) => {
              mapDrag.current = true;
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              goTo(e);
            }}
            onPointerMove={(e) => mapDrag.current && goTo(e)}
            onPointerUp={() => (mapDrag.current = false)}
            onPointerCancel={() => (mapDrag.current = false)}
            aria-label="Map of the whole garment. Click to move the view there."
            role="img"
          >
            <div className="pointer-events-none" aria-hidden>
              {children}
            </div>
            <span
              aria-hidden
              className="pointer-events-none absolute rounded-[1px]"
              style={{
                left: `${view.x * 100}%`,
                top: `${view.y * 100}%`,
                width: `${view.w * 100}%`,
                height: `${view.h * 100}%`,
                border: "1.5px solid var(--accent)",
                background: "rgba(157, 59, 44, 0.08)",
              }}
            />
          </div>
        )}
      </div>

      {/* below the stage, not over it: laid on the cloth they would vanish
          into whichever colour was chosen */}
      <div className="mt-2 flex items-center justify-end gap-1">
        <span className="label mr-auto min-w-0 truncate" style={{ color: "var(--on-surface-soft)" }}>
          {zoomed ? (
            <>
              <span className="[@media(pointer:coarse)]:hidden">Drag, scroll or use the map</span>
              <span className="hidden [@media(pointer:coarse)]:inline">Swipe or tap the map</span>
            </>
          ) : (
            <>
              <span className="[@media(pointer:coarse)]:hidden">Double-click to zoom</span>
              <span className="hidden [@media(pointer:coarse)]:inline">Pinch to zoom</span>
            </>
          )}
        </span>
        <span className="label mr-1 tabular-nums" style={{ color: "var(--on-surface-soft)" }}>
          {z.toFixed(1)}&times;
        </span>
        <ZoomButton label="Zoom out" disabled={!zoomed} onClick={() => nudge(-1)}>
          &minus;
        </ZoomButton>
        <ZoomButton label="Zoom in" disabled={z >= MAX} onClick={() => nudge(1)}>
          +
        </ZoomButton>
        {zoomed && (
          <ZoomButton label="Reset zoom" onClick={() => zoomTo(1)}>
            <span className="text-[9px] tracking-[0.12em]">FIT</span>
          </ZoomButton>
        )}
      </div>
    </div>
  );
}

function ZoomButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-8 min-w-8 place-items-center rounded-sm border px-2 font-mono text-[15px] leading-none transition-colors disabled:opacity-35"
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
