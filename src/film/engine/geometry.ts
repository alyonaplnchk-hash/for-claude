// Procedural mesh builders. Every vertex carries position, normal, colour and one free "aux" float
// that shaders use for patterns (arc length on ribbons, stave index, map region, ...).
import { V3, M4, m4, norm, cross, sub, add, scale, len, rng } from "./math";

export class Geo {
  pos: number[] = [];
  nrm: number[] = [];
  col: number[] = [];
  aux: number[] = [];
  idx: number[] = [];

  get count() {
    return this.pos.length / 3;
  }
  vert(p: V3, n: V3, c: V3 = [1, 1, 1], a = 0) {
    this.pos.push(p[0], p[1], p[2]);
    this.nrm.push(n[0], n[1], n[2]);
    this.col.push(c[0], c[1], c[2]);
    this.aux.push(a);
    return this.count - 1;
  }
  tri(a: number, b: number, c: number) {
    this.idx.push(a, b, c);
  }
  quad(a: number, b: number, c: number, d: number) {
    this.idx.push(a, b, c, a, c, d);
  }
  transform(m: M4) {
    for (let i = 0; i < this.count; i++) {
      const p = m4.apply(m, [this.pos[i * 3], this.pos[i * 3 + 1], this.pos[i * 3 + 2]]);
      const n = norm(m4.applyDir(m, [this.nrm[i * 3], this.nrm[i * 3 + 1], this.nrm[i * 3 + 2]]));
      this.pos[i * 3] = p[0];
      this.pos[i * 3 + 1] = p[1];
      this.pos[i * 3 + 2] = p[2];
      this.nrm[i * 3] = n[0];
      this.nrm[i * 3 + 1] = n[1];
      this.nrm[i * 3 + 2] = n[2];
    }
    return this;
  }
  tint(c: V3) {
    for (let i = 0; i < this.count; i++) {
      this.col[i * 3] = c[0];
      this.col[i * 3 + 1] = c[1];
      this.col[i * 3 + 2] = c[2];
    }
    return this;
  }
  setAux(a: number) {
    for (let i = 0; i < this.count; i++) this.aux[i] = a;
    return this;
  }
  merge(g: Geo, m?: M4) {
    const src = m ? g.clone().transform(m) : g;
    const off = this.count;
    this.pos.push(...src.pos);
    this.nrm.push(...src.nrm);
    this.col.push(...src.col);
    this.aux.push(...src.aux);
    for (const i of src.idx) this.idx.push(i + off);
    return this;
  }
  clone() {
    const g = new Geo();
    g.pos = this.pos.slice();
    g.nrm = this.nrm.slice();
    g.col = this.col.slice();
    g.aux = this.aux.slice();
    g.idx = this.idx.slice();
    return g;
  }
  // Recompute smooth normals from faces (for displaced shapes).
  computeNormals() {
    const n = new Float32Array(this.pos.length);
    for (let i = 0; i < this.idx.length; i += 3) {
      const [a, b, c] = [this.idx[i], this.idx[i + 1], this.idx[i + 2]];
      const pa: V3 = [this.pos[a * 3], this.pos[a * 3 + 1], this.pos[a * 3 + 2]];
      const pb: V3 = [this.pos[b * 3], this.pos[b * 3 + 1], this.pos[b * 3 + 2]];
      const pc: V3 = [this.pos[c * 3], this.pos[c * 3 + 1], this.pos[c * 3 + 2]];
      const f = cross(sub(pb, pa), sub(pc, pa));
      for (const v of [a, b, c]) {
        n[v * 3] += f[0];
        n[v * 3 + 1] += f[1];
        n[v * 3 + 2] += f[2];
      }
    }
    for (let i = 0; i < this.count; i++) {
      const v = norm([n[i * 3], n[i * 3 + 1], n[i * 3 + 2]]);
      this.nrm[i * 3] = v[0];
      this.nrm[i * 3 + 1] = v[1];
      this.nrm[i * 3 + 2] = v[2];
    }
    return this;
  }
}

export function box(w: number, h: number, d: number, c: V3 = [1, 1, 1]) {
  const g = new Geo();
  const x = w / 2, y = h / 2, z = d / 2;
  const F: { n: V3; v: V3[] }[] = [
    { n: [1, 0, 0], v: [[x, -y, z], [x, -y, -z], [x, y, -z], [x, y, z]] },
    { n: [-1, 0, 0], v: [[-x, -y, -z], [-x, -y, z], [-x, y, z], [-x, y, -z]] },
    { n: [0, 1, 0], v: [[-x, y, z], [x, y, z], [x, y, -z], [-x, y, -z]] },
    { n: [0, -1, 0], v: [[-x, -y, -z], [x, -y, -z], [x, -y, z], [-x, -y, z]] },
    { n: [0, 0, 1], v: [[-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]] },
    { n: [0, 0, -1], v: [[x, -y, -z], [-x, -y, -z], [-x, y, -z], [x, y, -z]] },
  ];
  for (const f of F) {
    const i = f.v.map((p) => g.vert(p, f.n, c));
    g.quad(i[0], i[1], i[2], i[3]);
  }
  return g;
}

export function sphere(r: number, ws = 16, hs = 12, c: V3 = [1, 1, 1]) {
  const g = new Geo();
  for (let j = 0; j <= hs; j++) {
    const v = j / hs;
    const th = v * Math.PI;
    for (let i = 0; i <= ws; i++) {
      const u = i / ws;
      const ph = u * Math.PI * 2;
      const n: V3 = [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)];
      g.vert(scale(n, r), n, c, v);
    }
  }
  for (let j = 0; j < hs; j++) {
    for (let i = 0; i < ws; i++) {
      const a = j * (ws + 1) + i;
      const b = a + ws + 1;
      g.quad(a, a + 1, b + 1, b);
    }
  }
  return g;
}

// Surface of revolution around +Y. profile = [radius, y][] from bottom to top.
// arc < 2π gives a cut-away (opening centred on +Z... starting at phi0).
export function lathe(profile: [number, number][], seg = 32, c: V3 = [1, 1, 1], phi0 = 0, arc = Math.PI * 2, auxFromV = false) {
  const g = new Geo();
  const n = profile.length;
  // profile normals (2D) from neighbours
  const pn: [number, number][] = profile.map((p, i) => {
    const a = profile[Math.max(i - 1, 0)];
    const b = profile[Math.min(i + 1, n - 1)];
    const dr = b[0] - a[0], dy = b[1] - a[1];
    const l = Math.hypot(dr, dy) || 1;
    return [dy / l, -dr / l];
  });
  for (let i = 0; i <= seg; i++) {
    const ph = phi0 + (i / seg) * arc;
    const cs = Math.cos(ph), sn = Math.sin(ph);
    for (let j = 0; j < n; j++) {
      const [r, y] = profile[j];
      const [nr, ny] = pn[j];
      g.vert([r * cs, y, r * sn], norm([nr * cs, ny, nr * sn]), c, auxFromV ? j / (n - 1) : i / seg);
    }
  }
  for (let i = 0; i < seg; i++) {
    for (let j = 0; j < n - 1; j++) {
      const a = i * n + j;
      const b = (i + 1) * n + j;
      g.quad(a, a + 1, b + 1, b);
    }
  }
  return g;
}

export function cylinder(rt: number, rb: number, h: number, seg = 24, caps = true, c: V3 = [1, 1, 1]) {
  const g = lathe([[rb, 0], [rt, h]], seg, c);
  if (caps) {
    g.merge(disk(rt, seg, c), m4.trs([0, h, 0]));
    g.merge(disk(rb, seg, c), m4.trs([0, 0, 0], [Math.PI, 0, 0]));
  }
  return g;
}

export function disk(r: number, seg = 24, c: V3 = [1, 1, 1]) {
  const g = new Geo();
  const ctr = g.vert([0, 0, 0], [0, 1, 0], c);
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    g.vert([Math.cos(a) * r, 0, Math.sin(a) * r], [0, 1, 0], c, 1);
  }
  for (let i = 0; i < seg; i++) g.tri(ctr, ctr + 2 + i, ctr + 1 + i);
  return g;
}

export function torus(R: number, r: number, seg = 32, tseg = 8, c: V3 = [1, 1, 1]) {
  const g = new Geo();
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    const ca = Math.cos(a), sa = Math.sin(a);
    for (let j = 0; j <= tseg; j++) {
      const b = (j / tseg) * Math.PI * 2;
      const n: V3 = [Math.cos(b) * ca, Math.sin(b), Math.cos(b) * sa];
      g.vert([(R + r * Math.cos(b)) * ca, r * Math.sin(b), (R + r * Math.cos(b)) * sa], n, c);
    }
  }
  for (let i = 0; i < seg; i++) {
    for (let j = 0; j < tseg; j++) {
      const a = i * (tseg + 1) + j;
      const b = a + tseg + 1;
      g.quad(a, a + 1, b + 1, b);
    }
  }
  return g;
}

// Tube along a polyline with parallel-transport frames. radius can vary along t.
export function tube(pts: V3[], radius: number | ((t: number) => number), seg = 8, c: V3 = [1, 1, 1], caps = false) {
  const g = new Geo();
  const N = pts.length;
  const tang: V3[] = pts.map((_, i) => norm(sub(pts[Math.min(i + 1, N - 1)], pts[Math.max(i - 1, 0)])));
  let nrm: V3 = Math.abs(tang[0][1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  nrm = norm(cross(cross(tang[0], nrm), tang[0]));
  let total = 0;
  const arc = [0];
  for (let i = 1; i < N; i++) {
    total += len(sub(pts[i], pts[i - 1]));
    arc.push(total);
  }
  for (let i = 0; i < N; i++) {
    if (i > 0) {
      // transport
      const b = cross(tang[i - 1], tang[i]);
      if (len(b) > 1e-6) {
        const bn = norm(b);
        const ang = Math.acos(Math.max(-1, Math.min(1, tang[i - 1][0] * tang[i][0] + tang[i - 1][1] * tang[i][1] + tang[i - 1][2] * tang[i][2])));
        nrm = rotAxis(nrm, bn, ang);
      }
    }
    const bin = norm(cross(tang[i], nrm));
    const t = total > 0 ? arc[i] / total : 0;
    const r = typeof radius === "number" ? radius : radius(t);
    for (let j = 0; j <= seg; j++) {
      const a = (j / seg) * Math.PI * 2;
      const d = add(scale(nrm, Math.cos(a)), scale(bin, Math.sin(a)));
      g.vert(add(pts[i], scale(d, r)), d, c, t);
    }
  }
  for (let i = 0; i < N - 1; i++) {
    for (let j = 0; j < seg; j++) {
      const a = i * (seg + 1) + j;
      const b = a + seg + 1;
      g.quad(a, a + 1, b + 1, b);
    }
  }
  if (caps) {
    const r1 = typeof radius === "number" ? radius : radius(1);
    const end = g.vert(pts[N - 1], tang[N - 1], c, 1);
    const base = (N - 1) * (seg + 1);
    for (let j = 0; j < seg; j++) g.tri(base + j, base + j + 1, end);
    void r1;
  }
  return g;
}

function rotAxis(v: V3, k: V3, a: number): V3 {
  const c = Math.cos(a), s = Math.sin(a);
  const kv = cross(k, v);
  const kd = k[0] * v[0] + k[1] * v[1] + k[2] * v[2];
  return [v[0] * c + kv[0] * s + k[0] * kd * (1 - c), v[1] * c + kv[1] * s + k[1] * kd * (1 - c), v[2] * c + kv[2] * s + k[2] * kd * (1 - c)];
}

// Flat strip along a polyline (lying in XZ, normal +Y). aux = normalised arc length.
export function ribbon(pts: V3[], width: number | ((t: number) => number), c: V3 = [1, 1, 1]) {
  const g = new Geo();
  let total = 0;
  const arc = [0];
  for (let i = 1; i < pts.length; i++) {
    total += len(sub(pts[i], pts[i - 1]));
    arc.push(total);
  }
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, pts.length - 1)];
    const t = norm(sub(b, a));
    const side = norm(cross([0, 1, 0], t));
    const tt = arc[i] / (total || 1);
    const w = (typeof width === "number" ? width : width(tt)) / 2;
    g.vert(add(pts[i], scale(side, -w)), [0, 1, 0], c, tt);
    g.vert(add(pts[i], scale(side, w)), [0, 1, 0], c, tt);
  }
  for (let i = 0; i < pts.length - 1; i++) {
    const a = i * 2;
    g.quad(a, a + 2, a + 3, a + 1);
  }
  return g;
}

// Height-field grid centred on origin.
export function grid(nx: number, nz: number, w: number, d: number, fn: (x: number, z: number) => { y: number; c: V3; a?: number }) {
  const g = new Geo();
  const ys: number[] = [];
  for (let j = 0; j <= nz; j++) {
    for (let i = 0; i <= nx; i++) {
      const x = -w / 2 + (i / nx) * w;
      const z = -d / 2 + (j / nz) * d;
      const s = fn(x, z);
      ys.push(s.y);
      g.vert([x, s.y, z], [0, 1, 0], s.c, s.a ?? 0);
    }
  }
  const dx = w / nx, dz = d / nz;
  for (let j = 0; j <= nz; j++) {
    for (let i = 0; i <= nx; i++) {
      const h = (ii: number, jj: number) => ys[Math.min(Math.max(jj, 0), nz) * (nx + 1) + Math.min(Math.max(ii, 0), nx)];
      const n = norm([h(i - 1, j) - h(i + 1, j), 2 * dx, (h(i, j - 1) - h(i, j + 1)) * (dx / dz)]);
      const k = j * (nx + 1) + i;
      g.nrm[k * 3] = n[0];
      g.nrm[k * 3 + 1] = n[1];
      g.nrm[k * 3 + 2] = n[2];
    }
  }
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i;
      g.quad(a, a + nx + 1, a + nx + 2, a + 1);
    }
  }
  return g;
}

// A vine leaf: five rounded lobes, slightly cupped, lying in the XY plane facing +Z, stem at origin.
export function vineLeaf(c: V3 = [1, 1, 1]) {
  const g = new Geo();
  const R = 32;
  const ctr = g.vert([0, 0.45, 0.04], [0, 0, 1], c, 0);
  const outline: V3[] = [];
  for (let i = 0; i <= R; i++) {
    const a = -Math.PI / 2 + (i / R) * Math.PI * 2; // start at the stem (bottom)
    const rel = (a + Math.PI / 2) / (Math.PI * 2); // 0..1 around
    // 5 lobes + a notch at the stem
    const lobes = 0.78 + 0.22 * Math.cos(rel * Math.PI * 2 * 5);
    const notch = 1 - 0.55 * Math.exp(-Math.pow((rel - 0) * 9, 2)) - 0.55 * Math.exp(-Math.pow((rel - 1) * 9, 2));
    const r = 0.5 * lobes * notch;
    const x = Math.cos(a) * r;
    const y = 0.45 + Math.sin(a) * r;
    outline.push([x, y, -0.12 * (x * x + (y - 0.45) * (y - 0.45)) * 3]);
  }
  for (const p of outline) g.vert(p, norm([-p[0] * 0.5, -(p[1] - 0.45) * 0.5, 1]), c, 1);
  for (let i = 0; i < R; i++) g.tri(ctr, ctr + 1 + i, ctr + 2 + i);
  return g;
}

// Grape bunch: berries arranged on a downward cone. Returns berry centres (local) for instancing.
export function bunchBerries(seed: number, count = 70, length = 0.16, width = 0.06, berry = 0.0085) {
  const r = rng(seed);
  const out: { p: V3; s: number }[] = [];
  let tries = 0;
  while (out.length < count && tries < count * 60) {
    tries++;
    const t = Math.pow(r(), 0.8); // 0 top .. 1 bottom
    const radius = width * (1 - t * 0.85) * (0.6 + 0.4 * Math.sqrt(r()));
    const a = r() * Math.PI * 2;
    const shoulder = t < 0.25 ? 1.25 : 1;
    const p: V3 = [Math.cos(a) * radius * shoulder, -t * length, Math.sin(a) * radius * shoulder];
    const s = berry * (0.85 + r() * 0.3);
    let ok = true;
    for (const q of out) {
      if (len(sub(q.p, p)) < (q.s + s) * 0.92) {
        ok = false;
        break;
      }
    }
    if (ok) out.push({ p, s });
  }
  return out;
}
