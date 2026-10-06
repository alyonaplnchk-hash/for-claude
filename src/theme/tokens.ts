/**
 * Design tokens shared by every scene. Change the palette here to re-skin
 * all compositions at once.
 */
export const COLORS = {
  background: "#07080F",
  surface: "#11142A",
  surfaceRaised: "#1A1F3D",
  border: "rgba(255, 255, 255, 0.10)",
  ink: "#F5F7FF",
  muted: "#9AA3C7",
  violet: "#7C5CFF",
  cyan: "#22D3EE",
  coral: "#FF6B6B",
  amber: "#FFC857",
  mint: "#34D399",
} as const;

export const RADII = {
  sm: 12,
  md: 20,
  lg: 32,
  pill: 999,
} as const;

/** Builds a two-stop gradient string from any pair of colors. */
export const linearGradient = (from: string, to: string, angle = 120) =>
  `linear-gradient(${angle}deg, ${from} 0%, ${to} 100%)`;
