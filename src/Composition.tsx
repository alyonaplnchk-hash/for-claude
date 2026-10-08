import { Video } from "@remotion/media";
import { loadFont } from "@remotion/fonts";
import {
  AbsoluteFill,
  Composition,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

const sora = "Sora";
const playfair = "Playfair Display";
const pinyon = "Pinyon Script";

const fontsLoaded = Promise.all([
  loadFont({
    family: sora,
    url: staticFile("fonts/sora-latin-400-normal.woff2"),
    weight: "400",
  }),
  loadFont({
    family: sora,
    url: staticFile("fonts/sora-latin-700-normal.woff2"),
    weight: "700",
  }),
  loadFont({
    family: playfair,
    url: staticFile("fonts/playfair-display-latin-400-italic.woff2"),
    style: "italic",
  }),
  loadFont({
    family: pinyon,
    url: staticFile("fonts/pinyon-script-latin-400-normal.woff2"),
  }),
]);
void fontsLoaded;

const GOLD = "#8A774C";
const INK = "#2B261E";
const FPS = 30;
const DURATION = 6 * FPS;
// Source footage is 5.04s; slow it slightly so it fills the intro.
const VIDEO_RATE = 5.04 / 6;

export type IntroProps = {
  guestLogo: string;
  guestLogoWidth: number;
};

const ease = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// Fade up from a soft blur — the shared entrance for every element.
const reveal = (frame: number, start: number, length = 30, rise = 30) => ({
  opacity: interpolate(frame, [start, start + length], [0, 1], {
    ...clamp,
    easing: ease,
  }),
  translate: `0px ${interpolate(frame, [start, start + length], [rise, 0], {
    ...clamp,
    easing: ease,
  })}px`,
  filter: `blur(${interpolate(frame, [start, start + length], [10, 0], {
    ...clamp,
    easing: ease,
  })}px)`,
});

export const ProducerSpotlightIntro: React.FC<IntroProps> = ({
  guestLogo,
  guestLogoWidth,
}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: "#F6F1E7" }}>
      {/* Store footage: starts crisp, then softens behind a light veil */}
      <AbsoluteFill
        style={{
          filter: `blur(${interpolate(frame, [8, 50], [0, 14], {
            ...clamp,
            easing: Easing.inOut(Easing.cubic),
          })}px)`,
          scale: interpolate(frame, [0, DURATION], [1.18, 1.26], clamp),
        }}
      >
        <Video
          src={staticFile("store.mp4")}
          playbackRate={VIDEO_RATE}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 75% 55% at 50% 50%, rgba(250,246,238,0.82) 0%, rgba(246,241,231,0.62) 60%, rgba(240,233,220,0.5) 100%)",
          opacity: interpolate(frame, [8, 50], [0, 1], {
            ...clamp,
            easing: Easing.inOut(Easing.cubic),
          }),
        }}
      />

      {/* Content column */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          paddingBottom: 40,
        }}
      >
        <Img
          src={staticFile("avu-logo.png")}
          style={{ width: 230, marginBottom: 90, ...reveal(frame, 92, 34) }}
        />

        <div
          style={{
            fontFamily: sora,
            fontWeight: 700,
            fontSize: 58,
            color: INK,
            paddingLeft: "0.55em",
            letterSpacing: `${interpolate(frame, [32, 80], [0.9, 0.55], {
              ...clamp,
              easing: ease,
            })}em`,
            ...reveal(frame, 32, 36, 20),
          }}
        >
          PRODUCER
        </div>

        <div
          style={{
            fontFamily: pinyon,
            fontSize: 250,
            lineHeight: 1.1,
            marginTop: -18,
            paddingInline: 40,
            // Gold with a slow light sweep across the letters
            backgroundImage: `linear-gradient(100deg, ${GOLD} 0%, ${GOLD} 40%, #D8C79A 50%, ${GOLD} 60%, ${GOLD} 100%)`,
            backgroundSize: "250% 100%",
            backgroundPositionX: `${interpolate(frame, [125, 175], [100, 0], {
              ...clamp,
              easing: Easing.inOut(Easing.quad),
            })}%`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            ...reveal(frame, 50, 40, 26),
          }}
        >
          Spotlight
        </div>

        <div
          style={{
            width: interpolate(frame, [100, 135], [0, 360], {
              ...clamp,
              easing: ease,
            }),
            height: 2,
            marginTop: 40,
            background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
          }}
        />

        <div
          style={{
            fontFamily: playfair,
            fontStyle: "italic",
            fontSize: 48,
            color: INK,
            marginTop: 46,
            ...reveal(frame, 108, 30, 16),
          }}
        >
          in conversation with
        </div>

        <Img
          src={staticFile(guestLogo)}
          style={{
            width: guestLogoWidth,
            marginTop: 54,
            ...reveal(frame, 122, 36, 24),
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const MyComposition = () => {
  return (
    <Composition
      id="ProducerSpotlightIntro"
      component={ProducerSpotlightIntro}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{
        guestLogo: "guests/lynch-bages.png",
        guestLogoWidth: 480,
      }}
    />
  );
};
