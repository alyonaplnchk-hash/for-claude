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

// Variant A — "Écriture": light and airy, the title written by hand.
const INK = "#7E7058";
const TEXT = "#4A443B";
export const ECRITURE_DURATION = 7 * 30;

export const Ecriture: React.FC<IntroProps> = ({
  guestLogo,
  guestLogoWidth,
  guestLogoAspect,
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: "#EEE8DD" }}>
      <StoreFootage
        durationInFrames={ECRITURE_DURATION}
        blurTo={11}
        tone="saturate(0.65) sepia(0.12)"
      />
      <AbsoluteFill
        style={{
          backgroundColor: "#EFE9DE",
          opacity: interpolate(frame, [6, 60], [0, 0.66], clamp),
        }}
      />
      <Vignette color="#B7AA94" strength={0.35} />
      <Grain opacity={0.11} />

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          paddingBottom: 30,
        }}
      >
        <TintedLogo
          src={AVU_LOGO}
          width={150}
          aspect={AVU_ASPECT}
          color={INK}
          style={{
            marginBottom: 120,
            ...fadeIn(frame, 150, 40, {}),
          }}
        />

        <div
          style={{
            fontFamily: SORA,
            fontSize: 34,
            letterSpacing: "0.62em",
            paddingLeft: "0.62em",
            color: TEXT,
            ...fadeIn(frame, 24, 40, { rise: 6 }),
          }}
        >
          PRODUCER
        </div>

        <div style={{ marginTop: -6 }}>
          <HandwrittenSpotlight
            start={48}
            duration={62}
            width={780}
            ink={INK}
          />
        </div>
        <div style={{ marginTop: -26, marginLeft: 80 }}>
          <HandFlourish start={104} length={26} width={420} ink={INK} />
        </div>

        <div
          style={{
            fontFamily: PLAYFAIR,
            fontStyle: "italic",
            fontSize: 44,
            color: TEXT,
            marginTop: 70,
            ...fadeIn(frame, 128, 36),
          }}
        >
          in conversation with
        </div>
        <TintedLogo
          src={guestLogo}
          width={guestLogoWidth * 0.85}
          aspect={guestLogoAspect}
          color={TEXT}
          style={{
            marginTop: 46,
            ...fadeIn(frame, 142, 42, {}),
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
