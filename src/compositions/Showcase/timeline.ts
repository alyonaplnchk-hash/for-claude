import { zColor } from "@remotion/zod-types";
import { z } from "zod";
import { secondsToFrames } from "../../utils/time";

/**
 * Props for the Showcase video. The schema powers the Studio's Props panel
 * and validates `--props` passed on the command line.
 *
 * All durations are in seconds; `getShowcaseTimeline()` converts them to
 * frames for the current fps.
 */
export const showcaseSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  accentColor: zColor(),
  accentColorTo: zColor(),
  introSeconds: z.number().min(1).max(60),
  shapesSeconds: z.number().min(1).max(60),
  typeSeconds: z.number().min(1).max(60),
  outroSeconds: z.number().min(1).max(60),
  transitionSeconds: z.number().min(0.1).max(3),
  withAudio: z.boolean(),
});

export type ShowcaseProps = z.infer<typeof showcaseSchema>;

/**
 * Derives every frame number the video needs from the props.
 *
 * Transitions overlap neighbouring scenes, so the total length is the sum of
 * the scenes minus one transition per cut. Scene start frames are used to
 * sync sound effects to the cuts.
 */
export const getShowcaseTimeline = (props: ShowcaseProps, fps: number) => {
  const scenes = {
    intro: secondsToFrames(props.introSeconds, fps),
    shapes: secondsToFrames(props.shapesSeconds, fps),
    type: secondsToFrames(props.typeSeconds, fps),
    outro: secondsToFrames(props.outroSeconds, fps),
  };
  const ordered = [scenes.intro, scenes.shapes, scenes.type, scenes.outro];

  // A transition can't be longer than the scenes it joins.
  const transitionFrames = Math.max(
    1,
    Math.min(
      secondsToFrames(props.transitionSeconds, fps),
      Math.floor(Math.min(...ordered) / 2),
    ),
  );

  const sceneStarts = ordered.map((_, i) => {
    const previous = ordered.slice(0, i).reduce((sum, d) => sum + d, 0);
    return previous - i * transitionFrames;
  });

  const durationInFrames =
    ordered.reduce((sum, d) => sum + d, 0) -
    (ordered.length - 1) * transitionFrames;

  return {
    scenes,
    transitionFrames,
    sceneStarts,
    /** Frames where each transition begins (one per cut). */
    cutStarts: sceneStarts.slice(1),
    durationInFrames,
  };
};
