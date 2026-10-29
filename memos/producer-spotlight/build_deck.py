"""AVU Producer Spotlight: how to film. A short 16:9 deck rendered to PDF by render.cjs.

Run:  python3 build_deck.py && node render.cjs
Reference photos live in refs/ with their credits in refs/credits.json.
"""
import base64
import json
import math
import re
from pathlib import Path

HERE = Path(__file__).parent

# AVU palette (from avu.wine)
GOLD = "#89764B"
GOLD_DK = "#7A6940"
INK = "#1A1A1A"
CREAM = "#FAFAF2"
KEY_C, KEY_T = "#D4AE57", "#8C6A1F"
FILL_C, FILL_T = "#A39E90", "#5E5A50"
RIM_C, RIM_T = "#E28A35", "#B05E17"
LEATHER = "#6B4A3A"

_uid = [0]


def uid(prefix):
    _uid[0] += 1
    return f"{prefix}{_uid[0]}"


def ang(x, y, tx, ty):
    """Rotation (deg, clockwise) that turns a local 'facing up' icon toward (tx, ty)."""
    return math.degrees(math.atan2(tx - x, -(ty - y)))


def dist(x, y, tx, ty):
    return math.hypot(tx - x, ty - y)


# ---------------------------------------------------------------- plan icons (drawn facing up)

# ---------------------------------------------------------------- assets

def logo_svg(height_mm):
    raw = (HERE / "avu-logo.svg").read_text()
    raw = re.sub(r"<\?xml.*?\?>|<!--.*?-->|<style.*?</style>", "", raw, flags=re.S)
    raw = re.sub(r'id="[^"]*"', "", raw.replace('class="st0"', f'fill="{GOLD}"'))
    return raw.replace("<svg ", f'<svg style="height:{height_mm}mm;width:auto" ', 1)


def img(name):
    path = HERE / name
    return "data:image/jpeg;base64," + base64.b64encode(path.read_bytes()).decode()


CREDITS = json.loads((HERE / "refs" / "credits.json").read_text()) if (HERE / "refs" / "credits.json").exists() else {}


def credit(*names):
    parts = [CREDITS[n] for n in names if n in CREDITS]
    return f'<p class="credit">Reference photos: {" · ".join(parts)}</p>' if parts else ""


FOCUS = {}


def photo(name, cls=""):
    return f'<div class="ph {cls}"><img src="{img("refs/" + name + ".jpg")}" style="object-position:{FOCUS.get(name, "50% 50%")}" alt=""></div>'


# ---------------------------------------------------------------- slides

def chrome(n):
    return f'<div class="brand">{logo_svg(7)}<span>Producer Spotlight</span></div><div class="pno">{n:02d}</div>'


def lamp(n, x, y, tx, ty, color, w=70):
    """LED panel drawn on the photo at (x, y), glowing towards (tx, ty), with a number badge."""
    a = ang(x, y, tx, ty)
    L = dist(x, y, tx, ty)
    gid = uid("lb")
    return (
        f'<g transform="translate({x:.0f},{y:.0f}) rotate({a:.1f})">'
        f'<defs><linearGradient id="{gid}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="{-L:.0f}">'
        f'<stop offset="0" stop-color="{color}" stop-opacity=".75"/><stop offset="1" stop-color="{color}" stop-opacity="0"/></linearGradient></defs>'
        f'<polygon points="{-w/2},-8 {w/2},-8 {w*1.6:.0f},{-L:.0f} {-w*1.6:.0f},{-L:.0f}" fill="url(#{gid})"/>'
        f'<line x1="0" y1="-14" x2="0" y2="{-L+40:.0f}" stroke="#fff" stroke-width="4" stroke-dasharray="14 10" opacity=".9"/>'
        f'<rect x="{-w/2}" y="-10" width="{w}" height="22" rx="5" fill="#fff" stroke="{color}" stroke-width="5"/></g>'
        f'<circle cx="{x:.0f}" cy="{y:.0f}" r="26" fill="{GOLD}" stroke="#fff" stroke-width="5"/>'
        f'<text x="{x:.0f}" y="{y+11:.0f}" text-anchor="middle" font-family="Roboto" font-size="32" font-weight="700" fill="#fff">{n}</text>'
    )


def light_photo():
    """The office photo with the three LED lights drawn on it (image pixel coordinates)."""
    W, H = 958, 1420
    face_l, face_r = (264, 350), (664, 420)
    return (
        f'<svg viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">'
        f'<image href="{img("office-setup.jpg")}" width="{W}" height="{H}"/>'
        + lamp(1, 828, 215, *face_l, KEY_C, 90)
        + lamp(2, 128, 205, *face_r, RIM_C, 44)
        + lamp(3, 479, 1340, 479, 420, FILL_C, 110)
        + "</svg>"
    )


def slide_light():
    rows = [
        (1, "Raleno S192K", "behind the host's shoulder, lights the guest's face"),
        (2, "Zhiyun M20C", "behind the guest's shoulder, lights the host's face"),
        (3, "Raleno S192K", "above the camera, low power, soft light for both"),
    ]
    legend = "".join(f'<div class="lrow"><span class="badge">{n}</span><div><h3>{m}</h3><p>{d}</p></div></div>' for n, m, d in rows)
    return f"""
<section class="slide">
  {chrome(1)}
  <div class="photo-left">
    <div class="shot">{light_photo()}</div>
    <div class="p-text">
      <p class="eyebrow">01</p>
      <h2>Light scheme</h2>
      <div class="lights">{legend}</div>
      <p class="note">Lights 1 and 2 stand just outside the frame.</p>
    </div>
  </div>
</section>"""


def slide_shots(shots):
    cards = "".join(f'<figure>{photo(k)}<figcaption>{t}</figcaption></figure>' for k, t in shots)
    return f"""
<section class="slide">
  {chrome(2)}
  <p class="eyebrow">02</p>
  <h2>B-roll examples</h2>
  <div class="grid">{cards}</div>
  {credit(*[k for k, _ in shots])}
</section>"""


def slide_photo():
    checks = ["Wipe the camera lens", "Turn on stabilisation (no shake)", "Shoot in 4K or portrait mode"]
    items = "".join(f"<li>{c}</li>" for c in checks)
    return f"""
<section class="slide">
  {chrome(3)}
  <div class="photo-left">
    <div class="shot"><img src="{img('portrait-reference.jpg')}" alt="Example"><span class="tag">Example</span></div>
    <div class="p-text">
      <p class="eyebrow">03</p>
      <h2>We need a photo<br>of the guest</h2>
      <p class="lead">This is only an example: any pose works.</p>
      <ul class="checks">{items}</ul>
    </div>
  </div>
</section>"""


SHOTS = [
    ("arrival", "Walks in"),
    ("greeting", "Greets"),
    ("talking", "Talking"),
]

CSS = """
@page { size: 338.67mm 190.5mm; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
:root { --gold: %(GOLD)s; --gold-dk: %(GOLD_DK)s; --ink: %(INK)s; --muted: rgba(26,26,26,.66); --line: rgba(137,118,75,.35); }
html, body { background: #fff; }
body { font-family: 'Roboto', Arial, sans-serif; color: var(--ink); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.slide { width: 338.67mm; height: 190.5mm; padding: 15mm 18mm 12mm; position: relative; overflow: hidden; background: #fff; page-break-after: always; }
.slide:last-child { page-break-after: auto; }
.brand { position: absolute; top: 9mm; right: 18mm; display: flex; align-items: center; gap: 2.5mm; font-size: 7.5pt; letter-spacing: .24em; text-transform: uppercase; color: var(--gold-dk); }
.pno { position: absolute; bottom: 8mm; right: 18mm; font-family: 'Playfair Display', serif; font-size: 11pt; color: var(--gold-dk); }
.eyebrow { font-size: 8.5pt; letter-spacing: .28em; text-transform: uppercase; color: var(--gold-dk); font-weight: 700; margin-bottom: 2mm; }
h1, h2 { font-family: 'Playfair Display', Georgia, serif; font-weight: 600; letter-spacing: -.01em; line-height: 1.02; }
h2 { font-size: 30pt; margin-bottom: 7mm; }
h3 { font-family: 'Playfair Display', serif; font-weight: 600; font-size: 14pt; }
.credit { position: absolute; left: 18mm; bottom: 7.5mm; right: 40mm; font-size: 6pt; color: rgba(26,26,26,.45); }
.cap { font-size: 9pt; color: var(--muted); margin-top: 3mm; }

/* layouts */
.split { display: grid; grid-template-columns: 1.1fr 1fr; gap: 12mm; align-items: start; }
.split.wide-left { grid-template-columns: 1.55fr 1fr; align-items: center; }
.fig svg { display: block; width: 100%%; height: auto; }
.plan { margin-top: -4mm; }
.ph { border-radius: 3mm; overflow: hidden; background: #F1EEE7; }
.ph img { display: block; width: 100%%; height: 100%%; object-fit: cover; }
.ph.ref { height: 62mm; margin-bottom: 6mm; }
.lrow { display: flex; gap: 4mm; align-items: flex-start; padding: 2.6mm 0; border-top: 1px solid var(--line); }
.lrow i { flex: none; width: 4mm; height: 4mm; border-radius: 50%%; margin-top: 1.4mm; }
.lrow h3 { font-size: 12.5pt; }
.lrow h3 em { font-style: normal; font-family: 'Roboto', sans-serif; font-size: 8.5pt; letter-spacing: .14em; text-transform: uppercase; color: var(--gold-dk); margin-left: 2mm; }
.lrow p { font-size: 10pt; color: var(--muted); margin-top: .6mm; }
.tips { display: flex; flex-direction: column; gap: 7mm; }
.tip { display: flex; gap: 5mm; }
.tip .n { flex: none; font-family: 'Playfair Display', serif; font-size: 26pt; line-height: .9; color: var(--gold); width: 9mm; }
.tip p { font-size: 10.5pt; color: var(--muted); margin-top: 1mm; line-height: 1.4; }

/* extra shots */
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5mm 6mm; }
.grid figure .ph { height: 92mm; }
.grid figcaption { font-family: 'Playfair Display', serif; font-size: 16pt; margin-top: 3mm; }

/* photo pages */
.photo-left { display: grid; grid-template-columns: 112mm 1fr; gap: 16mm; height: 100%%; margin: -15mm 0 -12mm -18mm; }
.photo-left .shot { position: relative; height: 190.5mm; overflow: hidden; }
.photo-left .shot svg, .photo-left .shot img { display: block; width: 100%%; height: 100%%; object-fit: cover; }
.badge { flex: none; width: 8mm; height: 8mm; border-radius: 50%%; background: var(--gold); color: #fff; font-weight: 700; font-size: 12pt; display: flex; align-items: center; justify-content: center; }
.lights .lrow { gap: 5mm; padding: 4mm 0; }
.lights h3 { font-size: 15pt; }
.lights p { font-size: 11.5pt; }
.tag { position: absolute; left: 6mm; top: 6mm; background: #fff; color: var(--gold-dk); font-size: 9pt; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; padding: 1.5mm 3.5mm; border-radius: 4mm; }
.checks { list-style: none; margin-top: 10mm; border-top: 1px solid var(--line); }
.checks li { font-size: 14pt; padding: 4mm 0 4mm 10mm; border-bottom: 1px solid var(--line); position: relative; }
.checks li::before { content: ""; position: absolute; left: 0; top: 5mm; width: 4.5mm; height: 4.5mm; border: 1.5px solid var(--gold); border-radius: 1mm; }

/* portrait */
.portrait { display: grid; grid-template-columns: 96mm 1fr; gap: 16mm; height: 100%%; margin: -15mm 0 -12mm -18mm; }
.p-img img { display: block; height: 190.5mm; width: 100%%; object-fit: cover; }
.p-text { align-self: center; padding-right: 18mm; }
.p-text h2 { margin-bottom: 9mm; }
.lead { font-size: 13pt; color: var(--muted); line-height: 1.5; }
.note { margin-top: 3mm; font-size: 10pt; color: var(--muted); }
.fmt { margin-top: 4mm; font-size: 8.5pt; letter-spacing: .1em; text-transform: uppercase; color: var(--gold-dk); }
.spec { margin-top: 9mm; font-size: 9pt; letter-spacing: .12em; text-transform: uppercase; color: var(--gold-dk); border-top: 1px solid var(--line); padding-top: 4mm; }
"""

FONTS = '<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">'


def build():
    css = CSS % dict(GOLD=GOLD, GOLD_DK=GOLD_DK, INK=INK)
    slides = [slide_light(), slide_shots(SHOTS), slide_photo()]
    html = f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Producer Spotlight · How to film</title>{FONTS}<style>{css}</style></head>
<body>{''.join(slides)}</body></html>"""
    (HERE / "filming-memo.html").write_text(html)
    print("wrote", HERE / "filming-memo.html")


if __name__ == "__main__":
    build()
