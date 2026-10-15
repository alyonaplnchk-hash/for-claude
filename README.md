# Remotion video

<p align="center">
  <a href="https://github.com/remotion-dev/logo">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-dark.apng">
      <img alt="Animated Remotion Logo" src="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-light.gif">
    </picture>
  </a>
</p>

Welcome to your Remotion project!

## Commands

**Install Dependencies**

```console
npm i
```

**Start Preview**

```console
npm run dev
```

**Render video**

```console
npx remotion render
```

**Upgrade Remotion**

```console
npx remotion upgrade
```

## Docs

Get started with Remotion by reading the [fundamentals page](https://www.remotion.dev/docs/the-fundamentals).

## Help

We provide help on our [Discord server](https://discord.gg/6VzzNDwUwV).

## Issues

Found an issue with Remotion? [File an issue here](https://github.com/remotion-dev/remotion/issues/new).

## License

Note that for some entities a company license is needed. [Read the terms here](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).

---

## AVU WINE Stories — Château-Figeac title (6 s)

Composition `FigeacTitle` (1920×1080, 30 fps, 180 frames) animates the reference
title card layer by layer. The final frame matches the reference; only the château
photo carries the requested ~2.5% push-in.

| Time | Animation |
| --- | --- |
| 0:00–0:01 | Château photo fades in from the ivory background |
| 0:00–0:06 | Château photo slow push-in (100% → 102.5%) |
| 0:01–0:02 | Bottle rises 60 px, fades in, scales 98% → 100% |
| 0:02–0:03 | "AVU WINE Stories" fades in, rises 15 px |
| 0:03–0:04.1 | "CHATEAU-FIGEAC" left-to-right mask wipe (letters stay put) |
| 0:04–0:04.5 | Classification and gold lions fade in |
| 0:04.5–0:06 | Hold on the final composition |

Layers live in `public/figeac/` and were cut from the reference image with
`scripts/extract_layers.py` (needs `numpy`, `pillow`, `opencv-python-headless`).

Sound: `public/figeac/sound.wav` is synthesised by `scripts/make_sound.py` (needs `numpy`,
`scipy`): a string ensemble (Dmaj9 → Gmaj7/B → D), a soft cork pop (0.35 s), wine poured
gently into a glass (0.9–2.65 s), a felt-piano motif on the reveals, a crystal clink tuned
to the chord on the main-title wipe (3 s) and a low piano chord for the classification (4 s).

Render:

```console
npx remotion render FigeacTitle out/avu-wine-stories-chateau-figeac.mp4 --codec=h264 --crf=14 --image-format=png --pixel-format=yuv420p --audio-codec=aac --audio-bitrate=320k
```

A ready render is in `renders/avu-wine-stories-chateau-figeac.mp4`.
