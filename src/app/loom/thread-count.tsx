"use client";

import { useEffect, useRef } from "react";

/** The thread's height on the page, in CSS pixels. */
const HEIGHT = 16;
/** Plies twisted together, as in a sewing thread. */
const PLIES = 3;
/** How far along the thread one full twist takes, in pixels. */
const PITCH = 13;
/** How far each ply lies from the thread's axis, in pixels. */
const LAY = 3.5;
/** Pixels between the dots of a ply, measured along the ply itself. */
const STEP = 1.5;
/** How fast the twist turns, in radians a second: at rest, and while counting. */
const TURN = { rest: 2, counting: 6 };
/** How quickly the inked length winds to the count, per second. */
const WIND = 3.2;
/** The soft edge where the ink gives way to the ghost, in pixels. */
const FRONT = 7;
/** At rest the twist is slow, so it is drawn at no more than this many frames a second. */
const REST_FPS = 30;

/* Depth and ink are drawn in steps, so a frame is a few dozen fills
   rather than one per dot, and far to near is simply the order of the steps. */
const DEPTHS = 8;
const INKS = 5;

const TAU = Math.PI * 2;
const K = TAU / PITCH;

type RGB = [number, number, number];

/** A CSS colour as red, green and blue, read the way the browser reads it. */
function rgbOf(css: string, probe: CanvasRenderingContext2D): RGB | null {
  if (!css) return null;
  probe.fillStyle = "#000";
  probe.fillStyle = css;
  const v = String(probe.fillStyle);
  if (v.startsWith("#") && v.length === 7) {
    return [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16)) as RGB;
  }
  const m = v.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const [r, g, b] = m[1].split(",").map((n) => parseFloat(n));
  return [r, g, b];
}

const mix = (a: RGB, b: RGB, f: number): RGB => [
  a[0] + (b[0] - a[0]) * f,
  a[1] + (b[1] - a[1]) * f,
  a[2] + (b[2] - a[2]) * f,
];

/**
 * One size's count of sets left, as a length of thread.
 *
 * Three plies twisted together, drawn in dots whose size and ink carry
 * their depth, after the dotted loading orbs of thinking-orbs (MIT, Jakub
 * Antalik): its weaving state, three strands plaited round a sphere, here
 * laid out straight. The thread is as long as the run. The length still to
 * be had is inked; the length gone is only the ghost of the thread.
 *
 * While the count is fetched the ghost turns quickly and a short run of ink
 * shuttles along it. When the count arrives the ink winds in to it; after
 * that the twist turns slowly, and only while it is on screen. A sale winds
 * it back. A sold out thread lies still. With reduced motion it is drawn
 * once, still, at the count.
 */
export function ThreadCount({
  left,
  total,
  active,
  failed,
}: {
  /** sets still to be had; undefined while they are being counted */
  left: number | undefined;
  total: number;
  /** the size chosen now: its thread is in the cut red, the other in ink */
  active: boolean;
  /** the count could not be had */
  failed: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  // what the drawing follows, kept current without restarting it
  const want = useRef({ ink: 0, counting: true, still: false, active });
  const kick = useRef<() => void>(() => {});

  useEffect(() => {
    want.current = {
      ink: left === undefined ? 0 : Math.max(0, Math.min(1, left / total)),
      counting: left === undefined && !failed,
      still: failed || left === 0,
      active,
    };
    kick.current();
  }, [left, total, failed, active]);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let ink = reduced ? want.current.ink : 0;
    let t = 0;
    let last = 0;
    let drawn = 0;
    let frame = 0;
    let onScreen = false;
    let paintedActive: boolean | null = null;

    /* the house colours, read from the register the thread sits in */
    const s = getComputedStyle(el);
    const read = (name: string, fallback: RGB) => rgbOf(s.getPropertyValue(name).trim(), ctx) ?? fallback;
    const cut = read("--accent", [157, 59, 44]);
    const inkColour = read("--on-surface", [35, 42, 51]);
    const paper = read("--surface", [242, 238, 229]);

    // each step of depth and ink: its fill and its dot size
    const fills: string[] = [];
    const radii: number[] = [];
    function restyle() {
      const isActive = want.current.active;
      paintedActive = isActive;
      const base = isActive ? cut : mix(inkColour, paper, 0.18);
      const near = mix(base, [255, 255, 255], 0.22);
      const far = mix(base, [0, 0, 0], 0.35);
      for (let d = 0; d < DEPTHS; d++) {
        const depth = (d + 0.5) / DEPTHS;
        const tone = mix(far, near, depth);
        for (let o = 0; o < INKS; o++) {
          const on = o / (INKS - 1);
          const rgb = mix(inkColour, tone, on);
          const alpha = (0.1 + 0.2 * depth) * (1 - on) + (0.55 + 0.45 * depth) * on;
          fills[d * INKS + o] = `rgba(${rgb[0] | 0},${rgb[1] | 0},${rgb[2] | 0},${alpha.toFixed(3)})`;
          radii[d * INKS + o] = (0.42 + 0.36 * depth) * (1 - on) + (0.58 + 0.5 * depth) * on;
        }
      }
    }
    const buckets: number[][] = Array.from({ length: DEPTHS * INKS }, () => []);

    function size() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      width = el!.clientWidth;
      el!.width = Math.round(width * dpr);
      el!.height = Math.round(HEIGHT * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      const c = ctx!;
      c.clearRect(0, 0, width, HEIGHT);
      if (width < 4) return;
      if (paintedActive !== want.current.active) restyle();
      const counting = want.current.counting;
      const cy = HEIGHT / 2;
      const x0 = 2;
      const x1 = width - 2;
      // the front's soft edge lies wholly off the thread at none and at all
      const inkX = x0 - FRONT / 2 + (x1 - x0 + FRONT) * ink;
      // while counting, a short run of ink shuttles along the ghost
      const shuttle = x0 + ((t / TURN.counting) * 0.9 % 1) * (x1 - x0 + 120) - 60;

      for (const b of buckets) b.length = 0;
      for (let p = 0; p < PLIES; p++) {
        const phase = (p / PLIES) * TAU;
        let x = x0;
        while (x <= x1) {
          const th = x * K + phase - t;
          const z = Math.cos(th);
          // the plies breathe in and out a little, so they read as passing over and under
          const y = cy - Math.sin(th) * LAY * (1 + 0.1 * Math.sin(th * 2 + t * 0.8));
          let on = Math.min(1, Math.max(0, (inkX - x) / FRONT + 0.5));
          if (counting) on = Math.max(on, 0.75 * Math.exp(-(((x - shuttle) / 22) ** 2)));
          const d = Math.min(DEPTHS - 1, (((z + 1) / 2) * DEPTHS) | 0);
          buckets[d * INKS + Math.round(on * (INKS - 1))].push(x, y);
          // the next dot a step further along the ply, not along the thread
          const slope = z * LAY * K;
          x += STEP / Math.sqrt(1 + slope * slope);
        }
      }
      // far to near
      for (let i = 0; i < buckets.length; i++) {
        const b = buckets[i];
        if (!b.length) continue;
        const r = radii[i];
        c.fillStyle = fills[i];
        c.beginPath();
        for (let j = 0; j < b.length; j += 2) {
          c.moveTo(b[j] + r, b[j + 1]);
          c.arc(b[j], b[j + 1], r, 0, TAU);
        }
        c.fill();
      }
    }

    function tick(now: number) {
      frame = 0;
      const w = want.current;
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
      last = now;
      t += dt * (w.still ? 0 : w.counting ? TURN.counting : TURN.rest);
      ink += (w.ink - ink) * (1 - Math.exp(-dt * WIND));
      if (Math.abs(w.ink - ink) < 0.0005) ink = w.ink;
      const settled = ink === w.ink && !w.counting;
      if (!settled || now - drawn >= 1000 / REST_FPS - 2) {
        draw();
        drawn = now;
      }
      // a spent thread that has finished winding needs no more frames
      if (onScreen && !(w.still && settled)) frame = requestAnimationFrame(tick);
    }

    function start() {
      if (reduced) {
        ink = want.current.ink;
        draw();
        return;
      }
      if (!frame && onScreen) {
        last = 0;
        frame = requestAnimationFrame(tick);
      }
    }
    kick.current = start;

    restyle();
    size();
    draw();

    const resized = new ResizeObserver(() => {
      size();
      draw();
    });
    resized.observe(el);

    // only turned while it can be seen
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const seen = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting && document.visibilityState === "visible";
      if (onScreen) start();
      else stop();
    });
    seen.observe(el);
    const onVisibility = () => {
      const r = el.getBoundingClientRect();
      onScreen = document.visibilityState === "visible" && r.bottom > 0 && r.top < window.innerHeight;
      if (onScreen) start();
      else stop();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      resized.disconnect();
      seen.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      kick.current = () => {};
    };
  }, []);

  return <canvas ref={canvas} aria-hidden className="mt-1 block w-full" style={{ height: HEIGHT }} />;
}
