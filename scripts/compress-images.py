"""
Make the pictures the jallabiya drawing links to small enough for a phone.

The drawing on the home page and in Design Yours is an SVG, and an SVG's own
pictures are fetched as they are, never resized or recompressed the way the
site's photos are. So the files themselves have to be small:

- each design (nlXX.png) and its cuff band (nlXX-band.png) is put on a
  palette of 256 colours with its transparency kept. A design keeps its size
  and its look, at about a quarter of the weight.
- the two linen textures keep their size and lose only grey steps no one can
  see at the size they are drawn, 64 of them instead of 256.

The sewing orders (nlXX-order.png) are left alone: they are data, not pictures,
and already small.

Run it from the project's folder after `neckline-designs.py` or
`neckline-bands.py` has made new pictures:

    python scripts/compress-images.py

A picture already done is skipped, so running it twice changes nothing.
"""

import glob
import io
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NECKLINES = os.path.join(ROOT, "public", "img", "designs", "necklines")
CLOTH = os.path.join(ROOT, "public", "img", "cloth")


def png_bytes(im):
    buf = io.BytesIO()
    im.save(buf, "PNG", optimize=True)
    return buf.getvalue()


def write_if_smaller(path, data):
    before = os.path.getsize(path)
    if len(data) >= before:
        return before, before
    with open(path, "wb") as f:
        f.write(data)
    return before, len(data)


def designs():
    paths = sorted(glob.glob(os.path.join(NECKLINES, "nl[0-9][0-9].png")))
    paths += sorted(glob.glob(os.path.join(NECKLINES, "nl[0-9][0-9]-band.png")))
    for path in paths:
        im = Image.open(path)
        if im.mode == "P":
            yield path, None
            continue
        yield path, png_bytes(im.convert("RGBA").quantize(256, method=Image.Quantize.FASTOCTREE))


def posterise(channel, levels=64):
    step = 256 // levels
    return channel.point(lambda v: min(255, (v // step) * step + step // 2))


def textures():
    for name in ("linen.png", "linen-hi.png"):
        path = os.path.join(CLOTH, name)
        im = Image.open(path)
        bands = [posterise(c) for c in im.split()]
        # a texture already put on its 64 steps comes out of it unchanged
        if all(b.tobytes() == c.tobytes() for b, c in zip(bands, im.split())):
            yield path, None
            continue
        yield path, png_bytes(Image.merge(im.mode, bands))


def main():
    total_before = total_after = 0
    for path, data in [*designs(), *textures()]:
        name = os.path.relpath(path, ROOT)
        if data is None:
            print(f"{name}: already done")
            continue
        before, after = write_if_smaller(path, data)
        total_before += before
        total_after += after
        print(f"{name}: {before // 1024} KB -> {after // 1024} KB")
    if total_before:
        print(f"in all: {total_before // 1024} KB -> {total_after // 1024} KB")


if __name__ == "__main__":
    main()
