import "./index.css";
import { Composition, Folder } from "remotion";
import { MyComposition } from "./Composition";
import { AvuIntro, avuIntroSchema } from "./compositions/AvuIntro/AvuIntro";
import {
  calculateShowcaseMetadata,
  Showcase,
} from "./compositions/Showcase/Showcase";
import { IntroScene } from "./compositions/Showcase/scenes/IntroScene";
import { OutroScene } from "./compositions/Showcase/scenes/OutroScene";
import { ShapesScene } from "./compositions/Showcase/scenes/ShapesScene";
import { TypeScene } from "./compositions/Showcase/scenes/TypeScene";
import { showcaseSchema } from "./compositions/Showcase/timeline";
import { TitleCard, titleCardSchema } from "./compositions/TitleCard/TitleCard";
import { VIDEO } from "./config/video";

/**
 * Every renderable video is registered here.
 *
 * - Width, height and fps come from src/config/video.ts (change them there).
 * - Showcase computes its duration from the scene lengths in its props.
 * - The scenes are also registered on their own ("connected compositions"),
 *   so each can be previewed and edited in its own Studio timeline.
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="AVU-Wine-Stories">
        <Composition
          id="AvuIntro"
          component={AvuIntro}
          width={VIDEO.width}
          height={VIDEO.height}
          fps={VIDEO.fps}
          durationInFrames={8 * VIDEO.fps}
          schema={avuIntroSchema}
          defaultProps={{
            title: "Wine Stories",
            subtitle: "",
            withAudio: true,
          }}
        />
        {/* Vertical version for YouTube Shorts, Reels and TikTok. */}
        <Composition
          id="AvuIntro-Vertical"
          component={AvuIntro}
          width={1080}
          height={1920}
          fps={VIDEO.fps}
          durationInFrames={8 * VIDEO.fps}
          schema={avuIntroSchema}
          defaultProps={{
            title: "Wine Stories",
            subtitle: "",
            withAudio: true,
          }}
        />
      </Folder>

      <Composition
        id="Showcase"
        component={Showcase}
        width={VIDEO.width}
        height={VIDEO.height}
        fps={VIDEO.fps}
        durationInFrames={420}
        schema={showcaseSchema}
        calculateMetadata={calculateShowcaseMetadata}
        defaultProps={{
          title: "Motion graphics, written in code.",
          subtitle:
            "Animated type, vector shapes and smooth transitions — all rendered from React.",
          accentColor: "#7C5CFF",
          accentColorTo: "#22D3EE",
          introSeconds: 4,
          shapesSeconds: 4.5,
          typeSeconds: 4,
          outroSeconds: 4,
          transitionSeconds: 0.7,
          withAudio: true,
        }}
      />

      <Folder name="Showcase-Scenes">
        <Composition
          id="Showcase-Intro"
          component={IntroScene}
          width={VIDEO.width}
          height={VIDEO.height}
          fps={VIDEO.fps}
          durationInFrames={4 * VIDEO.fps}
          defaultProps={{
            title: "Motion graphics, written in code.",
            subtitle:
              "Animated type, vector shapes and smooth transitions — all rendered from React.",
            accentColor: "#7C5CFF",
            accentColorTo: "#22D3EE",
          }}
        />
        <Composition
          id="Showcase-Shapes"
          component={ShapesScene}
          width={VIDEO.width}
          height={VIDEO.height}
          fps={VIDEO.fps}
          durationInFrames={4.5 * VIDEO.fps}
          defaultProps={{
            accentColor: "#7C5CFF",
            accentColorTo: "#22D3EE",
            withAudio: true,
          }}
        />
        <Composition
          id="Showcase-Type"
          component={TypeScene}
          width={VIDEO.width}
          height={VIDEO.height}
          fps={VIDEO.fps}
          durationInFrames={4 * VIDEO.fps}
          defaultProps={{
            accentColor: "#7C5CFF",
            accentColorTo: "#22D3EE",
          }}
        />
        <Composition
          id="Showcase-Outro"
          component={OutroScene}
          width={VIDEO.width}
          height={VIDEO.height}
          fps={VIDEO.fps}
          durationInFrames={4 * VIDEO.fps}
          defaultProps={{
            accentColor: "#7C5CFF",
            accentColorTo: "#22D3EE",
          }}
        />
      </Folder>

      <Folder name="Templates">
        <Composition
          id="TitleCard"
          component={TitleCard}
          width={VIDEO.width}
          height={VIDEO.height}
          fps={VIDEO.fps}
          durationInFrames={3 * VIDEO.fps}
          schema={titleCardSchema}
          defaultProps={{
            label: "Chapter 01",
            title: "A reusable title card.",
            accentColor: "#FF6B6B",
            accentColorTo: "#FFC857",
          }}
        />
        {/* Original blank scaffold composition, kept as-is. */}
        <MyComposition />
      </Folder>
    </>
  );
};
