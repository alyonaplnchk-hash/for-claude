"""Soft cloudy backdrop texture for the Reels cut (multiplied over the 3D frames).

White = no change, light grey = soft shade. Multi-octave value noise, heavily blurred, so the pale
studio backdrop gets the gentle "clouded marble" texture of luxury product films.
Output: public/textures/clouds.png (1300 x 2200, grayscale).
"""
import os
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
W, H = 1300, 2200
rng = np.random.default_rng(7)


def octave(scale):
    g = rng.random((H // scale + 2, W // scale + 2))
    im = Image.fromarray((g * 255).astype(np.uint8)).resize((W + 2 * scale, H + 2 * scale), Image.BICUBIC)
    return np.asarray(im, dtype=np.float64)[scale:scale + H, scale:scale + W] / 255


n = octave(420) * 0.55 + octave(210) * 0.28 + octave(105) * 0.12 + octave(52) * 0.05
n = (n - n.min()) / (n.max() - n.min())
# billowy: emphasise the bright puffs, keep the shade soft
n = np.clip((n - 0.25) / 0.6, 0, 1) ** 1.4
shade = 1.0 - 0.085 * (1 - n)
img = Image.fromarray((shade * 255).astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(28))
out = os.path.join(ROOT, "public/textures/clouds.png")
img.save(out, optimize=True)
a = np.asarray(img)
print(out, a.min(), a.max(), round(a.mean(), 1))
