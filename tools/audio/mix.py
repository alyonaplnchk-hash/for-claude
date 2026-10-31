"""Synthesises the film's score and sound design from scratch and mixes it with the narration.

Everything is generated procedurally (additive/FM synthesis, filtered noise, a synthetic reverb),
timed from tools/audio/timeline.json (exported by export-timeline.mjs). Output: public/audio/mix.wav

    python3 tools/audio/mix.py
"""
import json
import os
import subprocess
import wave

import numpy as np
from scipy import signal

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SR = 48000
TL = json.load(open(os.path.join(ROOT, "tools/audio/timeline.json")))
TOTAL = TL["total"] + 0.6
N = int(TOTAL * SR)
rng = np.random.default_rng(7)
SHOT = {s["id"]: s for s in TL["shots"]}
BEAT = TL["beats"]


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def buf():
    return np.zeros((2, N), dtype=np.float64)


def add(bus, x, t0, gain=1.0, pan=0.0):
    i0 = int(t0 * SR)
    if i0 >= N:
        return
    if i0 < 0:
        x = x[-i0:]
        i0 = 0
    n = min(len(x), N - i0)
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    bus[0, i0:i0 + n] += x[:n] * gain * l * 1.414
    bus[1, i0:i0 + n] += x[:n] * gain * r * 1.414


def adsr(n, a, d, s, r, sr=SR):
    t = np.arange(n) / sr
    dur = n / sr
    e = np.where(t < a, t / max(a, 1e-4), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))
    rel = np.clip((dur - t) / max(r, 1e-4), 0, 1)
    return e * rel


def lp(x, fc, order=2):
    b, a = signal.butter(order, min(fc, SR * 0.45) / (SR / 2), "low")
    return signal.lfilter(b, a, x)


def hp(x, fc, order=2):
    b, a = signal.butter(order, fc / (SR / 2), "high")
    return signal.lfilter(b, a, x)


def bp(x, lo, hi, order=2):
    b, a = signal.butter(order, [lo / (SR / 2), min(hi, SR * 0.45) / (SR / 2)], "band")
    return signal.lfilter(b, a, x)


# ---------------------------------------------------------------- instruments
from functools import lru_cache

TABLE_N = 4096
_ph = np.arange(TABLE_N) / TABLE_N
SAW = sum(np.sin(2 * np.pi * k * _ph) / k * (0.85 ** k) for k in range(1, 11))
SAW /= np.max(np.abs(SAW))
CELLO_T = sum(np.sin(2 * np.pi * k * _ph) / k for k in range(1, 14))
CELLO_T /= np.max(np.abs(CELLO_T))


def table_osc(table, phase):
    return table[((phase % 1.0) * TABLE_N).astype(np.int64) % TABLE_N]


@lru_cache(maxsize=None)
def _pad(midi, dur, bright):
    n = int((dur + 2.2) * SR)
    t = np.arange(n) / SR
    f = mtof(midi)
    x = np.zeros(n)
    for det in (-0.07, 0.0, 0.07):
        x += table_osc(SAW, f * 2 ** (det / 12) * t + rng.random())
    x = lp(x, 500 + 2200 * bright)
    return x * adsr(n, 1.1, 1.5, 0.85, 1.8) * 0.07


def pad(midi, dur, bright=0.5):
    return _pad(midi, round(dur, 2), round(bright, 2))


@lru_cache(maxsize=None)
def pluck(midi, dur=1.2, bright=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = mtof(midi)
    x = np.zeros(n)
    for k in range(1, 9):
        fk = f * k * (1 + 0.0007 * k * k)
        if fk > 12000:
            break
        x += np.sin(2 * np.pi * fk * t) / k * np.exp(-t * (2.2 + k * 1.6 / bright))
    x *= np.minimum(1, t / 0.003)
    return x * 0.12


@lru_cache(maxsize=None)
def bell(midi, dur=3.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = mtof(midi)
    idx = 2.2 * np.exp(-t * 3)
    x = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * 3.5 * t)) * np.exp(-t * 1.3)
    x += 0.3 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t * 2.5)
    return x * np.minimum(1, t / 0.002) * 0.07


def bass(midi, dur):
    n = int((dur + 0.4) * SR)
    t = np.arange(n) / SR
    f = mtof(midi)
    x = np.sin(2 * np.pi * f * t) + 0.35 * np.tanh(2 * np.sin(2 * np.pi * f * 2 * t))
    return lp(x, 400) * adsr(n, 0.02, 0.6, 0.7, 0.4) * 0.16


def cello(midi, dur):
    n = int((dur + 1.0) * SR)
    t = np.arange(n) / SR
    f = mtof(midi) * (1 + 0.003 * np.sin(2 * np.pi * 5.2 * t) * np.minimum(1, t / 0.8))
    x = table_osc(CELLO_T, np.cumsum(f) / SR)
    x = lp(x, 900)
    return x * adsr(n, 0.5, 1.0, 0.8, 0.9) * 0.05


def kick(vel=1.0):
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    f = 45 + 80 * np.exp(-t * 30)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 9) * 0.5 * vel


def shaker(vel=1.0):
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    x = hp(rng.standard_normal(n), 6000) * np.exp(-t * 60) * np.minimum(1, t / 0.006)
    return x * 0.05 * vel


def impact(size=1.0):
    n = int(3.5 * SR)
    t = np.arange(n) / SR
    f = 32 + 70 * np.exp(-t * 6)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t * 1.6) * 0.8
    x += lp(rng.standard_normal(n), 1800) * np.exp(-t * 7) * 0.5
    return x * size * 0.6


def sweep_bp(noise, centre, width=(0.6, 1.6), seg=512):
    """Band-pass whose centre follows `centre` (array), filter state carried across blocks."""
    out = np.zeros_like(noise)
    zi = None
    for i in range(0, len(noise), seg):
        c = centre[min(i, len(noise) - 1)]
        sos = signal.butter(1, [c * width[0] / (SR / 2), min(c * width[1], SR * 0.45) / (SR / 2)], "band", output="sos")
        if zi is None:
            zi = np.zeros((sos.shape[0], 2))
        out[i:i + seg], zi = signal.sosfilt(sos, noise[i:i + seg], zi=zi)
    return out


def riser(dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    k = t / dur
    noise = rng.standard_normal(n)
    out = sweep_bp(noise, 300 + 6000 * k ** 2, (0.7, 1.4))
    f = 200 + 900 * k ** 2
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.15
    return (out * 0.5 + tone) * k ** 2 * 0.35


def whoosh(dur, up=True):
    n = int(dur * SR)
    t = np.arange(n) / SR
    k = t / dur
    noise = rng.standard_normal(n)
    out = sweep_bp(noise, 400 + 3500 * (np.sin(k * np.pi) if up else 1 - k))
    return out * np.sin(k * np.pi) ** 2 * 0.5


def blip(freq=1900, dur=0.18):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * t) * np.exp(-t * 28) + 0.4 * np.sin(2 * np.pi * freq * 1.5 * t) * np.exp(-t * 40)
    return x * np.minimum(1, t / 0.002) * 0.08


def plip(freq=900):
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    f = freq * (1 + 1.4 * np.exp(-t * 40))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 22) * 0.18


def bubble():
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    f0 = 300 + rng.random() * 900
    f = f0 * (1 + t * 6)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 35) * 0.05


def chirp():
    n = int(0.16 * SR)
    t = np.arange(n) / SR
    f0 = 3000 + rng.random() * 2000
    f = f0 + 1500 * np.sin(t * 60) * (1 - t / 0.16)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / 0.16) ** 2 * 0.03


def noise_bed(dur, lo, hi, mod=0.3):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = bp(rng.standard_normal(n), lo, hi)
    m = 1 + mod * np.sin(2 * np.pi * 0.13 * t + rng.random() * 6) * np.sin(2 * np.pi * 0.07 * t)
    fade = np.minimum(1, np.minimum(t / 0.8, (dur - t) / 0.8))
    return x * m * fade


def pour(dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = bp(rng.standard_normal(n), 300, 2400)
    gurgle = 0.6 + 0.4 * np.sin(2 * np.pi * (7 + 3 * np.sin(t * 2)) * t)
    fade = np.minimum(1, np.minimum(t / 0.2, (dur - t) / 0.4))
    return x * gurgle * fade * 0.12


# ---------------------------------------------------------------- harmony
CH = {
    "Dm9": (38, [50, 53, 57, 60, 64]),
    "Bbmaj7": (34, [46, 50, 53, 57, 62]),
    "Fmaj7": (41, [53, 57, 60, 64, 67]),
    "C/E": (40, [48, 52, 55, 60, 62]),
    "Gm7": (43, [55, 58, 62, 65, 69]),
    "A7sus": (45, [57, 62, 64, 67, 69]),
    "Am7": (45, [57, 60, 64, 67, 72]),
    "C": (36, [48, 52, 55, 60, 64]),
    "Fadd9": (41, [53, 57, 60, 67, 69]),
}

# section: (start, end, progression, bar seconds, layers)
def sec(a, b):
    return SHOT[a]["start"], SHOT[b]["end"]


SECTIONS = [
    dict(r=(0, SHOT["hook"]["end"]), prog=["Dm9", "Dm9", "Bbmaj7"], bar=2.5, arp=0.16, arpReg=74, kick=True, shaker=False, pad=0.6, bright=0.8, bell=False, bass=True),
    dict(r=sec("title", "title"), prog=["Dm9"], bar=3.4, arp=0, pad=1.0, bright=0.9, bell=True, bass=True, kick=False, shaker=False),
    dict(r=sec("map", "soil"), prog=["Dm9", "Bbmaj7", "Fmaj7", "C/E"], bar=2.5, arp=0.3125, arpReg=72, kick=True, shaker=True, pad=0.8, bright=0.55, bell=False, bass=True),
    dict(r=sec("grapes", "harvest"), prog=["Bbmaj7", "Fmaj7", "C/E", "Dm9"], bar=2.5, arp=0.3125, arpReg=76, kick=True, shaker=True, pad=0.9, bright=0.75, bell=True, bass=True),
    dict(r=sec("sorting", "vat"), prog=["Gm7", "Dm9", "Bbmaj7", "A7sus"], bar=2.5, arp=0.15625, arpReg=69, kick=True, shaker=True, pad=0.7, bright=0.6, bell=False, bass=True),
    dict(r=sec("skins", "skins"), prog=["Fmaj7", "C/E", "Dm9", "Bbmaj7"], bar=2.6, arp=0.21, arpReg=77, kick=True, shaker=False, pad=1.0, bright=0.95, bell=True, bass=True),
    dict(r=sec("press", "cellar"), prog=["Dm9", "Bbmaj7", "Gm7", "A7sus"], bar=3.2, arp=0, pad=0.9, bright=0.35, bell=True, bass=True, kick=False, shaker=False, cello=True),
    dict(r=sec("blend", "blend"), prog=["Bbmaj7", "C/E", "Dm9", "Fmaj7"], bar=2.3, arp=0.2875, arpReg=74, kick=True, shaker=True, pad=0.9, bright=0.7, bell=True, bass=True),
    dict(r=(SHOT["finale"]["start"], TOTAL), prog=["Bbmaj7", "C", "Am7", "Dm9", "Bbmaj7", "C", "Fadd9"], bar=2.0, arp=0.25, arpReg=76, kick=False, shaker=False, pad=1.0, bright=0.85, bell=True, bass=True, finale=True),
]

music = buf()
drums = buf()
arpbus = buf()
bells = buf()
for S in SECTIONS:
    a, b = S["r"]
    t = a
    bar_i = 0
    while t < b - 0.2:
        name = S["prog"][bar_i % len(S["prog"])]
        if S.get("finale"):
            # stretch the final chord to the end
            if bar_i >= len(S["prog"]) - 1:
                name = "Fadd9"
        root, notes = CH[name]
        bl = min(S["bar"], b - t) if not (S.get("finale") and name == "Fadd9") else b - t
        for i, m in enumerate(notes):
            add(music, pad(m, bl, S["bright"]), t, S["pad"], pan=(i - 2) * 0.25)
        if S.get("bass"):
            add(music, bass(root, bl), t, 1.0)
        if S.get("cello"):
            add(music, cello(root + 12, bl), t, 1.0, pan=-0.2)
        if S["arp"]:
            step = S["arp"]
            k = 0
            pattern = [0, 2, 1, 3, 2, 4, 3, 1]
            tt = t
            while tt < t + bl - 0.05:
                m = notes[pattern[k % 8] % len(notes)] + 12 + (S["arpReg"] - 72)
                vel = 1.0 if k % 4 == 0 else 0.7
                add(arpbus, pluck(m, 1.0, 1.0), tt, 0.55 * vel, pan=np.sin(k * 0.9) * 0.5)
                k += 1
                tt += step
        if S.get("kick"):
            beat = S["bar"] / 4
            for q in range(4):
                tq = t + q * beat
                if tq < t + bl and (q == 0 or (q == 2 and S["arp"] and S["arp"] < 0.2)):
                    add(drums, kick(1.0 if q == 0 else 0.7), tq, 0.8)
        if S.get("shaker"):
            beat = S["bar"] / 8
            for q in range(8):
                tq = t + q * beat
                if tq < t + bl:
                    add(drums, shaker(1.0 if q % 2 else 0.5), tq, 1.0, pan=0.3)
        if S.get("bell"):
            for q, deg in enumerate([4, 2]):
                tq = t + q * S["bar"] / 2 + 0.05
                if tq < t + bl:
                    add(bells, bell(notes[deg] + 24), tq, 0.8, pan=(-0.4 if q else 0.4))
        t += bl
        bar_i += 1

# ---------------------------------------------------------------- sound design
sfx = buf()
amb = buf()
hookQ = BEAT["hook.question"]
add(sfx, riser(hookQ - 1.6), 1.6, 0.9)
add(sfx, impact(0.9), hookQ - 0.05, 1.0)
add(sfx, whoosh(1.4), hookQ - 0.3, 0.8, pan=-0.3)
add(sfx, impact(0.7), BEAT["hook.ruby"], 0.7)
add(sfx, noise_bed(1.8, 80, 400, 0.1) * np.hanning(int(1.8 * SR)) * 0.6, 0.45, 0.6)  # squeeze strain
for tp in [1.45, 1.7, 1.95, 2.2, 2.45, 2.7, 3.0, 3.3]:
    add(sfx, plip(700 + rng.random() * 600), tp, 0.9, pan=rng.random() - 0.5)
# transitions
for s in TL["shots"]:
    tr = s.get("tr")
    if not tr:
        continue
    d = tr["dur"] + 0.6
    add(sfx, whoosh(d), s["start"] - d / 2, 0.75, pan=0.2)
    if tr["type"] in (2, 3):
        add(sfx, impact(0.6), s["start"] - 0.05, 0.75)
    if tr["type"] == 4:
        add(bells, bell(84, 4.0), s["start"] - 0.2, 0.9)
add(sfx, impact(1.2), SHOT["title"]["start"] + 0.2, 1.0)
add(sfx, riser(1.6), SHOT["skins"]["start"] - 1.5, 0.7)
add(sfx, impact(0.8), BEAT["skins.skins"], 0.9)
add(sfx, impact(1.0), BEAT["finale.endcard"], 0.9)
# UI blips on infographic beats
for k, v in BEAT.items():
    if k.startswith("hook") or k in ("finale.endcard",):
        continue
    add(sfx, blip(1700 + 400 * rng.random()), v + 0.05, 0.6, pan=rng.random() * 0.8 - 0.4)
# ambience
def span(a, b):
    return SHOT[a]["start"] - 0.3, SHOT[b]["end"] + 0.3


a, b = span("soil", "harvest")
add(amb, noise_bed(b - a, 150, 900, 0.5) * 0.05, a)
t = a
while t < b:
    for _ in range(int(rng.integers(1, 4))):
        add(amb, chirp(), t + rng.random() * 0.3, 0.9, pan=rng.random() * 1.6 - 0.8)
    t += 0.8 + rng.random() * 1.8
a, b = span("sorting", "sorting")
add(amb, noise_bed(b - a, 60, 300, 0.2) * 0.08, a)
for i in range(int((b - a) / 0.32)):
    add(amb, blip(400, 0.05) * 0.6, a + i * 0.32, 0.5)
a, b = span("vat", "skins")
t = a
while t < b:
    add(amb, bubble(), t, 1.0, pan=rng.random() * 1.4 - 0.7)
    t += 0.03 + rng.random() * 0.12
a, b = span("press", "press")
add(amb, pour(b - a) * 0.6, a + 0.8, 0.8)
a, b = span("cellar", "cellar")
add(amb, noise_bed(b - a, 40, 160, 0.1) * 0.1, a)
for tp in np.arange(a + 1.5, b, 3.7):
    add(amb, plip(1200), tp, 0.35, pan=0.6)
a, b = span("finale", "finale")
fs = SHOT["finale"]["start"]
add(amb, noise_bed(b - a, 2500, 6000, 0.6) * 0.012, a)  # evening insects
add(sfx, pour(BEAT["finale.red"] + 0.8 - BEAT["finale.recap"] + 0.6), BEAT["finale.recap"] - 0.3, 1.0)

# ---------------------------------------------------------------- reverb (synthetic IR)
def reverb(x, secs=2.6, damp=3500):
    n = int(secs * SR)
    t = np.arange(n) / SR
    out = np.zeros_like(x)
    for ch in range(2):
        ir = rng.standard_normal(n) * np.exp(-t * 6.9 / secs)
        ir = lp(ir, damp)
        ir[: int(0.012 * SR)] *= 0
        ir /= np.sqrt(np.sum(ir ** 2))
        out[ch] = signal.fftconvolve(x[ch], ir)[: x.shape[1]]
    return out


music_mix = music + arpbus * 0.9 + bells
music_mix = music_mix + reverb(music_mix * 0.5 + bells * 0.5) * 0.55 + drums
sfx_mix = sfx + reverb(sfx * 0.3, 1.8) * 0.4 + amb

# ---------------------------------------------------------------- narration + ducking
vo = np.zeros(N)
for s in TL["shots"]:
    for v in s["vo"]:
        path = os.path.join(ROOT, "public/vo", v["id"] + ".wav")
        with wave.open(path) as w:
            data = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768
        i0 = int((s["start"] + v["start"]) * SR)
        n = min(len(data), N - i0)
        vo[i0:i0 + n] += data[:n]
env_vo = np.abs(vo)
win = int(0.25 * SR)
cs = np.cumsum(np.concatenate([[0.0], env_vo]))
env_vo = (cs[win:] - cs[:-win]) / win
env_vo = np.concatenate([np.zeros(win // 2), env_vo, np.zeros(N - len(env_vo) - win // 2)])
env_vo = np.clip(env_vo / (np.percentile(env_vo[env_vo > 1e-4], 70) + 1e-9), 0, 1)
duck = 1 - 0.72 * env_vo
duck = signal.lfilter([0.0005], [1, -0.9995], duck) / 1.0  # smooth release
duck = np.clip(duck, 0.28, 1)

final = music_mix * duck * 0.5 + sfx_mix * 0.42
if os.environ.get("STEMS"):
    for name, x in (("music", music_mix * duck * 0.5), ("sfx", sfx_mix * 0.42), ("vo", np.vstack([vo, vo]) * 1.25)):
        with wave.open(f"/tmp/claude-0/stem_{name}.wav", "wb") as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes((np.clip(x.T, -1, 1) * 32767).astype(np.int16).tobytes())
final[0] += vo * 1.25
final[1] += vo * 1.25
# gentle fade at the very end
fade_n = int(2.5 * SR)
final[:, -fade_n:] *= np.linspace(1, 0, fade_n) ** 1.5
# soft clip + normalise
peak = np.max(np.abs(final))
final = np.tanh(final / peak * 1.1) / np.tanh(1.1) * 0.95

os.makedirs(os.path.join(ROOT, "public/audio"), exist_ok=True)
tmp = os.path.join(ROOT, "public/audio/_raw.wav")
with wave.open(tmp, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((final.T * 32767).astype(np.int16).tobytes())
out = os.path.join(ROOT, "public/audio/mix.wav")
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", tmp, "-af", "loudnorm=I=-15:TP=-1.5:LRA=11", "-ar", str(SR), out], check=True)
os.remove(tmp)
print("wrote", out)
