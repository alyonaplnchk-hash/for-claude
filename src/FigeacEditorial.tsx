import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Interactive,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

// Luxury editorial cut of the Château-Figeac title (8 s).
// Uses only the layers cut from the reference image (see scripts/), plus
// typographic details: hairlines, a frame and small-caps captions.
const layer = (name: string) => staticFile(`figeac/${name}.png`);

const INK = "#7a6e44"; // gold-olive of "AVU WINE Stories"
const HAIRLINE = "#a08c55";
const SERIF = "Cormorant Garamond";

// Geometry from the reference image
const PHOTO_WIDTH = 785;
const PHOTO_CROP = 666; // bottle's left edge; no photo pixels exist behind it
const PLATE = { left: 170, top: 210, right: 570, bottom: 850 };
const TITLE_BOX = { left: 940, top: 470, width: 880, height: 175 };
const DIVIDER_Y = 392;
const CENTRE_X = 1380;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const expoOut = Easing.bezier(0.16, 1, 0.3, 1);
const cubicOut = Easing.bezier(0.33, 1, 0.68, 1);
const quintInOut = Easing.bezier(0.83, 0, 0.17, 1);
const sineInOut = Easing.bezier(0.37, 0, 0.63, 1);

const full: React.CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
  width: 1920,
  height: 1080,
};

const useSerif = () => {
  const [handle] = useState(() => delayRender("Loading Cormorant Garamond"));
  useEffect(() => {
    const font = new FontFace(
      SERIF,
      `url(${staticFile("figeac/cormorant-500.woff2")}) format("woff2")`,
      { weight: "500" },
    );
    font
      .load()
      .then(() => {
        document.fonts.add(font);
        continueRender(handle);
      })
      .catch((err) => {
        throw err;
      });
  }, [handle]);
};

const caption = (
  letterSpacingEm: number,
  size = 22,
): React.CSSProperties => ({
  fontFamily: SERIF,
  fontWeight: 500,
  fontSize: size,
  color: INK,
  textTransform: "uppercase",
  letterSpacing: `${letterSpacingEm}em`,
  // trailing tracking would push the text off-centre
  paddingLeft: `${letterSpacingEm}em`,
  whiteSpace: "nowrap",
  fontVariantNumeric: "lining-nums",
});

export const FigeacEditorial: React.FC = () => {
  useSerif();
  const frame = useCurrentFrame();

  // --- photo window: a small plate that rises in, then opens to the panel
  const rise = interpolate(frame, [4, 38], [0, 1], { ...clamp, easing: expoOut });
  const open = interpolate(frame, [44, 82], [0, 1], { ...clamp, easing: quintInOut });
  const plateTop = PLATE.bottom - (PLATE.bottom - PLATE.top) * rise;
  const inset = {
    top: plateTop * (1 - open),
    left: PLATE.left * (1 - open),
    bottom: (1080 - PLATE.bottom) * (1 - open),
    right: 1920 - (PLATE.right + (PHOTO_CROP - PLATE.right) * open),
  };
  const photoClip = `inset(${inset.top}px ${inset.right}px ${inset.bottom}px ${inset.left}px)`;

  const captionsOut = interpolate(frame, [40, 54], [1, 0], { ...clamp, easing: sineInOut });

  // --- main title: rises inside its own box
  const titleLift = interpolate(frame, [114, 148], [170, 0], { ...clamp, easing: expoOut });

  // --- light sweep across the gold of CHÂTEAU-FIGEAC
  const sweepX = interpolate(frame, [168, 210], [860, 1960], { ...clamp, easing: sineInOut });
  const sweep = `linear-gradient(100deg, transparent ${sweepX - 140}px, rgba(255, 244, 214, 0.9) ${sweepX}px, transparent ${sweepX + 140}px)`;

  return (
    <AbsoluteFill style={{ backgroundColor: "#cbc5b1" }}>
      <Img src={layer("background")} style={full} />

      {/* 0:00–0:01.3 — the château as a framed plate, rising in */}
      <div style={{ ...full, clipPath: photoClip }}>
        <Img
          src={layer("chateau-photo")}
          style={{ position: "absolute", left: 0, top: 0, width: PHOTO_WIDTH, height: 1080 }}
        />
      </div>

      {/* hairline frame around the plate */}
      <svg
        width={1920}
        height={1080}
        style={{
          ...full,
          opacity: captionsOut,
        }}
      >
        <rect
          x={PLATE.left - 16}
          y={PLATE.top - 16}
          width={PLATE.right - PLATE.left + 32}
          height={PLATE.bottom - PLATE.top + 32}
          fill="none"
          stroke={HAIRLINE}
          strokeWidth={1.25}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={interpolate(frame, [10, 46], [1, 0], { ...clamp, easing: sineInOut })}
        />
      </svg>

      {/* plate captions */}
      {(
        [
          ["Saint-Émilion", PLATE.top - 72],
          ["Bordeaux", PLATE.bottom + 44],
        ] as const
      ).map(([text, top], i) => (
        <Interactive.Div
          key={text}
          name={`Plate caption ${i + 1}`}
          style={{
            position: "absolute",
            left: 0,
            width: PLATE.left + PLATE.right,
            top,
            textAlign: "center",
            ...caption(
              interpolate(frame, [18 + i * 4, 46 + i * 4], [0.7, 0.42], { ...clamp, easing: cubicOut }),
            ),
            opacity:
              interpolate(frame, [18 + i * 4, 40 + i * 4], [0, 1], { ...clamp, easing: sineInOut }) *
              captionsOut,
          }}
        >
          {text}
        </Interactive.Div>
      ))}

      {/* the strip beside the bottle's neck joins as the bottle arrives */}
      <div
        style={{
          ...full,
          clipPath: `inset(0px ${1920 - PHOTO_WIDTH}px 0px ${PHOTO_CROP}px)`,
          opacity: interpolate(frame, [80, 92], [0, 1], { ...clamp, easing: sineInOut }),
        }}
      >
        <Img
          src={layer("chateau-photo")}
          style={{ position: "absolute", left: 0, top: 0, width: PHOTO_WIDTH, height: 1080 }}
        />
      </div>

      {/* 0:02.4–0:03.6 — bottle, solid at once, settles 45px */}
      <Interactive.Div
        name="Bottle"
        style={{
          ...full,
          opacity: interpolate(frame, [72, 75], [0, 1], clamp),
          translate: interpolate(frame, [72, 108], ["0px 45px", "0px 0px"], {
            ...clamp,
            easing: cubicOut,
          }),
        }}
      >
        <Img src={layer("bottle")} style={full} />
      </Interactive.Div>

      {/* "AVU WINE Stories" — static from the first frame */}
      <Img src={layer("title-series")} style={full} />

      {/* 0:03.2 — divider: hairlines open outward around the vintage */}
      {([-1, 1] as const).map((side) => (
        <div
          key={side}
          style={{
            position: "absolute",
            top: DIVIDER_Y,
            left: side < 0 ? CENTRE_X - 172 - 200 : CENTRE_X + 172,
            width: 200,
            height: 1.25,
            backgroundColor: HAIRLINE,
            transformOrigin: side < 0 ? "100% 50%" : "0% 50%",
            scale: `${interpolate(frame, [96, 130], [0, 1], { ...clamp, easing: expoOut })} 1`,
          }}
        />
      ))}
      <Interactive.Div
        name="Vintage"
        style={{
          position: "absolute",
          left: CENTRE_X - 300,
          width: 600,
          top: DIVIDER_Y - 15,
          textAlign: "center",
          ...caption(
            interpolate(frame, [102, 136], [0.75, 0.42], { ...clamp, easing: cubicOut }),
            24,
          ),
          lineHeight: "30px",
          opacity: interpolate(frame, [102, 126], [0, 1], { ...clamp, easing: sineInOut }),
        }}
      >
        Millésime 2022
      </Interactive.Div>

      {/* 0:03.8–0:04.9 — CHÂTEAU-FIGEAC rises from behind its baseline */}
      <div
        style={{
          position: "absolute",
          left: TITLE_BOX.left,
          top: TITLE_BOX.top,
          width: TITLE_BOX.width,
          height: TITLE_BOX.height,
          overflow: "hidden",
        }}
      >
        <Interactive.Div
          name="Main title"
          style={{
            ...full,
            left: -TITLE_BOX.left,
            top: -TITLE_BOX.top,
            translate: `0px ${titleLift}px`,
            opacity: interpolate(frame, [114, 126], [0, 1], clamp),
          }}
        >
          <Img src={layer("title-main")} style={full} />
        </Interactive.Div>
      </div>

      {/* 0:05.6–0:07 — a slow light sweep across the gold letters */}
      <div
        style={{
          ...full,
          backgroundImage: sweep,
          maskImage: `url(${layer("title-main-gold-mask")})`,
          WebkitMaskImage: `url(${layer("title-main-gold-mask")})`,
          maskSize: "1920px 1080px",
          WebkitMaskSize: "1920px 1080px",
          mixBlendMode: "screen",
          opacity: frame >= 168 && frame <= 212 ? 0.75 : 0,
        }}
      />

      {/* 0:04.7–0:05.3 — classification and lions */}
      <Interactive.Div
        name="Classification"
        style={{
          ...full,
          opacity: interpolate(frame, [142, 162], [0, 1], { ...clamp, easing: sineInOut }),
          translate: interpolate(frame, [142, 166], ["0px 12px", "0px 0px"], {
            ...clamp,
            easing: cubicOut,
          }),
        }}
      >
        <Img src={layer("title-class")} style={full} />
      </Interactive.Div>

      {/* fine film grain over everything */}
      <Img
        src={layer(`grain-${Math.floor(frame / 2) % 6}`)}
        style={{ ...full, mixBlendMode: "overlay", opacity: 0.06 }}
      />
    </AbsoluteFill>
  );
};
