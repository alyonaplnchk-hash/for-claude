"""Builds the AVU Producer Spotlight filming memo as HTML (rendered to PDF by render.mjs).

Diagrams are generated as inline SVG so light angles and beams are computed, not hand-placed.
Run:  python3 build_memo.py && node render.mjs
"""
import base64
import math
import re
from pathlib import Path

HERE = Path(__file__).parent

# AVU palette (from avu.wine): white, ink, cream panels, AVU gold
BG = "#FFFFFF"
PANEL = "#FAFAF2"
GOLD = "#89764B"
GOLD_DK = "#7A6940"  # gold for text and thin lines on white
FG = "#1A1A1A"
# light colours: *_C for beams and markers, *_T for text on white
KEY_C, KEY_T = "#D4AE57", "#8C6A1F"
FILL_C, FILL_T = "#A39E90", "#5E5A50"
RIM_C, RIM_T = "#E28A35", "#B05E17"
TXT = {KEY_C: KEY_T, FILL_C: FILL_T, RIM_C: RIM_T}

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
    """Point at distance d from (cx, cy). theta measured from 'towards camera' (down), side -1 = camera-left."""
    t = math.radians(theta_deg)
    return cx + side * d * math.sin(t), cy + d * math.cos(t)


# ---------------------------------------------------------------- top-view icons

def beam(length, w0, w1, color, opacity=0.42, start=6):
    gid = uid("bm")
    return (
        f'<defs><linearGradient id="{gid}" gradientUnits="userSpaceOnUse" x1="0" y1="{-start}" x2="0" y2="{-length}">'
        f'<stop offset="0" stop-color="{color}" stop-opacity="{opacity}"/>'
        f'<stop offset="1" stop-color="{color}" stop-opacity="0"/></linearGradient></defs>'
        f'<polygon points="{-w0/2},{-start} {w0/2},{-start} {w1/2},{-length} {-w1/2},{-length}" fill="url(#{gid})"/>'
    )


def panel(x, y, tx, ty, color=KEY_C, opacity=0.42, spread=84):
    a = ang(x, y, tx, ty)
    L = dist(x, y, tx, ty) + 6
    return (
        f'<g transform="translate({x:.1f},{y:.1f}) rotate({a:.1f})">'
        + beam(L, 46, spread, color, opacity)
        + f'<rect x="-24" y="-6" width="48" height="11" rx="2" fill="#FFFFFF" stroke="{color}" stroke-width="1.2"/>'
        f'<line x1="-22" y1="-6" x2="22" y2="-6" stroke="{color}" stroke-width="3" stroke-linecap="round"/>'
        f'<line x1="0" y1="5" x2="0" y2="12" stroke="{color}" stroke-width="1.2"/>'
        f'<circle cx="0" cy="14" r="3.2" fill="{BG}" stroke="{color}" stroke-width="1.2"/>'
        "</g>"
    )


def m20c(x, y, tx, ty, color=RIM_C):
    a = ang(x, y, tx, ty)
    L = dist(x, y, tx, ty) + 8
    return (
        f'<g transform="translate({x:.1f},{y:.1f}) rotate({a:.1f})">'
        + beam(L, 14, 46, color, 0.55, start=5)
        + f'<rect x="-8" y="-5" width="16" height="11" rx="2" fill="#FFFFFF" stroke="{color}" stroke-width="1.2"/>'
        f'<line x1="-8" y1="-5" x2="-14" y2="-13" stroke="{color}" stroke-width="1.6" stroke-linecap="round"/>'
        f'<line x1="8" y1="-5" x2="14" y2="-13" stroke="{color}" stroke-width="1.6" stroke-linecap="round"/>'
        f'<circle cx="0" cy="11" r="2.6" fill="{BG}" stroke="{color}" stroke-width="1.2"/>'
        "</g>"
    )


def camera(x, y, tx, ty, fov=17, letter="A"):
    a = ang(x, y, tx, ty)
    L = dist(x, y, tx, ty) - 4
    fx = L * math.tan(math.radians(fov))
    return (
        f'<g transform="translate({x:.1f},{y:.1f}) rotate({a:.1f})">'
        f'<line x1="0" y1="-14" x2="{-fx:.1f}" y2="{-L:.1f}" stroke="{FG}" stroke-opacity=".28" stroke-dasharray="3 4"/>'
        f'<line x1="0" y1="-14" x2="{fx:.1f}" y2="{-L:.1f}" stroke="{FG}" stroke-opacity=".28" stroke-dasharray="3 4"/>'
        f'<rect x="-8" y="-15" width="16" height="12" rx="1.5" fill="#FFFFFF" stroke="{FG}" stroke-width="1.2"/>'
        f'<rect x="-16" y="-4" width="32" height="22" rx="3" fill="#FFFFFF" stroke="{FG}" stroke-width="1.4"/>'
        f'<text x="0" y="12" transform="rotate({-a:.1f} 0 7)" text-anchor="middle" font-family="Roboto" font-weight="700" font-size="11" fill="{FG}">{letter}</text>'
        "</g>"
    )


def person(x, y, tx, ty, guest=True, seated=True):
    a = ang(x, y, tx, ty)
    fill = GOLD if guest else "none"
    stroke = GOLD_DK if guest else FG
    parts = [f'<g transform="translate({x:.1f},{y:.1f}) rotate({a:.1f})">']
    if seated:
        parts.append(
            f'<rect x="-23" y="-26" width="46" height="46" rx="7" fill="#F1ECDF" stroke="{FG}" stroke-opacity=".3"/>'
            f'<rect x="-23" y="16" width="46" height="7" rx="3" fill="#E4DCC8" stroke="{FG}" stroke-opacity=".3"/>'
            f'<rect x="-17" y="-38" width="12" height="30" rx="6" fill="{fill}" fill-opacity="{.55 if guest else 0}" stroke="{stroke}" stroke-width="1"/>'
            f'<rect x="5" y="-38" width="12" height="30" rx="6" fill="{fill}" fill-opacity="{.55 if guest else 0}" stroke="{stroke}" stroke-width="1"/>'
        )
    parts.append(
        f'<ellipse cx="0" cy="2" rx="25" ry="10.5" fill="{fill}" stroke="{stroke}" stroke-width="1.2"/>'
        f'<circle cx="0" cy="0" r="10.5" fill="{fill if guest else BG}" stroke="{stroke}" stroke-width="1.2"/>'
        f'<path d="M-3.5,-10 L0,-16 L3.5,-10 Z" fill="{stroke}"/>'
        "</g>"
    )
    return "".join(parts)


def tape_mark(x, y):
    return (
        f'<g stroke="{GOLD_DK}" stroke-width="3" stroke-linecap="square" opacity=".9">'
        f'<line x1="{x-16}" y1="{y+30}" x2="{x+16}" y2="{y+30}"/><line x1="{x}" y1="{y+30}" x2="{x}" y2="{y+44}"/></g>'
    )


def barrel(x, y, r=27):
    return (
        f'<circle cx="{x}" cy="{y}" r="{r}" fill="#EFE5CF" stroke="{GOLD}" stroke-width="1.4"/>'
        f'<circle cx="{x}" cy="{y}" r="{r-6}" fill="none" stroke="{GOLD}" stroke-opacity=".6"/>'
        f'<circle cx="{x}" cy="{y}" r="{r-14}" fill="none" stroke="{GOLD}" stroke-opacity=".35"/>'
    )


def shelves(x0, x1, y0, y1):
    out = [f'<rect x="{x0}" y="{y0}" width="{x1-x0}" height="{y1-y0}" rx="3" fill="#F1ECDF" stroke="{GOLD}" stroke-opacity=".5"/>']
    yy = y0 + 9
    while yy < y1 - 4:
        xx = x0 + 10
        while xx < x1 - 6:
            out.append(f'<circle cx="{xx}" cy="{yy}" r="3.2" fill="none" stroke="{GOLD}" stroke-opacity=".45"/>')
            xx += 13
        yy += 11
    return "".join(out)


HALO = f'paint-order="stroke" stroke="{PANEL}" stroke-width="4" stroke-linejoin="round"'


def label(x, y, title, lines, anchor="start", color=GOLD_DK, size=10.5):
    lh = size * 1.25
    out = [f'<text x="{x:.1f}" y="{y:.1f}" text-anchor="{anchor}" font-family="Roboto" font-size="{size}" font-weight="700" letter-spacing="1.3" fill="{color}" {HALO}>{title}</text>']
    for i, ln in enumerate(lines):
        out.append(f'<text x="{x:.1f}" y="{y + lh + 1 + i*lh:.1f}" text-anchor="{anchor}" font-family="Roboto" font-size="{size}" fill="{FG}" fill-opacity=".85" {HALO}>{ln}</text>')
    return "".join(out)


def pill(x, y, text, anchor="middle"):
    w = 7.0 * len(text) + 14
    rx = x - w / 2 if anchor == "middle" else (x if anchor == "start" else x - w)
    return (
        f'<rect x="{rx:.1f}" y="{y-11}" width="{w:.1f}" height="17" rx="8.5" fill="{BG}" stroke="{GOLD}" stroke-opacity=".8"/>'
        f'<text x="{rx + w/2:.1f}" y="{y+1.5}" text-anchor="middle" font-family="Roboto" font-size="10" font-weight="500" fill="{FG}">{text}</text>'
    )


def dim_line(x1, y1, x2, y2):
    a = math.atan2(y2 - y1, x2 - x1)
    nx, ny = -math.sin(a) * 5, math.cos(a) * 5
    return (
        f'<g stroke="{GOLD_DK}" stroke-width="1">'
        f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke-dasharray="2 3"/>'
        f'<line x1="{x1-nx:.1f}" y1="{y1-ny:.1f}" x2="{x1+nx:.1f}" y2="{y1+ny:.1f}"/>'
        f'<line x1="{x2-nx:.1f}" y1="{y2-ny:.1f}" x2="{x2+nx:.1f}" y2="{y2+ny:.1f}"/></g>'
    )


def angle_arc(cx, cy, r, a1, a2, text, tx, ty):
    """Arc between two directions (degrees, SVG-style clockwise from +x)."""
    p1 = (cx + r * math.cos(math.radians(a1)), cy + r * math.sin(math.radians(a1)))
    p2 = (cx + r * math.cos(math.radians(a2)), cy + r * math.sin(math.radians(a2)))
    sweep = 1 if (a2 - a1) % 360 < 180 else 0
    return (
        f'<path d="M{p1[0]:.1f},{p1[1]:.1f} A{r},{r} 0 0 {sweep} {p2[0]:.1f},{p2[1]:.1f}" fill="none" stroke="{GOLD_DK}" stroke-width="1.2"/>'
        f'<text x="{tx}" y="{ty}" text-anchor="middle" font-family="Roboto" font-size="10.5" font-weight="700" fill="{GOLD_DK}">{text}</text>'
    )


def svg_dir(x1, y1, x2, y2):
    return math.degrees(math.atan2(y2 - y1, x2 - x1))


# ---------------------------------------------------------------- top views

def top_view(seated=True):
    W, H = 680, 450
    S = 85  # px per metre
    G = (330, 40 + 2.1 * S)
    A = (330, G[1] + 1.75 * S)
    I = (330 - 0.72 * S, A[1] + 6)
    K = polar(*G, 52, 1.1 * S, -1)
    F = polar(*G, 60, 1.75 * S, +1)
    R = polar(*G, 145, 1.05 * S, +1)
    B = polar(*G, 30, 1.85 * S, +1)
    s = [f'<svg viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg" class="diagram">']
    s.append(shelves(30, 650, 8, 40))
    s.append(f'<text x="645" y="56" text-anchor="end" font-family="Roboto" font-size="10" letter-spacing="1.2" fill="{GOLD_DK}">BACKGROUND · DARKER THAN THE FACE</text>')
    # 180-degree line through guest and interviewer
    ex, ey = G[0] + (I[0] - G[0]) * 1.24, G[1] + (I[1] - G[1]) * 1.24
    sx, sy = G[0] - (I[0] - G[0]) * 0.3, G[1] - (I[1] - G[1]) * 0.3
    s.append(f'<line x1="{sx:.1f}" y1="{sy:.1f}" x2="{ex:.1f}" y2="{ey:.1f}" stroke="{FG}" stroke-opacity=".4" stroke-dasharray="7 5" stroke-width="1.2"/>')
    # beams under everything else
    s.append(panel(*K, *G, KEY_C, 0.48, 80))
    s.append(panel(*F, *G, FILL_C, 0.3, 80))
    s.append(m20c(*R, *G))
    if not seated:
        s.append(barrel(G[0] + 62, G[1] - 2, 24))
        s.append(tape_mark(G[0], G[1] - 4))
    s.append(camera(*A, *G, 15, "A"))
    s.append(camera(*B, *G, 10, "B"))
    s.append(person(*I, *G, guest=False, seated=seated))
    s.append(person(*G, *I, guest=True, seated=seated))
    # key angle, measured at the guest between camera axis and key
    s.append(angle_arc(*G, 58, svg_dir(*G, *A), svg_dir(*G, *K), "≈45°", G[0] - 34, G[1] + 72))
    # distances
    s.append(dim_line(G[0] - 30, 44, G[0] - 30, G[1] - 16))
    s.append(pill(G[0] - 30, 112, "2–3 m"))
    s.append(dim_line(A[0] + 24, G[1] + 34, A[0] + 24, A[1] - 22))
    s.append(pill(A[0] + 24, (G[1] + A[1]) / 2 + 12, "1.5–2 m"))
    # labels
    s.append(label(K[0] - 32, K[1] + 2, "KEY", ["Raleno S192K #1", "camera-left, ≈45°", "1–1.2 m, above eye level", "power 70–90 %"], "end", KEY_T))
    s.append(label(F[0] + 32, F[1] - 8, "FILL", ["Raleno S192K #2", "camera-right, eye level", "1.5–2 m, power 20–35 %"], "start", FILL_T))
    s.append(label(R[0] + 26, R[1] - 30, "HIGHLIGHT", ["Zhiyun Fiveray M20C", "behind, opposite the key", "aimed at hair + shoulders", "barn doors on, power 30–50 %"], "start", RIM_T))
    s.append(label(A[0] + 16, A[1] + 40, "CAMERA A", ["medium shot · lens at eye level"], "middle", FG))
    s.append(label(B[0] + 24, B[1] + 12, "CAMERA B", ["optional close-up"], "start", FG))
    s.append(label(I[0] - 32, I[1] + 12, "INTERVIEWER", ["right next to the lens"], "end", FG))
    gl = ["sitting, chair turned", "≈30° to interviewer"] if seated else ["standing on a tape “T”,", "hand on a barrel"]
    s.append(label(G[0] - 46, G[1] - 40, "GUEST", gl, "end", GOLD_DK))
    s.append(f'<text x="{ex - 10:.1f}" y="{ey + 8:.1f}" text-anchor="end" font-family="Roboto" font-size="9.5" letter-spacing="1" fill="{FG}" fill-opacity=".6">180° LINE</text>')
    s.append(f'<text x="{W-12}" y="{H-10}" text-anchor="end" font-family="Roboto" font-size="9" letter-spacing="1.2" fill="{FG}" fill-opacity=".45">TOP VIEW · DISTANCES APPROXIMATE</text>')
    s.append("</svg>")
    return "".join(s)


# ---------------------------------------------------------------- side views

def stand(x, floor, top, color):
    return (
        f'<g stroke="{color}" stroke-opacity=".75" stroke-width="1.3" fill="none">'
        f'<line x1="{x:.1f}" y1="{floor-22}" x2="{x:.1f}" y2="{top:.1f}"/>'
        f'<line x1="{x:.1f}" y1="{floor-22}" x2="{x-14:.1f}" y2="{floor}"/>'
        f'<line x1="{x:.1f}" y1="{floor-22}" x2="{x+14:.1f}" y2="{floor}"/>'
        f'<line x1="{x:.1f}" y1="{floor-22}" x2="{x:.1f}" y2="{floor}"/></g>'
    )


def side_light(x, y, tx, ty, color, w=40, opacity=0.4):
    a = ang(x, y, tx, ty)
    L = dist(x, y, tx, ty) + 10
    return (
        f'<g transform="translate({x:.1f},{y:.1f}) rotate({a:.1f})">'
        + beam(L, w, w + 30, color, opacity, start=5)
        + f'<rect x="{-w/2}" y="-5" width="{w}" height="10" rx="2" fill="#FFFFFF" stroke="{color}" stroke-width="1.2"/>'
        f'<line x1="{-w/2+2}" y1="-5" x2="{w/2-2}" y2="-5" stroke="{color}" stroke-width="3" stroke-linecap="round"/></g>'
    )


def tag(x, y, text, color, anchor="middle"):
    return f'<text x="{x:.1f}" y="{y:.1f}" text-anchor="{anchor}" font-family="Roboto" font-size="12" font-weight="700" letter-spacing="1.2" fill="{color}" {HALO}>{text}</text>'


def side_view(seated=True):
    W, H = 520, 272
    floor = 246
    S = 68  # px per metre
    eye = 1.20 if seated else 1.62
    key_h = 1.80 if seated else 2.15
    rim_h = 2.00 if seated else 2.25
    fill_h = 1.30 if seated else 1.65
    eyeY = floor - eye * S
    camX = 34
    gX = camX + 1.8 * S
    keyX, rimX, wallX = gX - 0.95 * S, gX + 1.0 * S, gX + 2.35 * S
    keyY, rimY = floor - key_h * S, floor - rim_h * S
    out = [f'<svg viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg" class="diagram">']
    out.append(f'<line x1="8" y1="{floor}" x2="{wallX + 20:.1f}" y2="{floor}" stroke="{GOLD}" stroke-width="1.4"/>')
    wall_h = 2.7 * S
    out.append(f'<rect x="{wallX:.1f}" y="{floor - wall_h:.1f}" width="18" height="{wall_h:.1f}" fill="#F1ECDF" stroke="{GOLD}" stroke-opacity=".5"/>')
    for i in range(1, 7):
        yy = floor - wall_h + i * wall_h / 7
        out.append(f'<line x1="{wallX:.1f}" y1="{yy:.1f}" x2="{wallX+18:.1f}" y2="{yy:.1f}" stroke="{GOLD}" stroke-opacity=".45"/>')
    out.append(f'<line x1="{camX+20}" y1="{eyeY:.1f}" x2="{gX-14:.1f}" y2="{eyeY:.1f}" stroke="{FG}" stroke-opacity=".45" stroke-dasharray="3 4"/>')
    face = (gX - 4, eyeY + 2)
    out.append(stand(keyX, floor, keyY + 6, KEY_C))
    out.append(side_light(keyX, keyY, *face, KEY_C, 40, 0.42))
    out.append(stand(rimX, floor, rimY + 5, RIM_C))
    out.append(side_light(rimX, rimY, gX + 4, eyeY + 12, RIM_C, 14, 0.55))
    out.append(stand(camX, floor, eyeY + 10, FG))
    out.append(f'<rect x="{camX-14}" y="{eyeY-10:.1f}" width="26" height="19" rx="3" fill="#FFFFFF" stroke="{FG}" stroke-width="1.3"/>'
               f'<rect x="{camX+12}" y="{eyeY-6:.1f}" width="11" height="11" rx="1.5" fill="#FFFFFF" stroke="{FG}" stroke-width="1.2"/>')
    if seated:
        seat = floor - 0.47 * S
        out.append(
            f'<g fill="none" stroke="{FG}" stroke-opacity=".45" stroke-width="1.6">'
            f'<line x1="{gX-20:.1f}" y1="{seat+3:.1f}" x2="{gX+22:.1f}" y2="{seat+3:.1f}"/>'
            f'<line x1="{gX+22:.1f}" y1="{seat+3:.1f}" x2="{gX+24:.1f}" y2="{seat-44:.1f}"/>'
            f'<line x1="{gX-16:.1f}" y1="{seat+3:.1f}" x2="{gX-18:.1f}" y2="{floor}"/><line x1="{gX+18:.1f}" y1="{seat+3:.1f}" x2="{gX+20:.1f}" y2="{floor}"/></g>'
        )
        out.append(
            f'<path d="M{gX+10:.1f},{seat:.1f} L{gX-30:.1f},{seat:.1f} L{gX-30:.1f},{floor} L{gX-39:.1f},{floor} L{gX-39:.1f},{seat-11:.1f} L{gX-2:.1f},{seat-11:.1f} '
            f'L{gX+3:.1f},{eyeY+16:.1f} Q{gX+7:.1f},{eyeY+10:.1f} {gX+16:.1f},{eyeY+19:.1f} L{gX+18:.1f},{seat:.1f} Z" fill="{GOLD}" fill-opacity=".55" stroke="{GOLD_DK}" stroke-width="1.2"/>'
        )
    else:
        hip = floor - 0.95 * S
        out.append(
            f'<path d="M{gX-7:.1f},{floor} L{gX-7:.1f},{hip:.1f} L{gX-9:.1f},{eyeY+19:.1f} Q{gX+4:.1f},{eyeY+10:.1f} {gX+14:.1f},{eyeY+19:.1f} L{gX+12:.1f},{hip:.1f} L{gX+9:.1f},{floor} Z" '
            f'fill="{GOLD}" fill-opacity=".55" stroke="{GOLD_DK}" stroke-width="1.2"/>'
        )
        bx = gX + 22
        out.append(f'<rect x="{bx:.1f}" y="{floor-0.95*S:.1f}" width="30" height="{0.95*S:.1f}" rx="8" fill="#EFE5CF" stroke="{GOLD}" stroke-width="1.3"/>'
                   f'<line x1="{bx:.1f}" y1="{floor-0.22*S:.1f}" x2="{bx+30:.1f}" y2="{floor-0.22*S:.1f}" stroke="{GOLD}" stroke-opacity=".6"/>'
                   f'<line x1="{bx:.1f}" y1="{floor-0.72*S:.1f}" x2="{bx+30:.1f}" y2="{floor-0.72*S:.1f}" stroke="{GOLD}" stroke-opacity=".6"/>')
    out.append(f'<circle cx="{gX+3:.1f}" cy="{eyeY:.1f}" r="11" fill="{GOLD}" stroke="{GOLD_DK}" stroke-width="1.2"/>')
    # tags on the drawing
    out.append(tag(keyX, keyY - 14, "KEY", KEY_T))
    out.append(tag(rimX, rimY - 14, "RIM", RIM_T))
    out.append(tag(camX + 4, eyeY - 18, "A", FG))
    out.append(tag(wallX + 9, floor + 18, "BACKGROUND", GOLD_DK))
    # floor distances
    out.append(dim_line(camX + 18, floor - 9, gX - 44, floor - 9))
    out.append(pill((camX + gX) / 2 - 12, floor - 9, "1.5–2 m"))
    d0 = gX + (60 if not seated else 26)
    out.append(dim_line(d0, floor - 9, wallX - 2, floor - 9))
    out.append(pill((d0 + wallX) / 2, floor - 9, "2–3 m"))
    # height legend on the right
    lx = wallX + 40
    eye_cm = int(round(eye * 100))
    rows = [
        (FG, "LENS", [f"≈{eye_cm - 5}–{eye_cm + 5} cm", "= guest's eye level"]),
        (KEY_C, "KEY", [f"≈{int(key_h*100)} cm", "tilted down ≈30°"]),
        (FILL_C, "FILL", [f"≈{int(fill_h*100)} cm, eye level", "other side, not drawn"]),
        (RIM_C, "RIM", [f"≈{int(rim_h*100)} cm, aimed at", "back of head / shoulder"]),
    ]
    for i, (c, t, lines) in enumerate(rows):
        yy = 30 + i * 60
        out.append(f'<circle cx="{lx}" cy="{yy-4.5}" r="4.5" fill="{c}"/>')
        out.append(label(lx + 13, yy, t, lines, "start", TXT.get(c, c), 13.5))
    out.append("</svg>")
    return "".join(out)


# ---------------------------------------------------------------- B-roll pictograms (160 x 90)

def figure(x, y, s=1.0, walk=False, arm=None):
    """Stick figure standing on y (feet)."""
    st = f'stroke="{GOLD_DK}" stroke-width="2.2" stroke-linecap="round" fill="none"'
    head = f'<circle cx="{x}" cy="{y-46*s}" r="{6*s}" fill="{GOLD_DK}"/>'
    body = f'<line x1="{x}" y1="{y-38*s}" x2="{x}" y2="{y-18*s}" {st}/>'
    if walk:
        legs = f'<path d="M{x-9*s},{y} L{x},{y-18*s} L{x+10*s},{y-1*s}" {st}/>'
        arms = f'<path d="M{x-8*s},{y-22*s} L{x},{y-34*s} L{x+9*s},{y-24*s}" {st}/>'
    else:
        legs = f'<path d="M{x-5*s},{y} L{x},{y-18*s} L{x+5*s},{y}" {st}/>'
        arms = f'<path d="M{x-6*s},{y-20*s} L{x},{y-34*s} L{x+6*s},{y-20*s}" {st}/>'
    if arm == "right":
        arms = f'<path d="M{x-6*s},{y-20*s} L{x},{y-34*s} L{x+14*s},{y-27*s}" {st}/>'
    if arm == "left":
        arms = f'<path d="M{x-14*s},{y-27*s} L{x},{y-34*s} L{x+6*s},{y-20*s}" {st}/>'
    return head + body + legs + arms


def glass(x, y, s=1.0, wine=True):
    g = (f'<path d="M{x-9*s},{y-34*s} Q{x-10*s},{y-14*s} {x},{y-12*s} Q{x+10*s},{y-14*s} {x+9*s},{y-34*s}" fill="none" stroke="{GOLD_DK}" stroke-width="1.8"/>'
         f'<line x1="{x}" y1="{y-12*s}" x2="{x}" y2="{y}" stroke="{GOLD_DK}" stroke-width="1.8"/>'
         f'<line x1="{x-7*s}" y1="{y}" x2="{x+7*s}" y2="{y}" stroke="{GOLD_DK}" stroke-width="1.8" stroke-linecap="round"/>')
    if wine:
        g += f'<path d="M{x-8.6*s},{y-24*s} Q{x-8*s},{y-14*s} {x},{y-13*s} Q{x+8*s},{y-14*s} {x+8.6*s},{y-24*s} Z" fill="#7A2335"/>'
    return g


def bottle(x, y, angle=0, s=1.0):
    return (f'<g transform="translate({x},{y}) rotate({angle})">'
            f'<path d="M{-7*s},0 L{-7*s},{-34*s} Q{-7*s},{-42*s} {-2.5*s},{-46*s} L{-2.5*s},{-56*s} L{2.5*s},{-56*s} L{2.5*s},{-46*s} Q{7*s},{-42*s} {7*s},{-34*s} L{7*s},0 Z" fill="#3A2E26" stroke="{GOLD_DK}" stroke-width="1.6"/>'
            f'<rect x="{-5*s}" y="{-26*s}" width="{10*s}" height="{12*s}" fill="#FAFAF2" stroke="{GOLD_DK}" stroke-width=".8"/></g>')


def picto(kind):
    o = [f'<svg viewBox="0 0 160 90" xmlns="http://www.w3.org/2000/svg">']
    gl = f'stroke="{GOLD_DK}" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"'
    if kind == "estate":
        o.append(f'<path d="M30,62 L30,40 L36,30 L42,40 L42,62 M42,62 L42,44 L80,44 L80,62 M42,44 L61,32 L80,44 M80,62 L80,40 L86,30 L92,40 L92,62" {gl}/>')
        o.append(f'<line x1="18" y1="62" x2="142" y2="62" {gl}/>')
        for i, dx in enumerate((-60, -30, 0, 30, 60)):
            o.append(f'<line x1="{80+dx*0.25}" y1="66" x2="{80+dx}" y2="88" stroke="{GOLD}" stroke-width="1.6"/>')
        o.append(f'<circle cx="122" cy="24" r="7" fill="none" stroke="{GOLD_DK}" stroke-width="1.6"/>')
        o.append(f'<path d="M100,52 Q112,40 124,52 Q130,46 138,52" {gl}/>')
    elif kind == "arrival":
        o.append(f'<path d="M26,80 L26,30 Q26,18 40,18 Q54,18 54,30 L54,80" {gl}/>')
        o.append(figure(84, 80, 1.0, walk=True))
        o.append(f'<path d="M100,52 L134,52 M128,46 L134,52 L128,58" {gl}/>')
    elif kind == "greeting":
        o.append(figure(62, 80, 1.0, arm="right"))
        o.append(figure(98, 80, 1.0, arm="left"))
        o.append(f'<circle cx="80" cy="54" r="5" fill="none" stroke="{FG}" stroke-width="1.4"/>')
        o.append(f'<path d="M73,44 l-4,-5 M80,42 l0,-6 M87,44 l4,-5" stroke="{FG}" stroke-width="1.2" stroke-linecap="round"/>')
    elif kind == "walk":
        o.append(figure(58, 82, 0.95, walk=True))
        o.append(figure(80, 82, 0.95, walk=True))
        o.append(f'<path d="M98,40 L118,40 M113,35 L118,40 L113,45" {gl}/>')
        o.append(f'<rect x="126" y="50" width="18" height="12" rx="2" fill="none" stroke="{FG}" stroke-width="1.6"/><path d="M126,53 l-6,-3 l0,12 l6,-3" fill="none" stroke="{FG}" stroke-width="1.6"/>')
        o.append(f'<path d="M128,72 L146,72 M141,67 L146,72 L141,77" stroke="{FG}" stroke-width="1.4" fill="none" stroke-linecap="round"/>')
    elif kind == "pour":
        o.append(bottle(58, 24, 112, 0.95))
        o.append(f'<path d="M107,44 Q111,52 111,66" stroke="#9B3045" stroke-width="2.4" fill="none" stroke-linecap="round"/>')
        o.append(glass(112, 86, 1.1))
    elif kind == "taste":
        o.append(f'<path d="M57,42 A23,7 0 0 1 103,42" stroke="{GOLD_DK}" stroke-width="1.4" stroke-dasharray="3 3" fill="none"/>')
        o.append(glass(80, 84, 1.5))
        o.append(f'<path d="M57,42 A23,7 0 0 0 103,42" {gl}/><path d="M103,42 l-7,-2 M103,42 l-2,-7" {gl}/>')
    elif kind == "details":
        o.append(f'<ellipse cx="62" cy="50" rx="24" ry="30" fill="#EFE5CF" stroke="{GOLD}" stroke-width="1.6"/>'
                 f'<ellipse cx="62" cy="50" rx="17" ry="22" fill="none" stroke="{GOLD}" stroke-opacity=".7"/>'
                 f'<ellipse cx="62" cy="50" rx="8" ry="10" fill="none" stroke="{GOLD}" stroke-opacity=".5"/>')
        o.append(f'<circle cx="104" cy="44" r="14" fill="{BG}" fill-opacity=".6" stroke="{GOLD_DK}" stroke-width="2"/><line x1="114" y1="54" x2="128" y2="70" stroke="{GOLD_DK}" stroke-width="3.2" stroke-linecap="round"/>')
        o.append(f'<rect x="98" y="39" width="12" height="10" fill="{GOLD}" fill-opacity=".45"/>')
    elif kind == "listen":
        o.append(f'<circle cx="70" cy="40" r="15" fill="{GOLD_DK}"/><path d="M40,86 Q42,58 70,58 Q98,58 100,86" fill="{GOLD_DK}" fill-opacity=".75"/>')
        o.append(f'<path d="M108,30 Q114,40 108,50 M116,24 Q126,40 116,56" {gl}/>')
        o.append(f'<path d="M46,26 q-6,8 0,16" stroke="{FG}" stroke-width="1.4" fill="none" stroke-linecap="round"/>')
    elif kind == "cheers":
        o.append(f'<g transform="rotate(-14 70 70)">{glass(70, 84, 1.25)}</g>')
        o.append(f'<g transform="rotate(14 92 70)">{glass(92, 84, 1.25)}</g>')
        o.append(f'<path d="M81,26 l0,-10 M70,30 l-6,-8 M92,30 l6,-8" stroke="{FG}" stroke-width="1.5" stroke-linecap="round"/>')
    o.append("</svg>")
    return "".join(o)


# ---------------------------------------------------------------- assets

def logo_svg(height_mm):
    raw = (HERE / "avu-logo.svg").read_text()
    raw = re.sub(r"<\?xml.*?\?>", "", raw)
    raw = re.sub(r"<!--.*?-->", "", raw, flags=re.S)
    raw = re.sub(r"<style.*?</style>", "", raw, flags=re.S)
    raw = raw.replace('class="st0"', f'fill="{GOLD}"')
    raw = re.sub(r'id="[^"]*"', "", raw)
    return raw.replace("<svg ", f'<svg style="height:{height_mm}mm;width:auto" ', 1)


def img_b64(name):
    return "data:image/jpeg;base64," + base64.b64encode((HERE / name).read_bytes()).decode()


# ---------------------------------------------------------------- pages

def head(n, section):
    return (f'<div class="runner"><span>{logo_svg(6)}<b>AVU</b> · Producer Spotlight · Filming memo</span>'
            f'<span>{section}<em>{n:02d}</em></span></div>')


def ul(items, cls="list"):
    return f'<ul class="{cls}">' + "".join(f"<li>{i}</li>" for i in items) + "</ul>"


def page_option(seated):
    n, title = (1, "Seated interview") if seated else (2, "Standing interview")
    if seated:
        notes = [
            "Interviewer sits right next to the lens, so the guest looks just past it.",
            "Guest's chair turned ≈30° towards the interviewer.",
        ]
    else:
        notes = [
            "Tape a “T” on the floor where the guest stands. A barrel or table to rest a hand on.",
            "Interviewer stands right next to the lens.",
        ]
    notes += [
        "All lights and both cameras on the same Kelvin. White balance manual.",
        "Shoot 4K 16:9 for YouTube. Keep the guest in the middle third so the 9:16 crop for Instagram works.",
    ]
    return f"""
<section class="page">
  {head(n, "Light setup")}
  <p class="eyebrow">1 · Light setup</p>
  <h2>{title}</h2>
  <div class="figure">{top_view(seated)}</div>
  <div class="legend">
    <span><i class="lg key"></i>Key · Raleno</span><span><i class="lg fill"></i>Fill · Raleno</span><span><i class="lg rim"></i>Highlight · M20C</span>
    <span><i class="lg cam"></i>Camera</span><span><i class="lg guest"></i>Guest</span><span><i class="lg int"></i>Interviewer</span>
  </div>
  <div class="two side">
    <div><h3 class="mini">Side view: heights</h3><div class="figure">{side_view(seated)}</div></div>
    <div><h3 class="mini">Notes</h3>{ul(notes)}</div>
  </div>
</section>"""


def page_broll():
    shots = [
        ("estate", "Establishing", "Estate, entrance, vineyard, cellar."),
        ("arrival", "The arrival", "Guest walks in through a door or along the cellar."),
        ("greeting", "The greeting", "Handshake or hello with the AVU host."),
        ("walk", "Walk &amp; talk", "Guest and host walk through the barrel room."),
        ("pour", "Open &amp; pour", "Cork out, wine into the glass, label to camera."),
        ("taste", "Swirl &amp; taste", "Glass close-up, guest tasting in profile."),
        ("details", "Details", "Hands, barrels, labels, vintages, corks."),
        ("listen", "Reactions", "Guest listening, smiling, nodding."),
        ("cheers", "The outro", "Guest raises a glass to the camera."),
    ]
    cards = "".join(
        f'<div class="shot"><div class="thumb">{picto(k)}<span class="sn">{i+1:02d}</span></div><h4>{t}</h4><p>{d}</p></div>'
        for i, (k, t, d) in enumerate(shots)
    )
    return f"""
<section class="page">
  {head(3, "Additional shots")}
  <p class="eyebrow">2 · Additional shots</p>
  <h2>Additional shots</h2>
  <p class="intro">Shoot before or after the interview. Hold every shot 10 seconds, no zooming.</p>
  <div class="shots">{cards}</div>
</section>"""


def page_portrait():
    return f"""
<section class="page">
  {head(4, "Portrait")}
  <p class="eyebrow">3 · Portrait</p>
  <h2>The portrait</h2>
  <p class="intro">One high-quality photo of the guest, like this sample.</p>
  <div class="portrait">
    <div class="refimg"><img src="{img_b64('portrait-reference.jpg')}" alt="Sample portrait">
      <span class="mk" style="left:90%;top:35%">1</span>
      <span class="mk" style="left:84%;top:22%">2</span>
      <span class="mk" style="left:50%;top:72%">3</span>
      <span class="mk" style="left:92%;top:63%">4</span>
      <span class="mk" style="left:7%;top:40%">5</span>
    </div>
    <div>
      <ol class="mk-list">
        <li>Looking straight into the lens, eyes in the upper third.</li>
        <li>Highlight on hair and shoulders, plain background behind.</li>
        <li>Arms crossed, relaxed, natural smile.</li>
        <li>Shoot wider than this crop: never cut elbows or hands.</li>
        <li>Leave space on one side for the title.</li>
      </ol>
      <table class="spec">
        <tr><th>Light</th><td>same three lights, guest turned to the camera</td></tr>
        <tr><th>Camera</th><td>85 mm · f/4–5.6 · RAW</td></tr>
        <tr><th>Frames</th><td>vertical and a few horizontal</td></tr>
      </table>
    </div>
  </div>
</section>"""


CSS = """
@page { size: A4; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
:root { --bg: %(BG)s; --panel: %(PANEL)s; --gold: %(GOLD)s; --gold-dk: %(GOLD_DK)s; --ink: %(FG)s;
        --muted: rgba(26,26,26,.72); --line: rgba(137,118,75,.42); --hair: rgba(26,26,26,.1);
        --key: %(KEY_C)s; --rim: %(RIM_C)s; --fill: %(FILL_C)s; }
html, body { background: var(--bg); }
body { font-family: 'Roboto', Arial, sans-serif; color: var(--ink); font-size: 9.4pt; line-height: 1.42;
       -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { width: 210mm; height: 297mm; padding: 13mm 15mm 12mm; position: relative; overflow: hidden;
        background: var(--bg); page-break-after: always; }
.page:last-child { page-break-after: auto; }
.runner { display: flex; justify-content: space-between; align-items: center; font-size: 7.4pt; letter-spacing: .14em;
          text-transform: uppercase; color: var(--muted); border-bottom: 1px solid var(--line); padding-bottom: 3mm; margin-bottom: 7mm; }
.runner span { display: flex; align-items: center; gap: 2.4mm; }
.runner b { color: var(--gold-dk); font-weight: 700; letter-spacing: .2em; }
.runner em { font-style: normal; font-family: 'Playfair Display', Georgia, serif; font-size: 11pt; color: var(--gold-dk); letter-spacing: 0; margin-left: 2mm; }
.eyebrow { font-size: 7.6pt; letter-spacing: .26em; text-transform: uppercase; color: var(--gold-dk); font-weight: 700; margin-bottom: 1.6mm; }
h1, h2 { font-family: 'Playfair Display', Georgia, serif; font-weight: 600; letter-spacing: -.01em; line-height: 1.04; }
h2 { font-size: 25pt; margin-bottom: 5mm; }
h2 .amp { color: var(--gold-dk); font-style: italic; }
h3.mini { font-size: 7.6pt; letter-spacing: .22em; text-transform: uppercase; color: var(--gold-dk); font-weight: 700;
          margin: 0 0 2.4mm; padding-bottom: 1.6mm; border-bottom: 1px solid var(--line); }
.intro { color: var(--muted); max-width: 165mm; margin-bottom: 5mm; font-size: 9.8pt; }
.intro b, .list b { color: var(--ink); font-weight: 500; }
.figure { background: var(--panel); border: 1px solid rgba(137,118,75,.28); border-radius: 3mm; padding: 2mm; margin-bottom: 4mm; }
.figure svg { display: block; width: 100%%; height: auto; }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 7mm; }
.list { list-style: none; }
.list li { position: relative; padding-left: 4.6mm; margin-bottom: 1.8mm; color: var(--muted); }
.list li::before { content: ""; position: absolute; left: 0; top: 1.9mm; width: 2.2mm; height: 1px; background: var(--gold-dk); }
table.spec { width: 100%%; border-collapse: collapse; font-size: 8.7pt; }
table.spec th { text-align: left; font-weight: 500; color: var(--gold-dk); padding: 1.3mm 3mm 1.3mm 0; width: 31%%; vertical-align: top; white-space: nowrap; }
table.spec td { color: var(--ink); padding: 1.3mm 0; border-bottom: 1px solid var(--hair); }

/* options */
.legend { display: flex; flex-wrap: wrap; gap: 2mm 5mm; font-size: 7.8pt; color: var(--muted); margin: -2mm 0 5mm; }
.legend span { display: flex; align-items: center; gap: 1.6mm; }
.lg { display: inline-block; width: 4.6mm; height: 2.4mm; border-radius: .6mm; }
.lg.key { background: var(--key); } .lg.fill { background: var(--fill); opacity: .7; } .lg.rim { background: var(--rim); }
.lg.cam { background: #FFFFFF; border: 1px solid var(--ink); } .lg.guest { background: var(--gold); width: 3mm; height: 3mm; border-radius: 50%%; }
.lg.int { border: 1px solid var(--ink); width: 3mm; height: 3mm; border-radius: 50%%; }
.two.side { grid-template-columns: 1.6fr 1fr; gap: 5mm; }
.two.side .list li { font-size: 8.6pt; margin-bottom: 1.6mm; }

/* b-roll */
.shots { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3.4mm; margin-bottom: 4.5mm; }
.shot { background: var(--panel); border: 1px solid rgba(137,118,75,.28); border-radius: 2.4mm; padding: 2.4mm 2.6mm 3mm; position: relative; }
.thumb { position: relative; background: radial-gradient(90%% 90%% at 50%% 40%%, #FFFFFF, #F1EADB); border-radius: 1.6mm; margin-bottom: 2.4mm; border: 1px solid var(--hair); }
.thumb svg { display: block; width: 100%%; height: 30mm; }
.sn { position: absolute; left: 2mm; top: 1.4mm; font-family: 'Playfair Display', serif; font-size: 9pt; color: var(--gold-dk); }
.shot h4 { font-family: 'Playfair Display', serif; font-weight: 600; font-size: 11pt; margin-bottom: .8mm; }
.shot p { font-size: 8.6pt; color: var(--muted); line-height: 1.36; }

/* portrait */
.portrait { display: grid; grid-template-columns: 92mm 1fr; gap: 8mm; align-items: start; }
.refimg { position: relative; border-radius: 2.4mm; overflow: hidden; border: 1px solid var(--line); }
.refimg img { display: block; width: 100%%; height: auto; }
.mk { position: absolute; transform: translate(-50%%, -50%%); width: 5.6mm; height: 5.6mm; border-radius: 50%%; background: var(--gold-dk); color: #FFFFFF;
       font-weight: 700; font-size: 8.4pt; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 1.2mm rgba(255,255,255,.75); }
ol.mk-list { list-style: none; counter-reset: m; margin-bottom: 6mm; }
ol.mk-list li { counter-increment: m; position: relative; padding-left: 8mm; margin-bottom: 3.4mm; font-size: 10pt; color: var(--ink); }
ol.mk-list li::before { content: counter(m); position: absolute; left: 0; top: .1mm; width: 4.6mm; height: 4.6mm; border-radius: 50%%; background: var(--gold-dk);
                        color: #FFFFFF; font-size: 7.2pt; font-weight: 700; display: flex; align-items: center; justify-content: center; }
"""

FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,600&family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">'


def build():
    css = CSS % dict(BG=BG, PANEL=PANEL, GOLD=GOLD, GOLD_DK=GOLD_DK, FG=FG, KEY_C=KEY_C, RIM_C=RIM_C, FILL_C=FILL_C, KEY_T=KEY_T, FILL_T=FILL_T, RIM_T=RIM_T)
    pages = [page_option(True), page_option(False), page_broll(), page_portrait()]
    html = f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Producer Spotlight · Filming memo</title>{FONTS}<style>{css}</style></head>
<body>{''.join(pages)}</body></html>"""
    (HERE / "filming-memo.html").write_text(html)
    print("wrote", HERE / "filming-memo.html")


if __name__ == "__main__":
    build()
