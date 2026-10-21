import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { AVU_GOLD } from "./Ecriture";
import { useFitTitle } from "./fitTitle";
import {
  AVU_ASPECT,
  AVU_LOGO,
  clamp,
  fadeIn,
  Grain,
  HandwrittenWord,
  PLAYFAIR,
  ScriptWord,
  soft,
  StorePhoto,
  Vignette,
} from "./shared";

// Episode intro led by its title (Wine Tips): AVU logo, the series name
// written by hand as a label, a gold rule, then the episode title — the
// largest text on the card.
export const TITLE_INTRO_DURATION = 3 * 30;

// A deeper, warmer charcoal than the cards, matching the approved mockup
const TEXT = "#352C21";
const LOGO_WIDTH = 180;
const SCRIPT_WIDTH = 466;
const RULE_WIDTH = 190;
// The title shrinks below TITLE_SIZE when needed, so every line keeps at
// least TITLE_MARGIN px clear on both sides.
const TITLE_SIZE = 79;
const TITLE_MARGIN = 90;

export type TitleIntroProps = {
  photo: string;
  // Series name written by hand; must be in scripts/script-words.txt
  scriptWord: ScriptWord;
  // One entry per line; break lines by hand (2–3 lines)
  title: string[];
};

export const TitleIntro: React.FC<TitleIntroProps> = ({
  photo,
  scriptWord,
  title,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width } = useVideoConfig();
  // A longer composition plays the same animation more slowly
  const t = (f: number) =>
    Math.round((f * durationInFrames) / TITLE_INTRO_DURATION);
  const titleSize = useFitTitle({
    lines: title,
    font: PLAYFAIR,
    maxSize: TITLE_SIZE,
    maxWidth: width - 2 * TITLE_MARGIN,
  });
  const rule = interpolate(frame, [t(34), t(52)], [0, 1], {
    ...clamp,
    easing: soft,
  });
  return (
    <AbsoluteFill style={{ backgroundColor: "#EEE8DD" }}>
      <StorePhoto
        src={photo}
        durationInFrames={durationInFrames}
        blurTo={11}
        blurFrom={[t(3), t(26)]}
        tone="saturate(0.72) sepia(0.12) brightness(0.95)"
      />
      <AbsoluteFill
        style={{
          backgroundColor: "#EFE9DE",
          opacity: interpolate(frame, [t(3), t(26)], [0, 0.36], clamp),
        }}
      />
      <Vignette color="#B7AA94" strength={0.35} />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 66% 30% at 50% 44%, #EFE9DE 0%, rgba(239,233,222,0.6) 55%, rgba(239,233,222,0) 100%)",
          opacity: interpolate(frame, [t(4), t(30)], [0, 0.55], clamp),
        }}
      />
      <Grain opacity={0.11} />

      <AbsoluteFill
        style={{ alignItems: "center", justifyContent: "flex-start", top: 479 }}
      >
        <Img
          src={staticFile(AVU_LOGO)}
          style={{
            width: LOGO_WIDTH,
            height: LOGO_WIDTH / AVU_ASPECT,
            ...fadeIn(frame, t(54), t(20)),
          }}
        />
        <div style={{ marginTop: 96 }}>
          <HandwrittenWord
            word={scriptWord}
            start={t(6)}
            duration={t(34)}
            width={SCRIPT_WIDTH}
            ink={AVU_GOLD}
          />
        </div>
        {/* Gold rule, drawn out from the centre */}
        <div
          style={{
            marginTop: 13,
            width: RULE_WIDTH,
            height: 2,
            backgroundColor: AVU_GOLD,
            opacity: 0.75,
            scale: `${rule} 1`,
          }}
        />
        <div
          style={{
            fontFamily: PLAYFAIR,
            fontSize: titleSize,
            lineHeight: 1.28,
            color: TEXT,
            textAlign: "center",
            marginTop: 33,
          }}
        >
          {title.map((line, i) => (
            // Each line stays whole; the title is broken by hand
            <div
              key={i}
              style={{
                whiteSpace: "nowrap",
                ...fadeIn(frame, t(42 + i * 6), t(18)),
              }}
            >
              {line}
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
