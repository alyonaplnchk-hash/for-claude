import type React from "react";
import {
  Interactive,
  type InteractivitySchema,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { progress } from "../utils/animation";

type CounterProps = {
  readonly value: number;
  readonly delayInFrames?: number;
  readonly countSeconds?: number;
  readonly decimals?: number;
  readonly prefix?: string;
  readonly suffix?: string;
  readonly style?: React.CSSProperties;
};

/**
 * Animated number that counts up to `value` with an ease-out curve.
 * Uses tabular figures so digits don't jitter while counting.
 */
const CounterInner: React.FC<CounterProps> = ({
  value,
  delayInFrames = 0,
  countSeconds = 1.2,
  decimals = 0,
  prefix = "",
  suffix = "",
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const current =
    value *
    progress(frame, delayInFrames, Math.max(1, Math.round(countSeconds * fps)));

  return (
    <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>
      {prefix}
      {current.toFixed(decimals)}
      {suffix}
    </span>
  );
};

const counterSchema = {
  value: {
    type: "number",
    default: 100,
    step: 1,
    hiddenFromList: false,
    keyframable: false,
    description: "Target value",
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
  countSeconds: {
    type: "number",
    default: 1.2,
    min: 0.1,
    step: 0.1,
    hiddenFromList: false,
    keyframable: false,
    description: "Count duration (s)",
  },
  decimals: {
    type: "number",
    default: 0,
    min: 0,
    max: 4,
    step: 1,
    integer: true,
    hiddenFromList: false,
    keyframable: false,
    description: "Decimals",
  },
  prefix: { type: "text-content", default: "", description: "Prefix" },
  suffix: { type: "text-content", default: "", description: "Suffix" },
} as const satisfies InteractivitySchema;

export const Counter = Interactive.withSchema({
  Component: CounterInner,
  componentName: "<Counter>",
  schema: counterSchema,
  wrapInSequence: true,
});
