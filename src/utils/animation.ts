/**
 * Reusable animation helpers. Everything in Remotion must be driven by the
 * current frame — CSS transitions/animations do not render correctly.
 *
 * In scene markup, prefer writing `interpolate()` inline in `style` so the
 * Studio can edit keyframes visually. Use these helpers inside reusable
 * components where values are computed (staggering, per-letter offsets, …).
 */
import { Easing, interpolate, type InterpolateOptions } from "remotion";

/** Clamp on both sides — the default you almost always want. */
export const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const satisfies InterpolateOptions;

/** Named easing curves so motion feels consistent across scenes. */
export const EASE = {
  /** Fast start, long soft landing. Great for entrances. */
  out: Easing.bezier(0.16, 1, 0.3, 1),
  /** Symmetric, for moves between two resting positions. */
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  /** Accelerating, for exits. */
  in: Easing.bezier(0.7, 0, 0.84, 0),
  /** Physical push with no bounce. */
  spring: Easing.spring({ damping: 200 }),
  /** Playful overshoot for pops. */
  bouncy: Easing.spring({ damping: 11, mass: 0.7 }),
} as const;

/**
 * Progress from 0 to 1 that starts at `delay` frames and lasts `duration`
 * frames.
 */
export const progress = (
  frame: number,
  delay: number,
  duration: number,
  easing: (t: number) => number = EASE.out,
) =>
  interpolate(frame, [delay, delay + duration], [0, 1], { ...CLAMP, easing });

/**
 * Fades in, holds, then fades out. Useful for text that should leave before
 * the scene ends.
 */
export const fadeInOut = (
  frame: number,
  {
    inStart,
    inEnd,
    outStart,
    outEnd,
  }: Record<"inStart" | "inEnd" | "outStart" | "outEnd", number>,
) =>
  interpolate(frame, [inStart, inEnd, outStart, outEnd], [0, 1, 1, 0], {
    ...CLAMP,
    easing: [EASE.out, Easing.linear, EASE.in],
  });

/** Delay (in frames) for item `index` in a staggered group. */
export const stagger = (index: number, stepInFrames: number, offset = 0) =>
  offset + index * stepInFrames;
