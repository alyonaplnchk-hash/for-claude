// HOOK: a giant grape squeezed between glass plates in a hot-coloured studio void; the juice runs clear.
// Then ruby ribbons erupt around it: "So where does the red come from?"
import { ShotFactory, cached, C, basePost } from "./common";
import { Draw, Particles, Camera } from "../engine/renderer";
import { box, sphere, tube } from "../engine/geometry";
import { V3, m4, hex, smooth, easeInOut, easeOut, lerp, lerp3, rng, noise1, scale } from "../engine/math";

export const helix = (k: number, n: number, turns = 1.6, r0 = 0.5, r1 = 1.4, h = 1.8) => {
  const pts: V3[] = [];
  const a0 = (k / n) * Math.PI * 2;
  const dir = k % 2 ? 1 : -1;
  for (let i = 0; i <= 90; i++) {
    const s = i / 90;
    const a = a0 + dir * s * turns * Math.PI * 2;
    const R = lerp(r0, r1, Math.pow(s, 0.8)) * (1 + 0.15 * Math.sin(s * 9 + k));
    pts.push([Math.cos(a) * R, (s - 0.35) * h * (k % 3 === 0 ? 1 : 0.8), Math.sin(a) * R]);
  }
  return pts;
};

export const wineRibbonMat = () => ({
  base: hex("#6e0618"),
  rough: 0.05,
  spec: 1.6,
  sss: 0.25,
  pattern: 9,
  p1: [0.35, 0, 0, 0],
  c1: hex("#ff2040"),
});

// Tube along part [s0, s1] of a path, keeping the full-path taper (re-uploaded each frame).
export function partialTube(pts: V3[], s0: number, s1: number, radius: (s: number) => number, seg = 14) {
  const n = pts.length - 1;
  const at = (s: number): V3 => {
    const x = Math.min(Math.max(s, 0), 1) * n;
    const i = Math.min(Math.floor(x), n - 1);
    return lerp3(pts[i], pts[i + 1], x - i);
  };
  const out: V3[] = [];
  const steps = Math.max(2, Math.ceil((s1 - s0) * n));
  for (let i = 0; i <= steps; i++) out.push(at(s0 + ((s1 - s0) * i) / steps));
  return tube(out, (t) => radius(s0 + (s1 - s0) * t), seg);
}

export const hook: ShotFactory = (dur) => {
  let grape: any, plate: any, drop: any, stem: any, rib: any[] = [], redDrop: any, eng: any;
  const paths = Array.from({ length: 9 }, (_, k) => helix(k, 9));
  const ribR = (s: number) => 0.055 * Math.sin(Math.min(Math.max(s, 0), 1) * Math.PI) + 0.012;
  const H2 = 3.9; // when the second line lands
  const cam = (t: number): Camera => {
    const push = easeInOut(t / 3.6);
    const pull = easeInOut((t - H2 + 0.3) / 2.6);
    const ang = lerp(-0.35, 0.15, t / dur) + pull * 0.5;
    const dist = lerp(lerp(2.6, 2.05, push), 3.6, pull);
    const y = lerp(lerp(0.05, -0.05, push), 0.45, pull);
    const shake: V3 = [noise1(t * 1.3) * 0.015, noise1(t * 1.1 + 9) * 0.015, 0];
    return {
      pos: [Math.sin(ang) * dist + shake[0], y + shake[1], Math.cos(ang) * dist],
      target: [0, lerp(-0.08, 0.05, pull), 0],
      fov: lerp(34, 40, pull),
    };
  };
  return {
    init(e) {
      grape = cached(e, "berry-hi", () => sphere(1, 48, 36));
      stem = cached(e, "hook-stem", () => tube([[0, 0, 0], [0.02, 0.12, 0], [0.09, 0.25, 0.02], [0.2, 0.32, 0.05]], (t) => lerp(0.045, 0.025, t), 10, hex("#6b6a2a")));
      plate = cached(e, "plate", () => box(0.04, 1.6, 1.4));
      drop = cached(e, "drop", () => sphere(1, 20, 14));
      redDrop = drop;
      eng = e;
      for (let k = 0; k < 9; k++) rib.push(e.mesh(partialTube(paths[k], 0, 0.01, ribR)));
    },
    camera: cam,
    anchors: () => ({ grape: [0, 0.2, 0], drop: [0, -0.9, 0] }),
    frame(t) {
      const squash = 0.33 * smooth(0.45, 2.3, t) - 0.04 * Math.max(0, Math.sin((t - 2.3) * 3)) * smooth(2.3, 2.8, t);
      const halfW = 0.5 * (1 - squash);
      const pull = smooth(H2 - 0.4, H2 + 2.0, t);
      const draws: Draw[] = [];
      // grape: lying so that local Y (squash axis) is world X
      draws.push({
        mesh: grape,
        mat: { base: [1, 1, 1], rough: 0.3, spec: 1.2, sss: 0.4, sheen: 0.45, pattern: 8, p1: [1, 0, 0, 0], c1: C.grapeGreen, c2: hex("#2c1042") },
        xf: m4.trs([0, 0, 0], [0, 0, Math.PI / 2], [0.5, 0.5, 0.5]),
        cols: [[1, 1, 1, 0.3]],
        deform: [squash, 1, 0.6, 0],
      });
      draws.push({ mesh: stem, mat: { base: [1, 1, 1], rough: 0.6 }, xf: m4.trs([0, 0.47, 0], [0, 0.6, 0], 1) });
      // juice beads on the skin near the plates
      const r = rng(4);
      const glass: Draw[] = [];
      const plateMat = { glass: { tint: [0.93, 0.97, 1.0] as V3, refr: 0.035, absorb: 0.15, refl: 0.7 } };
      const plateIn = smooth(0.0, 0.6, t);
      for (const s of [-1, 1]) {
        glass.push({ mesh: plate, mat: plateMat, xf: m4.trs([s * (halfW + 0.03 + (1 - plateIn) * 0.6), 0.05, 0], [0, 0, 0], 1) });
      }
      // clear juice drops: born at the bottom, fall in slow motion
      const dm: any[] = [];
      for (let i = 0; i < 22; i++) {
        const born = 1.25 + i * 0.12 + r() * 0.25;
        const age = t - born;
        if (age < 0) continue;
        const x0 = (r() - 0.5) * 0.35 * (1 - squash), z0 = (r() - 0.5) * 0.3;
        const vx = (r() - 0.5) * 0.25, vz = (r() - 0.5) * 0.25;
        const g = 0.9;
        const y = -0.44 + 0.05 - 0.5 * g * age * age;
        const sz = 0.022 + r() * 0.03;
        const stretch = 1 + Math.min(age * 0.9, 0.7);
        if (y < -3) continue;
        dm.push(m4.trs([x0 + vx * age, Math.min(y, -0.4), z0 + vz * age], [0, 0, 0], [sz, sz * stretch, sz]));
      }
      // beads squeezed out at the plate contact lines
      for (let i = 0; i < 14; i++) {
        const born = 0.9 + r() * 1.2;
        const age = Math.max(0, t - born);
        if (t < born) continue;
        const s = r() < 0.5 ? -1 : 1;
        const zz = (r() - 0.5) * 0.6;
        const yy = 0.25 - r() * 0.5 - age * age * 0.08;
        const sz = Math.min(age * 0.05, 0.018 + r() * 0.012);
        dm.push(m4.trs([s * (halfW - 0.01), yy, zz], [0, 0, 0], [sz * 0.7, sz, sz]));
      }
      if (dm.length) glass.push({ mesh: drop, mat: { glass: { tint: [0.97, 0.99, 1.0], refr: 0.16, absorb: 0.25, refl: 1 } }, xf: dm });
      // ruby ribbons erupt on the second line
      rib.forEach((m, k) => {
        const st = H2 - 0.2 + k * 0.07;
        const rev = easeOut((t - st) / 1.6);
        const tail = Math.min(Math.max(0, (t - st - 2.6) / 2), 0.98);
        if (rev <= 0.01 || tail >= rev) return;
        eng.updateMesh(m, partialTube(paths[k], tail, rev, ribR));
        draws.push({
          mesh: m,
          mat: wineRibbonMat(),
          model: m4.trs([0, 0, 0], [0, t * 0.35, 0], 1),
          xf: m4.ident(),
          cols: [[1, 1, 1, k / 9]],
        });
      });
      // red droplets flung from the ribbons
      if (t > H2) {
        const rd: any[] = [];
        const rr = rng(77);
        for (let i = 0; i < 40; i++) {
          const born = H2 + rr() * 1.6;
          const age = t - born;
          if (age < 0) continue;
          const a = rr() * Math.PI * 2, el = (rr() - 0.3) * 1.4, sp = 0.8 + rr() * 1.4;
          const dirv: V3 = [Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)];
          const d0 = 0.6;
          const p: V3 = [dirv[0] * (d0 + sp * age), dirv[1] * (d0 + sp * age) - 0.3 * age * age, dirv[2] * (d0 + sp * age)];
          const sz = 0.015 + rr() * 0.035;
          rd.push(m4.trs(p, [0, 0, 0], sz));
        }
        if (rd.length) draws.push({ mesh: redDrop, mat: wineRibbonMat(), xf: rd });
      }
      // floating bokeh specks
      const parts: Particles = { pos: [], size: [], col: [], shape: 0, blend: "add" };
      const pr = rng(11);
      for (let i = 0; i < 70; i++) {
        const p: V3 = [(pr() - 0.5) * 7, (pr() - 0.5) * 4 + Math.sin(t * 0.5 + i) * 0.1, -1.5 - pr() * 4];
        parts.pos.push(p[0] + t * 0.05 * (pr() - 0.5), p[1], p[2]);
        parts.size.push(0.02 + pr() * 0.07);
        const c = pr() < 0.5 ? [1.0, 0.5, 0.2] : [1.0, 0.25, 0.7];
        parts.col.push([c[0], c[1], c[2], 0.5 + pr() * 0.5]);
      }
      const camNow = cam(t);
      const focus = Math.hypot(camNow.pos[0], camNow.pos[1], camNow.pos[2]) - 0.55;
      const bgA = { top: hex("#ff2f8e"), hor: hex("#ff8a1e"), bot: hex("#5a10a0") };
      const bgB = { top: hex("#ff1d5e"), hor: hex("#ff4d2e"), bot: hex("#3a0650") };
      return {
        camera: camNow,
        env: {
          skyTop: scale(lerp3(bgA.top, bgB.top, pull), 0.8),
          skyHor: scale(lerp3(bgA.hor, bgB.hor, pull), 0.8),
          skyBot: lerp3(bgA.bot, bgB.bot, pull),
          glowDir: [0, 0.05, -1],
          glowCol: lerp3([0.9, 0.45, 0.05], [0.8, 0.1, 0.05], pull),
          glowPow: 9,
          glow2Dir: [-0.8, 0.8, -0.3],
          glow2Col: [0.6, 0.0, 0.5],
          glow2Pow: 4,
          sunDir: [0.45, 0.75, 0.55],
          sunCol: [3.4, 3.1, 2.9],
          sunDisk: 0,
          ambSky: [0.3, 0.1, 0.28],
          ambGnd: [0.35, 0.16, 0.05],
          envAmt: 1,
          lights: [
            { pos: [-1.4, 0.9, -1.4], col: [1.0, 0.15, 0.7], intensity: 14, radius: 6 },
            { pos: [1.5, -0.6, -1.2], col: [1.0, 0.5, 0.08], intensity: 14, radius: 6 },
          ],
          skyNoise: 0.3,
        },
        post: basePost({ exposure: 0.95, bloom: 0.55, bloomThreshold: 1.0, sat: 1.25, contrast: 1.1, vignette: 0.4, dof: { focus, aperture: 0.5, maxCoc: 12 } }),
        draws,
        glass,
        particles: [parts],
      };
    },
  };
};
