"""Turns a guest logo into a transparent, trimmed PNG for the templates.

    python3 scripts/prepare-logo.py <input image> public/guests/<name>.png

- Already transparent: kept as is, only trimmed.
- On a white or near-white background: the background is removed. Solid
  areas keep their exact original colour; only anti-aliased edges fade.
- Small files (under 800 px wide) are upscaled, with a warning: ask the
  client for a larger PNG or an SVG export for best sharpness.
Prints the aspect (width / height) to put into src/episodes.ts.
"""

import sys

from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGBA")

if im.width < 800:
    factor = -(-1600 // im.width)
    print(f"warning: logo is only {im.width}px wide; upscaling x{factor}. "
          "A larger PNG or SVG from the estate will look sharper.")
    im = im.resize((im.width * factor, im.height * factor), Image.BICUBIC)

alpha_min = im.getchannel("A").getextrema()[0]
if alpha_min > 250:
    # Opaque image: key out the light background.
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, _ = px[x, y]
            dist = 255 - min(r, g, b)  # how far from white
            a = max(0.0, min(1.0, (dist - 40) / 110))
            if a == 0:
                px[x, y] = (r, g, b, 0)
            elif a < 1:
                # Un-mix the white the edge pixel was blended with.
                fix = lambda c: max(0, min(255, round(255 - (255 - c) / a)))
                px[x, y] = (fix(r), fix(g), fix(b), round(a * 255))
            else:
                px[x, y] = (r, g, b, 255)

im = im.crop(im.getchannel("A").getbbox())
im.save(dst)
print(f"saved {dst}: {im.width}x{im.height}, aspect {im.width} / {im.height}")
