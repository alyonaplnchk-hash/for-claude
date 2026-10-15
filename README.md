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

Composition `FigeacTitle` (1920×1080, 30 fps, 180 frames, no audio) animates the reference
title card layer by layer. The château photo and "AVU WINE Stories" are static from the first
frame; only the bottle and then the title animate. The final frame matches the reference
(with the corrected spelling CHÂTEAU).

| Time | Animation |
| --- | --- |
| 0:00–0:06 | Château photo and "AVU WINE Stories" static |
| 0:01–0:02 | Bottle reaches full opacity within 3 frames and rises 45 px with a soft ease-out |
| 0:02.2–0:03.3 | "CHÂTEAU-FIGEAC" left-to-right mask wipe (letters stay put) |
| 0:03.2–0:03.8 | Classification and gold lions fade in |
| 0:03.8–0:06 | Hold on the final composition |

The source image has no photo pixels behind the bottle, so the photo is cropped at the
bottle's left edge (x = 666) until the bottle arrives; the strip beside the neck then joins
while the bottle rises. Nothing is mirrored or regenerated.

Layers live in `public/figeac/` and were cut from the reference image with
`scripts/extract_layers.py` (needs `numpy`, `pillow`, `opencv-python-headless`).

The circumflex on CHÂTEAU is drawn in the title's own style by `scripts/add_circumflex.py`.

Render:

```console
npx remotion render FigeacTitle out/avu-wine-stories-chateau-figeac.mp4 --codec=h264 --image-format=png --crf=12 --pixel-format=yuv420p --muted
```

A ready render is in `renders/avu-wine-stories-chateau-figeac.mp4`.

## Editorial cut (8 s)

Composition `FigeacEditorial` (1920×1080, 30 fps, 240 frames, no audio) is a luxury
editorial version built from the same layers:

| Time | Animation |
| --- | --- |
| 0:00–0:01.3 | The château appears as a framed plate rising in, with a drawn hairline frame and "Saint-Émilion / Bordeaux" captions |
| 0:01.5–0:02.7 | The plate opens out to the full photo panel |
| 0:02.4–0:03.6 | Bottle appears solid and settles 45 px |
| 0:03.2–0:04.5 | Hairlines open around "Millésime 2022" |
| 0:03.8–0:04.9 | "CHÂTEAU-FIGEAC" rises from behind its baseline |
| 0:04.7–0:05.5 | Classification and lions fade up |
| 0:05.6–0:07 | A slow light sweep across the gold letters, then hold |

"AVU WINE Stories" and the photo never move; a fine film grain runs throughout.

```console
npx remotion render FigeacEditorial out/avu-wine-stories-chateau-figeac-editorial.mp4 --codec=h264 --image-format=png --crf=14 --pixel-format=yuv420p --muted
```
