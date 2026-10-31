// Shared procedural props: berries, bunches, vines, barrels, glassware, bottle, crates, trees, château.
import { Geo, box, sphere, lathe, cylinder, disk, tube, vineLeaf, bunchBerries } from "../engine/geometry";
import { V3, M4, m4, rng, lerp } from "../engine/math";
import { C } from "./common";

export const berryGeo = () => sphere(1, 22, 16);
export const leafGeo = () => vineLeaf();

// One bunch: berry instance transforms (relative to bunch top) + a stem geometry.
export function bunch(seed: number, count = 70, size = 1) {
  const berries = bunchBerries(seed, count, 0.16 * size, 0.055 * size, 0.0088 * size);
  const r = rng(seed + 99);
  const stemPts: V3[] = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    stemPts.push([Math.sin(t * 3 + seed) * 0.006 * size, (0.05 - t * 0.19) * size, Math.cos(t * 2 + seed) * 0.006 * size]);
  }
  const stem = tube(stemPts, (t) => lerp(0.0035, 0.0015, t) * size, 6, [0.42, 0.36, 0.18]);
  // peduncle hook
  stem.merge(tube([[0, 0.05 * size, 0], [0.01 * size, 0.08 * size, 0.0], [0.03 * size, 0.1 * size, 0]], 0.003 * size, 6, [0.35, 0.3, 0.16]));
  return {
    berries: berries.map((b) => ({ m: m4.trs(b.p, [r() * 6, r() * 6, 0], [b.s, b.s * 1.06, b.s]), p: b.p, s: b.s, rnd: r() })),
    stem,
  };
}

// Barrique bordelaise: 0.95 m long, heads Ø0.56 m, belly Ø0.69 m. Axis along local Y, centred at origin.
export function barrelBody(seg = 28, rings = 14, arc = Math.PI * 2, phi0 = 0) {
  const L = 0.95, rh = 0.28, rb = 0.345;
  const prof: [number, number][] = [];
  for (let i = 0; i <= rings; i++) {
    const y = i / rings;
    const k = 1 - Math.pow(2 * y - 1, 2);
    prof.push([rh + (rb - rh) * k, y * L - L / 2]);
  }
  return lathe(prof, seg, [1, 1, 1], phi0, arc);
}
export function barrelHoops(seg = 28) {
  const g = new Geo();
  const L = 0.95, rh = 0.28, rb = 0.345;
  const rAt = (y: number) => rh + (rb - rh) * (1 - Math.pow((2 * (y + L / 2)) / L - 1, 2));
  for (const y of [-0.43, -0.38, -0.2, 0.2, 0.38, 0.43]) {
    const r = rAt(y) + 0.004;
    g.merge(lathe([[r, y - 0.018], [r + 0.003, y], [r, y + 0.018]], seg));
  }
  return g;
}
export function barrelHeads(seg = 28) {
  const g = new Geo();
  g.merge(disk(0.27, seg), m4.trs([0, 0.47, 0]));
  g.merge(disk(0.27, seg), m4.trs([0, -0.47, 0], [Math.PI, 0, 0]));
  return g;
}

// Bordeaux glass, ~0.235 m tall. Returns outer glass and a wine body filled to `level` (0..1 of bowl).
const GLASS_PROFILE: [number, number][] = [
  [0.0, 0.0], [0.038, 0.0], [0.04, 0.003], [0.02, 0.006], [0.0055, 0.014], [0.0042, 0.05], [0.0045, 0.085],
  [0.012, 0.095], [0.03, 0.105], [0.043, 0.122], [0.048, 0.142], [0.047, 0.165], [0.043, 0.19], [0.038, 0.215], [0.035, 0.235],
];
export function wineGlass(seg = 40) {
  return lathe(GLASS_PROFILE, seg);
}
export function glassWine(level: number, seg = 40) {
  const yb = 0.098, yt = 0.215;
  const yl = yb + (yt - yb) * level;
  const inner = (y: number) => {
    // interpolate glass profile radius and inset for thickness
    for (let i = 1; i < GLASS_PROFILE.length; i++) {
      const [r1, y1] = GLASS_PROFILE[i - 1], [r2, y2] = GLASS_PROFILE[i];
      if (y >= y1 && y <= y2) return lerp(r1, r2, (y - y1) / (y2 - y1 || 1)) - 0.0018;
    }
    return 0.03;
  };
  const prof: [number, number][] = [[0, yb]];
  const n = 12;
  for (let i = 0; i <= n; i++) {
    const y = yb + 0.004 + ((yl - yb - 0.004) * i) / n;
    prof.push([Math.max(inner(y), 0.004), y]);
  }
  const g = lathe(prof, seg);
  g.merge(disk(inner(yl), seg), m4.trs([0, yl, 0]));
  return g;
}

// Bordeaux bottle with high shoulders, 0.30 m.
export function bottleGeo(seg = 40) {
  const p: [number, number][] = [
    [0, 0.004], [0.03, 0.0], [0.0372, 0.004], [0.0375, 0.02], [0.0375, 0.2], [0.036, 0.212], [0.03, 0.224], [0.02, 0.236],
    [0.0152, 0.25], [0.0145, 0.27], [0.0145, 0.286], [0.0165, 0.288], [0.0165, 0.298], [0.012, 0.3], [0, 0.3],
  ];
  return lathe(p, seg);
}
export function capsuleGeo(seg = 40) {
  return lathe([[0.0149, 0.255], [0.0149, 0.286], [0.0169, 0.288], [0.0169, 0.299], [0.0125, 0.3015], [0, 0.3015]], seg);
}

// Open-top harvest crate (0.5 x 0.2 x 0.33).
export function crateGeo(c: V3 = [1, 1, 1]) {
  const g = new Geo();
  const w = 0.5, h = 0.2, d = 0.33, t = 0.012;
  g.merge(box(w, t, d, c), m4.trs([0, t / 2, 0]));
  for (const s of [-1, 1]) {
    g.merge(box(w, h, t, c), m4.trs([0, h / 2, (s * (d - t)) / 2]));
    g.merge(box(t, h, d, c), m4.trs([(s * (w - t)) / 2, h / 2, 0]));
  }
  // rim
  for (const s of [-1, 1]) {
    g.merge(box(w + 0.01, 0.015, t * 2, c), m4.trs([0, h, (s * (d - t)) / 2]));
    g.merge(box(t * 2, 0.015, d + 0.01, c), m4.trs([(s * (w - t)) / 2, h, 0]));
  }
  return g;
}

// Rounded deciduous tree (~6 m) and a slim poplar; leafy blobs are noisy spheres.
export function treeGeo(seed: number, slim = false) {
  const r = rng(seed);
  const g = new Geo();
  const trunkH = slim ? 2 : 1.8;
  g.merge(cylinder(0.12, 0.22, trunkH + 1, 7, false, C.bark));
  const blobs = slim ? 5 : 7;
  for (let i = 0; i < blobs; i++) {
    const s = slim ? 1.0 + r() * 0.4 : 1.6 + r() * 0.9;
    const b = sphere(s, 12, 9, [0.17 + r() * 0.06, 0.3 + r() * 0.08, 0.1]);
    for (let k = 0; k < b.count; k++) {
      const n = 1 + (Math.sin(b.pos[k * 3] * 3.1 + seed) * Math.cos(b.pos[k * 3 + 2] * 2.7) * 0.12);
      b.pos[k * 3] *= n;
      b.pos[k * 3 + 1] *= n;
      b.pos[k * 3 + 2] *= n;
    }
    const y = trunkH + (slim ? i * 1.4 + 1 : 1.2 + r() * 2.2);
    const spread = slim ? 0.3 : 1.6;
    g.merge(b, m4.trs([(r() - 0.5) * spread * 2, y, (r() - 0.5) * spread * 2], [0, 0, 0], slim ? [0.8, 1.3, 0.8] : 1));
  }
  return g;
}

// Médoc-style château: central block with mansard roof, two pavilions, windows, steps.
export function chateauGeo() {
  const g = new Geo();
  const stone = C.limestone, slate = C.slate, win: V3 = [0.05, 0.06, 0.08], frame: V3 = [0.92, 0.9, 0.86];
  const block = (x: number, z: number, w: number, h: number, d: number, roofH: number) => {
    g.merge(box(w, h, d, stone), m4.trs([x, h / 2, z]));
    g.merge(box(w + 0.3, 0.3, d + 0.3, frame), m4.trs([x, h + 0.15, z]));
    // mansard roof: a tapered box (lathe with 4 segments makes a pyramid frustum)
    const roof = lathe([[Math.SQRT1_2, 0], [Math.SQRT1_2 * 0.62, 1], [0, 1.02]], 4, slate, Math.PI / 4);
    g.merge(roof, m4.trs([x, h + 0.3, z], [0, 0, 0], [w + 0.2, roofH, d + 0.2]));
    // windows on front (+z) face
    const cols = Math.max(1, Math.floor(w / 2.2));
    for (let i = 0; i < cols; i++) {
      const wx = x - w / 2 + (w / cols) * (i + 0.5);
      for (let fl = 0; fl < Math.floor(h / 3.4); fl++) {
        const wy = 1.6 + fl * 3.4;
        g.merge(box(1.25, 2.2, 0.1, frame), m4.trs([wx, wy, z + d / 2 + 0.02]));
        g.merge(box(1.0, 1.95, 0.12, win), m4.trs([wx, wy, z + d / 2 + 0.04]));
      }
      // dormer
      g.merge(box(0.9, 1.1, 0.6, frame), m4.trs([wx, h + 0.3 + roofH * 0.45, z + d / 2 - 0.1]));
      g.merge(box(0.65, 0.8, 0.62, win), m4.trs([wx, h + 0.3 + roofH * 0.45, z + d / 2 - 0.08]));
    }
  };
  block(0, 0, 18, 7, 10, 4);
  block(-11.5, 1, 5, 8.5, 6, 6);
  block(11.5, 1, 5, 8.5, 6, 6);
  // steps
  for (let i = 0; i < 4; i++) g.merge(box(6 - i * 0.4, 0.18, 1.6 - i * 0.35, frame), m4.trs([0, 0.09 + i * 0.18, 5.8 - i * 0.18]));
  // chimneys
  for (const x of [-5, 5]) g.merge(box(0.8, 2.2, 0.8, stone), m4.trs([x, 7 + 0.3 + 4.2, -1]));
  return g;
}

// Vineyard row building blocks
export function trunkGeo(seed: number) {
  const r = rng(seed);
  const pts: V3[] = [];
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    pts.push([(r() - 0.5) * 0.05, t * 0.5, (r() - 0.5) * 0.05]);
  }
  // cordon arms along the row (z)
  const g = tube(pts, (t) => lerp(0.045, 0.03, t), 7, C.bark);
  g.merge(tube([[0, 0.48, 0], [0, 0.52, 0.2], [0.01, 0.53, 0.45]], 0.022, 6, C.bark));
  g.merge(tube([[0, 0.48, 0], [0, 0.5, -0.2], [-0.01, 0.52, -0.45]], 0.022, 6, C.bark));
  return g;
}

export type VineRowOpts = { rows: number; plants: number; rowGap: number; plantGap: number; x0: number; z0: number; seed: number; leavesPerPlant: number; bunchesPerPlant: number; height?: number; skip?: (x: number, z: number) => boolean };

// Returns instance transforms for leaves, trunks, bunches, posts for a block of vine rows along Z.
export function vineyardInstances(o: VineRowOpts) {
  const r = rng(o.seed);
  const leaves: M4[] = [], leafCols: number[][] = [];
  const trunks: M4[] = [];
  const bunches: { m: M4; pos: V3 }[] = [];
  const posts: M4[] = [];
  const H = o.height ?? 1.25;
  for (let i = 0; i < o.rows; i++) {
    const x = o.x0 + i * o.rowGap;
    for (let j = 0; j < o.plants; j++) {
      const z = o.z0 + j * o.plantGap;
      if (o.skip && o.skip(x, z)) continue;
      trunks.push(m4.trs([x, 0, z], [0, (r() - 0.5) * 0.4, 0], 0.9 + r() * 0.2));
      for (let k = 0; k < o.leavesPerPlant; k++) {
        const side = r() < 0.5 ? -1 : 1;
        const y = 0.5 + Math.pow(r(), 0.75) * (H - 0.48);
        const spreadX = 0.12 + 0.18 * Math.sin(((y - 0.6) / (H - 0.6)) * Math.PI) ;
        const lx = x + side * spreadX * (0.4 + r() * 0.8);
        const lz = z + (r() - 0.5) * o.plantGap * 1.15;
        const s = 0.13 + r() * 0.09;
        const yaw = side > 0 ? Math.PI / 2 : -Math.PI / 2;
        leaves.push(m4.trs([lx, y, lz], [(r() - 0.5) * 1.2 - 0.3, yaw + (r() - 0.5) * 1.6, (r() - 0.5) * 1.0], s));
        const g = 0.75 + r() * 0.4;
        leafCols.push([g * (0.95 + r() * 0.15), g, g * (0.85 + r() * 0.2), r()]);
      }
      for (let k = 0; k < o.bunchesPerPlant; k++) {
        const side = r() < 0.5 ? -1 : 1;
        const p: V3 = [x + side * (0.06 + r() * 0.08), 0.58 + r() * 0.12, z + (r() - 0.5) * o.plantGap * 0.8];
        bunches.push({ m: m4.trs(p, [0, r() * 6, (r() - 0.5) * 0.3], 0.9 + r() * 0.3), pos: p });
      }
      if (j % 6 === 0) posts.push(m4.trs([x, 0, z + o.plantGap / 2], [0, 0, 0], 1));
    }
  }
  return { leaves, leafCols, trunks, bunches, posts };
}
