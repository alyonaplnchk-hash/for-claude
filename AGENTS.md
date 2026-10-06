# AGENTS.md — Remotion motion graphics project

Instructions for AI coding agents (Claude Code, Codex, Cursor, …) working in
this repo. Videos here are **React components rendered frame by frame** with
[Remotion](https://www.remotion.dev/docs/). Read this file before you write code.

- **Remotion:** 4.0.533. Every `remotion` / `@remotion/*` package is pinned to this exact version.
- **Package manager:** npm (`package-lock.json`). Don't mix in other lockfiles.
- **Language:** TypeScript + React 19. Styling is inline `style` objects. Tailwind v4 is also wired up (`src/index.css`).

## Load the Remotion skill first

Remotion's official Agent Skills live in `.agents/skills/remotion-best-practices/`.
`.claude/skills/` symlinks to them. **Load `remotion-best-practices` before you
write or change Remotion code.** It routes to focused guides:
`remotion-markup` (animation, text, media, fonts), `remotion-interactivity`
(Studio-editable markup), `remotion-render`, `remotion-studio`,
`remotion-captions`, `remotion-docs` (searches the official docs), and others.

Update the skills with `npx remotion skills update`. Update Remotion and the skills together with `npm run upgrade`.

## Commands

| Task | Command |
| --- | --- |
| Install dependencies | `npm install` |
| Open Remotion Studio (preview) | `npm run dev` (add `-- --no-open` for headless; open a composition at `http://localhost:3000/<id>`) |
| List compositions | `npm run compositions` |
| Render the sample to MP4 | `npm run render` → `out/showcase.mp4` |
| Render any composition | `npx remotion render <id> out/<name>.mp4` |
| Render one frame (visual check) | `npx remotion still <id> out/frame.png --frame=<n>` |
| Lint + typecheck | `npm run lint` |
| Regenerate demo audio | `npm run audio` |
| Upgrade Remotion + skills | `npm run upgrade` |

## Project map

```
src/
  index.ts                 Entry point (registerRoot). Don't rename.
  Root.tsx                 Registers every <Composition>. Add new videos here.
  config/video.ts          VIDEO = { width, height, fps }: one place to change format.
  theme/tokens.ts          Colors, radii, gradient helper.
  theme/fonts.ts           Loads bundled fonts; exports FONTS.display/body/mono/serif.
  theme/avu.ts             AVU Luxury Wines brand colors (gold, champagne, wine tones).
  utils/animation.ts       CLAMP, EASE presets, progress(), fadeInOut(), stagger().
  utils/time.ts            secondsToFrames(), framesToSeconds().
  components/              Reusable building blocks (see "Components").
  compositions/
    Showcase/              Sample: 4 scenes + transitions + synced audio.
      Showcase.tsx         <TransitionSeries> + calculateMetadata.
      timeline.ts          Zod props schema + getShowcaseTimeline() (frame math).
      SoundTrack.tsx       Music bed + whooshes synced to scene cuts.
      scenes/*.tsx         One file per scene.
    TitleCard/             Minimal single-scene composition. Copy it to start new ones.
    AvuIntro/              AVU Wine Stories channel intro (16:9 + 9:16).
      AvuIntro.tsx         Composition + AVU_INTRO_TIMELINE (seconds; drives picture and sound).
      AvuLogo.tsx          The AVU logo as animatable SVG (draw, fill, wipes, sheen).
      AvuTitle.tsx         Serif title with per-letter reveal and light sweep.
      logoPaths.ts         Traced vector paths of the logo (generated, don't hand-edit).
  Composition.tsx          Original blank scaffold (MyComp). Kept as-is.
public/                    Static assets, referenced with staticFile('…').
  audio/                   Demo audio, synthesized by scripts/generate-demo-audio.sh.
  brand/                   AVU logo: original PNG + traced SVG.
  fonts/                   WOFF2 fonts + OFL licenses.
scripts/                   Helper scripts.
out/                       Render output (git-ignored).
```

## AVU Wine Stories (brand)

This repo produces videos for the **AVU Wine Stories** channel by AVU Luxury Wines.

- **Logo:** `public/brand/avu-luxury-wines-logo.png` (original) and `.svg` (vector). In
  compositions use `<AvuLogo />` from `src/compositions/AvuIntro/AvuLogo.tsx`; with no
  props it renders the static logo. Never stretch, recolor or rearrange the logo. Only
  reveal it (draw, fill, wipe, fade) and keep its proportions.
- **Colors:** `AVU` in `src/theme/avu.ts`. The official gold is `#88764A`, used on
  wine-dark backgrounds (`wineBlack` → `wine`) with `champagne` for text.
- **Type:** `FONTS.serif` (Cormorant Garamond, italic for titles) plus `FONTS.body` for small caps lines.
- **Mood:** slow, elegant easing (`EASE.inOut` / `EASE.out`, no bouncy springs), gold dust,
  film grain, vignette, a glass-chime accent. Avoid fast cuts and saturated colors.
- **Channel intro:** compositions `AvuIntro` (1920×1080) and `AvuIntro-Vertical`
  (1080×1920 for Shorts/Reels/TikTok), 8 s. Props: `title` (default "Wine Stories"),
  `subtitle` (optional small line), `withAudio`. To retime, edit `AVU_INTRO_TIMELINE`;
  the sound effects use the same values.
  - Render: `npx remotion render AvuIntro out/avu-wine-stories-intro.mp4`
  - Vertical: `npx remotion render AvuIntro-Vertical out/avu-wine-stories-intro-vertical.mp4`
- **New episode videos:** start from `TitleCard`, but use the AVU theme, `FONTS.serif`,
  `DustParticles` and `FilmGrain`. Reuse `<AvuLogo />` for end cards.

## Rules that keep renders correct

1. **Drive all motion from `useCurrentFrame()`.** CSS `transition` / `animation`, Tailwind `animate-*` classes, `setTimeout` and `requestAnimationFrame` won't render correctly. Every value must be a pure function of the frame.
2. **Write timing in seconds × fps:** `interpolate(frame, [0.5 * fps, 1.2 * fps], …)`. Changing fps then keeps the same real-time pacing.
3. **Clamp interpolations:** `extrapolateLeft: 'clamp', extrapolateRight: 'clamp'` (or spread `CLAMP`).
4. **Ease everything:** `Easing.bezier(0.16, 1, 0.3, 1)` for entrances, `Easing.spring({ damping: 200 })` for pushes without bounce, `Easing.spring({ damping: 11, mass: 0.7 })` for pops. For `scale` animations, add `output: 'perceptual-scale'`.
5. **No `Math.random()`.** Use `random('seed')` from `remotion`, so every frame and every render is identical.
6. **Assets go in `public/`** and are referenced with `staticFile('audio/x.mp3')`. Don't import media files directly.
7. **Wrap scenes in `<Stage>`.** It gives you a design space whose short side is 1080 px and scales it to the real output size. Author pixel sizes once at 1080p.
8. **Set fonts from `FONTS`** (`import { FONTS } from '../theme/fonts'`). That import also loads the font files, so a scene renders correctly on its own.
9. **Keep scene markup Studio-editable:** use `Interactive.Div` / `Interactive.Svg` with a hard-coded `name`. Put `interpolate()` inline in `style`. Prefer `scale` / `translate` / `rotate` over `transform`. Keep `defaultProps` as an inline object on `<Composition>`. Details: the `remotion-interactivity` skill.
10. **Video layout:** keep key content at least 80 px from the sides and 100 px from the top and bottom. Headlines should be ≥ 84 px and supporting text ≥ 44 px (at 1080p). One focal point per scene.

## Change resolution, frame rate, or duration

- **Resolution / fps for every composition:** edit `src/config/video.ts`. Layouts scale through `<Stage>`, and all timing is in seconds.
- **Resolution for one render:** `npx remotion render Showcase out/vertical.mp4 --width=1080 --height=1920`. The sample scenes re-flow for portrait.
- **Showcase duration:** change `introSeconds`, `shapesSeconds`, `typeSeconds`, `outroSeconds` or `transitionSeconds` in the Studio Props panel, in `defaultProps` in `Root.tsx`, or per render:
  `npx remotion render Showcase out/long.mp4 --props='{"introSeconds":6}'`.
  `calculateShowcaseMetadata` recomputes the total length (scenes minus transition overlaps). Sound effects follow the cuts automatically.
- **Other compositions:** edit `durationInFrames` in `Root.tsx`, written as `seconds * VIDEO.fps`.
- **Caveat:** the CLI's `--fps` flag changes the frame rate but keeps the frame count, so the video gets shorter. To change fps, edit `VIDEO.fps` instead.

## Create a new composition

1. Copy `src/compositions/TitleCard/` to `src/compositions/<Name>/` and rename the component, schema and types.
2. Build the scene inside `<Stage>` with `<Background>` and components from `src/components`. Drive every animated value from `useCurrentFrame()`.
3. Register it in `src/Root.tsx`. Give it its own JSX node, a literal `id`, `VIDEO.*` for width/height/fps, an inline `defaultProps` object, and optionally `schema` so props are editable in Studio:
   ```tsx
   <Composition
     id="ProductPromo"
     component={ProductPromo}
     width={VIDEO.width}
     height={VIDEO.height}
     fps={VIDEO.fps}
     durationInFrames={6 * VIDEO.fps}
     schema={productPromoSchema}
     defaultProps={{ title: 'Launch day', accentColor: '#7C5CFF' }}
   />
   ```
4. For a multi-scene video, put each scene in its own file. Join the scenes with `<TransitionSeries>` and register each scene as its own composition inside a `<Folder>` ("connected compositions"). `Showcase` shows the pattern.
5. Check your work: run `npm run lint`, render stills at a few key frames, then preview in Studio.

To add a scene to Showcase: create `scenes/NewScene.tsx` and add a `*Seconds` field to `showcaseSchema`. Include it in `getShowcaseTimeline()`. Add a `<TransitionSeries.Sequence>` (plus a transition) in `Showcase.tsx`, and register the scene in the `Showcase-Scenes` folder.

## Components (`src/components`)

| Component | What it does | Notes |
| --- | --- | --- |
| `<Stage>` | Resolution-independent canvas | Wrap every scene. |
| `<Background>` | Drifting gradient orbs, grid, vignette | `primary`, `secondary`, `showGrid`. |
| `<Eyebrow>` | Small uppercase label pill | `dotColor`. |
| `<WordReveal>` | Words rise and un-blur in sequence; gradient on the last N words | `delayInFrames`, `staggerInFrames`, `highlightLastWords`, `accentColor(To)`. |
| `<LetterReveal>` | Letters drop in with springy overshoot | `delayInFrames`, `staggerInFrames`. Wraps between words. |
| `<Typewriter>` | Types text out with a frame-driven blinking cursor | `delayInFrames`, `charactersPerSecond`, `cursorColor`. |
| `<Counter>` | Counts up to a number | `value`, `countSeconds`, `decimals`, `prefix`, `suffix`. |
| `<DustParticles>` | Rising, twinkling specks / bokeh (deterministic) | `color`, `count`, `fadeInSeconds`, `seed`. |
| `<FilmGrain>` | Animated film grain overlay | `opacity`. |

The text components use `Interactive.withSchema({ wrapInSequence: true })`, so
their props are editable in Studio. Typography (font, size, color) is passed
through `style`. Use `delayInFrames` rather than `from` to stagger text that
sits in a flex layout. `from` unmounts the element until it starts, which
shifts the layout.

## Animate typography

- Prefer the components above. For one-off text, use an `Interactive.Div` with inline `opacity` / `translate` keyframes (see any scene).
- Stagger per word or per letter with `progress(frame, delay + i * step, duration, EASE.out)`.
- Gradient text: `backgroundImage` + `backgroundClip: 'text'` + `color: 'transparent'`, as in `WordReveal`.
- Numbers: `fontVariantNumeric: 'tabular-nums'` stops digits from jittering.
- To fit or measure text, see the `remotion-markup` skill (`measuring-text.md`).

## Graphics and shapes

- `@remotion/shapes` provides `<Circle>`, `<Rect>`, `<Triangle>`, `<Star>`, `<Polygon>`, `<Ellipse>`, `<Pie>`, `<Heart>` and `<Arrow>`. They accept `name`, `style` and timing props. See `ShapesScene.tsx`.
- Line drawing: animate `strokeDashoffset` from the path length to 0 (the logo rings in `OutroScene.tsx`).
- Path morphing: `interpolatePaths()` from `@remotion/paths` (install with `npx remotion add @remotion/paths`).
- Install any `@remotion/*` package with `npx remotion add <pkg>`, which pins it to the right version.

## Transitions

`<TransitionSeries>` from `@remotion/transitions`, with presentations `fade()`,
`slide({ direction })`, `wipe({ direction })`, `flip()` and `clockWipe()`, and timings
`linearTiming({ durationInFrames, easing })` and `springTiming({ config, durationInFrames, durationRestThreshold: 0.001 })`.
Each transition overlaps two scenes, so the total = sum of scenes − sum of transitions.
`getShowcaseTimeline()` does this math, and also caps each transition at half the shortest scene.

## Synchronize audio

- Use `<Audio>` from `@remotion/media` with `src={staticFile('audio/file.mp3')}`. Position it with `from={frames}`. Trim with `trimBefore` / `durationInFrames`. Set `volume` to a number or a per-frame function. Pass `loop` (with `loopVolumeCurveBehavior="extend"`) for beds.
- **Scene-local sounds go inside the scene** (e.g. the shape "pops" in `ShapesScene.tsx`). Their `from` is relative to the scene, so they stay in sync when the scene moves.
- **Global cues are computed from the timeline.** `SoundTrack.tsx` places a whoosh at every `cutStarts` frame, so changing a duration moves the sound too.
- **Beat sync:** at a given BPM, beat `n` lands on frame `Math.round(n * 60 / bpm * fps)`. Key animations to those frames.
- **Fit the video to an audio file:** get the file's duration (e.g. `ffprobe`) and return `durationInFrames` from `calculateMetadata`.
- The demo audio is synthesized (no licensing issues). Only add audio you have rights to use.

## Fonts

Fonts are bundled in `public/fonts`, so renders work offline and stay
deterministic. They load through `@remotion/fonts` in `src/theme/fonts.ts`. To add one, drop in a
`.woff2` (Fontsource npm packages are a good source of OFL fonts) and add a `loadFont()` entry.
Alternative: `npx remotion add @remotion/google-fonts`, then
`loadFont('normal', { weights: ['400'], subsets: ['latin'] })`. That approach downloads fonts at render
time, so it needs network access from the render machine.

## Preview and render

- `npm run dev` opens Studio. Keep it running while you edit; it hot-reloads. Use the Props panel to try different props, and the timeline to scrub or play.
- Quick visual check without the UI: `npx remotion still Showcase out/check.png --frame=150 --scale=0.5`.
- Final MP4 (H.264 + AAC): `npm run render`. Other useful flags: `--crf=18` (higher quality), `--frames=0-89` (a range), `--codec=prores --prores-profile=4444` (for editing), `--concurrency=50%`, `--props='{"title":"…"}'`.
- First render downloads Chrome Headless Shell automatically (`npx remotion browser ensure`). On Linux, install the [system libraries](https://www.remotion.dev/docs/miscellaneous/linux-dependencies) first. If the download is blocked, pass an existing Chromium binary with `--browser-executable=/path/to/chrome-headless-shell`.

## Before you finish a change

- [ ] `npm run lint` passes (ESLint with Remotion rules + `tsc`).
- [ ] `npm run compositions` lists your composition with the expected duration.
- [ ] Stills at the start, middle, end and mid-transition frames look right.
- [ ] Any new assets are in `public/` and referenced with `staticFile()`.
- [ ] If timing changed, audio cues still land on the motion.
- [ ] Render with `npx remotion render <id>` if the user asked for a video.

## Troubleshooting

- **Flicker or frames that differ between renders:** something isn't frame-driven (CSS animation, `Math.random`, `Date.now`). Fix it per "Rules" above.
- **`delayRender()` timed out:** a font, asset or fetch didn't load. Check the path under `public/` and the network.
- **Studio is blank or errors:** read the terminal running `npm run dev`. Type errors show up with `npm run lint`.
- **Text overflows on another aspect ratio:** render a still with `--width/--height` and adjust the flex layout. `ShapesScene` shows a portrait switch based on `useVideoConfig()`.

## Official documentation

- Fundamentals: https://www.remotion.dev/docs/the-fundamentals
- Installation in an existing project: https://www.remotion.dev/docs/brownfield
- Agent Skills: https://www.remotion.dev/docs/ai/skills
- Compositions and dynamic metadata: https://www.remotion.dev/docs/calculate-metadata
- Transitions: https://www.remotion.dev/docs/transitions/transitionseries
- Shapes: https://www.remotion.dev/docs/shapes
- Audio: https://www.remotion.dev/docs/using-audio and https://www.remotion.dev/docs/media/audio
- Local fonts: https://www.remotion.dev/docs/fonts-api/load-font
- Studio interactivity: https://www.remotion.dev/docs/studio/interactivity
- CLI render / still / studio: https://www.remotion.dev/docs/cli/render, https://www.remotion.dev/docs/cli/still, https://www.remotion.dev/docs/cli/studio
- Upgrading: https://www.remotion.dev/docs/cli/upgrade
