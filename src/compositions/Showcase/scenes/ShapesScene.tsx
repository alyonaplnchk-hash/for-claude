import { Audio } from "@remotion/media";
import { Circle, Polygon, Rect, Star, Triangle } from "@remotion/shapes";
import type React from "react";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Background, Eyebrow, Stage, WordReveal } from "../../../components";
import { FONTS } from "../../../theme/fonts";
import { COLORS } from "../../../theme/tokens";

export type ShapesSceneProps = {
  readonly accentColor: string;
  readonly accentColorTo: string;
  readonly withAudio: boolean;
};

/**
 * When each shape pops in, in seconds — one "pop" sound per shape.
 * Keep these equal to the first keyframe of each shape's `scale` below so
 * audio and motion stay in sync. The keyframes stay inline so they remain
 * editable in the Studio.
 */
const POP_TIMES = [0.45, 0.65, 0.85, 1.05, 1.25] as const;

/** Scene 2 — vector shapes from @remotion/shapes popping in with springs. */
export const ShapesScene: React.FC<ShapesSceneProps> = ({
  accentColor,
  accentColorTo,
  withAudio,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  // Side-by-side on landscape, stacked on portrait (e.g. 1080×1920).
  const isPortrait = height > width;
  // Gentle idle float, offset per shape so they don't move in lockstep.
  const float = (phase: number) => `0px ${Math.sin(t * 1.6 + phase) * 10}px`;

  return (
    <Stage background={COLORS.background}>
      <Background primary={accentColorTo} secondary={accentColor} />
      <AbsoluteFill
        style={{
          flexDirection: isPortrait ? "column" : "row",
          justifyContent: "center",
          alignItems: "center",
          padding: "100px 120px",
          gap: 60,
        }}
      >
        <div
          style={{
            flex: isPortrait ? "0 0 auto" : "1 1 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            minWidth: 0,
          }}
        >
          <Interactive.Div
            name="Eyebrow"
            style={{
              marginBottom: 40,
              opacity: interpolate(frame, [0.1 * fps, 0.6 * fps], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
            }}
          >
            <Eyebrow dotColor={COLORS.amber}>02 — Shapes</Eyebrow>
          </Interactive.Div>
          <WordReveal
            name="Heading"
            delayInFrames={Math.round(0.2 * fps)}
            staggerInFrames={Math.round(0.12 * fps)}
            highlightLastWords={1}
            accentColor={COLORS.amber}
            accentColorTo={COLORS.coral}
            style={{
              color: COLORS.ink,
              fontFamily: FONTS.display,
              fontSize: 112,
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1.02,
            }}
          >
            Built from primitives.
          </WordReveal>
          <Interactive.Div
            name="Body"
            style={{
              maxWidth: 720,
              marginTop: 40,
              color: COLORS.muted,
              fontFamily: FONTS.body,
              fontSize: 44,
              lineHeight: 1.4,
              opacity: interpolate(frame, [0.9 * fps, 1.5 * fps], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              translate: interpolate(
                frame,
                [0.9 * fps, 1.5 * fps],
                ["0px 30px", "0px 0px"],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                },
              ),
            }}
          >
            Circles, stars and polygons — every shape is a React component,
            every move a function of time.
          </Interactive.Div>
        </div>

        {/* Shape cluster, laid out on a fixed 720×720 board. */}
        <div
          style={{
            position: "relative",
            width: 720,
            height: 720,
            flexShrink: 0,
          }}
        >
          <Circle
            name="Orbit ring"
            radius={330}
            fill="none"
            stroke={COLORS.border}
            strokeWidth={2}
            strokeDasharray="6 14"
            style={{
              position: "absolute",
              left: 30,
              top: 30,
              rotate: interpolate(frame, [0, 6 * fps], ["0deg", "90deg"]),
              opacity: interpolate(frame, [0, 0.6 * fps], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          />
          <Polygon
            name="Hexagon"
            points={6}
            radius={150}
            cornerRadius={24}
            fill={accentColor}
            style={{
              position: "absolute",
              left: 210,
              top: 210,
              translate: float(0),
              scale: interpolate(frame, [0.45 * fps, 1.25 * fps], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.spring({ damping: 11, mass: 0.7 }),
                output: "perceptual-scale",
              }),
              rotate: interpolate(
                frame,
                [0.45 * fps, 5 * fps],
                ["-60deg", "30deg"],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                },
              ),
            }}
          />
          <Star
            name="Star"
            points={5}
            innerRadius={56}
            outerRadius={120}
            cornerRadius={12}
            fill={COLORS.amber}
            style={{
              position: "absolute",
              left: 450,
              top: 20,
              translate: float(1.2),
              scale: interpolate(frame, [0.65 * fps, 1.45 * fps], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.spring({ damping: 11, mass: 0.7 }),
                output: "perceptual-scale",
              }),
              rotate: interpolate(
                frame,
                [0.65 * fps, 5 * fps],
                ["-90deg", "20deg"],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                },
              ),
            }}
          />
          <Triangle
            name="Triangle"
            length={200}
            direction="up"
            cornerRadius={20}
            fill={COLORS.coral}
            style={{
              position: "absolute",
              left: 40,
              top: 470,
              translate: float(2.4),
              scale: interpolate(frame, [0.85 * fps, 1.65 * fps], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.spring({ damping: 11, mass: 0.7 }),
                output: "perceptual-scale",
              }),
              rotate: interpolate(
                frame,
                [0.85 * fps, 5 * fps],
                ["40deg", "-12deg"],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                },
              ),
            }}
          />
          <Rect
            name="Rounded square"
            width={150}
            height={150}
            cornerRadius={36}
            fill={accentColorTo}
            style={{
              position: "absolute",
              left: 510,
              top: 480,
              translate: float(3.6),
              scale: interpolate(frame, [1.05 * fps, 1.85 * fps], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.spring({ damping: 11, mass: 0.7 }),
                output: "perceptual-scale",
              }),
              rotate: interpolate(
                frame,
                [1.05 * fps, 5 * fps],
                ["-45deg", "15deg"],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                },
              ),
            }}
          />
          <Circle
            name="Dot"
            radius={44}
            fill={COLORS.mint}
            style={{
              position: "absolute",
              left: 90,
              top: 110,
              translate: float(4.8),
              scale: interpolate(frame, [1.25 * fps, 2.05 * fps], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.spring({ damping: 11, mass: 0.7 }),
                output: "perceptual-scale",
              }),
            }}
          />
        </div>
      </AbsoluteFill>

      {withAudio
        ? POP_TIMES.map((seconds) => (
            <Audio
              key={seconds}
              name={`Pop @ ${seconds}s`}
              src={staticFile("audio/pop.mp3")}
              from={Math.round(seconds * fps)}
              volume={0.35}
            />
          ))
        : null}
    </Stage>
  );
};
