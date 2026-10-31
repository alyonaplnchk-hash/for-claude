import { Engine, ShotFrame, Camera, Mesh, Env, Post } from "../engine/renderer";
import { Geo } from "../engine/geometry";
import { V3, hex } from "../engine/math";

export type Shot = {
  init(e: Engine): void;
  frame(t: number): ShotFrame;
  camera(t: number): Camera;
  anchors?(t: number): Record<string, V3>;
};

export type ShotFactory = (dur: number) => Shot;

// Lazily-built mesh cache shared by all scenes (one engine per page).
const meshCache = new Map<string, Mesh>();
export function cached(e: Engine, key: string, build: () => Geo): Mesh {
  let m = meshCache.get(key);
  if (!m) {
    m = e.mesh(build());
    meshCache.set(key, m);
  }
  return m;
}
export function resetCache() {
  meshCache.clear();
}

// Common palette (linear RGB)
export const C = {
  wine: hex("#5a0a1e"),
  ruby: hex("#9b1030"),
  rubyBright: hex("#e0244a"),
  grapePurple: hex("#2a1033"),
  grapeBlue: hex("#1f1838"),
  grapeGreen: hex("#8fae3c"),
  leaf: hex("#4f7a25"),
  leafDark: hex("#2f5418"),
  bark: hex("#4a3424"),
  oak: hex("#a8784a"),
  oakDark: hex("#6b4a2e"),
  limestone: hex("#e3d6bd"),
  slate: hex("#3c4652"),
  gravel1: hex("#cfc3ad"),
  gravel2: hex("#8c7f6e"),
  soil: hex("#6e5a44"),
  clay: hex("#8b6a52"),
  steel: hex("#c9ccd0"),
  white: [1, 1, 1] as V3,
};

export const outdoorEnv = (o: Partial<Env> = {}): Env => ({
  skyTop: hex("#4f86c6"),
  skyHor: hex("#f2c48d"),
  skyBot: hex("#6b5a48"),
  sunDir: [0.5, 0.35, -0.6],
  sunCol: [2.5, 2.0, 1.4],
  sunDisk: 1,
  glowDir: [0.5, 0.2, -0.6],
  glowCol: hex("#ff9a4a"),
  glowPow: 6,
  ambSky: [0.42, 0.5, 0.65],
  ambGnd: [0.3, 0.24, 0.17],
  envAmt: 0.7,
  fog: [0.004, 0.05, 0, 0.8],
  fogCol: hex("#e9c9a0"),
  ...o,
});

export const basePost = (o: Partial<Post> = {}): Post => ({
  exposure: 1,
  bloom: 0.5,
  bloomThreshold: 1.1,
  contrast: 1.06,
  sat: 1.08,
  vignette: 0.45,
  grain: 0.03,
  ca: 0.01,
  ...o,
});

export { Engine };
export type { ShotFrame, Camera };
