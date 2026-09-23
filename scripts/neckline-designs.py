"""
Prepare the jallabiya neckline designs for the Loom.

The studio supplied each design as a screen capture from the embroidery
software: the stitched design on a white ground, some with a grey hoop edge
along the bottom, one on a pale blue ground and one (05) as a bare stitch
outline with the software's red needle marker still on it. The web needs each
one alone on a transparent ground, cut tight, so it can be laid on the
garment in its own thread colours.

  1. the ground is keyed away. Near white and the pale greys are dropped
     outright; the soft edge where thread meets ground is unmixed from the
     ground colour, so no white fringe shows on dark cloth
  2. the needle marker on 05 is dropped, and its outline, which carries no
     thread colour of its own, is run in the house gold
  3. the result is trimmed to the stitches and scaled to the widest the
     preview ever needs
  4. the order a single needle would sew it in is worked out and saved beside
     it, so the Loom can stitch the design into the cloth when it is chosen:
     down the left arm from its tip, down the right arm, then the centre
     from the top down. Gaps between separate motifs are bridged, the way a
     machine jumps its thread across them

    python scripts/neckline-designs.py
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import binary_dilation
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import dijkstra

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "design-sources" / "necklines"
OUT = ROOT / "public" / "img" / "designs" / "necklines"
FIT_TS = ROOT / "src" / "lib" / "neckline-fit.ts"

MAX_SIDE = 900
# the captures carry a hairline frame, and one a cyan edge; shave it off
EDGE = 8
# how hard a faint stitch is pushed to solid: thread is opaque on cloth
BOOST = 3.2
# 05 is an outline with no thread colour; this is the gold of the tassel cord
OUTLINE_GOLD = np.array([201, 164, 92], dtype=np.float32)
# the distance, in source pixels, from one octagon on 05's pendant to the next
PENDANT_PITCH = 67


def mend_marker(rgb: np.ndarray) -> None:
    """
    Take the software's needle marker off 05.

    It sits on the second octagon of the pendant. The octagons repeat down the
    pendant at a fixed pitch, so the patch under the marker is lifted from the
    same place on the octagon below it rather than painted over.
    """
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    marker = (r > 140) & (g < 140) & (b < 140) & (r - g > 50)
    ys, xs = np.nonzero(marker)
    y0, y1 = ys.min() - 16, ys.max() + 22
    x0, x1 = xs.min() - 9, xs.max() + 9
    rgb[y0:y1, x0:x1] = rgb[y0 + PENDANT_PITCH : y1 + PENDANT_PITCH, x0:x1]


def key_out(path: Path) -> Image.Image:
    rgb = np.asarray(Image.open(path).convert("RGB"), dtype=np.float32).copy()
    if path.stem == "05":
        mend_marker(rgb)
    rgb = rgb[EDGE:-EDGE, EDGE:-EDGE]

    lo = rgb.min(axis=2)
    sat = rgb.max(axis=2) - lo
    ground = (sat < 22) & (lo > 185)

    # the ground colour, which is white on all but one
    w = np.median(rgb[ground & (lo > 235)], axis=0)

    dist = np.clip((w - rgb) / np.maximum(w, 1), 0, 1).max(axis=2)
    alpha = np.clip(dist * BOOST, 0, 1)
    alpha[ground] = 0

    if path.stem == "05":
        colour = np.broadcast_to(OUTLINE_GOLD, rgb.shape).copy()
    else:
        a = np.maximum(alpha, 1e-3)[..., None]
        colour = np.clip((rgb - (1 - a) * w) / a, 0, 255)

    rgba = np.dstack([colour, alpha * 255]).astype(np.uint8)
    im = Image.fromarray(rgba, "RGBA")

    ys, xs = np.nonzero(alpha > 0.08)
    pad = 4
    box = (
        max(xs.min() - pad, 0),
        max(ys.min() - pad, 0),
        min(xs.max() + pad + 1, im.width),
        min(ys.max() + pad + 1, im.height),
    )
    im = im.crop(box)

    scale = MAX_SIDE / max(im.size)
    if scale < 1:
        size = (round(im.width * scale), round(im.height * scale))
        im = im.convert("RGBa").resize(size, Image.LANCZOS).convert("RGBA")
    return im


def arm_tips(im: Image.Image) -> dict[str, float]:
    """
    Where the two arms end, as fractions of the image.

    Every neckline is two arms from the shoulders meeting at the chest, but
    they do not all start at the top of the image: some carry a centre column
    that rises above the arms. The garment places each design by its arm tips,
    not by its top edge, so this is measured rather than assumed.
    """
    a = np.asarray(im)[..., 3] > 76
    h, w = a.shape
    cols = np.nonzero(a.any(axis=0))[0]
    band = max(3, round(w * 0.02))
    tips = []
    for lo, hi in ((cols.min(), cols.min() + band), (cols.max() - band + 1, cols.max() + 1)):
        ys, xs = np.nonzero(a[:, lo:hi])
        tips.append((xs.mean() + lo, ys.mean()))
    (lx, ly), (rx, ry) = tips
    return {
        "ratio": round(w / h, 4),
        # half the distance between the tips, as a fraction of the width
        "span": round((rx - lx) / 2 / w, 4),
        # how far down the image the tips sit
        "tip": round((ly + ry) / 2 / h, 4),
    }


# the stitch order is worked at a third of the image's size: plenty for a
# reveal, and it keeps the path search quick
ORDER_SCALE = 3
# how far apart two motifs can be and still be sewn as one run (a jump thread)
BRIDGE = 4
TRACK_POINTS = 96


def stitch_order(im: Image.Image, fit: dict[str, float]) -> tuple[Image.Image, list[float]]:
    """
    When each part of the design is sewn, 0 first to 1 last, and where the
    needle is along the way.

    The needle runs three passes. Down the left arm from its tip to where the
    arms meet, measured along the design, not in a straight line, so a curved
    or stepped arm is followed as it goes; then the right arm the same way;
    then everything else, the centre column and the drop, from the top down.
    Each pass takes time in proportion to how much thread is in it.
    """
    h0, w0 = im.height, im.width
    w, h = max(1, w0 // ORDER_SCALE), max(1, h0 // ORDER_SCALE)
    alpha = np.asarray(im.getchannel("A").resize((w, h), Image.BOX), dtype=np.float32) / 255
    thread = alpha > 0.25
    joined = binary_dilation(thread, iterations=BRIDGE)

    # one node per pixel of the joined design, edges to its eight neighbours
    ys, xs = np.nonzero(joined)
    node = -np.ones((h, w), dtype=np.int64)
    node[ys, xs] = np.arange(len(ys))
    rows, cols, dist = [], [], []
    for dy, dx, cost in ((0, 1, 1.0), (1, 0, 1.0), (1, 1, 2**0.5), (1, -1, 2**0.5)):
        y2, x2 = ys + dy, xs + dx
        ok = (y2 >= 0) & (y2 < h) & (x2 >= 0) & (x2 < w)
        ok[ok] &= joined[y2[ok], x2[ok]]
        rows.append(node[ys[ok], xs[ok]])
        cols.append(node[y2[ok], x2[ok]])
        dist.append(np.full(ok.sum(), cost))
    graph = coo_matrix(
        (np.concatenate(dist), (np.concatenate(rows), np.concatenate(cols))),
        shape=(len(ys), len(ys)),
    ).tocsr()

    def nearest(fx: float, fy: float) -> int:
        d = (xs - fx * w) ** 2 + (ys - fy * h) ** 2
        return int(np.argmin(d))

    left = nearest(0.5 - fit["span"], fit["tip"])
    right = nearest(0.5 + fit["span"], fit["tip"])
    d_left, d_right = dijkstra(graph, directed=False, indices=[left, right])
    across = d_left[right] if np.isfinite(d_left[right]) else 2 * max(
        np.nanmax(np.where(np.isfinite(d_left), d_left, np.nan)), 1
    )
    half = across / 2
    slack = 2.0
    on_left = (d_left < d_right - slack) & (d_left <= half + slack)
    on_right = (d_right < d_left - slack) & (d_right <= half + slack) & ~on_left
    rest = ~on_left & ~on_right

    sewn = thread[ys, xs]
    counts = [max(1, int((on_left & sewn).sum())), max(1, int((on_right & sewn).sum())), int((rest & sewn).sum())]
    total = sum(counts)
    start = np.cumsum([0] + counts[:-1]) / total
    share = np.array(counts) / total

    order = np.ones(len(ys))
    order[on_left] = start[0] + share[0] * np.clip(d_left[on_left] / half, 0, 1)
    order[on_right] = start[1] + share[1] * np.clip(d_right[on_right] / half, 0, 1)
    if rest.any():
        ry = ys[rest]
        top, bottom = ry.min(), max(ry.max(), ry.min() + 1)
        order[rest] = start[2] + share[2] * (ry - top) / (bottom - top)

    grid = np.full((h, w), 255, dtype=np.uint8)
    grid[ys, xs] = np.clip(np.round(order * 254), 0, 254).astype(np.uint8)

    # the needle: where the stitching front is, step by step
    track: list[float] = []
    last = (xs[left] / w, ys[left] / h)
    so, sx, sy = order[sewn], xs[sewn], ys[sewn]
    for k in range(TRACK_POINTS):
        t = (k + 0.5) / TRACK_POINTS
        band = np.abs(so - t) < 0.6 / TRACK_POINTS
        if band.sum() < 3:
            band = np.abs(so - t) < 2 / TRACK_POINTS
        if band.any():
            last = (float(np.median(sx[band])) / w, float(np.median(sy[band])) / h)
        track += [round(last[0], 3), round(last[1], 3)]
    return Image.fromarray(grid, "L"), track


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    fits = {}
    for path in sorted(SRC.glob("*.webp")):
        im = key_out(path)
        dest = OUT / f"nl{path.stem}.png"
        im.save(dest, optimize=True)
        fit = arm_tips(im)
        order, track = stitch_order(im, fit)
        order.save(OUT / f"nl{path.stem}-order.png", optimize=True)
        fits[f"/img/designs/necklines/{dest.name}"] = {**fit, "track": track}
        print(f"{dest.relative_to(ROOT)}  {im.width}x{im.height}  {fit}")

    def row(k: str, v: dict) -> str:
        track = ", ".join(f"{n:g}" for n in v["track"])
        return (
            f'  "{k}": {{\n    ratio: {v["ratio"]}, span: {v["span"]}, tip: {v["tip"]},\n'
            f'    track: [{track}],\n  }},'
        )

    rows = "\n".join(row(k, v) for k, v in fits.items())
    FIT_TS.write_text(
        "// Generated by scripts/neckline-designs.py. Do not edit by hand: re-run the\n"
        "// script when a neckline image changes.\n"
        "//\n"
        "// For each neckline: its width over height, half the distance between its\n"
        "// two arm tips as a fraction of its width, and how far down it the tips sit.\n"
        "// `track` is the needle's path while the design is stitched in, as x, y\n"
        "// pairs in fractions of the image; the order it is sewn in is the image\n"
        "// beside it ending -order.png, dark first, light last.\n"
        "\n"
        "export type NecklineFit = { ratio: number; span: number; tip: number; track: number[] };\n"
        "\n"
        f"export const NECKLINE_FIT: Record<string, NecklineFit> = {{\n{rows}\n}};\n",
        encoding="utf-8",
    )
    print(f"wrote {FIT_TS.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
