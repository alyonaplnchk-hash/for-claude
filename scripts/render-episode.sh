#!/usr/bin/env bash
# Renders every composition of one episode (see src/episodes.ts) with exact
# brand colour, into out/<episode-id>/:
#   scripts/render-episode.sh PS-LynchBages
# Each part comes out twice: <part>-hevc10.mp4 (exact colour) and <part>.mp4.
set -euo pipefail
cd "$(dirname "$0")/.."
episode="$1"
outdir="out/$episode"
mkdir -p "$outdir"

browser=()
hs=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
[ -x "$hs" ] && browser=(--browser-executable="$hs")

ids=$(npx remotion compositions --quiet "${browser[@]}" 2>/dev/null | tr ' ' '\n' | grep "^$episode-" || true)
if [ -z "$ids" ]; then
  echo "No compositions found for episode '$episode' — check its id in src/episodes.ts" >&2
  exit 1
fi

for id in $ids; do
  part="${id#"$episode"-}"            # e.g. 0-Intro, 1-Card, 9-Outro
  name="$(echo "$episode-$part" | tr '[:upper:]' '[:lower:]')"
  echo "→ $id"
  scripts/render-exact.sh "$id" "$outdir/$name" "${browser[@]}"
done
ls -la "$outdir"
