import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { ReelsOverlays } from "./overlays/reels";
import { EngineLayer } from "./EngineLayer";
import type { FilmProps } from "./Film";

const pad = (n: number) => String(n).padStart(5, "0");

// 9:16 cut for Instagram Reels / TikTok / Shorts.
export const BordeauxReels: React.FC<FilmProps> = ({ live, audio }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: "#0e0b09" }}>
      {live ? <EngineLayer /> : <Img src={staticFile(`frames3d_reels/${pad(frame)}.jpg`)} style={{ width: "100%", height: "100%" }} />}
      <ReelsOverlays />
      {audio ? <Audio src={staticFile("audio/mix.wav")} /> : null}
    </AbsoluteFill>
  );
};
