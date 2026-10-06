/**
 * Converts seconds to a whole number of frames. Author timing in seconds so
 * that changing the composition's fps keeps the same real-time pacing.
 */
export const secondsToFrames = (seconds: number, fps: number) =>
  Math.round(seconds * fps);

/** Converts a frame count back to seconds. */
export const framesToSeconds = (frames: number, fps: number) => frames / fps;
