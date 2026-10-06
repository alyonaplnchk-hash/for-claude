import type React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS } from "../theme/tokens";

/**
 * Animated backdrop: a deep base color, two slowly drifting light orbs,
 * a masked grid and a vignette. Motion is subtle so it never competes with
 * the foreground.
 */
export const Background: React.FC<{
  readonly primary?: string;
  readonly secondary?: string;
  readonly base?: string;
  readonly showGrid?: boolean;
}> = ({
  primary = COLORS.violet,
  secondary = COLORS.cyan,
  base = COLORS.background,
  showGrid = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // A slow, continuous drift. Using seconds keeps the speed fps-independent.
  const t = frame / fps;

  const orbA = {
    x: 28 + Math.sin(t * 0.45) * 8,
    y: 30 + Math.cos(t * 0.35) * 10,
  };
  const orbB = {
    x: 74 + Math.cos(t * 0.4) * 9,
    y: 70 + Math.sin(t * 0.5) * 8,
  };
  const gridShift = interpolate(t, [0, 10], [0, 80]);

  return (
    <AbsoluteFill style={{ backgroundColor: base }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${orbA.x}% ${orbA.y}%, ${primary}55 0%, transparent 42%),
            radial-gradient(circle at ${orbB.x}% ${orbB.y}%, ${secondary}40 0%, transparent 38%)`,
        }}
      />
      {showGrid ? (
        <AbsoluteFill
          style={{
            backgroundImage: `linear-gradient(${COLORS.border} 1px, transparent 1px),
              linear-gradient(90deg, ${COLORS.border} 1px, transparent 1px)`,
            backgroundSize: "80px 80px",
            backgroundPosition: `${gridShift}px ${gridShift}px`,
            opacity: 0.35,
            maskImage:
              "radial-gradient(ellipse at center, black 20%, transparent 75%)",
          }}
        />
      ) : null}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
