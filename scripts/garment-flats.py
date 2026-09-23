"""
Prepare the studio's flat illustrations for the Loom.

The kaftan and agbada arrive as high resolution sketches on a grid ground: the
cloth in a warm off white, the embroidery in blue, silver and grey. Two things
have to come out of each before the web can use it.

  1. the ground, keyed away to transparency so the garment sits on the Loom's
     own paper rather than on a second grid
  2. a cloth mask: white where the plain cloth is, black over the embroidery
     and the collar form. The Loom multiplies the chosen colour through this
     mask, so the cloth recolours while the embroidery keeps its own thread.

It writes a trimmed PNG and its mask per garment, plus the aspect ratio each
was trimmed to, and is only re-run when the illustrations change:

    python scripts/garment-flats.py
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "img" / "garments"

# The agbada is the only garment shown as a flat: the studio supplied a blank
# template with no embroidery, so the Loom paints the chosen design onto it and
# the picker reflects. The kaftan went back to the drawn figure.
SOURCES = {
    "agbada": "Gemini_Generated_Image_uioumquioumquiou.png",
}

# the widest the web ever needs it; the sketches are ~2100px, far more than
# a preview column can show
MAX_W = 900


def shift_or(mask: np.ndarray) -> np.ndarray:
    out = mask.copy()
    out[1:, :] |= mask[:-1, :]
    out[:-1, :] |= mask[1:, :]
    out[:, 1:] |= mask[:, :-1]
    out[:, :-1] |= mask[:, 1:]
    return out


def background(rgb: np.ndarray) -> np.ndarray:
    """The grid ground, grown inward from the frame edge."""
    edge = np.concatenate([rgb[:6].reshape(-1, 3), rgb[-6:].reshape(-1, 3),
                           rgb[:, :6].reshape(-1, 3), rgb[:, -6:].reshape(-1, 3)])
    bg = np.median(edge, axis=0)
    near = np.sqrt(((rgb - bg) ** 2).sum(2)) < 26

    h, w = near.shape
    reached = np.zeros_like(near)
    reached[0], reached[-1], reached[:, 0], reached[:, -1] = (
        near[0], near[-1], near[:, 0], near[:, -1])
    while True:
        grown = shift_or(reached) & near
        if np.array_equal(grown, reached):
            break
        reached = grown
    return reached


def build(name: str, src: Path) -> dict:
    im = Image.open(src).convert("RGB")
    rgb = np.asarray(im).astype(np.int16)

    bg = background(rgb)
    garment = ~bg

    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    sat = (mx - mn) / np.maximum(mx, 1)
    luma = 0.2126 * r + 0.7152 * g + 0.0722 * b

    # The embroidery reads by its colour and its dark outline. The silver and
    # grey inside it are neither, but they sit enclosed by the blue, so the
    # region is found from the coloured outline and then its holes are filled.
    # Everything else on the garment is cloth, its fold shadows included, so
    # the shadows recolour rather than showing through as pale flecks.
    # Seed only on the coloured thread. The dark outline is deliberately left
    # out: it also draws the garment's own silhouette, and including it sealed
    # the whole shape so the hole fill swallowed the entire garment.
    ink = garment & (sat > 0.20)
    # close the gaps in the coloured outline so it encloses its greys, and
    # reach a little past it to take the dark stitch edge with it
    im_ink = Image.fromarray((ink * 255).astype(np.uint8))
    im_ink = im_ink.filter(ImageFilter.MaxFilter(13)).filter(ImageFilter.MinFilter(9))
    ink = np.asarray(im_ink) > 127
    # anything the border cannot reach without crossing the outline is inside
    # the embroidery: the greys and silvers enclosed by the blue
    outside = ink.copy()
    outside[0], outside[-1], outside[:, 0], outside[:, -1] = (
        ~ink[0], ~ink[-1], ~ink[:, 0], ~ink[:, -1])
    outside &= ~ink
    while True:
        grown = shift_or(outside) & ~ink
        if np.array_equal(grown, outside):
            break
        outside = grown
    ink = ~outside  # the outline plus everything it encloses
    ink = np.asarray(
        Image.fromarray((ink * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))
    ) > 127

    cloth = garment & ~ink

    # close the pin holes the weave leaves, without pulling the edge in
    m = Image.fromarray((cloth * 255).astype(np.uint8))
    m = m.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))
    m = m.filter(ImageFilter.GaussianBlur(1.2))
    cloth_mask = np.asarray(m)

    # trim both to the garment, with a small margin
    ys, xs = np.nonzero(garment)
    pad = 24
    y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad, garment.shape[0])
    x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad, garment.shape[1])

    art = np.dstack([np.asarray(im), (garment * 255).astype(np.uint8)])[y0:y1, x0:x1]
    maskimg = np.dstack([np.full(cloth_mask.shape + (3,), 255, np.uint8), cloth_mask])[y0:y1, x0:x1]

    scale = min(1.0, MAX_W / art.shape[1])
    size = (int(art.shape[1] * scale), int(art.shape[0] * scale))

    OUT.mkdir(parents=True, exist_ok=True)
    Image.fromarray(art).resize(size, Image.LANCZOS).save(OUT / f"{name}.png", optimize=True)
    Image.fromarray(maskimg).resize(size, Image.LANCZOS).save(OUT / f"{name}-cloth.png", optimize=True)

    ratio = round(size[0] / size[1], 4)
    print(f"{name}: {size[0]}x{size[1]}  ratio {ratio}  "
          f"cloth {100 * (cloth_mask > 127).sum() / cloth_mask.size:.0f}% of frame")
    return {"ratio": ratio}


if __name__ == "__main__":
    dl = Path.home() / "Downloads"
    meta = {name: build(name, dl / f) for name, f in SOURCES.items()}
    (OUT / "meta.json").write_text(json.dumps(meta, indent=2))
    print("wrote", OUT / "meta.json")
