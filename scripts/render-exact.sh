#!/usr/bin/env bash
# Renders a composition losslessly, then encodes it with an explicit BT.709
# conversion so brand colours survive (AVU gold #89764B):
#   <name>-hevc10.mp4  10-bit HEVC, exact colour (iPhone, Mac, Instagram)
#   <name>.mp4         8-bit H.264 for maximum compatibility (±1 in blue)
#
#   scripts/render-exact.sh Spotlight-A-Final out/spotlight-A-final [--browser-executable=...]
set -euo pipefail
comp="$1"; name="$2"; shift 2
seq="$(mktemp -d)"
trap 'rm -rf "$seq"' EXIT

npx remotion render "$comp" "$seq" --sequence --image-format=png "$@"

in=(-framerate 30 -i "$seq/element-%03d.png")
scale="scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int"
tags=(-colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv)

ffmpeg -v error -y "${in[@]}" -vf "$scale,format=yuv420p10le" "${tags[@]}" \
  -c:v libx265 -preset slow -crf 12 -tag:v hvc1 \
  -x265-params "log-level=error:colorprim=bt709:transfer=bt709:colormatrix=bt709" \
  -movflags +faststart "$name-hevc10.mp4"
ffmpeg -v error -y "${in[@]}" -vf "$scale,format=yuv420p" "${tags[@]}" \
  -c:v libx264 -preset slow -crf 12 -movflags +faststart "$name.mp4"
