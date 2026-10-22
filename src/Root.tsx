import "./index.css";
import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { MondaviRoute } from "./MondaviRoute";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MondaviRoute"
        component={MondaviRoute}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
      />
      <MyComposition />
    </>
  );
};
