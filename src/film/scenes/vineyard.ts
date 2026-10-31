// Vineyard set-dressing shared by several shots: detailed vine rows near the camera, leafy hedges
// further away, ground with gravel and grass strips, posts and wires, trees and a château.
import { Engine, Draw, Mat, InstBuf } from "../engine/renderer";
import { Geo, box, cylinder, lathe, sphere } from "../engine/geometry";
import { V3, M4, m4, hex, rng, lerp } from "../engine/math";
import { cached, C } from "./common";
import { bunch, berryGeo, leafGeo, trunkGeo, vineyardInstances, VineRowOpts, treeGeo, chateauGeo } from "./assets";

export const leafMat = (wind = 0.012): Mat => ({ base: hex("#3f6a1f"), rough: 0.55, spec: 0.6, sss: 0.5, double: true, wind });
export const trunkMat: Mat = { base: [1, 1, 1], rough: 0.9 };
export const grapeMat = (prog = 1.25, purple: V3 = hex("#22103a")): Mat => ({ base: [1, 1, 1], rough: 0.3, spec: 1.1, sss: 0.3, sheen: 0.5, pattern: 8, p1: [prog, 0, 0, 0], c1: hex("#9dbb45"), c2: purple });
export const stemMat: Mat = { base: [1, 1, 1], rough: 0.7 };
export const groundMat = (o: Partial<Mat> = {}): Mat => ({
  base: [1, 1, 1],
  rough: 0.95,
  pattern: 3,
  p1: [9, 1.6, 0.5, 0.8],
  c1: C.gravel1,
  c2: C.gravel2,
  c3: hex("#4f6a2a"),
  c4: C.soil,
  ...o,
});

// Long leafy hedge along +Z (for distant rows).
export function hedgeGeo(length: number, seed: number) {
  const g = new Geo();
  const prof: [number, number][] = [];
  for (let i = 0; i <= 14; i++) {
    const a = (i / 14) * Math.PI;
    prof.push([Math.cos(a) * 0.3, 0.5 + Math.sin(a) * 0.82]);
  }
  const segs = Math.ceil(length / 0.35);
  const r = rng(seed);
  const jit = Array.from({ length: (segs + 1) * prof.length }, () => r());
  for (let j = 0; j <= segs; j++) {
    const z = (j / segs) * length;
    for (let i = 0; i < prof.length; i++) {
      const [px, py] = prof[i];
      const k = jit[j * prof.length + i];
      const bump = 1 + (k - 0.5) * 0.35;
      const nx = px / 0.3, ny = (py - 0.5) / 0.82;
      const c = 0.75 + k * 0.4;
      g.vert([px * bump, 0.5 + (py - 0.5) * bump, z], [nx, ny, 0], [c * 0.9, c, c * 0.8], ny);
    }
  }
  const n = prof.length;
  for (let j = 0; j < segs; j++) for (let i = 0; i < n - 1; i++) {
    const a = j * n + i;
    g.quad(a, a + 1, a + n + 1, a + n);
  }
  g.computeNormals();
  return g;
}

export type VineBlock = { draws: (t: number) => Draw[]; bunchPos: V3[] };

// Build a block of detailed vines (instanced). Bunches use full berries only for the nearest few.
export function vineBlock(e: Engine, key: string, o: VineRowOpts & { detailBunches?: number; berryProg?: number; berryColor?: V3; wire?: boolean }): VineBlock {
  const inst = vineyardInstances(o);
  const leaf = cached(e, "leaf", leafGeo);
  const trunk = cached(e, "trunk", () => trunkGeo(7));
  const post = cached(e, "post", () => cylinder(0.035, 0.04, 1.6, 6, true, hex("#6a5440")));
  const berry = cached(e, "berry-lo", () => {
    const g = berryGeo();
    return g;
  });
  const berrySmall = cached(e, "berry-vlo", () => sphere(1, 8, 6));
  const leafI: InstBuf = e.instances(inst.leaves, inst.leafCols);
  const trunkI = e.instances(inst.trunks);
  const postI = inst.posts.length ? e.instances(inst.posts) : null;
  // bunches
  const nearMats: M4[] = [], nearCols: number[][] = [];
  const farMats: M4[] = [], farCols: number[][] = [];
  const stems: M4[] = [];
  const b0 = bunch(11, 60);
  const b1 = bunch(23, 55);
  inst.bunches.forEach((bb, i) => {
    const proto = i % 2 ? b1 : b0;
    const near = i < (o.detailBunches ?? 0);
    for (const ber of proto.berries) {
      const m = m4.mul(bb.m, ber.m);
      (near ? nearMats : farMats).push(m);
      (near ? nearCols : farCols).push([1, 1, 1, ber.rnd]);
    }
    stems.push(bb.m);
  });
  const nearI = nearMats.length ? e.instances(nearMats, nearCols) : null;
  const farI = farMats.length ? e.instances(farMats, farCols) : null;
  const stemMesh = cached(e, "bunch-stem", () => b0.stem);
  const stemI = stems.length ? e.instances(stems) : null;
  // wires
  let wireMesh: any = null;
  if (o.wire !== false) {
    wireMesh = cached(e, key + "-wires", () => {
      const g = new Geo();
      const len = o.plants * o.plantGap;
      for (let i = 0; i < o.rows; i++) {
        for (const y of [0.5, 0.95, 1.3]) {
          g.merge(cylinder(0.003, 0.003, len, 4, false, [0.6, 0.6, 0.62]), m4.trs([o.x0 + i * o.rowGap, y, o.z0 - o.plantGap / 2], [Math.PI / 2, 0, 0], 1));
        }
      }
      return g;
    });
  }
  void lerp;
  return {
    bunchPos: inst.bunches.map((b) => b.pos),
    draws: () => {
      const d: Draw[] = [
        { mesh: trunk, mat: trunkMat, inst: trunkI },
        { mesh: leaf, mat: leafMat(), inst: leafI },
      ];
      if (postI) d.push({ mesh: post, mat: { base: [1, 1, 1], rough: 0.85 }, inst: postI });
      if (nearI) d.push({ mesh: berry, mat: grapeMat(o.berryProg ?? 1, o.berryColor), inst: nearI });
      if (farI) d.push({ mesh: berrySmall, mat: grapeMat(o.berryProg ?? 1, o.berryColor), inst: farI });
      if (stemI) d.push({ mesh: stemMesh, mat: stemMat, inst: stemI });
      if (wireMesh) d.push({ mesh: wireMesh, mat: { base: [1, 1, 1], rough: 0.4, metal: 0.8, noShadow: true } });
      return d;
    },
  };
}

// Far rows as hedges + scattered trees + optional château.
export function backdrop(e: Engine, key: string, o: { rows: number; x0: number; rowGap: number; z0: number; length: number; skipX?: (x: number) => boolean; trees?: V3[]; chateau?: { pos: V3; rot: number } }) {
  const hedge = cached(e, key + "-hedge", () => hedgeGeo(o.length, 3));
  const mats: M4[] = [];
  const r = rng(9);
  for (let i = 0; i < o.rows; i++) {
    const x = o.x0 + i * o.rowGap;
    if (o.skipX && o.skipX(x)) continue;
    mats.push(m4.trs([x, 0, o.z0 + (r() - 0.5) * 0.4], [0, 0, 0], 1));
  }
  const hI = e.instances(mats, mats.map(() => [0.9 + r() * 0.2, 1, 0.9, r()]));
  const tree = cached(e, "tree", () => treeGeo(5));
  const tree2 = cached(e, "tree-slim", () => treeGeo(8, true));
  const tI = o.trees?.length ? e.instances(o.trees.map((p, i) => m4.trs(p, [0, i, 0], 0.8 + (i % 3) * 0.25))) : null;
  const chateau = o.chateau ? cached(e, "chateau", chateauGeo) : null;
  return (): Draw[] => {
    const d: Draw[] = [{ mesh: hedge, mat: { base: hex("#5a8a2c"), rough: 0.8, sss: 0.3, pattern: 14, p1: [3, 0, 0, 0], c1: [0.7, 0.85, 0.6], c2: [1.1, 1.05, 0.8] }, inst: hI }];
    if (tI) {
      d.push({ mesh: tree, mat: { base: [1, 1, 1], rough: 0.85, sss: 0.3 }, inst: tI });
      void tree2;
    }
    if (chateau && o.chateau) d.push({ mesh: chateau, mat: { base: [1, 1, 1], rough: 0.7 }, xf: m4.trs(o.chateau.pos, [0, o.chateau.rot, 0], 1) });
    return d;
  };
}

export const groundPlane = (size: number) => {
  const g = new Geo();
  const n = 8;
  for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) g.vert([(-0.5 + i / n) * size, 0, (-0.5 + j / n) * size], [0, 1, 0]);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const a = j * (n + 1) + i;
    g.quad(a, a + n + 1, a + n + 2, a + 1);
  }
  return g;
};

export { box, lathe };
