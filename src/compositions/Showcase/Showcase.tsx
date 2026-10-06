import {
  linearTiming,
  springTiming,
  TransitionSeries,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import type React from "react";
import {
  AbsoluteFill,
  type CalculateMetadataFunction,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { VIDEO } from "../../config/video";
import { COLORS } from "../../theme/tokens";
import { CLAMP } from "../../utils/animation";
import { IntroScene } from "./scenes/IntroScene";
import { OutroScene } from "./scenes/OutroScene";
import { ShapesScene } from "./scenes/ShapesScene";
import { TypeScene } from "./scenes/TypeScene";
import { SoundTrack } from "./SoundTrack";
import { getShowcaseTimeline, type ShowcaseProps } from "./timeline";

/**
 * Sample video: four scenes joined by slide, wipe and fade transitions,
 * with a music bed and sound effects synced to the cuts.
 *
 * Each scene is also registered as its own composition in Root.tsx
 * ("connected compositions"), so it can be previewed and edited alone.
 */
export const Showcase: React.FC<ShowcaseProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const timeline = getShowcaseTimeline(props, fps);
  const { accentColor, accentColorTo } = props;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.background }}>
      <TransitionSeries>
        <TransitionSeries.Sequence
          name="Intro"
          durationInFrames={timeline.scenes.intro}
        >
          <IntroScene
            title={props.title}
            subtitle={props.subtitle}
            accentColor={accentColor}
            accentColorTo={accentColorTo}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({
            config: { damping: 200 },
            durationInFrames: timeline.transitionFrames,
            durationRestThreshold: 0.001,
          })}
        />
        <TransitionSeries.Sequence
          name="Shapes"
          durationInFrames={timeline.scenes.shapes}
        >
          <ShapesScene
            accentColor={accentColor}
            accentColorTo={accentColorTo}
            withAudio={props.withAudio}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-bottom-left" })}
          timing={linearTiming({
            durationInFrames: timeline.transitionFrames,
            easing: Easing.bezier(0.65, 0, 0.35, 1),
          })}
        />
        <TransitionSeries.Sequence
          name="Type"
          durationInFrames={timeline.scenes.type}
        >
          <TypeScene accentColor={accentColor} accentColorTo={accentColorTo} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: timeline.transitionFrames })}
        />
        <TransitionSeries.Sequence
          name="Outro"
          durationInFrames={timeline.scenes.outro}
        >
          <OutroScene accentColor={accentColor} accentColorTo={accentColorTo} />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* Fade to black over the last 0.6 s. */}
      <AbsoluteFill
        style={{
          backgroundColor: "black",
          pointerEvents: "none",
          opacity: interpolate(
            frame,
            [durationInFrames - 0.6 * fps, durationInFrames - 1],
            [0, 1],
            CLAMP,
          ),
        }}
      />

      {props.withAudio ? <SoundTrack cutStarts={timeline.cutStarts} /> : null}
    </AbsoluteFill>
  );
};

/**
 * Computes the total duration from the scene lengths in the props, so
 * editing a duration in the Studio's Props panel or via `--props` resizes
 * the video automatically.
 */
export const calculateShowcaseMetadata: CalculateMetadataFunction<
  ShowcaseProps
> = ({ props }) => {
  return {
    durationInFrames: getShowcaseTimeline(props, VIDEO.fps).durationInFrames,
  };
};
