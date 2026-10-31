// Live engine canvas: renders the 3D layer directly in the browser (Studio preview or a
// --gl=swangle render). The final film uses pre-rendered frames for speed.
import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Director } from "./director";

let director: Director | null = null;
let directorCanvas: HTMLCanvasElement | null = null;

export const EngineLayer: React.FC<{ scale?: number }> = ({ scale = 0.75 }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    if (!director || directorCanvas !== c) {
      director = new Director(c, scale, 4);
      directorCanvas = c;
    }
    director.render(frame / fps);
  }, [frame, fps, scale]);
  return (
    <AbsoluteFill>
      <canvas ref={ref} width={width} height={height} style={{ width: "100%", height: "100%" }} />
    </AbsoluteFill>
  );
};
