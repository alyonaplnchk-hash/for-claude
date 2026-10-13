import { AbsoluteFill } from "remotion";
import { colors } from "../theme";

// Warm ivory backdrop with a soft gold vignette and fine paper grain.
export const Paper: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.ivory }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 45%, rgba(251,248,241,0) 45%, ${colors.paper} 85%, #E6DBC4 100%)`,
        }}
      />
      <svg width="100%" height="100%" style={{ position: "absolute", opacity: 0.18 }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={7} />
          <feColorMatrix
            values="0 0 0 0 0.54  0 0 0 0 0.46  0 0 0 0 0.29  0 0 0 0.55 0"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};
