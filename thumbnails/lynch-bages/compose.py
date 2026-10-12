import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

S = Path(sys.argv[1])
OUT = S / "scratchpad" / "out"
OUT.mkdir(exist_ok=True)
F = S / "scratchpad" / "fonts"
W, H = 2560, 1440  # rendered at 2x of 1280x720
GOLD = (138, 119, 73)
DARK = (52, 48, 44)


def font(name, size, wght=None):
    f = ImageFont.truetype(str(F / name), size)
    if wght:
        try:
            f.set_variation_by_axes([wght])
        except Exception:
            pass
    return f


def knock_out_white(im, thresh=235):
    im = im.convert("RGBA")
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            lum = (r + g + b) / 3
            if lum >= thresh:
                px[x, y] = (r, g, b, 0)
            elif lum > 180:
                px[x, y] = (r, g, b, int(a * (thresh - lum) / (thresh - 180)))
    return im


def recolor(im, rgb):
    a = im.split()[3]
    solid = Image.new("RGBA", im.size, rgb + (255,))
    solid.putalpha(a)
    return solid


# ---- background: blurred cream wine shop from the intro video ----
bg = Image.open(S / "scratchpad" / "bg_full.png").convert("RGB")
bw = bg.width
crop_h = int(bw * 9 / 16)
top = 360
bg = bg.crop((0, top, bw, top + crop_h)).resize((W, H), Image.LANCZOS)
bg = bg.filter(ImageFilter.GaussianBlur(18))
cream = Image.new("RGB", (W, H), (240, 233, 222))
bg = Image.blend(bg, cream, 0.55)

# ---- producer photo on the right, fading into the cream ----
photo = Image.open(S / "images" / "3.jpg").convert("RGB")
scale = H / photo.height
photo = photo.resize((int(photo.width * scale), H), Image.LANCZOS)
photo = photo.filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=2))
photo = ImageEnhance.Color(photo).enhance(0.92)
pw = 1500
# keep the person (around 64% across the source) in the right panel
cx = int(photo.width * 0.64)
left = min(max(cx - int(pw * 0.55), 0), photo.width - pw)
photo = photo.crop((left, 0, left + pw, H))
mask = Image.new("L", (pw, H), 255)
md = ImageDraw.Draw(mask)
fade = 520
for x in range(fade):
    t = x / fade
    md.line([(x, 0), (x, H)], fill=int(255 * (t * t * (3 - 2 * t))))
bg_photo = bg.copy()
bg_photo.paste(photo, (W - pw, 0), mask)
bg_photo.save(OUT / "layer_background.png")

# ---- logos ----
avu = Image.open(S / "images" / "1.webp").convert("RGBA")
avu = avu.crop(avu.getbbox())
avu_w = 300
avu = avu.resize((avu_w, int(avu.height * avu_w / avu.width)), Image.LANCZOS)
avu.save(OUT / "layer_avu_logo.png")

lb = knock_out_white(Image.open(S / "images" / "2.png"))
lb = lb.crop(lb.getbbox())
lb = recolor(lb, DARK)
lb_w = 560
lb = lb.resize((lb_w, int(lb.height * lb_w / lb.width)), Image.LANCZOS)
lb.save(OUT / "layer_lynch_bages_logo.png")

# ---- title block: PRODUCER / Spotlight / rule / in conversation with ----
tw, th = 1300, 640
title = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
d = ImageDraw.Draw(title)
cx = tw // 2

def spaced(draw, y, text, f, fill, tracking):
    widths = [draw.textlength(ch, font=f) for ch in text]
    total = sum(widths) + tracking * (len(text) - 1)
    x = cx - total / 2
    for ch, w in zip(text, widths):
        draw.text((x, y), ch, font=f, fill=fill)
        x += w + tracking

prod = font("Cinzel%5Bwght%5D.ttf", 92, 600)
spaced(d, 20, "PRODUCER", prod, DARK, 34)
script = font("PinyonScript-Regular.ttf", 300)
d.text((cx, 330), "Spotlight", font=script, fill=GOLD, anchor="mm")
d.line([(cx - 170, 500), (cx + 170, 500)], fill=GOLD + (200,), width=3)
conv = font("CormorantGaramond%5Bwght%5D.ttf", 64, 500)
# Cormorant has no italic axis in this file; shear for an italic feel
tmp = Image.new("RGBA", (tw, 120), (0, 0, 0, 0))
ImageDraw.Draw(tmp).text((cx, 60), "in conversation with", font=conv, fill=DARK, anchor="mm")
tmp = tmp.transform(tmp.size, Image.AFFINE, (1, 0.2, -12, 0, 1, 0), Image.BICUBIC)
title.alpha_composite(tmp, (0, 520))
title = title.crop(title.getbbox())
title.save(OUT / "layer_title.png")

# ---- full preview composite (mirrors the Canva placement below) ----
layout = {}
col_cx = 600  # centre of the left text column at 2x
comp = bg_photo.convert("RGBA")
y = 120
for name, im, gap in [("avu", avu, 70), ("title", title, 60), ("lb", lb, 0)]:
    x = col_cx - im.width // 2
    comp.alpha_composite(im, (x, y))
    layout[name] = (x, y, im.width, im.height)
    y += im.height + gap
print("bottom", y, "layout@1x", {k: tuple(v // 2 for v in val) for k, val in layout.items()})
comp.convert("RGB").save(OUT / "preview.png")
comp.convert("RGB").resize((1280, 720), Image.LANCZOS).save(OUT / "thumbnail_1280x720.jpg", quality=95)
