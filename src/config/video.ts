/**
 * Global video settings — the single place to change output format.
 *
 * Every composition in `src/Root.tsx` reads these values, and all animation
 * timing is written in seconds (multiplied by `fps`), so changing the frame
 * rate keeps the same real-time pacing.
 *
 * You can also override per render without editing code:
 *   npx remotion render Showcase out/vertical.mp4 --width=1080 --height=1920 --fps=60
 */
export const VIDEO = {
  width: 1920,
  height: 1080,
  fps: 30,
} as const;

/**
 * Layouts are authored in a "design space" whose shorter side is this many
 * pixels. `<Stage>` scales the design space to the real output size, so a
 * 720p, 1080p or 4K render looks identical, and vertical formats re-flow
 * instead of cropping.
 */
export const DESIGN_SHORT_SIDE = 1080;
