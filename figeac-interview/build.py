#!/usr/bin/env python3
"""Château Figeac interview cut, v2 (no captions).
Usage: python3 -I build2.py <scratchpad> [--skip-video]
"""
import io, json, os, re, subprocess, sys
import numpy as np
from PIL import Image, ImageCms, ImageOps
import pillow_heif

S = sys.argv[1]
SRC, W = f"{S}/src", f"{S}/work"
OUT = f"{W}/seg2"
os.makedirs(OUT, exist_ok=True)
FPS = 25
ENC = ["-c:v", "libx264", "-crf", "10", "-preset", "medium", "-pix_fmt", "yuv420p",
       "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709"]

GRADE = "eq=gamma=1.12:contrast=1.04:saturation=1.06,colorbalance=rm=0.03:bm=-0.03"
# the Sony interview is backlit by the windows: lift the mids a little more
GRADE_SONY = GRADE + ",curves=master='0/0 0.3/0.34 0.6/0.65 1/1'"
HLG = ("zscale=t=linear:npl=180,format=gbrpf32le,zscale=p=bt709,"
       "tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p")
TS = "crop=2560:1440:640:430,scale=1920:1080:flags=lanczos"   # two-shot
CU = "crop=1920:1080:780:500"                                  # representative close-up


def run(cmd):
    subprocess.run(cmd, check=True)


def frames(d):
    return round(d * FPS)


def interview(name, t0, dur, framing):
    run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t0}", "-i", f"{SRC}/C0188.MP4",
         "-vf", f"{framing},{GRADE_SONY},fps={FPS}", "-frames:v", f"{frames(dur)}", "-an", *ENC,
         f"{OUT}/{name}.mp4"])


def iphone(name, clip, t0, dur, y, slow=1.0):
    # 120fps portrait HLG -> SDR 16:9 band; blend frames for a natural 25fps shutter
    blend = 3 if slow == 1.0 else 2
    run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t0}", "-t", f"{dur / slow + 0.3}",
         "-i", f"{SRC}/{clip}",
         "-vf", f"crop=2160:1215:0:{y},{HLG},setpts={slow}*PTS,tmix=frames={blend},"
                f"fps={FPS},scale=1920:1080:flags=lanczos,{GRADE}",
         "-frames:v", f"{frames(dur)}", "-an", *ENC, f"{OUT}/{name}.mp4"])


pillow_heif.register_heif_opener()
SRGB = ImageCms.createProfile("sRGB")


def load_photo(img):
    im = Image.open(f"{SRC}/{img}.HEIC")
    icc = im.info.get("icc_profile")
    im = ImageOps.exif_transpose(im).convert("RGB")
    if icc:  # iPhone photos are Display P3
        im = ImageCms.profileToProfile(im, ImageCms.ImageCmsProfile(io.BytesIO(icc)), SRGB)
    return im


def photo(name, img, dur, y_frac, z0, z1, dx=0.0):
    """Ken Burns with sub-pixel sampling (no zoompan jitter)."""
    im = load_photo(img)
    bh = im.width * 9 / 16
    band = im.crop((0, round((im.height - bh) * y_frac), im.width, round((im.height - bh) * y_frac + bh)))
    base = band.resize((2304, 1296), Image.Resampling.LANCZOS)   # 1.2x the output
    n = frames(dur)
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
                          "-s", "1920x1080", "-r", f"{FPS}", "-i", "-",
                          "-vf", "scale=out_color_matrix=bt709:out_range=tv,eq=saturation=1.03",
                          *ENC, f"{OUT}/{name}.mp4"], stdin=subprocess.PIPE)
    for i in range(n):
        t = i / max(n - 1, 1)
        z = z0 + (z1 - z0) * t                     # zoom relative to the 1.2x base
        w, h = 2304 / (1.2 * z), 1296 / (1.2 * z)
        cx = 1152 + dx * 2304 * (t - 0.5)
        x0, y0 = cx - w / 2, 648 - h / 2
        fr = base.transform((1920, 1080), Image.Transform.EXTENT, (x0, y0, x0 + w, y0 + h),
                            Image.Resampling.BICUBIC)
        p.stdin.write(fr.tobytes())
    p.stdin.close()
    assert p.wait() == 0


def ending(name, t0, ts_dur, xf, hero_dur, black):
    """Hold the two-shot on the smile, dissolve to the bottles, fade to black."""
    interview(f"{name}_ts", t0, ts_dur, TS)
    photo(f"{name}_hero", "IMG_2710", hero_dur, 0.55, 0.94, 1.02)
    total = ts_dur - xf + hero_dur
    run(["ffmpeg", "-v", "error", "-y", "-i", f"{OUT}/{name}_ts.mp4", "-i", f"{OUT}/{name}_hero.mp4",
         "-filter_complex", f"[0:v][1:v]xfade=transition=fade:duration={xf}:offset={ts_dur - xf},"
                            f"fade=t=out:st={total - black}:d={black}",
         "-frames:v", f"{frames(total)}", *ENC, f"{OUT}/{name}.mp4"])


# (audio in, audio out, video pieces) — piece durations sum to the audio length.
# Cut points sit in real pauses/closures (checked on the spectrogram and by transcribing each piece).
EDIT = [
    (0.00, 1.48, [("v01", lambda n: interview(n, 0.00, 1.48, TS))]),                 # So, Château Figeac,
    (7.19, 9.95, [("v02", lambda n: photo(n, "IMG_2707", 2.76, 0.45, 0.90, 0.97))]),  # 23 vintage, that is a very good vintage
    (16.80, 19.76, [("v03", lambda n: interview(n, 16.80, 2.96, CU))]),              # it's the 130th anniversary
    (20.98, 22.30, [("v04", lambda n: interview(n, 20.98, 1.32, TS))]),              # for the vintage of Manoncourt family
    (28.66, 34.86, [("v05", lambda n: interview(n, 28.66, 2.60, CU)),                # we are proud to present the 23 today,
                    ("v06", lambda n: iphone(n, "IMG_2837.MOV", 0.10, 3.60, 800))]), # because it was a big success and a highlight for us
    (63.81, 67.17, [("v07", lambda n: iphone(n, "IMG_2838.MOV", 0.20, 3.36, 1330, slow=2.0))]),  # we harvest with precision, very fast
    (75.50, 79.06, [("v08", lambda n: interview(n, 75.50, 3.56, TS))]),              # a vintage ... much more balanced
    (84.48, 86.48, [("v09", lambda n: photo(n, "IMG_2709", 2.00, 0.60, 0.98, 0.90))]),  # you can keep in the cellar for a long time
    (117.84, 121.40, [("v10", lambda n: ending(n, 117.84, 3.90, 0.70, 2.64, 1.00))]),   # thank you for coming, bye-bye / my pleasure + smiles
]
# Room tone from pauses in the same take, to carry the sound under the closing dissolve
# (the source continues with an off-camera voice right after 121.4 s).
TAIL = [(117.30, 117.82), (35.05, 35.80), (4.92, 5.30), (27.62, 27.94), (63.22, 63.53)]
FADE_OUT = 2.4

if "--skip-video" not in sys.argv:
    for _, _, pieces in EDIT:
        for name, fn in pieces:
            fn(name)

names = [n for _, _, pieces in EDIT for n, _ in pieces]
with open(f"{OUT}/list.txt", "w") as f:
    f.writelines(f"file '{OUT}/{n}.mp4'\n" for n in names)
run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", f"{OUT}/list.txt",
     "-c", "copy", f"{W}/video2_raw.mp4"])

# Audio: joins are short crossfades placed in the pauses, so the room tone never dips.
X = 0.04
pieces = [(a, b) for a, b, _ in EDIT] + TAIL
inputs, labels = [], []
for i, (a, b) in enumerate(pieces):
    a2 = a - X / 2 if i > 0 else a
    b2 = b + X / 2 if i < len(pieces) - 1 else b
    run(["ffmpeg", "-v", "error", "-y", "-ss", f"{a2:.3f}", "-t", f"{b2 - a2:.3f}", "-i", f"{W}/full48.wav",
         "-ac", "1", "-c:a", "pcm_s24le", f"{OUT}/a{i:02d}.wav"])
    inputs += ["-i", f"{OUT}/a{i:02d}.wav"]
    labels.append(f"{i}:a")
parts = []
chain, prev = [], labels[0]
for i, lab in enumerate(labels[1:], 1):
    chain.append(f"[{prev}][{lab}]acrossfade=d={X}:c1=qsin:c2=qsin[x{i}]")
    prev = f"x{i}"
total = sum(b - a for a, b in pieces)
clean = (f"[{prev}]highpass=f=80,afftdn=nr=6:nf=-56,"
         "equalizer=f=250:t=q:w=1.2:g=-2,equalizer=f=3500:t=q:w=1.0:g=2,"
         "acompressor=threshold=-22dB:ratio=2.2:attack=8:release=180:makeup=2,"
         f"afade=t=in:d=0.06,afade=t=out:st={total - FADE_OUT:.2f}:d={FADE_OUT}:curve=qsin")
fc = ";".join(chain) + ";" + clean
run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", fc + "[pre]",
     "-map", "[pre]", "-c:a", "pcm_s24le", f"{W}/audio2_pre.wav"])

# loudness: -17 LUFS mono = -14 LUFS once duplicated to stereo; peak limit at -1 dBFS
m = subprocess.run(["ffmpeg", "-hide_banner", "-i", f"{W}/audio2_pre.wav", "-af", "ebur128", "-f", "null", "-"],
                   capture_output=True, text=True).stderr
li = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", m)[-1])
run(["ffmpeg", "-v", "error", "-y", "-i", f"{W}/audio2_pre.wav", "-af",
     f"volume={-17 - li:.2f}dB,alimiter=limit=0.89:attack=2:release=50:level=false,"
     "aresample=48000,pan=stereo|c0=c0|c1=c0", "-c:a", "pcm_s16le", f"{W}/audio2.wav"])
print(f"total {total:.2f}s; loudness in {li} LUFS")
