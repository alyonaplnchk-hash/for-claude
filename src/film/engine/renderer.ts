// The renderer: a deferred-free forward pipeline written directly against WebGL2.
// Passes per shot: sun shadow map -> sky -> opaque (MSAA, HDR) -> refractive glass -> particles
// -> resolve -> depth of field -> bloom -> tone-map/grade. Two shots can be rendered and mixed
// by a transition shader for camera moves between locations.
import { Geo } from "./geometry";
import { M4, V3, m4, norm, cross, sub, add, scale } from "./math";
import * as S from "./shaders";

export type Mesh = { vbo: WebGLBuffer; ibo: WebGLBuffer; count: number; vaos: Map<InstBuf, WebGLVertexArrayObject> };
export type InstBuf = { buf: WebGLBuffer; count: number };

export type Mat = {
  base?: V3;
  rough?: number;
  metal?: number;
  spec?: number;
  emit?: V3;
  sss?: number;
  sheen?: number;
  pattern?: number;
  p1?: number[];
  p2?: number[];
  p3?: number[];
  c1?: V3;
  c2?: V3;
  c3?: V3;
  c4?: V3;
  double?: boolean;
  wind?: number;
  tex?: WebGLTexture;
  glass?: { tint: V3; refr: number; absorb?: number; refl?: number };
  noShadow?: boolean;
};

export type Draw = {
  mesh: Mesh;
  mat: Mat;
  inst?: InstBuf;
  xf?: M4 | M4[];
  cols?: number[][]; // per instance rgba (a = per-instance random)
  model?: M4;
  deform?: number[];
};

export type Particles = { pos: number[]; size: number[]; col: number[][]; shape?: number; blend?: "add" | "alpha" };

export type Camera = { pos: V3; target: V3; fov: number; roll?: number; near?: number; far?: number };

export type Light = { pos: V3; col: V3; intensity: number; radius: number };

export type Env = {
  skyTop: V3;
  skyHor: V3;
  skyBot: V3;
  glowDir?: V3;
  glowCol?: V3;
  glowPow?: number;
  glow2Dir?: V3;
  glow2Col?: V3;
  glow2Pow?: number;
  sunDir: V3;
  sunCol: V3;
  sunDisk?: number;
  ambSky: V3;
  ambGnd: V3;
  envAmt?: number;
  fog?: number[]; // density, height falloff, base height, max
  fogCol?: V3;
  lights?: Light[];
  shadow?: { center: V3; radius: number; bias?: number; soft?: number };
  skyNoise?: number;
};

export type Post = {
  exposure?: number;
  bloom?: number;
  bloomThreshold?: number;
  bloomRadius?: number;
  contrast?: number;
  sat?: number;
  lift?: V3;
  gain?: V3;
  tintShadow?: V3;
  tintHigh?: V3;
  vignette?: number;
  grain?: number;
  ca?: number;
  dof?: { focus: number; aperture: number; maxCoc?: number };
  fade?: number;
  fadeCol?: V3;
};

export type ShotFrame = {
  camera: Camera;
  env: Env;
  post?: Post;
  draws: Draw[];
  glass?: Draw[];
  particles?: Particles[];
};

export type Transition = { type: number; p: number; col?: V3; dir?: [number, number] };

const STRIDE = 20; // floats per instance: mat4 + rgba

type Prog = { p: WebGLProgram; u: Map<string, { loc: WebGLUniformLocation; type: number; size: number }> };

export class Engine {
  gl: WebGL2RenderingContext;
  W: number;
  H: number;
  rw: number;
  rh: number;
  samples: number;
  private progs: Record<string, Prog> = {};
  private dyn: InstBuf;
  private quadMesh: Mesh;
  private fb: Record<string, WebGLFramebuffer> = {};
  private tex: Record<string, WebGLTexture> = {};
  private bloomTex: WebGLTexture[] = [];
  private bloomFB: WebGLFramebuffer[] = [];
  private bloomSize: [number, number][] = [];
  private emptyVAO: WebGLVertexArrayObject;
  private dummyTex!: WebGLTexture;
  private shadowSize = 2048;
  time = 0;
  profile: Record<string, number> | null = null;
  private px = new Uint8Array(4);
  private mark(name: string) {
    if (!this.profile) return;
    const gl = this.gl;
    const prev = gl.getParameter(gl.READ_FRAMEBUFFER_BINDING);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.fb.ldrB);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, this.px);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, prev);
    const now = performance.now();
    this.profile[name] = (this.profile[name] ?? 0) + now - (this.profile._last ?? now);
    this.profile._last = now;
  }

  constructor(canvas: HTMLCanvasElement, renderScale = 1, samples = 4) {
    const gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });
    if (!gl) throw new Error("WebGL2 unavailable");
    this.gl = gl;
    gl.getExtension("EXT_color_buffer_float");
    gl.getExtension("OES_texture_float_linear");
    this.W = canvas.width;
    this.H = canvas.height;
    this.rw = Math.round(this.W * renderScale);
    this.rh = Math.round(this.H * renderScale);
    this.samples = Math.min(samples, gl.getParameter(gl.MAX_SAMPLES));
    this.progs.depth = this.prog(S.STD_VS, S.DEPTH_FS);
    this.progs.part = this.prog(S.PART_VS, S.PART_FS);
    this.progs.down = this.prog(S.FS_VS, S.DOWN_FS);
    this.progs.up = this.prog(S.FS_VS, S.UP_FS);
    this.progs.dof = this.prog(S.FS_VS, S.DOF_FS);
    this.progs.comp = this.prog(S.FS_VS, S.COMP_FS);
    this.progs.trans = this.prog(S.FS_VS, S.TRANS_FS);
    this.emptyVAO = gl.createVertexArray()!;
    this.dyn = { buf: gl.createBuffer()!, count: 0 };
    const q = new Geo();
    const a = q.vert([-1, -1, 0], [0, 0, 1]);
    q.vert([1, -1, 0], [0, 0, 1]);
    q.vert([1, 1, 0], [0, 0, 1]);
    q.vert([-1, 1, 0], [0, 0, 1]);
    q.quad(a, a + 1, a + 2, a + 3);
    this.quadMesh = this.mesh(q);
    this.setupTargets();
    const c = document.createElement("canvas");
    c.width = c.height = 4;
    const cx = c.getContext("2d")!;
    cx.fillStyle = "#fff";
    cx.fillRect(0, 0, 4, 4);
    this.dummyTex = this.texture(c);
  }

  private prog(vs: string, fs: string): Prog {
    const gl = this.gl;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(s);
        const lines = src.split("\n").map((l, i) => `${i + 1}: ${l}`).join("\n");
        throw new Error("Shader compile error: " + log + "\n" + lines.slice(0, 20000));
      }
      return s;
    };
    const p = gl.createProgram()!;
    gl.attachShader(p, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error("Link error: " + gl.getProgramInfoLog(p));
    const u = new Map();
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(p, i)!;
      const name = info.name.replace(/\[0\]$/, "");
      u.set(name, { loc: gl.getUniformLocation(p, info.name)!, type: info.type, size: info.size });
    }
    return { p, u };
  }

  // Shader variants are compiled on demand: the software GPU pays for every branch, so each
  // material gets a program with only the code it needs (and no discard unless it reveals).
  private variant(kind: "std" | "glass" | "sky", key: Record<string, number>) {
    const id = kind + JSON.stringify(key);
    let p = this.progs[id];
    if (!p) {
      const defs = Object.entries(key).map(([k, v]) => `#define ${k} ${v}`).join("\n");
      if (kind === "std") p = this.prog(S.STD_VS, S.STD_FS(defs));
      else if (kind === "glass") p = this.prog(S.STD_VS, S.GLASS_FS(defs));
      else p = this.prog(S.SKY_VS, S.SKY_FS(defs));
      this.progs[id] = p;
    }
    return p;
  }
  private stdVariant(m: Mat, nl: number, shadow: boolean) {
    return this.variant("std", {
      PATTERN: m.pattern ?? 0,
      REVEAL: m.p3 && m.p3[3] > 0.5 ? 1 : 0,
      NLIGHTS: nl,
      SHADOW: shadow ? 1 : 0,
      SHEEN: (m.sheen ?? 0) > 0 ? 1 : 0,
      SSS: (m.sss ?? 0) > 0 ? 1 : 0,
    });
  }

  private texUnit = 0;
  private set(pr: Prog, name: string, v: any) {
    const e = pr.u.get(name);
    if (!e) return;
    const gl = this.gl;
    switch (e.type) {
      case gl.FLOAT:
        e.size > 1 ? gl.uniform1fv(e.loc, v) : gl.uniform1f(e.loc, v);
        break;
      case gl.FLOAT_VEC2:
        gl.uniform2fv(e.loc, v);
        break;
      case gl.FLOAT_VEC3:
        gl.uniform3fv(e.loc, v);
        break;
      case gl.FLOAT_VEC4:
        gl.uniform4fv(e.loc, v);
        break;
      case gl.INT:
      case gl.BOOL:
        gl.uniform1i(e.loc, v);
        break;
      case gl.FLOAT_MAT4:
        gl.uniformMatrix4fv(e.loc, false, v);
        break;
      case gl.SAMPLER_2D:
      case gl.SAMPLER_2D_SHADOW:
        gl.activeTexture(gl.TEXTURE0 + this.texUnit);
        gl.bindTexture(gl.TEXTURE_2D, v);
        gl.uniform1i(e.loc, this.texUnit);
        this.texUnit++;
        break;
    }
  }

  mesh(g: Geo): Mesh {
    const gl = this.gl;
    const n = g.count;
    const data = new Float32Array(n * 10);
    for (let i = 0; i < n; i++) {
      data.set([g.pos[i * 3], g.pos[i * 3 + 1], g.pos[i * 3 + 2], g.nrm[i * 3], g.nrm[i * 3 + 1], g.nrm[i * 3 + 2], g.col[i * 3], g.col[i * 3 + 1], g.col[i * 3 + 2], g.aux[i]], i * 10);
    }
    const vbo = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    const ibo = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(g.idx), gl.STATIC_DRAW);
    return { vbo, ibo, count: g.idx.length, vaos: new Map() };
  }

  // Re-upload geometry into an existing mesh (for shapes that grow every frame).
  updateMesh(m: Mesh, g: Geo) {
    const gl = this.gl;
    const n = g.count;
    const data = new Float32Array(n * 10);
    for (let i = 0; i < n; i++) {
      data.set([g.pos[i * 3], g.pos[i * 3 + 1], g.pos[i * 3 + 2], g.nrm[i * 3], g.nrm[i * 3 + 1], g.nrm[i * 3 + 2], g.col[i * 3], g.col[i * 3 + 1], g.col[i * 3 + 2], g.aux[i]], i * 10);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, m.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(g.idx), gl.DYNAMIC_DRAW);
    m.count = g.idx.length;
    return m;
  }

  instances(mats: M4[], cols?: number[][]): InstBuf {
    const gl = this.gl;
    const buf = gl.createBuffer()!;
    const data = this.packInst(mats, cols);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return { buf, count: mats.length };
  }

  private packInst(mats: M4[], cols?: number[][]) {
    const data = new Float32Array(mats.length * STRIDE);
    for (let i = 0; i < mats.length; i++) {
      data.set(mats[i], i * STRIDE);
      const c = cols?.[i] ?? cols?.[0] ?? [1, 1, 1, 0.5];
      data.set([c[0], c[1], c[2], c[3] ?? 0.5], i * STRIDE + 16);
    }
    return data;
  }

  // Raw instance data for particles / dynamic sets: pos+size in m0, rgba in col
  private packParticles(p: Particles) {
    const n = p.size.length;
    const data = new Float32Array(n * STRIDE);
    for (let i = 0; i < n; i++) {
      data.set([p.pos[i * 3], p.pos[i * 3 + 1], p.pos[i * 3 + 2], p.size[i]], i * STRIDE);
      const c = p.col[i] ?? p.col[0];
      data.set(c, i * STRIDE + 16);
    }
    return data;
  }

  private vao(mesh: Mesh, ib: InstBuf) {
    let v = mesh.vaos.get(ib);
    if (v) return v;
    const gl = this.gl;
    v = gl.createVertexArray()!;
    gl.bindVertexArray(v);
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vbo);
    const st = 40;
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, st, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, st, 12);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, st, 24);
    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 1, gl.FLOAT, false, st, 36);
    gl.bindBuffer(gl.ARRAY_BUFFER, ib.buf);
    for (let k = 0; k < 5; k++) {
      gl.enableVertexAttribArray(4 + k);
      gl.vertexAttribPointer(4 + k, 4, gl.FLOAT, false, STRIDE * 4, k * 16);
      gl.vertexAttribDivisor(4 + k, 1);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.ibo);
    gl.bindVertexArray(null);
    mesh.vaos.set(ib, v);
    return v;
  }

  texture(src: HTMLCanvasElement | ImageBitmap): WebGLTexture {
    const gl = this.gl;
    const t = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.SRGB8_ALPHA8, gl.RGBA, gl.UNSIGNED_BYTE, src as any);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }

  private mkTex(w: number, h: number, internal: number, format: number, type: number, filter: number) {
    const gl = this.gl;
    const t = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texStorage2D(gl.TEXTURE_2D, 1, internal, w, h);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    void format;
    void type;
    return t;
  }

  private fbFor(tex: WebGLTexture, depth?: WebGLTexture) {
    const gl = this.gl;
    const f = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    if (depth) gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depth, 0);
    return f;
  }

  private setupTargets() {
    const gl = this.gl;
    const { rw, rh } = this;
    // MSAA HDR target
    const msFB = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, msFB);
    const cRB = gl.createRenderbuffer()!;
    gl.bindRenderbuffer(gl.RENDERBUFFER, cRB);
    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, this.samples, gl.RGBA16F, rw, rh);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, cRB);
    const dRB = gl.createRenderbuffer()!;
    gl.bindRenderbuffer(gl.RENDERBUFFER, dRB);
    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, this.samples, gl.DEPTH_COMPONENT24, rw, rh);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, dRB);
    this.fb.ms = msFB;
    // resolved scene
    this.tex.scene = this.mkTex(rw, rh, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, gl.LINEAR);
    this.fb.scene = this.fbFor(this.tex.scene);
    // DOF (half res)
    const hw = Math.ceil(rw / 2), hh = Math.ceil(rh / 2);
    this.tex.dof = this.mkTex(hw, hh, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, gl.LINEAR);
    this.fb.dof = this.fbFor(this.tex.dof);
    // bloom chain
    let w = rw, h = rh;
    for (let i = 0; i < 6; i++) {
      w = Math.max(1, Math.ceil(w / 2));
      h = Math.max(1, Math.ceil(h / 2));
      const t = this.mkTex(w, h, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, gl.LINEAR);
      this.bloomTex.push(t);
      this.bloomFB.push(this.fbFor(t));
      this.bloomSize.push([w, h]);
    }
    // LDR targets for transitions
    for (const k of ["ldrA", "ldrB"]) {
      this.tex[k] = this.mkTex(this.W, this.H, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, gl.LINEAR);
      this.fb[k] = this.fbFor(this.tex[k]);
    }
    // shadow map
    const sd = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, sd);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT32F, this.shadowSize, this.shadowSize);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.tex.shadow = sd;
    const sf = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, sf);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, sd, 0);
    gl.drawBuffers([gl.NONE]);
    gl.readBuffer(gl.NONE);
    this.fb.shadow = sf;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  static view(cam: Camera) {
    const fwd = norm(sub(cam.target, cam.pos));
    let up: V3 = [0, 1, 0];
    if (cam.roll) {
      const right = norm(cross(fwd, [0, 1, 0]));
      const u0 = cross(right, fwd);
      up = add(scale(u0, Math.cos(cam.roll)), scale(right, Math.sin(cam.roll)));
    }
    return m4.lookAt(cam.pos, cam.target, up);
  }

  static viewProj(cam: Camera, aspect: number) {
    const v = Engine.view(cam);
    const p = m4.perspective(cam.fov, aspect, cam.near ?? 0.05, cam.far ?? 2000);
    return { v, p, vp: m4.mul(p, v) };
  }

  // Project a world point to output pixels (for infographic anchors).
  static project(cam: Camera, pt: V3, W: number, H: number) {
    const { vp } = Engine.viewProj(cam, W / H);
    const x = vp[0] * pt[0] + vp[4] * pt[1] + vp[8] * pt[2] + vp[12];
    const y = vp[1] * pt[0] + vp[5] * pt[1] + vp[9] * pt[2] + vp[13];
    const w = vp[3] * pt[0] + vp[7] * pt[1] + vp[11] * pt[2] + vp[15];
    return { x: ((x / w) * 0.5 + 0.5) * W, y: (1 - ((y / w) * 0.5 + 0.5)) * H, visible: w > 0 };
  }

  private bindDraw(pr: Prog, d: Draw) {
    const gl = this.gl;
    let ib: InstBuf;
    if (d.inst) ib = d.inst;
    else {
      const mats = d.xf ? (Array.isArray(d.xf) ? d.xf : [d.xf]) : [m4.ident()];
      gl.bindBuffer(gl.ARRAY_BUFFER, this.dyn.buf);
      gl.bufferData(gl.ARRAY_BUFFER, this.packInst(mats, d.cols), gl.STREAM_DRAW);
      this.dyn.count = mats.length;
      ib = this.dyn;
    }
    this.set(pr, "u_model", d.model ?? m4.ident());
    this.set(pr, "u_deform", d.deform ?? [0, 0, 0, 0]);
    this.set(pr, "u_wind", d.mat.wind ?? 0);
    gl.bindVertexArray(this.vao(d.mesh, ib));
    gl.drawElementsInstanced(gl.TRIANGLES, d.mesh.count, gl.UNSIGNED_INT, 0, ib.count);
  }

  private envUniforms(pr: Prog, env: Env) {
    this.set(pr, "u_skyTop", env.skyTop);
    this.set(pr, "u_skyHor", env.skyHor);
    this.set(pr, "u_skyBot", env.skyBot);
    this.set(pr, "u_glowDir", norm(env.glowDir ?? [0, 1, 0]));
    this.set(pr, "u_glowCol", env.glowCol ?? [0, 0, 0]);
    this.set(pr, "u_glowPow", env.glowPow ?? 4);
    this.set(pr, "u_glow2Dir", norm(env.glow2Dir ?? [0, 1, 0]));
    this.set(pr, "u_glow2Col", env.glow2Col ?? [0, 0, 0]);
    this.set(pr, "u_glow2Pow", env.glow2Pow ?? 4);
    this.set(pr, "u_sunDir", norm(env.sunDir));
    this.set(pr, "u_sunCol", env.sunCol);
    this.set(pr, "u_sunDisk", env.sunDisk ?? 0);
    this.set(pr, "u_time", this.time);
    this.set(pr, "u_fog", env.fog ?? [0, 0, 0, 0]);
    this.set(pr, "u_fogCol", env.fogCol ?? env.skyHor);
    const L = env.lights ?? [];
    const pp = new Float32Array(16), pc = new Float32Array(16);
    L.slice(0, 4).forEach((l, i) => {
      pp.set([l.pos[0], l.pos[1], l.pos[2], l.radius], i * 4);
      pc.set([l.col[0], l.col[1], l.col[2], l.intensity], i * 4);
    });
    this.set(pr, "u_plPos", pp);
    this.set(pr, "u_plCol", pc);
    this.set(pr, "u_plCount", Math.min(L.length, 4));
  }

  private matUniforms(pr: Prog, m: Mat) {
    this.set(pr, "u_base", m.base ?? [0.8, 0.8, 0.8]);
    this.set(pr, "u_rough", m.rough ?? 0.6);
    this.set(pr, "u_metal", m.metal ?? 0);
    this.set(pr, "u_spec", m.spec ?? 1);
    this.set(pr, "u_emit", m.emit ?? [0, 0, 0]);
    this.set(pr, "u_sss", m.sss ?? 0);
    this.set(pr, "u_sheen", m.sheen ?? 0);
    this.set(pr, "u_pattern", m.pattern ?? 0);
    this.set(pr, "u_p1", m.p1 ?? [0, 0, 0, 0]);
    this.set(pr, "u_p2", m.p2 ?? [0, 0, 0, 0]);
    this.set(pr, "u_p3", m.p3 ?? [0, 0, 0, 0]);
    this.set(pr, "u_c1", m.c1 ?? [1, 1, 1]);
    this.set(pr, "u_c2", m.c2 ?? [1, 1, 1]);
    this.set(pr, "u_c3", m.c3 ?? [1, 1, 1]);
    this.set(pr, "u_c4", m.c4 ?? [1, 1, 1]);
    this.set(pr, "u_double", m.double ? 1 : 0);
  }

  private fullscreen() {
    const gl = this.gl;
    gl.bindVertexArray(this.emptyVAO);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  // Render one shot to `target` (null = canvas).
  renderShot(f: ShotFrame, target: WebGLFramebuffer | null) {
    const gl = this.gl;
    const { rw, rh } = this;
    const env = f.env;
    const post = f.post ?? {};
    const cam = f.camera;
    const { v, vp } = Engine.viewProj(cam, this.W / this.H);
    gl.disable(gl.CULL_FACE);
    if (this.profile) this.profile._last = performance.now();

    // --- shadow pass
    let shadowVP = m4.ident();
    const sh = env.shadow;
    if (sh) {
      const r = sh.radius;
      const sd = norm(env.sunDir);
      const eye = add(sh.center, scale(sd, r * 2));
      const lv = m4.lookAt(eye, sh.center, Math.abs(sd[1]) > 0.98 ? [0, 0, 1] : [0, 1, 0]);
      const lp = m4.ortho(-r, r, -r, r, 0.01, r * 4);
      shadowVP = m4.mul(lp, lv);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb.shadow);
      gl.viewport(0, 0, this.shadowSize, this.shadowSize);
      gl.enable(gl.DEPTH_TEST);
      gl.depthMask(true);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.POLYGON_OFFSET_FILL);
      gl.polygonOffset(2, 4);
      const pr = this.progs.depth;
      gl.useProgram(pr.p);
      this.texUnit = 0;
      this.set(pr, "u_vp", shadowVP);
      this.set(pr, "u_time", this.time);
      for (const d of f.draws) if (!d.mat.noShadow) this.bindDraw(pr, d);
      gl.disable(gl.POLYGON_OFFSET_FILL);
      this.mark("shadow");
    }

    // --- main HDR pass
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb.ms);
    gl.viewport(0, 0, rw, rh);
    gl.clearColor(0, 0, 0, 60000);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.depthMask(true);
    {
      const nl = Math.min(env.lights?.length ?? 0, 4);
      let cur: Prog | null = null;
      let baseUnit = 0;
      for (const d of f.draws) {
        const pr = this.stdVariant(d.mat, nl, !!sh);
        if (pr !== cur) {
          cur = pr;
          gl.useProgram(pr.p);
          this.texUnit = 0;
          this.set(pr, "u_shadow", this.tex.shadow);
          this.envUniforms(pr, env);
          this.set(pr, "u_vp", vp);
          this.set(pr, "u_camPos", cam.pos);
          this.set(pr, "u_ambSky", env.ambSky);
          this.set(pr, "u_ambGnd", env.ambGnd);
          this.set(pr, "u_envAmt", env.envAmt ?? 1);
          this.set(pr, "u_shadowVP", shadowVP);
          this.set(pr, "u_shadowOn", sh ? 1 : 0);
          this.set(pr, "u_shadowBias", sh?.bias ?? 0.02);
          this.set(pr, "u_shadowSoft", sh?.soft ?? 1.5);
          baseUnit = this.texUnit;
        }
        this.texUnit = baseUnit;
        this.matUniforms(pr, d.mat);
        this.set(pr, "u_tex", d.mat.tex ?? this.dummyTex);
        this.bindDraw(pr, d);
      }
      this.mark("opaque");
    }
    // sky last among opaques: depth-tested at the far plane so only uncovered pixels pay for it
    gl.depthMask(false);
    {
      const pr = this.variant("sky", { SKYNOISE: (env.skyNoise ?? 0) > 0 ? 1 : 0 });
      gl.useProgram(pr.p);
      this.texUnit = 0;
      this.envUniforms(pr, env);
      this.set(pr, "u_invVP", m4.invert(vp));
      this.set(pr, "u_camPos", cam.pos);
      this.set(pr, "u_skyNoise", env.skyNoise ?? 0);
      this.fullscreen();
      this.mark("sky");
    }
    gl.depthMask(true);
    // --- glass (screen-space refraction of what is behind)
    if (f.glass && f.glass.length) {
      this.resolve();
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb.ms);
      gl.viewport(0, 0, rw, rh);
      const pr = this.variant("glass", { NLIGHTS: Math.min(env.lights?.length ?? 0, 4) });
      gl.useProgram(pr.p);
      this.texUnit = 0;
      this.set(pr, "u_scene", this.tex.scene);
      this.envUniforms(pr, env);
      this.set(pr, "u_vp", vp);
      this.set(pr, "u_view", v);
      this.set(pr, "u_camPos", cam.pos);
      this.set(pr, "u_invRes", [1 / rw, 1 / rh]);
      for (const d of f.glass) {
        const g = d.mat.glass ?? { tint: [1, 1, 1], refr: 0.05 };
        this.set(pr, "u_tint", g.tint);
        this.set(pr, "u_refr", g.refr);
        this.set(pr, "u_absorb", g.absorb ?? 0.3);
        this.set(pr, "u_reflAmt", g.refl ?? 1);
        this.bindDraw(pr, d);
      }
      this.mark("glass");
    }
    // --- particles
    if (f.particles && f.particles.length) {
      const pr = this.progs.part;
      gl.useProgram(pr.p);
      this.texUnit = 0;
      this.set(pr, "u_vp", vp);
      const right: V3 = [v[0], v[4], v[8]];
      const up: V3 = [v[1], v[5], v[9]];
      this.set(pr, "u_camRight", right);
      this.set(pr, "u_camUp", up);
      gl.depthMask(false);
      gl.enable(gl.BLEND);
      for (const p of f.particles) {
        if (!p.size.length) continue;
        if (p.blend === "alpha") gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
        else gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE);
        this.set(pr, "u_shape", p.shape ?? 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.dyn.buf);
        gl.bufferData(gl.ARRAY_BUFFER, this.packParticles(p), gl.STREAM_DRAW);
        this.dyn.count = p.size.length;
        gl.bindVertexArray(this.vao(this.quadMesh, this.dyn));
        gl.drawElementsInstanced(gl.TRIANGLES, this.quadMesh.count, gl.UNSIGNED_INT, 0, p.size.length);
      }
      gl.disable(gl.BLEND);
      gl.depthMask(true);
      this.mark("particles");
    }
    this.resolve();
    this.mark("resolve");
    gl.disable(gl.DEPTH_TEST);

    // --- depth of field (half res)
    const dof = post.dof;
    if (dof) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb.dof);
      gl.viewport(0, 0, Math.ceil(rw / 2), Math.ceil(rh / 2));
      const pr = this.progs.dof;
      gl.useProgram(pr.p);
      this.texUnit = 0;
      this.set(pr, "u_src", this.tex.scene);
      this.set(pr, "u_texel", [1 / rw, 1 / rh]);
      this.set(pr, "u_focus", dof.focus);
      this.set(pr, "u_aperture", dof.aperture);
      this.set(pr, "u_maxCoc", dof.maxCoc ?? 22);
      this.fullscreen();
      this.mark("dof");
    }

    // --- bloom
    {
      const down = this.progs.down;
      gl.useProgram(down.p);
      let src = this.tex.scene;
      let sw = rw, shh = rh;
      for (let i = 0; i < this.bloomTex.length; i++) {
        const [w, h] = this.bloomSize[i];
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomFB[i]);
        gl.viewport(0, 0, w, h);
        this.texUnit = 0;
        this.set(down, "u_src", src);
        this.set(down, "u_texel", [1 / sw, 1 / shh]);
        this.set(down, "u_prefilter", i === 0 ? 1 : 0);
        this.set(down, "u_threshold", post.bloomThreshold ?? 1.0);
        this.fullscreen();
        src = this.bloomTex[i];
        sw = w;
        shh = h;
      }
      const up = this.progs.up;
      gl.useProgram(up.p);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      for (let i = this.bloomTex.length - 1; i > 0; i--) {
        const [w, h] = this.bloomSize[i - 1];
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomFB[i - 1]);
        gl.viewport(0, 0, w, h);
        this.texUnit = 0;
        this.set(up, "u_src", this.bloomTex[i]);
        const [sw2, sh2] = this.bloomSize[i];
        this.set(up, "u_texel", [1 / sw2, 1 / sh2]);
        this.set(up, "u_radius", post.bloomRadius ?? 1);
        this.fullscreen();
      }
      gl.disable(gl.BLEND);
      this.mark("bloom");
    }

    // --- composite
    gl.bindFramebuffer(gl.FRAMEBUFFER, target);
    gl.viewport(0, 0, this.W, this.H);
    const pr = this.progs.comp;
    gl.useProgram(pr.p);
    this.texUnit = 0;
    this.set(pr, "u_scene", this.tex.scene);
    this.set(pr, "u_bloom", this.bloomTex[0]);
    this.set(pr, "u_dof", this.tex.dof);
    this.set(pr, "u_dofOn", dof ? 1 : 0);
    this.set(pr, "u_focus", dof?.focus ?? 1);
    this.set(pr, "u_aperture", dof?.aperture ?? 0);
    this.set(pr, "u_maxCoc", (dof?.maxCoc ?? 22) * 2);
    this.set(pr, "u_exposure", post.exposure ?? 1);
    this.set(pr, "u_bloomAmt", post.bloom ?? 0.6);
    this.set(pr, "u_contrast", post.contrast ?? 1.05);
    this.set(pr, "u_sat", post.sat ?? 1.05);
    this.set(pr, "u_lift", post.lift ?? [0, 0, 0]);
    this.set(pr, "u_gain", post.gain ?? [1, 1, 1]);
    this.set(pr, "u_tintShadow", post.tintShadow ?? [0, 0, 0]);
    this.set(pr, "u_tintHigh", post.tintHigh ?? [0, 0, 0]);
    this.set(pr, "u_vignette", post.vignette ?? 0.45);
    this.set(pr, "u_grain", post.grain ?? 0.035);
    this.set(pr, "u_ca", post.ca ?? 0.012);
    this.set(pr, "u_time", this.time);
    this.set(pr, "u_fade", post.fade ?? 0);
    this.set(pr, "u_fadeCol", post.fadeCol ?? [0, 0, 0]);
    this.set(pr, "u_res", [this.W, this.H]);
    this.fullscreen();
    this.mark("composite");
  }

  private resolve() {
    const gl = this.gl;
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.fb.ms);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.fb.scene);
    gl.blitFramebuffer(0, 0, this.rw, this.rh, 0, 0, this.rw, this.rh, gl.COLOR_BUFFER_BIT, gl.NEAREST);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
  }

  render(a: ShotFrame, b?: ShotFrame, tr?: Transition) {
    const gl = this.gl;
    if (!b || !tr) {
      this.renderShot(a, null);
    } else {
      this.renderShot(a, this.fb.ldrA);
      this.renderShot(b, this.fb.ldrB);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, this.W, this.H);
      const pr = this.progs.trans;
      gl.useProgram(pr.p);
      this.texUnit = 0;
      this.set(pr, "u_a", this.tex.ldrA);
      this.set(pr, "u_b", this.tex.ldrB);
      this.set(pr, "u_p", tr.p);
      this.set(pr, "u_type", tr.type);
      this.set(pr, "u_col", tr.col ?? [1, 1, 1]);
      this.set(pr, "u_dir", tr.dir ?? [1, 0]);
      this.fullscreen();
    }
    gl.finish();
  }
}
