import type React from "react";
import {
  AbsoluteFill,
  interpolate,
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CLAMP } from "../utils/animation";

/**
 * Slowly rising, twinkling specks of light ("gold dust" / bokeh).
 *
 * Positions come from `random(seed)`, so every render is identical. A few
 * particles are larger and blurred to fake depth of field.
 */
export const DustParticles: React.FC<{
  readonly color?: string;
  readonly count?: number;
  /** Seconds to fade the particles in. */
  readonly fadeInSeconds?: number;
  readonly seed?: string;
}> = ({
  color = "#E4D2A0",
  count = 48,
  fadeInSeconds = 1.5,
  seed = "dust",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const fadeIn = interpolate(frame, [0, fadeInSeconds * fps], [0, 1], CLAMP);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const r = (key: string) => random(`${seed}-${key}-${i}`);
        const isBokeh = r("bokeh") > 0.86;
        const size = isBokeh ? 10 + r("size") * 14 : 2 + r("size") * 3.5;
        const speed = 1.2 + r("speed") * 2.6; // % of height per second
        // Wrap vertically from 105% to -5% so particles never pop in view.
        const y = ((((r("y") * 110 - t * speed) % 110) + 110) % 110) - 5;
        const x = r("x") * 100 + Math.sin(t * 0.6 + r("sway") * 6) * 1.2;
        const twinkle =
          0.5 + 0.5 * Math.sin(t * (1 + r("tw") * 2) + r("phase") * 6.28);
        const opacity =
          fadeIn * (isBokeh ? 0.12 + twinkle * 0.12 : 0.25 + twinkle * 0.55);

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size,
              borderRadius: "50%",
              backgroundColor: color,
              opacity,
              filter: isBokeh ? `blur(${size * 0.35}px)` : undefined,
              boxShadow: isBokeh ? undefined : `0 0 ${size * 3}px ${color}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
