import type React from "react";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  Background,
  Counter,
  LetterReveal,
  Stage,
  WordReveal,
} from "../../../components";
import { FONTS } from "../../../theme/fonts";
import { COLORS, RADII } from "../../../theme/tokens";

export type TypeSceneProps = {
  readonly accentColor: string;
  readonly accentColorTo: string;
};

/**
 * Scene 3 — kinetic typography plus live stat cards. The numbers read the
 * real composition settings via useVideoConfig(), so they update when you
 * change the resolution or frame rate.
 */
export const TypeScene: React.FC<TypeSceneProps> = ({
  accentColor,
  accentColorTo,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  return (
    <Stage background={COLORS.background}>
      <Background
        primary={accentColor}
        secondary={COLORS.coral}
        showGrid={false}
      />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: "100px 120px",
        }}
      >
        <LetterReveal
          name="Kinetic title"
          delayInFrames={Math.round(0.15 * fps)}
          staggerInFrames={Math.round(0.06 * fps)}
          style={{
            justifyContent: "center",
            color: COLORS.ink,
            fontFamily: FONTS.display,
            fontSize: 200,
            fontWeight: 700,
            letterSpacing: "-0.05em",
            lineHeight: 1,
          }}
        >
          Kinetic type
        </LetterReveal>

        <WordReveal
          name="Tagline"
          delayInFrames={Math.round(1 * fps)}
          staggerInFrames={3}
          highlightLastWords={1}
          accentColor={accentColor}
          accentColorTo={accentColorTo}
          style={{
            justifyContent: "center",
            marginTop: 36,
            color: COLORS.muted,
            fontFamily: FONTS.body,
            fontSize: 50,
            fontWeight: 500,
          }}
        >
          Every letter is a function of the frame.
        </WordReveal>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 32,
            marginTop: 80,
          }}
        >
          <Interactive.Div
            name="Card: frame rate"
            style={{
              width: 340,
              padding: "32px 36px",
              borderRadius: RADII.lg,
              border: `1px solid ${COLORS.border}`,
              backgroundColor: "rgba(17, 20, 42, 0.72)",
              opacity: interpolate(frame, [1.5 * fps, 2.1 * fps], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              translate: interpolate(
                frame,
                [1.5 * fps, 2.1 * fps],
                ["0px 60px", "0px 0px"],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                },
              ),
            }}
          >
            <Counter
              value={fps}
              suffix=" fps"
              delayInFrames={Math.round(1.5 * fps)}
              countSeconds={1}
              style={{
                color: COLORS.ink,
                fontFamily: FONTS.display,
                fontSize: 76,
                fontWeight: 700,
              }}
            />
            <div
              style={{
                marginTop: 8,
                color: COLORS.muted,
                fontFamily: FONTS.body,
                fontSize: 28,
              }}
            >
              Frame rate
            </div>
          </Interactive.Div>

          <Interactive.Div
            name="Card: resolution"
            style={{
              width: 340,
              padding: "32px 36px",
              borderRadius: RADII.lg,
              border: `1px solid ${COLORS.border}`,
              backgroundColor: "rgba(17, 20, 42, 0.72)",
              opacity: interpolate(frame, [1.65 * fps, 2.25 * fps], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              translate: interpolate(
                frame,
                [1.65 * fps, 2.25 * fps],
                ["0px 60px", "0px 0px"],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                },
              ),
            }}
          >
            <Counter
              value={Math.min(width, height)}
              suffix="p"
              delayInFrames={Math.round(1.65 * fps)}
              countSeconds={1}
              style={{
                color: COLORS.ink,
                fontFamily: FONTS.display,
                fontSize: 76,
                fontWeight: 700,
              }}
            />
            <div
              style={{
                marginTop: 8,
                color: COLORS.muted,
                fontFamily: FONTS.body,
                fontSize: 28,
              }}
            >
              Resolution
            </div>
          </Interactive.Div>

          <Interactive.Div
            name="Card: React"
            style={{
              width: 340,
              padding: "32px 36px",
              borderRadius: RADII.lg,
              border: `1px solid ${COLORS.border}`,
              backgroundColor: "rgba(17, 20, 42, 0.72)",
              opacity: interpolate(frame, [1.8 * fps, 2.4 * fps], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              translate: interpolate(
                frame,
                [1.8 * fps, 2.4 * fps],
                ["0px 60px", "0px 0px"],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                },
              ),
            }}
          >
            <Counter
              value={100}
              suffix="%"
              delayInFrames={Math.round(1.8 * fps)}
              countSeconds={1}
              style={{
                color: COLORS.ink,
                fontFamily: FONTS.display,
                fontSize: 76,
                fontWeight: 700,
              }}
            />
            <div
              style={{
                marginTop: 8,
                color: COLORS.muted,
                fontFamily: FONTS.body,
                fontSize: 28,
              }}
            >
              React
            </div>
          </Interactive.Div>
        </div>
      </AbsoluteFill>
    </Stage>
  );
};
