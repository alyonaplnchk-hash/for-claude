#!/usr/bin/env python3
"""Word-by-word captions + lower third as ASS, matching the Cheval Blanc reference.
Usage: python3 -I captions.py <scratchpad>
"""
import json, re, sys

W = f"{sys.argv[1]}/work"
words = json.load(open(f"{W}/timeline_words.json"))

SANS, SCRIPT = "Didact Gothic", "Great Vibes"
ACCENT = {"figeac", "good", "anniversary", "proud", "highlight", "precision", "balanced", "long", "thank"}
KEEP_CASE = {"château", "figeac", "manoncourt", "i"}
FIX = {"chateau": "Château"}

def clean(w):
    t = re.sub(r"[.,?!]", "", w).strip()
    low = t.lower()
    if low in FIX:
        return FIX[low]
    return t if low in KEEP_CASE else low

# merge "bye" + "-bye"
merged = []
for w in words:
    if w["w"].startswith("-") and merged:
        merged[-1]["w"] += w["w"].rstrip(".,")
        merged[-1]["e"] = w["e"]
    else:
        merged.append(dict(w))

# chunk: phrases split at punctuation, single-word phrases merged forward,
# long phrases split into balanced pieces of at most 3 words
phrases, cur = [], []
for w in merged:
    cur.append(w)
    if re.search(r"[.,?!]$", w["w"]):
        phrases.append(cur)
        cur = []
if cur:
    phrases.append(cur)
joined = []
for ph in phrases:
    if joined and len(joined[-1]) == 1:
        joined[-1] += ph
    else:
        joined.append(ph)
chunks = []
for ph in joined:
    n = -(-len(ph) // 3)
    base, extra = divmod(len(ph), n)
    i = 0
    for k in range(n):
        size = base + (1 if k < extra else 0)
        chunks.append(ph[i:i + size])
        i += size
if len(chunks) > 1 and len(chunks[-1]) == 1 and len(chunks[-2]) < 3:
    last = chunks.pop()
    chunks[-1] += last

def ts(t):
    t = max(t, 0)
    h, r = divmod(t, 3600)
    m, s = divmod(r, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"

TOTAL = 28.88
events = []
for i, ch in enumerate(chunks):
    start = ch[0]["s"]
    nxt = chunks[i + 1][0]["s"] if i + 1 < len(chunks) else TOTAL
    end = min(ch[-1]["e"] + 0.5, nxt)
    parts = []
    for j, w in enumerate(ch):
        until = ch[j + 1]["s"] if j + 1 < len(ch) else w["e"]
        k = max(1, round((until - w["s"]) * 100))
        txt = clean(w["w"])
        if re.sub(r"[^a-z]", "", txt.lower()) in ACCENT:
            parts.append(f"{{\\k{k}\\fn{SCRIPT}\\fs100}}{txt}{{\\fn{SANS}\\fs66}}")
        else:
            parts.append(f"{{\\k{k}}}{txt}")
    events.append(f"Dialogue: 1,{ts(start)},{ts(end)},Cap,,0,0,0,,{{\\fad(80,80)\\blur3}}" + " ".join(parts))

# Lower third while the representative first speaks (v03 starts at 5.64 on the timeline)
L0, L1 = 5.90, 9.70
box = "m 0 0 l 640 0 l 640 156 l 0 156"
events += [
    f"Dialogue: 2,{ts(L0)},{ts(L1)},LT,,0,0,0,,{{\\an7\\pos(70,858)\\p1\\1c&H2A3A44&\\1a&H48&\\bord0\\shad0\\fad(300,300)}}{box}",
    f"Dialogue: 3,{ts(L0+0.15)},{ts(L1)},LT,,0,0,0,,{{\\an7\\clip(70,858,710,1014)\\move(60,880,100,880,0,450)\\fs58\\fad(250,300)}}Château Figeac.",
    f"Dialogue: 3,{ts(L0+0.35)},{ts(L1)},LT,,0,0,0,,{{\\an7\\clip(70,858,710,1014)\\move(60,950,102,950,0,450)\\fs34\\1a&H20&\\fad(250,300)}}1er Grand Cru Classé «A» · Saint-Émilion",
]

header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,{SANS},66,&H00FFFFFF,&H80FFFFFF,&H90000000,&HA0000000,0,0,0,0,100,100,1,0,1,2,1.5,2,80,80,235,1
Style: LT,{SANS},58,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
open(f"{W}/captions.ass", "w").write(header + "\n".join(events) + "\n")
print("\n".join(" ".join(clean(w["w"]) for w in c) for c in chunks))
