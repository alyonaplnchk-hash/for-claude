// GLSL ES 3.00 sources for the engine.

const COMMON = /* glsl */ `
precision highp float;
uniform vec3 u_skyTop, u_skyHor, u_skyBot;
uniform vec3 u_glowDir, u_glowCol; uniform float u_glowPow;
uniform vec3 u_glow2Dir, u_glow2Col; uniform float u_glow2Pow;
uniform vec3 u_sunDir, u_sunCol; uniform float u_sunDisk;
uniform float u_time;

vec3 skyColor(vec3 d) {
  float y = d.y;
  vec3 c = y > 0.0 ? mix(u_skyHor, u_skyTop, pow(clamp(y, 0.0, 1.0), 0.55))
                   : mix(u_skyHor, u_skyBot, pow(clamp(-y, 0.0, 1.0), 0.45));
  c += u_glowCol * pow(max(dot(d, u_glowDir), 0.0), u_glowPow);
  c += u_glow2Col * pow(max(dot(d, u_glow2Dir), 0.0), u_glow2Pow);
  float s = max(dot(d, u_sunDir), 0.0);
  c += u_sunCol * u_sunDisk * (pow(s, 3000.0) * 60.0 + pow(s, 120.0) * 0.6 + pow(s, 12.0) * 0.08);
  return c;
}

float hash13(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 hash22(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float vnoise(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash13(i), hash13(i + vec3(1,0,0)), f.x), mix(hash13(i + vec3(0,1,0)), hash13(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash13(i + vec3(0,0,1)), hash13(i + vec3(1,0,1)), f.x), mix(hash13(i + vec3(0,1,1)), hash13(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 3; i++) { s += a * vnoise(p); p *= 2.03; a *= 0.5; } return s * 1.15; }
// Voronoi: returns F1 distance, writes cell id
float voronoi(vec2 x, out vec2 cid) {
  vec2 n = floor(x); vec2 f = fract(x); float md = 8.0; cid = n;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j)); vec2 o = hash22(n + g);
    vec2 r = g + o - f; float d = dot(r, r);
    if (d < md) { md = d; cid = n + g; }
  }
  return sqrt(md);
}
`;

export const STD_VS = /* glsl */ `#version 300 es
layout(location=0) in vec3 a_pos;
layout(location=1) in vec3 a_nrm;
layout(location=2) in vec3 a_col;
layout(location=3) in float a_aux;
layout(location=4) in vec4 i_m0;
layout(location=5) in vec4 i_m1;
layout(location=6) in vec4 i_m2;
layout(location=7) in vec4 i_m3;
layout(location=8) in vec4 i_col;
uniform mat4 u_vp, u_model;
uniform float u_time, u_wind;
uniform vec4 u_deform;
out vec3 v_wpos; out vec3 v_nrm; out vec3 v_col; out vec3 v_opos; out float v_aux; out vec4 v_icol;
void main() {
  mat4 m = u_model * mat4(i_m0, i_m1, i_m2, i_m3);
  vec3 p = a_pos; vec3 n = a_nrm;
  if (u_deform.x != 0.0) {
    // volume-preserving squash along local Y, with a crease band (u_deform.z) for the hook grape
    float s = 1.0 - u_deform.x;
    float b = 1.0 / sqrt(s);
    float bulge = mix(1.0, b, 1.0 - u_deform.z * smoothstep(0.0, 1.0, abs(p.y) / max(u_deform.y, 1e-4)));
    p.y *= s; p.xz *= bulge;
    n = normalize(vec3(n.x / bulge, n.y / s, n.z / bulge));
  }
  vec4 wp = m * vec4(p, 1.0);
  if (u_wind > 0.0) {
    float ph = i_col.w * 6.2831 + dot(wp.xz, vec2(0.7, 0.5));
    float h = max(a_aux, 0.0);
    wp.xyz += u_wind * vec3(sin(u_time * 1.7 + ph), 0.35 * sin(u_time * 2.3 + ph * 1.3), cos(u_time * 1.3 + ph * 0.7)) * (0.25 + h);
  }
  v_wpos = wp.xyz;
  v_nrm = normalize(mat3(m) * n);
  v_col = a_col; v_opos = a_pos; v_aux = a_aux; v_icol = i_col;
  gl_Position = u_vp * wp;
}`;

export const DEPTH_FS = /* glsl */ `#version 300 es
precision mediump float;
out vec4 o;
void main() { o = vec4(1.0); }`;

export const STD_FS = (defs: string) => /* glsl */ `#version 300 es
${defs}
${COMMON}
precision highp sampler2DShadow;
in vec3 v_wpos; in vec3 v_nrm; in vec3 v_col; in vec3 v_opos; in float v_aux; in vec4 v_icol;
uniform vec3 u_camPos;
uniform vec3 u_base; uniform float u_rough, u_metal, u_spec; uniform vec3 u_emit; uniform float u_sss, u_sheen;
uniform int u_pattern; uniform vec4 u_p1, u_p2, u_p3; uniform vec3 u_c1, u_c2, u_c3, u_c4;
uniform int u_double;
uniform vec3 u_ambSky, u_ambGnd; uniform float u_envAmt;
uniform sampler2DShadow u_shadow; uniform mat4 u_shadowVP; uniform float u_shadowOn, u_shadowBias, u_shadowSoft;
uniform vec4 u_plPos[4]; uniform vec4 u_plCol[4]; uniform int u_plCount;
uniform vec4 u_fog; uniform vec3 u_fogCol;
uniform sampler2D u_tex;
out vec4 o;

const float PI = 3.14159265;
const vec2 POISSON[8] = vec2[8](vec2(-0.613,0.617), vec2(0.170,-0.040), vec2(-0.299,-0.791), vec2(0.645,0.493),
  vec2(-0.651,-0.244), vec2(0.421,-0.744), vec2(-0.094,0.919), vec2(0.937,-0.084));

float shadowAt(vec3 wp, vec3 N) {
  if (u_shadowOn < 0.5) return 1.0;
  vec4 sp = u_shadowVP * vec4(wp + N * u_shadowBias, 1.0);
  vec3 c = sp.xyz / sp.w * 0.5 + 0.5;
  if (c.x < 0.0 || c.x > 1.0 || c.y < 0.0 || c.y > 1.0 || c.z > 1.0) return 1.0;
  float s = 0.0;
  float rot = hash12(gl_FragCoord.xy) * 6.2831;
  mat2 R = mat2(cos(rot), sin(rot), -sin(rot), cos(rot));
  for (int i = 0; i < 8; i++) s += texture(u_shadow, vec3(c.xy + R * POISSON[i] * u_shadowSoft / 2048.0, c.z - 0.0005));
  return s / 8.0;
}
float D_GGX(float NdH, float a) { float a2 = a * a; float d = NdH * NdH * (a2 - 1.0) + 1.0; return a2 / (PI * d * d); }
float Vis(float NdL, float NdV, float a) { return 0.5 / max(NdL * (NdV * (1.0 - a) + a) + NdV * (NdL * (1.0 - a) + a), 1e-4); }

void pattern(inout vec3 base, inout vec3 N, inout float rough, inout vec3 emit, inout float sss, inout float metal) {
#if PATTERN == 1
  {
    // oak staves around local Y (barrels). p1: staves, height, stain band, toast
    float ang = atan(v_opos.z, v_opos.x);
    float sw = 6.2831 / u_p1.x;
    float st = floor((ang + 3.14159) / sw);
    float sf = fract((ang + 3.14159) / sw);
    float var = hash12(vec2(st, 7.0));
    float grain = fbm(vec3(ang * 40.0, v_opos.y * 3.0, st * 3.1)) ;
    float lines = smoothstep(0.35, 0.65, fract(grain * 9.0 + var * 3.0));
    base *= mix(0.78, 1.12, var) * mix(0.9, 1.05, lines);
    float gap = smoothstep(0.0, 0.03, sf) * smoothstep(1.0, 0.97, sf);
    base *= mix(0.35, 1.0, gap);
    // classic Bordeaux wine-stained band around the belly
    float band = smoothstep(u_p1.z + 0.02, u_p1.z - 0.02, abs(v_opos.y - u_p1.y * 0.5));
    base = mix(base, u_c1 * mix(0.8, 1.1, fbm(v_opos * 18.0)), band * u_p2.x);
    rough = mix(rough, rough * 0.8, band);
    // inside of the staves is toasted
    if (!gl_FrontFacing) base *= vec3(0.42, 0.27, 0.17) * (0.8 + 0.4 * vnoise(v_opos * 30.0));
  }
#elif PATTERN == 2
  {
    // limestone blocks. p1: rowH, blockW, mortar
    vec3 a = abs(N);
    vec2 uv = a.x > a.z ? v_wpos.zy : v_wpos.xy;
    float row = floor(uv.y / u_p1.x);
    float x = uv.x / u_p1.y + mod(row, 2.0) * 0.5;
    float col = floor(x);
    vec2 f = vec2(fract(x) * u_p1.y, fract(uv.y / u_p1.x) * u_p1.x);
    float m = smoothstep(0.0, u_p1.z, f.x) * smoothstep(u_p1.y, u_p1.y - u_p1.z, f.x) * smoothstep(0.0, u_p1.z, f.y) * smoothstep(u_p1.x, u_p1.x - u_p1.z, f.y);
    float v = hash12(vec2(col, row));
    float n = fbm(v_wpos * 3.0);
    base *= mix(0.55, 1.0, m) * mix(0.82, 1.08, v) * mix(0.85, 1.1, n);
    rough = mix(1.0, rough, m);
  }
#elif PATTERN == 3
  {
    // vineyard ground: gravel + grass strips between rows. p1: pebble scale, row spacing, grass width, gravel amount
    vec2 cid; float d = voronoi(v_wpos.xz * u_p1.x, cid);
    float h = hash12(cid);
    vec3 peb = mix(u_c1, u_c2, h) * mix(0.8, 1.05, hash12(cid + 3.1)) * (0.6 + 0.5 * smoothstep(0.42, 0.0, d));
    float pebMask = smoothstep(0.36, 0.26, d) * u_p1.w * step(0.5, hash12(cid + 7.7));
    float n = vnoise(v_wpos * 1.3) * 0.6 + vnoise(v_wpos * 5.0) * 0.4;
    vec3 soil = u_c4 * mix(0.8, 1.15, n);
    vec3 g = mix(soil, peb, pebMask);
    float rowx = abs(fract(v_wpos.x / u_p1.y + 0.5) - 0.5) * u_p1.y;
    float grass = smoothstep(u_p1.z * 0.5, u_p1.z * 0.5 - 0.15, abs(rowx - u_p1.y * 0.5) ) ;
    float gn = vnoise(v_wpos * 6.0) * 0.6 + vnoise(v_wpos * 17.0) * 0.4;
    g = mix(g, u_c3 * mix(0.6, 1.2, gn), grass * smoothstep(0.3, 0.6, gn + 0.25));
    base *= g;
    N = normalize(N + vec3(0.0, 0.0, 0.0) + (pebMask * 0.6) * vec3(hash12(cid) - 0.5, 0.0, hash12(cid + 1.7) - 0.5));
  }
#elif PATTERN == 4
  {
    // brushed stainless steel
    float s = fbm(vec3(v_wpos.x * 2.0, v_wpos.y * 160.0, v_wpos.z * 2.0));
    base *= mix(0.85, 1.1, s);
    rough = mix(rough * 0.7, rough * 1.3, s);
  }
#elif PATTERN == 5
  {
    // soil strata on cut faces. p1: boundaries (y), p2.x: pebble scale
    float y = v_wpos.y + (fbm(v_wpos * 1.5) - 0.5) * 0.25;
    vec3 c = y > u_p1.x ? u_c1 : (y > u_p1.y ? u_c2 : (y > u_p1.z ? u_c3 : u_c4));
    vec2 cid; float d = voronoi(vec2(v_wpos.x + v_wpos.z, v_wpos.y) * u_p2.x, cid);
    float hp = hash12(cid);
    float peb = smoothstep(0.43, 0.37, d) * (y > u_p1.y ? u_p2.y : u_p2.z) * step(0.2, hash12(cid + 5.3));
    vec3 stone = mix(vec3(0.36, 0.31, 0.25), vec3(0.17, 0.15, 0.13), hp) * (0.65 + 0.55 * smoothstep(0.42, 0.0, d));
    c = mix(c, stone, peb);
    c *= mix(0.85, 1.12, vnoise(v_wpos * 7.0));
    // limestone chalky specks
    base *= c;
    rough = 0.95;
  }
#elif PATTERN == 6
  {
    // map land. aux: +w left bank, -w right bank (soft weights). p1.x contour freq, p2.xy region glow
    float cl = abs(fract(v_wpos.y * u_p1.x) - 0.5);
    float contour = smoothstep(0.05, 0.0, cl) * smoothstep(0.02, 0.15, v_wpos.y);
    base = mix(base, base * 1.5 + 0.02, contour * 0.5);
    float lw = max(v_aux, 0.0), rw = max(-v_aux, 0.0);
    float hatch = smoothstep(0.35, 0.5, abs(fract((v_wpos.x - v_wpos.z) * 2.2 - u_time * 0.3) - 0.5));
    float le = smoothstep(0.05, 0.4, lw) * smoothstep(0.95, 0.5, lw);
    float re = smoothstep(0.05, 0.4, rw) * smoothstep(0.95, 0.5, rw);
    emit += u_c1 * u_p2.x * (le * 1.6 + smoothstep(0.4, 0.9, lw) * (0.12 + 0.18 * hatch));
    emit += u_c2 * u_p2.y * (re * 1.6 + smoothstep(0.4, 0.9, rw) * (0.12 + 0.18 * hatch));
    vec2 cid; float d = voronoi(v_wpos.xz * 1.4, cid);
    base *= mix(0.88, 1.1, hash12(cid));
  }
#elif PATTERN == 7
  {
    // emissive ribbon: reveal (p1.x), dash freq (p1.y), speed (p1.z), dash amount (p1.w)
    if (v_aux > u_p1.x) discard;
    float dash = 0.5 + 0.5 * sin((v_aux * u_p1.y - u_time * u_p1.z) * 6.2831);
    float head = smoothstep(u_p1.x - 0.04, u_p1.x, v_aux) * 2.0;
    emit *= mix(1.0, 0.4 + 0.9 * dash, u_p1.w) + head;
  }
#elif PATTERN == 8
  {
    // grape berry. p1.x: veraison progress (per berry threshold in icol.w). c1 green, c2 purple
    float t = smoothstep(v_icol.w - 0.15, v_icol.w + 0.15, u_p1.x);
    vec3 mid = vec3(0.45, 0.12, 0.18);
    vec3 c = t < 0.5 ? mix(u_c1, mid, t * 2.0) : mix(mid, u_c2, t * 2.0 - 1.0);
    base = c * mix(0.85, 1.1, fract(v_icol.w * 13.7));
    float bloomN = fbm(v_opos * 9.0 + v_icol.w * 10.0);
    rough = mix(0.25, 0.55, bloomN * t);
  }
#elif PATTERN == 9
  {
    // wine body: brighter ruby where thin (rim), p1.x rim glow
    vec3 V = normalize(u_camPos - v_wpos);
    float rim = pow(1.0 - abs(dot(N, V)), 2.0);
    emit += u_c1 * rim * u_p1.x;
  }
#elif PATTERN == 10
  {
    // bottle with label texture: p1 = (y0, h, uOffset, uScale)
    float u = 0.5 - atan(v_opos.z, v_opos.x) / 6.2831;
    float v = (v_opos.y - u_p1.x) / u_p1.y;
    float uu = (u - u_p1.z) * u_p1.w;
    if (v > 0.0 && v < 1.0 && uu > 0.0 && uu < 1.0) {
      vec4 t = texture(u_tex, vec2(uu, 1.0 - v));
      base = t.rgb; rough = 0.75; metal = 0.0;
      emit *= 0.0;
    }
  }
#elif PATTERN == 11
  {
    // concrete floor with joints. p1.x tile size
    vec2 f = fract(v_wpos.xz / u_p1.x);
    float j = smoothstep(0.0, 0.01, f.x) * smoothstep(1.0, 0.99, f.x) * smoothstep(0.0, 0.01, f.y) * smoothstep(1.0, 0.99, f.y);
    float n = fbm(v_wpos * 2.5);
    base *= mix(0.55, 1.0, j) * mix(0.8, 1.1, n);
    rough = mix(0.95, rough, n);
  }
#elif PATTERN == 12
  {
    // planks across local X (barrel heads, crates, press slats). p1.x plank width
    float pl = floor((v_opos.x + u_p1.y) / u_p1.x);
    float f = fract((v_opos.x + u_p1.y) / u_p1.x);
    float var = hash12(vec2(pl, 3.0));
    float grain = fbm(vec3(v_opos.x * 30.0, v_opos.z * 3.0 + pl, v_opos.y * 3.0));
    base *= mix(0.8, 1.1, var) * mix(0.88, 1.06, grain) * mix(0.4, 1.0, smoothstep(0.0, 0.04, f) * smoothstep(1.0, 0.96, f));
  }
#elif PATTERN == 13
  {
    // perforated steel drum: holes on a grid (angle, y) in object space. p1.x holes around, p1.y rows per m
    float ang = atan(v_opos.z, v_opos.x) / 6.2831 * u_p1.x;
    vec2 g = vec2(ang, v_opos.y * u_p1.y);
    vec2 f = fract(g) - 0.5;
    float hole = smoothstep(0.32, 0.26, length(f));
    base = mix(base, vec3(0.02), hole);
    rough = mix(rough, 1.0, hole);
    metal = mix(metal, 0.0, hole);
  }
#elif PATTERN == 14
  {
    // generic organic noise between c1 and c2 (fields, forests, foliage hedges)
    float n = fbm(v_wpos * u_p1.x);
    base *= mix(u_c1, u_c2, smoothstep(0.3, 0.7, n));
  }
#endif
}

void main() {
#if REVEAL
  if (v_aux > u_p3.x || v_aux < u_p3.y) discard;
#endif
  vec3 N = normalize(v_nrm);
  if (u_double == 1 && !gl_FrontFacing) N = -N;
  vec3 base = u_base * v_col * v_icol.rgb;
  float rough = u_rough, metal = u_metal, sss = u_sss;
  vec3 emit = u_emit;
  pattern(base, N, rough, emit, sss, metal);
  vec3 V = normalize(u_camPos - v_wpos);
  float dist = length(u_camPos - v_wpos);
  vec3 L = u_sunDir;
  float NdL = dot(N, L);
  float NdV = max(dot(N, V), 1e-3);
#if SHADOW
  float sh = shadowAt(v_wpos, N);
#else
  float sh = 1.0;
#endif
  float a = max(rough * rough, 0.002);
  vec3 f0 = mix(vec3(0.04 * u_spec), base, metal);
  vec3 diffCol = base * (1.0 - metal);
  vec3 H = normalize(L + V);
  float nl = max(NdL, 0.0);
  vec3 F = f0 + (1.0 - f0) * pow(1.0 - max(dot(V, H), 0.0), 5.0);
  vec3 spec = D_GGX(max(dot(N, H), 0.0), a) * Vis(nl, NdV, a) * F * nl * PI;
  float wrap = max((NdL + sss) / (1.0 + sss), 0.0);
  vec3 col = (diffCol * wrap + spec) * u_sunCol * sh;
  // translucency when backlit (leaves, berries, wine)
#if SSS
  col += diffCol * u_sunCol * sss * pow(clamp(dot(V, -L), 0.0, 1.0), 4.0) * (0.35 + 0.65 * sh) * 1.6;
#endif
  vec3 amb = mix(u_ambGnd, u_ambSky, N.y * 0.5 + 0.5);
  col += diffCol * amb;
  vec3 R = reflect(-V, N);
  vec3 Fe = f0 + (max(vec3(1.0 - rough), f0) - f0) * pow(1.0 - NdV, 5.0);
  col += skyColor(R) * Fe * u_envAmt * (1.0 - rough * 0.85);
  for (int i = 0; i < NLIGHTS; i++) {
    vec3 Lp = u_plPos[i].xyz - v_wpos;
    float d2 = dot(Lp, Lp);
    vec3 Ld = Lp * inversesqrt(d2);
    float fall = clamp(1.0 - sqrt(d2) / u_plPos[i].w, 0.0, 1.0);
    float att = u_plCol[i].w * fall * fall / (d2 + 1.0);
    float nlp = max((dot(N, Ld) + sss) / (1.0 + sss), 0.0);
    vec3 Hp = normalize(Ld + V);
    float nlr = max(dot(N, Ld), 0.0);
    vec3 sp = D_GGX(max(dot(N, Hp), 0.0), a) * Vis(nlr, NdV, a) * F * nlr * PI;
    col += (diffCol * nlp + sp) * u_plCol[i].rgb * att;
  }
#if SHEEN
  col += u_sheen * pow(1.0 - NdV, 2.5) * (amb + u_sunCol * 0.15) * vec3(0.75, 0.82, 1.0);
#endif
  col += emit;
  float fogAmt = (1.0 - exp(-u_fog.x * dist)) * exp(-max(v_wpos.y - u_fog.z, 0.0) * u_fog.y);
  fogAmt = min(fogAmt, u_fog.w);
  vec3 fc = u_fogCol + u_sunCol * 0.3 * pow(max(dot(-V, u_sunDir), 0.0), 8.0);
  col = mix(col, fc, fogAmt);
  o = vec4(col, dist);
}`;

export const GLASS_FS = (defs: string) => /* glsl */ `#version 300 es
${defs}
${COMMON}
in vec3 v_wpos; in vec3 v_nrm; in vec3 v_col; in vec3 v_opos; in float v_aux; in vec4 v_icol;
uniform vec3 u_camPos; uniform mat4 u_view;
uniform sampler2D u_scene; uniform vec2 u_invRes;
uniform vec3 u_tint; uniform float u_refr, u_absorb, u_reflAmt;
uniform vec4 u_plPos[4]; uniform vec4 u_plCol[4]; uniform int u_plCount;
uniform vec4 u_fog; uniform vec3 u_fogCol;
out vec4 o;
void main() {
  vec3 N = normalize(v_nrm);
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(u_camPos - v_wpos);
  float NdV = clamp(abs(dot(N, V)), 0.0, 1.0);
  vec3 Nv = mat3(u_view) * N;
  vec2 uv = gl_FragCoord.xy * u_invRes;
  vec2 off = Nv.xy * u_refr * (1.0 - NdV * 0.6);
  vec3 bg = texture(u_scene, clamp(uv - off, 0.001, 0.999)).rgb;
  float edge = pow(1.0 - NdV, 2.0);
  vec3 trans = bg * u_tint * (1.0 - edge * u_absorb);
  float F = 0.04 + 0.96 * pow(1.0 - NdV, 5.0);
  vec3 refl = skyColor(reflect(-V, N)) * u_reflAmt;
  vec3 H = normalize(u_sunDir + V);
  vec3 col = mix(trans, refl, F) + u_sunCol * pow(max(dot(N, H), 0.0), 900.0) * 25.0;
  for (int i = 0; i < NLIGHTS; i++) {
    vec3 Ld = normalize(u_plPos[i].xyz - v_wpos);
    vec3 Hp = normalize(Ld + V);
    col += u_plCol[i].rgb * u_plCol[i].w * 0.02 * pow(max(dot(N, Hp), 0.0), 600.0);
  }
  float dist = length(u_camPos - v_wpos);
  float fogAmt = min((1.0 - exp(-u_fog.x * dist)) * exp(-max(v_wpos.y - u_fog.z, 0.0) * u_fog.y), u_fog.w);
  col = mix(col, u_fogCol, fogAmt);
  o = vec4(col, dist);
}`;

export const SKY_VS = /* glsl */ `#version 300 es
out vec2 v_ndc;
void main() { vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); v_ndc = p * 2.0 - 1.0; gl_Position = vec4(p * 2.0 - 1.0, 1.0, 1.0); }`;

export const SKY_FS = (defs: string) => /* glsl */ `#version 300 es
${defs}
${COMMON}
in vec2 v_ndc;
uniform mat4 u_invVP; uniform vec3 u_camPos;
uniform float u_skyNoise;
out vec4 o;
void main() {
  vec4 p = u_invVP * vec4(v_ndc, 1.0, 1.0);
  vec3 d = normalize(p.xyz / p.w - u_camPos);
  vec3 c = skyColor(d);
  // soft cloud wisps / studio mottling
#if SKYNOISE
  c *= 1.0 + u_skyNoise * (vnoise(d * 3.0 + vec3(u_time * 0.02, 0.0, 0.0)) * 0.6 + vnoise(d * 7.0) * 0.4 - 0.5);
#endif
  o = vec4(c, 60000.0);
}`;

export const PART_VS = /* glsl */ `#version 300 es
layout(location=0) in vec3 a_pos;
layout(location=4) in vec4 i_m0;
layout(location=8) in vec4 i_col;
uniform mat4 u_vp; uniform vec3 u_camRight, u_camUp;
out vec2 v_uv; out vec4 v_c;
void main() {
  vec3 wp = i_m0.xyz + (u_camRight * a_pos.x + u_camUp * a_pos.y) * i_m0.w;
  v_uv = a_pos.xy; v_c = i_col;
  gl_Position = u_vp * vec4(wp, 1.0);
}`;

export const PART_FS = /* glsl */ `#version 300 es
precision highp float;
in vec2 v_uv; in vec4 v_c;
uniform int u_shape;
out vec4 o;
void main() {
  float r = length(v_uv);
  if (r > 1.0) discard;
  float a;
  vec3 c = v_c.rgb;
  if (u_shape == 0) a = exp(-r * r * 5.0);
  else if (u_shape == 1) {
    float ring = smoothstep(0.7, 0.92, r) * smoothstep(1.0, 0.93, r);
    float hl = exp(-dot(v_uv - vec2(-0.35, 0.4), v_uv - vec2(-0.35, 0.4)) * 30.0);
    a = ring * 0.8 + hl + 0.06;
  } else a = smoothstep(1.0, 0.8, r);
  a *= v_c.a;
  o = vec4(c * a, a);
}`;

export const FS_VS = /* glsl */ `#version 300 es
out vec2 v_uv;
void main() { vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); v_uv = p; gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;

export const DOWN_FS = /* glsl */ `#version 300 es
precision highp float;
in vec2 v_uv; uniform sampler2D u_src; uniform vec2 u_texel; uniform int u_prefilter; uniform float u_threshold;
out vec4 o;
vec3 s(vec2 off) { return texture(u_src, v_uv + off * u_texel).rgb; }
void main() {
  vec3 a = s(vec2(-2,-2)), b = s(vec2(0,-2)), c = s(vec2(2,-2));
  vec3 d = s(vec2(-1,-1)), e = s(vec2(1,-1));
  vec3 f = s(vec2(-2,0)), g = s(vec2(0,0)), h = s(vec2(2,0));
  vec3 i = s(vec2(-1,1)), j = s(vec2(1,1));
  vec3 k = s(vec2(-2,2)), l = s(vec2(0,2)), m = s(vec2(2,2));
  vec3 r = (d + e + i + j) * 0.125 + (a + b + g + f) * 0.03125 + (b + c + h + g) * 0.03125 + (f + g + l + k) * 0.03125 + (g + h + m + l) * 0.03125;
  if (u_prefilter == 1) {
    r = min(r, vec3(60.0));
    float br = max(r.r, max(r.g, r.b));
    float soft = clamp(br - u_threshold + 0.5, 0.0, 1.0); soft = soft * soft * 0.5;
    float contrib = max(soft, br - u_threshold) / max(br, 1e-4);
    r *= contrib;
  }
  o = vec4(r, 1.0);
}`;

export const UP_FS = /* glsl */ `#version 300 es
precision highp float;
in vec2 v_uv; uniform sampler2D u_src; uniform vec2 u_texel; uniform float u_radius;
out vec4 o;
void main() {
  vec4 d = u_texel.xyxy * vec4(1, 1, -1, 0) * u_radius;
  vec3 s = texture(u_src, v_uv - d.xy).rgb + texture(u_src, v_uv - d.wy).rgb * 2.0 + texture(u_src, v_uv - d.zy).rgb
    + texture(u_src, v_uv + d.zw).rgb * 2.0 + texture(u_src, v_uv).rgb * 4.0 + texture(u_src, v_uv + d.xw).rgb * 2.0
    + texture(u_src, v_uv + d.zy).rgb + texture(u_src, v_uv + d.wy).rgb * 2.0 + texture(u_src, v_uv + d.xy).rgb;
  o = vec4(s / 16.0, 1.0);
}`;

export const DOF_FS = /* glsl */ `#version 300 es
precision highp float;
in vec2 v_uv; uniform sampler2D u_src; uniform vec2 u_texel; uniform float u_focus, u_aperture, u_maxCoc;
out vec4 o;
float coc(float d) { return clamp(abs(d - u_focus) / max(d, 0.001) * u_aperture, 0.0, 1.0) * u_maxCoc; }
void main() {
  vec4 c = texture(u_src, v_uv);
  float cc = coc(c.a);
  vec3 acc = c.rgb; float w = 1.0;
  const int N = 28;
  for (int i = 1; i < N; i++) {
    float fi = float(i);
    float r = sqrt(fi / float(N)) * u_maxCoc;
    float th = fi * 2.39996;
    vec2 off = vec2(cos(th), sin(th)) * r;
    vec4 s = texture(u_src, v_uv + off * u_texel);
    float sc = coc(s.a);
    if (s.a > c.a) sc = min(sc, cc * 2.0 + 0.5);
    float ww = smoothstep(r - 1.5, r + 0.5, sc);
    acc += s.rgb * ww; w += ww;
  }
  o = vec4(acc / w, cc);
}`;

export const COMP_FS = /* glsl */ `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_scene, u_bloom, u_dof;
uniform int u_dofOn; uniform float u_focus, u_aperture, u_maxCoc;
uniform float u_exposure, u_bloomAmt, u_contrast, u_sat, u_vignette, u_grain, u_ca, u_time, u_fade;
uniform vec3 u_lift, u_gain, u_tintShadow, u_tintHigh, u_fadeCol;
uniform vec2 u_res;
out vec4 o;
float coc(float d) { return clamp(abs(d - u_focus) / max(d, 0.001) * u_aperture, 0.0, 1.0) * u_maxCoc; }
vec3 scene(vec2 uv) {
  vec4 s = texture(u_scene, uv);
  if (u_dofOn == 1) {
    vec4 b = texture(u_dof, uv);
    float k = smoothstep(0.6, 2.5, coc(s.a));
    return mix(s.rgb, b.rgb, k);
  }
  return s.rgb;
}
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
float h(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
void main() {
  vec2 uv = v_uv;
  vec2 dc = uv - 0.5;
  float ca = u_ca * dot(dc, dc);
  vec3 col = scene(uv);
  col.r = mix(col.r, texture(u_scene, uv - dc * ca).r, 0.6);
  col.b = mix(col.b, texture(u_scene, uv + dc * ca).b, 0.6);
  col += texture(u_bloom, uv).rgb * u_bloomAmt;
  col *= u_exposure;
  col = aces(col);
  col = pow(col, vec3(1.0 / 2.2));
  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(vec3(l), col, u_sat);
  col = (col - 0.5) * u_contrast + 0.5;
  col = col * u_gain + u_lift * (1.0 - col);
  col += u_tintShadow * (1.0 - l) * (1.0 - l) * 0.12 + u_tintHigh * l * l * 0.12;
  float vig = smoothstep(1.25, 0.25, length(dc * vec2(1.0, 0.8)) * 1.45);
  col *= mix(1.0, vig, u_vignette);
  col += (h(uv * u_res + fract(u_time * 7.31) * 113.0) - 0.5) * u_grain;
  col = mix(col, u_fadeCol, u_fade);
  o = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

export const TRANS_FS = /* glsl */ `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_a, u_b; uniform float u_p; uniform int u_type; uniform vec3 u_col; uniform vec2 u_dir;
out vec4 o;
float h(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float n2(vec2 x) { vec2 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
float fbm2(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * n2(p); p *= 2.1; a *= 0.5; } return s; }
vec3 blurDir(sampler2D t, vec2 uv, vec2 d) {
  vec3 s = vec3(0.0);
  for (int i = 0; i < 24; i++) { float k = float(i) / 23.0 - 0.5; s += texture(t, clamp(uv + d * k, 0.0, 1.0)).rgb; }
  return s / 24.0;
}
vec3 zoomBlur(sampler2D t, vec2 uv, float zoom, float amt) {
  vec2 c = vec2(0.5); vec3 s = vec3(0.0);
  for (int i = 0; i < 24; i++) { float k = float(i) / 23.0; vec2 u = c + (uv - c) / (zoom * (1.0 + amt * k)); s += texture(t, clamp(u, 0.0, 1.0)).rgb; }
  return s / 24.0;
}
void main() {
  vec2 uv = v_uv; float p = clamp(u_p, 0.0, 1.0);
  vec3 c;
  if (u_type == 1) {
    float e = p < 0.5 ? 4.0 * p * p * p : 1.0 - pow(-2.0 * p + 2.0, 3.0) / 2.0;
    float bl = sin(p * 3.14159) * 0.22;
    vec2 d = normalize(u_dir);
    vec3 a = blurDir(u_a, uv + d * e * 0.35, d * bl);
    vec3 b = blurDir(u_b, uv - d * (1.0 - e) * 0.35, d * bl);
    c = mix(a, b, smoothstep(0.42, 0.58, p));
    c += vec3(1.0, 0.95, 0.9) * pow(sin(p * 3.14159), 6.0) * 0.12;
  } else if (u_type == 2) {
    float k = smoothstep(0.0, 1.0, p);
    vec3 a = zoomBlur(u_a, uv, 1.0 + k * k * 2.5, sin(p * 3.14159) * 0.35);
    vec3 b = zoomBlur(u_b, uv, 0.55 + 0.45 * k, sin(p * 3.14159) * 0.35);
    c = mix(a, b, smoothstep(0.35, 0.65, p));
  } else if (u_type == 3) {
    float n = fbm2(uv * vec2(3.0, 1.8) + 3.7) * 0.75 + (1.0 - uv.y) * 0.25 + (uv.x) * 0.1;
    float t = p * 1.35 - 0.2;
    float m = smoothstep(t - 0.02, t + 0.02, n);
    float edge = smoothstep(0.09, 0.0, abs(n - t));
    c = mix(texture(u_b, uv).rgb, texture(u_a, uv).rgb, m) + u_col * edge * 1.2;
  } else if (u_type == 4) {
    c = mix(texture(u_a, uv).rgb, texture(u_b, uv).rgb, smoothstep(0.4, 0.6, p));
    c = mix(c, u_col, pow(sin(p * 3.14159), 3.0) * 0.85);
  } else {
    c = mix(texture(u_a, uv).rgb, texture(u_b, uv).rgb, smoothstep(0.0, 1.0, p));
  }
  o = vec4(c, 1.0);
}`;
