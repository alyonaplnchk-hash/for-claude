import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { playfair, serif } from "../fonts";

export const TITLE_CARD_DURATION = 240;

export type TitleCardVariant = "A" | "B" | "C";

// Episode design system.
const CREAM = "#F7F2EB";
const FIGEAC_RED = "#A92728";
const GOLD = "#B99571";
const GOLD_DARK = "#8A6B45";
const INK = "#2B2420";
const NIGHT = "#1E1714";

// Bottle cutout is 475x1670.
const BOTTLE_RATIO = 475 / 1670;
// Figeac logotype is 983x125.
const LOGO_RATIO = 125 / 983;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const ease = Easing.bezier(0.25, 0.1, 0.25, 1);
const settle = Easing.bezier(0.16, 1, 0.3, 1);

const fadeUp = (frame: number, start: number, distance = 18) => ({
  opacity: interpolate(frame, [start, start + 30], [0, 1], { ...clamp, easing: ease }),
  translate: `0px ${interpolate(frame, [start, start + 40], [distance, 0], {
    ...clamp,
    easing: settle,
  })}px`,
});

// Fine paper grain, kept faint so it reads as texture rather than noise.
const PaperGrain: React.FC<{ dark?: boolean }> = ({ dark }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", opacity: dark ? 0.1 : 0.22 }}>
    <filter id="paperGrain">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={3} seed={11} />
      <feColorMatrix
        values={
          dark
            ? "0 0 0 0 0.75  0 0 0 0 0.62  0 0 0 0 0.48  0 0 0 0.35 0"
            : "0 0 0 0 0.45  0 0 0 0 0.36  0 0 0 0 0.27  0 0 0 0.28 0"
        }
      />
    </filter>
    <rect width="100%" height="100%" filter="url(#paperGrain)" />
  </svg>
);

// The bottle with a single soft contact shadow; light comes from the left, so the shadow falls right.
const Bottle: React.FC<{
  frame: number;
  height: number;
  centerX: number;
  bottom: number;
  dark?: boolean;
}> = ({ frame, height, centerX, bottom, dark }) => {
  const width = height * BOTTLE_RATIO;
  return (
    <div
      style={{
        position: "absolute",
        left: centerX - width / 2,
        top: bottom - height,
        width,
        height,
        opacity: interpolate(frame, [0, 36], [0, 1], { ...clamp, easing: ease }),
        // Slow push-in on the bottle across the whole card.
        scale: interpolate(frame, [0, TITLE_CARD_DURATION], [1, 1.045], clamp),
        transformOrigin: "50% 100%",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: width * 0.05,
          width: width * 1.35,
          bottom: -height * 0.018,
          height: height * 0.045,
          borderRadius: "50%",
          background: dark
            ? "radial-gradient(ellipse at 40% 50%, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 70%)"
            : "radial-gradient(ellipse at 40% 50%, rgba(43,36,32,0.38) 0%, rgba(43,36,32,0) 70%)",
          filter: "blur(4px)",
        }}
      />
      <Img
        name="Figeac 2022 bottle"
        src={staticFile("figeac/bottle.png")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
    </div>
  );
};

const SeriesLabel: React.FC<{ frame: number; start: number; color: string; size?: number }> = ({
  frame,
  start,
  color,
  size = 28,
}) => (
  <div
    style={{
      fontFamily: playfair,
      fontWeight: 600,
      fontSize: size,
      letterSpacing: "0.34em",
      paddingLeft: "0.34em",
      color,
      fontVariantNumeric: "lining-nums",
      ...fadeUp(frame, start, 12),
    }}
  >
    AVU WINE <span style={{ fontStyle: "italic" }}>STORIES</span>
  </div>
);

const RedRule: React.FC<{ frame: number; start: number; width?: number }> = ({
  frame,
  start,
  width = 64,
}) => (
  <div
    style={{
      height: 2,
      backgroundColor: FIGEAC_RED,
      width: interpolate(frame, [start, start + 36], [0, width], { ...clamp, easing: settle }),
    }}
  />
);

const FigeacLogotype: React.FC<{ frame: number; start: number; width: number }> = ({
  frame,
  start,
  width,
}) => (
  <Img
    name="Chateau-Figeac logotype"
    src={staticFile("figeac/logo.png")}
    style={{
      width,
      height: width * LOGO_RATIO,
      opacity: interpolate(frame, [start, start + 36], [0, 1], { ...clamp, easing: ease }),
      translate: `0px ${interpolate(frame, [start, start + 46], [22, 0], {
        ...clamp,
        easing: settle,
      })}px`,
      filter: `blur(${interpolate(frame, [start, start + 26], [6, 0], clamp)}px)`,
    }}
  />
);

const Subtitle: React.FC<{ frame: number; start: number; color: string }> = ({
  frame,
  start,
  color,
}) => (
  <div
    style={{
      fontFamily: serif,
      fontWeight: 600,
      fontSize: 25,
      letterSpacing: "0.17em",
      paddingLeft: "0.17em",
      whiteSpace: "nowrap",
      color,
      fontVariantNumeric: "lining-nums",
      ...fadeUp(frame, start, 10),
    }}
  >
    SAINT-ÉMILION <span style={{ color: FIGEAC_RED }}>·</span> PREMIER GRAND CRU CLASSÉ A
  </div>
);

// Château photo used only as a soft, faded backdrop that dissolves into the paper.
const ChateauWash: React.FC<{ frame: number; mask: string; opacity: number; position: string }> = ({
  frame,
  mask,
  opacity,
  position,
}) => (
  <AbsoluteFill
    style={{
      opacity: interpolate(frame, [0, 60], [0, opacity], { ...clamp, easing: ease }),
      WebkitMaskImage: mask,
      maskImage: mask,
    }}
  >
    <Img
      name="Chateau-Figeac estate"
      src={staticFile("figeac/estate.jpg")}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: position,
        filter: "grayscale(1) sepia(0.45) contrast(0.85) brightness(1.08)",
        scale: interpolate(frame, [0, TITLE_CARD_DURATION], [1.06, 1], clamp),
      }}
    />
  </AbsoluteFill>
);

// A: bottle left as the focal object, text block right. No secondary image.
const VariantA: React.FC<{ frame: number }> = ({ frame }) => (
  <AbsoluteFill style={{ backgroundColor: CREAM }}>
    <PaperGrain />
    <Bottle frame={frame} height={780} centerX={560} bottom={872} />
    <div
      style={{
        position: "absolute",
        left: 860,
        width: 900,
        top: 300,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 34,
      }}
    >
      <SeriesLabel frame={frame} start={64} color={GOLD_DARK} />
      <RedRule frame={frame} start={74} />
      <FigeacLogotype frame={frame} start={30} width={800} />
      <Subtitle frame={frame} start={96} color={INK} />
    </div>
  </AbsoluteFill>
);

// B: centred title over a faded château, bottle small and quiet at the left.
const VariantB: React.FC<{ frame: number }> = ({ frame }) => (
  <AbsoluteFill style={{ backgroundColor: CREAM }}>
    <ChateauWash
      frame={frame}
      opacity={0.2}
      position="50% 35%"
      mask="radial-gradient(ellipse 60% 56% at 50% 36%, #000 0%, rgba(0,0,0,0.5) 45%, transparent 100%)"
    />
    {/* Cream veil behind the title keeps the faded château from competing with it */}
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse 36% 22% at 50% 44%, rgba(247,242,235,0.85) 0%, rgba(247,242,235,0) 100%)",
      }}
    />
    <PaperGrain />
    <Bottle frame={frame} height={560} centerX={300} bottom={860} />
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 330,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 32,
      }}
    >
      <SeriesLabel frame={frame} start={64} color={GOLD_DARK} />
      <FigeacLogotype frame={frame} start={30} width={980} />
      <RedRule frame={frame} start={80} width={80} />
      <Subtitle frame={frame} start={96} color={INK} />
    </div>
  </AbsoluteFill>
);

// C: dark, cinematic. Bottle in a warm pool of light, title in gold.
const VariantC: React.FC<{ frame: number }> = ({ frame }) => (
  <AbsoluteFill style={{ backgroundColor: NIGHT }}>
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse 34% 62% at 29% 52%, rgba(185,149,113,0.26) 0%, rgba(185,149,113,0.07) 55%, rgba(30,23,20,0) 100%)",
        opacity: interpolate(frame, [0, 60], [0, 1], { ...clamp, easing: ease }),
      }}
    />
    <AbsoluteFill
      style={{
        background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)",
      }}
    />
    <PaperGrain dark />
    <Bottle frame={frame} height={780} centerX={560} bottom={872} dark />
    <div
      style={{
        position: "absolute",
        left: 860,
        width: 900,
        top: 300,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 34,
      }}
    >
      <SeriesLabel frame={frame} start={64} color={GOLD} />
      <RedRule frame={frame} start={74} />
      <FigeacLogotype frame={frame} start={30} width={800} />
      <Subtitle frame={frame} start={96} color="rgba(247,242,235,0.82)" />
    </div>
  </AbsoluteFill>
);

export const TitleCard: React.FC<{ variant: TitleCardVariant }> = ({ variant }) => {
  const frame = useCurrentFrame();
  if (variant === "B") return <VariantB frame={frame} />;
  if (variant === "C") return <VariantC frame={frame} />;
  return <VariantA frame={frame} />;
};
