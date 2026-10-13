import { AbsoluteFill, random, useCurrentFrame, useVideoConfig } from "remotion";
import { colors } from "../theme";

const PARTICLES = new Array(46).fill(true).map((_, i) => ({
  x: random(`x-${i}`),
  y: random(`y-${i}`),
  size: 2 + random(`s-${i}`) * 5,
  speed: 0.15 + random(`v-${i}`) * 0.45,
  phase: random(`p-${i}`) * Math.PI * 2,
}));

// Slowly rising, twinkling flecks of gold leaf.
export const GoldDust: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {PARTICLES.map((p, i) => {
        const y = (((p.y * height - frame * p.speed * 2) % height) + height) % height;
        const x = p.x * width + Math.sin(frame / 40 + p.phase) * 14;
        const twinkle = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(frame / 9 + p.phase));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: colors.gold,
              opacity: twinkle,
              boxShadow: `0 0 ${p.size * 2}px ${colors.goldLight}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
