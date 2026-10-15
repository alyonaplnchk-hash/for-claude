"""Adds the circumflex to CHÂTEAU on the main-title layer.

The accent is drawn in the title's own style, measured from the letters of
the reference image: a rounded gold stroke with a 2 px dark outline and the
red drop shadow offset down-right. It sits centred over the first A.

Run once on public/figeac/title-main.png (it keeps a pristine copy next to it
as title-main.orig.png and always starts from that, so reruns are safe).
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent / "public" / "figeac"
SRC = ROOT / "title-main.orig.png"
DST = ROOT / "title-main.png"
if not SRC.exists():
    SRC.write_bytes(DST.read_bytes())

# measured on the reference (1920x1080 coordinates)
APEX_X = 1117.5        # centre of the A's apex
LETTER_TOP = 521       # top of the A's outline
GOLD_W = 10            # accent stroke (letter stems are ~13 px)
OUTLINE = 2
HALF_W = 19            # half span of the chevron centre-line
HEIGHT = 15            # chevron rise of the centre-line
GAP = 9                # clear space between accent and the A
SHADOW = (6, 5)
GOLD = np.array([209, 175, 110])
DARK = np.array([50, 36, 4])
RED = np.array([214, 30, 36])

SS = 4  # supersampling
W, H = 1920, 1080
base_y = LETTER_TOP - GAP - (GOLD_W / 2 + OUTLINE)
pts = [(APEX_X - HALF_W, base_y), (APEX_X, base_y - HEIGHT), (APEX_X + HALF_W, base_y)]


def chevron(width, dx=0, dy=0):
    im = Image.new("L", (W * SS, H * SS), 0)
    d = ImageDraw.Draw(im)
    p = [((x + dx) * SS, (y + dy) * SS) for x, y in pts]
    d.line(p, fill=255, width=int(width * SS), joint="curve")
    r = width * SS / 2
    for x, y in (p[0], p[-1]):
        d.ellipse([x - r, y - r, x + r, y + r], fill=255)
    return np.asarray(im.resize((W, H), Image.LANCZOS)).astype(np.float32) / 255


shadow = chevron(GOLD_W + 2 * OUTLINE, *SHADOW)
outline = chevron(GOLD_W + 2 * OUTLINE)
fill = chevron(GOLD_W)

# gold with the same soft mottling as the letters
rng = np.random.default_rng(3)
noise = np.asarray(
    Image.fromarray((rng.random((H // 4, W // 4)) * 255).astype(np.uint8))
    .resize((W, H), Image.BICUBIC)
    .filter(ImageFilter.GaussianBlur(2))
).astype(np.float32) / 255 - 0.5
gold = np.clip(GOLD[None, None] + noise[..., None] * 18, 0, 255)

layer = np.asarray(Image.open(SRC).convert("RGBA")).astype(np.float32)
rgb, a = layer[..., :3], layer[..., 3:] / 255


def over(rgb, a, colour, alpha):
    alpha = alpha[..., None]
    out_a = alpha + a * (1 - alpha)
    out = (colour * alpha + rgb * a * (1 - alpha)) / np.maximum(out_a, 1e-6)
    return out, out_a


rgb, a = over(rgb, a, RED[None, None], shadow * (1 - outline))
rgb, a = over(rgb, a, DARK[None, None], outline)
rgb, a = over(rgb, a, gold, fill)
out = np.dstack([rgb, a * 255]).clip(0, 255).astype(np.uint8)
out[out[..., 3] == 0] = 0
Image.fromarray(out, "RGBA").save(DST, optimize=True)
print("circumflex added ->", DST)
