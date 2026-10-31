// BLEND: graduated cylinders of each variety feed two glasses — a Left Bank and a Right Bank blend.
// FINALE: a Bordeaux bottle at sunset over the vines; it pours, the glass glows ruby, end card.
import { ShotFactory, cached, basePost } from "./common";
import { B } from "../beats";
import { Engine, Draw, Particles, Camera, Mat, Mesh } from "../engine/renderer";
import { Geo, box, cylinder, lathe, disk, tube } from "../engine/geometry";
import { V3, m4, hex, smooth, easeInOut, easeOut, lerp, rng, noise1 } from "../engine/math";
import { wineGlass, glassWine, bottleGeo, capsuleGeo } from "./assets";
import { backdrop, groundPlane, groundMat, hedgeGeo } from "./vineyard";

const glassMat: Mat = { glass: { tint: [0.97, 0.98, 1.0], refr: 0.045, absorb: 0.35, refl: 1.0 } };
export const wine = (col: string, glow = "#d0183c"): Mat => ({ base: hex(col), rough: 0.08, spec: 1.4, sss: 0.6, pattern: 9, p1: [0.7, 0, 0, 0], c1: hex(glow), noShadow: true });

const VARS = [
  { id: "cs", col: "#26061a", glow: "#a0103a", x: -0.3 },
  { id: "merlot", col: "#4a0818", glow: "#d0183c", x: 0.0 },
  { id: "cf", col: "#6a0e22", glow: "#ff2a4a", x: 0.3 },
];
// Left Bank and Right Bank example blends (Cab Sauv / Merlot / Cab Franc)
export const BLENDS = { left: [0.7, 0.15, 0.15], right: [0.15, 0.7, 0.15] };

function cylinderGlass() {
  const g = lathe([[0, 0], [0.05, 0], [0.05, 0.008], [0.034, 0.01], [0.034, 0.34], [0.037, 0.345], [0.034, 0.35]], 32);
  return g;
}

export const blend: ShotFactory = (dur) => {
  let table: Mesh, cyl: Mesh, liq: Mesh, glass: Mesh, wall: Mesh;
  const glassWines: Mesh[] = [];
  let eng: Engine;
  const BL = B.blend;
  const cam = (t: number): Camera => {
    const k = easeInOut(t / dur);
    return { pos: [lerp(-0.35, 0.3, k), lerp(1.32, 1.22, k), lerp(1.25, 0.95, k)], target: [lerp(-0.05, 0.05, k), 1.0, -0.05], fov: 40 };
  };
  return {
    init(e) {
      eng = e;
      table = cached(e, "lab-table", () => box(2.6, 0.06, 1.2));
      cyl = cached(e, "grad-cyl", cylinderGlass);
      liq = cached(e, "grad-liq", () => cylinder(0.031, 0.031, 1, 24, true));
      glass = cached(e, "wineglass", () => wineGlass(48));
      wall = cached(e, "lab-wall", () => box(8, 4, 0.2));
      for (let i = 0; i < 2; i++) glassWines.push(e.mesh(glassWine(0.05)));
    },
    camera: cam,
    anchors: () => ({ cs: [-0.3, 0.9, -0.2], merlot: [0, 0.9, -0.2], cf: [0.3, 0.9, -0.2], left: [-0.22, 1.18, 0.15], right: [0.22, 1.18, 0.15] }),
    frame(t) {
      const fl = smooth(BL.left - 0.6, BL.left + 1.6, t);
      const fr = smooth(BL.right - 0.6, BL.right + 1.4, t);
      const draws: Draw[] = [
        { mesh: table, mat: { base: hex("#6a4630"), rough: 0.45, spec: 1, pattern: 12, p1: [0.18, 0, 0, 0] }, xf: m4.trs([0, 0.87, 0], [0, Math.PI / 2, 0], 1) },
        { mesh: wall, mat: { base: hex("#3a2418"), rough: 0.7, pattern: 12, p1: [0.3, 0, 0, 0] }, xf: m4.trs([0, 2, -1.6]) },
      ];
      const glassD: Draw[] = [];
      VARS.forEach((v, i) => {
        const used = BLENDS.left[i] * fl + BLENDS.right[i] * fr;
        const h = 0.3 * (1 - used * 0.45);
        draws.push({ mesh: liq, mat: wine(v.col, v.glow), xf: m4.trs([v.x, 0.92, -0.25], [0, 0, 0], [1, h, 1]) });
        glassD.push({ mesh: cyl, mat: glassMat, xf: m4.trs([v.x, 0.9, -0.25]) });
      });
      // the two blends
      [fl, fr].forEach((f, i) => {
        const x = i === 0 ? -0.22 : 0.22;
        if (f > 0.01) {
          eng.updateMesh(glassWines[i], glassWine(0.05 + f * 0.4));
          const mix = i === 0 ? "#2e0618" : "#4a0a1c";
          draws.push({ mesh: glassWines[i], mat: wine(mix), xf: m4.trs([x, 0.9, 0.15]) });
        }
        glassD.push({ mesh: glass, mat: glassMat, xf: m4.trs([x, 0.9, 0.15]) });
      });
      // particle streams from each cylinder into each glass, thickness ~ share of the blend
      const flow: Particles = { pos: [], size: [], col: [], shape: 0, blend: "add" };
      const r = rng(2);
      const cols = [[0.55, 0.05, 0.25], [0.95, 0.1, 0.25], [1.0, 0.3, 0.35]];
      ([[fl, -0.22, BLENDS.left], [fr, 0.22, BLENDS.right]] as [number, number, number[]][]).forEach(([f, gx, mixv]) => {
        const active = smooth(0.0, 0.15, f) * smooth(1.0, 0.85, f);
        if (active <= 0) return;
        VARS.forEach((v, i) => {
          const n = Math.round(60 * mixv[i]);
          for (let k = 0; k < n; k++) {
            const u = (t * 0.6 + r()) % 1;
            const p0: V3 = [v.x, 1.27, -0.25], p1: V3 = [gx, 1.08, 0.15];
            const arc = Math.sin(u * Math.PI) * 0.14;
            flow.pos.push(lerp(p0[0], p1[0], u), lerp(p0[1], p1[1], u) + arc, lerp(p0[2], p1[2], u));
            flow.size.push(0.006 + 0.006 * mixv[i]);
            flow.col.push([cols[i][0], cols[i][1], cols[i][2], active]);
          }
        });
      });
      const bok: Particles = { pos: [], size: [], col: [], shape: 0, blend: "add" };
      for (let i = 0; i < 26; i++) {
        bok.pos.push((r() - 0.5) * 6, 1.2 + r() * 1.8, -1.45);
        bok.size.push(0.08 + r() * 0.12);
        bok.col.push([1, 0.65, 0.3, 0.25]);
      }
      const c = cam(t);
      return {
        camera: c,
        env: {
          skyTop: hex("#5a4636"),
          skyHor: hex("#a07a58"),
          skyBot: hex("#2a1e16"),
          sunDir: [0.4, 0.8, 0.6],
          sunCol: [1.7, 1.45, 1.2],
          ambSky: [0.22, 0.18, 0.15],
          ambGnd: [0.12, 0.08, 0.06],
          envAmt: 1,
          lights: [
            { pos: [0, 1.4, -0.9], col: [1, 0.7, 0.45], intensity: 1.6, radius: 3 },
            { pos: [0.8, 1.8, 0.8], col: [1, 0.9, 0.8], intensity: 3, radius: 5 },
          ],
          shadow: { center: [0, 1, 0], radius: 1.2, bias: 0.004, soft: 3 },
        },
        post: basePost({ exposure: 1.1, bloom: 0.6, sat: 1.12, vignette: 0.55, dof: { focus: Math.hypot(c.pos[0], c.pos[1] - 1, c.pos[2]), aperture: 1.6, maxCoc: 14 } }),
        draws,
        glass: glassD,
        particles: [flow, bok],
      };
    },
  };
};

function labelCanvas() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const x = c.getContext("2d")!;
  x.fillStyle = "#efe6d2";
  x.fillRect(0, 0, 1024, 512);
  x.strokeStyle = "#a8873a";
  x.lineWidth = 6;
  x.strokeRect(70, 30, 884, 452);
  x.lineWidth = 2;
  x.strokeRect(84, 44, 856, 424);
  x.fillStyle = "#3a2a1a";
  x.textAlign = "center";
  x.font = "600 30px 'DejaVu Serif', serif";
  x.fillText("GRAND VIN DE", 512, 110);
  x.font = "700 76px 'DejaVu Serif', serif";
  x.fillText("BORDEAUX", 512, 190);
  // little château line drawing
  x.strokeStyle = "#3a2a1a";
  x.lineWidth = 3;
  x.beginPath();
  x.rect(392, 255, 240, 90);
  x.rect(352, 235, 52, 110);
  x.rect(620, 235, 52, 110);
  x.moveTo(392, 255);
  x.lineTo(422, 225);
  x.lineTo(602, 225);
  x.lineTo(632, 255);
  x.moveTo(352, 235);
  x.lineTo(378, 205);
  x.lineTo(404, 235);
  x.moveTo(620, 235);
  x.lineTo(646, 205);
  x.lineTo(672, 235);
  for (let i = 0; i < 5; i++) x.rect(412 + i * 44, 275, 18, 30);
  x.stroke();
  x.font = "500 24px 'DejaVu Serif', serif";
  x.fillText("APPELLATION BORDEAUX CONTRÔLÉE", 512, 400);
  x.font = "700 34px 'DejaVu Serif', serif";
  x.fillStyle = "#7a1424";
  x.fillText("2025", 512, 448);
  return c;
}

export const finale: ShotFactory = (dur) => {
  let bottle: Mesh, capsule: Mesh, glass: Mesh, glassW: Mesh, stream: Mesh, table: Mesh, ground: Mesh, back: () => Draw[], labelTex: WebGLTexture, eng: Engine;
  const F = B.finale;
  const pourStart = F.recap - 0.6, pourEnd = F.red + 0.8;
  const BOT: V3 = [-0.16, 0.9, 0.0];
  const GL: V3 = [0.1, 0.9, 0.05];
  const tilt = (t: number) => {
    const up = easeInOut((t - pourStart) / 0.9) - easeInOut((t - pourEnd) / 0.9);
    return up;
  };
  const bottleXf = (t: number) => {
    const k = tilt(t);
    const lift = smooth(0, 0.35, k);
    return m4.trs([lerp(BOT[0], -0.218, k), lerp(BOT[1], 1.283, lift), lerp(BOT[2], GL[2], k)], [0, lerp(-0.6 + t * 0.03, 0, smooth(0, 0.6, k)), lerp(0, -1.85, k)], 1);
  };
  const cam = (t: number): Camera => {
    const a = easeInOut(t / pourStart);
    const b = easeInOut((t - pourStart) / 1.6);
    const c = easeOut((t - F.endcard) / 4);
    const p1: V3 = [lerp(-0.55, -0.35, a), lerp(1.08, 1.02, a), lerp(0.55, 0.42, a)];
    const p2: V3 = [0.42, 1.05, 0.55];
    const p3: V3 = [0.75, 1.25, 1.15];
    const t1: V3 = [-0.16, 1.03, 0];
    const t2: V3 = [0.06, 1.04, 0.03];
    const pos: V3 = [lerp(lerp(p1[0], p2[0], b), p3[0], c), lerp(lerp(p1[1], p2[1], b), p3[1], c), lerp(lerp(p1[2], p2[2], b), p3[2], c)];
    const tg: V3 = [lerp(t1[0], t2[0], b), lerp(t1[1], t2[1], b), lerp(t1[2], t2[2], b)];
    return { pos, target: tg, fov: lerp(34, 38, c) };
  };
  return {
    init(e) {
      eng = e;
      bottle = cached(e, "bottle", () => bottleGeo(48));
      capsule = cached(e, "capsule", () => capsuleGeo(48));
      glass = cached(e, "wineglass", () => wineGlass(48));
      glassW = e.mesh(glassWine(0.02));
      stream = e.mesh(tube([[0, 0, 0], [0, -0.01, 0]], 0.005, 6));
      table = cached(e, "terrace-table", () => box(2.4, 0.08, 1.4));
      ground = cached(e, "ground-200", () => groundPlane(200));
      back = backdrop(e, "fin-back", { rows: 40, x0: -32, rowGap: 1.6, z0: -60, length: 52, trees: [[-18, 0, -64], [-12, 0, -70], [10, 0, -66], [16, 0, -72], [24, 0, -62], [-26, 0, -60]], chateau: { pos: [-6, 0, -86], rot: 0.25 } });
      labelTex = e.texture(labelCanvas());
      void hedgeGeo;
      void disk;
      void Geo;
    },
    camera: cam,
    anchors: () => ({ bottle: [-0.16, 1.22, 0], glass: [0.1, 1.1, 0.05], label: [-0.12, 1.0, 0.04] }),
    frame(t) {
      const bx = bottleXf(t);
      const level = 0.02 + 0.43 * smooth(pourStart + 0.5, pourEnd + 0.3, t);
      eng.updateMesh(glassW, glassWine(level));
      const draws: Draw[] = [
        { mesh: table, mat: { base: hex("#9a8a74"), rough: 0.55, pattern: 2, p1: [0.6, 0.6, 0.006, 0] }, xf: m4.trs([0, 0.86, 0]) },
        { mesh: ground, mat: groundMat({ p1: [6, 1.6, 0.6, 0.5] }), xf: m4.trs([0, 0, 0]) },
        ...back(),
        { mesh: bottle, mat: { base: hex("#0d1a10"), rough: 0.06, spec: 1.6, pattern: 10, p1: [0.07, 0.11, 0.0, 2.6], tex: labelTex }, xf: bx },
        { mesh: capsule, mat: { base: hex("#5a0a1c"), rough: 0.3, metal: 0.6 }, xf: bx },
        { mesh: glassW, mat: wine("#5a0a1e", "#ff2a4a"), xf: m4.trs(GL) },
      ];
      const k = tilt(t);
      if (k > 0.75 && t < pourEnd + 0.3) {
        const mouth = m4.apply(bx, [0, 0.3, 0]);
        const target: V3 = [GL[0], GL[1] + 0.1 + level * 0.11, GL[2]];
        const pts: V3[] = [];
        for (let i = 0; i <= 18; i++) {
          const u = i / 18;
          pts.push([lerp(mouth[0], target[0], u), lerp(mouth[1], target[1], u) + Math.sin(u * Math.PI) * 0.015 - u * u * 0.01, lerp(mouth[2], target[2], u)]);
        }
        eng.updateMesh(stream, tube(pts, (u) => lerp(0.006, 0.0045, u), 8));
        draws.push({ mesh: stream, mat: wine("#6a0a20", "#ff3050") });
      }
      const sunDir: V3 = [0.15, 0.12, -1];
      const r = rng(4);
      const motes: Particles = { pos: [], size: [], col: [], shape: 0, blend: "add" };
      for (let i = 0; i < 50; i++) {
        motes.pos.push((r() - 0.5) * 3 + Math.sin(t * 0.3 + i) * 0.05, 0.9 + r() * 1.0, -0.5 - r() * 2);
        motes.size.push(0.004 + r() * 0.008);
        motes.col.push([1, 0.75, 0.4, 0.6]);
      }
      const end = smooth(dur - 1.2, dur, t);
      const c = cam(t);
      return {
        camera: c,
        env: {
          skyTop: hex("#2a2a6a"),
          skyHor: hex("#d8582e"),
          skyBot: hex("#3a2418"),
          glowDir: sunDir,
          glowCol: [0.8, 0.3, 0.1],
          glowPow: 8,
          glow2Dir: [-0.6, 0.35, -0.6],
          glow2Col: [0.7, 0.15, 0.45],
          glow2Pow: 3,
          sunDir,
          sunCol: [2.2, 1.4, 0.8],
          sunDisk: 0.3,
          ambSky: [0.3, 0.25, 0.35],
          ambGnd: [0.18, 0.12, 0.08],
          envAmt: 0.7,
          fog: [0.009, 0.0, 0, 0.6],
          fogCol: hex("#d8784a"),
          lights: [{ pos: [0.6, 1.4, 0.9], col: [1, 0.85, 0.75], intensity: 1.8, radius: 4 }],
          shadow: { center: [0, 0.95, 0], radius: 0.8, bias: 0.003, soft: 2.5 },
        },
        post: basePost({ exposure: 0.88, bloom: 0.5, bloomThreshold: 1.2, sat: 1.2, contrast: 1.1, fade: end, dof: { focus: Math.hypot(c.pos[0] - c.target[0], c.pos[1] - c.target[1], c.pos[2] - c.target[2]), aperture: 2.2, maxCoc: 16 } }),
        draws,
        glass: [{ mesh: glass, mat: glassMat, xf: m4.trs(GL) }],
        particles: [motes],
      };
    },
  };
};

export { noise1 };
