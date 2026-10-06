import { zColor } from "@remotion/zod-types";
import type React from "react";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { Background, Eyebrow, Stage, WordReveal } from "../../components";
import { FONTS } from "../../theme/fonts";
import { COLORS } from "../../theme/tokens";

/**
 * A minimal single-scene composition. Copy this folder as the starting
 * point for a new composition (see AGENTS.md → "Create a new composition").
 */
export const titleCardSchema = z.object({
  label: z.string(),
  title: z.string(),
  accentColor: zColor(),
  accentColorTo: zColor(),
});

export type TitleCardProps = z.infer<typeof titleCardSchema>;

export const TitleCard: React.FC<TitleCardProps> = ({
  label,
  title,
  accentColor,
  accentColorTo,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  return (
    <Stage background={COLORS.background}>
      <Background primary={accentColor} secondary={accentColorTo} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: "100px 120px",
          // Fade the whole card out over the last half second.
          opacity: interpolate(
            frame,
            [durationInFrames - 0.5 * fps, durationInFrames - 1],
            [1, 0],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.7, 0, 0.84, 0),
            },
          ),
        }}
      >
        <Interactive.Div
          name="Label"
          style={{
            marginBottom: 48,
            opacity: interpolate(frame, [0, 0.5 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          <Eyebrow dotColor={accentColorTo}>{label}</Eyebrow>
        </Interactive.Div>
        <WordReveal
          name="Title"
          delayInFrames={Math.round(0.25 * fps)}
          staggerInFrames={Math.round(0.12 * fps)}
          highlightLastWords={1}
          accentColor={accentColor}
          accentColorTo={accentColorTo}
          style={{
            justifyContent: "center",
            textAlign: "center",
            maxWidth: 1500,
            color: COLORS.ink,
            fontFamily: FONTS.display,
            fontSize: 140,
            fontWeight: 700,
            letterSpacing: "-0.045em",
            lineHeight: 1.02,
          }}
        >
          {title}
        </WordReveal>
      </AbsoluteFill>
    </Stage>
  );
};
