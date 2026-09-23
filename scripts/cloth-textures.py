"""
Weave the cloth surfaces for the Loom's jallabiya previews.

Each texture is a small tile that repeats without a seam.

  cotton, silk   grey relief tiles for the 3D preview (`src/lib/jallabiya-3d.ts`),
                 which reads them as the surface of the cloth, so the weave
                 catches the light without tinting the colour. Grey at 128 is
                 flat cloth.
  linen          the flat preview's surface (`src/lib/jallabiya-flat.ts`): one
                 tile multiplied over the colour for the weave's shadows, and
                 one of the threads' bright faces, which is what shows on dark
                 cloth. Its weave contrast is matched to the reference sketch.

Cotton is a plain weave with fine grain from the fibre and the odd thicker
slub; silk a much closer weave with almost no grain, its character coming
from the sheen rather than the surface; linen a looser weave of uneven
threads with short thick slubs along them.

Every step is done in the frequency domain or on a period that divides the
tile, which is what keeps the edges meeting.

    python scripts/cloth-textures.py
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "img" / "cloth"
SIZE = 256


def periodic_blur(a: np.ndarray, sx: float, sy: float) -> np.ndarray:
    """A gaussian blur that wraps around the tile edges."""
    fy = np.fft.fftfreq(a.shape[0])[:, None]
    fx = np.fft.fftfreq(a.shape[1])[None, :]
    kernel = np.exp(-2 * (np.pi**2) * ((fx * sx) ** 2 + (fy * sy) ** 2))
    return np.real(np.fft.ifft2(np.fft.fft2(a) * kernel))


def unit(a: np.ndarray) -> np.ndarray:
    a = a - a.mean()
    return a / (np.abs(a).max() + 1e-9)


def weave(period: int) -> np.ndarray:
    """A plain weave: each cell shows the warp or the weft, alternately."""
    y, x = np.mgrid[0:SIZE, 0:SIZE]
    warp = np.sin(np.pi * (x % period) / period)  # a thread's round profile
    weft = np.sin(np.pi * (y % period) / period)
    over = ((x // period + y // period) % 2) == 0
    return unit(np.where(over, warp, weft))


def slubs(rng: np.random.Generator, stretch: float) -> np.ndarray:
    """Thicker runs in the yarn, long across the cloth and thin down it."""
    return unit(periodic_blur(rng.standard_normal((SIZE, SIZE)), stretch, 0.8))


def grain(rng: np.random.Generator) -> np.ndarray:
    return unit(periodic_blur(rng.standard_normal((SIZE, SIZE)), 0.7, 0.7))


def mottle(rng: np.random.Generator) -> np.ndarray:
    """Slow unevenness in the dye take-up, so a large area is never flat."""
    return unit(periodic_blur(rng.standard_normal((SIZE, SIZE)), 18, 18))


def save(name: str, a: np.ndarray, contrast: float) -> None:
    img = np.clip(128 + a * contrast, 0, 255).astype(np.uint8)
    dest = OUT / f"{name}.png"
    Image.fromarray(img, "L").save(dest, optimize=True)
    print(f"{dest.relative_to(ROOT)}  range {img.min()}..{img.max()}")


LINEN = 512


def threads(rng: np.random.Generator, n: int) -> tuple[np.ndarray, np.ndarray]:
    """
    Where each of n threads falls across the tile, and how far across it each
    texel is. Linen yarn is uneven, so the threads are of uneven width; a
    perfectly regular grid also shimmers into moire when it is scaled down.
    """
    widths = rng.uniform(0.7, 1.35, n)
    edges = np.r_[0, np.cumsum(widths / widths.sum() * LINEN)]
    pos = np.arange(LINEN) + 0.5
    idx = np.searchsorted(edges, pos, side="right") - 1
    across = (pos - edges[idx]) / (edges[idx + 1] - edges[idx])
    return idx, across


def linen(rng: np.random.Generator) -> np.ndarray:
    """
    A plain linen weave, as the flat preview's sketch shows it: warp and weft
    crossing over and under, each thread with its own shade and thick slubs
    running along it, the gaps between threads reading darker.
    Returns 0 (deepest gap) to 1 (the face of a bright thread).
    """
    n = 96
    xi, xa = threads(rng, n)
    yi, ya = threads(rng, n)
    # each thread's own shade, and slubs: short thick runs along its length,
    # peaked rather than smooth, which is what makes linen read as linen and
    # not as graph paper
    shade = rng.normal(0, 0.16, n)
    along = periodic_blur(rng.standard_normal((n, LINEN)), 0.0001, 4)
    along = along / (np.abs(along).max() + 1e-9)
    along = np.sign(along) * np.abs(along) ** 0.6
    y, x = np.mgrid[0:LINEN, 0:LINEN]
    # round threads packed close, so the gaps between them are narrow
    warp = np.sin(np.pi * xa)[None, :] ** 0.6 * (1 + shade[xi][None, :] + 0.85 * along[xi[x], y])
    weft = np.sin(np.pi * ya)[:, None] ** 0.6 * (1 + shade[yi][:, None] + 0.85 * along[yi[y], x])
    over = ((xi[x] + yi[y]) % 2) == 0
    cloth = np.where(over, warp, weft)
    fibre = periodic_blur(rng.standard_normal((LINEN, LINEN)), 0.6, 0.6)
    cloth = cloth + 0.22 * fibre / np.abs(fibre).max()
    lo, hi = np.percentile(cloth, [1, 99])
    return np.clip((cloth - lo) / (hi - lo), 0, 1)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(46)

    cotton = 0.42 * weave(4) + 0.34 * grain(rng) + 0.28 * slubs(rng, 22) + 0.22 * mottle(rng)
    save("cotton", unit(cotton), 70)

    silk = 0.30 * weave(2) + 0.12 * grain(rng) + 0.40 * slubs(rng, 40) + 0.18 * mottle(rng)
    save("silk", unit(silk), 44)

    # the flat preview's linen, on its own seed so the tiles above never change
    v = linen(np.random.default_rng(58))
    # multiplied over the cloth: white leaves the colour alone, the gaps darken it
    dark = (255 * (1 - 0.15 * (1 - v))).astype(np.uint8)
    Image.fromarray(dark, "L").save(OUT / "linen.png", optimize=True)
    # and the bright faces of the threads, which is all that shows on dark cloth
    lift = np.clip((v - 0.52) / 0.48, 0, 1)
    hi = np.dstack([np.full_like(dark, 255), (255 * lift).astype(np.uint8)])
    Image.fromarray(hi, "LA").save(OUT / "linen-hi.png", optimize=True)
    print(f"public/img/cloth/linen.png and linen-hi.png  {LINEN}px")


if __name__ == "__main__":
    main()
