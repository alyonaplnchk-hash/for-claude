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
  HandwrittenWord,
  IntroProps,
  PLAYFAIR,
  SORA,
  StoreFootage,
  ScriptWord,
  scriptWidth,
  StorePhoto,
  Vignette,
  TintedLogo,
  AVU_LOGO,
  AVU_ASPECT,
} from "./shared";
import { SCRIPT_GLYPHS } from "../scriptGlyphs";

// Variant A — "Écriture": light and airy, the title written by hand.
const MUTED_INK = "#7E7058";
const MUTED_TEXT = "#4A443B";
// The AVU logo colour
export const AVU_GOLD = "#89764B";
export const ECRITURE_DURATION = 7 * 30;

export const Ecriture: React.FC<
  Omit<IntroProps, "guestLogo"> & {
    // Omit for a series without a guest (Wine Tips)
    guestLogo?: string;
    // Small caps line above the script word
    kicker?: string;
    // Word written by hand; must be listed in scripts/script-words.txt
    scriptWord?: ScriptWord;
    // Line under the script word
    subtitle?: string;
    // Letter size of the script word relative to Spotlight
    scriptScale?: number;
    ink?: string;
    text?: string;
    // Use a still photo instead of the store footage
    photo?: string;
    // Show both logos in their own colours instead of re-inking them
    originalLogos?: boolean;
    // Strength of the light veil over the background (0–1)
    veil?: number;
    // Extra soft veil behind the type, so the gold reads clearly (0–1)
    textVeil?: number;
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
  textVeil = 0,
  music,
  kicker = "PRODUCER",
  scriptWord = "Spotlight",
  subtitle = "in conversation with",
  scriptScale = 1,
}) => {
  const frame = useCurrentFrame();
  // Spotlight: 62 frames for 9 letters; other words keep the same pen speed.
  const glyphCount = SCRIPT_GLYPHS[scriptWord].glyphs.length;
  const writeLength = Math.max(34, Math.round((62 * glyphCount) / 9));
  const wordWidth = Math.round(scriptWidth(scriptWord) * scriptScale);
  const flourishWidth = Math.min(420, Math.round(wordWidth * 0.75));
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
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 62% 30% at 50% 50%, #EFE9DE 0%, rgba(239,233,222,0.6) 55%, rgba(239,233,222,0) 100%)",
          opacity: interpolate(frame, [10, 70], [0, textVeil], clamp),
        }}
      />
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
          {kicker}
        </div>

        <div style={{ marginTop: -6 }}>
          <HandwrittenWord
            word={scriptWord}
            start={48}
            duration={writeLength}
            width={wordWidth}
            ink={ink}
          />
        </div>
        <div
          style={{
            marginTop: -26 + Math.round((scriptScale - 1) * 40),
            marginLeft: Math.round(wordWidth / 9.75),
          }}
        >
          <HandFlourish
            start={48 + writeLength - 6}
            length={26}
            width={flourishWidth}
            ink={ink}
          />
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
          {subtitle}
        </div>
        {!guestLogo ? null : originalLogos ? (
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
