import type React from "react";
import { COLORS, RADII } from "../theme/tokens";
import { FONTS } from "../theme/fonts";

/** Small uppercase label in a pill, used above headlines. */
export const Eyebrow: React.FC<{
  readonly children: React.ReactNode;
  readonly dotColor?: string;
  readonly style?: React.CSSProperties;
}> = ({ children, dotColor = COLORS.cyan, style }) => {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 24px",
        borderRadius: RADII.pill,
        border: `1px solid ${COLORS.border}`,
        backgroundColor: "rgba(255,255,255,0.04)",
        color: COLORS.muted,
        fontFamily: FONTS.mono,
        fontSize: 22,
        fontWeight: 500,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        ...style,
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: RADII.pill,
          backgroundColor: dotColor,
          boxShadow: `0 0 16px ${dotColor}`,
        }}
      />
      {children}
    </div>
  );
};
