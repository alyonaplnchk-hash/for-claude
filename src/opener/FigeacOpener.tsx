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

// Brand gold, deepened and nudged toward olive so it reads less orange on screen.
const BG = "#706240";
const IVORY = "#FBF8F1";
const TITLE_WORDS = ["AVU", "WINE", "STORIES"];

// Rounded corners (radius 10) with a 5px feathered edge for the estate photo.
const PHOTO_MASK = `data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='730' height='480'>" +
    "<filter id='f' x='-5%' y='-5%' width='110%' height='110%'><feGaussianBlur stdDeviation='2.5'/></filter>" +
    "<rect x='2.5' y='2.5' width='725' height='475' rx='10' fill='white' filter='url(#f)'/>" +
    "</svg>",
)}`;

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
  const photo = interpolate(frame, [8, 50], [0, 1], { ...clamp, easing: settle });
  const bottle = interpolate(frame, [22, 62], [0, 1], { ...clamp, easing: settle });
  const write = interpolate(frame, [84, 130], [-15, 100], {
    ...clamp,
    easing: Easing.bezier(0.45, 0, 0.35, 1),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
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

      {/* Estate photo, rising from below */}
      <div
        style={{
          position: "absolute",
          left: 700,
          top: 540,
          // Same 1440x947 proportions as the original photo, so nothing is cropped.
          width: 730,
          height: 480,
          opacity: interpolate(photo, [0, 0.3], [0, 1], clamp),
          translate: `0px ${(1 - photo) * 560}px`,
          scale: interpolate(frame, [8, OPENER_DURATION], [0.97, 1], clamp),
          // drop-shadow follows the feathered alpha edge, unlike box-shadow.
          filter: "drop-shadow(0 26px 30px rgba(35, 26, 8, 0.4))",
        }}
      >
        <Img
          name="Chateau Figeac"
          src={staticFile("figeac/estate.jpg")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            WebkitMaskImage: `url("${PHOTO_MASK}")`,
            maskImage: `url("${PHOTO_MASK}")`,
            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",
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
