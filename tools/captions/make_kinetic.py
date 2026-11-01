"""Kinetic typography data: the narration split into short phrases, every word timed from Whisper
word timestamps (tools/captions/words.json) and spelled from the script. Key words are flagged so
they can be set as large serif capitals. Writes src/film/kinetic.json.
"""
import difflib
import json
import os
import re

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
narr = json.load(open(os.path.join(ROOT, "src/film/narration.json")))
tl = json.load(open(os.path.join(ROOT, "tools/audio/timeline.json")))
asr = json.load(open(os.path.join(ROOT, "tools/captions/words.json")))
start_of = {v["id"]: (s["start"] + v["start"], s["id"]) for s in tl["shots"] for v in s["vo"]}

SUBS = [
    ("forty-fifth", "45th"),
    ("two hundred and twenty-five liters", "225 litres"),
    ("twelve to twenty-four months", "12–24 months"),
    ("color", "colour"),
    ("favor", "favour"),
    ("liters", "litres"),
]
KEY = {
    "red", "clear", "bordeaux", "ruby", "45th", "garonne", "dordogne", "gironde", "left", "right", "bank",
    "gravel", "heat", "cabernet", "sauvignon", "franc", "merlot", "clay", "limestone", "purple", "sugar",
    "acidity", "september", "hand", "sorted", "destemmed", "crushed", "yeasts", "alcohol", "carbon", "dioxide",
    "answer", "skins", "month", "anthocyanins", "tannins", "pressed", "malic", "oak", "barriques", "225",
    "12–24", "oxygen", "vanilla", "toast", "spice", "blend", "decades", "sun", "soil",
}
FUNC = {"the", "a", "an", "and", "of", "in", "on", "to", "for", "its", "is", "are", "it", "with", "by", "from", "into", "at", "can", "so", "then", "once", "up", "out", "off"}


def norm(w):
    return re.sub(r"[^a-z0-9–]", "", w.lower())


phrases = []
for line in narr["lines"]:
    text = re.sub(r"\[([^\]]+)\]\(/[^/]+/\)", r"\1", line["text"])
    for a, b in SUBS:
        text = text.replace(a, b)
    words = text.split()
    rec = asr[line["id"]]
    t0, shot = start_of[line["id"]]
    sm = difflib.SequenceMatcher(a=[norm(w) for w in words], b=[re.sub(r"[^a-z0-9]", "", r["w"].lower()) for r in rec], autojunk=False)
    times = [None] * len(words)
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op in ("equal", "replace") and j2 > j1:
            for k in range(i2 - i1):
                j = j1 + min(k * (j2 - j1) // max(i2 - i1, 1), j2 - j1 - 1)
                times[i1 + k] = (rec[j]["s"], rec[j]["e"])
    for i, tm in enumerate(times):
        if tm is None:
            prev = next((times[k] for k in range(i - 1, -1, -1) if times[k]), (0, 0))
            nxt = next((times[k] for k in range(i + 1, len(times)) if times[k]), (prev[1] + 0.3, prev[1] + 0.6))
            times[i] = (prev[1], nxt[0])
    # phrases: break at punctuation, and keep blocks short (<= 6 words)
    cur = []
    blocks = []
    for i, w in enumerate(words):
        cur.append(i)
        stop = bool(re.search(r"[.;:?!…]$", w))
        comma = w.endswith(",")
        glue = norm(w) in ("cabernet", "carbon", "left", "right", "french", "the", "a")
        if stop or (comma and len(cur) >= 3) or (not glue and len(cur) >= 6) or len(cur) >= 8 or (len(cur) >= 5 and i + 1 < len(words) and norm(words[i + 1]) in FUNC and len(words) - i > 3):
            blocks.append(cur)
            cur = []
    if cur:
        blocks.append(cur)
    for blk in blocks:
        ws = []
        for i in blk:
            raw = words[i]
            clean = re.sub(r"[,;:!]+$", "", raw).replace("...", "…")
            key = norm(raw) in KEY
            if norm(raw) in ("left", "right"):
                key = i + 1 < len(words) and norm(words[i + 1]).startswith("bank")
            if norm(raw).startswith("bank"):
                key = i > 0 and norm(words[i - 1]) in ("left", "right")
            ws.append({"t": clean, "s": round(t0 + times[i][0], 3), "k": key})
        phrases.append({"shot": shot, "line": line["id"], "start": ws[0]["s"] - 0.05, "end": round(t0 + times[blk[-1]][1] + 0.5, 3), "words": ws})

phrases.sort(key=lambda p: p["start"])
for a, b in zip(phrases, phrases[1:]):
    if b["line"] == a["line"] or b["start"] - a["end"] < 0.4:
        a["end"] = min(max(a["end"], b["start"]), b["start"] + 0.0)
for p in phrases:
    p["start"], p["end"] = round(p["start"], 3), round(p["end"], 3)
json.dump(phrases, open(os.path.join(ROOT, "src/film/kinetic.json"), "w"), ensure_ascii=False, indent=0)
print(len(phrases), "phrases")
for p in phrases[:14]:
    print(round(p["start"], 2), round(p["end"], 2), " ".join(("[" + w["t"] + "]") if w["k"] else w["t"] for w in p["words"]))
