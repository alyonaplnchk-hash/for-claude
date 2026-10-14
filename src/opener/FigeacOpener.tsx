import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { playfair, sans, serif } from "../fonts";

export const OPENER_DURATION = 240;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// Brand gold, deepened and nudged toward olive so it reads less orange on screen.
const BG = "#706240";
const IVORY = "#FBF8F1";
const FIGEAC_RED = "#A92728";
const TITLE_WORDS = [
  { text: "AVU", italic: false },
  { text: "WINE", italic: false },
  { text: "STORIES", italic: true },
];

// Layout grid. Nothing goes below SAFE_BOTTOM (YouTube player controls).
const SAFE_BOTTOM = 880;
const COLUMN_X = 650;
const BOTTLE_RATIO = 475 / 1670;
const LOGO_RATIO = 125 / 983;
const PHOTO = { left: 1130, top: 430, width: 680, height: 680 * (947 / 1440) };

// Rounded corners (radius 10) with a 5px feathered edge for the estate photo.
const photoMask = (w: number, h: number) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>` +
      "<filter id='f' x='-5%' y='-5%' width='110%' height='110%'><feGaussianBlur stdDeviation='2.5'/></filter>" +
      `<rect x='2.5' y='2.5' width='${w - 5}' height='${h - 5}' rx='10' fill='white' filter='url(#f)'/>` +
      "</svg>",
  )}`;
const PHOTO_MASK = photoMask(PHOTO.width, Math.round(PHOTO.height));

const ease = Easing.bezier(0.25, 0.1, 0.25, 1);
const settle = Easing.bezier(0.16, 1, 0.3, 1);
const smooth = Easing.bezier(0.65, 0, 0.35, 1);

export const FigeacOpener: React.FC = () => {
  const frame = useCurrentFrame();

  const bottle = interpolate(frame, [0, 40], [0, 1], { ...clamp, easing: settle });
  const photo = interpolate(frame, [34, 80], [0, 1], { ...clamp, easing: settle });
  const logo = interpolate(frame, [46, 86], [0, 100], { ...clamp, easing: smooth });
  const rule = interpolate(frame, [80, 112], [0, 72], { ...clamp, easing: settle });
  const details = interpolate(frame, [92, 122], [0, 1], { ...clamp, easing: ease });

  const bottleHeight = 790;
  const bottleWidth = bottleHeight * BOTTLE_RATIO;

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      {/* Faint grain instead of the old line pattern */}
      <svg width={1920} height={1080} style={{ position: "absolute", opacity: 0.12 }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={5} />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 0.95  0 0 0 0 0.85  0 0 0 0.35 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>

      {/* Bottle: upright, one soft contact shadow (light from the left) */}
      <div
        style={{
          position: "absolute",
          left: 330 - bottleWidth / 2,
          top: SAFE_BOTTOM - bottleHeight,
          width: bottleWidth,
          height: bottleHeight,
          opacity: bottle,
          translate: `0px ${(1 - bottle) * 40}px`,
          scale: interpolate(frame, [0, OPENER_DURATION], [1, 1.035], clamp),
          transformOrigin: "50% 100%",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: bottleWidth * 0.05,
            width: bottleWidth * 1.4,
            bottom: -14,
            height: 34,
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at 40% 50%, rgba(25,18,6,0.55) 0%, rgba(25,18,6,0) 70%)",
            filter: "blur(4px)",
          }}
        />
        <Img
          name="Figeac 2022 bottle"
          src={staticFile("figeac/bottle.png")}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        />
      </div>

      {/* Series title: each word rises out of a mask */}
      <div
        style={{
          position: "absolute",
          left: COLUMN_X,
          top: 112,
          display: "flex",
          gap: "0.28em",
          fontFamily: playfair,
          fontWeight: 600,
          fontSize: 112,
          lineHeight: 1.08,
          letterSpacing: "0.03em",
          color: IVORY,
        }}
      >
        {TITLE_WORDS.map((word, i) => {
          const start = 18 + i * 7;
          return (
            <div
              key={word.text}
              style={{
                overflow: "hidden",
                fontStyle: word.italic ? "italic" : "normal",
                paddingRight: word.italic ? "0.08em" : 0,
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

      {/* Château Figeac logotype, wiped in from the left */}
      <Img
        name="Chateau-Figeac logotype"
        src={staticFile("figeac/logo.png")}
        style={{
          position: "absolute",
          left: COLUMN_X + 4,
          top: 280,
          width: 720,
          height: 720 * LOGO_RATIO,
          clipPath: `inset(-10% ${100 - logo}% -10% 0)`,
        }}
      />

      {/* Details column, left of the photo */}
      <div
        style={{
          position: "absolute",
          left: COLUMN_X + 4,
          top: PHOTO.top,
          width: 420,
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        <div style={{ width: rule, height: 2, backgroundColor: FIGEAC_RED }} />
        <div
          style={{
            fontFamily: serif,
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: 46,
            lineHeight: 1.1,
            color: IVORY,
            opacity: details,
            translate: `0px ${(1 - details) * 12}px`,
          }}
        >
          Saint-Émilion, Bordeaux
        </div>
        <div
          style={{
            fontFamily: sans,
            fontWeight: 500,
            fontSize: 17,
            letterSpacing: "0.32em",
            lineHeight: 1.7,
            color: "rgba(251,248,241,0.75)",
            opacity: details,
            translate: `0px ${(1 - details) * 12}px`,
          }}
        >
          PREMIER GRAND CRU
          <br />
          CLASSÉ A
        </div>
      </div>

      {/* Estate photo, uncropped, rising from below */}
      <div
        style={{
          position: "absolute",
          left: PHOTO.left,
          top: PHOTO.top,
          width: PHOTO.width,
          height: PHOTO.height,
          opacity: interpolate(photo, [0, 0.35], [0, 1], clamp),
          translate: `0px ${(1 - photo) * 140}px`,
          filter: "drop-shadow(0 22px 28px rgba(25, 18, 6, 0.35))",
        }}
      >
        <Img
          name="Chateau-Figeac estate"
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
    </AbsoluteFill>
  );
};
