import { Audio } from "@remotion/media";
import type React from "react";
import { interpolate, staticFile, useVideoConfig } from "remotion";
import { CLAMP } from "../../utils/animation";

/**
 * Music bed plus a whoosh on every scene cut.
 *
 * Sync technique: the cut frames come from the same timeline that drives
 * <TransitionSeries>, so changing a scene duration moves the sound effects
 * with it. Sounds that belong to a single scene (like the shape "pops") live
 * inside that scene instead, so they move with the scene automatically.
 */
export const SoundTrack: React.FC<{
  readonly cutStarts: number[];
}> = ({ cutStarts }) => {
  const { fps, durationInFrames } = useVideoConfig();
  // Start the whoosh slightly before the cut so its peak lands on the move.
  const whooshLead = Math.round(0.15 * fps);

  return (
    <>
      <Audio
        name="Music bed"
        src={staticFile("audio/ambient-pad.mp3")}
        loop
        loopVolumeCurveBehavior="extend"
        volume={(f) =>
          interpolate(
            f,
            [0, 0.8 * fps, durationInFrames - 1.2 * fps, durationInFrames],
            [0, 0.6, 0.6, 0],
            CLAMP,
          )
        }
      />
      {cutStarts.map((cutFrame, i) => (
        <Audio
          key={cutFrame}
          name={`Whoosh ${i + 1}`}
          src={staticFile("audio/whoosh.mp3")}
          from={Math.max(0, cutFrame - whooshLead)}
          volume={0.45}
        />
      ))}
    </>
  );
};
