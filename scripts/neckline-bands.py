"""
Cut a cuff band from each jallabiya neckline, so the Loom can run the same
design around both sleeves.

Every neckline has two arms that climb to the shoulders, and each arm is one
motif repeated along a line. That repeat is what a cuff takes: the machine
runs the neckline's own motif around the sleeve, just above the turned cuff.

  1. the left arm is found from the needle's track in `neckline-fit.ts`,
     which starts at its tip. The stretch taken runs from just below the tip
     to well short of where the arms meet, and is shortened further until it
     no longer bows, so a curving arm gives its straight part only. The
     track weaves from motif to motif, so it is the bow that is measured,
     never how far a single point strays
  2. the band is lifted off the finished neckline image along that line and
     turned level, the side of the arm that faced the neck kept on top. Its
     depth is the arm's own, found from where its thread lies
  3. the motif's repeat is measured, the band trimmed to a whole number of
     repeats, and those laid end to end until the band is long enough to go
     all the way round a sleeve in one piece, so no join ever shows on it

The band keeps the neckline's scale: sewn from the same file, a cuff is the
same size of stitch as the neck. Run it after `neckline-designs.py`, whenever
a neckline image changes:

    python scripts/neckline-bands.py
"""

from __future__ import annotations

import re
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import map_coordinates

ROOT = Path(__file__).resolve().parent.parent
NECKLINES = ROOT / "public" / "img" / "designs" / "necklines"
FIT_TS = ROOT / "src" / "lib" / "neckline-fit.ts"
BANDS_TS = ROOT / "src" / "lib" / "neckline-bands.ts"

# the arm is taken from this far below its tip to this far along it, as
# shares of its length: clear of the tip's finish and of where the arms meet
FROM, TO = 0.05, 0.7
# a stretch is straight enough when it bows off the line through it by no
# more than this share of the design's width
STRAIGHT = 0.006
# thread is anything more than this opaque
THREAD = 0.35
# room left above and below the thread, in pixels
PAD = 3
# the band is made at least this long, as a share of the neckline's width:
# round the front of a sleeve at the neckline's own scale, with room over
ROUND = 0.8


def read_fits() -> dict[str, list[float]]:
    """Each neckline's needle track, read from the generated fit file."""
    text = FIT_TS.read_text(encoding="utf-8")
    fits = {}
    for m in re.finditer(r'"(/img/designs/necklines/nl\d+\.png)":\s*\{[^}]*?track:\s*\[([^\]]*)\]', text):
        fits[m.group(1)] = [float(v) for v in m.group(2).split(",") if v.strip()]
    return fits


def left_arm(track: list[float], w: int, h: int) -> np.ndarray:
    """The track's first run, down the left arm from its tip, in pixels."""
    pts = []
    for x, y in zip(track[0::2], track[1::2]):
        p = np.array([x * w, y * h])
        # the needle jumps to the other arm's tip: the arm is done
        if pts and np.linalg.norm(p - pts[-1]) > 0.12 * w:
            break
        pts.append(p)
    return np.array(pts)


def straight_stretch(pts: np.ndarray, w: int) -> tuple[np.ndarray, np.ndarray, float, float]:
    """
    The straight part of the arm: a point on it, its direction from the tip,
    and how far along that direction it starts and ends.
    """
    seg = np.linalg.norm(np.diff(pts, axis=0), axis=1)
    along = np.concatenate([[0.0], np.cumsum(seg)])
    total = along[-1]
    to = TO
    while True:
        keep = pts[(along >= FROM * total) & (along <= to * total)]
        centre = keep.mean(axis=0)
        _, _, vt = np.linalg.svd(keep - centre)
        d = vt[0]
        if d @ (keep[-1] - keep[0]) < 0:
            d = -d
        s = (keep - centre) @ d
        v = (keep - centre) @ np.array([-d[1], d[0]])
        # the bow: how far a curve through the stretch sits off its chord at the middle
        bow = abs(np.polyfit(s, v, 2)[0]) * ((s.max() - s.min()) / 2) ** 2
        if bow <= STRAIGHT * w or to <= FROM + 0.25:
            return centre, d, float(s.min()), float(s.max())
        to -= 0.05


def arm_depth(alpha: np.ndarray, centre, d, s0: float, s1: float, w: int) -> tuple[float, float]:
    """
    How far the arm's thread reaches either side of its line. Thread that is
    part of the arm lies in one run across it; anything past a clear gap,
    such as the centre drop, belongs to something else.
    """
    ys, xs = np.nonzero(alpha > THREAD)
    p = np.stack([xs + 0.5, ys + 0.5], axis=1) - centre
    s = p @ d
    v = p @ np.array([-d[1], d[0]])
    near = (s >= s0) & (s <= s1) & (np.abs(v) < 0.2 * w)
    v = v[near]
    lo_edge = int(np.floor(v.min()))
    counts = np.bincount((np.floor(v) - lo_edge).astype(int))
    zero = -lo_edge
    # start from the fullest row near the line, and spread while thread continues
    start = zero - 6 + int(np.argmax(counts[max(0, zero - 6): zero + 7]))
    gap = max(4, int(0.012 * w))
    lo = hi = start
    while lo > 0 and counts[max(0, lo - gap): lo].any():
        lo -= 1
    while hi < len(counts) - 1 and counts[hi + 1: hi + 1 + gap].any():
        hi += 1
    return lo + lo_edge - PAD, hi + lo_edge + 1 + PAD


def lift(rgba: np.ndarray, centre, d, s0: float, s1: float, v0: float, v1: float) -> np.ndarray:
    """The band between those bounds, turned level: along the arm left to right, the neck's side on top."""
    n = np.array([-d[1], d[0]])
    length = int(np.floor(s1 - s0))
    depth = int(np.ceil(v1 - v0))
    uu, vv = np.meshgrid(np.arange(length) + 0.5 + s0, np.arange(depth) + 0.5 + v0)
    px = centre[0] + uu * d[0] + vv * n[0] - 0.5
    py = centre[1] + uu * d[1] + vv * n[1] - 0.5
    a = rgba[..., 3:4] / 255.0
    pre = np.concatenate([rgba[..., :3] * a, a * 255.0], axis=2)
    out = np.stack(
        [map_coordinates(pre[..., c], [py, px], order=1, mode="constant", cval=0.0) for c in range(4)],
        axis=2,
    )
    alpha = out[..., 3:4] / 255.0
    rgb = np.where(alpha > 0, out[..., :3] / np.maximum(alpha, 1e-6), 0)
    return np.concatenate([np.clip(rgb, 0, 255), np.clip(out[..., 3:4], 0, 255)], axis=2)


def repeat_of(band: np.ndarray) -> float | None:
    """The motif's repeat along the band, in pixels, or None when it has none to measure."""
    a = band[..., 3] / 255.0
    length = a.shape[1]
    lowest = max(6, int(0.25 * a.shape[0]))
    shifts = np.arange(lowest, length // 2)
    scores = []
    for k in shifts:
        x, y = a[:, :-k].ravel(), a[:, k:].ravel()
        x, y = x - x.mean(), y - y.mean()
        den = np.sqrt((x * x).sum() * (y * y).sum())
        scores.append((x * y).sum() / den if den else 0.0)
    scores = np.array(scores)
    if not len(scores) or scores.max() < 0.5:
        return None
    # the shortest shift that matches nearly as well as the best is the repeat itself
    best = scores.max()
    for i in range(len(scores)):
        left = scores[i - 1] if i else -1
        right = scores[i + 1] if i + 1 < len(scores) else -1
        if scores[i] >= 0.9 * best and scores[i] >= left and scores[i] >= right:
            # between whole pixels, from the peak's shape
            if 0 < i < len(scores) - 1:
                den = left - 2 * scores[i] + right
                off = 0.5 * (left - right) / den if den else 0.0
            else:
                off = 0.0
            return float(shifts[i] + off)
    return None


def main() -> None:
    fits = read_fits()
    rows = []
    for href, track in sorted(fits.items()):
        path = ROOT / "public" / href.lstrip("/")
        rgba = np.asarray(Image.open(path).convert("RGBA")).astype(np.float64)
        h, w = rgba.shape[:2]
        arm = left_arm(track, w, h)
        centre, d, s0, s1 = straight_stretch(arm, w)
        v0, v1 = arm_depth(rgba[..., 3] / 255.0, centre, d, s0, s1, w)
        band = lift(rgba, centre, d, s0, s1, v0, v1)

        period = repeat_of(band)
        length = band.shape[1]
        if period:
            # as many whole repeats as the straight stretch holds, from its middle
            whole = max(1, int(length // period))
            first = int(round((length - whole * period) / 2))
            band = band[:, first: first + int(round(whole * period))]
            # then laid end to end, whole bands only, until it goes round a sleeve
            copies = int(np.ceil(ROUND * w / band.shape[1]))
            band = np.concatenate([band] * max(1, copies), axis=1)
        else:
            print(f"  {path.stem}: no repeat found; its cuff takes the straight stretch as it is")

        out = NECKLINES / f"{path.stem}-band.png"
        Image.fromarray(np.round(band).astype(np.uint8), "RGBA").save(out, optimize=True)
        rows.append((href, f"/img/designs/necklines/{out.name}", band.shape[1] / w, band.shape[0] / w))
        print(f"{path.stem}: {band.shape[1]} x {band.shape[0]} px, repeat {period and round(period, 1)}")

    body = "".join(
        f'  "{href}": {{ image: "{img}", length: {length:.4f}, depth: {depth:.4f} }},\n'
        for href, img, length, depth in rows
    )
    BANDS_TS.write_text(
        "// Generated by scripts/neckline-bands.py. Do not edit by hand: re-run the\n"
        "// script when a neckline image changes.\n"
        "//\n"
        "// For each neckline, the band its cuffs take: a straight run of its own arm,\n"
        "// turned level and long enough to go round a sleeve in one piece. `length`\n"
        "// and `depth` are its size as shares of the neckline image's width, so it\n"
        "// is drawn at the neckline's own scale.\n"
        "\n"
        "export type NecklineBand = { image: string; length: number; depth: number };\n"
        "\n"
        "export const NECKLINE_BANDS: Record<string, NecklineBand> = {\n"
        f"{body}"
        "};\n",
        encoding="utf-8",
    )
    print(f"wrote {BANDS_TS.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
