import { Video } from "@remotion/media";
import { loadFont } from "@remotion/fonts";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { SCRIPT_GLYPHS } from "../scriptGlyphs";

export const SORA = "Sora";
export const PLAYFAIR = "Playfair Display";
export const PINYON = "Pinyon Script";

void Promise.all([
  loadFont({
    family: SORA,
    url: staticFile("fonts/sora-latin-400-normal.woff2"),
    weight: "400",
  }),
  loadFont({
    family: SORA,
    url: staticFile("fonts/sora-latin-700-normal.woff2"),
    weight: "700",
  }),
  loadFont({
    family: PLAYFAIR,
    url: staticFile("fonts/playfair-display-latin-400-italic.woff2"),
    style: "italic",
  }),
  loadFont({
    family: PINYON,
    url: staticFile("fonts/pinyon-script-latin-400-normal.woff2"),
  }),
]);

export const FPS = 30;
export const SOURCE_SECONDS = 5.04;

export type IntroProps = {
  guestLogo: string;
  guestLogoWidth: number;
  // width / height of the guest logo PNG
  guestLogoAspect: number;
};

export const AVU_LOGO = "avu-logo.png";
export const AVU_ASPECT = 1936 / 1825;

export const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// Slow, unhurried ease-out: settles late instead of snapping into place.
export const soft = Easing.bezier(0.33, 0, 0.15, 1);

export const fadeIn = (
  frame: number,
  start: number,
  length: number,
  { rise = 12, blur = 4, extraFilter = "" } = {},
) => ({
  opacity: interpolate(frame, [start, start + length], [0, 1], {
    ...clamp,
    easing: soft,
  }),
  translate: `0px ${interpolate(frame, [start, start + length], [rise, 0], {
    ...clamp,
    easing: soft,
  })}px`,
  filter: `blur(${interpolate(frame, [start, start + length], [blur, 0], {
    ...clamp,
    easing: soft,
  })}px) ${extraFilter}`,
});

export const StoreFootage: React.FC<{
  durationInFrames: number;
  blurTo: number;
  blurFrom?: [number, number];
  tone?: string;
}> = ({ durationInFrames, blurTo, blurFrom = [6, 60], tone = "" }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        filter: `blur(${interpolate(frame, blurFrom, [0, blurTo], {
          ...clamp,
          easing: Easing.inOut(Easing.sin),
        })}px) ${tone}`,
        scale: interpolate(frame, [0, durationInFrames], [1.16, 1.24], clamp),
      }}
    >
      <Video
        src={staticFile("store.mp4")}
        playbackRate={SOURCE_SECONDS / (durationInFrames / FPS)}
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </AbsoluteFill>
  );
};

export const StorePhoto: React.FC<{
  src: string;
  durationInFrames: number;
  blurTo: number;
  blurFrom?: [number, number];
  tone?: string;
}> = ({ src, durationInFrames, blurTo, blurFrom = [6, 60], tone = "" }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        filter: `blur(${interpolate(frame, blurFrom, [0, blurTo], {
          ...clamp,
          easing: Easing.inOut(Easing.sin),
        })}px) ${tone}`,
        // Slow push-in so the still photo feels alive
        scale: interpolate(frame, [0, durationInFrames], [1.12, 1.22], clamp),
      }}
    >
      <Img
        src={staticFile(src)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </AbsoluteFill>
  );
};

// Animated film grain: breaks up the flat, "too clean" digital look.
export const Grain: React.FC<{ opacity?: number; blend?: string }> = ({
  opacity = 0.09,
  blend = "multiply",
}) => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2);
  return (
    <AbsoluteFill
      style={{
        opacity,
        mixBlendMode: blend as React.CSSProperties["mixBlendMode"],
      }}
    >
      <svg width="100%" height="100%">
        <filter id="grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves={2}
            seed={seed}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect
          width="100%"
          height="100%"
          filter="url(#grain)"
          x={random(`gx${seed}`) * -4}
          y={random(`gy${seed}`) * -4}
        />
      </svg>
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{ color: string; strength: number }> = ({
  color,
  strength,
}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 85% 70% at 50% 48%, transparent 45%, ${color} 100%)`,
      opacity: strength,
    }}
  />
);

// Uneven pen rhythm per letter of "Spotlight": the capital takes longest,
// the pen lingers on loops and moves quickly through the small joins.
const PEN_RHYTHM = [1.9, 0.8, 1.1, 0.9, 0.7, 0.6, 1.0, 0.8, 0.9];

/**
 * "Spotlight" written by hand: each glyph's outline is traced by the pen,
 * then the ink settles into it.
 */
export const HandwrittenSpotlight: React.FC<{
  start: number;
  duration: number;
  width: number;
  ink: string;
}> = ({ start, duration, width, ink }) => {
  const frame = useCurrentFrame();
  const { glyphs, box } = SCRIPT_GLYPHS.Spotlight;
  const pad = 20;
  const total = PEN_RHYTHM.reduce((a, b) => a + b, 0);
  let cursor = start;

  return (
    <svg
      width={width}
      viewBox={`${box[0] - pad} ${box[1] - pad} ${box[2] + pad * 2} ${box[3] + pad * 2}`}
      style={{ overflow: "visible" }}
    >
      {glyphs.map((g, i) => {
        const len = (PEN_RHYTHM[i] / total) * duration;
        const s = cursor;
        // Letters overlap slightly, like a continuous hand.
        cursor += len * 0.82;
        const draw = interpolate(frame, [s, s + len * 1.25], [1, 0], {
          ...clamp,
          easing: Easing.inOut(Easing.sin),
        });
        const fill = interpolate(
          frame,
          [s + len * 0.55, s + len * 1.8],
          [0, 1],
          { ...clamp, easing: Easing.out(Easing.quad) },
        );
        return (
          <path
            key={i}
            d={g.d}
            pathLength={1}
            fill={ink}
            fillOpacity={fill}
            stroke={ink}
            strokeWidth={0.9}
            strokeOpacity={draw < 1 ? 0.9 - fill * 0.9 : 0}
            strokeDasharray="1 1"
            strokeDashoffset={draw}
          />
        );
      })}
    </svg>
  );
};

/** A loose pen stroke that underlines the title, slightly uneven. */
export const HandFlourish: React.FC<{
  start: number;
  length: number;
  width: number;
  ink: string;
}> = ({ start, length, width, ink }) => {
  const frame = useCurrentFrame();
  const draw = interpolate(frame, [start, start + length], [1, 0], {
    ...clamp,
    easing: Easing.bezier(0.45, 0, 0.2, 1),
  });
  return (
    <svg width={width} viewBox="0 0 600 50" style={{ overflow: "visible" }}>
      <path
        d="M14 34 C 110 22, 220 30, 318 27 C 404 24, 486 16, 586 20"
        fill="none"
        stroke={ink}
        strokeWidth={2.2}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={draw}
      />
      <path
        d="M120 31 C 230 33, 352 29, 470 22"
        fill="none"
        stroke={ink}
        strokeWidth={1}
        strokeOpacity={0.55}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={interpolate(
          frame,
          [start + length * 0.3, start + length * 1.1],
          [1, 0],
          clamp,
        )}
      />
    </svg>
  );
};

/**
 * A single-colour logo re-inked in the variant's palette, using the PNG's
 * alpha as a mask. Keeps edges clean on any background.
 */
export const TintedLogo: React.FC<{
  src: string;
  width: number;
  aspect: number;
  color: string;
  style?: React.CSSProperties;
}> = ({ src, width, aspect, color, style }) => {
  const url = `url(${staticFile(src)})`;
  return (
    <div
      style={{
        width,
        height: width / aspect,
        backgroundColor: color,
        maskImage: url,
        WebkitMaskImage: url,
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
        ...style,
      }}
    />
  );
};
