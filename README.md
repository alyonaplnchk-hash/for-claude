# Bordeaux: how red wine is made (3D science short)

A ~2-minute 3D explainer film about how red wine is made in Bordeaux. The 3D is rendered with a
custom WebGL2 engine written for this project (no three.js or other 3D library). The infographics are
React/Remotion, the narration is English neural TTS, and the score and sound design are synthesised
in code.

It opens on a hook question in bright colours: *"Squeeze a red grape… and the juice runs clear. So
where does Bordeaux get its deep, ruby red?"* The camera then moves between locations, and the film
answers the question at the fermentation stage.

| # | Shot | What you see |
|---|------|--------------|
| 1 | Hook | A giant grape squeezed between glass plates. The clear juice drips out, then ruby ribbons erupt |
| 2 | Title | A wine vortex with the title card |
| 3 | Map | A relief model of the Gironde built from real coordinates: Garonne, Dordogne, estuary, 45th parallel, Left and Right Bank |
| 4 | Soil | Cut-away blocks of soil: gravel with deep roots and drainage, then clay over limestone |
| 5–7 | Grapes, véraison, harvest | Merlot, Cabernet Sauvignon and Cabernet Franc bunches, berries changing colour, picking crates in the rows |
| 8–10 | Winery | Sorting belt and destemmer, a cut-away fermentation vat, and a macro view of anthocyanins bleeding from the skins |
| 11–12 | Press, cellar | Basket press and malolactic fermentation, then the barrel chai and a cut-away barrique with oxygen |
| 13–14 | Blend, bottle | Left Bank and Right Bank example blends, a pour at sunset, and the end card |

## How it is built

```
src/film/
  engine/      custom WebGL2 renderer: PBR-ish shading, sun shadow maps, procedural materials,
               screen-space refraction for glass, particles, MSAA HDR, bloom, depth of field,
               ACES tone mapping + grading, shot-to-shot transitions (whip, zoom, ink, flash)
  scenes/      one procedural scene per shot (geometry, camera path, lights, grade)
  overlays/    Remotion infographics: callouts pinned to projected 3D points, charts, counters
  timeline.ts  shot lengths derived from the narration clips
  beats.ts     story beats aligned to pauses in the voice track
tools/
  voiceover/   Kokoro-82M TTS (local, no API key) with IPA overrides for French names
  render3d/    renders the 3D layer to public/frames3d/*.jpg in headless Chromium
  audio/       synthesised score + SFX, ducked under the narration -> public/audio/mix.wav
  preview/     quick still previews of any shot (`shot@seconds`)
```

## Rebuild the film

```bash
npm i
```

```bash
(cd tools/voiceover && npm i && node generate.mjs)
```

```bash
node tools/audio/export-timeline.mjs && python3 tools/audio/mix.py
```

```bash
node tools/render3d/render.mjs --workers=3 --scale=0.75
```

```bash
npx remotion render Bordeaux out/bordeaux.mp4
```

`npm run dev` opens Remotion Studio. The `BordeauxLive` composition runs the engine live in the page,
so you can scrub the 3D with the overlays without pre-rendering any frames.

Grape-variety shares and blend percentages on screen are approximate or illustrative, and the film
labels them that way.
