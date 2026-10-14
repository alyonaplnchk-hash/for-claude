import {
  AbsoluteFill,
  Easing,
  Img,
  Interactive,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { EMBLEM_PATHS } from "../components/AvuEmblem";
import { playfair, script } from "../fonts";

export const OPENER_DURATION = 240;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const BG = "#89764B";
const IVORY = "#FBF8F1";
const TITLE_WORDS = ["AVU", "WINE", "STORIES"];

const smooth = Easing.bezier(0.65, 0, 0.35, 1);
const settle = Easing.bezier(0.16, 1, 0.3, 1);

// Sparse, fine-lined AVU emblems drifting slowly behind everything.
const TILES = new Array(6 * 4).fill(true).map((_, i) => {
  const col = i % 6;
  const row = Math.floor(i / 6);
  return {
    x: col * 360 - 140 + (row % 2) * 180 + random(`tx-${i}`) * 50,
    y: row * 320 - 150 + random(`ty-${i}`) * 50,
    rotate: random(`tr-${i}`) * 360,
    size: 200 + random(`ts-${i}`) * 60,
  };
});

const Pattern: React.FC<{ frame: number }> = ({ frame }) => (
  <AbsoluteFill
    style={{
      opacity: interpolate(frame, [0, 30], [0, 1], clamp),
      translate: `${-frame * 0.18}px ${-frame * 0.1}px`,
    }}
  >
    {TILES.map((t, i) => (
      <svg
        key={i}
        width={t.size}
        viewBox="90 0 700 570"
        style={{
          position: "absolute",
          left: t.x,
          top: t.y,
          rotate: `${t.rotate}deg`,
          overflow: "visible",
        }}
      >
        {EMBLEM_PATHS.map((d) => (
          <path key={d} d={d} fill="none" stroke={IVORY} strokeOpacity={0.15} strokeWidth={4} />
        ))}
      </svg>
    ))}
  </AbsoluteFill>
);

export const FigeacOpener: React.FC = () => {
  const frame = useCurrentFrame();

  const frameLine = interpolate(frame, [4, 44], [0, 1], { ...clamp, easing: smooth });
  const photo = interpolate(frame, [10, 46], [0, 1], { ...clamp, easing: smooth });
  const bottle = interpolate(frame, [22, 62], [0, 1], { ...clamp, easing: settle });
  const write = interpolate(frame, [84, 130], [-15, 100], {
    ...clamp,
    easing: Easing.bezier(0.45, 0, 0.35, 1),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      {/* A barely-there glow keeps the flat brand colour from feeling dead */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 55% 42%, rgba(255,248,230,0.07) 0%, rgba(255,248,230,0) 60%)",
        }}
      />
      <Pattern frame={frame} />

      {/* Fine ivory hairline framing the whole picture */}
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        <rect
          x={34}
          y={34}
          width={1852}
          height={1012}
          fill="none"
          stroke={IVORY}
          strokeOpacity={0.35}
          strokeWidth={1.2}
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1 - frameLine}
        />
      </svg>

      {/* Estate photo, opening from its centre */}
      <div
        style={{
          position: "absolute",
          left: 610,
          top: 575,
          width: 880,
          height: 430,
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: "0 30px 60px rgba(35, 26, 8, 0.38)",
          clipPath: `inset(0 ${(1 - photo) * 50}% 0 ${(1 - photo) * 50}% round 4px)`,
        }}
      >
        <Img
          name="Chateau Figeac"
          src={staticFile("figeac/estate.jpg")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "50% 42%",
            scale: interpolate(frame, [10, OPENER_DURATION], [1.18, 1.03], clamp),
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 14,
            border: `1px solid ${IVORY}`,
            opacity: interpolate(frame, [44, 64], [0, 0.75], clamp),
          }}
        />
      </div>

      {/* Bottle */}
      <Img
        name="Figeac bottle"
        src={staticFile("figeac/bottle.png")}
        style={{
          position: "absolute",
          left: 170,
          top: 140,
          height: 880,
          opacity: interpolate(bottle, [0, 0.4], [0, 1], clamp),
          rotate: `${interpolate(bottle, [0, 1], [-11, -5])}deg`,
          translate: `${interpolate(bottle, [0, 1], [-260, 0])}px ${Math.sin(frame / 30) * 4}px`,
          filter: "drop-shadow(16px 24px 26px rgba(35, 26, 8, 0.45))",
        }}
      />

      {/* AVU WINE STORIES: each word rises out of a mask */}
      <div
        style={{
          position: "absolute",
          left: 470,
          right: 80,
          top: 118,
          display: "flex",
          justifyContent: "center",
          gap: "0.32em",
          fontFamily: playfair,
          fontWeight: 600,
          fontSize: 128,
          lineHeight: 1.08,
          letterSpacing: "0.07em",
          color: IVORY,
        }}
      >
        {TITLE_WORDS.map((word, i) => {
          const start = 38 + i * 8;
          return (
            <div key={word} style={{ overflow: "hidden" }}>
              <div
                style={{
                  translate: `0px ${interpolate(frame, [start, start + 30], [105, 0], {
                    ...clamp,
                    easing: settle,
                  })}%`,
                }}
              >
                {word}
              </div>
            </div>
          );
        })}
      </div>

      {/* Château Figeac, written on in script */}
      <Interactive.Div
        name="Chateau Figeac"
        style={{
          position: "absolute",
          right: 100,
          top: 262,
          padding: "0 30px",
          fontFamily: script,
          fontSize: 214,
          lineHeight: 1.1,
          color: IVORY,
          WebkitMaskImage: `linear-gradient(90deg, #000 ${write}%, transparent ${write + 15}%)`,
          maskImage: `linear-gradient(90deg, #000 ${write}%, transparent ${write + 15}%)`,
        }}
      >
        Château Figeac
      </Interactive.Div>
    </AbsoluteFill>
  );
};
