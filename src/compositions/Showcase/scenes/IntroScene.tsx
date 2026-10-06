import type React from "react";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Background, Eyebrow, Stage, WordReveal } from "../../../components";
import { FONTS } from "../../../theme/fonts";
import { COLORS, linearGradient } from "../../../theme/tokens";

export type IntroSceneProps = {
  readonly title: string;
  readonly subtitle: string;
  readonly accentColor: string;
  readonly accentColorTo: string;
};

/** Scene 1 — title card with staggered headline and a slow camera push. */
export const IntroScene: React.FC<IntroSceneProps> = ({
  title,
  subtitle,
  accentColor,
  accentColorTo,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  return (
    <Stage background={COLORS.background}>
      <Background primary={accentColor} secondary={accentColorTo} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: "100px 120px",
          textAlign: "center",
          // Slow "camera push" across the whole scene.
          scale: interpolate(frame, [0, 5 * fps], [1, 1.06], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.33, 0, 0.67, 1),
          }),
        }}
      >
        <Interactive.Div
          name="Eyebrow"
          style={{
            marginBottom: 56,
            opacity: interpolate(frame, [0.1 * fps, 0.7 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
            translate: interpolate(
              frame,
              [0.1 * fps, 0.7 * fps],
              ["0px 24px", "0px 0px"],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              },
            ),
          }}
        >
          <Eyebrow dotColor={accentColorTo}>
            Remotion · {width}×{height} · {fps} fps
          </Eyebrow>
        </Interactive.Div>

        <WordReveal
          name="Headline"
          delayInFrames={Math.round(0.4 * fps)}
          staggerInFrames={Math.round(0.16 * fps)}
          highlightLastWords={2}
          accentColor={accentColor}
          accentColorTo={accentColorTo}
          style={{
            justifyContent: "center",
            maxWidth: 1500,
            color: COLORS.ink,
            fontFamily: FONTS.display,
            fontSize: 150,
            fontWeight: 700,
            letterSpacing: "-0.045em",
            lineHeight: 1.02,
          }}
        >
          {title}
        </WordReveal>

        <Interactive.Div
          name="Accent line"
          style={{
            height: 6,
            marginTop: 48,
            borderRadius: 3,
            backgroundImage: linearGradient(accentColor, accentColorTo, 90),
            width: interpolate(frame, [1.1 * fps, 2 * fps], [0, 320], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.65, 0, 0.35, 1),
            }),
          }}
        />

        <WordReveal
          name="Subtitle"
          delayInFrames={Math.round(1.4 * fps)}
          staggerInFrames={2}
          style={{
            justifyContent: "center",
            maxWidth: 1100,
            marginTop: 44,
            color: COLORS.muted,
            fontFamily: FONTS.body,
            fontSize: 46,
            fontWeight: 400,
            lineHeight: 1.35,
          }}
        >
          {subtitle}
        </WordReveal>
      </AbsoluteFill>
    </Stage>
  );
};
