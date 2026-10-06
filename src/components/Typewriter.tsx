import type React from "react";
import {
  Interactive,
  type InteractivitySchema,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS } from "../theme/tokens";

type TypewriterProps = {
  readonly children: string;
  readonly delayInFrames?: number;
  readonly charactersPerSecond?: number;
  readonly cursorColor?: string;
  readonly style?: React.CSSProperties;
};

/**
 * Types text out character by character with a blinking block cursor.
 * The blink is frame-driven (not a CSS animation) so it renders reliably.
 */
const TypewriterInner: React.FC<TypewriterProps> = ({
  children,
  delayInFrames = 0,
  charactersPerSecond = 24,
  cursorColor = COLORS.cyan,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const elapsed = Math.max(0, frame - delayInFrames);
  const visibleChars = Math.min(
    children.length,
    Math.floor((elapsed / fps) * charactersPerSecond),
  );
  const isTyping = visibleChars < children.length && frame >= delayInFrames;
  // Solid while typing, then blink twice per second.
  const cursorOn = isTyping || Math.floor((frame / fps) * 2) % 2 === 0;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        whiteSpace: "pre",
        ...style,
      }}
    >
      <span>{children.slice(0, visibleChars)}</span>
      <span
        style={{
          display: "inline-block",
          width: "0.55em",
          height: "1.1em",
          marginLeft: "0.08em",
          backgroundColor: cursorColor,
          opacity: cursorOn ? 1 : 0,
        }}
      />
    </div>
  );
};

const typewriterSchema = {
  children: {
    type: "text-content",
    default: "npx remotion render",
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
  charactersPerSecond: {
    type: "number",
    default: 24,
    min: 1,
    step: 1,
    hiddenFromList: false,
    keyframable: false,
    description: "Characters per second",
  },
  cursorColor: {
    type: "color",
    default: COLORS.cyan,
    description: "Cursor color",
  },
} as const satisfies InteractivitySchema;

export const Typewriter = Interactive.withSchema({
  Component: TypewriterInner,
  componentName: "<Typewriter>",
  schema: typewriterSchema,
  wrapInSequence: true,
});
