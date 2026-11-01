// Infographics for the 9:16 Reels cut, in a quiet editorial style: one gold accent, thin rules,
// small caps labels, a book serif for words that are read, slow fades and gentle rises.
// Layout keeps clear of the Reels interface (top ~260 px, bottom ~420 px, right-hand icons).
import React from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/fonts";
import { Engine } from "../engine/renderer";
import { buildShots } from "../scenes";
import { B } from "../beats";
import { FPS, SHOTS } from "../timeline";
import { BLENDS } from "../scenes/finale";
import captions from "../captions_words.json";

loadFont({ family: "Albert Sans", url: staticFile("fonts/AlbertSans-normal.woff2"), weight: "200 900", style: "normal" });
loadFont({ family: "Newsreader", url: staticFile("fonts/Newsreader-normal.woff2"), weight: "200 800", style: "normal" });
loadFont({ family: "Newsreader", url: staticFile("fonts/Newsreader-italic.woff2"), weight: "200 800", style: "italic" });

export const RW = 1080;
export const RH = 1920;
const SANS = "'Albert Sans', 'Inter', sans-serif";
const SERIF = "'Newsreader', 'DejaVu Serif', serif";
const C = {
  ivory: "#F4ECE0",
  gold: "#89764B",
  goldLight: "#D9C293",
  rose: "#D2A6A9",
  silver: "#C6CFD4",
};
const SAFE = { left: 80, right: 1000, top: 270, captionTop: 1380 };
const soft = "0 1px 2px rgba(0,0,0,0.35), 0 4px 22px rgba(0,0,0,0.45)";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const EASE = Easing.bezier(0.19, 1, 0.22, 1);

// 0..1 envelope with slow eased fades
const vis = (t: number, a: number, b = 1e9, fin = 0.8, fout = 0.6) =>
  Math.min(interpolate(t, [a, a + fin], [0, 1], { ...clamp, easing: EASE }), interpolate(t, [b - fout, b], [1, 0], { ...clamp, easing: Easing.inOut(Easing.cubic) }));
const rise = (v: number): React.CSSProperties => ({ opacity: v, translate: `0px ${(1 - v) * 14}px` });

const shots = buildShots(true);
function anchor(shot: string, t: number, name: string) {
  const s = shots[shot];
  const a = s?.anchors?.(t)?.[name];
  if (!a) return null;
  const p = Engine.project(s.camera(t), a, RW, RH);
  if (!p.visible || p.x < 40 || p.x > RW - 40 || p.y < 200 || p.y > SAFE.captionTop - 40) return null;
  return p;
}

// --- primitives
const Label: React.FC<{ children: React.ReactNode; color?: string; size?: number; rule?: boolean; align?: "left" | "center" }> = ({ children, color = C.goldLight, size = 27, rule = true, align = "left" }) => (
  <div style={{ textAlign: align }}>
    {rule ? <div style={{ width: 28, height: 1, background: C.goldLight, opacity: 0.8, marginBottom: 14, marginLeft: align === "center" ? "auto" : 0, marginRight: align === "center" ? "auto" : 0 }} /> : null}
    <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: size, letterSpacing: "0.22em", textTransform: "uppercase", color, textShadow: soft }}>{children}</div>
  </div>
);

const Chapter: React.FC<{ t: number; n: string; title: string; end: number }> = ({ t, n, title, end }) => {
  const v = vis(t, 0.3, end);
  if (v <= 0) return null;
  return (
    <div style={{ position: "absolute", left: SAFE.left, top: SAFE.top, ...rise(v) }}>
      <Label>
        {n} · {title}
      </Label>
    </div>
  );
};

// A thin leader from a 3D point to a label; flips side to stay inside the frame.
const Note: React.FC<{ t: number; shot: string; at: string; start: number; end?: number; title: string; sub?: string; dy?: number; reach?: number; color?: string }> = ({ t, shot, at, start, end = 1e9, title, sub, dy = -90, reach = 150, color = C.goldLight }) => {
  const a = anchor(shot, t, at);
  const v = vis(t, start, end);
  if (!a || v <= 0) return null;
  const estW = Math.max(title.length * 28 * 0.78, (sub ?? "").length * 33 * 0.47) + 20;
  const right = a.x + reach + estW < SAFE.right + 40 ? true : a.x - reach - estW > SAFE.left - 20 ? false : a.x < RW / 2;
  const ex = a.x + (right ? 1 : -1) * reach * 0.45;
  const ey = Math.max(SAFE.top + 220, Math.min(SAFE.captionTop - 110, a.y + dy));
  const lx = a.x + (right ? 1 : -1) * reach;
  const len = Math.hypot(ex - a.x, ey - a.y) + Math.abs(lx - ex);
  const draw = interpolate(t, [start, start + 0.9], [0, 1], { ...clamp, easing: EASE });
  const txt = vis(t, start + 0.35, end);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: v }}>
      <svg width={RW} height={RH} style={{ position: "absolute", inset: 0 }}>
        <circle cx={a.x} cy={a.y} r={5} fill={color} />
        <circle cx={a.x} cy={a.y} r={11} fill="none" stroke={color} strokeOpacity={0.45} strokeWidth={1} />
        <path d={`M ${a.x} ${a.y} L ${ex} ${ey} L ${lx} ${ey}`} fill="none" stroke={color} strokeOpacity={0.85} strokeWidth={1.5} strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
      </svg>
      <div style={{ position: "absolute", top: ey - 20, left: right ? lx + 14 : undefined, right: right ? undefined : RW - lx + 14, textAlign: right ? "left" : "right", whiteSpace: "nowrap", ...rise(txt) }}>
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 28, letterSpacing: "0.18em", textTransform: "uppercase", color: C.ivory, textShadow: soft }}>{title}</div>
        {sub ? <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 33, color: C.ivory, opacity: 0.9, marginTop: 4, textShadow: soft }}>{sub}</div> : null}
      </div>
    </div>
  );
};

// Small label pinned above (or below) a 3D point
const Tag: React.FC<{ t: number; shot: string; at: string; start: number; end?: number; text: string; color?: string; dy?: number; serif?: boolean; size?: number }> = ({ t, shot, at, start, end = 1e9, text, color = C.ivory, dy = -30, serif = false, size = 26 }) => {
  const a = anchor(shot, t, at);
  const v = vis(t, start, end);
  if (!a || v <= 0) return null;
  return (
    <div style={{ position: "absolute", left: Math.max(170, Math.min(RW - 170, a.x)), top: Math.min(a.y + dy, SAFE.captionTop - 70), translate: "-50% -50%", whiteSpace: "nowrap", opacity: v }}>
      <div style={serif ? { fontFamily: SERIF, fontStyle: "italic", fontSize: size + 8, color, textShadow: soft } : { fontFamily: SANS, fontWeight: 600, fontSize: size, letterSpacing: "0.22em", textTransform: "uppercase", color, textShadow: soft }}>{text}</div>
    </div>
  );
};

// Data panel: quiet dark plate with a thin gold rule on top
const Panel: React.FC<{ t: number; start: number; end: number; top: number; title?: string; children: React.ReactNode }> = ({ t, start, end, top, title, children }) => {
  const v = vis(t, start, end);
  if (v <= 0) return null;
  return (
    <div style={{ position: "absolute", left: SAFE.left, width: SAFE.right - SAFE.left, top, ...rise(v), background: "linear-gradient(180deg, rgba(20,17,14,0.66), rgba(20,17,14,0.42))", borderTop: "1px solid rgba(217,194,147,0.55)", padding: "28px 34px 30px", color: C.ivory }}>
      {title ? <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 24, letterSpacing: "0.2em", textTransform: "uppercase", color: C.goldLight, marginBottom: 20 }}>{title}</div> : null}
      {children}
    </div>
  );
};

const Serif: React.FC<{ t: number; start: number; end: number; top: number; children: React.ReactNode; size?: number; italic?: boolean; align?: "left" | "center" }> = ({ t, start, end, top, children, size = 64, italic = false, align = "left" }) => {
  const v = vis(t, start, end, 1.0, 0.7);
  if (v <= 0) return null;
  return (
    <div style={{ position: "absolute", left: SAFE.left, width: SAFE.right - SAFE.left, top, textAlign: align, fontFamily: SERIF, fontStyle: italic ? "italic" : "normal", fontWeight: 400, fontSize: size, lineHeight: 1.12, color: C.ivory, textShadow: soft, ...rise(v) }}>
      {children}
    </div>
  );
};

const count = (t: number, a: number, from: number, to: number, d = 1.4) => from + (to - from) * interpolate(t, [a, a + d], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });

type P = { t: number; d: number };

// ---------------------------------------------------------------- shots
const Hook: React.FC<P> = ({ t, d }) => {
  const h = B.hook;
  return (
    <AbsoluteFill>
      <Serif t={t} start={h.squeeze} end={h.question - 0.2} top={300} size={66} italic>
        Squeeze a red grape…
      </Serif>
      <Serif t={t} start={h.clear} end={h.question - 0.2} top={390} size={66} italic>
        <span style={{ opacity: 0.9 }}>and the juice runs </span>
        <span style={{ fontStyle: "normal", color: C.goldLight }}>clear.</span>
      </Serif>
      <Note t={t} shot="hook" at="drop" start={h.clear + 0.4} end={h.question - 0.2} title="Grape juice" sub="colourless, even from red grapes" dy={70} reach={130} />
      <div style={{ position: "absolute", left: SAFE.left, width: SAFE.right - SAFE.left, top: 300, ...rise(vis(t, h.question, d + 0.5, 0.9, 0.6)) }}>
        <Label>The question</Label>
        <div style={{ fontFamily: SANS, fontWeight: 300, fontSize: 76, lineHeight: 1.08, color: C.ivory, marginTop: 18, textShadow: soft }}>
          So where does Bordeaux get its deep, <span style={{ fontFamily: SERIF, fontStyle: "italic", color: C.goldLight }}>ruby red?</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Title: React.FC<P> = ({ t, d }) => {
  const v = vis(t, 0.5, d + 0.3, 1.2, 0.6);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", ...rise(v) }}>
      <Label align="center">How red wine is made</Label>
      <div style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 150, letterSpacing: "0.04em", color: C.ivory, marginTop: 22, textShadow: soft }}>Bordeaux</div>
      <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 44, color: C.ivory, opacity: 0.85, marginTop: 4 }}>from vine to glass</div>
    </AbsoluteFill>
  );
};

const Map: React.FC<P> = ({ t, d }) => {
  const M = B.map;
  const end = d - 0.5;
  return (
    <AbsoluteFill>
      <Chapter t={t} n="01" title="Terroir" end={end} />
      <div style={{ position: "absolute", left: SAFE.left, top: SAFE.top + 56, fontFamily: SERIF, fontStyle: "italic", fontSize: 34, color: C.ivory, opacity: 0.8 * vis(t, 0.8, end), textShadow: soft }}>44°50′ N · 0°34′ W</div>
      <Tag t={t} shot="map" at="atlantic" start={0.8} end={end} text="Atlantic Ocean" serif color={C.silver} size={24} />
      <Note t={t} shot="map" at="bordeaux" start={M.france + 0.2} end={M.lat45 + 2.4} title="Bordeaux" sub="south-west France" dy={-110} />
      <Tag t={t} shot="map" at="lat45" start={M.lat45} end={end} text="45° N" color={C.ivory} />
      <Tag t={t} shot="map" at="garonne" start={M.garonne} end={end} text="Garonne" color={C.silver} />
      <Tag t={t} shot="map" at="dordogne" start={M.dordogne} end={end} text="Dordogne" color={C.silver} />
      <Note t={t} shot="map" at="gironde" start={M.gironde + 0.2} end={M.left - 0.2} title="Gironde estuary" dy={-120} color={C.silver} />
      <Note t={t} shot="map" at="leftbank" start={M.left} end={end} title="Left Bank" sub="Médoc · Graves" dy={130} />
      <Note t={t} shot="map" at="rightbank" start={M.right} end={end} title="Right Bank" sub="Saint-Émilion · Pomerol" dy={-140} color={C.rose} />
    </AbsoluteFill>
  );
};

const Soil: React.FC<P> = ({ t, d }) => {
  const S = B.soil;
  const end = d - 0.4;
  const mid = S.right - 0.3;
  return (
    <AbsoluteFill>
      <Chapter t={t} n="01" title="Terroir" end={end} />
      <Serif t={t} start={0.4} end={mid} top={SAFE.top + 56} size={52}>
        Left Bank <span style={{ fontStyle: "italic", opacity: 0.85 }}>· gravel</span>
      </Serif>
      <Note t={t} shot="soil" at="gravel" start={S.gravel} end={mid} title="Gravel" sub="rain drains straight through" dy={-60} />
      <Note t={t} shot="soil" at="heat" start={S.heat} end={mid} title="Warmth" sub="stones hold the sun's heat" dy={-80} />
      <Note t={t} shot="soil" at="roots" start={S.gravel + 1.2} end={mid} title="Deep roots" sub="metres down for water" dy={70} />
      <Serif t={t} start={S.right} end={end} top={SAFE.top + 56} size={52}>
        Right Bank <span style={{ fontStyle: "italic", opacity: 0.85 }}>· clay & limestone</span>
      </Serif>
      <Note t={t} shot="soil" at="clay" start={S.clay} end={end} title="Clay" sub="cool, holds water" dy={-60} color={C.rose} />
      <Note t={t} shot="soil" at="limestone" start={S.clay + 0.5} end={end} title="Limestone" dy={70} />
    </AbsoluteFill>
  );
};

const DONUT = [
  { label: "Merlot", v: 62, c: "#8E3B4A" },
  { label: "Cabernet Sauvignon", v: 25, c: "#5A4A6A" },
  { label: "Cabernet Franc", v: 11, c: "#B98A7E" },
  { label: "Petit Verdot, Malbec, Carménère", v: 2, c: "#D9C293" },
];
const Grapes: React.FC<P> = ({ t, d }) => {
  const G = B.grapes;
  const end = d - 0.35;
  const R = 74, sw = 16, Cc = 2 * Math.PI * R;
  let acc = 0;
  const st = G.merlot + 0.6;
  return (
    <AbsoluteFill>
      <Chapter t={t} n="02" title="The grapes" end={end} />
      <Panel t={t} start={G.merlot + 0.3} end={end} top={SAFE.top + 70} title="Red vines in Bordeaux, approx.">
        <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
          <svg width={180} height={180} viewBox="-90 -90 180 180">
            <circle r={R} fill="none" stroke="rgba(244,236,224,0.12)" strokeWidth={sw} />
            {DONUT.map((s, i) => {
              const g = interpolate(t, [st + i * 0.3, st + i * 0.3 + 1.0], [0, 1], { ...clamp, easing: EASE });
              const el = <circle key={s.label} r={R} fill="none" stroke={s.c} strokeWidth={sw} strokeDasharray={`${(s.v / 100) * Cc * g} ${Cc}`} strokeDashoffset={-acc} transform="rotate(-90)" />;
              acc += (s.v / 100) * Cc;
              return el;
            })}
            <text textAnchor="middle" y={12} fill={C.ivory} style={{ fontFamily: SERIF, fontSize: 40 }}>
              {Math.round(count(t, st, 0, 62))}%
            </text>
          </svg>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {DONUT.map((s, i) => (
              <div key={s.label} style={{ display: "flex", alignItems: "baseline", gap: 14, opacity: vis(t, st + 0.3 + i * 0.25, end) }}>
                <div style={{ width: 12, height: 12, background: s.c, flex: "none" }} />
                <div style={{ fontFamily: SERIF, fontSize: 32, width: 84 }}>≈{s.v}%</div>
                <div style={{ fontFamily: SANS, fontSize: 25, fontWeight: 400, letterSpacing: "0.02em", opacity: 0.92 }}>{s.label === "Petit Verdot, Malbec, Carménère" ? "Others" : s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </Panel>
      <Tag t={t} shot="grapes" at="merlot" start={G.merlot} end={end} text="Merlot" dy={64} />
      <Tag t={t} shot="grapes" at="cs" start={G.cs} end={end} text="Cab. Sauvignon" dy={64} />
      <Tag t={t} shot="grapes" at="cf" start={G.cf} end={end} text="Cab. Franc" dy={64} />
    </AbsoluteFill>
  );
};

const Ripening: React.FC<P> = ({ t, d }) => {
  const V = B.veraison;
  const end = d - 0.3;
  const w = 840, h = 140;
  const sugar = (x: number) => h - (0.1 + 0.8 / (1 + Math.exp(-(x - 0.45) * 9))) * h;
  const acid = (x: number) => h - (0.9 - 0.75 / (1 + Math.exp(-(x - 0.4) * 8))) * h;
  const path = (f: (x: number) => number, k: number) => Array.from({ length: Math.max(2, Math.round(60 * k)) + 1 }, (_, i) => `${i ? "L" : "M"} ${(i / 60) * w} ${f(i / 60)}`).join(" ");
  const ks = interpolate(t, [V.sugar - 0.3, V.sugar + 1.6], [0, 1], { ...clamp, easing: EASE });
  const ka = interpolate(t, [V.acid - 0.3, V.acid + 1.4], [0, 1], { ...clamp, easing: EASE });
  return (
    <AbsoluteFill>
      <Chapter t={t} n="03" title="Ripening" end={end} />
      <Panel t={t} start={V.summer + 0.2} end={end} top={SAFE.top + 60} title="As the grapes ripen">
        <svg width={w} height={h + 40} style={{ overflow: "visible" }}>
          {["Jul", "Aug", "Sep", "Oct"].map((m, i) => (
            <g key={m}>
              <line x1={(i / 3) * w} x2={(i / 3) * w} y1={0} y2={h} stroke="rgba(244,236,224,0.12)" />
              <text x={(i / 3) * w + (i === 3 ? -24 : i === 0 ? 24 : 0)} y={h + 32} fill="rgba(244,236,224,0.75)" textAnchor="middle" style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 28 }}>
                {m}
              </text>
            </g>
          ))}
          <rect x={0.72 * w} y={0} width={0.24 * w} height={h} fill="rgba(217,194,147,0.1)" opacity={vis(t, V.acid + 0.6, end)} />
          <path d={path(sugar, ks)} fill="none" stroke={C.goldLight} strokeWidth={3} />
          <path d={path(acid, ka)} fill="none" stroke={C.silver} strokeWidth={3} strokeDasharray="10 8" />
        </svg>
        <div style={{ display: "flex", gap: 40, marginTop: 14, fontFamily: SANS, fontWeight: 600, fontSize: 24, letterSpacing: "0.18em", textTransform: "uppercase" }}>
          <span style={{ color: C.goldLight, opacity: ks }}>Sugar ↑</span>
          <span style={{ color: C.silver, opacity: ka }}>Acidity ↓</span>
          <span style={{ color: C.ivory, opacity: 0.8 * vis(t, V.acid + 0.6, end) }}>Harvest</span>
        </div>
      </Panel>
      <Note t={t} shot="veraison" at="bunch" start={V.turn} end={end} title="Véraison" sub="the berries change colour" dy={160} />
    </AbsoluteFill>
  );
};

const Harvest: React.FC<P> = ({ t, d }) => {
  const Hh = B.harvest;
  const end = d - 0.35;
  return (
    <AbsoluteFill>
      <Chapter t={t} n="04" title="Harvest" end={end} />
      <Serif t={t} start={Hh.sept - 0.2} end={end} top={SAFE.top + 56} size={68}>
        September <span style={{ fontStyle: "italic", opacity: 0.8 }}>to</span> October
      </Serif>
      <Serif t={t} start={Hh.hand} end={end} top={SAFE.top + 150} size={34} italic>
        <span style={{ opacity: 0.85 }}>Often picked by hand</span>
      </Serif>
      <Note t={t} shot="harvest" at="crate" start={Hh.crates} end={end} title="Small crates" sub="berries arrive unbroken" dy={-120} />
    </AbsoluteFill>
  );
};

const Sorting: React.FC<P> = ({ t, d }) => {
  const S = B.sorting;
  const end = d - 0.3;
  const steps = [
    { k: "Sort", at: S.sort },
    { k: "Destem", at: S.destem },
    { k: "Crush", at: S.crush },
  ];
  return (
    <AbsoluteFill>
      <Chapter t={t} n="05" title="At the winery" end={end} />
      <div style={{ position: "absolute", left: SAFE.left, top: SAFE.top + 60, display: "flex", gap: 26, alignItems: "baseline", ...rise(vis(t, S.sort - 0.6, end)) }}>
        {steps.map((s, i) => {
          const on = interpolate(t, [s.at, s.at + 0.5], [0, 1], { ...clamp, easing: EASE });
          return (
            <React.Fragment key={s.k}>
              {i ? <span style={{ fontFamily: SERIF, fontSize: 40, color: C.goldLight, opacity: 0.6 }}>·</span> : null}
              <span style={{ fontFamily: SERIF, fontSize: 58, color: C.ivory, opacity: 0.35 + 0.65 * on, fontStyle: on > 0.5 ? "normal" : "italic", textShadow: soft }}>{s.k}</span>
            </React.Fragment>
          );
        })}
      </div>
      <Note t={t} shot="sorting" at="drum" start={S.destem} end={end} title="Destemmer" sub="stems out, berries through" dy={-150} />
    </AbsoluteFill>
  );
};

const Vat: React.FC<P> = ({ t, d }) => {
  const V = B.vat;
  const end = d + 0.2;
  const part = (at: number, f: string, label: string) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", ...rise(vis(t, at, end, 0.6)) }}>
      <div style={{ fontFamily: SERIF, fontSize: 40 }}>{f}</div>
      <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 19, letterSpacing: "0.18em", textTransform: "uppercase", color: C.goldLight, marginTop: 6 }}>{label}</div>
    </div>
  );
  return (
    <AbsoluteFill>
      <Chapter t={t} n="06" title="Fermentation" end={end} />
      <Panel t={t} start={V.yeast - 0.3} end={end} top={SAFE.top + 70} title="Yeast at work">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          {part(V.sugar, "C₆H₁₂O₆", "Sugar")}
          <div style={{ fontFamily: SERIF, fontSize: 40, opacity: vis(t, V.alcohol - 0.2, end) }}>→</div>
          {part(V.alcohol, "2 C₂H₅OH", "Alcohol")}
          <div style={{ fontFamily: SERIF, fontSize: 40, opacity: vis(t, V.co2 - 0.1, end) }}>+</div>
          {part(V.co2, "2 CO₂", "Carbon dioxide")}
        </div>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 31, opacity: 0.8 * vis(t, V.alcohol, end), marginTop: 22 }}>
          kept at about {Math.round(count(t, V.alcohol, 20, 28))} °C · typically 25–30 °C
        </div>
      </Panel>
      <Note t={t} shot="vat" at="cap" start={V.yeast + 0.3} end={end} title="Cap of skins" sub="floats on top" dy={-90} color={C.rose} />
      <Note t={t} shot="vat" at="must" start={V.yeast} end={end} title="Yeasts" sub="feed on the sugar" dy={120} />
    </AbsoluteFill>
  );
};

const Skins: React.FC<P> = ({ t, d }) => {
  const K = B.skins;
  const end = d - 0.3;
  const day = interpolate(t, [K.month, K.antho + 2.6], [0, 1], clamp);
  const ring = (k: number) => {
    const hex6 = (cx: number, cy: number, r: number) => Array.from({ length: 6 }, (_, i) => `${cx + r * Math.cos((Math.PI / 3) * i + Math.PI / 6)},${cy + r * Math.sin((Math.PI / 3) * i + Math.PI / 6)}`).join(" ");
    const L = 1200;
    return (
      <svg width={420} height={170} viewBox="0 0 420 180">
        <g fill="none" stroke={C.ivory} strokeOpacity={0.9} strokeWidth={2.5} strokeDasharray={L} strokeDashoffset={L * (1 - k)} strokeLinejoin="round">
          <polygon points={hex6(80, 100, 46)} />
          <polygon points={hex6(160, 100, 46)} />
          <line x1={200} y1={77} x2={250} y2={57} />
          <polygon points={hex6(290, 57, 46)} />
          <line x1={330} y1={34} x2={372} y2={14} />
          <line x1={330} y1={80} x2={372} y2={100} />
          <line x1={40} y1={123} x2={10} y2={150} />
        </g>
        <text x={182} y={150} fill={C.goldLight} opacity={k} style={{ fontFamily: SERIF, fontSize: 28 }}>O⁺</text>
        <text x={376} y={18} fill={C.ivory} opacity={k} style={{ fontFamily: SERIF, fontSize: 20 }}>OH</text>
        <text x={376} y={110} fill={C.ivory} opacity={k} style={{ fontFamily: SERIF, fontSize: 20 }}>OH</text>
        <text x={0} y={174} fill={C.ivory} opacity={k} style={{ fontFamily: SERIF, fontSize: 20 }}>HO</text>
      </svg>
    );
  };
  return (
    <AbsoluteFill>
      <Chapter t={t} n="06" title="Fermentation" end={end} />
      <div style={{ position: "absolute", left: SAFE.left, width: SAFE.right - SAFE.left, top: SAFE.top + 70, ...rise(vis(t, K.answer, K.month + 1.2, 1.0, 0.7)) }}>
        <Label>The answer</Label>
        <div style={{ fontFamily: SANS, fontWeight: 300, fontSize: 82, lineHeight: 1.05, color: C.ivory, marginTop: 18, textShadow: soft }}>
          The colour lives in the <span style={{ fontFamily: SERIF, fontStyle: "italic", color: C.goldLight }}>skins.</span>
        </div>
      </div>
      <Panel t={t} start={K.month + 0.9} end={end} top={SAFE.top + 70} title="Anthocyanins">
        {ring(interpolate(t, [K.antho - 0.2, K.antho + 1.4], [0, 1], { ...clamp, easing: EASE }))}
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 32, opacity: 0.88, marginTop: 6 }}>red-purple pigments from the skins</div>
        <div style={{ marginTop: 26, height: 10, background: "linear-gradient(90deg, #d8b8b8, #9a4a58, #5a1424, #2a0610)", position: "relative" }}>
          <div style={{ position: "absolute", left: `${day * 100}%`, top: -7, width: 2, height: 24, background: C.ivory, translate: "-50% 0" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: SERIF, fontStyle: "italic", fontSize: 28, marginTop: 10, opacity: 0.85 }}>
          <span>day 1</span>
          <span>day {Math.max(1, Math.round(day * 28))}</span>
          <span>up to a month</span>
        </div>
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 24, letterSpacing: "0.2em", textTransform: "uppercase", color: C.goldLight, marginTop: 18, opacity: vis(t, K.tannin, end) }}>+ Tannins</div>
      </Panel>
    </AbsoluteFill>
  );
};

const Press: React.FC<P> = ({ t, d }) => {
  const P2 = B.press;
  const end = d - 0.35;
  return (
    <AbsoluteFill>
      <Chapter t={t} n="07" title="Pressing" end={end} />
      <Panel t={t} start={P2.malo} end={end} top={SAFE.top + 70} title="Malolactic fermentation">
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <div>
            <div style={{ fontFamily: SERIF, fontSize: 40 }}>Malic acid</div>
            <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 30, opacity: 0.8 }}>sharp, green apple</div>
          </div>
          <div style={{ flex: 1, height: 1, background: C.goldLight, opacity: 0.7, position: "relative" }}>
            <div style={{ position: "absolute", right: -2, top: -11, fontFamily: SERIF, fontSize: 22, color: C.goldLight }}>›</div>
          </div>
          <div style={{ opacity: 0.35 + 0.65 * vis(t, P2.malic - 0.2, end) }}>
            <div style={{ fontFamily: SERIF, fontSize: 40 }}>Lactic acid</div>
            <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 30, opacity: 0.8 }}>softer, rounder</div>
          </div>
        </div>
      </Panel>
      <Note t={t} shot="press" at="basket" start={P2.press} end={end} title="Basket press" sub="the skins are squeezed" dy={110} />
      <Note t={t} shot="press" at="pool" start={P2.press + 0.8} end={end} title="New wine" dy={120} color={C.rose} />
    </AbsoluteFill>
  );
};

const Cellar: React.FC<P> = ({ t, d }) => {
  const CL = B.cellar;
  const end = d - 0.35;
  const mid = CL.oxygen - 1.0;
  const flav = ["Vanilla", "Toast", "Spice"];
  const flavAt = [CL.vanilla, CL.toast, CL.spice];
  return (
    <AbsoluteFill>
      <Chapter t={t} n="08" title="Ageing in oak" end={end} />
      <Panel t={t} start={CL.oak - 0.2} end={mid + 0.4} top={SAFE.top + 70} title="The Bordeaux barrique">
        <div style={{ display: "flex", gap: 60, alignItems: "flex-end" }}>
          <div>
            <div style={{ fontFamily: SERIF, fontSize: 84, lineHeight: 1 }}>
              {Math.round(count(t, CL.litres, 0, 225, 1.2))}
              <span style={{ fontSize: 36, opacity: 0.8 }}> L</span>
            </div>
            <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 22, letterSpacing: "0.2em", textTransform: "uppercase", color: C.goldLight, marginTop: 8 }}>French oak</div>
          </div>
          <div style={{ opacity: vis(t, CL.months - 0.2, end, 0.6) }}>
            <div style={{ fontFamily: SERIF, fontSize: 84, lineHeight: 1 }}>12–{Math.round(count(t, CL.months, 12, 24, 1.6))}</div>
            <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 22, letterSpacing: "0.2em", textTransform: "uppercase", color: C.goldLight, marginTop: 8 }}>Months</div>
          </div>
        </div>
      </Panel>
      <Note t={t} shot="cellar" at="oxygen" start={CL.oxygen} end={end} title="Oxygen" sub="seeps slowly through the wood" dy={-120} color={C.silver} />
      <Note t={t} shot="cellar" at="toast" start={CL.oxygen + 0.9} end={end} title="Toasted staves" sub="flavour from the barrel" dy={110} />
      <div style={{ position: "absolute", left: SAFE.left, top: SAFE.top + 60, ...rise(vis(t, CL.tannin, end)) }}>
        <Label>Softer tannins</Label>
        <div style={{ display: "flex", gap: 22, marginTop: 16 }}>
          {flav.map((f, i) => (
            <span key={f} style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 50, color: C.ivory, textShadow: soft, ...rise(vis(t, flavAt[i], end, 0.7)) }}>
              {f}
              {i < 2 ? <span style={{ color: C.goldLight, fontStyle: "normal" }}> ·</span> : null}
            </span>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const VC = ["#5A4A6A", "#8E3B4A", "#B98A7E"];
const VL = ["Cabernet Sauvignon", "Merlot", "Cabernet Franc"];
const Bar: React.FC<{ t: number; at: number; mix: number[]; label: string; color: string }> = ({ t, at, mix, label, color }) => (
  <div style={{ marginBottom: 26, ...rise(vis(t, at, 1e9, 0.6)) }}>
    <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 24, letterSpacing: "0.2em", textTransform: "uppercase", color, marginBottom: 12 }}>{label}</div>
    <div style={{ display: "flex", height: 14, background: "rgba(244,236,224,0.08)" }}>
      {mix.map((m, i) => (
        <div key={i} style={{ width: `${m * 100 * interpolate(t, [at + i * 0.2, at + i * 0.2 + 0.9], [0, 1], { ...clamp, easing: EASE })}%`, background: VC[i] }} />
      ))}
    </div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0 20px", marginTop: 10, fontFamily: SERIF, fontSize: 28, opacity: 0.9 }}>
      {mix.map((m, i) => (
        <span key={i}>
          {Math.round(m * 100)}% <span style={{ fontStyle: "italic", opacity: 0.8 }}>{VL[i]}</span>
        </span>
      ))}
    </div>
  </div>
);
const Blend: React.FC<P> = ({ t, d }) => {
  const BL = B.blend;
  const end = d - 0.35;
  return (
    <AbsoluteFill>
      <Chapter t={t} n="09" title="Assemblage" end={end} />
      <Serif t={t} start={BL.blend - 0.3} end={BL.left - 0.2} top={SAFE.top + 60} size={72} italic>
        The blend
      </Serif>
      <Panel t={t} start={BL.left - 0.2} end={end} top={SAFE.top + 70} title="Example blends">
        <Bar t={t} at={BL.left} mix={BLENDS.left} label="Left Bank" color={C.goldLight} />
        {t > BL.right - 0.4 ? <Bar t={t} at={BL.right} mix={BLENDS.right} label="Right Bank" color={C.rose} /> : null}
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 26, opacity: 0.65 }}>Illustrative: every château and every vintage differs.</div>
      </Panel>
    </AbsoluteFill>
  );
};

const Finale: React.FC<P> = ({ t, d }) => {
  const F = B.finale;
  const words = ["Sun", "soil", "skins", "and oak."];
  const at = [F.recap, F.recap + 0.42, F.recap + 0.85, F.recap + 1.35];
  const fade = interpolate(t, [d - 1.2, d], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <Chapter t={t} n="10" title="In the bottle" end={F.recap - 0.3} />
      <Panel t={t} start={F.decades - 0.2} end={F.recap - 0.2} top={SAFE.top + 70} title="Cellaring">
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontFamily: SERIF, fontSize: 34 }}>
          <span>2025</span>
          <div style={{ flex: 1, height: 1, background: C.goldLight, transformOrigin: "left", scale: `${interpolate(t, [F.decades, F.decades + 1.4], [0, 1], { ...clamp, easing: EASE })} 1` }} />
          <span style={{ fontStyle: "italic", opacity: vis(t, F.decades + 1.0, 1e9) }}>for decades</span>
        </div>
      </Panel>
      <div style={{ position: "absolute", left: SAFE.left, width: SAFE.right - SAFE.left, top: SAFE.top + 60, display: "flex", flexWrap: "wrap", gap: "0 18px", opacity: vis(t, F.recap - 0.1, F.endcard + 0.3, 0.6, 0.6) }}>
        {words.map((w, i) => (
          <span key={w} style={{ fontFamily: SERIF, fontStyle: i === 2 ? "italic" : "normal", fontSize: 76, color: i === 2 ? C.goldLight : C.ivory, textShadow: soft, ...rise(vis(t, at[i], 1e9, 0.7)) }}>
            {w}
            {i < 2 ? "," : ""}
          </span>
        ))}
      </div>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", background: `rgba(14,11,9,${0.45 * vis(t, F.endcard, 1e9, 1.2)})`, ...rise(vis(t, F.endcard, 1e9, 1.2)) }}>
        <Label align="center">That's the red of</Label>
        <div style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 150, letterSpacing: "0.04em", color: C.ivory, marginTop: 22, textShadow: soft }}>Bordeaux</div>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 44, color: C.ivory, opacity: 0.85 }}>from vine to glass</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const MAP: Record<string, React.FC<P>> = { hook: Hook, title: Title, map: Map, soil: Soil, grapes: Grapes, veraison: Ripening, harvest: Harvest, sorting: Sorting, vat: Vat, skins: Skins, press: Press, cellar: Cellar, blend: Blend, finale: Finale };

const ShotLayer: React.FC<{ id: string; d: number }> = ({ id, d }) => {
  const f = useCurrentFrame();
  const Comp = MAP[id];
  return Comp ? <Comp t={f / FPS} d={d} /> : null;
};

// Narration captions, one or two words at a time (the hook and the end card carry their own words).
// Each word group focuses in from a soft blur and settles; key terms are set in gold italic.
type Cap = { shot: string; start: number; end: number; words: { t: string; a: boolean }[] };
const Captions: React.FC = () => {
  const tg = useCurrentFrame() / FPS;
  const c = (captions as Cap[]).find((x) => tg >= x.start && tg < x.end);
  if (!c) return null;
  const fin = interpolate(tg, [c.start, c.start + 0.16], [0, 1], { ...clamp, easing: EASE });
  const fout = interpolate(tg, [c.end - 0.1, c.end], [1, 0], clamp);
  const v = Math.min(fin, fout);
  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        right: 60,
        top: SAFE.captionTop + 10,
        textAlign: "center",
        opacity: v,
        translate: `0px ${(1 - fin) * 10}px`,
        filter: `blur(${(1 - fin) * 5}px)`,
        fontFamily: SERIF,
        fontSize: 74,
        lineHeight: 1.1,
        letterSpacing: "0.005em",
        color: C.ivory,
        textShadow: "0 1px 2px rgba(0,0,0,0.5), 0 3px 24px rgba(0,0,0,0.5)",
        whiteSpace: "nowrap",
      }}
    >
      {c.words.map((w, i) => (
        <span key={i} style={w.a ? { fontStyle: "italic", color: C.goldLight } : undefined}>
          {i ? " " : ""}
          {w.t}
        </span>
      ))}
    </div>
  );
};

export const ReelsOverlays: React.FC = () => (
  <AbsoluteFill>
    {/* soft shades top and bottom keep type legible without hiding the picture */}
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(10,8,6,0.42) 0%, rgba(10,8,6,0) 30%, rgba(10,8,6,0) 62%, rgba(10,8,6,0.5) 86%, rgba(10,8,6,0.6) 100%)" }} />
    {SHOTS.map((s) => (
      <Sequence key={s.id} from={Math.round(s.start * FPS)} durationInFrames={Math.round((s.dur + 0.6) * FPS)} layout="none">
        <ShotLayer id={s.id} d={s.dur} />
      </Sequence>
    ))}
    <Captions />
  </AbsoluteFill>
);
