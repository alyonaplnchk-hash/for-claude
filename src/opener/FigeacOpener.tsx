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

const BG = "#8A7649";
const BG_EDGE = "#6F5E38";
const IVORY = "#FBF8F1";
const TITLE = "AVU WINE STORIES";

// Scattered outline copies of the AVU emblem, like the pattern on the Le Pin cover.
const TILES = new Array(8 * 5).fill(true).map((_, i) => {
  const col = i % 8;
  const row = Math.floor(i / 8);
  return {
    x: col * 290 - 120 + (row % 2) * 145 + random(`tx-${i}`) * 60,
    y: row * 270 - 140 + random(`ty-${i}`) * 60,
    rotate: random(`tr-${i}`) * 360,
    size: 170 + random(`ts-${i}`) * 70,
  };
});

const Pattern: React.FC<{ frame: number }> = ({ frame }) => (
  <AbsoluteFill
    style={{
      opacity: interpolate(frame, [0, 20], [0, 1], clamp),
      translate: `${-frame * 0.35}px ${-frame * 0.2}px`,
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
          <path key={d} d={d} fill="none" stroke={IVORY} strokeOpacity={0.16} strokeWidth={9} />
        ))}
      </svg>
    ))}
  </AbsoluteFill>
);

export const FigeacOpener: React.FC = () => {
  const frame = useCurrentFrame();

  const bottleIn = interpolate(frame, [16, 46], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.34, 1.3, 0.64, 1),
  });
  const photoIn = interpolate(frame, [6, 40], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const write = interpolate(frame, [70, 118], [-15, 100], {
    ...clamp,
    easing: Easing.bezier(0.45, 0, 0.35, 1),
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 55% 45%, ${BG} 40%, ${BG_EDGE} 100%)`,
      }}
    >
      <Pattern frame={frame} />

      {/* Estate photo with an arched top */}
      <div
        style={{
          position: "absolute",
          left: 600,
          top: 560,
          width: 900,
          height: 450,
          borderRadius: 14,
          border: `7px solid ${IVORY}`,
          overflow: "hidden",
          boxShadow: "0 24px 50px rgba(40, 30, 10, 0.45)",
          opacity: photoIn,
          translate: `0px ${(1 - photoIn) * 120}px`,
        }}
      >
        <Img
          name="Chateau Figeac"
          src={staticFile("figeac/estate.jpg")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "50% 40%",
            scale: interpolate(frame, [0, OPENER_DURATION], [1.18, 1.02], clamp),
          }}
        />
      </div>

      {/* Bottle */}
      <Img
        name="Figeac bottle"
        src={staticFile("figeac/bottle.png")}
        style={{
          position: "absolute",
          left: 150,
          top: 150,
          height: 880,
          rotate: `${interpolate(bottleIn, [0, 1], [-24, -6])}deg`,
          translate: `${interpolate(bottleIn, [0, 1], [-520, 0])}px ${Math.sin(frame / 22) * 6}px`,
          filter: "drop-shadow(18px 26px 26px rgba(30, 20, 5, 0.5))",
        }}
      />

      {/* AVU WINE STORIES */}
      <div
        style={{
          position: "absolute",
          left: 440,
          right: 60,
          top: 110,
          display: "flex",
          justifyContent: "center",
          fontFamily: playfair,
          fontWeight: 700,
          fontSize: 146,
          lineHeight: 1,
          letterSpacing: "0.01em",
          color: IVORY,
          textShadow: "0 6px 24px rgba(40, 30, 10, 0.25)",
          whiteSpace: "pre",
        }}
      >
        {TITLE.split("").map((ch, i) => {
          const start = 30 + i * 2.4;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                opacity: interpolate(frame, [start, start + 12], [0, 1], clamp),
                translate: `0px ${interpolate(frame, [start, start + 20], [-70, 0], {
                  ...clamp,
                  easing: Easing.bezier(0.34, 1.4, 0.64, 1),
                })}px`,
                filter: `blur(${interpolate(frame, [start, start + 14], [10, 0], clamp)}px)`,
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>

      {/* Château Figeac, written on in script */}
      <Interactive.Div
        name="Chateau Figeac"
        style={{
          position: "absolute",
          right: 70,
          top: 265,
          padding: "0 30px",
          fontFamily: script,
          fontSize: 230,
          lineHeight: 1.1,
          color: IVORY,
          textShadow: "0 6px 24px rgba(40, 30, 10, 0.25)",
          WebkitMaskImage: `linear-gradient(90deg, #000 ${write}%, transparent ${write + 15}%)`,
          maskImage: `linear-gradient(90deg, #000 ${write}%, transparent ${write + 15}%)`,
        }}
      >
        Château Figeac
      </Interactive.Div>
    </AbsoluteFill>
  );
};
