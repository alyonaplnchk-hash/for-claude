import "./index.css";
import { Composition, Folder } from "remotion";
import { AvuIntro } from "./AvuIntro";
import { FigeacOpener, OPENER_DURATION } from "./opener/FigeacOpener";
import { TITLE_CARD_DURATION, TitleCard } from "./titlecard/TitleCard";
import { AvuTitle, TITLE_DURATION } from "./title/AvuTitle";
import { Estate } from "./scenes/Estate";
import { Finale } from "./scenes/Finale";
import { History } from "./scenes/History";
import { Personalities } from "./scenes/Personalities";
import { FPS, INTRO_DURATION, SCENES } from "./theme";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="FigeacTitleCardA"
        component={TitleCard}
        defaultProps={{ variant: "A" as const }}
        durationInFrames={TITLE_CARD_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="FigeacTitleCardB"
        component={TitleCard}
        defaultProps={{ variant: "B" as const }}
        durationInFrames={TITLE_CARD_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="FigeacTitleCardC"
        component={TitleCard}
        defaultProps={{ variant: "C" as const }}
        durationInFrames={TITLE_CARD_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="FigeacOpener"
        component={FigeacOpener}
        durationInFrames={OPENER_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="AvuWineStoriesTitle"
        component={AvuTitle}
        durationInFrames={TITLE_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
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
