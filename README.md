# Remotion motion graphics

<p align="center">
  <a href="https://github.com/remotion-dev/logo">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-dark.apng">
      <img alt="Animated Remotion Logo" src="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-light.gif">
    </picture>
  </a>
</p>

Make polished motion graphics videos with React and [Remotion](https://www.remotion.dev/docs/) **4.0.533**.
The project is set up for AI coding agents: see [`AGENTS.md`](AGENTS.md) (Claude Code reads it through [`CLAUDE.md`](CLAUDE.md)). Remotion's official Agent Skills are in `.agents/skills`.

**AVU Wine Stories channel intro:** `AvuIntro` (1920×1080) and `AvuIntro-Vertical` (1080×1920), 8 s. The AVU logo draws itself in gold, then the channel name *Wine Stories* is revealed beside it. Render with `npx remotion render AvuIntro out/avu-wine-stories-intro.mp4`.

The sample composition **Showcase** (1920×1080, 30 fps, 14.4 s) has four scenes: kinetic typography, vector shapes, slide/wipe/fade transitions, and a music bed with sound effects synced to the cuts.

## Quick start

Requires Node.js (tested with 22) and npm. On Linux, first install the [system libraries for Chrome Headless Shell](https://www.remotion.dev/docs/miscellaneous/linux-dependencies).

```console
npm install
npm run dev
```

`npm run dev` opens Remotion Studio. Pick **Showcase** in the sidebar and press Space to play.

## Commands

| Task | Command |
| --- | --- |
| Preview in Studio | `npm run dev` |
| List compositions | `npm run compositions` |
| Render the sample to MP4 | `npm run render` → `out/showcase.mp4` |
| Render any composition | `npx remotion render <id> out/<name>.mp4` |
| Render a single frame | `npx remotion still <id> out/frame.png --frame=60` |
| Render vertical | `npx remotion render Showcase out/vertical.mp4 --width=1080 --height=1920` |
| Override props | `npx remotion render Showcase out/custom.mp4 --props='{"title":"Hello there.","introSeconds":6}'` |
| Lint + typecheck | `npm run lint` |
| Upgrade Remotion + skills | `npm run upgrade` |

## Change the format

- **Resolution and frame rate:** edit `src/config/video.ts`. Layouts scale through `<Stage>`, and timing is written in seconds.
- **Duration:** Showcase reads its scene lengths (in seconds) from props. Edit them in the Studio Props panel, in `src/Root.tsx`, or with `--props`.

## Create a new composition

Copy `src/compositions/TitleCard/` and register the new component in `src/Root.tsx`. [`AGENTS.md`](AGENTS.md#create-a-new-composition) has the full steps and conventions.

## Project structure

```
src/
  Root.tsx           Composition registry
  config/video.ts    Width, height, fps
  theme/             Colors and fonts
  utils/             Animation and timing helpers
  components/        Stage, Background, WordReveal, LetterReveal, Typewriter, Counter, …
  compositions/      Showcase (sample) and TitleCard (template)
public/              Fonts (OFL) and demo audio
scripts/             generate-demo-audio.sh
```

## Docs

- [Remotion fundamentals](https://www.remotion.dev/docs/the-fundamentals)
- [Installing Remotion in an existing project](https://www.remotion.dev/docs/brownfield)
- [Agent Skills](https://www.remotion.dev/docs/ai/skills)
- [Transitions](https://www.remotion.dev/docs/transitions/transitionseries)
- [Rendering from the CLI](https://www.remotion.dev/docs/cli/render)

## Help

Remotion offers help on its [Discord server](https://discord.gg/6VzzNDwUwV).

## Issues

Found an issue with Remotion? [File an issue here](https://github.com/remotion-dev/remotion/issues/new).

## License

Note that for some entities a company license is needed. [Read the terms here](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).

The AVU Luxury Wines logo in `public/brand/` belongs to AVU Luxury Wines. The bundled fonts (Space Grotesk, Inter, JetBrains Mono, Cormorant Garamond) are licensed under the SIL Open Font License. Their licenses are in `public/fonts/`. The demo audio is synthesized by `scripts/generate-demo-audio.sh`.
