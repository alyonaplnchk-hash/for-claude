/**
 * AVU Luxury Wines brand tokens. Use these for every AVU Wine Stories video
 * so the channel looks consistent.
 */
export const AVU = {
  /** Official logo gold, sampled from the logo file. */
  gold: "#88764A",
  /** Lighter golds for gradients, highlights and text on dark backgrounds. */
  goldLight: "#B9A36D",
  champagne: "#E4D2A0",
  highlight: "#FFF4D6",
  /** Background wine tones, from the vignette edge to the lit centre. */
  wineBlack: "#0C0608",
  wineDeep: "#1C0B10",
  wine: "#3A1520",
} as const;

/** Gold gradient used for fills; stays close to the official logo color. */
export const AVU_GOLD_STOPS = [
  { offset: 0, color: "#7C6A40" },
  { offset: 0.45, color: AVU.gold },
  { offset: 0.7, color: "#A8935F" },
  { offset: 1, color: "#8E7B4D" },
] as const;
