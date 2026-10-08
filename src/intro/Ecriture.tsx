import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
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
  StorePhoto,
  Vignette,
  TintedLogo,
  AVU_LOGO,
  AVU_ASPECT,
} from "./shared";

// Variant A — "Écriture": light and airy, the title written by hand.
const MUTED_INK = "#7E7058";
const MUTED_TEXT = "#4A443B";
// The AVU logo colour
export const AVU_GOLD = "#89764B";
export const ECRITURE_DURATION = 7 * 30;

export const Ecriture: React.FC<
  IntroProps & {
    ink?: string;
    text?: string;
    // Use a still photo instead of the store footage
    photo?: string;
    // Show both logos in their own colours instead of re-inking them
    originalLogos?: boolean;
    // Strength of the light veil over the background (0–1)
    veil?: number;
    music?: string;
  }
> = ({
  guestLogo,
  guestLogoWidth,
  guestLogoAspect,
  ink = MUTED_INK,
  text = MUTED_TEXT,
  photo,
  originalLogos = false,
  veil = 0.66,
  music,
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: "#EEE8DD" }}>
      {music ? <Audio src={staticFile(music)} /> : null}
      {photo ? (
        <StorePhoto
          src={photo}
          durationInFrames={ECRITURE_DURATION}
          blurTo={11}
          tone="saturate(0.72) sepia(0.12) brightness(0.95)"
        />
      ) : (
        <StoreFootage
          durationInFrames={ECRITURE_DURATION}
          blurTo={11}
          tone="saturate(0.65) sepia(0.12)"
        />
      )}
      <AbsoluteFill
        style={{
          backgroundColor: "#EFE9DE",
          opacity: interpolate(frame, [6, 60], [0, veil], clamp),
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
        {originalLogos ? (
          <Img
            src={staticFile(AVU_LOGO)}
            style={{ width: 150, marginBottom: 120, ...fadeIn(frame, 150, 40) }}
          />
        ) : (
          <TintedLogo
            src={AVU_LOGO}
            width={150}
            aspect={AVU_ASPECT}
            color={ink}
            style={{
              marginBottom: 120,
              ...fadeIn(frame, 150, 40, {}),
            }}
          />
        )}

        <div
          style={{
            fontFamily: SORA,
            fontSize: 34,
            letterSpacing: "0.62em",
            paddingLeft: "0.62em",
            color: text,
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
            ink={ink}
          />
        </div>
        <div style={{ marginTop: -26, marginLeft: 80 }}>
          <HandFlourish start={104} length={26} width={420} ink={ink} />
        </div>

        <div
          style={{
            fontFamily: PLAYFAIR,
            fontStyle: "italic",
            fontSize: 44,
            color: text,
            marginTop: 70,
            ...fadeIn(frame, 128, 36),
          }}
        >
          in conversation with
        </div>
        {originalLogos ? (
          <Img
            src={staticFile(guestLogo)}
            style={{
              width: guestLogoWidth * 0.85,
              marginTop: 46,
              ...fadeIn(frame, 142, 42),
            }}
          />
        ) : (
          <TintedLogo
            src={guestLogo}
            width={guestLogoWidth * 0.85}
            aspect={guestLogoAspect}
            color={text}
            style={{
              marginTop: 46,
              ...fadeIn(frame, 142, 42, {}),
            }}
          />
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
