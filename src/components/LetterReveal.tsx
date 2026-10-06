import type React from "react";
import {
  Interactive,
  type InteractivitySchema,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { EASE, progress } from "../utils/animation";

type LetterRevealProps = {
  readonly children: string;
  readonly delayInFrames?: number;
  readonly staggerInFrames?: number;
  readonly style?: React.CSSProperties;
};

/**
 * Kinetic type: every letter drops in with a springy overshoot and a small
 * rotation. Lines wrap between words. Typography comes from `style`.
 */
const LetterRevealInner: React.FC<LetterRevealProps> = ({
  children,
  delayInFrames = 0,
  staggerInFrames = 2,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const letterDuration = Math.round(0.9 * fps);

  const words = children.split(/\s+/).filter(Boolean);
  let letterIndex = 0;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        columnGap: "0.24em",
        ...style,
      }}
    >
      {words.map((word, w) => (
        // Each word is an unbreakable group, so lines only wrap between words.
        <span key={`${word}-${w}`} style={{ display: "inline-flex" }}>
          {Array.from(word).map((char) => {
            const i = letterIndex++;
            const p = progress(
              frame,
              delayInFrames + i * staggerInFrames,
              letterDuration,
              EASE.bouncy,
            );
            const fade = progress(
              frame,
              delayInFrames + i * staggerInFrames,
              Math.round(0.25 * fps),
            );
            return (
              <span
                key={`${char}-${i}`}
                style={{
                  display: "inline-block",
                  opacity: fade,
                  translate: `0 ${(1 - p) * -0.6}em`,
                  rotate: `${(1 - p) * (i % 2 === 0 ? -14 : 14)}deg`,
                }}
              >
                {char}
              </span>
            );
          })}
        </span>
      ))}
    </div>
  );
};

const letterRevealSchema = {
  children: { type: "text-content", default: "Kinetic", description: "Text" },
  delayInFrames: {
    type: "number",
    default: 0,
    min: 0,
    step: 1,
    integer: true,
    hiddenFromList: false,
    keyframable: false,
    description: "Delay (frames)",
  },
  staggerInFrames: {
    type: "number",
    default: 2,
    min: 0,
    step: 1,
    integer: true,
    hiddenFromList: false,
    keyframable: false,
    description: "Stagger (frames)",
  },
} as const satisfies InteractivitySchema;

export const LetterReveal = Interactive.withSchema({
  Component: LetterRevealInner,
  componentName: "<LetterReveal>",
  schema: letterRevealSchema,
  wrapInSequence: true,
});
