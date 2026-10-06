import type React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { AVU } from "../../theme/avu";
import { EASE, progress } from "../../utils/animation";

/**
 * Elegant title: letters emerge one by one from a soft blur, then a light
 * sweep glides across them.
 *
 * The sweep is a second, brighter copy of the letters (same per-letter
 * animation, so it lines up exactly), shown through a moving CSS mask.
 */
export const AvuTitle: React.FC<{
  readonly text: string;
  readonly startFrame: number;
  readonly staggerFrames: number;
  readonly letterFrames: number;
  /** 0–1: progress of the light sweep (0 or 1 = hidden). */
  readonly sheenProgress: number;
  readonly style?: React.CSSProperties;
}> = ({
  text,
  startFrame,
  staggerFrames,
  letterFrames,
  sheenProgress,
  style,
}) => {
  const frame = useCurrentFrame();
  const letters = Array.from(text);

  const renderLetters = (color: string, glow: boolean) =>
    letters.map((char, i) => {
      const p = progress(
        frame,
        startFrame + i * staggerFrames,
        letterFrames,
        EASE.out,
      );
      return (
        <span
          key={`${char}-${i}`}
          style={{
            display: "inline-block",
            whiteSpace: "pre",
            color,
            opacity: p,
            translate: `0 ${(1 - p) * 0.16}em`,
            filter: `blur(${(1 - p) * 10}px)`,
            textShadow: glow ? "0 0 40px rgba(228, 210, 160, 0.28)" : undefined,
          }}
        >
          {char}
        </span>
      );
    });

  const sheenPos = interpolate(sheenProgress, [0, 1], [-25, 125]);
  const sheenMask = `linear-gradient(105deg, transparent ${sheenPos - 14}%, black ${sheenPos}%, transparent ${sheenPos + 14}%)`;

  return (
    <div style={{ position: "relative", display: "inline-flex", ...style }}>
      <div style={{ display: "flex" }}>
        {renderLetters(AVU.champagne, true)}
      </div>
      {sheenProgress > 0 && sheenProgress < 1 ? (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            WebkitMaskImage: sheenMask,
            maskImage: sheenMask,
          }}
        >
          {renderLetters(AVU.highlight, false)}
        </div>
      ) : null}
    </div>
  );
};
