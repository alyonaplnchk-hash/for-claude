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


def polar(cx, cy, theta_deg, d, side):
    """Point at distance d from (cx, cy); theta from 'towards camera' (down), side -1 = camera-left."""
    t = math.radians(theta_deg)
    return cx + side * d * math.sin(t), cy + d * math.cos(t)


# ---------------------------------------------------------------- plan icons (drawn facing up)

def beam(length, w0, w1, color, opacity, start=6):
    gid = uid("bm")
    return (
        f'<defs><linearGradient id="{gid}" gradientUnits="userSpaceOnUse" x1="0" y1="{-start}" x2="0" y2="{-length:.1f}">'
        f'<stop offset="0" stop-color="{color}" stop-opacity="{opacity}"/><stop offset="1" stop-color="{color}" stop-opacity="0"/></linearGradient></defs>'
        f'<polygon points="{-w0/2},{-start} {w0/2},{-start} {w1/2},{-length:.1f} {-w1/2},{-length:.1f}" fill="url(#{gid})"/>'
    )


def panel(x, y, tx, ty, color, opacity):
    a, L = ang(x, y, tx, ty), dist(x, y, tx, ty) + 6
    return (
        f'<g transform="translate({x:.1f},{y:.1f}) rotate({a:.1f})">' + beam(L, 46, 80, color, opacity)
        + f'<rect x="-24" y="-6" width="48" height="11" rx="2" fill="#fff" stroke="{color}" stroke-width="1.4"/>'
        f'<line x1="-22" y1="-6" x2="22" y2="-6" stroke="{color}" stroke-width="3.2" stroke-linecap="round"/></g>'
    )


def m20c(x, y, tx, ty):
    a, L = ang(x, y, tx, ty), dist(x, y, tx, ty) + 8
    return (
        f'<g transform="translate({x:.1f},{y:.1f}) rotate({a:.1f})">' + beam(L, 14, 44, RIM_C, 0.6, start=5)
        + f'<rect x="-8" y="-5" width="16" height="11" rx="2" fill="#fff" stroke="{RIM_C}" stroke-width="1.4"/>'
        f'<path d="M-8,-5 L-14,-13 M8,-5 L14,-13" stroke="{RIM_C}" stroke-width="1.8" stroke-linecap="round"/></g>'
    )


def camera(x, y, tx, ty):
    a = ang(x, y, tx, ty)
    return (
        f'<g transform="translate({x:.1f},{y:.1f}) rotate({a:.1f})">'
        f'<rect x="-8" y="-15" width="16" height="12" rx="1.5" fill="#fff" stroke="{INK}" stroke-width="1.4"/>'
        f'<rect x="-16" y="-4" width="32" height="22" rx="3" fill="#fff" stroke="{INK}" stroke-width="1.6"/></g>'
    )


def person(x, y, tx, ty, guest=True, seated=True):
    a = ang(x, y, tx, ty)
    fill, stroke = (GOLD, GOLD_DK) if guest else ("#fff", INK)
    out = [f'<g transform="translate({x:.1f},{y:.1f}) rotate({a:.1f})">']
    if seated:
        out.append(f'<rect x="-24" y="-24" width="48" height="46" rx="9" fill="{LEATHER if guest else "#EFEBE3"}" fill-opacity="{.85 if guest else 1}"/>'
                   f'<rect x="-24" y="16" width="48" height="8" rx="4" fill="{LEATHER if guest else "#E2DCCF"}"/>')
    out.append(
        f'<ellipse cx="0" cy="2" rx="25" ry="10.5" fill="{fill}" stroke="{stroke}" stroke-width="1.3"/>'
        f'<circle cx="0" cy="0" r="10.5" fill="{fill if guest else "#fff"}" stroke="{stroke}" stroke-width="1.3"/>'
        f'<path d="M-3.5,-10 L0,-16 L3.5,-10 Z" fill="{stroke}"/></g>'
    )
    return "".join(out)


HALO = 'paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round"'


def label(x, y, title, sub, anchor, color):
    t = f'<text x="{x:.1f}" y="{y:.1f}" text-anchor="{anchor}" font-family="Roboto" font-size="13" font-weight="700" letter-spacing="1.4" fill="{color}" {HALO}>{title}</text>'
    if sub:
        t += f'<text x="{x:.1f}" y="{y + 17:.1f}" text-anchor="{anchor}" font-family="Roboto" font-size="13" fill="{INK}" fill-opacity=".8" {HALO}>{sub}</text>'
    return t


def plan(seated=True):
    """Top view of the office set: wine wall at the top, camera at the bottom."""
    W, H, S = 600, 420, 80
    wall = 46
    G = (300, wall + 1.75 * S)
    A = (300, G[1] + 1.7 * S)
    I = (300 - 0.72 * S, A[1] + 4)
    K = polar(*G, 52, 1.1 * S, -1)
    F = polar(*G, 62, 1.6 * S, +1)
    R = polar(*G, 145, 0.95 * S, +1)
    s = [f'<svg viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg">']
    # wine wall: rails with bottles seen from above
    s.append(f'<rect x="20" y="14" width="560" height="{wall-14}" rx="4" fill="#F1EEE7"/>')
    for i, x in enumerate(range(52, 560, 64)):
        s.append(f'<line x1="{x}" y1="18" x2="{x}" y2="{wall-4}" stroke="#B39B6A" stroke-width="2"/>')
        s.append(f'<rect x="{x-24 + (i % 2) * 6}" y="{24 + (i % 3) * 3}" width="{40 + (i % 3) * 8}" height="9" rx="4.5" fill="#2B2A2E"/>')
    s.append(f'<text x="300" y="{wall + 20}" text-anchor="middle" font-family="Roboto" font-size="12" letter-spacing="2" fill="{GOLD_DK}">WINE WALL</text>')
    # distance from the wall
    dx = G[0] - 70
    s.append(f'<line x1="{dx}" y1="{wall+4}" x2="{dx}" y2="{G[1]}" stroke="{GOLD_DK}" stroke-dasharray="2 3"/>'
             f'<line x1="{dx}" y1="{G[1]}" x2="{G[0]-28}" y2="{G[1]}" stroke="{GOLD_DK}" stroke-dasharray="2 3"/>')
    s.append(f'<rect x="{dx-32}" y="{(wall+G[1])/2 - 8}" width="64" height="20" rx="10" fill="#fff" stroke="{GOLD}"/>'
             f'<text x="{dx}" y="{(wall+G[1])/2 + 6}" text-anchor="middle" font-family="Roboto" font-size="12" font-weight="500" fill="{INK}">1.5–2 m</text>')
    s.append(panel(*K, *G, KEY_C, 0.5))
    s.append(panel(*F, *G, FILL_C, 0.3))
    s.append(m20c(*R, *G))
    if not seated:
        s.append(f'<g stroke="{GOLD_DK}" stroke-width="3"><line x1="{G[0]-16}" y1="{G[1]+28}" x2="{G[0]+16}" y2="{G[1]+28}"/><line x1="{G[0]}" y1="{G[1]+28}" x2="{G[0]}" y2="{G[1]+42}"/></g>')
    s.append(camera(*A, *G))
    s.append(person(*I, *G, guest=False, seated=seated))
    s.append(person(*G, *I, guest=True, seated=seated))
    s.append(label(K[0] - 34, K[1] + 6, "KEY", "Raleno · 45°, above the eyes", "end", KEY_T))
    s.append(label(F[0] + 34, F[1] - 2, "FILL", "Raleno · low", "start", FILL_T))
    s.append(label(R[0] + 26, R[1] - 6, "HIGHLIGHT", "M20C · behind, on hair", "start", RIM_T))
    s.append(label(G[0] + 34, G[1] - 2, "GUEST", "", "start", GOLD_DK))
    s.append(label(A[0] + 28, A[1] + 6, "CAMERA", "lens at eye level", "start", INK))
    s.append(label(I[0] - 34, I[1] + 4, "INTERVIEWER", "next to the lens", "end", INK))
    s.append("</svg>")
    return "".join(s)


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


FOCUS = {"ref-seated": "50% 30%"}


def photo(name, cls=""):
    return f'<div class="ph {cls}"><img src="{img("refs/" + name + ".jpg")}" style="object-position:{FOCUS.get(name, "50% 50%")}" alt=""></div>'


# ---------------------------------------------------------------- slides

def chrome(n):
    return f'<div class="brand">{logo_svg(7)}<span>Producer Spotlight</span></div><div class="pno">{n:02d}</div>'


def slide_cover():
    return f"""
<section class="slide cover">
  <div class="c-text">
    {logo_svg(17)}
    <p class="eyebrow">Producer Spotlight</p>
    <h1>How to film<br>the interview</h1>
    <ol class="toc"><li><span>01</span>Light</li><li><span>02</span>Extra shots</li><li><span>03</span>Portrait</li></ol>
  </div>
  <div class="c-img"><img src="{img('portrait-reference.jpg')}" alt=""></div>
</section>"""


def slide_light(seated, ref, n):
    title = "Seated" if seated else "Standing"
    rows = [
        (KEY_C, "Key", "Raleno S192K", "45° to the side, above the eyes"),
        (FILL_C, "Fill", "Raleno S192K", "other side, low power"),
        (RIM_C, "Highlight", "Zhiyun M20C", "behind the guest, on hair and shoulders"),
    ]
    lights = "".join(f'<div class="lrow"><i style="background:{c}"></i><div><h3>{t} <em>{m}</em></h3><p>{d}</p></div></div>' for c, t, m, d in rows)
    return f"""
<section class="slide">
  {chrome(n)}
  <p class="eyebrow">01 · Light</p>
  <h2>{title}</h2>
  <div class="split">
    <div class="fig plan">{plan(seated)}</div>
    <div class="side">
      {photo(ref, "ref")}
      <div class="lights">{lights}</div>
      <p class="fmt">4K 16:9 for YouTube · guest in the centre for the 9:16 Instagram crop</p>
    </div>
  </div>
  {credit(ref)}
</section>"""


def slide_shots(shots):
    cards = "".join(f'<figure>{photo(k)}<figcaption>{t}</figcaption></figure>' for k, t in shots)
    return f"""
<section class="slide">
  {chrome(4)}
  <p class="eyebrow">02 · Extra shots</p>
  <h2>Before and after the interview</h2>
  <div class="grid">{cards}</div>
  {credit(*[k for k, _ in shots])}
</section>"""


def slide_portrait():
    return f"""
<section class="slide">
  {chrome(5)}
  <div class="portrait">
    <div class="p-img"><img src="{img('portrait-reference.jpg')}" alt=""></div>
    <div class="p-text">
      <p class="eyebrow">03 · Portrait</p>
      <h2>One photo<br>for the cover</h2>
      <p class="lead">A high-quality photo of the guest, like this sample.</p>
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

/* cover */
.cover { display: grid; grid-template-columns: 1fr 92mm; gap: 14mm; padding: 0 0 0 22mm; }
.c-text { align-self: center; }
.cover .eyebrow { margin-top: 14mm; }
.cover h1 { font-size: 50pt; margin: 2mm 0 12mm; }
.toc { list-style: none; display: flex; gap: 9mm; border-top: 1px solid var(--line); padding-top: 5mm; }
.toc li { font-family: 'Playfair Display', serif; font-size: 13pt; }
.toc span { display: block; font-family: 'Roboto', sans-serif; font-size: 8pt; letter-spacing: .2em; color: var(--gold-dk); margin-bottom: 1mm; }
.c-img img { display: block; height: 190.5mm; width: 100%%; object-fit: cover; }

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

/* portrait */
.portrait { display: grid; grid-template-columns: 96mm 1fr; gap: 16mm; height: 100%%; margin: -15mm 0 -12mm -18mm; }
.p-img img { display: block; height: 190.5mm; width: 100%%; object-fit: cover; }
.p-text { align-self: center; padding-right: 18mm; }
.p-text h2 { margin-bottom: 9mm; }
.lead { font-size: 13pt; color: var(--muted); line-height: 1.5; }
.fmt { margin-top: 4mm; font-size: 8.5pt; letter-spacing: .1em; text-transform: uppercase; color: var(--gold-dk); }
.spec { margin-top: 9mm; font-size: 9pt; letter-spacing: .12em; text-transform: uppercase; color: var(--gold-dk); border-top: 1px solid var(--line); padding-top: 4mm; }
"""

FONTS = '<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">'


def build():
    css = CSS % dict(GOLD=GOLD, GOLD_DK=GOLD_DK, INK=INK)
    slides = [slide_cover(), slide_light(True, "ref-seated", 2), slide_light(False, "ref-standing", 3), slide_shots(SHOTS), slide_portrait()]
    html = f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Producer Spotlight · How to film</title>{FONTS}<style>{css}</style></head>
<body>{''.join(slides)}</body></html>"""
    (HERE / "filming-memo.html").write_text(html)
    print("wrote", HERE / "filming-memo.html")


if __name__ == "__main__":
    build()
