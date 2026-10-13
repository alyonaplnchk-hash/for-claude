// AVU brand palette, sampled from the AVU Luxury Wines logo (olive gold on white).
export const colors = {
  ivory: "#FBF8F1",
  paper: "#F3ECDD",
  gold: "#8A7649",
  goldDark: "#6B5A35",
  goldLight: "#C2B28A",
  ink: "#3A3122",
  wine: "#6E1423",
  wineDeep: "#430B15",
  figeacRed: "#C8402F",
};

export const FPS = 30;

// Scene lengths (frames). The intro overlaps scenes by TRANSITION frames each cut.
export const SCENES = {
  history: 105,
  personalities: 135,
  estate: 120,
  finale: 135,
};
export const TRANSITION = 15;

export const INTRO_DURATION =
  SCENES.history +
  SCENES.personalities +
  SCENES.estate +
  SCENES.finale -
  3 * TRANSITION;
