import "./index.css";
import { Composition } from "remotion";
import { BordeauxFilm } from "./film/Film";
import { FPS, H, TOTAL_FRAMES, W } from "./film/timeline";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Final film: 3D layer pre-rendered by tools/render3d, infographics + audio composited here */}
      <Composition id="Bordeaux" component={BordeauxFilm} durationInFrames={TOTAL_FRAMES} fps={FPS} width={W} height={H} defaultProps={{ live: false, audio: true }} />
      {/* Same film with the engine running live in the page (Studio preview) */}
      <Composition id="BordeauxLive" component={BordeauxFilm} durationInFrames={TOTAL_FRAMES} fps={FPS} width={W} height={H} defaultProps={{ live: true, audio: false }} />
    </>
  );
};
