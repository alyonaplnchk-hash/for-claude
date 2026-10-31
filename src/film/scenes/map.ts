// MAP: a tabletop relief model of the Gironde built from real coordinates. Rivers light up, the
// 45th parallel is drawn, then the Left Bank and Right Bank glow. Ends with a dive towards the Médoc.
import { ShotFactory, cached, basePost } from "./common";
import { B } from "../beats";
import { Draw, Particles, Camera, Mesh } from "../engine/renderer";
import { Geo, grid, ribbon, box, sphere } from "../engine/geometry";
import { V3, m4, hex, smooth, easeInOut, lerp, lerp3, rng, spline, len, sub } from "../engine/math";

const LON0 = -0.6, LAT0 = 45.0;
export const ll = (lat: number, lon: number, y = 0): V3 => [(lon - LON0) * 7.87, y, -(lat - LAT0) * 11.12];

// Rivers (lat, lon), downstream order ends at the Bec d'Ambès confluence.
const GARONNE: [number, number][] = [[44.47, 0.22], [44.53, 0.05], [44.58, -0.03], [44.56, -0.15], [44.55, -0.25], [44.6, -0.3], [44.64, -0.33], [44.72, -0.45], [44.79, -0.53], [44.82, -0.555], [44.845, -0.565], [44.87, -0.555], [44.92, -0.54], [44.98, -0.55], [45.03, -0.555]];
const DORDOGNE: [number, number][] = [[44.85, 0.45], [44.84, 0.22], [44.85, 0.05], [44.85, -0.04], [44.83, -0.15], [44.88, -0.2], [44.92, -0.24], [44.95, -0.33], [44.98, -0.42], [45.01, -0.5], [45.03, -0.555]];
const GIRONDE: [number, number][] = [[45.03, -0.555], [45.08, -0.6], [45.13, -0.67], [45.2, -0.72], [45.28, -0.78], [45.36, -0.84], [45.45, -0.92], [45.52, -0.99], [45.58, -1.05], [45.66, -1.14]];
const GIRONDE_W = (t: number) => lerp(0.32, 1.25, Math.pow(t, 1.2));
// Atlantic coastline (west of it is ocean)
const COAST: [number, number][] = [[45.8, -1.32], [45.7, -1.24], [45.62, -1.12], [45.57, -1.07], [45.51, -1.13], [45.38, -1.16], [45.22, -1.17], [45.0, -1.2], [44.89, -1.22], [44.75, -1.24], [44.62, -1.26], [44.4, -1.27]];
const ARCACHON: [number, number][] = [[44.62, -1.24], [44.68, -1.17], [44.74, -1.12], [44.73, -1.03], [44.67, -1.0], [44.63, -1.08], [44.6, -1.2]];
const MEDOC: [number, number][] = [[45.47, -0.98], [45.42, -0.86], [45.3, -0.8], [45.22, -0.75], [45.12, -0.69], [45.05, -0.645], [44.97, -0.6], [44.92, -0.66], [44.98, -0.75], [45.08, -0.8], [45.2, -0.86], [45.33, -0.93], [45.44, -1.03]];
const GRAVES: [number, number][] = [[44.86, -0.6], [44.8, -0.565], [44.72, -0.47], [44.64, -0.36], [44.56, -0.28], [44.5, -0.3], [44.54, -0.4], [44.62, -0.5], [44.72, -0.6], [44.8, -0.67]];
const LIBOURNAIS: [number, number][] = [[45.02, -0.38], [44.99, -0.22], [44.94, -0.08], [44.88, -0.0], [44.84, -0.08], [44.86, -0.2], [44.9, -0.27], [44.95, -0.36]];
const BLAYAIS: [number, number][] = [[45.3, -0.75], [45.22, -0.66], [45.12, -0.6], [45.05, -0.53], [45.0, -0.47], [45.04, -0.42], [45.14, -0.5], [45.25, -0.6], [45.33, -0.68]];

const inPoly = (lat: number, lon: number, poly: [number, number][]) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [yi, xi] = poly[i], [yj, xj] = poly[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};

const toXZ = (p: [number, number][]) => p.map(([la, lo]) => ll(la, lo));
const segDist = (p: V3, a: V3, b: V3) => {
  const ab = sub(b, a), ap = sub(p, a);
  const t = Math.max(0, Math.min(1, (ap[0] * ab[0] + ap[2] * ab[2]) / (ab[0] * ab[0] + ab[2] * ab[2] || 1)));
  return { d: Math.hypot(ap[0] - ab[0] * t, ap[2] - ab[2] * t), t };
};
const polyDist = (p: V3, pts: V3[]) => {
  let best = 1e9, bt = 0;
  let acc = 0;
  const lens: number[] = [];
  for (let i = 0; i < pts.length - 1; i++) lens.push(len(sub(pts[i + 1], pts[i])));
  const total = lens.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pts.length - 1; i++) {
    const r = segDist(p, pts[i], pts[i + 1]);
    if (r.d < best) {
      best = r.d;
      bt = (acc + r.t * lens[i]) / total;
    }
    acc += lens[i];
  }
  return { d: best, t: bt };
};

// cheap deterministic value noise for the relief
const h2 = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const vn = (x: number, y: number) => {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return lerp(lerp(h2(xi, yi), h2(xi + 1, yi), u), lerp(h2(xi, yi + 1), h2(xi + 1, yi + 1), u), v);
};
const fbm2 = (x: number, y: number) => vn(x, y) * 0.5 + vn(x * 2.1, y * 2.1) * 0.25 + vn(x * 4.3, y * 4.3) * 0.125 + vn(x * 8.7, y * 8.7) * 0.0625;

export const MAP_W = 16, MAP_D = 15, MAP_CX = 0.6, MAP_CZ = -1.2;

// signed distance (map units) to a lat/lon polygon: positive inside
const polySD = (p: V3, poly: [number, number][], lat: number, lon: number) => {
  const pts = toXZ(poly);
  let d = 1e9;
  for (let i = 0; i < pts.length; i++) d = Math.min(d, segDist(p, pts[i], pts[(i + 1) % pts.length]).d);
  return inPoly(lat, lon, poly) ? d : -d;
};

function buildTerrain() {
  const g = toXZ(GARONNE), d = toXZ(DORDOGNE), gi = toXZ(GIRONDE);
  const coastPts = toXZ(COAST);
  const g2 = grid(230, 215, MAP_W, MAP_D, (x0, z0) => {
    const x = x0 + MAP_CX, z = z0 + MAP_CZ;
    const lon = x / 7.87 + LON0, lat = -z / 11.12 + LAT0;
    const p: V3 = [x, 0, z];
    // signed distance to the Atlantic coast (positive on land, east of it)
    let coastX = -5;
    for (let i = 0; i < coastPts.length - 1; i++) {
      const a = coastPts[i], b = coastPts[i + 1];
      if (z >= a[2] && z <= b[2]) coastX = lerp(a[0], b[0], (z - a[2]) / (b[2] - a[2]));
    }
    const coastD = Math.min(x - coastX, -polySD(p, ARCACHON, lat, lon));
    const n = fbm2(x * 0.9, z * 0.9);
    let y = 0.06 + n * 0.22;
    if (lon > -0.5) y += 0.12 * fbm2(x * 1.7 + 3, z * 1.7);
    const landes = smooth(0.2, -0.4, z - 1.6 + (fbm2(x, z) - 0.5)) * smooth(-2.0, -3.0, x);
    y *= 1 - 0.45 * landes;
    const rg = polyDist(p, g), rd = polyDist(p, d), rgi = polyDist(p, gi);
    const water = Math.min(rg.d - 0.07, rd.d - 0.07, rgi.d - GIRONDE_W(rgi.t) / 2);
    const shore = smooth(0, 0.35, water);
    y = lerp(-0.06, y, shore);
    const sea = smooth(0.12, -0.05, coastD);
    y = lerp(y, -0.14, sea);
    // soft region weights: left bank positive, right bank negative
    const wl = Math.max(smooth(-0.05, 0.25, polySD(p, MEDOC, lat, lon)), smooth(-0.05, 0.25, polySD(p, GRAVES, lat, lon)));
    const wr = Math.max(smooth(-0.05, 0.25, polySD(p, LIBOURNAIS, lat, lon)), smooth(-0.05, 0.25, polySD(p, BLAYAIS, lat, lon)));
    const forest = Math.max(landes, smooth(-2.6, -3.4, x - (fbm2(z, x) - 0.5) * 0.8)) * (1 - sea);
    let c: V3 = lerp3(hex("#2e3828"), hex("#1a2619"), forest);
    c = lerp3(c, hex("#463f34"), wl);
    c = lerp3(c, hex("#3f2f38"), wr);
    c = lerp3(c, hex("#26343a"), Math.max(sea, 1 - shore));
    return { y, c, a: wl > wr ? wl : -wr };
  });
  return g2;
}

function slabSides() {
  const g = new Geo();
  const c = hex("#141414");
  g.merge(box(MAP_W, 0.8, 0.02, c), m4.trs([MAP_CX, -0.45, MAP_CZ + MAP_D / 2]));
  g.merge(box(MAP_W, 0.8, 0.02, c), m4.trs([MAP_CX, -0.45, MAP_CZ - MAP_D / 2]));
  g.merge(box(0.02, 0.8, MAP_D, c), m4.trs([MAP_CX + MAP_W / 2, -0.45, MAP_CZ]));
  g.merge(box(0.02, 0.8, MAP_D, c), m4.trs([MAP_CX - MAP_W / 2, -0.45, MAP_CZ]));
  return g;
}

export const PLACES: Record<string, V3> = {
  bordeaux: ll(44.84, -0.575, 0.12),
  pauillac: ll(45.2, -0.75, 0.15),
  margaux: ll(45.04, -0.67, 0.15),
  stemilion: ll(44.89, -0.155, 0.3),
  pomerol: ll(44.93, -0.2, 0.25),
  graves: ll(44.7, -0.5, 0.2),
  medoc: ll(45.22, -0.84, 0.2),
  libourne: ll(44.92, -0.24, 0.2),
  garonne: ll(44.62, -0.32, 0.05),
  dordogne: ll(44.86, 0.12, 0.05),
  gironde: ll(45.33, -0.8, 0.05),
  atlantic: ll(45.1, -1.6, 0.0),
  lat45: ll(45.0, 0.3, 0.2),
  leftbank: ll(45.05, -0.78, 0.25),
  rightbank: ll(44.95, -0.2, 0.35),
};

export const map: ShotFactory = (dur) => {
  let terrain: Mesh, water: Mesh, sides: Mesh, rivers: Mesh[] = [], lat45: Mesh, dot: Mesh;
  const camPath: V3[] = [
    [5.5, 9.5, 9.0],
    [3.0, 7.6, 7.2],
    [0.5, 6.4, 5.6],
    [-1.6, 5.2, 4.4],
    [-2.6, 3.0, 2.2],
    [-2.9, 1.2, 0.0],
  ];
  const tgtPath: V3[] = [
    [0.0, 0, -1.0],
    [-0.4, 0, -1.2],
    [-0.6, 0, -1.4],
    [-0.8, 0, -1.4],
    [-1.2, 0.1, -1.8],
    [-1.3, 0.15, -2.2],
  ];
  const cam = (t: number): Camera => {
    const k = easeInOut(Math.max(0, t) / dur);
    const dive = easeInOut((t - (B.map.right + 0.7)) / (dur + 0.4 - B.map.right - 0.7));
    return { pos: spline(camPath, k * 0.8 + dive * 0.2), target: spline(tgtPath, k * 0.8 + dive * 0.2), fov: 42 - dive * 6 };
  };
  return {
    init(e) {
      terrain = cached(e, "map-terrain", buildTerrain);
      sides = cached(e, "map-sides", slabSides);
      water = cached(e, "map-water", () => {
        const g = new Geo();
        const a = g.vert([MAP_CX - MAP_W / 2, 0, MAP_CZ - MAP_D / 2], [0, 1, 0]);
        g.vert([MAP_CX + MAP_W / 2, 0, MAP_CZ - MAP_D / 2], [0, 1, 0]);
        g.vert([MAP_CX + MAP_W / 2, 0, MAP_CZ + MAP_D / 2], [0, 1, 0]);
        g.vert([MAP_CX - MAP_W / 2, 0, MAP_CZ + MAP_D / 2], [0, 1, 0]);
        g.quad(a, a + 1, a + 2, a + 3);
        return g;
      });
      const lift = (p: V3[]) => p.map((q) => [q[0], 0.02, q[2]] as V3);
      rivers = [
        cached(e, "rv-gar", () => ribbon(lift(toXZ(GARONNE)), 0.05)),
        cached(e, "rv-dor", () => ribbon(lift(toXZ(DORDOGNE)), 0.05)),
        cached(e, "rv-gir", () => ribbon(lift(toXZ(GIRONDE)), (t) => 0.06 + t * 0.05)),
      ];
      lat45 = cached(e, "lat45", () => {
        const pts: V3[] = [];
        for (let i = 0; i <= 60; i++) pts.push([MAP_CX - MAP_W / 2 + (i / 60) * MAP_W, 0.42, 0]);
        return ribbon(pts, 0.035);
      });
      dot = cached(e, "map-dot", () => sphere(1, 12, 8));
    },
    camera: cam,
    anchors: () => PLACES,
    frame(t) {
      const draws: Draw[] = [];
      const M = B.map;
      const left = smooth(M.left - 0.2, M.left + 0.5, t), right = smooth(M.right - 0.2, M.right + 0.5, t);
      draws.push({ mesh: terrain, mat: { base: [1, 1, 1], rough: 0.85, pattern: 6, p1: [9, 0, 0, 0], p2: [left * 1.4, right * 1.4, 0, 0], c1: hex("#ffb23a"), c2: hex("#ff3d8b") }, model: m4.trs([MAP_CX, 0, MAP_CZ]) });
      draws.push({ mesh: sides, mat: { base: [1, 1, 1], rough: 0.9, noShadow: true } });
      draws.push({ mesh: water, mat: { base: hex("#0b2236"), rough: 0.12, spec: 1.2, noShadow: true, emit: [0.004, 0.012, 0.02] } });
      // rivers trace downstream; the estuary forms after they meet
      const rv = [smooth(M.garonne - 0.5, M.garonne + 1.6, t), smooth(M.dordogne - 0.5, M.dordogne + 1.4, t), smooth(M.gironde - 0.2, M.gironde + 1.8, t)];
      rivers.forEach((m, i) => {
        if (rv[i] <= 0.001) return;
        draws.push({ mesh: m, mat: { base: [0, 0, 0], rough: 1, emit: [0.2, 1.6, 2.6], pattern: 7, p1: [rv[i], 14, 0.6, 0.5], noShadow: true } });
      });
      const l45 = smooth(M.lat45 - 0.3, M.lat45 + 1.4, t);
      if (l45 > 0) draws.push({ mesh: lat45, mat: { base: [0, 0, 0], emit: [2.4, 2.2, 2.0], pattern: 7, p1: [l45, 30, 0.0, 1.0], noShadow: true } });
      // Bordeaux city dot
      const pulse = 0.5 + 0.5 * Math.sin(t * 4);
      draws.push({ mesh: dot, mat: { base: [1, 1, 1], emit: [3, 2.6, 2.2], noShadow: true }, xf: m4.trs(PLACES.bordeaux, [0, 0, 0], 0.07 * smooth(1.0, 1.6, t)) });
      // appellation markers once regions light up
      const marks: [V3, number, V3][] = [
        [PLACES.pauillac, left, [2.6, 1.6, 0.4]],
        [PLACES.margaux, left, [2.6, 1.6, 0.4]],
        [PLACES.graves, left, [2.6, 1.6, 0.4]],
        [PLACES.stemilion, right, [2.6, 0.5, 1.4]],
        [PLACES.pomerol, right, [2.6, 0.5, 1.4]],
      ];
      for (const [p, a, c] of marks) if (a > 0) draws.push({ mesh: dot, mat: { base: [1, 1, 1], emit: c, noShadow: true }, xf: m4.trs(p, [0, 0, 0], 0.05 * a) });
      const parts: Particles = { pos: [], size: [], col: [], shape: 0, blend: "add" };
      parts.pos.push(...PLACES.bordeaux);
      parts.size.push(0.25 + pulse * 0.15);
      parts.col.push([1.0, 0.85, 0.6, 0.5 * smooth(1.0, 1.6, t)]);
      // drifting haze motes for depth
      const r = rng(3);
      for (let i = 0; i < 60; i++) {
        parts.pos.push(MAP_CX + (r() - 0.5) * MAP_W, 0.5 + r() * 3, MAP_CZ + (r() - 0.5) * MAP_D + t * 0.05);
        parts.size.push(0.02 + r() * 0.03);
        parts.col.push([0.6, 0.8, 1.0, 0.25]);
      }
      const camNow = cam(t);
      const dive = smooth(B.map.right + 0.7, dur + 0.4, t);
      return {
        camera: camNow,
        env: {
          skyTop: hex("#05070d"),
          skyHor: hex("#1a2433"),
          skyBot: hex("#05070d"),
          glowDir: [-1, 0.15, 0.3],
          glowCol: [0.5, 0.25, 0.08],
          glowPow: 6,
          sunDir: [-0.75, 0.42, 0.35],
          sunCol: [2.6, 2.0, 1.5],
          sunDisk: 0,
          ambSky: [0.14, 0.18, 0.26],
          ambGnd: [0.05, 0.05, 0.05],
          envAmt: 0.9,
          fog: [0.02, 0.15, 0, 0.6],
          fogCol: hex("#1a2433"),
          shadow: { center: [MAP_CX, 0, MAP_CZ], radius: 11, bias: 0.01, soft: 2 },
        },
        post: basePost({ exposure: 1.05, bloom: 0.6, bloomThreshold: 0.8, sat: 1.1, contrast: 1.08, vignette: 0.55, dof: dive > 0 ? { focus: 4, aperture: dive * 0.6, maxCoc: 14 } : undefined }),
        draws,
        particles: [parts],
      };
    },
  };
};

export { lerp3 };
