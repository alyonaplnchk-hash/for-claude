// Studio look applied on top of every shot of the vertical cut: a pale, seamless backdrop whose
// floor only catches soft shadows (objects float, as in luxury product films), a soft key light,
// matte materials, ambient occlusion and neutral tone mapping. Busy surface textures (bricks,
// pebble dots), haze, sparkles, grain and vignette are removed.
import { Draw, Env, Mat, Mesh, ShotFrame } from "./engine/renderer";
import { V3, hex, m4 } from "./engine/math";

export const PAL = {
  bg: hex("#EFEFF0"),
  floor: hex("#EBEBEC"),
  white: hex("#DEDCD8"),
  graphite: hex("#2B2827"),
  wine: hex("#6B1A2B"),
  rose: hex("#C98A96"),
  sage: hex("#8A9C74"),
  sageDark: hex("#6E8160"),
  earth: hex("#CDBBA6"),
  water: hex("#B9CBD6"),
  river: hex("#5F86A0"),
};

type Look = { dof?: number; shadow?: number; floorY?: number; fade?: [number, number]; fog: number; dark?: boolean; keep?: number[]; sun?: V3; exposure?: number; ao?: number; key?: number };

// per-shot settings: floor height (undefined = no floor), fog density to melt the floor into the
// backdrop, which particle batches carry meaning (others are decorative and dropped)
export const LOOK: Record<string, Look> = {
  hook: { floorY: -1.3, fade: [2.5, 7], fog: 0.02, keep: [], sun: [0.45, 0.8, 0.45] },
  title: { fog: 0.0, keep: [] },
  map: { floorY: -0.86, fade: [9, 22], fog: 0.006, keep: [], sun: [-0.5, 0.75, 0.35], ao: 0.45 },
  soil: { floorY: -2.4, fade: [7, 18], fog: 0.01, keep: [0, 1], sun: [-0.55, 0.7, 0.45] },
  grapes: { dof: 0.22, fog: 0.03, keep: [], sun: [0.35, 0.75, 0.45] },
  veraison: { dof: 0.22, fog: 0.03, keep: [], sun: [-0.4, 0.75, 0.45] },
  harvest: { floorY: -0.002, fade: [6, 30], fog: 0.035, keep: [], sun: [-0.5, 0.6, 0.35] },
  sorting: { floorY: 0, fade: [4, 12], fog: 0.02, keep: [], sun: [0.5, 0.75, 0.4] },
  vat: { floorY: 0, fade: [5, 14], fog: 0.015, keep: [0, 1], sun: [-0.45, 0.75, 0.5] },
  skins: { fog: 0.08, dark: true, keep: [0, 1, 2] },
  press: { floorY: 0, fade: [3, 9], fog: 0.02, keep: [0], sun: [0.45, 0.8, 0.4] },
  cellar: { floorY: 0, fade: [8, 26], fog: 0.02, keep: [0], sun: [0.35, 0.8, 0.45] },
  blend: { floorY: 0.9, fade: [2, 6], fog: 0.03, keep: [0], sun: [0.4, 0.8, 0.55] },
  finale: { floorY: 0.9, fade: [1.5, 5], fog: 0.03, keep: [], sun: [-0.5, 0.7, 0.5] },
};

const isGreen = (c?: V3) => !!c && c[1] > c[0] * 1.15 && c[1] > c[2] * 1.15;
const brightEmit = (m: Mat) => !!m.emit && Math.max(...m.emit) > 2.5;

function material(m: Mat): Mat | null {
  const p = m.pattern ?? 0;
  if (p === 2) return null; // brick / stone walls and vaults
  if (brightEmit(m) && (m.base?.[0] ?? 1) === 0) return null; // lamp bulbs, glowing doors
  if (p === 11) return null; // room floors: the studio floor replaces them
  if (p === 9) return { ...m, spec: 0.3, rough: 0.55, emit: undefined, p1: [0.1, 0, 0, 0] }; // wine: deep, matte cut faces
  if (p === 4) return { ...m, base: PAL.white, rough: 0.42, metal: 0, spec: 0.7, pattern: 0 };
  if (p === 3) return { ...m, p1: [m.p1?.[0] ?? 8, m.p1?.[1] ?? 1.6, m.p1?.[2] ?? 0.5, 0], c3: PAL.sage, c4: PAL.earth };
  if (p === 14) return { ...m, base: PAL.sage, c1: [0.92, 0.95, 0.9], c2: [1.05, 1.05, 1.0], sss: 0.1 };
  if (p === 12 && (m.base?.[0] ?? 0) < 0.2) return { ...m, base: PAL.white, pattern: 0, rough: 0.5 }; // lab table / wall planks
  if (m.double && (m.sss ?? 0) > 0 && isGreen(m.base)) return { ...m, base: PAL.sageDark, sss: 0.14, rough: 0.6 };
  return { ...m, emit: m.emit && Math.max(...m.emit) < 0.06 ? undefined : m.emit };
}

let floor: Mesh | null = null;
export function setFloor(m: Mesh) {
  floor = m;
}

export function modernize(id: string, f: ShotFrame): ShotFrame {
  const L = LOOK[id];
  if (!L) return f;
  const dark = !!L.dark;
  const draws: Draw[] = [];
  for (const d of f.draws) {
    const m = dark ? d.mat : material(d.mat);
    if (m) draws.push({ ...d, mat: m });
  }
  if (floor && L.floorY !== undefined) draws.push({ mesh: floor, mat: { base: PAL.floor, rough: 0.92, spec: 0.4, pattern: 15, p1: [...(L.fade ?? [4, 16]), 1, L.shadow ?? 0.3] }, xf: m4.trs([f.camera.target[0], L.floorY, f.camera.target[2]], [0, 0, 0], 1) });
  const particles = (f.particles ?? []).filter((_, i) => (L.keep ?? []).includes(i)).map((p) => (dark ? p : { ...p, blend: "alpha" as const, col: p.col.map((c) => [c[0] * 0.55, c[1] * 0.55, c[2] * 0.55, Math.min(1, (c[3] ?? 1) * 1.2)]) }));
  const env: Env = dark
    ? { ...f.env, fog: f.env.fog }
    : {
        skyTop: PAL.bg,
        skyHor: PAL.bg,
        skyBot: PAL.bg,
        sunDir: L.sun ?? f.env.sunDir,
        sunCol: [1.72, 1.69, 1.64].map((x) => x * (L.key ?? 1)) as V3,
        sunDisk: 0,
        ambSky: [0.6, 0.6, 0.62],
        ambGnd: [0.4, 0.39, 0.39],
        envAmt: 0.55,
        fog: [L.fog, 0, -1e3, L.fog > 0 ? 1 : 0],
        fogCol: PAL.bg,
        lights: [],
        shadow: f.env.shadow ? { ...f.env.shadow, soft: 4, radius: f.env.shadow.radius * 1.15 } : undefined,
      };
  const post = {
    ...(f.post ?? {}),
    tonemap: "neutral" as const,
    exposure: (L.exposure ?? 1) * (dark ? (f.post?.exposure ?? 1) * 1.1 : 1),
    bloom: dark ? 0.15 : 0.05,
    bloomThreshold: 1.4,
    contrast: 1.0,
    sat: 1.0,
    vignette: dark ? 0.25 : 0.0,
    grain: 0,
    ca: 0,
    lift: [0, 0, 0] as V3,
    tintHigh: [0, 0, 0] as V3,
    tintShadow: [0, 0, 0] as V3,
    ao: { strength: L.ao ?? 0.6, radius: 26 },
    dof: f.post?.dof ? { ...f.post.dof, aperture: f.post.dof.aperture * (L.dof ?? 0.6) } : undefined,
  };
  return { ...f, draws, particles, env, post };
}
