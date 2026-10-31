// TITLE: slow vortex of wine ribbons over a deep magenta-black void; the overlay carries the title.
import { ShotFactory, basePost } from "./common";
import { Draw, Particles, Camera, Mesh, Engine } from "../engine/renderer";
import { V3, m4, hex, lerp, rng, easeOut, noise1 } from "../engine/math";
import { partialTube, wineRibbonMat } from "./hook";

export const title: ShotFactory = (dur) => {
  let eng: Engine;
  const meshes: Mesh[] = [];
  const paths: V3[][] = [];
  const N = 7;
  for (let k = 0; k < N; k++) {
    const pts: V3[] = [];
    const a0 = (k / N) * Math.PI * 2;
    for (let i = 0; i <= 120; i++) {
      const s = i / 120;
      const a = a0 + s * Math.PI * 3.2;
      const R = 1.6 + 0.5 * Math.sin(s * 5 + k) + k * 0.08;
      pts.push([Math.cos(a) * R, (s - 0.5) * 3.2 + Math.sin(a * 2 + k) * 0.15, Math.sin(a) * R]);
    }
    paths.push(pts);
  }
  const rad = (s: number) => 0.06 * Math.sin(Math.min(Math.max(s, 0), 1) * Math.PI) + 0.01;
  const cam = (t: number): Camera => {
    const k = t / dur;
    return { pos: [0.4 * noise1(t * 0.7), lerp(-2.6, -1.6, k), lerp(0.9, 0.5, k)], target: [0, 2.5, 0], fov: 62, roll: t * 0.12 };
  };
  return {
    init(e) {
      eng = e;
      for (let k = 0; k < N; k++) meshes.push(e.mesh(partialTube(paths[k], 0, 0.02, rad)));
    },
    camera: cam,
    frame(t) {
      const draws: Draw[] = [];
      meshes.forEach((m, k) => {
        const rev = easeOut((t + 0.6 - k * 0.08) / 2.2);
        if (rev < 0.02) return;
        eng.updateMesh(m, partialTube(paths[k], 0, rev, rad));
        draws.push({ mesh: m, mat: wineRibbonMat(), model: m4.trs([0, 0, 0], [0, t * 0.3 + k * 0.1, 0], 1), cols: [[1, 1, 1, k / N]] });
      });
      const p: Particles = { pos: [], size: [], col: [], shape: 0, blend: "add" };
      const r = rng(5);
      for (let i = 0; i < 160; i++) {
        const a = r() * Math.PI * 2 + t * (0.1 + r() * 0.2);
        const R = 0.8 + r() * 3;
        p.pos.push(Math.cos(a) * R, (r() - 0.3) * 6 + t * 0.15, Math.sin(a) * R);
        p.size.push(0.01 + r() * 0.03);
        p.col.push([1.0, 0.55 + r() * 0.3, 0.3, 0.6 + r() * 0.4]);
      }
      return {
        camera: cam(t),
        env: {
          skyTop: hex("#2a0012"),
          skyHor: hex("#4a0628"),
          skyBot: hex("#12000a"),
          glowDir: [0, 1, 0],
          glowCol: [0.9, 0.05, 0.35],
          glowPow: 3,
          glow2Dir: [0.3, 0.9, 0.3],
          glow2Col: [1.2, 0.4, 0.1],
          glow2Pow: 12,
          sunDir: [0.3, 0.8, 0.5],
          sunCol: [2.4, 1.9, 1.6],
          ambSky: [0.12, 0.03, 0.08],
          ambGnd: [0.06, 0.01, 0.03],
          envAmt: 1,
          lights: [{ pos: [0, 4, 0], col: [1, 0.3, 0.6], intensity: 30, radius: 10 }],
        },
        post: basePost({ exposure: 1.0, bloom: 0.7, bloomThreshold: 0.9, sat: 1.2, contrast: 1.12, vignette: 0.6 }),
        draws,
        particles: [p],
      };
    },
  };
};
