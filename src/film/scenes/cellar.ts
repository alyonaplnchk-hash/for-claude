// PRESS: a vertical basket press squeezing the pomace; new wine runs between the slats.
// CELLAR: the barrel chai — dolly down the aisle, then into a cut-away barrique where oxygen seeps in.
import { ShotFactory, cached, basePost } from "./common";
import { B } from "../beats";
import { Draw, Particles, Camera, Mat, Env } from "../engine/renderer";
import { Geo, box, cylinder, lathe, sphere, disk, tube } from "../engine/geometry";
import { V3, M4, m4, hex, smooth, easeInOut, lerp, rng, noise1, spline } from "../engine/math";
import { barrelBody, barrelHoops, barrelHeads } from "./assets";
import { hall, steel } from "./winery";

export const oakMat = (o: Partial<Mat> = {}): Mat => ({ base: hex("#a87a4e"), rough: 0.7, pattern: 1, p1: [26, 0.0, 0.11, 0], p2: [1, 0, 0, 0], c1: hex("#6a0f22"), ...o });
const hoopMat: Mat = { base: hex("#8d8a86"), rough: 0.45, metal: 0.8 };
const headMat: Mat = { base: hex("#b48658"), rough: 0.75, pattern: 12, p1: [0.09, 0, 0, 0] };
const wineMat: Mat = { base: hex("#4a0614"), rough: 0.12, spec: 1.3, emit: hex("#2a0410"), pattern: 9, p1: [0.5, 0, 0, 0], c1: hex("#c2183e"), noShadow: true };

const warmEnv = (o: Partial<Env> = {}): Env => ({
  skyTop: hex("#4a3a2a"),
  skyHor: hex("#7a5a3a"),
  skyBot: hex("#2a2018"),
  sunDir: [0.3, 0.8, 0.4],
  sunCol: [0.6, 0.5, 0.4],
  ambSky: [0.16, 0.13, 0.1],
  ambGnd: [0.08, 0.06, 0.05],
  envAmt: 0.7,
  fog: [0.035, 0, 0, 0.7],
  fogCol: hex("#2a1c12"),
  ...o,
});

export const press: ShotFactory = (dur) => {
  let room: () => Draw[], tray: any, basket: any, band: any, plate: any, screw: any, frame: any, pomace: any, streams: any, pool: any, spout: any, bucket: any;
  const P = B.press;
  const cam = (t: number): Camera => {
    const a = lerp(-0.7, 0.35, easeInOut(t / dur));
    const d = lerp(3.0, 2.5, easeInOut(t / dur));
    return { pos: [Math.sin(a) * d, lerp(1.9, 1.6, t / dur), Math.cos(a) * d], target: [0, 0.95, 0], fov: 44 };
  };
  return {
    init(e) {
      room = hall(e, "pressroom", 14, 12, 6);
      tray = cached(e, "press-tray", () => lathe([[0, 0.4], [0.95, 0.4], [1.0, 0.52], [0.97, 0.53], [0.9, 0.44], [0, 0.44]], 48));
      basket = cached(e, "press-basket", () => lathe([[0.62, 0.45], [0.62, 1.4]], 64));
      band = cached(e, "press-band", () => lathe([[0.635, -0.04], [0.64, 0], [0.635, 0.04]], 64));
      plate = cached(e, "press-plate", () => cylinder(0.6, 0.6, 0.08, 48, true));
      screw = cached(e, "press-screw", () => cylinder(0.05, 0.05, 2.0, 12, true));
      frame = cached(e, "press-frame", () => {
        const g = new Geo();
        g.merge(box(2.0, 0.18, 0.22), m4.trs([0, 2.45, 0]));
        for (const x of [-0.95, 0.95]) g.merge(box(0.14, 2.1, 0.18), m4.trs([x, 1.4, 0]));
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2 + 0.4;
          g.merge(cylinder(0.05, 0.05, 0.4, 8, true), m4.trs([Math.cos(a) * 0.75, 0, Math.sin(a) * 0.75]));
        }
        return g;
      });
      pomace = cached(e, "press-pomace", () => {
        const g = sphere(1, 36, 10);
        for (let i = 0; i < g.count; i++) {
          const y = g.pos[i * 3 + 1];
          const n = 1 + Math.sin(g.pos[i * 3] * 9) * Math.cos(g.pos[i * 3 + 2] * 11) * 0.08;
          g.pos[i * 3] *= n;
          g.pos[i * 3 + 2] *= n;
          g.pos[i * 3 + 1] = Math.max(y, 0) * 0.15 * n;
        }
        return g.computeNormals();
      });
      streams = cached(e, "press-streams", () => {
        const g = new Geo();
        const r = rng(3);
        for (let i = 0; i < 26; i++) {
          const a = r() * Math.PI * 2;
          const y0 = 0.6 + r() * 0.6;
          const pts: V3[] = [];
          for (let k = 0; k <= 10; k++) {
            const t = k / 10;
            const rr = 0.625 + Math.sin(t * Math.PI) * 0.01 + t * 0.02;
            pts.push([Math.cos(a) * rr, y0 - t * (y0 - 0.46), Math.sin(a) * rr]);
          }
          g.merge(tube(pts, 0.006 + r() * 0.004, 5));
        }
        return g;
      });
      pool = cached(e, "press-pool", () => disk(0.93, 48));
      spout = cached(e, "press-spout", () => {
        const pts: V3[] = [];
        for (let i = 0; i <= 16; i++) {
          const t = i / 16;
          pts.push([1.0 + t * 0.32, 0.47 - t * t * 0.32, 0.0]);
        }
        return tube(pts, 0.018, 8);
      });
      bucket = cached(e, "press-bucket", () => lathe([[0, 0], [0.22, 0], [0.26, 0.28], [0.25, 0.29], [0.2, 0.02]], 32));
    },
    camera: cam,
    anchors: () => ({ basket: [-0.62, 1.1, 0.2], pool: [0.7, 0.47, 0.4], plate: [0, 1.4, 0], bucket: [1.35, 0.3, 0] }),
    frame(t) {
      const sq = smooth(P.press - 0.4, P.malo + 1.5, t);
      const level = lerp(1.32, 1.02, sq);
      const flow = smooth(P.press, P.press + 1.0, t);
      const draws: Draw[] = [
        ...room(),
        { mesh: tray, mat: steel() },
        { mesh: basket, mat: oakMat({ p1: [36, 0, 0, 0], p2: [0, 0, 0, 0], double: true }) },
        { mesh: band, mat: hoopMat, xf: [m4.trs([0, 0.62, 0]), m4.trs([0, 1.25, 0])] },
        { mesh: pomace, mat: { base: hex("#2a0c22"), rough: 0.6, sss: 0.3 }, xf: m4.trs([0, level - 0.02, 0], [0, 0, 0], [0.6, 1, 0.6]) },
        { mesh: plate, mat: headMat, xf: m4.trs([0, level + 0.03, 0]) },
        { mesh: screw, mat: steel({ rough: 0.2 }), xf: m4.trs([0, level + 0.1, 0]) },
        { mesh: frame, mat: { base: hex("#3a3a3e"), rough: 0.5, metal: 0.6 } },
        { mesh: bucket, mat: steel(), xf: m4.trs([1.42, 0, 0]) },
      ];
      if (flow > 0.01) {
        draws.push({ mesh: streams, mat: { ...wineMat, p3: [flow, -1, 0, 1] } });
        draws.push({ mesh: pool, mat: wineMat, xf: m4.trs([0, 0.43 + flow * 0.06, 0], [0, 0, 0], [1, 1, 1]) });
        draws.push({ mesh: spout, mat: wineMat });
      }
      const drops: Particles = { pos: [], size: [], col: [], shape: 0, blend: "add" };
      const r = rng(4);
      for (let i = 0; i < 40; i++) {
        const a = r() * Math.PI * 2;
        const lt = (t * 0.8 + r()) % 1;
        drops.pos.push(Math.cos(a) * 0.64, 1.2 - lt * 0.72, Math.sin(a) * 0.64);
        drops.size.push(0.012);
        drops.col.push([1, 0.15, 0.25, 0.8 * flow]);
      }
      return {
        camera: cam(t),
        env: warmEnv({
          skyTop: hex("#8a7a68"),
          skyHor: hex("#b8a080"),
          sunDir: [0.45, 0.8, 0.4],
          sunCol: [1.6, 1.35, 1.1],
          ambSky: [0.3, 0.26, 0.22],
          ambGnd: [0.14, 0.11, 0.09],
          fog: [0.02, 0, 0, 0.5],
          shadow: { center: [0, 1, 0], radius: 3, bias: 0.01, soft: 2.5 },
          lights: [
            { pos: [1.6, 2.6, 1.6], col: [1, 0.78, 0.55], intensity: 12, radius: 8 },
            { pos: [-2, 2.2, -1], col: [0.9, 0.6, 0.45], intensity: 6, radius: 8 },
          ],
        }),
        post: basePost({ exposure: 1.05, bloom: 0.55, sat: 1.1, dof: { focus: 2.7, aperture: 0.5, maxCoc: 12 } }),
        draws,
        particles: [drops],
      };
    },
  };
};

// barrel liquid when standing on its head (upright cut-away)
function barrelWine(arc: number, phi0: number, fill = 0.92) {
  const L = 0.95, rh = 0.28, rb = 0.345;
  const prof: [number, number][] = [];
  const top = -L / 2 + 0.03 + (L - 0.06) * fill;
  for (let i = 0; i <= 12; i++) {
    const y = -L / 2 + 0.03 + ((top - (-L / 2 + 0.03)) * i) / 12;
    const k = 1 - Math.pow((2 * (y + L / 2)) / L - 1, 2);
    prof.push([rh + (rb - rh) * k - 0.03, y]);
  }
  const g = lathe(prof, 48, [1, 1, 1], phi0, arc);
  const rTop = prof[prof.length - 1][0];
  const tg = new Geo();
  const c = tg.vert([0, top, 0], [0, 1, 0]);
  for (let i = 0; i <= 48; i++) {
    const a = phi0 + (i / 48) * arc;
    tg.vert([Math.cos(a) * rTop, top, Math.sin(a) * rTop], [0, 1, 0]);
  }
  for (let i = 0; i < 48; i++) tg.tri(c, c + 1 + i, c + 2 + i);
  g.merge(tg);
  for (const a of [phi0, phi0 + arc]) {
    const n: V3 = [-Math.sin(a), 0, Math.cos(a)];
    const f = new Geo();
    const pts = prof.map(([r, y]) => [f.vert([0, y, 0], n), f.vert([Math.cos(a) * r, y, Math.sin(a) * r], n)]);
    for (let i = 0; i < pts.length - 1; i++) f.quad(pts[i][0], pts[i][1], pts[i + 1][1], pts[i + 1][0]);
    g.merge(f);
  }
  return g;
}

export const HERO_BARREL: V3 = [0, 0.62, -9.5];

export const cellar: ShotFactory = (dur) => {
  let body: any, hoops: any, heads: any, bodyI: any, hoopI: any, headI: any, floor: any, vault: any, wallS: any, rails: any, lamp: any;
  let heroBody: any, heroWine: any, stand: any, bung: any;
  const CL = B.cellar;
  const ARC = Math.PI * 1.45;
  const PHI0 = Math.PI / 2 + (Math.PI * 2 - ARC) / 2;
  const t2 = CL.oxygen - 1.3; // when we leave the aisle for the hero barrel
  const cam = (t: number): Camera => {
    const a = easeInOut(Math.min(t / t2, 1));
    const pA: V3 = [lerp(-0.6, 0.35, a) + noise1(t * 0.4) * 0.05, lerp(1.55, 1.35, a), lerp(4.0, -3.4, a)];
    const tA: V3 = [lerp(-1.2, 0.0, a), lerp(1.0, 0.75, a), lerp(-4, -10, a)];
    const b = easeInOut((t - t2) / 2.6);
    const orbit = (t - t2) * 0.06;
    const pB: V3 = [0.95 + Math.sin(orbit) * 0.3, 1.05, HERO_BARREL[2] + 2.05 - orbit * 0.3];
    const tB: V3 = [0, 0.62, HERO_BARREL[2]];
    return { pos: [lerp(pA[0], pB[0], b), lerp(pA[1], pB[1], b), lerp(pA[2], pB[2], b)], target: [lerp(tA[0], tB[0], b), lerp(tA[1], tB[1], b), lerp(tA[2], tB[2], b)], fov: lerp(46, 40, b) };
  };
  return {
    init(e) {
      body = cached(e, "barrel-body", () => barrelBody(26, 12));
      hoops = cached(e, "barrel-hoops", () => barrelHoops(26));
      heads = cached(e, "barrel-heads", () => barrelHeads(26));
      const mats: M4[] = [];
      const cols: number[][] = [];
      const r = rng(8);
      for (const side of [-1, 1]) {
        for (let tier = 0; tier < 2; tier++) {
          for (let i = 0; i < 34; i++) {
            const z = 2.5 - i * 0.74;
            mats.push(m4.trs([side * 2.55, 0.42 + tier * 0.64, z + (tier ? 0.37 : 0)], [r() * 0.3, 0, Math.PI / 2], 1));
            cols.push([0.85 + r() * 0.3, 0.9 + r() * 0.15, 0.9 + r() * 0.15, r()]);
          }
        }
      }
      bodyI = e.instances(mats, cols);
      hoopI = e.instances(mats);
      headI = e.instances(mats, cols);
      floor = cached(e, "chai-floor", () => box(9, 0.1, 34));
      vault = cached(e, "chai-vault", () => lathe([[4.5, 0], [4.5, 34]], 32, [1, 1, 1], 0, Math.PI));
      wallS = cached(e, "chai-wall", () => box(0.3, 2.6, 34));
      rails = cached(e, "chai-rails", () => {
        const g = new Geo();
        for (const side of [-1, 1]) for (const x of [-0.25, 0.25]) g.merge(box(0.1, 0.1, 26), m4.trs([side * 2.55 + x, 0.05, -10]));
        return g;
      });
      lamp = cached(e, "lamp", () => sphere(1, 12, 8));
      heroBody = cached(e, "hero-barrel", () => barrelBody(48, 20, ARC, PHI0));
      heroWine = cached(e, "hero-wine", () => barrelWine(ARC, PHI0));
      stand = cached(e, "hero-stand", () => cylinder(0.3, 0.36, 0.14, 32, true));
      bung = cached(e, "bung", () => sphere(1, 12, 8));
    },
    camera: cam,
    anchors: () => ({
      oak: [-2.55, 1.25, -1.0],
      litres: [-2.2, 0.75, 0.2],
      hero: [0.0, 1.15, HERO_BARREL[2]],
      stave: [-0.3, 0.75, HERO_BARREL[2] + 0.2],
      wine: [0.08, 0.6, HERO_BARREL[2] + 0.15],
      toast: [0.27, 0.45, HERO_BARREL[2] - 0.05],
      oxygen: [-0.42, 0.95, HERO_BARREL[2] + 0.1],
    }),
    frame(t) {
      const draws: Draw[] = [
        { mesh: floor, mat: { base: hex("#8a7c68"), rough: 0.9, pattern: 3, p1: [14, 100, 0, 0.6], c1: hex("#b3a68e"), c2: hex("#7a6c5a"), c3: hex("#555"), c4: hex("#6a5c4a") }, xf: m4.trs([0, -0.05, -14]) },
        { mesh: vault, mat: { base: hex("#c8b89a"), rough: 0.9, pattern: 2, p1: [0.32, 0.6, 0.02, 0], double: true }, xf: m4.trs([0, 2.4, 3], [-Math.PI / 2, 0, 0], 1) },
        { mesh: wallS, mat: { base: hex("#c8b89a"), rough: 0.9, pattern: 2, p1: [0.32, 0.6, 0.02, 0] }, xf: [m4.trs([-4.5, 1.3, -14]), m4.trs([4.5, 1.3, -14])] },
        { mesh: rails, mat: { base: hex("#6a4a30"), rough: 0.8 } },
        { mesh: body, mat: oakMat(), inst: bodyI },
        { mesh: hoops, mat: hoopMat, inst: hoopI },
        { mesh: heads, mat: headMat, inst: headI },
        { mesh: heroBody, mat: oakMat({ double: true, p2: [0, 0, 0, 0] }), xf: m4.trs(HERO_BARREL) },
        { mesh: heroWine, mat: wineMat, xf: m4.trs(HERO_BARREL) },
        { mesh: stand, mat: { base: hex("#3a2a20"), rough: 0.6 }, xf: m4.trs([HERO_BARREL[0], 0, HERO_BARREL[2]]) },
        { mesh: bung, mat: { base: [0.75, 0.8, 0.85], rough: 0.08, spec: 1.5 }, xf: m4.trs([0.12, HERO_BARREL[1] + 0.48, HERO_BARREL[2] - 0.12], [0, 0, 0], [0.035, 0.03, 0.035]) },
        { mesh: lamp, mat: { base: [0, 0, 0], emit: [9, 6.5, 3.6], noShadow: true }, xf: [0, -6, -12, -18, -24].map((z) => m4.trs([0, 3.4, z], [0, 0, 0], 0.09)) },
      ];
      // oxygen seeping through the staves into the wine
      const ox: Particles = { pos: [], size: [], col: [], shape: 0, blend: "add" };
      const oxA = smooth(CL.oxygen - 0.5, CL.oxygen + 0.6, t);
      const r = rng(12);
      for (let i = 0; i < 140; i++) {
        const a = PHI0 + r() * ARC;
        const lt = (t * (0.12 + r() * 0.1) + r()) % 1;
        const rr = lerp(0.42, 0.05, lt);
        const y = (r() - 0.5) * 0.7;
        ox.pos.push(HERO_BARREL[0] + Math.cos(a) * rr, HERO_BARREL[1] + y, HERO_BARREL[2] + Math.sin(a) * rr);
        ox.size.push(0.008 + r() * 0.01);
        ox.col.push([0.55, 0.85, 1.2, oxA * Math.sin(lt * Math.PI)]);
      }
      // dust in the lamp light
      const dust: Particles = { pos: [], size: [], col: [], shape: 0, blend: "add" };
      for (let i = 0; i < 160; i++) {
        dust.pos.push((r() - 0.5) * 4, 0.3 + r() * 3, 4 - r() * 18 + Math.sin(t * 0.2 + i) * 0.1);
        dust.size.push(0.006 + r() * 0.012);
        dust.col.push([1, 0.8, 0.5, 0.5]);
      }
      // volumetric-ish glow under each lamp
      const beams: Particles = { pos: [], size: [], col: [], shape: 0, blend: "add" };
      for (const z of [0, -6, -12, -18, -24]) for (let k = 0; k < 5; k++) {
        beams.pos.push(0, 3.3 - k * 0.6, z);
        beams.size.push(0.5 + k * 0.35);
        beams.col.push([1, 0.65, 0.3, 0.05]);
      }
      const near = cam(t).pos[2];
      const lampZ = [0, -6, -12, -18, -24].sort((a, b) => Math.abs(a - near + 3) - Math.abs(b - near + 3)).slice(0, 3);
      const lights = lampZ.map((z) => ({ pos: [0, 3.3, z] as V3, col: [1, 0.72, 0.42] as V3, intensity: 16, radius: 9 }));
      lights.push({ pos: [0.6, 1.8, HERO_BARREL[2] + 1.2], col: [1, 0.8, 0.6], intensity: 5 * smooth(t2 - 1, t2 + 1, t) + 0.5, radius: 4 });
      const c = cam(t);
      const focus = Math.hypot(c.pos[0] - c.target[0], c.pos[1] - c.target[1], c.pos[2] - c.target[2]);
      return {
        camera: c,
        env: warmEnv({ lights, shadow: { center: [0, 1, c.pos[2] - 4], radius: 7, bias: 0.02, soft: 2 } }),
        post: basePost({ exposure: 1.15, bloom: 0.7, bloomThreshold: 0.9, sat: 1.08, contrast: 1.1, vignette: 0.6, dof: { focus: Math.min(focus, 6), aperture: 0.45, maxCoc: 12 } }),
        draws,
        glass: [],
        particles: [ox, dust, beams],
      };
    },
  };
};

export { spline };
