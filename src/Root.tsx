import "./index.css";
import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { AVU_GOLD, Ecriture, ECRITURE_DURATION } from "./intro/Ecriture";
import { Editorial, EDITORIAL_DURATION } from "./intro/Editorial";
import { Nocturne, NOCTURNE_DURATION } from "./intro/Nocturne";
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
    </>
  );
};
