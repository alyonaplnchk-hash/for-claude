// Infographics for the 9:16 Reels cut in a modern product-film style: Inter Display, tight
// tracking, frosted rounded cards, pill labels, bold numbers and punchy one-to-two-word captions.
// Layout keeps clear of the Reels interface (top ~260 px, bottom ~420 px, right-hand icons).
import React from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame } from "remotion";
import { Engine } from "../engine/renderer";
import { buildShots } from "../scenes";
import { B } from "../beats";
import { FPS, SHOTS } from "../timeline";
import { BLENDS } from "../scenes/finale";
import captions from "../captions_words.json";

export const RW = 1080;
export const RH = 1920;
const DISPLAY = "'Inter Display', 'Inter', sans-serif";
const UI = "'Inter', 'Inter Display', sans-serif";
const C = {
  ink: "#1E1B1A",
  sub: "#6E6661",
  wine: "#8E2A3F",
  plum: "#4B2E50",
  rose: "#C98A96",
  sand: "#C79A55",
  blue: "#2F5874",
  white: "#FFFFFF",
};
const DARK_SHOTS = new Set(["skins"]);
const SAFE = { left: 72, right: 1008, top: 260, captionTop: 1360 };
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const EASE = Easing.bezier(0.16, 1, 0.3, 1);

const vis = (t: number, a: number, b = 1e9, fin = 0.55, fout = 0.35) =>
  Math.min(interpolate(t, [a, a + fin], [0, 1], { ...clamp, easing: EASE }), interpolate(t, [b - fout, b], [1, 0], { ...clamp, easing: Easing.in(Easing.cubic) }));
const pop = (v: number): React.CSSProperties => ({ opacity: v, translate: `0px ${(1 - v) * 24}px`, scale: String(0.96 + 0.04 * v) });

const shots = buildShots(true);
function anchor(shot: string, t: number, name: string) {
  const s = shots[shot];
  const a = s?.anchors?.(t)?.[name];
  if (!a) return null;
  const p = Engine.project(s.camera(t), a, RW, RH);
  if (!p.visible || p.x < 40 || p.x > RW - 40 || p.y < 200 || p.y > SAFE.captionTop - 40) return null;
  return p;
}

const glass = (dark = false): React.CSSProperties => ({
  background: dark ? "rgba(30,14,18,0.55)" : "rgba(255,255,255,0.72)",
  backdropFilter: "blur(24px) saturate(1.2)",
  border: dark ? "1px solid rgba(255,255,255,0.14)" : "1px solid rgba(255,255,255,0.9)",
  boxShadow: dark ? "0 24px 60px rgba(0,0,0,0.35)" : "0 24px 60px rgba(60,30,30,0.12), 0 2px 6px rgba(60,30,30,0.06)",
  borderRadius: 32,
});

// --- primitives
const Chip: React.FC<{ children: React.ReactNode; dark?: boolean; accent?: string }> = ({ children, dark, accent }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "12px 22px", borderRadius: 999, ...glass(dark), fontFamily: UI, fontWeight: 600, fontSize: 26, letterSpacing: "-0.01em", color: dark ? C.white : C.ink }}>
    {accent ? <span style={{ width: 10, height: 10, borderRadius: 10, background: accent }} /> : null}
    {children}
  </div>
);

const Chapter: React.FC<{ t: number; n: string; title: string; end: number; dark?: boolean }> = ({ t, n, title, end, dark }) => {
  const v = vis(t, 0.25, end);
  if (v <= 0) return null;
  return (
    <div style={{ position: "absolute", left: SAFE.left, top: SAFE.top, ...pop(v) }}>
      <Chip dark={dark}>
        <span style={{ color: dark ? "rgba(255,255,255,0.6)" : C.sub, fontVariantNumeric: "tabular-nums" }}>{n}</span>
        {title}
      </Chip>
    </div>
  );
};

const Headline: React.FC<{ t: number; start: number; end: number; top: number; size?: number; dark?: boolean; card?: boolean; children: React.ReactNode; align?: "left" | "center" }> = ({ t, start, end, top, size = 84, dark, card, children, align = "left" }) => {
  const v = vis(t, start, end);
  if (v <= 0) return null;
  return (
    <div style={{ position: "absolute", left: SAFE.left, width: SAFE.right - SAFE.left, top, textAlign: align, ...pop(v) }}>
      <div style={{ display: "inline-block", ...(card ? { ...glass(dark), padding: "30px 36px" } : {}), fontFamily: DISPLAY, fontWeight: 700, fontSize: size, lineHeight: 0.98, letterSpacing: "-0.035em", color: dark ? C.white : C.ink }}>{children}</div>
    </div>
  );
};

// Leader from a 3D point to a frosted label card; flips side to stay inside the frame.
const Note: React.FC<{ t: number; shot: string; at: string; start: number; end?: number; title: string; sub?: string; dy?: number; reach?: number; accent?: string; dark?: boolean }> = ({ t, shot, at, start, end = 1e9, title, sub, dy = -90, reach = 120, accent = C.wine, dark }) => {
  const a = anchor(shot, t, at);
  const v = vis(t, start, end);
  if (!a || v <= 0) return null;
  const estW = Math.max(title.length * 17, (sub ?? "").length * 12.5) + 48;
  const right = a.x + reach + estW < SAFE.right + 20 ? true : a.x - reach - estW > SAFE.left - 10 ? false : a.x < RW / 2;
  const ey = Math.max(SAFE.top + 200, Math.min(SAFE.captionTop - 120, a.y + dy));
  const lx = a.x + (right ? 1 : -1) * reach;
  const len = Math.hypot(lx - a.x, ey - a.y);
  const draw = interpolate(t, [start, start + 0.5], [0, 1], { ...clamp, easing: EASE });
  const txt = vis(t, start + 0.2, end);
  const line = dark ? "rgba(255,255,255,0.85)" : "rgba(30,27,26,0.75)";
  return (
    <div style={{ position: "absolute", inset: 0, opacity: v }}>
      <svg width={RW} height={RH} style={{ position: "absolute", inset: 0 }}>
        <line x1={a.x} y1={a.y} x2={lx} y2={ey} stroke={line} strokeWidth={2.5} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
        <circle cx={a.x} cy={a.y} r={11} fill="#fff" />
        <circle cx={a.x} cy={a.y} r={7} fill={accent} />
      </svg>
      <div style={{ position: "absolute", top: ey - 36, left: right ? lx + 8 : undefined, right: right ? undefined : RW - lx + 8, whiteSpace: "nowrap", ...pop(txt) }}>
        <div style={{ ...glass(dark), borderRadius: 20, padding: "14px 22px" }}>
          <div style={{ fontFamily: UI, fontWeight: 700, fontSize: 28, letterSpacing: "-0.015em", color: dark ? C.white : C.ink }}>{title}</div>
          {sub ? <div style={{ fontFamily: UI, fontWeight: 450, fontSize: 22, color: dark ? "rgba(255,255,255,0.75)" : C.sub, marginTop: 2 }}>{sub}</div> : null}
        </div>
      </div>
    </div>
  );
};

const Tag: React.FC<{ t: number; shot: string; at: string; start: number; end?: number; text: string; dy?: number; accent?: string }> = ({ t, shot, at, start, end = 1e9, text, dy = -40, accent }) => {
  const a = anchor(shot, t, at);
  const v = vis(t, start, end);
  if (!a || v <= 0) return null;
  return (
    <div style={{ position: "absolute", left: Math.max(170, Math.min(RW - 170, a.x)), top: Math.min(a.y + dy, SAFE.captionTop - 80), translate: "-50% -50%", whiteSpace: "nowrap", ...pop(v) }}>
      <Chip accent={accent}>{text}</Chip>
    </div>
  );
};

const Card: React.FC<{ t: number; start: number; end: number; top: number; title?: string; dark?: boolean; children: React.ReactNode }> = ({ t, start, end, top, title, dark, children }) => {
  const v = vis(t, start, end);
  if (v <= 0) return null;
  return (
    <div style={{ position: "absolute", left: SAFE.left, width: SAFE.right - SAFE.left, top, ...glass(dark), padding: "34px 38px", color: dark ? C.white : C.ink, ...pop(v) }}>
      {title ? <div style={{ fontFamily: UI, fontWeight: 600, fontSize: 26, letterSpacing: "-0.01em", color: dark ? "rgba(255,255,255,0.7)" : C.sub, marginBottom: 22 }}>{title}</div> : null}
      {children}
    </div>
  );
};

const count = (t: number, a: number, from: number, to: number, d = 1.2) => from + (to - from) * interpolate(t, [a, a + d], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
const Big: React.FC<{ children: React.ReactNode; size?: number; color?: string }> = ({ children, size = 104, color }) => (
  <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: size, lineHeight: 0.95, letterSpacing: "-0.045em", color, fontVariantNumeric: "tabular-nums" }}>{children}</div>
);
const Small: React.FC<{ children: React.ReactNode; dark?: boolean }> = ({ children, dark }) => <div style={{ fontFamily: UI, fontWeight: 500, fontSize: 24, color: dark ? "rgba(255,255,255,0.7)" : C.sub, marginTop: 8 }}>{children}</div>;

type P = { t: number; d: number };

// ---------------------------------------------------------------- shots
const Hook: React.FC<P> = ({ t, d }) => {
  const h = B.hook;
  return (
    <AbsoluteFill>
      <Headline t={t} start={h.squeeze} end={h.clear - 0.05} top={1120} size={88} card>
        Squeeze a<br />red grape…
      </Headline>
      <Headline t={t} start={h.clear} end={h.question - 0.15} top={1120} size={88} card>
        …the juice
        <br />
        runs <span style={{ color: C.blue }}>clear.</span>
      </Headline>
      <Note t={t} shot="hook" at="drop" start={h.clear + 0.3} end={h.question - 0.15} title="Grape juice" sub="colourless, even from red grapes" dy={-60} accent={C.blue} />
      <Headline t={t} start={h.question} end={d + 0.4} top={1060} size={92} card>
        So where does
        <br />
        the <span style={{ color: C.wine }}>red</span> come from?
      </Headline>
    </AbsoluteFill>
  );
};

const Title: React.FC<P> = ({ t, d }) => {
  const v = vis(t, 0.4, d + 0.3, 0.8, 0.4);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", ...pop(v) }}>
      <Chip>How red wine is made</Chip>
      <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 176, letterSpacing: "-0.055em", color: C.ink, marginTop: 26, lineHeight: 0.9 }}>Bordeaux</div>
      <div style={{ fontFamily: UI, fontWeight: 500, fontSize: 36, color: C.sub, marginTop: 18 }}>From vine to glass</div>
    </AbsoluteFill>
  );
};

const Map: React.FC<P> = ({ t, d }) => {
  const M = B.map;
  const end = d - 0.5;
  return (
    <AbsoluteFill>
      <Chapter t={t} n="01" title="Terroir" end={end} />
      <Headline t={t} start={0.5} end={M.lat45 - 0.2} top={360} size={76}>
        Bordeaux,
        <br />
        <span style={{ color: C.sub }}>south-west France</span>
      </Headline>
      <Note t={t} shot="map" at="bordeaux" start={M.france + 0.4} end={M.lat45 + 2.4} title="Bordeaux" sub="44°50′ N · 0°34′ W" dy={-140} accent={C.ink} />
      <Tag t={t} shot="map" at="lat45" start={M.lat45} end={end} text="45° N" />
      <Tag t={t} shot="map" at="garonne" start={M.garonne} end={end} text="Garonne" accent={C.blue} />
      <Tag t={t} shot="map" at="dordogne" start={M.dordogne} end={end} text="Dordogne" accent={C.blue} />
      <Note t={t} shot="map" at="gironde" start={M.gironde + 0.2} end={M.left - 0.2} title="Gironde estuary" dy={-120} accent={C.blue} />
      <Note t={t} shot="map" at="leftbank" start={M.left} end={end} title="Left Bank" sub="Médoc · Graves" dy={140} accent={C.sand} />
      <Note t={t} shot="map" at="rightbank" start={M.right} end={end} title="Right Bank" sub="Saint-Émilion · Pomerol" dy={-150} accent={C.wine} />
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
      <Headline t={t} start={0.4} end={mid} top={350} size={78}>
        Left Bank
        <br />
        <span style={{ color: C.sand }}>gravel</span>
      </Headline>
      <Note t={t} shot="soil" at="gravel" start={S.gravel} end={mid} title="Drains fast" sub="rain runs straight through" dy={-40} accent={C.blue} />
      <Note t={t} shot="soil" at="heat" start={S.heat} end={mid} title="Stores heat" sub="warm stones ripen the grapes" dy={-60} accent={C.sand} />
      <Note t={t} shot="soil" at="roots" start={S.gravel + 1.2} end={mid} title="Deep roots" dy={60} accent={C.ink} />
      <Headline t={t} start={S.right} end={end} top={350} size={78}>
        Right Bank
        <br />
        <span style={{ color: C.wine }}>clay & limestone</span>
      </Headline>
      <Note t={t} shot="soil" at="clay" start={S.clay} end={end} title="Clay" sub="cool, holds water" dy={-50} accent={C.wine} />
      <Note t={t} shot="soil" at="limestone" start={S.clay + 0.5} end={end} title="Limestone" dy={70} accent={C.ink} />
    </AbsoluteFill>
  );
};

const DONUT = [
  { label: "Merlot", v: 62, c: C.wine },
  { label: "Cab. Sauvignon", v: 25, c: C.plum },
  { label: "Cab. Franc", v: 11, c: C.rose },
  { label: "Others", v: 2, c: C.sand },
];
const Grapes: React.FC<P> = ({ t, d }) => {
  const G = B.grapes;
  const end = d - 0.35;
  const R = 76, sw = 22, Cc = 2 * Math.PI * R;
  let acc = 0;
  const st = G.merlot + 0.5;
  return (
    <AbsoluteFill>
      <Chapter t={t} n="02" title="The grapes" end={end} />
      <Card t={t} start={G.merlot + 0.2} end={end} top={SAFE.top + 84} title="Red vines in Bordeaux">
        <div style={{ display: "flex", alignItems: "center", gap: 38 }}>
          <svg width={196} height={196} viewBox="-98 -98 196 196">
            <circle r={R} fill="none" stroke="rgba(30,27,26,0.07)" strokeWidth={sw} />
            {DONUT.map((s, i) => {
              const g = interpolate(t, [st + i * 0.22, st + i * 0.22 + 0.8], [0, 1], { ...clamp, easing: EASE });
              const seg = Math.max(0, (s.v / 100) * Cc * g - 6);
              const el = <circle key={s.label} r={R} fill="none" stroke={s.c} strokeWidth={sw} strokeLinecap="round" strokeDasharray={`${seg} ${Cc}`} strokeDashoffset={-acc - 3} transform="rotate(-90)" />;
              acc += (s.v / 100) * Cc;
              return el;
            })}
            <text textAnchor="middle" y={14} fill={C.ink} style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 44, letterSpacing: "-0.04em" }}>
              {Math.round(count(t, st, 0, 62))}%
            </text>
          </svg>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {DONUT.map((s, i) => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 14, opacity: vis(t, st + 0.25 + i * 0.2, end) }}>
                <div style={{ width: 14, height: 14, borderRadius: 14, background: s.c }} />
                <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 30, width: 80, letterSpacing: "-0.02em" }}>{s.v}%</div>
                <div style={{ fontFamily: UI, fontWeight: 500, fontSize: 26, color: C.sub }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>
      <Tag t={t} shot="grapes" at="merlot" start={G.merlot} end={end} text="Merlot" dy={70} accent={C.wine} />
      <Tag t={t} shot="grapes" at="cs" start={G.cs} end={end} text="Cabernet Sauvignon" dy={70} accent={C.plum} />
      <Tag t={t} shot="grapes" at="cf" start={G.cf} end={end} text="Cabernet Franc" dy={70} accent={C.rose} />
    </AbsoluteFill>
  );
};

const Ripening: React.FC<P> = ({ t, d }) => {
  const V = B.veraison;
  const end = d - 0.3;
  const w = 860, h = 150;
  const sugar = (x: number) => h - (0.1 + 0.8 / (1 + Math.exp(-(x - 0.45) * 9))) * h;
  const acid = (x: number) => h - (0.9 - 0.75 / (1 + Math.exp(-(x - 0.4) * 8))) * h;
  const path = (f: (x: number) => number, k: number) => Array.from({ length: Math.max(2, Math.round(60 * k)) + 1 }, (_, i) => `${i ? "L" : "M"} ${(i / 60) * w} ${f(i / 60)}`).join(" ");
  const ks = interpolate(t, [V.sugar - 0.3, V.sugar + 1.4], [0, 1], { ...clamp, easing: EASE });
  const ka = interpolate(t, [V.acid - 0.3, V.acid + 1.2], [0, 1], { ...clamp, easing: EASE });
  return (
    <AbsoluteFill>
      <Chapter t={t} n="03" title="Ripening" end={end} />
      <Card t={t} start={V.summer + 0.2} end={end} top={SAFE.top + 84} title="Jul → Oct">
        <svg width={w} height={h + 12} style={{ overflow: "visible" }}>
          <rect x={0.72 * w} y={-6} width={0.26 * w} height={h + 12} rx={14} fill="rgba(142,42,63,0.08)" opacity={vis(t, V.acid + 0.6, end)} />
          <path d={path(sugar, ks)} fill="none" stroke={C.wine} strokeWidth={7} strokeLinecap="round" />
          <path d={path(acid, ka)} fill="none" stroke={C.blue} strokeWidth={7} strokeLinecap="round" />
        </svg>
        <div style={{ display: "flex", gap: 14, marginTop: 20 }}>
          <span style={{ opacity: ks }}>
            <Chip accent={C.wine}>Sugar ↑</Chip>
          </span>
          <span style={{ opacity: ka }}>
            <Chip accent={C.blue}>Acidity ↓</Chip>
          </span>
          <span style={{ opacity: vis(t, V.acid + 0.6, end) }}>
            <Chip>Harvest</Chip>
          </span>
        </div>
      </Card>
      <Note t={t} shot="veraison" at="bunch" start={V.turn} end={end} title="Véraison" sub="green turns to purple" dy={170} accent={C.plum} />
    </AbsoluteFill>
  );
};

const Harvest: React.FC<P> = ({ t, d }) => {
  const Hh = B.harvest;
  const end = d - 0.35;
  return (
    <AbsoluteFill>
      <Chapter t={t} n="04" title="Harvest" end={end} />
      <Headline t={t} start={Hh.sept - 0.2} end={end} top={350} size={88}>
        September
        <br />
        <span style={{ color: C.sub }}>→ October</span>
      </Headline>
      <div style={{ position: "absolute", left: SAFE.left, top: 560, ...pop(vis(t, Hh.hand, end)) }}>
        <Chip accent={C.wine}>Picked by hand</Chip>
      </div>
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
      <Chapter t={t} n="05" title="Winery" end={end} />
      <div style={{ position: "absolute", left: SAFE.left, top: 360, display: "flex", gap: 14, ...pop(vis(t, S.sort - 0.4, end)) }}>
        {steps.map((s, i) => {
          const on = interpolate(t, [s.at, s.at + 0.35], [0, 1], { ...clamp, easing: EASE });
          return (
            <div key={s.k} style={{ padding: "18px 28px", borderRadius: 999, background: on > 0.5 ? C.ink : "rgba(255,255,255,0.72)", color: on > 0.5 ? C.white : C.sub, fontFamily: UI, fontWeight: 700, fontSize: 32, letterSpacing: "-0.01em", backdropFilter: "blur(20px)", boxShadow: "0 12px 30px rgba(60,30,30,0.1)" }}>
              {i + 1}. {s.k}
            </div>
          );
        })}
      </div>
      <Note t={t} shot="sorting" at="drum" start={S.destem} end={end} title="Destemmer" sub="stems out, berries through" dy={-160} />
    </AbsoluteFill>
  );
};

const Vat: React.FC<P> = ({ t, d }) => {
  const V = B.vat;
  const end = d + 0.2;
  const part = (at: number, f: string, label: string, col: string) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", ...pop(vis(t, at, end, 0.45)) }}>
      <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 44, letterSpacing: "-0.03em", color: col }}>{f}</div>
      <div style={{ fontFamily: UI, fontWeight: 500, fontSize: 22, color: C.sub, marginTop: 6 }}>{label}</div>
    </div>
  );
  return (
    <AbsoluteFill>
      <Chapter t={t} n="06" title="Fermentation" end={end} />
      <Card t={t} start={V.yeast - 0.3} end={end} top={SAFE.top + 84} title="Yeast at work">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          {part(V.sugar, "C₆H₁₂O₆", "sugar", C.ink)}
          <div style={{ fontFamily: DISPLAY, fontSize: 44, color: C.sub, opacity: vis(t, V.alcohol - 0.2, end) }}>→</div>
          {part(V.alcohol, "C₂H₅OH", "alcohol", C.wine)}
          <div style={{ fontFamily: DISPLAY, fontSize: 44, color: C.sub, opacity: vis(t, V.co2 - 0.1, end) }}>+</div>
          {part(V.co2, "CO₂", "carbon dioxide", C.blue)}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 26, opacity: vis(t, V.alcohol, end) }}>
          <Big size={64}>{Math.round(count(t, V.alcohol, 20, 28))}°C</Big>
          <Small>typically 25–30°C</Small>
        </div>
      </Card>
      <Note t={t} shot="vat" at="cap" start={V.yeast + 0.3} end={end} title="Cap of skins" sub="floats on top" dy={-60} accent={C.plum} />
      <Note t={t} shot="vat" at="must" start={V.yeast} end={end} title="Yeasts" sub="feed on the sugar" dy={130} accent={C.sand} />
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
        <g fill="none" stroke="#fff" strokeWidth={4} strokeDasharray={L} strokeDashoffset={L * (1 - k)} strokeLinejoin="round" strokeLinecap="round">
          <polygon points={hex6(80, 100, 46)} />
          <polygon points={hex6(160, 100, 46)} />
          <line x1={200} y1={77} x2={250} y2={57} />
          <polygon points={hex6(290, 57, 46)} />
          <line x1={330} y1={34} x2={372} y2={14} />
          <line x1={330} y1={80} x2={372} y2={100} />
          <line x1={40} y1={123} x2={10} y2={150} />
        </g>
        <text x={182} y={152} fill={C.rose} opacity={k} style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 30 }}>O⁺</text>
        <text x={376} y={18} fill="#fff" opacity={k} style={{ fontFamily: UI, fontWeight: 600, fontSize: 20 }}>OH</text>
        <text x={376} y={110} fill="#fff" opacity={k} style={{ fontFamily: UI, fontWeight: 600, fontSize: 20 }}>OH</text>
        <text x={0} y={174} fill="#fff" opacity={k} style={{ fontFamily: UI, fontWeight: 600, fontSize: 20 }}>HO</text>
      </svg>
    );
  };
  return (
    <AbsoluteFill>
      <Chapter t={t} n="06" title="Fermentation" end={end} dark />
      <Headline t={t} start={K.answer} end={K.month + 1.0} top={360} size={104} dark>
        The colour
        <br />
        lives in the <span style={{ color: C.rose }}>skins.</span>
      </Headline>
      <Card t={t} start={K.month + 0.8} end={end} top={SAFE.top + 84} title="Anthocyanins" dark>
        {ring(interpolate(t, [K.antho - 0.2, K.antho + 1.2], [0, 1], { ...clamp, easing: EASE }))}
        <Small dark>red–purple pigments from the skins</Small>
        <div style={{ marginTop: 26, height: 14, borderRadius: 14, background: "linear-gradient(90deg, #E9C9CF, #C98A96, #8E2A3F, #3A0A14)", position: "relative" }}>
          <div style={{ position: "absolute", left: `${day * 100}%`, top: -8, width: 30, height: 30, borderRadius: 30, background: "#fff", translate: "-50% 0", boxShadow: "0 4px 14px rgba(0,0,0,0.3)" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: UI, fontWeight: 600, fontSize: 24, marginTop: 14, color: "rgba(255,255,255,0.75)" }}>
          <span>Day 1</span>
          <span style={{ color: "#fff" }}>Day {Math.max(1, Math.round(day * 28))}</span>
          <span>~28</span>
        </div>
        <div style={{ marginTop: 20, opacity: vis(t, K.tannin, end) }}>
          <Chip dark accent={C.sand}>
            + Tannins
          </Chip>
        </div>
      </Card>
    </AbsoluteFill>
  );
};

const Press: React.FC<P> = ({ t, d }) => {
  const P2 = B.press;
  const end = d - 0.35;
  const k = vis(t, P2.malic - 0.2, end);
  return (
    <AbsoluteFill>
      <Chapter t={t} n="07" title="Pressing" end={end} />
      <Card t={t} start={P2.malo} end={end} top={SAFE.top + 84} title="Malolactic fermentation">
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div>
            <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 44, letterSpacing: "-0.03em" }}>Malic</div>
            <Small>sharp, green apple</Small>
          </div>
          <div style={{ flex: 1, height: 4, borderRadius: 4, background: `linear-gradient(90deg, ${C.blue}, ${C.wine})` }} />
          <div style={{ opacity: 0.35 + 0.65 * k }}>
            <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 44, letterSpacing: "-0.03em", color: C.wine }}>Lactic</div>
            <Small>softer, rounder</Small>
          </div>
        </div>
      </Card>
      <Note t={t} shot="press" at="basket" start={P2.press} end={end} title="Basket press" sub="the skins are squeezed" dy={110} accent={C.sand} />
      <Note t={t} shot="press" at="pool" start={P2.press + 0.8} end={end} title="New wine" dy={120} />
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
      <Chapter t={t} n="08" title="Oak ageing" end={end} />
      <Card t={t} start={CL.oak - 0.2} end={mid + 0.4} top={SAFE.top + 84} title="The Bordeaux barrique">
        <div style={{ display: "flex", gap: 56, alignItems: "flex-end" }}>
          <div>
            <Big>
              {Math.round(count(t, CL.litres, 0, 225, 1.1))}
              <span style={{ fontSize: 48, color: C.sub }}> L</span>
            </Big>
            <Small>French oak</Small>
          </div>
          <div style={{ opacity: vis(t, CL.months - 0.2, end, 0.4) }}>
            <Big color={C.wine}>12–{Math.round(count(t, CL.months, 12, 24, 1.4))}</Big>
            <Small>months</Small>
          </div>
        </div>
      </Card>
      <Note t={t} shot="cellar" at="oxygen" start={CL.oxygen} end={end} title="Oxygen" sub="seeps slowly through the wood" dy={-130} accent={C.blue} />
      <Note t={t} shot="cellar" at="toast" start={CL.oxygen + 0.9} end={end} title="Toasted staves" sub="flavour from the barrel" dy={110} accent={C.sand} />
      <div style={{ position: "absolute", left: SAFE.left, top: SAFE.top + 90, display: "flex", flexWrap: "wrap", gap: 12, maxWidth: 900 }}>
        <div style={{ ...pop(vis(t, CL.tannin, end)) }}>
          <Chip accent={C.ink}>Softer tannins</Chip>
        </div>
        {flav.map((f, i) => (
          <div key={f} style={{ ...pop(vis(t, flavAt[i], end, 0.4)) }}>
            <Chip accent={[C.sand, "#8A5A3A", C.wine][i]}>{f}</Chip>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const VC = [C.plum, C.wine, C.rose];
const VL = ["Cab. Sauvignon", "Merlot", "Cab. Franc"];
const Bar: React.FC<{ t: number; at: number; mix: number[]; label: string; accent: string }> = ({ t, at, mix, label, accent }) => (
  <div style={{ marginBottom: 28, ...pop(vis(t, at, 1e9, 0.45)) }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: UI, fontWeight: 700, fontSize: 30, letterSpacing: "-0.015em", marginBottom: 14 }}>
      <span style={{ width: 12, height: 12, borderRadius: 12, background: accent }} />
      {label}
    </div>
    <div style={{ display: "flex", gap: 6, height: 26 }}>
      {mix.map((m, i) => (
        <div key={i} style={{ width: `${m * 100 * interpolate(t, [at + i * 0.15, at + i * 0.15 + 0.7], [0, 1], { ...clamp, easing: EASE })}%`, background: VC[i], borderRadius: 13 }} />
      ))}
    </div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 22px", marginTop: 12, fontFamily: UI, fontWeight: 500, fontSize: 24, color: C.sub }}>
      {mix.map((m, i) => (
        <span key={i}>
          <b style={{ color: C.ink, fontWeight: 700 }}>{Math.round(m * 100)}%</b> {VL[i]}
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
      <Headline t={t} start={BL.blend - 0.3} end={BL.left - 0.2} top={360} size={104}>
        The <span style={{ color: C.wine }}>blend.</span>
      </Headline>
      <Card t={t} start={BL.left - 0.2} end={end} top={SAFE.top + 84} title="Example blends">
        <Bar t={t} at={BL.left} mix={BLENDS.left} label="Left Bank" accent={C.sand} />
        {t > BL.right - 0.4 ? <Bar t={t} at={BL.right} mix={BLENDS.right} label="Right Bank" accent={C.wine} /> : null}
        <Small>Illustrative. Every château and vintage differs.</Small>
      </Card>
    </AbsoluteFill>
  );
};

const Finale: React.FC<P> = ({ t, d }) => {
  const F = B.finale;
  const words = ["Sun.", "Soil.", "Skins.", "Oak."];
  const at = [F.recap, F.recap + 0.42, F.recap + 0.85, F.recap + 1.35];
  const fade = interpolate(t, [d - 1.0, d], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <Chapter t={t} n="10" title="In the bottle" end={F.recap - 0.3} />
      <Card t={t} start={F.decades - 0.2} end={F.recap - 0.2} top={SAFE.top + 84} title="Cellaring">
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Big size={64}>2025</Big>
          <div style={{ flex: 1, height: 4, borderRadius: 4, background: `linear-gradient(90deg, ${C.sand}, ${C.wine})`, transformOrigin: "left", scale: `${interpolate(t, [F.decades, F.decades + 1.2], [0, 1], { ...clamp, easing: EASE })} 1` }} />
          <div style={{ opacity: vis(t, F.decades + 0.9, 1e9) }}>
            <Big size={64} color={C.wine}>
              +decades
            </Big>
          </div>
        </div>
      </Card>
      <div style={{ position: "absolute", left: SAFE.left, top: 340, display: "flex", flexDirection: "column", gap: 0, opacity: vis(t, F.recap - 0.1, F.endcard + 0.2, 0.3, 0.4) }}>
        {words.map((w, i) => (
          <div key={w} style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 112, lineHeight: 0.95, letterSpacing: "-0.05em", color: i === 2 ? C.wine : C.ink, ...pop(vis(t, at[i], 1e9, 0.4)) }}>
            {w}
          </div>
        ))}
      </div>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", background: `rgba(236,230,223,${0.82 * vis(t, F.endcard, 1e9, 0.8)})`, ...pop(vis(t, F.endcard, 1e9, 0.8)) }}>
        <Chip>That's the red of</Chip>
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 176, letterSpacing: "-0.055em", color: C.ink, marginTop: 26, lineHeight: 0.9 }}>Bordeaux</div>
        <div style={{ fontFamily: UI, fontWeight: 500, fontSize: 36, color: C.sub, marginTop: 18 }}>From vine to glass</div>
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

// Captions: one or two words at a time, bold display type with a quick, soft pop.
type Cap = { shot: string; start: number; end: number; words: { t: string; a: boolean }[] };
const Captions: React.FC = () => {
  const tg = useCurrentFrame() / FPS;
  const c = (captions as Cap[]).find((x) => tg >= x.start && tg < x.end);
  if (!c) return null;
  const dark = DARK_SHOTS.has(c.shot);
  const fin = interpolate(tg, [c.start, c.start + 0.14], [0, 1], { ...clamp, easing: EASE });
  const fout = interpolate(tg, [c.end - 0.08, c.end], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: SAFE.captionTop, textAlign: "center", opacity: Math.min(fin, fout), scale: String(0.92 + 0.08 * fin) }}>
      <div
        style={{
          display: "inline-block",
          ...glass(dark),
          borderRadius: 999,
          padding: "16px 40px 22px",
          fontFamily: DISPLAY,
          fontWeight: 800,
          fontSize: 84,
          lineHeight: 1,
          letterSpacing: "-0.04em",
          color: dark ? C.white : C.ink,
          whiteSpace: "nowrap",
        }}
      >
        {c.words.map((w, i) => (
          <span key={i} style={w.a ? { color: dark ? C.rose : C.wine } : undefined}>
            {i ? " " : ""}
            {w.t}
          </span>
        ))}
      </div>
    </div>
  );
};

export const ReelsOverlays: React.FC = () => (
  <AbsoluteFill>
    {SHOTS.map((s) => (
      <Sequence key={s.id} from={Math.round(s.start * FPS)} durationInFrames={Math.round((s.dur + 0.6) * FPS)} layout="none">
        <ShotLayer id={s.id} d={s.dur} />
      </Sequence>
    ))}
    <Captions />
  </AbsoluteFill>
);
