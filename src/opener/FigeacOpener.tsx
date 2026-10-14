import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { EMBLEM_PATHS } from "../components/AvuEmblem";
import { playfair } from "../fonts";

export const OPENER_DURATION = 240;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// Brand gold, deepened and nudged toward olive so it reads less orange on screen.
const BG = "#706240";
const IVORY = "#F6F1E8";
const TITLE_WORDS = [
  { text: "AVU", italic: false },
  { text: "WINE", italic: false },
  { text: "STORIES", italic: true },
];

const BOTTLE_RATIO = 475 / 1670;
const LOGO_RATIO = 125 / 983;
const PHOTO = { left: 690, top: 548, width: 720, height: 720 * (947 / 1440) };

const settle = Easing.bezier(0.16, 1, 0.3, 1);
const smooth = Easing.bezier(0.65, 0, 0.35, 1);

// Dense scatter of outlined AVU emblems, as on the Le Pin cover.
const TILES = new Array(12 * 8).fill(true).map((_, i) => {
  const col = i % 12;
  const row = Math.floor(i / 12);
  return {
    x: col * 175 - 90 + (row % 2) * 88 + (random(`px-${i}`) - 0.5) * 70,
    y: row * 150 - 90 + (random(`py-${i}`) - 0.5) * 60,
    rotate: random(`pr-${i}`) * 360,
    size: 120 + random(`ps-${i}`) * 50,
  };
});

const Pattern: React.FC<{ frame: number }> = ({ frame }) => (
  <AbsoluteFill
    style={{
      opacity: interpolate(frame, [0, 24], [0, 1], clamp),
      translate: `${-frame * 0.15}px ${-frame * 0.08}px`,
    }}
  >
    {TILES.map((t, i) => (
      <svg
        key={i}
        width={t.size}
        viewBox="90 0 700 570"
        style={{ position: "absolute", left: t.x, top: t.y, rotate: `${t.rotate}deg`, overflow: "visible" }}
      >
        {EMBLEM_PATHS.map((d) => (
          <path key={d} d={d} fill="none" stroke={IVORY} strokeOpacity={0.2} strokeWidth={11} />
        ))}
      </svg>
    ))}
  </AbsoluteFill>
);

export const FigeacOpener: React.FC = () => {
  const frame = useCurrentFrame();

  const bottle = interpolate(frame, [6, 42], [0, 1], { ...clamp, easing: settle });
  const photo = interpolate(frame, [20, 62], [0, 1], { ...clamp, easing: settle });
  const logo = interpolate(frame, [62, 100], [0, 100], { ...clamp, easing: smooth });

  const bottleHeight = 850;
  const bottleWidth = bottleHeight * BOTTLE_RATIO;

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <Pattern frame={frame} />

      {/* Estate cut-out (sky removed), rising from below */}
      <Img
        name="Chateau-Figeac estate"
        src={staticFile("figeac/estate-cutout.png")}
        style={{
          position: "absolute",
          left: PHOTO.left,
          top: PHOTO.top,
          width: PHOTO.width,
          height: PHOTO.height,
          borderRadius: "0 0 10px 10px",
          opacity: interpolate(photo, [0, 0.3], [0, 1], clamp),
          translate: `0px ${(1 - photo) * 160}px`,
          filter: "drop-shadow(0 18px 24px rgba(25, 18, 6, 0.35))",
        }}
      />

      {/* Bottle, slightly tilted, sliding in from the left */}
      <div
        style={{
          position: "absolute",
          left: 255 - bottleWidth / 2,
          top: 175,
          width: bottleWidth,
          height: bottleHeight,
          opacity: interpolate(bottle, [0, 0.35], [0, 1], clamp),
          rotate: `${interpolate(bottle, [0, 1], [-14, -7])}deg`,
          translate: `${interpolate(bottle, [0, 1], [-220, 0])}px ${Math.sin(frame / 32) * 4}px`,
          filter: "drop-shadow(16px 22px 22px rgba(25, 18, 6, 0.45))",
        }}
      >
        <Img
          name="Figeac 2022 bottle"
          src={staticFile("figeac/bottle.png")}
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      {/* AVU WINE STORIES: big display line, words rising out of a mask */}
      <div
        style={{
          position: "absolute",
          left: 430,
          right: 70,
          top: 128,
          display: "flex",
          justifyContent: "center",
          gap: "0.26em",
          fontFamily: playfair,
          fontWeight: 800,
          fontSize: 150,
          lineHeight: 1.12,
          color: IVORY,
        }}
      >
        {TITLE_WORDS.map((word, i) => {
          const start = 30 + i * 8;
          return (
            <div
              key={word.text}
              style={{
                overflow: "hidden",
                fontStyle: word.italic ? "italic" : "normal",
                paddingRight: word.italic ? "0.06em" : 0,
              }}
            >
              <div
                style={{
                  translate: `0px ${interpolate(frame, [start, start + 30], [105, 0], {
                    ...clamp,
                    easing: settle,
                  })}%`,
                }}
              >
                {word.text}
              </div>
            </div>
          );
        })}
      </div>

      {/* Château-Figeac logotype, right-aligned like "Le Pin", wiped in */}
      <Img
        name="Chateau-Figeac logotype"
        src={staticFile("figeac/logo.png")}
        style={{
          position: "absolute",
          right: 100,
          top: 352,
          width: 860,
          height: 860 * LOGO_RATIO,
          clipPath: `inset(-10% ${100 - logo}% -10% 0)`,
        }}
      />
    </AbsoluteFill>
  );
};
