// WINERY: sorting table + destemmer, a cut-away fermentation vat, and a macro dive among grape skins
// where the juice turns from pale to ruby as the anthocyanins bleed out.
import { ShotFactory, cached, basePost } from "./common";
import { B } from "../beats";
import { Engine, Draw, Particles, Camera, Mat, Env } from "../engine/renderer";
import { Geo, box, cylinder, lathe, sphere, disk, tube } from "../engine/geometry";
import { V3, M4, m4, hex, smooth, easeInOut, lerp, lerp3, rng, noise1, scale, spline } from "../engine/math";
import { bunch } from "./assets";
import { grapeMat } from "./vineyard";

export const steel = (o: Partial<Mat> = {}): Mat => ({ base: hex("#c4c8cc"), rough: 0.32, metal: 0.75, pattern: 4, ...o });
const concrete: Mat = { base: hex("#8f8a82"), rough: 0.85, pattern: 11, p1: [2.5, 0, 0, 0] };
const stone: Mat = { base: hex("#cbbd9f"), rough: 0.9, pattern: 2, p1: [0.45, 0.9, 0.025, 0] };

// A plain winery hall (floor, back and side walls).
export function hall(e: Engine, key: string, w: number, d: number, h: number) {
  const floor = cached(e, key + "-floor", () => box(w, 0.1, d));
  const wall = cached(e, key + "-wall", () => box(w, h, 0.3));
  const side = cached(e, key + "-side", () => box(0.3, h, d));
  return (): Draw[] => [
    { mesh: floor, mat: concrete, xf: m4.trs([0, -0.05, 0]) },
    { mesh: wall, mat: stone, xf: m4.trs([0, h / 2, -d / 2]) },
    { mesh: side, mat: stone, xf: [m4.trs([-w / 2, h / 2, 0]), m4.trs([w / 2, h / 2, 0])] },
  ];
}

// Stainless fermentation tank. arc < 2π gives a cut-away opening facing +Z.
export const VAT_R = 1.2;
export function vatShell(arc = Math.PI * 2) {
  const prof: [number, number][] = [[0.25, 0.42], [VAT_R, 0.62], [VAT_R, 3.3], [0.35, 3.75], [0.32, 3.85], [0.0, 3.86]];
  const phi0 = arc < Math.PI * 2 ? Math.PI / 2 + (Math.PI * 2 - arc) / 2 : 0;
  const g = lathe(prof, 56, [1, 1, 1], phi0, arc);
  // legs + top manway ring + bands
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    g.merge(cylinder(0.05, 0.05, 0.62, 8, true), m4.trs([Math.cos(a) * 0.95, 0, Math.sin(a) * 0.95]));
  }
  return g;
}
function vatLiquid(arc: number, y0: number, y1: number, r: number) {
  const phi0 = Math.PI / 2 + (Math.PI * 2 - arc) / 2;
  const g = lathe([[r, y0], [r, y1]], 56, [1, 1, 1], phi0, arc);
  // top surface sector
  const top = new Geo();
  const c = top.vert([0, y1, 0], [0, 1, 0]);
  for (let i = 0; i <= 56; i++) {
    const a = phi0 + (i / 56) * arc;
    top.vert([Math.cos(a) * r, y1, Math.sin(a) * r], [0, 1, 0]);
  }
  for (let i = 0; i < 56; i++) top.tri(c, c + 1 + i, c + 2 + i);
  g.merge(top);
  // the two cut faces show the liquid volume
  for (const a of [phi0, phi0 + arc]) {
    const n: V3 = [-Math.sin(a), 0, Math.cos(a)];
    const f = new Geo();
    const q = [f.vert([0, y0, 0], n), f.vert([Math.cos(a) * r, y0, Math.sin(a) * r], n), f.vert([Math.cos(a) * r, y1, Math.sin(a) * r], n), f.vert([0, y1, 0], n)];
    f.quad(q[0], q[1], q[2], q[3]);
    g.merge(f);
  }
  return g;
}

const interiorEnv = (o: Partial<Env> = {}): Env => ({
  skyTop: hex("#8a8278"),
  skyHor: hex("#c8b49a"),
  skyBot: hex("#5a4e44"),
  sunDir: [0.4, 0.75, 0.5],
  sunCol: [1.3, 1.15, 1.0],
  ambSky: [0.3, 0.28, 0.27],
  ambGnd: [0.16, 0.13, 0.1],
  envAmt: 0.9,
  fog: [0.02, 0, 0, 0.5],
  fogCol: hex("#3a2c22"),
  ...o,
});

export const sorting: ShotFactory = (dur) => {
  let room: () => Draw[], belt: any, frame: any, drum: any, berry: any, vat: any, bin: any, door: any;
  const protos = [bunch(201, 80), bunch(203, 75), bunch(207, 70)];
  const SPEED = 0.32;
  const cam = (t: number): Camera => {
    const k = easeInOut(t / dur);
    return { pos: [lerp(-1.4, 0.9, k), 1.75, 1.55], target: [lerp(-0.4, 1.9, k), 0.95, 0], fov: 46, roll: noise1(t * 0.5) * 0.008 };
  };
  return {
    init(e) {
      room = hall(e, "sortroom", 16, 12, 6);
      belt = cached(e, "belt", () => box(4.6, 0.04, 0.62));
      frame = cached(e, "belt-frame", () => {
        const g = new Geo();
        for (const z of [-0.36, 0.36]) g.merge(box(4.8, 0.14, 0.04), m4.trs([0, 0.94, z]));
        for (const x of [-2.2, -0.7, 0.8, 2.2]) for (const z of [-0.33, 0.33]) g.merge(cylinder(0.03, 0.03, 0.9, 8), m4.trs([x, 0, z]));
        return g;
      });
      drum = cached(e, "drum", () => {
        const g = lathe([[0.36, -0.6], [0.36, 0.6]], 40);
        g.merge(disk(0.36, 40), m4.trs([0, 0.6, 0]));
        return g;
      });
      berry = cached(e, "berry-mid", () => sphere(1, 12, 9));
      vat = cached(e, "vat-full", () => vatShell());
      bin = cached(e, "bin", () => lathe([[0.55, 0], [0.62, 0.55], [0.6, 0.56], [0.53, 0.02]], 32));
      door = cached(e, "door", () => box(3.2, 4, 0.05));
    },
    camera: cam,
    anchors: () => ({ belt: [-0.6, 1.0, 0.3], drum: [3.0, 1.35, 0.3], bin: [3.0, 0.5, 0.0] }),
    frame(t) {
      const off = t * SPEED;
      const draws: Draw[] = [
        ...room(),
        { mesh: belt, mat: { base: hex("#2a2b2e"), rough: 0.6, pattern: 12, p1: [0.12, off, 0, 0] }, xf: m4.trs([0, 0.98, 0]) },
        { mesh: frame, mat: steel() },
        { mesh: drum, mat: steel({ pattern: 13, p1: [40, 18, 0, 0], rough: 0.35 }), xf: m4.trs([3.0, 1.32, 0], [t * 2.2, 0, Math.PI / 2], 1) },
        { mesh: bin, mat: steel() , xf: m4.trs([3.0, 0, 0]) },
        { mesh: vat, mat: steel(), xf: [m4.trs([-4, 0, -4.2]), m4.trs([-1.2, 0, -4.4]), m4.trs([1.6, 0, -4.2]), m4.trs([4.4, 0, -4.4])] },
        { mesh: door, mat: { base: [0, 0, 0], emit: [2.6, 2.3, 1.9], noShadow: true }, xf: m4.trs([7.9, 2, -1], [0, Math.PI / 2, 0], 1) },
      ];
      // bunches riding the belt
      const bm: M4[] = [], bc: number[][] = [];
      const r = rng(31);
      for (let i = 0; i < 16; i++) {
        const x0 = -2.3 + ((i * 0.33 + off + r() * 0.1) % 5.2);
        if (x0 > 2.25) continue;
        const z = (r() - 0.5) * 0.36;
        const p = protos[i % 3];
        const bx = m4.trs([x0, 1.06, z], [Math.PI / 2, r() * 6, Math.PI / 2 + (r() - 0.5)], 1);
        for (const b of p.berries) {
          bm.push(m4.mul(bx, b.m));
          bc.push([1, 1, 1, b.rnd]);
        }
      }
      // loose berries tumbling out of the drum into the bin
      for (let i = 0; i < 90; i++) {
        const ph = r();
        const lt = (t * 0.9 + ph) % 1;
        const x = 3.0 + (r() - 0.5) * 0.9;
        const y = 0.98 - lt * lt * 0.6;
        const s = 0.009 + r() * 0.002;
        bm.push(m4.trs([x, y, (r() - 0.5) * 0.4], [0, 0, 0], s));
        bc.push([1, 1, 1, r()]);
      }
      draws.push({ mesh: berry, mat: grapeMat(1), xf: bm, cols: bc });
      return {
        camera: cam(t),
        env: interiorEnv({
          sunDir: [0.85, 0.45, 0.25],
          sunCol: [2.2, 2.0, 1.75],
          shadow: { center: [0.5, 0.8, 0], radius: 4.5, bias: 0.01, soft: 2.5 },
          lights: [
            { pos: [-1, 3.5, 1.5], col: [1, 0.78, 0.55], intensity: 14, radius: 9 },
            { pos: [2.5, 3.5, 1.2], col: [1, 0.78, 0.55], intensity: 12, radius: 9 },
          ],
        }),
        post: basePost({ exposure: 1.05, bloom: 0.5, sat: 1.08, dof: { focus: 1.9, aperture: 0.6, maxCoc: 12 } }),
        draws,
      };
    },
  };
};

export const vat: ShotFactory = (dur) => {
  let room: () => Draw[], shell: any, full: any, liquid: any, berry: any, capI: any, pipe: any;
  const V = B.vat;
  const ARC = Math.PI * 1.45;
  const cam = (t: number): Camera => {
    const k = easeInOut(t / dur);
    return { pos: [lerp(2.4, 0.9, k), lerp(3.6, 2.9, k), lerp(7.4, 4.6, k)], target: [0, lerp(2.1, 2.25, k), 0], fov: 44 };
  };
  return {
    init(e) {
      room = hall(e, "cuverie", 20, 14, 7);
      shell = cached(e, "vat-cut", () => vatShell(ARC));
      full = cached(e, "vat-full", () => vatShell());
      liquid = cached(e, "vat-liquid", () => vatLiquid(ARC, 0.64, 2.75, VAT_R - 0.03));
      berry = cached(e, "berry-mid", () => sphere(1, 12, 9));
      // cap of skins floating on top (only inside the remaining arc)
      const r = rng(77);
      const mats: M4[] = [], cols: number[][] = [];
      const phi0 = Math.PI / 2 + (Math.PI * 2 - ARC) / 2;
      while (mats.length < 1400) {
        const a = phi0 + r() * ARC;
        const rr = Math.sqrt(r()) * (VAT_R - 0.06);
        const s = 0.03 + r() * 0.02;
        mats.push(m4.trs([Math.cos(a) * rr, 2.72 + r() * 0.32, Math.sin(a) * rr], [r() * 6, r() * 6, r() * 6], [s, s * 0.45, s]));
        cols.push([0.8 + r() * 0.3, 1, 1, r()]);
      }
      capI = e.instances(mats, cols);
      pipe = cached(e, "pumpover", () => {
        const ctl: V3[] = [[1.35, 0.9, 0.3], [1.6, 1.5, 0.3], [1.55, 3.6, 0.2], [1.1, 4.15, 0.1], [0.4, 4.05, 0.05], [0.2, 3.7, 0.05]];
        const pts: V3[] = [];
        for (let i = 0; i <= 60; i++) pts.push(spline(ctl, i / 60));
        return tube(pts, 0.06, 10);
      });
    },
    camera: cam,
    anchors: () => ({ cap: [-0.4, 3.05, 0.6], must: [0.25, 2.1, 0.75], co2: [0.0, 3.4, 0.4], vat: [-1.1, 3.5, 0], temp: [1.25, 2.0, 0.3] }),
    frame(t) {
      const draws: Draw[] = [
        ...room(),
        { mesh: shell, mat: steel({ double: true }) },
        { mesh: full, mat: steel(), xf: [m4.trs([-3.6, 0, -2.6]), m4.trs([3.6, 0, -2.6]), m4.trs([-6.8, 0, -1.2]), m4.trs([6.8, 0, -1.2])] },
        { mesh: liquid, mat: { base: hex("#5a0f2c"), rough: 0.15, spec: 1.2, emit: hex("#3a0618"), pattern: 9, p1: [0.6, 0, 0, 0], c1: hex("#c2184a"), noShadow: true } },
        { mesh: berry, mat: grapeMat(1, hex("#1c0a26")), inst: capI },
        { mesh: pipe, mat: { base: hex("#d63a3a"), rough: 0.45 } },
      ];
      const parts: Particles[] = [];
      const phi0 = Math.PI / 2 + (Math.PI * 2 - ARC) / 2;
      // CO2 bubbles rising through the must
      const bub: Particles = { pos: [], size: [], col: [], shape: 1, blend: "add" };
      const r = rng(9);
      for (let i = 0; i < 160; i++) {
        const a = phi0 - 0.25 + r() * (Math.PI * 2 - ARC + 0.5); // inside the visible cut region
        const rr = Math.sqrt(r()) * (VAT_R - 0.1);
        const sp = 0.4 + r() * 0.5;
        const lt = (t * sp * 0.5 + r()) % 1;
        const y = 0.7 + lt * 2.0;

        bub.pos.push(Math.cos(a) * rr * 0.5, y, Math.sin(a) * rr + 0.25);
        bub.size.push(0.012 + r() * 0.02);
        bub.col.push([1, 0.85, 0.9, 0.7 * smooth(V.co2 - 0.6, V.co2 + 0.3, t) + 0.25]);
      }
      parts.push(bub);
      // yeast cells: glowing specks
      const y: Particles = { pos: [], size: [], col: [], shape: 0, blend: "add" };
      for (let i = 0; i < 120; i++) {
        y.pos.push((r() - 0.5) * 1.6 + Math.sin(t + i) * 0.02, 0.8 + r() * 1.85, 0.2 + r() * 0.9);
        y.size.push(0.015 + r() * 0.015);
        y.col.push([1.0, 0.9, 0.4, 0.9 * smooth(V.yeast - 0.4, V.yeast + 0.4, t)]);
      }
      parts.push(y);
      return {
        camera: cam(t),
        env: interiorEnv({
          sunDir: [-0.5, 0.7, 0.5],
          sunCol: [1.4, 1.3, 1.2],
          shadow: { center: [0, 2, 0], radius: 6, bias: 0.02, soft: 2 },
          lights: [
            { pos: [0.4, 2.2, 0.6], col: [1.0, 0.25, 0.45], intensity: 6, radius: 3 },
            { pos: [3, 5.5, 3], col: [1, 0.8, 0.6], intensity: 26, radius: 14 },
            { pos: [-3, 5.5, 3], col: [1, 0.8, 0.6], intensity: 20, radius: 14 },
          ],
        }),
        post: basePost({ exposure: 1.05, bloom: 0.6, sat: 1.12, dof: { focus: 4.6, aperture: 0.4, maxCoc: 10 } }),
        draws,
        particles: parts,
      };
    },
  };
};

// Curved skin fragment: a patch of a sphere.
function skinGeo(seed: number) {
  const g = lathe(
    Array.from({ length: 9 }, (_, i) => {
      const th = 0.15 + (i / 8) * 0.9;
      return [Math.sin(th), Math.cos(th)] as [number, number];
    }),
    20,
    [1, 1, 1],
    seed,
    1.4,
  );
  return g;
}

export const skins: ShotFactory = (dur) => {
  let skin: any, seedM: any, skinX: { p: V3; r: V3; s: number; w: V3 }[] = [];
  const K = B.skins;
  const cam = (t: number): Camera => {
    const k = easeInOut(t / dur);
    return { pos: [lerp(-0.6, 0.4, k), lerp(0.15, -0.1, k), lerp(4.2, 2.6, k)], target: [lerp(0, 0.2, k), 0, 0], fov: 42, roll: Math.sin(t * 0.3) * 0.04 };
  };
  return {
    init(e) {
      skin = cached(e, "skin", () => skinGeo(0.3));
      seedM = cached(e, "pip", () => sphere(1, 12, 9));
      const r = rng(44);
      for (let i = 0; i < 9; i++) {
        skinX.push({ p: [(r() - 0.5) * 3.6, (r() - 0.5) * 2.2, -r() * 2.5], r: [r() * 6, r() * 6, r() * 6], s: 0.45 + r() * 0.35, w: [(r() - 0.5) * 0.3, (r() - 0.5) * 0.3, (r() - 0.5) * 0.3] });
      }
      skinX[0] = { p: [0.1, 0.0, 0.6], r: [0.8, 0.4, 0.3], s: 0.85, w: [0.08, 0.12, 0.05] };
      skinX[1] = { p: [-1.3, 0.5, -0.2], r: [2.0, 1.0, 0.3], s: 0.7, w: [-0.06, 0.1, 0.04] };
      skinX[2] = { p: [1.5, -0.6, -0.4], r: [0.3, 2.4, 1.1], s: 0.7, w: [0.05, -0.08, 0.06] };
    },
    camera: cam,
    anchors: () => ({ skin: [0.1, 0.25, 0.6], pigment: [0.9, 0.5, 0.8], seed: [-0.9, -0.55, 0.4] }),
    frame(t) {
      const draws: Draw[] = [];
      const xs = skinX.map((s) => m4.trs([s.p[0], s.p[1] + Math.sin(t * 0.4 + s.p[0]) * 0.05, s.p[2]], [s.r[0] + s.w[0] * t, s.r[1] + s.w[1] * t, s.r[2] + s.w[2] * t], s.s));
      draws.push({ mesh: skin, mat: { base: [1, 1, 1], rough: 0.35, spec: 1.2, sss: 0.9, sheen: 0.4, pattern: 8, p1: [1, 0, 0, 0], c1: hex("#8fae3c"), c2: hex("#3a0d3e"), double: true }, xf: xs });
      const r = rng(5);
      const pips: M4[] = [];
      for (let i = 0; i < 5; i++) pips.push(m4.trs([(r() - 0.5) * 2.6 - 0.4, (r() - 0.5) * 1.4 - 0.3, (r() - 0.5) * 1.2], [r() * 6 + t * 0.2, r() * 6, 0], [0.07, 0.11, 0.07]));
      draws.push({ mesh: seedM, mat: { base: hex("#8a6a3a"), rough: 0.4, spec: 1 }, xf: pips });
      // pigment bleeding out of the skins: grows through the shot
      const extract = smooth(K.skins - 0.5, K.antho + 2.5, t);
      const pig: Particles = { pos: [], size: [], col: [], shape: 0, blend: "add" };
      const n = Math.floor(80 + 520 * extract);
      for (let i = 0; i < n; i++) {
        const src = skinX[i % skinX.length];
        const ph = r();
        const lt = (t * (0.08 + r() * 0.1) + ph) % 1;
        const dir: V3 = [(r() - 0.5) * 2, (r() - 0.5) * 2, (r() - 0.5) * 2];
        const d = 0.15 + lt * 1.4;
        pig.pos.push(src.p[0] + dir[0] * d, src.p[1] + dir[1] * d + Math.sin(t + i) * 0.03, src.p[2] + dir[2] * d);
        pig.size.push(0.02 + r() * 0.05 + lt * 0.05);
        pig.col.push([1.0, 0.06 + r() * 0.1, 0.22 + r() * 0.15, (0.5 + 0.5 * extract) * Math.sin(lt * Math.PI)]);
      }
      // tannin specks (golden)
      const tan: Particles = { pos: [], size: [], col: [], shape: 0, blend: "add" };
      const tanA = smooth(K.tannin - 0.6, K.tannin + 0.4, t);
      for (let i = 0; i < 90; i++) {
        tan.pos.push((r() - 0.5) * 4, (r() - 0.5) * 2.6, (r() - 0.5) * 2 + 0.2);
        tan.size.push(0.012 + r() * 0.02);
        tan.col.push([1.0, 0.75, 0.3, 0.8 * tanA]);
      }
      const bub: Particles = { pos: [], size: [], col: [], shape: 1, blend: "add" };
      for (let i = 0; i < 40; i++) {
        const lt = (t * 0.15 + r()) % 1;
        bub.pos.push((r() - 0.5) * 4, -1.5 + lt * 3.2, (r() - 0.5) * 2.5);
        bub.size.push(0.02 + r() * 0.04);
        bub.col.push([1, 0.9, 0.95, 0.5]);
      }
      // the juice itself changes colour: pale blush -> deep ruby
      const pale = { top: hex("#e8a2b8"), hor: hex("#d9849e"), bot: hex("#a84a6a") };
      const ruby = { top: hex("#7a0326"), hor: hex("#b0103a"), bot: hex("#3a0012") };
      const k = extract;
      const fogCol = lerp3(hex("#d98aa2"), hex("#8a0a2c"), k);
      return {
        camera: cam(t),
        env: {
          skyTop: scale(lerp3(pale.top, ruby.top, k), 0.85),
          skyHor: scale(lerp3(pale.hor, ruby.hor, k), 0.85),
          skyBot: scale(lerp3(pale.bot, ruby.bot, k), 0.85),
          glowDir: [0.2, 1, 0.2],
          glowCol: lerp3([0.8, 0.7, 0.6], [1.4, 0.25, 0.3], k),
          glowPow: 4,
          sunDir: [0.3, 0.9, 0.3],
          sunCol: [2.2, 2.0, 1.9],
          ambSky: lerp3([0.6, 0.5, 0.55], [0.5, 0.1, 0.18], k),
          ambGnd: lerp3([0.45, 0.35, 0.38], [0.25, 0.04, 0.08], k),
          envAmt: 0.6,
          fog: [0.08, 0, 0, 0.6],
          fogCol: scale(fogCol, 0.9),
          lights: [{ pos: [1.5, 1.2, 2.0], col: [1, 0.9, 0.95], intensity: 8, radius: 6 }],
          skyNoise: 0.25,
        },
        post: basePost({ exposure: 0.95, bloom: 0.75, bloomThreshold: 0.8, sat: 1.25, contrast: 1.1, dof: { focus: 2.6, aperture: 1.2, maxCoc: 14 } }),
        draws,
        particles: [pig, tan, bub],
      };
    },
  };
};
