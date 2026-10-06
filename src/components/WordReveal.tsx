import type React from "react";
import {
  Interactive,
  type InteractivitySchema,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, linearGradient } from "../theme/tokens";
import { progress } from "../utils/animation";

type WordRevealProps = {
  readonly children: string;
  /** Frames to wait before the first word starts. */
  readonly delayInFrames?: number;
  /** Frames between consecutive words. */
  readonly staggerInFrames?: number;
  /** How many words at the end get the gradient highlight. */
  readonly highlightLastWords?: number;
  readonly accentColor?: string;
  readonly accentColorTo?: string;
  readonly style?: React.CSSProperties;
};

/**
 * Headline that reveals word by word: each word rises, un-blurs and fades
 * in, with an optional gradient on the last N words.
 *
 * Words stay mounted (invisible) before they animate, so the layout never
 * jumps. Typography (fontSize, fontFamily, color…) comes from `style`.
 */
const WordRevealInner: React.FC<WordRevealProps> = ({
  children,
  delayInFrames = 0,
  staggerInFrames = 4,
  highlightLastWords = 0,
  accentColor = COLORS.violet,
  accentColorTo = COLORS.cyan,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = children.split(/\s+/).filter(Boolean);
  const wordDuration = Math.round(0.8 * fps);

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        columnGap: "0.24em",
        ...style,
      }}
    >
      {words.map((word, i) => {
        const p = progress(
          frame,
          delayInFrames + i * staggerInFrames,
          wordDuration,
        );
        const highlighted = i >= words.length - highlightLastWords;
        return (
          <span
            key={`${word}-${i}`}
            style={{
              display: "inline-block",
              opacity: p,
              translate: `0 ${(1 - p) * 0.45}em`,
              filter: `blur(${(1 - p) * 14}px)`,
              // Room for descenders when the gradient clips to the glyphs.
              paddingBottom: "0.06em",
              ...(highlighted
                ? {
                    backgroundImage: linearGradient(
                      accentColor,
                      accentColorTo,
                      100,
                    ),
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }
                : null),
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

const wordRevealSchema = {
  children: {
    type: "text-content",
    default: "Your headline here",
    description: "Text",
  },
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
    default: 4,
    min: 0,
    step: 1,
    integer: true,
    hiddenFromList: false,
    keyframable: false,
    description: "Stagger (frames)",
  },
  highlightLastWords: {
    type: "number",
    default: 0,
    min: 0,
    step: 1,
    integer: true,
    hiddenFromList: false,
    keyframable: false,
    description: "Highlighted words",
  },
  accentColor: {
    type: "color",
    default: COLORS.violet,
    description: "Gradient start",
  },
  accentColorTo: {
    type: "color",
    default: COLORS.cyan,
    description: "Gradient end",
  },
} as const satisfies InteractivitySchema;

export const WordReveal = Interactive.withSchema({
  Component: WordRevealInner,
  componentName: "<WordReveal>",
  schema: wordRevealSchema,
  wrapInSequence: true,
});
