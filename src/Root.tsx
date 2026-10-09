import "./index.css";
import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { AVU_GOLD, Ecriture, ECRITURE_DURATION } from "./intro/Ecriture";
import { Editorial, EDITORIAL_DURATION } from "./intro/Editorial";
import { Nocturne, NOCTURNE_DURATION } from "./intro/Nocturne";
import { QuestionCard, QUESTION_DURATION } from "./intro/QuestionCard";
import { FPS, IntroProps } from "./intro/shared";

const guest: IntroProps = {
  guestLogo: "guests/lynch-bages.png",
  guestLogoWidth: 480,
  guestLogoAspect: 792 / 301,
};

const variant = {
  fps: FPS,
  width: 1080,
  height: 1920,
  defaultProps: guest,
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <Composition
        id="Spotlight-A-Ecriture"
        component={Ecriture}
        durationInFrames={ECRITURE_DURATION}
        {...variant}
      />
      <Composition
        id="Spotlight-A-Ecriture-Gold"
        component={Ecriture}
        durationInFrames={ECRITURE_DURATION}
        {...variant}
        defaultProps={{ ...guest, ink: AVU_GOLD, text: AVU_GOLD }}
      />
      <Composition
        id="Spotlight-A-Final"
        component={Ecriture}
        durationInFrames={ECRITURE_DURATION}
        {...variant}
        defaultProps={{
          ...guest,
          ink: AVU_GOLD,
          photo: "store.jpg",
          originalLogos: true,
          veil: 0.36,
          textVeil: 0.55,
        }}
      />
      <Composition
        id="Spotlight-B-Editorial"
        component={Editorial}
        durationInFrames={EDITORIAL_DURATION}
        {...variant}
      />
      <Composition
        id="Spotlight-C-Nocturne"
        component={Nocturne}
        durationInFrames={NOCTURNE_DURATION}
        {...variant}
      />
      <Composition
        id="Question-LynchBages-Stories"
        component={QuestionCard}
        durationInFrames={QUESTION_DURATION}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{
          lines: [
            "What are the most",
            "memorable stories",
            "connected to",
            "Lynch-Bages?",
          ],
          highlight: ["Lynch-Bages"],
          photo: "store.jpg",
        }}
      />
      <Composition
        id="Question-LynchBages-Invite"
        component={QuestionCard}
        durationInFrames={QUESTION_DURATION}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{
          lines: [
            "Who would you invite",
            "to share a bottle",
            "of Lynch-Bages?",
          ],
          highlight: ["Lynch-Bages"],
          photo: "store.jpg",
        }}
      />
      <Composition
        id="Question-LynchBages-Favourite"
        component={QuestionCard}
        durationInFrames={QUESTION_DURATION}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{
          lines: [
            "Apart from",
            "Lynch-Bages,",
            "what’s your",
            "favourite bottle?",
          ],
          highlight: ["Lynch-Bages"],
          photo: "store.jpg",
        }}
      />
    </>
  );
};
