import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { AVU_GOLD } from "./Ecriture";
import {
  clamp,
  fadeIn,
  Grain,
  HandFlourish,
  HandwrittenWord,
  PLAYFAIR,
  ScriptWord,
  scriptWidth,
  SORA,
  soft,
  StorePhoto,
  Vignette,
} from "./shared";

// Section divider, e.g. "Flash questions" before the quick-fire round.
// Same backdrop as the question cards, but a hand-written word like the
// intro. Fast: fully on screen by ~1 s; the editor trims the length.
const TEXT = "#4A443B";
export const DIVIDER_DURATION = 4 * 30;

export type DividerCardProps = {
  // Small caps line at the top
  label: string;
  // Word written by hand; must be listed in scripts/script-words.txt
  scriptWord: ScriptWord;
  // Letter size relative to "Spotlight" in the intro
  scriptScale: number;
  // Small line under the flourish
  subtitle: string;
  photo: string;
};

const WRITE_START = 2;
const WRITE_LENGTH = 18;

export const DividerCard: React.FC<DividerCardProps> = ({
  label,
  scriptWord,
  scriptScale,
  subtitle,
  photo,
}) => {
  const frame = useCurrentFrame();
  const wordWidth = Math.round(scriptWidth(scriptWord) * scriptScale);
  const flourishWidth = Math.min(420, Math.round(wordWidth * 0.75));
  const writeEnd = WRITE_START + WRITE_LENGTH;

  return (
    <AbsoluteFill style={{ backgroundColor: "#EEE8DD" }}>
      <StorePhoto
        src={photo}
        durationInFrames={DIVIDER_DURATION}
        blurTo={11}
        blurFrom={[-1, 0]}
        tone="saturate(0.72) sepia(0.12) brightness(0.95)"
      />
      <AbsoluteFill style={{ backgroundColor: "#EFE9DE", opacity: 0.36 }} />
      <Vignette color="#B7AA94" strength={0.35} />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 70% 32% at 50% 50%, #EFE9DE 0%, rgba(239,233,222,0.6) 55%, rgba(239,233,222,0) 100%)",
          opacity: 0.6,
        }}
      />
      <Grain opacity={0.11} />

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            fontFamily: SORA,
            fontSize: 26,
            letterSpacing: "0.5em",
            paddingLeft: "0.5em",
            color: AVU_GOLD,
            marginBottom: 40,
            opacity: interpolate(frame, [0, 12], [0, 1], {
              ...clamp,
              easing: soft,
            }),
          }}
        >
          {label}
        </div>

        <HandwrittenWord
          word={scriptWord}
          start={WRITE_START}
          duration={WRITE_LENGTH}
          width={wordWidth}
          ink={AVU_GOLD}
        />
        <div
          style={{
            marginTop: -26 + Math.round((scriptScale - 1) * 40),
            marginLeft: Math.round(wordWidth / 9.75),
          }}
        >
          <HandFlourish
            start={writeEnd - 4}
            length={12}
            width={flourishWidth}
            ink={AVU_GOLD}
          />
        </div>

        <div
          style={{
            fontFamily: PLAYFAIR,
            fontStyle: "italic",
            fontSize: 44,
            color: TEXT,
            marginTop: 40,
            ...fadeIn(frame, writeEnd - 2, 12, { rise: 8 }),
          }}
        >
          {subtitle}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
