import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { AbsoluteFill } from "remotion";
import { GoldDust } from "./components/GoldDust";
import { Estate } from "./scenes/Estate";
import { Finale } from "./scenes/Finale";
import { History } from "./scenes/History";
import { Personalities } from "./scenes/Personalities";
import { SCENES, TRANSITION } from "./theme";

export const AvuIntro: React.FC = () => {
  return (
    <AbsoluteFill>
      <TransitionSeries>
        <TransitionSeries.Sequence name="History" durationInFrames={SCENES.history}>
          <History />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION })}
        />
        <TransitionSeries.Sequence name="Personalities" durationInFrames={SCENES.personalities}>
          <Personalities />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION })}
        />
        <TransitionSeries.Sequence name="Estate" durationInFrames={SCENES.estate}>
          <Estate />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION })}
        />
        <TransitionSeries.Sequence name="Finale" durationInFrames={SCENES.finale}>
          <Finale />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <GoldDust />
    </AbsoluteFill>
  );
};
