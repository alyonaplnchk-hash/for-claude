import { Composition } from "remotion";
import { FigeacEditorial } from "./FigeacEditorial";
import { FigeacTitle } from "./FigeacTitle";

export const MyComposition = () => {
  return (
    <>
      <Composition
        id="FigeacTitle"
        component={FigeacTitle}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="FigeacEditorial"
        component={FigeacEditorial}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
