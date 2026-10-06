import { Triangle } from "@remotion/shapes";
import type React from "react";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Background, Stage, Typewriter, WordReveal } from "../../../components";
import { FONTS } from "../../../theme/fonts";
import { COLORS, RADII } from "../../../theme/tokens";

export type OutroSceneProps = {
  readonly accentColor: string;
  readonly accentColorTo: string;
};

/** Scene 4 — logo mark draws itself, headline, and a typed CLI command. */
export const OutroScene: React.FC<OutroSceneProps> = ({
  accentColor,
  accentColorTo,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Stage background={COLORS.background}>
      <Background primary={accentColor} secondary={accentColorTo} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: "100px 120px",
        }}
      >
        {/* Logo mark: three rings drawn with an animated stroke offset. */}
        <div style={{ position: "relative", width: 300, height: 300 }}>
          <Interactive.Svg
            name="Logo rings"
            width={300}
            height={300}
            viewBox="0 0 300 300"
            style={{ rotate: "-90deg" }}
          >
            <Interactive.Circle
              name="Ring outer"
              cx={150}
              cy={150}
              r={140}
              fill="none"
              stroke={accentColor}
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={880}
              strokeDashoffset={interpolate(
                frame,
                [0.1 * fps, 1.1 * fps],
                [880, 0],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.bezier(0.65, 0, 0.35, 1),
                },
              )}
            />
            <Interactive.Circle
              name="Ring middle"
              cx={150}
              cy={150}
              r={108}
              fill="none"
              stroke={accentColorTo}
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={679}
              strokeDashoffset={interpolate(
                frame,
                [0.25 * fps, 1.25 * fps],
                [679, 0],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.bezier(0.65, 0, 0.35, 1),
                },
              )}
            />
            <Interactive.Circle
              name="Ring inner"
              cx={150}
              cy={150}
              r={76}
              fill="none"
              stroke="rgba(245, 247, 255, 0.35)"
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={478}
              strokeDashoffset={interpolate(
                frame,
                [0.4 * fps, 1.4 * fps],
                [478, 0],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.bezier(0.65, 0, 0.35, 1),
                },
              )}
            />
          </Interactive.Svg>
          <Triangle
            name="Play"
            length={84}
            direction="right"
            cornerRadius={10}
            fill={COLORS.ink}
            style={{
              position: "absolute",
              left: 120,
              top: 108,
              scale: interpolate(frame, [0.9 * fps, 1.6 * fps], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.spring({ damping: 11, mass: 0.7 }),
                output: "perceptual-scale",
              }),
            }}
          />
        </div>

        <WordReveal
          name="Headline"
          delayInFrames={Math.round(0.8 * fps)}
          staggerInFrames={Math.round(0.14 * fps)}
          highlightLastWords={1}
          accentColor={accentColor}
          accentColorTo={accentColorTo}
          style={{
            justifyContent: "center",
            marginTop: 64,
            color: COLORS.ink,
            fontFamily: FONTS.display,
            fontSize: 140,
            fontWeight: 700,
            letterSpacing: "-0.045em",
            lineHeight: 1,
          }}
        >
          Render anything.
        </WordReveal>

        <Interactive.Div
          name="Command pill"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginTop: 64,
            padding: "24px 40px",
            borderRadius: RADII.md,
            border: `1px solid ${COLORS.border}`,
            backgroundColor: "rgba(17, 20, 42, 0.8)",
            color: COLORS.ink,
            fontFamily: FONTS.mono,
            fontSize: 44,
            fontWeight: 500,
            opacity: interpolate(frame, [1.3 * fps, 1.8 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
            translate: interpolate(
              frame,
              [1.3 * fps, 1.8 * fps],
              ["0px 30px", "0px 0px"],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              },
            ),
          }}
        >
          <span style={{ color: accentColorTo }}>$</span>
          <Typewriter
            name="Command"
            delayInFrames={Math.round(1.6 * fps)}
            charactersPerSecond={26}
            cursorColor={accentColorTo}
          >
            npx remotion render
          </Typewriter>
        </Interactive.Div>
      </AbsoluteFill>
    </Stage>
  );
};
