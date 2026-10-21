#!/usr/bin/env python3
"""Château Figeac interview cut, styled after the Cheval Blanc reference.
Usage: python3 -I build.py <scratchpad>
"""
import json, os, subprocess, sys

S = sys.argv[1]
SRC, W = f"{S}/src", f"{S}/work"
OUT = f"{W}/seg"
os.makedirs(OUT, exist_ok=True)
FPS = 25

# Grade for the Sony interview: lift the backlit shadows a touch, keep it warm.
GRADE = "eq=gamma=1.12:contrast=1.04:saturation=1.06,colorbalance=rm=0.03:bm=-0.03"
# iPhone HLG -> SDR bt709
HLG = ("zscale=t=linear:npl=180,format=gbrpf32le,zscale=p=bt709,"
       "tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p")
TS = "crop=2560:1440:640:430,scale=1920:1080:flags=lanczos"   # two-shot
CU = "crop=1920:1080:780:500"                                  # rep close-up

def run(cmd):
    subprocess.run(cmd, check=True)

def interview(name, t0, dur, framing):
    run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t0}", "-i", f"{SRC}/C0188.MP4", "-t", f"{dur}",
         "-vf", f"{framing},{GRADE},fps={FPS},format=yuv420p", "-an",
         "-c:v", "libx264", "-crf", "14", "-preset", "fast", f"{OUT}/{name}.mp4"])

def iphone(name, clip, t0, dur, y, slow=1.0):
    # rotated portrait 2160x3840 -> 16:9 band, optional slow motion (source is 120fps)
    src_dur = dur / slow + 0.1
    run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t0}", "-t", f"{src_dur}", "-i", f"{SRC}/{clip}",
         "-vf", f"{HLG},crop=2160:1215:0:{y},scale=1920:1080:flags=lanczos,"
                f"setpts={slow}*PTS,fps={FPS},{GRADE},trim=duration={dur},format=yuv420p",
         "-an", "-c:v", "libx264", "-crf", "14", "-preset", "fast", f"{OUT}/{name}.mp4"])

def photo(name, img, dur, y_frac, zoom_in=True):
    # 16:9 band from the photo, slow Ken Burns push
    frames = round(dur * FPS)
    z = f"1+0.07*on/{frames}" if zoom_in else f"1.07-0.07*on/{frames}"
    run(["ffmpeg", "-v", "error", "-y", "-loop", "1", "-i", f"{W}/img/{img}.jpg",
         "-vf", f"crop=iw:iw*9/16:0:(ih-iw*9/16)*{y_frac},scale=3840:2160,"
                f"zoompan=z='{z}':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d={frames}:s=1920x1080:fps={FPS},"
                f"eq=saturation=1.04,format=yuv420p",
         "-frames:v", f"{frames}", "-c:v", "libx264", "-crf", "14", "-preset", "fast", f"{OUT}/{name}.mp4"])

# Audio segments from the interview (source seconds)
AUDIO = [
    (0.00, 1.40),     # So, Château Figeac,
    (5.72, 9.96),     # we speak about 23 vintage, that is a very good vintage
    (16.84, 22.40),   # it's the 130th anniversary for the vintage of Manoncourt family
    (28.44, 34.76),   # we are proud to present the 23 today ... a highlight for us
    (63.60, 67.00),   # we harvest with a lot of precision, but very, very fast
    (75.36, 78.96),   # a vintage that produces wines that are much more balanced
    (84.00, 86.44),   # you can keep in the cellar for a long time
    (117.44, 119.36), # Thank you for coming, bye-bye
]

# Video track, in edit order (each piece's duration sums to the audio above)
VIDEO = [
    ("v01", lambda n: interview(n, 0.00, 1.40, TS)),
    ("v02", lambda n: photo(n, "IMG_2707", 4.24, 0.40)),
    ("v03", lambda n: interview(n, 16.84, 3.08, CU)),
    ("v04", lambda n: interview(n, 19.92, 2.48, TS)),
    ("v05", lambda n: interview(n, 28.44, 2.96, CU)),
    ("v06", lambda n: iphone(n, "IMG_2837.MOV", 0.3, 3.36, 800)),
    ("v07", lambda n: iphone(n, "IMG_2838.MOV", 0.2, 3.40, 1250, slow=2.0)),
    ("v08", lambda n: interview(n, 75.36, 3.60, TS)),
    ("v09", lambda n: photo(n, "IMG_2710", 2.44, 0.55, zoom_in=False)),
    ("v10", lambda n: interview(n, 117.44, 1.92, TS)),
]

if "--skip-video" not in sys.argv:
    for name, fn in VIDEO:
        fn(name)

with open(f"{OUT}/list.txt", "w") as f:
    for name, _ in VIDEO:
        f.write(f"file '{OUT}/{name}.mp4'\n")
run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", f"{OUT}/list.txt",
     "-c", "copy", f"{W}/video_raw.mp4"])

# Audio: cut each piece with short fades so the joins don't click, then loudness-normalise.
parts, labels = [], []
for i, (a, b) in enumerate(AUDIO):
    d = b - a
    parts.append(f"[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS,"
                 f"afade=t=in:d=0.04,afade=t=out:st={d-0.06:.3f}:d=0.06[a{i}]")
    labels.append(f"[a{i}]")
total = sum(b - a for a, b in AUDIO)
fc = ";".join(parts) + f";{''.join(labels)}concat=n={len(AUDIO)}:v=0:a=1," \
     f"highpass=f=80,loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=out:st={total-0.5:.2f}:d=0.5[aout]"
run(["ffmpeg", "-v", "error", "-y", "-i", f"{SRC}/C0188.MP4", "-filter_complex", fc,
     "-map", "[aout]", "-ar", "48000", "-c:a", "pcm_s16le", f"{W}/audio.wav"])

# Captions: map source word times onto the edit timeline
words = [w for s in json.load(open(f"{W}/c0188L.json")) for w in s["words"]]
timeline, off = [], 0.0
for a, b in AUDIO:
    for w in words:
        mid = (w["s"] + w["e"]) / 2
        if a <= mid < b:
            timeline.append({"w": w["w"].strip(), "s": max(w["s"], a) - a + off,
                             "e": min(w["e"], b) - a + off})
    off += b - a
json.dump(timeline, open(f"{W}/timeline_words.json", "w"), ensure_ascii=False, indent=1)
print(f"total {total:.2f}s, {len(timeline)} words")
