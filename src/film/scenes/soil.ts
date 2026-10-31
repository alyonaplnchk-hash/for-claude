// SOIL: two floating cut-away specimens of vineyard. Left Bank: deep gravel, roots plunge, rain drains,
// heat radiates. Across the river, Right Bank: cool clay over limestone. The camera trucks between them.
import { ShotFactory, cached, basePost, C } from "./common";
import { B } from "../beats";
import { Draw, Particles, Camera } from "../engine/renderer";
import { Geo, box, tube } from "../engine/geometry";
import { V3, m4, hex, smooth, easeInOut, lerp, rng, spline } from "../engine/math";
import { vineBlock, groundMat, VineBlock } from "./vineyard";

const W = 4, D = 4.5, H = 2.4;
export const LX = -3.1, RX = 3.1;

function rootsGeo(seed: number, deep: boolean, cx: number) {
  const r = rng(seed);
  const g = new Geo();
  const zf = D / 2 + 0.012;
  for (const rx of [-1.2, 0, 1.2]) {
    const x0 = cx + rx;
    const main: V3[] = [];
    const depth = deep ? H - 0.15 : 1.25;
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      main.push([x0 + Math.sin(t * 5 + rx) * 0.12 * t, -t * depth, zf]);
    }
    g.merge(tube(main, (t) => lerp(0.045, 0.008, t), 6, hex("#e8d2a8")));
    const branches = deep ? 6 : 11;
    for (let b = 0; b < branches; b++) {
      const t0 = deep ? 0.15 + r() * 0.75 : 0.05 + r() * 0.6;
      const p0 = main[Math.floor(t0 * 14)];
      const dir = r() < 0.5 ? -1 : 1;
      const lenB = deep ? 0.25 + r() * 0.35 : 0.35 + r() * 0.5;
      const pts: V3[] = [];
      for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        pts.push([p0[0] + dir * t * lenB, p0[1] - t * lenB * (deep ? 0.9 : 0.45) + Math.sin(t * 4 + b) * 0.03, zf]);
      }
      g.merge(tube(pts, (t) => lerp(0.016, 0.004, t), 5, hex("#e8d2a8")));
    }
  }
  return g;
}

export const soil: ShotFactory = (dur) => {
  let block: any, top: any, roots: [any, any] = [null, null], vL: VineBlock, vR: VineBlock, water: any;
  const S = B.soil;
  const cam = (t: number): Camera => {
    const k = easeInOut((t - (S.right - 0.9)) / 1.9);
    const a = Math.max(0, t) / (S.right - 0.9);
    const pL: V3 = spline([[LX - 3.4, 1.9, 6.6], [LX - 1.6, 1.1, 6.0], [LX + 0.4, 0.7, 5.6]], Math.min(a, 1));
    const tL: V3 = [LX + 0.2, -0.75, 0.6];
    const pR: V3 = lerp3v([RX - 0.6, 1.0, 6.0], [RX + 1.2, 0.8, 5.5], Math.max(0, (t - S.right - 1) / (dur - S.right)));
    const tR: V3 = [RX, -0.6, 0.6];
    return { pos: lerp3v(pL, pR, k), target: lerp3v(tL, tR, k), fov: 44 };
  };
  return {
    init(e) {
      block = cached(e, "soil-block", () => box(W, H, D));
      top = cached(e, "soil-top", () => box(W, 0.02, D));
      water = cached(e, "soil-water", () => box(2.2 * 1.0, 0.02, D * 1.4));
      roots = [cached(e, "rootsL", () => rootsGeo(3, true, LX)), cached(e, "rootsR", () => rootsGeo(5, false, RX))];
      const base = { rows: 3, plants: 5, rowGap: 1.2, plantGap: 0.92, z0: -1.85, leavesPerPlant: 70, bunchesPerPlant: 3, detailBunches: 0 };
      vL = vineBlock(e, "soilL", { ...base, x0: LX - 1.2, seed: 3 });
      vR = vineBlock(e, "soilR", { ...base, x0: RX - 1.2, seed: 8 });
    },
    camera: cam,
    anchors: () => ({
      gravel: [LX - 1.25, -0.7, D / 2],
      roots: [LX + 0.05, -1.9, D / 2],
      heat: [LX - 0.4, 1.5, 0.8],
      leftTop: [LX, 1.7, 0],
      clay: [RX - 1.3, -0.55, D / 2],
      limestone: [RX + 0.6, -1.75, D / 2],
      rightTop: [RX, 1.7, 0],
      river: [0, -1.9, 1.8],
    }),
    frame(t) {
      const draws: Draw[] = [];
      // left: gravel specimen
      draws.push({ mesh: block, mat: { base: [1, 1, 1], pattern: 5, p1: [-0.18, -1.35, -1.95, 0], p2: [5.5, 0.95, 0.45, 0], c1: hex("#6e5c4a"), c2: hex("#a8977c"), c3: hex("#a8854f"), c4: hex("#6e6052") }, xf: m4.trs([LX, -H / 2, 0]) });
      draws.push({ mesh: top, mat: groundMat({ p1: [11, 1.2, 0.35, 0.95], c1: hex("#b8ab95"), c2: hex("#857866") }), xf: m4.trs([LX, 0, 0]) });
      // right: clay over limestone
      draws.push({ mesh: block, mat: { base: [1, 1, 1], pattern: 5, p1: [-0.15, -1.05, -1.9, 0], p2: [5.5, 0.04, 0.0, 0], c1: hex("#4a3a2c"), c2: hex("#6a5a50"), c3: hex("#bdb39c"), c4: hex("#a89e86") }, xf: m4.trs([RX, -H / 2, 0]) });
      draws.push({ mesh: top, mat: groundMat({ p1: [7, 1.2, 0.35, 0.08], c4: hex("#5e4a3a") }), xf: m4.trs([RX, 0, 0]) });
      const rootGrow = [smooth(S.gravel - 0.5, S.heat + 1.5, t), smooth(S.right - 0.5, S.clay + 1.2, t)];
      roots.forEach((m, i) => {
        if (rootGrow[i] > 0.01) draws.push({ mesh: m, mat: { base: [1, 1, 1], rough: 0.7, emit: [0.25, 0.18, 0.1], p3: [rootGrow[i], -1, 0, 1], noShadow: true } });
      });
      draws.push(...vL.draws(t), ...vR.draws(t));
      draws.push({ mesh: water, mat: { base: hex("#14405a"), rough: 0.08, spec: 1.3, noShadow: true, emit: [0.01, 0.03, 0.05] }, xf: m4.trs([0, -1.95, 0]) });

      const parts: Particles[] = [];
      // rain draining through gravel (fast) vs held in clay (slow)
      const rain: Particles = { pos: [], size: [], col: [], shape: 2, blend: "alpha" };
      const r = rng(21);
      for (let i = 0; i < 70; i++) {
        const x = (r() - 0.5) * (W - 0.4);
        const ph = r();
        const lt = (t * 0.55 + ph) % 1;
        rain.pos.push(LX + x, -0.05 - lt * (H - 0.2), D / 2 + 0.03);
        rain.size.push(0.022);
        rain.col.push([0.25, 0.6, 1.0, 0.9 * smooth(S.gravel, S.gravel + 0.6, t) * smooth(1, 0.85, lt)]);
      }
      for (let i = 0; i < 70; i++) {
        const x = (r() - 0.5) * (W - 0.4);
        const ph = r();
        const lt = Math.min(((t - S.clay) * 0.12 + ph * 0.6) % 0.7, 0.55);
        rain.pos.push(RX + x, -0.05 - lt * 1.4, D / 2 + 0.03);
        rain.size.push(0.022);
        rain.col.push([0.25, 0.6, 1.0, 0.9 * smooth(S.clay - 0.3, S.clay + 0.4, t)]);
      }
      parts.push(rain);
      // heat shimmer rising off the stones
      const heat: Particles = { pos: [], size: [], col: [], shape: 0, blend: "add" };
      for (let i = 0; i < 90; i++) {
        const ph = r();
        const lt = (t * 0.35 + ph) % 1;
        heat.pos.push(LX + (r() - 0.5) * W, 0.05 + lt * 1.6, (r() - 0.5) * D);
        heat.size.push(0.05 + r() * 0.06);
        heat.col.push([1.0, 0.45, 0.1, 0.55 * smooth(S.heat - 0.4, S.heat + 0.5, t) * Math.sin(lt * Math.PI)]);
      }
      parts.push(heat);
      // drifting dust
      const dust: Particles = { pos: [], size: [], col: [], shape: 0, blend: "add" };
      for (let i = 0; i < 50; i++) {
        dust.pos.push((r() - 0.5) * 16, (r() - 0.3) * 5 + Math.sin(t * 0.3 + i) * 0.1, (r() - 0.5) * 8);
        dust.size.push(0.015 + r() * 0.02);
        dust.col.push([1, 0.85, 0.6, 0.35]);
      }
      parts.push(dust);
      const c = cam(t);
      const focus = Math.hypot(c.pos[0] - c.target[0], c.pos[1] - c.target[1], c.pos[2] - c.target[2]) - 1.5;
      return {
        camera: c,
        env: {
          skyTop: hex("#5d86b8"),
          skyHor: hex("#f0b27a"),
          skyBot: hex("#7a5a48"),
          glowDir: [-0.6, 0.2, -0.7],
          glowCol: [1.2, 0.6, 0.25],
          glowPow: 5,
          sunDir: [-0.65, 0.62, 0.42],
          sunCol: [2.5, 2.0, 1.45],
          sunDisk: 0,
          ambSky: [0.32, 0.36, 0.45],
          ambGnd: [0.22, 0.17, 0.12],
          envAmt: 0.6,
          fog: [0.006, 0.0, 0, 0.5],
          fogCol: hex("#e8b98a"),
          shadow: { center: [0, -0.5, 0], radius: 7.5, bias: 0.015, soft: 2 },
        },
        post: basePost({ exposure: 1.0, bloom: 0.45, sat: 1.1, dof: { focus: Math.max(focus, 2), aperture: 0.25, maxCoc: 10 } }),
        draws,
        particles: parts,
      };
    },
  };
};

function lerp3v(a: V3, b: V3, t: number): V3 {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}
export { C };
