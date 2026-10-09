import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import {
  clamp,
  Grain,
  HandFlourish,
  PLAYFAIR,
  SORA,
  soft,
  StorePhoto,
  Vignette,
} from "./shared";
import { AVU_GOLD } from "./Ecriture";

// Interview question card: same backdrop as the final intro, already
// blurred, so it cuts in seamlessly. The question is fully written by 3 s.
const TEXT = "#4A443B";
export const QUESTION_DURATION = 6 * 30;

export type QuestionCardProps = {
  // One entry per line
  lines: string[];
  // Words shown in AVU gold
  highlight: string[];
  photo: string;
};

const WORD_START = 10;
const WORD_STAGGER = 6;
const WORD_LENGTH = 20;

export const QuestionCard: React.FC<QuestionCardProps> = ({
  lines,
  highlight,
  photo,
}) => {
  const frame = useCurrentFrame();
  let index = 0;
  const wordCount = lines.join(" ").split(" ").length;
  const lastWordDone =
    WORD_START + (wordCount - 1) * WORD_STAGGER + WORD_LENGTH;

  return (
    <AbsoluteFill style={{ backgroundColor: "#EEE8DD" }}>
      <StorePhoto
        src={photo}
        durationInFrames={QUESTION_DURATION}
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

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          padding: "0 110px",
        }}
      >
        <div
          style={{
            fontFamily: SORA,
            fontSize: 26,
            letterSpacing: "0.5em",
            paddingLeft: "0.5em",
            color: AVU_GOLD,
            marginBottom: 64,
            opacity: interpolate(frame, [0, 18], [0, 1], {
              ...clamp,
              easing: soft,
            }),
          }}
        >
          PRODUCER SPOTLIGHT
        </div>

        <div
          style={{
            fontFamily: PLAYFAIR,
            fontStyle: "italic",
            fontSize: 82,
            lineHeight: 1.22,
            color: TEXT,
            textAlign: "center",
          }}
        >
          {lines.map((line, l) => (
            <div key={l}>
              {line.split(" ").map((word, w) => {
                const start = WORD_START + index * WORD_STAGGER;
                index++;
                const t = [start, start + WORD_LENGTH];
                const ease = { ...clamp, easing: soft };
                return (
                  <span
                    key={w}
                    style={{
                      display: "inline-block",
                      marginRight: "0.24em",
                      color: highlight.includes(word.replace(/[?.,!]/g, ""))
                        ? AVU_GOLD
                        : undefined,
                      opacity: interpolate(frame, t, [0, 1], ease),
                      translate: `0px ${interpolate(frame, t, [18, 0], ease)}px`,
                      filter: `blur(${interpolate(frame, t, [6, 0], ease)}px)`,
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 36 }}>
          <HandFlourish
            start={lastWordDone - 14}
            length={18}
            width={360}
            ink={AVU_GOLD}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
