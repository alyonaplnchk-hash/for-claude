// GRAPES: backlit macro of the three main red varieties hanging side by side.
// VERAISON: one bunch turning from green to purple.
// HARVEST: low tracking shot along a row lined with small picking crates, château in the haze.
import { ShotFactory, cached, basePost } from "./common";
import { B } from "../beats";
import { Engine, Draw, Particles, Camera, InstBuf, Mesh } from "../engine/renderer";
import { sphere, tube, cylinder } from "../engine/geometry";
import { V3, M4, m4, hex, smooth, easeInOut, lerp, rng, noise1 } from "../engine/math";
import { bunch, crateGeo, leafGeo } from "./assets";
import { grapeMat, leafMat, stemMat, groundMat, hedgeGeo, vineBlock, backdrop, groundPlane, VineBlock } from "./vineyard";

type Hero = { inst: InstBuf; stem: Mesh; xf: M4 };
function heroBunch(e: Engine, key: string, seed: number, count: number, size: number, at: V3, rot = 0): Hero {
  const b = bunch(seed, count, size);
  const xf = m4.trs(at, [0, rot, 0], 1);
  const inst = e.instances(b.berries.map((x) => m4.mul(xf, x.m)), b.berries.map((x) => [1, 1, 1, x.rnd]));
  return { inst, stem: cached(e, key + "-stem", () => b.stem), xf };
}

function leafCluster(e: Engine, seed: number, n: number, center: V3, spread: V3, scale = 0.2) {
  const r = rng(seed);
  const mats: M4[] = [], cols: number[][] = [];
  for (let i = 0; i < n; i++) {
    const p: V3 = [center[0] + (r() - 0.5) * spread[0], center[1] + (r() - 0.5) * spread[1], center[2] + (r() - 0.5) * spread[2]];
    mats.push(m4.trs(p, [(r() - 0.5) * 1.4, r() * 6.28, (r() - 0.5) * 1.2], scale * (0.7 + r() * 0.6)));
    const g = 0.7 + r() * 0.45;
    cols.push([g, g, g * 0.9, r()]);
  }
  return e.instances(mats, cols);
}

const bokeh = (t: number, seed: number, n: number, center: V3, spread: V3, col: number[]): Particles => {
  const r = rng(seed);
  const p: Particles = { pos: [], size: [], col: [], shape: 0, blend: "add" };
  for (let i = 0; i < n; i++) {
    p.pos.push(center[0] + (r() - 0.5) * spread[0] + Math.sin(t * 0.4 + i) * 0.02, center[1] + (r() - 0.5) * spread[1], center[2] + (r() - 0.5) * spread[2]);
    p.size.push(0.01 + r() * 0.03);
    p.col.push([col[0], col[1], col[2], col[3] * (0.4 + r() * 0.6)]);
  }
  return p;
};

const goldenEnv = (sun: V3) => ({
  skyTop: hex("#6d8fbf"),
  skyHor: hex("#f6b46a"),
  skyBot: hex("#4b3a2a"),
  glowDir: sun,
  glowCol: [0.9, 0.5, 0.2] as V3,
  glowPow: 9,
  sunDir: sun,
  sunCol: [2.6, 2.0, 1.35] as V3,
  sunDisk: 1,
  ambSky: [0.35, 0.38, 0.48] as V3,
  ambGnd: [0.2, 0.16, 0.1] as V3,
  envAmt: 0.8,
  fog: [0.008, 0.0, 0, 0.55],
  fogCol: hex("#e9a870"),
});

export const BUNCH_POS: Record<string, V3> = { merlot: [-0.34, 1.02, 0], cs: [0.0, 1.0, 0.04], cf: [0.33, 1.03, -0.02] };

export const grapes: ShotFactory = (dur) => {
  let heroes: Hero[] = [], leaves: InstBuf, leaf: Mesh, cane: Mesh, hedge: Mesh, hedgeI: InstBuf, ground: Mesh, berry: Mesh;
  const G = B.grapes;
  const cam = (t: number): Camera => {
    const k = easeInOut(t / dur);
    return { pos: [lerp(-0.3, 0.2, k), 0.97 + noise1(t * 0.6) * 0.006, lerp(0.78, 0.7, k)], target: [lerp(0.14, 0.4, k), 0.95, 0], fov: 40 };
  };
  return {
    init(e) {
      berry = cached(e, "berry-hi22", () => sphere(1, 22, 16));
      heroes = [
        heroBunch(e, "merlot", 31, 120, 1.12, BUNCH_POS.merlot, 0.3),
        heroBunch(e, "cs", 47, 150, 0.9, BUNCH_POS.cs, 1.2),
        heroBunch(e, "cf", 59, 125, 1.0, BUNCH_POS.cf, 2.1),
      ];
      leaf = cached(e, "leaf", leafGeo);
      leaves = leafCluster(e, 4, 110, [0, 1.3, -0.3], [1.8, 0.55, 0.6], 0.2);
      cane = cached(e, "grape-cane", () => tube([[-1, 1.12, -0.04], [-0.4, 1.14, -0.05], [0, 1.13, -0.03], [0.4, 1.15, -0.05], [1, 1.13, -0.06]], 0.011, 8, hex("#3e2c20")));
      hedge = cached(e, "hedge-20", () => hedgeGeo(20, 3));
      hedgeI = e.instances([-4.8, -3.2, -1.6, 1.6, 3.2, 4.8, 6.4].map((x) => m4.trs([x, 0, -18], [0, 0, 0], 1)));
      ground = cached(e, "ground-80", () => groundPlane(80));
    },
    camera: cam,
    anchors: () => ({ merlot: [BUNCH_POS.merlot[0], 0.95, 0], cs: [BUNCH_POS.cs[0], 0.92, 0.04], cf: [BUNCH_POS.cf[0], 0.95, -0.02] }),
    frame(t) {
      const draws: Draw[] = [];
      const colors = [hex("#1d1236"), hex("#120a20"), hex("#2c1030")];
      heroes.forEach((h, i) => {
        draws.push({ mesh: berry, mat: grapeMat(1, colors[i]), inst: h.inst });
        draws.push({ mesh: h.stem, mat: stemMat, xf: h.xf });
      });
      draws.push({ mesh: leaf, mat: leafMat(0.008), inst: leaves });
      draws.push({ mesh: cane, mat: { base: [1, 1, 1], rough: 0.8 } });
      draws.push({ mesh: hedge, mat: { base: hex("#4a7a26"), rough: 0.8, sss: 0.3 }, inst: hedgeI });
      draws.push({ mesh: ground, mat: groundMat({ p1: [6, 1.6, 0.6, 0.6] }) });
      const c = cam(t);
      const focus = Math.hypot(c.pos[0] - c.target[0], c.pos[2] - c.target[2]);
      void G;
      return {
        camera: c,
        env: { ...goldenEnv([0.25, 0.32, -0.92]), shadow: { center: [0, 1, 0], radius: 1.4, bias: 0.004, soft: 2.5 }, lights: [{ pos: [0.2, 1.2, 1.2], col: [1, 0.85, 0.7], intensity: 1.2, radius: 4 }] },
        post: basePost({ exposure: 0.92, bloom: 0.5, bloomThreshold: 1.0, sat: 1.15, contrast: 1.1, dof: { focus, aperture: 2.6, maxCoc: 18 } }),
        draws,
        particles: [bokeh(t, 3, 40, [0, 1.2, -1.2], [3, 1.2, 1.5], [1, 0.75, 0.4, 0.6])],
      };
    },
  };
};

export const veraison: ShotFactory = (dur) => {
  let h: Hero, leaves: InstBuf, leaf: Mesh, berry: Mesh, hedge: Mesh, hedgeI: InstBuf, ground: Mesh;
  const V = B.veraison;
  const cam = (t: number): Camera => {
    const a = lerp(-0.5, 0.25, easeInOut(t / dur));
    const d = lerp(0.62, 0.5, easeInOut(t / dur));
    return { pos: [0.12 + Math.sin(a) * d, 0.98, Math.cos(a) * d], target: [0.12, 0.93, 0], fov: 36 };
  };
  return {
    init(e) {
      berry = cached(e, "berry-hi22", () => sphere(1, 22, 16));
      h = heroBunch(e, "ver", 71, 130, 1.15, [0, 1.02, 0], 0.5);
      leaf = cached(e, "leaf", leafGeo);
      leaves = leafCluster(e, 9, 40, [0, 1.25, -0.2], [1.2, 0.4, 0.4], 0.2);
      hedge = cached(e, "hedge-20", () => hedgeGeo(20, 3));
      hedgeI = e.instances([-3.2, -1.6, 1.6, 3.2, 4.8].map((x) => m4.trs([x, 0, -14], [0, 0, 0], 1)));
      ground = cached(e, "ground-80", () => groundPlane(80));
    },
    camera: cam,
    anchors: () => ({ bunch: [0, 0.95, 0] }),
    frame(t) {
      const prog = lerp(0.02, 1.08, smooth(V.turn - 0.3, V.turn + 2.4, t));
      const draws: Draw[] = [
        { mesh: berry, mat: grapeMat(prog), inst: h.inst },
        { mesh: h.stem, mat: stemMat, xf: h.xf },
        { mesh: leaf, mat: leafMat(0.008), inst: leaves },
        { mesh: hedge, mat: { base: hex("#4a7a26"), rough: 0.8, sss: 0.3 }, inst: hedgeI },
        { mesh: ground, mat: groundMat({ p1: [6, 1.6, 0.6, 0.6] }) },
      ];
      const c = cam(t);
      return {
        camera: c,
        env: { ...goldenEnv([-0.4, 0.45, -0.8]), shadow: { center: [0, 1, 0], radius: 1.2, bias: 0.004, soft: 2.5 }, lights: [{ pos: [0.6, 1.3, 1.0], col: [1, 0.9, 0.8], intensity: 1.0, radius: 4 }] },
        post: basePost({ exposure: 1.0, bloom: 0.55, sat: 1.12, dof: { focus: Math.hypot(c.pos[0] - 0.12, c.pos[2]), aperture: 3.0, maxCoc: 18 } }),
        draws,
        particles: [bokeh(t, 8, 30, [0, 1.2, -1.0], [2.5, 1, 1.2], [1, 0.8, 0.45, 0.6])],
      };
    },
  };
};

export const harvest: ShotFactory = (dur) => {
  let near: VineBlock, far: VineBlock, back: () => Draw[], crate: Mesh, crateI: InstBuf, berry: Mesh, crateBerries: InstBuf, ground: Mesh, secateur: Mesh;
  const cam = (t: number): Camera => {
    const z = lerp(4.0, 0.2, easeInOut(t / dur));
    return { pos: [0.85, 0.42 + noise1(t * 0.8) * 0.01, z], target: [0.55, 0.25, z - 3], fov: 46, roll: noise1(t * 0.5 + 3) * 0.01 };
  };
  return {
    init(e) {
      near = vineBlock(e, "hv-near", { rows: 2, plants: 22, rowGap: 1.6, plantGap: 1.0, x0: 0, z0: -16, seed: 13, leavesPerPlant: 55, bunchesPerPlant: 2, detailBunches: 0 });
      far = vineBlock(e, "hv-far", { rows: 3, plants: 18, rowGap: 1.6, plantGap: 1.0, x0: -4.8, z0: -16, seed: 17, leavesPerPlant: 40, bunchesPerPlant: 0 });
      back = backdrop(e, "hv-back", { rows: 26, x0: -20, rowGap: 1.6, z0: -60, length: 44, skipX: (x) => x > -6 && x < 2, trees: [[-14, 0, -64], [-9, 0, -66], [8, 0, -62], [14, 0, -70], [20, 0, -60]], chateau: { pos: [4, 0, -78], rot: -0.3 } });
      crate = cached(e, "crate", () => crateGeo());
      berry = cached(e, "berry-mid", () => sphere(1, 12, 9));
      const r = rng(5);
      const cm: M4[] = [], bm: M4[] = [], bc: number[][] = [];
      const protos = [bunch(101, 55), bunch(103, 60), bunch(107, 50)];
      for (let i = 0; i < 9; i++) {
        const z = 3 - i * 2.2 - r() * 0.4;
        const x = 0.62 + (r() - 0.5) * 0.08 + (i % 2) * 0.25;
        const cxf = m4.trs([x, 0, z], [0, (r() - 0.5) * 0.4 + Math.PI / 2, 0], 1);
        cm.push(cxf);
        for (let k = 0; k < 4; k++) {
          const p = protos[k % 3];
          const bx = m4.mul(cxf, m4.trs([(k - 1.5) * 0.11, 0.2 + (k % 2) * 0.03, (r() - 0.5) * 0.12], [Math.PI / 2 + (r() - 0.5) * 0.6, r() * 6, Math.PI / 2], 1));
          for (const b of p.berries) {
            bm.push(m4.mul(bx, b.m));
            bc.push([1, 1, 1, b.rnd]);
          }
        }
      }
      crateI = e.instances(cm);
      crateBerries = e.instances(bm, bc);
      ground = cached(e, "ground-200", () => groundPlane(200));
      secateur = cached(e, "secateur", () => cylinder(0.01, 0.01, 0.2, 6, true, hex("#c0262e")));
    },
    camera: cam,
    anchors: () => ({ crate: [0.62, 0.25, 0.8], row: [0, 1.2, -3] }),
    frame(t) {
      const draws: Draw[] = [
        ...near.draws(t),
        ...far.draws(t),
        ...back(),
        { mesh: crate, mat: { base: hex("#d8d8d2"), rough: 0.55, spec: 0.8 }, inst: crateI },
        { mesh: berry, mat: grapeMat(1), inst: crateBerries },
        { mesh: ground, mat: groundMat({ p1: [9, 1.6, 0.55, 0.75] }) },
      ];
      void secateur;
      const c = cam(t);
      return {
        camera: c,
        env: {
          ...goldenEnv([-0.55, 0.28, -0.75]),
          fog: [0.02, 0.0, 0, 0.85],
          fogCol: hex("#f1c08e"),
          shadow: { center: [1, 0, c.pos[2] - 5], radius: 9, bias: 0.02, soft: 2 },
        },
        post: basePost({ exposure: 1.0, bloom: 0.5, sat: 1.1, dof: { focus: 3.0, aperture: 0.35, maxCoc: 10 } }),
        draws,
        particles: [bokeh(t, 12, 60, [0.8, 1.2, c.pos[2] - 4], [4, 1.6, 6], [1, 0.85, 0.55, 0.35])],
      };
    },
  };
};
