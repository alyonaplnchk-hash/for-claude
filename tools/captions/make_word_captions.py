"""Word-by-word captions: one or two words at a time, timed from Whisper word timestamps
(tools/captions/words.json) but spelled from the script. Writes src/film/captions_words.json.
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

SKIP = {"hook1", "hook2", "ferm2", "end1"}  # already set as large type on screen
SUBS = [
    ("forty-fifth", "45th"),
    ("two hundred and twenty-five liters", "225 litres"),
    ("twelve to twenty-four months", "12 to 24 months"),
    ("south-west", "south-west"),
    ("color", "colour"),
    ("favor", "favour"),
    ("liters", "litres"),
]
PAIRS = {("cabernet", "sauvignon"), ("cabernet", "franc"), ("left", "bank"), ("right", "bank"), ("french", "oak"), ("carbon", "dioxide"), ("gironde", "estuary"), ("malic", "acid")}
FUNC = {"the", "a", "an", "and", "of", "in", "on", "to", "for", "its", "is", "are", "it", "with", "by", "from", "into", "at", "can", "so", "then", "once", "up", "out", "off", "each"}
ACCENT = {"bordeaux", "garonne", "dordogne", "gironde", "45th", "cabernet", "sauvignon", "franc", "merlot", "gravel", "clay", "limestone", "september", "anthocyanins", "tannins", "malic", "oak", "oxygen", "vanilla", "toast", "spice", "225", "12", "24", "blend", "decades", "skins", "purple", "alcohol"}


def norm(w):
    return re.sub(r"[^a-z0-9]", "", w.lower().replace("’", "'"))


caps = []
for line in narr["lines"]:
    if line["id"] in SKIP:
        continue
    text = re.sub(r"\[([^\]]+)\]\(/[^/]+/\)", r"\1", line["text"])
    for a, b in SUBS:
        text = text.replace(a, b)
    words = text.split()
    rec = asr[line["id"]]
    t0, shot = start_of[line["id"]]
    # align script words to recognised words
    sm = difflib.SequenceMatcher(a=[norm(w) for w in words], b=[norm(r["w"]) for r in rec], autojunk=False)
    times = [None] * len(words)
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op in ("equal", "replace"):
            for k in range(i2 - i1):
                j = j1 + min(k * (j2 - j1) // max(i2 - i1, 1), j2 - j1 - 1) if j2 > j1 else None
                if j is not None:
                    times[i1 + k] = (rec[j]["s"], rec[j]["e"])
    # fill gaps by interpolation
    for i, tm in enumerate(times):
        if tm is None:
            prev = next((times[k] for k in range(i - 1, -1, -1) if times[k]), (0, 0))
            nxt = next((times[k] for k in range(i + 1, len(times)) if times[k]), (prev[1] + 0.3, prev[1] + 0.6))
            times[i] = (prev[1], nxt[0])
    # group into one- or two-word chunks: function words lean on the next word,
    # names that belong together stay together, a phrase never runs over punctuation
    def ends(k):
        return bool(re.search(r"[,.;:?!…]$", words[k]))

    def pair_at(k):
        return k + 1 < len(words) and (norm(words[k]), norm(words[k + 1])) in PAIRS and not ends(k)

    i = 0
    chunks = []
    while i < len(words):
        group = [i]
        j = i + 1
        if j < len(words) and not ends(i):
            gap = times[j][0] - times[i][1]
            if pair_at(i):
                group.append(j)
            elif pair_at(j):
                pass
            elif norm(words[i]) in FUNC and gap < 0.45:
                group.append(j)
            elif norm(words[j]) not in FUNC and ends(j) and len(words[i]) + len(words[j]) <= 14 and gap < 0.3:
                group.append(j)
        chunks.append(group)
        i += len(group)
    for k, g in enumerate(chunks):
        s = times[g[0]][0]
        last_end = times[g[-1]][1]
        nxt = times[chunks[k + 1][0]][0] if k + 1 < len(chunks) else None
        e = nxt if nxt is not None and nxt - last_end < 0.7 else last_end + 0.35
        toks = []
        for idx in g:
            raw = words[idx]
            clean = re.sub(r"[,.;:!…]+$", "", raw).replace("...", "")
            toks.append({"t": clean, "a": norm(raw) in ACCENT})
        caps.append({"shot": shot, "start": round(t0 + s - 0.04, 3), "end": round(t0 + e - 0.02, 3), "words": toks})

caps.sort(key=lambda c: c["start"])
for a, b in zip(caps, caps[1:]):
    a["end"] = min(a["end"], b["start"])
# no flash shorter than a quarter of a second: merge two single words, or borrow time from the next chunk
MIN = 0.26
i = 0
while i < len(caps) - 1:
    c, n = caps[i], caps[i + 1]
    d = c["end"] - c["start"]
    if d < MIN and n["start"] - c["end"] < 0.05:
        if len(c["words"]) + len(n["words"]) <= 2:
            c["words"] += n["words"]
            c["end"] = n["end"]
            caps.pop(i + 1)
            continue
        shift = MIN - d
        if n["end"] - n["start"] > shift + 0.2:
            c["end"] += shift
            n["start"] += shift
    i += 1
for c in caps:
    c["start"], c["end"] = round(c["start"], 3), round(c["end"], 3)
json.dump(caps, open(os.path.join(ROOT, "src/film/captions_words.json"), "w"), indent=0, ensure_ascii=False)
print(len(caps), "chunks")
print(" | ".join(" ".join(t["t"] for t in c["words"]) for c in caps[:40]))
