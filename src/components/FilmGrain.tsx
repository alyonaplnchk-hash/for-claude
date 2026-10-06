import type React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

/**
 * Animated film grain. The noise seed changes every frame (deterministically),
 * which reads as organic texture and helps hide gradient banding.
 */
export const FilmGrain: React.FC<{
  readonly opacity?: number;
}> = ({ opacity = 0.07 }) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{ pointerEvents: "none", opacity, mixBlendMode: "overlay" }}
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <filter id={`grain-${frame % 12}`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency={0.85}
            numOctaves={2}
            seed={frame % 12}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${frame % 12})`} />
      </svg>
    </AbsoluteFill>
  );
};
