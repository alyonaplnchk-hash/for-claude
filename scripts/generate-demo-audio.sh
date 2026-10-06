#!/usr/bin/env bash
# Regenerates the royalty-free demo audio in public/audio/ using FFmpeg.
# The sounds are synthesized from scratch, so they are safe to ship and edit.
# Usage: bash scripts/generate-demo-audio.sh
set -euo pipefail

OUT_DIR="$(cd "$(dirname "$0")/.." && pwd)/public/audio"
mkdir -p "$OUT_DIR"

# 20 s ambient pad: an Am9 voicing of soft sines with a slow tremolo,
# long fade in/out, mixed down to mono.
ffmpeg -y -hide_banner -loglevel error \
  -f lavfi -i "sine=frequency=110:duration=20" \
  -f lavfi -i "sine=frequency=220:duration=20" \
  -f lavfi -i "sine=frequency=261.63:duration=20" \
  -f lavfi -i "sine=frequency=329.63:duration=20" \
  -f lavfi -i "sine=frequency=493.88:duration=20" \
  -filter_complex "[0]volume=0.55[a0];[1]volume=0.35[a1];[2]volume=0.28[a2];[3]volume=0.24[a3];[4]volume=0.14[a4];\
[a0][a1][a2][a3][a4]amix=inputs=5:normalize=0,tremolo=f=0.25:d=0.35,lowpass=f=1800,\
afade=t=in:d=2,afade=t=out:st=17:d=3,volume=0.9,volume=12dB" \
  -ac 1 -ar 44100 -c:a libmp3lame -b:a 128k "$OUT_DIR/ambient-pad.mp3"

# 0.7 s whoosh: band-limited pink noise with a swelling envelope.
ffmpeg -y -hide_banner -loglevel error \
  -f lavfi -i "anoisesrc=color=pink:duration=0.7:amplitude=0.6:seed=42" \
  -af "highpass=f=400,lowpass=f=4500,afade=t=in:d=0.45:curve=qsin,afade=t=out:st=0.45:d=0.25:curve=exp,volume=0.8,volume=12dB" \
  -ac 1 -ar 44100 -c:a libmp3lame -b:a 128k "$OUT_DIR/whoosh.mp3"

# 0.2 s pop: a short pitched blip with an exponential decay.
ffmpeg -y -hide_banner -loglevel error \
  -f lavfi -i "sine=frequency=740:duration=0.2" \
  -af "afade=t=in:d=0.005,afade=t=out:st=0.01:d=0.19:curve=exp,volume=0.7,volume=16dB" \
  -ac 1 -ar 44100 -c:a libmp3lame -b:a 128k "$OUT_DIR/pop.mp3"

# --- AVU Wine Stories intro -------------------------------------------------

# 9 s warm pad: a low D major add9 voicing with slightly detuned doubles for
# a soft chorus, slow tremolo, gentle swell and long tail.
ffmpeg -y -hide_banner -loglevel error \
  -f lavfi -i "sine=frequency=73.42:duration=9" \
  -f lavfi -i "sine=frequency=73.62:duration=9" \
  -f lavfi -i "sine=frequency=146.83:duration=9" \
  -f lavfi -i "sine=frequency=220:duration=9" \
  -f lavfi -i "sine=frequency=220.6:duration=9" \
  -f lavfi -i "sine=frequency=293.66:duration=9" \
  -f lavfi -i "sine=frequency=369.99:duration=9" \
  -f lavfi -i "sine=frequency=659.25:duration=9" \
  -filter_complex "[0]volume=0.5[a0];[1]volume=0.35[a1];[2]volume=0.4[a2];[3]volume=0.3[a3];[4]volume=0.2[a4];\
[5]volume=0.22[a5];[6]volume=0.16[a6];[7]volume=0.06[a7];\
[a0][a1][a2][a3][a4][a5][a6][a7]amix=inputs=8:normalize=0,tremolo=f=0.18:d=0.25,lowpass=f=1400,\
afade=t=in:d=2.5:curve=qsin,afade=t=out:st=6:d=3,volume=10dB" \
  -ac 1 -ar 44100 -c:a libmp3lame -b:a 160k "$OUT_DIR/avu-pad.mp3"

# 3.5 s wine-glass chime: inharmonic partials with exponential decays,
# a slow beat between two close fundamentals, and a small room echo.
ffmpeg -y -hide_banner -loglevel error \
  -f lavfi -i "aevalsrc='(0.5*sin(2*PI*1480*t)+0.35*sin(2*PI*1483.5*t))*exp(-1.6*t)+0.4*sin(2*PI*3434*t)*exp(-3*t)+0.18*sin(2*PI*6290*t)*exp(-5*t)+0.08*sin(2*PI*10064*t)*exp(-8*t)':s=44100:d=3.5" \
  -af "afade=t=in:d=0.004,aecho=0.8:0.55:47|97|163:0.28|0.18|0.1,afade=t=out:st=2.6:d=0.9,volume=3dB" \
  -ac 1 -ar 44100 -c:a libmp3lame -b:a 160k "$OUT_DIR/glass-chime.mp3"

echo "Wrote demo audio to $OUT_DIR"
