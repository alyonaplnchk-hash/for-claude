import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import {
  clamp,
  fadeIn,
  Grain,
  HandFlourish,
  HandwrittenSpotlight,
  IntroProps,
  PLAYFAIR,
  SORA,
  StoreFootage,
  Vignette,
  TintedLogo,
  AVU_LOGO,
  AVU_ASPECT,
} from "./shared";

// Variant C — "Nocturne": the store dims like a cellar after hours,
// champagne-coloured ink on deep brown.
const CHAMPAGNE = "#C9B48C";
const CREAM = "#E8DFCF";
export const NOCTURNE_DURATION = 7 * 30;

export const Nocturne: React.FC<IntroProps> = ({
  guestLogo,
  guestLogoWidth,
  guestLogoAspect,
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: "#16120E" }}>
      <StoreFootage
        durationInFrames={NOCTURNE_DURATION}
        blurTo={12}
        tone="saturate(0.6) sepia(0.25)"
      />
      <AbsoluteFill
        style={{
          backgroundColor: "#1A1510",
          opacity: interpolate(frame, [8, 70], [0, 0.74], clamp),
        }}
      />
      <Vignette color="#0B0907" strength={0.85} />
      <Grain opacity={0.08} blend="screen" />

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <TintedLogo
          src={AVU_LOGO}
          width={150}
          aspect={AVU_ASPECT}
          color={CHAMPAGNE}
          style={{
            marginBottom: 120,
            ...fadeIn(frame, 150, 44, {}),
          }}
        />
        <div
          style={{
            fontFamily: SORA,
            fontSize: 34,
            letterSpacing: "0.62em",
            paddingLeft: "0.62em",
            color: CREAM,
            ...fadeIn(frame, 30, 44, { rise: 6 }),
          }}
        >
          PRODUCER
        </div>
        <div style={{ marginTop: -6 }}>
          <HandwrittenSpotlight
            start={54}
            duration={64}
            width={780}
            ink={CHAMPAGNE}
          />
        </div>
        <div style={{ marginTop: -26, marginLeft: 80 }}>
          <HandFlourish start={110} length={26} width={420} ink={CHAMPAGNE} />
        </div>
        <div
          style={{
            fontFamily: PLAYFAIR,
            fontStyle: "italic",
            fontSize: 44,
            color: CREAM,
            opacity: 0.85,
            marginTop: 70,
          }}
        >
          <span style={{ display: "inline-block", ...fadeIn(frame, 132, 36) }}>
            in conversation with
          </span>
        </div>
        <TintedLogo
          src={guestLogo}
          width={guestLogoWidth * 0.85}
          aspect={guestLogoAspect}
          color={CREAM}
          style={{
            marginTop: 46,
            ...fadeIn(frame, 146, 42, {}),
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
