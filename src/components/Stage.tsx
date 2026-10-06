import type React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { DESIGN_SHORT_SIDE } from "../config/video";

/**
 * Resolution-independent canvas.
 *
 * Children are laid out in a design space whose shorter side is
 * DESIGN_SHORT_SIDE (1080) px, then scaled to the real output size. Author
 * pixel values once at 1080p and they stay correct at 720p or 4K. With a
 * different aspect ratio (e.g. vertical 1080×1920) the design space changes
 * shape, and flex layouts re-flow. The sample scenes are designed for
 * landscape and portrait; check other ratios with a still render.
 */
export const Stage: React.FC<{
  readonly children: React.ReactNode;
  readonly background?: string;
}> = ({ children, background }) => {
  const { width, height } = useVideoConfig();
  const scale = Math.min(width, height) / DESIGN_SHORT_SIDE;

  return (
    <AbsoluteFill style={{ backgroundColor: background, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: width / scale,
          height: height / scale,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};
