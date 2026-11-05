#!/usr/bin/env bash
# Renders a transparent overlay (e.g. a map) with its alpha channel:
#   <name>.mov   ProRes 4444 with alpha — for CapCut / Premiere / Final Cut
#   <name>.webm  VP9 with alpha — small file, also keeps transparency
#
#   scripts/render-alpha.sh PS-CarmesHautBrion-Map-CapeTown out/PS-CarmesHautBrion/map-capetown
set -euo pipefail
comp="$1"; name="$2"; shift 2
seq="$(mktemp -d "${TMPDIR:-/tmp}/remotion_seq_XXXXXX")"
trap 'rm -rf "$seq"' EXIT

case " $* " in
  *--browser-executable*) ;;
  *)
    hs=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
    [ -x "$hs" ] && set -- "$@" --browser-executable="$hs"
    ;;
esac

# PNG frames keep the transparent background
npx remotion render "$comp" "$seq" --sequence --image-format=png "$@"

in=(-framerate 30 -pattern_type glob -i "$seq/element-*.png")
tags=(-colorspace bt709 -color_primaries bt709 -color_trc bt709)

ffmpeg -v error -y "${in[@]}" \
  -vf "scale=out_color_matrix=bt709:flags=accurate_rnd+full_chroma_int,format=yuva444p10le" \
  "${tags[@]}" -c:v prores_ks -profile:v 4444 -alpha_bits 16 -vendor apl0 \
  "$name.mov"
ffmpeg -v error -y "${in[@]}" \
  -vf "scale=out_color_matrix=bt709:flags=accurate_rnd+full_chroma_int,format=yuva420p" \
  "${tags[@]}" -c:v libvpx-vp9 -b:v 0 -crf 18 -row-mt 1 -auto-alt-ref 0 \
  "$name.webm"
