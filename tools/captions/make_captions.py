"""Builds on-screen captions from the narration.

Splits each line into short phrases at punctuation and times them against the speech
segments found by ffmpeg silencedetect, so captions change on the natural pauses.
Needs tools/audio/timeline.json (node tools/audio/export-timeline.mjs). Writes src/film/captions.json.
"""
import json
import os
import re
import subprocess

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
narr = json.load(open(os.path.join(ROOT, "src/film/narration.json")))
tl = json.load(open(os.path.join(ROOT, "tools/audio/timeline.json")))
start_of = {}
for s in tl["shots"]:
    for v in s["vo"]:
        start_of[v["id"]] = (s["start"] + v["start"], v["dur"], s["id"])

MAXC = 34  # characters per caption line on a phone


def silences(path):
    out = subprocess.run(["ffmpeg", "-hide_banner", "-i", path, "-af", "silencedetect=noise=-38dB:d=0.12", "-f", "null", "-"], capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", out)]
    en = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", out)]
    return list(zip(st, en))


NUMERALS = [("forty-fifth", "45th"), ("two hundred and twenty-five liters", "225 liters"), ("twelve to twenty-four months", "12 to 24 months")]


def phrases(text):
    text = re.sub(r"\[([^\]]+)\]\(/[^/]+/\)", r"\1", text)
    for a, b in NUMERALS:
        text = text.replace(a, b)
    parts = [p.strip() for p in re.findall(r"[^,.;:?!…]+(?:\.\.\.|[,.;:?!…])?", text) if p.strip()]
    # merge tiny fragments with their neighbour
    out = []
    for p in parts:
        if out and (len(p) < 12 or len(out[-1]) < 12) and len(out[-1]) + len(p) < MAXC * 2:
            out[-1] = out[-1] + " " + p
        else:
            out.append(p)
    return out


def wrap(p):
    if len(p) <= MAXC:
        return p
    words = p.split()
    best = None
    for i in range(1, len(words)):
        a, b = " ".join(words[:i]), " ".join(words[i:])
        score = max(len(a), len(b))
        if best is None or score < best[0]:
            best = (score, a + "\n" + b)
    return best[1]


caps = []
for line in narr["lines"]:
    g0, dur, shot = start_of[line["id"]]
    sil = silences(os.path.join(ROOT, "public/vo", line["id"] + ".wav"))
    ph = phrases(line["text"])
    # speech boundaries: pause midpoints
    cuts = [(a + b) / 2 for a, b in sil if 0.2 < a < dur - 0.2]
    total = sum(len(p) for p in ph)
    t = 0.0
    bounds = [0.0]
    acc = 0
    for p in ph[:-1]:
        acc += len(p)
        guess = dur * acc / total
        near = min(cuts, key=lambda c: abs(c - guess)) if cuts else guess
        bounds.append(near if abs(near - guess) < 0.6 and near > bounds[-1] + 0.4 else guess)
    bounds.append(dur)
    for i, p in enumerate(ph):
        caps.append({"shot": shot, "start": round(g0 + bounds[i], 3), "end": round(g0 + bounds[i + 1] + 0.12, 3), "text": wrap(p)})

json.dump(caps, open(os.path.join(ROOT, "src/film/captions.json"), "w"), indent=1, ensure_ascii=False)
print(len(caps), "captions")
for c in caps[:8]:
    print(c)
