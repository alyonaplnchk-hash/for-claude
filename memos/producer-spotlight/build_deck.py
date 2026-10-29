"""AVU Producer Spotlight: how to film. A short 16:9 deck rendered to PDF by render.cjs.

Run:  python3 build_deck.py && node render.cjs
"""
import base64
import json
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


# ---------------------------------------------------------------- slides

def chrome(n):
    return f'<div class="brand">{logo_svg(7)}<span>Producer Spotlight</span></div><div class="pno">{n:02d}</div>'


def badge(n, x, y, r=24):
    return (f'<circle cx="{x}" cy="{y}" r="{r}" fill="{GOLD}" stroke="#fff" stroke-width="4"/>'
            f'<text x="{x}" y="{y + r * 0.4:.0f}" text-anchor="middle" font-family="Roboto" font-size="{r * 1.2:.0f}" font-weight="700" fill="#fff">{n}</text>')


def pill(x, y, text, w):
    return (f'<rect x="{x}" y="{y - 20}" width="{w}" height="32" rx="16" fill="#fff" fill-opacity=".94" stroke="{GOLD}" stroke-width="2"/>'
            f'<text x="{x + w / 2}" y="{y + 2}" text-anchor="middle" font-family="Roboto" font-size="19" font-weight="700" fill="{INK}">{text}</text>')


def scheme():
    """The team's lighting scheme with our corrections drawn on top (image pixel coordinates)."""
    s = [f'<svg viewBox="0 0 1536 1024" xmlns="http://www.w3.org/2000/svg"><image href="{img("light-scheme.jpg")}" width="1536" height="1024"/>']
    # 1: about 1 m from each face, just outside the frame
    s.append(pill(170, 300, "≈1 m from the face", 210) + badge(1, 150, 296))
    s.append(pill(1160, 300, "≈1 m from the face", 210) + badge(1, 1140, 296))
    # 2: side view, panel higher and tilted down
    s.append(f'<g opacity=".95"><rect x="945" y="610" width="34" height="80" rx="5" transform="rotate(-18 962 650)" fill="none" stroke="{GOLD}" stroke-width="5" stroke-dasharray="10 7"/>'
             f'<line x1="985" y1="655" x2="1285" y2="722" stroke="{GOLD}" stroke-width="5" stroke-dasharray="14 9"/>'
             f'<path d="M920,700 L920,630" stroke="{GOLD}" stroke-width="6"/><path d="M920,612 l-13,24 l26,0 z" fill="{GOLD}"/></g>')
    s.append(pill(1010, 628, "a bit higher + slight tilt", 250) + badge(2, 1000, 624))
    s.append("</svg>")
    return "".join(s)


def slide_settings():
    camera = ["4K · vertical 9:16", "25 fps", "On a tripod: stabilisation off"]
    phone = ["Video 4K · vertical 9:16", "Stabilisation on (no shake)", "Long press on the face to lock focus and exposure", "Airplane mode, enough battery and storage", "Photos: portrait mode"]
    col = lambda title, items: f'<div class="col"><h3>{title}</h3><ul class="checks">' + "".join(f"<li>{i}</li>" for i in items) + "</ul></div>"
    return f"""
<section class="slide">
  {chrome(1)}
  <p class="eyebrow">01</p>
  <h2>Camera and phone settings</h2>
  <p class="first">Before you start: <b>wipe the lens</b> on the camera and on the phone.</p>
  <div class="cols">{col("Camera", camera)}{col("Phone", phone)}</div>
</section>"""


def slide_light():
    notes = [
        (1, "About 1 m from each face, just outside the frame."),
        (2, "10–20 cm above the eyes, slight tilt down."),
    ]
    rows = "".join(f'<div class="nrow">{f"<span class=badge>{n}</span>" if n else "<span class=dot></span>"}<p>{t}</p></div>' for n, t in notes)
    return f"""
<section class="slide">
  {chrome(2)}
  <p class="eyebrow">02</p>
  <h2>Light scheme</h2>
  <div class="scheme">
    <div class="img">{scheme()}</div>
    <div class="notes"><p class="lead">So the picture is not too dark, use the LED panels. Place them like this.</p>{rows}</div>
  </div>
</section>"""


def slide_broll():
    shots = [("arrival", "The guest walks in"), ("greeting", "Greets the host"), ("talking", "The two talking")]
    cards = "".join(f'<figure><div class="ph"><img src="{img("refs/" + k + ".jpg")}" alt=""></div><figcaption>{t}</figcaption></figure>' for k, t in shots)
    credits = json.loads((HERE / "refs" / "credits.json").read_text())
    return f"""
<section class="slide">
  {chrome(3)}
  <p class="eyebrow">03</p>
  <h2>B-roll</h2>
  <p class="first">Before and after the interview, film a few short shots. Hold each one about 10 seconds. Examples:</p>
  <div class="grid">{cards}</div>
  <p class="credit">Example photos: {" · ".join(credits[k] for k, _ in shots)}</p>
</section>"""


def slide_photo():
    items = ["A few portraits of the guest", "Different poses: arms crossed, hands in pockets, smiling, serious", "Close-up and from head to waist", "Vertical, portrait mode", "In front of the wine wall"]
    return f"""
<section class="slide">
  {chrome(4)}
  <div class="photo-left">
    <div class="shot"><img src="{img('portrait-reference.jpg')}" alt="Example"><span class="tag">Example</span></div>
    <div class="p-text">
      <p class="eyebrow">04</p>
      <h2>Photos of the guest</h2>
      <p class="lead">This is only an example: any pose works.</p>
      <ul class="checks">{"".join(f"<li>{i}</li>" for i in items)}</ul>
    </div>
  </div>
</section>"""


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
.grid figure .ph { height: 84mm; }
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
.checks { list-style: none; margin-top: 8mm; border-top: 1px solid var(--line); }
.checks li { font-size: 13pt; padding: 3.4mm 0 3.4mm 10mm; border-bottom: 1px solid var(--line); position: relative; }
.checks li::before { content: ""; position: absolute; left: 0; top: 4.4mm; width: 4.5mm; height: 4.5mm; border: 1.5px solid var(--gold); border-radius: 1mm; }

/* settings */
.first { font-size: 14pt; margin-bottom: 8mm; }
.first b { color: var(--gold-dk); }
.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 16mm; }
.cols h3 { font-size: 18pt; }
.cols .checks { margin-top: 4mm; }
.cols .checks li { font-size: 13pt; }

/* light */
.scheme { display: grid; grid-template-columns: 196mm 1fr; gap: 10mm; align-items: start; margin-top: -2mm; }
.scheme .img svg { display: block; width: 100%%; height: auto; border-radius: 3mm; }
.nrow { display: flex; gap: 4mm; align-items: flex-start; padding: 3mm 0; border-bottom: 1px solid var(--line); }
.nrow p { font-size: 11pt; line-height: 1.4; }
.notes .lead { font-size: 15pt; color: var(--ink); margin-bottom: 6mm; }
.notes .nrow p { font-size: 12.5pt; }
.nrow .badge { width: 7mm; height: 7mm; font-size: 10.5pt; }
.dot { flex: none; width: 7mm; height: 7mm; display: flex; align-items: center; justify-content: center; }
.dot::before { content: ""; width: 2.4mm; height: 2.4mm; border-radius: 50%%; background: var(--gold); }

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
    slides = [slide_settings(), slide_light(), slide_broll(), slide_photo()]
    html = f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Producer Spotlight · How to film</title>{FONTS}<style>{css}</style></head>
<body>{''.join(slides)}</body></html>"""
    (HERE / "filming-memo.html").write_text(html)
    print("wrote", HERE / "filming-memo.html")


if __name__ == "__main__":
    build()
