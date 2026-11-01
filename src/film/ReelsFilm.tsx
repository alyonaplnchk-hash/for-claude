import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { LuxeBackdrop, LuxeOverlays } from "./overlays/luxe";
import { EngineLayer } from "./EngineLayer";
import type { FilmProps } from "./Film";

const pad = (n: number) => String(n).padStart(5, "0");

// 9:16 cut for Instagram Reels / TikTok / Shorts: 3D frames on a pale clouded backdrop with
// kinetic serif typography, hairline graphics and foreground flybys.
export const BordeauxReels: React.FC<FilmProps> = ({ live, audio }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: "#E8E8E9" }}>
      {live ? <EngineLayer /> : <Img src={staticFile(`frames3d_reels/${pad(frame)}.jpg`)} style={{ width: "100%", height: "100%" }} />}
      <LuxeBackdrop />
      <LuxeOverlays />
      {audio ? <Audio src={staticFile("audio/mix.wav")} /> : null}
    </AbsoluteFill>
  );
};
