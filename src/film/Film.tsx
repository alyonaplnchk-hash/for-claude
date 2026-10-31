import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { Overlays } from "./overlays/shots";
import { EngineLayer } from "./EngineLayer";

export type FilmProps = { live: boolean; audio: boolean };

const pad = (n: number) => String(n).padStart(5, "0");

export const BordeauxFilm: React.FC<FilmProps> = ({ live, audio }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {live ? <EngineLayer /> : <Img src={staticFile(`frames3d/${pad(frame)}.jpg`)} style={{ width: "100%", height: "100%" }} />}
      <Overlays />
      {audio ? <Audio src={staticFile("audio/mix.wav")} /> : null}
    </AbsoluteFill>
  );
};
