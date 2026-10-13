import "./index.css";
import { Composition, Folder } from "remotion";
import { AvuIntro } from "./AvuIntro";
import { Estate } from "./scenes/Estate";
import { Finale } from "./scenes/Finale";
import { History } from "./scenes/History";
import { Personalities } from "./scenes/Personalities";
import { FPS, INTRO_DURATION, SCENES } from "./theme";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AvuWineStoriesIntro"
        component={AvuIntro}
        durationInFrames={INTRO_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Folder name="Intro-Scenes">
        <Composition id="History" component={History} durationInFrames={SCENES.history} fps={FPS} width={1920} height={1080} />
        <Composition id="Personalities" component={Personalities} durationInFrames={SCENES.personalities} fps={FPS} width={1920} height={1080} />
        <Composition id="Estate" component={Estate} durationInFrames={SCENES.estate} fps={FPS} width={1920} height={1080} />
        <Composition id="Finale" component={Finale} durationInFrames={SCENES.finale} fps={FPS} width={1920} height={1080} />
      </Folder>
    </>
  );
};
