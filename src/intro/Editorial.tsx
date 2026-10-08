import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import {
  clamp,
  fadeIn,
  Grain,
  IntroProps,
  PLAYFAIR,
  SORA,
  StoreFootage,
  TintedLogo,
  AVU_LOGO,
  AVU_ASPECT,
} from "./shared";

// Variant B — "Editorial": a magazine cover. The store stays readable,
// type sits low and left, lines slide up from behind a mask.
const TEXT = "#3E382F";
const MUTED = "#7A7062";
export const EDITORIAL_DURATION = 6 * 30;

const Line: React.FC<{
  start: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ start, children, style }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ overflow: "hidden", paddingBottom: 12, marginBottom: -12 }}>
      <div
        style={{
          ...style,
          translate: `0px ${interpolate(frame, [start, start + 34], [105, 0], {
            ...clamp,
            easing: Easing.bezier(0.3, 0, 0.1, 1),
          })}%`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export const Editorial: React.FC<IntroProps> = ({
  guestLogo,
  guestLogoWidth,
  guestLogoAspect,
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: "#E4DCCF" }}>
      <StoreFootage
        durationInFrames={EDITORIAL_DURATION}
        blurTo={5}
        tone="saturate(0.55) sepia(0.15) contrast(0.92)"
      />
      {/* Veil heavier toward the bottom, where the type lives */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(232,225,213,0.35) 0%, rgba(232,225,213,0.55) 40%, rgba(230,222,209,0.9) 72%, rgba(230,222,209,0.95) 100%)",
          opacity: interpolate(frame, [4, 50], [0, 1], clamp),
        }}
      />
      <Grain opacity={0.1} />

      {/* Masthead */}
      <AbsoluteFill style={{ padding: "120px 96px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <TintedLogo
            src={AVU_LOGO}
            width={128}
            aspect={AVU_ASPECT}
            color={MUTED}
            style={{
              ...fadeIn(frame, 120, 34, {}),
            }}
          />
          <div
            style={{
              fontFamily: SORA,
              fontSize: 22,
              letterSpacing: "0.4em",
              color: TEXT,
              textAlign: "right",
              lineHeight: 1.9,
              ...fadeIn(frame, 128, 34, { rise: 0 }),
            }}
          >
            THE INTERVIEW
            <br />
            SERIES
          </div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          padding: "0 96px 190px",
        }}
      >
        <Line
          start={24}
          style={{
            fontFamily: PLAYFAIR,
            fontStyle: "italic",
            fontSize: 150,
            lineHeight: 1.05,
            color: TEXT,
          }}
        >
          Producer
        </Line>
        <Line
          start={40}
          style={{
            fontFamily: SORA,
            fontWeight: 700,
            fontSize: 46,
            letterSpacing: "0.52em",
            color: TEXT,
            marginTop: 18,
          }}
        >
          SPOTLIGHT
        </Line>

        <div
          style={{
            height: 1,
            backgroundColor: MUTED,
            marginTop: 64,
            marginBottom: 52,
            width: `${interpolate(frame, [70, 120], [0, 100], {
              ...clamp,
              easing: Easing.bezier(0.5, 0, 0.1, 1),
            })}%`,
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
          <div
            style={{
              fontFamily: PLAYFAIR,
              fontStyle: "italic",
              fontSize: 38,
              color: MUTED,
              lineHeight: 1.25,
              ...fadeIn(frame, 96, 30, { rise: 0, blur: 0 }),
            }}
          >
            in conversation
            <br />
            with
          </div>
          <TintedLogo
            src={guestLogo}
            width={guestLogoWidth * 0.78}
            aspect={guestLogoAspect}
            color={TEXT}
            style={{
              ...fadeIn(frame, 112, 40, {
                rise: 0,
              }),
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
