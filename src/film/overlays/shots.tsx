// Per-shot infographics. Each component receives the shot-local time in seconds.
import React from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame } from "remotion";
import { B } from "../beats";
import { FPS, SHOTS, shotById } from "../timeline";
import { BLENDS } from "../scenes/finale";
import { Callout, Card, Chip, COL, Counter, DISPLAY, env, Kicker, MONO, Pin, ramp, SANS, SERIF, shadow, Stepper } from "./ui";

type P = { t: number; d: number };
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---------- HOOK: loud, bright kinetic type
const Word: React.FC<{ t: number; at: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ t, at, children, style }) => {
  const k = interpolate(t, [at, at + 0.22], [0, 1], { ...clamp, easing: Easing.bezier(0.2, 1.6, 0.4, 1) });
  return <span style={{ display: "inline-block", opacity: Math.min(1, k * 1.5), scale: String(0.4 + 0.6 * k), translate: `0px ${(1 - k) * 40}px`, marginRight: "0.28em", ...style }}>{children}</span>;
};
const Hook: React.FC<P> = ({ t, d }) => {
  const h = B.hook;
  const l1 = env(t, h.squeeze, h.question - 0.15, 0.2, 0.25);
  const l2 = env(t, h.question, d + 0.3, 0.2, 0.4);
  const big: React.CSSProperties = { fontFamily: DISPLAY, fontWeight: 900, fontSize: 118, lineHeight: 0.98, color: "#fff", textShadow: "0 6px 40px rgba(80,0,60,0.55)", letterSpacing: "-0.01em" };
  return (
    <AbsoluteFill>
      {l1 > 0 && (
        <div style={{ position: "absolute", left: 110, top: 150, opacity: l1, ...big }}>
          <div>
            <Word t={t} at={h.squeeze}>SQUEEZE</Word>
            <Word t={t} at={h.squeeze + 0.2}>A</Word>
            <Word t={t} at={h.squeeze + 0.3} style={{ color: "#3b0a5e", WebkitTextStroke: "0px", textShadow: "0 0 30px rgba(255,255,255,0.6)" }}>RED</Word>
            <Word t={t} at={h.squeeze + 0.45}>GRAPE…</Word>
          </div>
          <div style={{ marginTop: 26 }}>
            <Word t={t} at={h.clear} style={{ fontSize: 86 }}>…THE JUICE RUNS</Word>
            <Word t={t} at={h.clear + 0.55} style={{ fontSize: 86, color: "transparent", WebkitTextStroke: "3px #fff", textShadow: "0 0 30px rgba(180,240,255,0.9)" }}>
              CLEAR
            </Word>
          </div>
        </div>
      )}
      <Callout t={t} shot="hook" at="drop" start={h.clear + 0.3} end={h.question - 0.1} dx={260} dy={40} title="GRAPE JUICE" sub="colourless — even from red grapes" color="#ffffff" size={36} />
      {l2 > 0 && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 150, textAlign: "center", opacity: l2, ...big, fontSize: 112 }}>
          <div>
            <Word t={t} at={h.question}>SO</Word>
            <Word t={t} at={h.question + 0.14}>WHERE</Word>
            <Word t={t} at={h.question + 0.3}>DOES</Word>
            <Word t={t} at={h.question + 0.42}>THE</Word>
            <Word t={t} at={h.ruby} style={{ background: "linear-gradient(180deg,#ff6a88,#c3002f)", WebkitBackgroundClip: "text", color: "transparent", textShadow: "none", filter: "drop-shadow(0 6px 24px rgba(120,0,30,0.6))" }}>
              RED
            </Word>
            <Word t={t} at={h.ruby + 0.25}>COME FROM?</Word>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---------- TITLE
const Title: React.FC<P> = ({ t, d }) => {
  const v = env(t, 0.25, d + 0.2, 0.6, 0.5);
  const sp = interpolate(t, [0.2, 2.8], [0.5, 0.22], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: v }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 30, fontWeight: 700, letterSpacing: "0.5em", color: COL.gold, opacity: ramp(t, 0.5, 0.6), textShadow: shadow }}>HOW RED WINE IS MADE</div>
      <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 210, letterSpacing: `${sp}em`, color: "#fff", marginTop: 14, marginRight: `-${sp}em`, textShadow: "0 10px 60px rgba(60,0,20,0.7)" }}>BORDEAUX</div>
      <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 50, color: "rgba(255,255,255,0.92)", opacity: ramp(t, 1.0, 0.7), textShadow: shadow }}>from vine to glass</div>
    </AbsoluteFill>
  );
};

// ---------- MAP
const Map: React.FC<P> = ({ t, d }) => {
  const M = B.map;
  const end = d - 0.5;
  const coordV = env(t, M.france, end);
  return (
    <AbsoluteFill>
      <Kicker t={t} n="01" label="TERROIR" end={end} />
      <Pin t={t} shot="map" at="atlantic" start={0.6} end={end} text="Atlantic Ocean" italic size={40} color="rgba(190,225,255,0.95)" />
      <Callout t={t} shot="map" at="bordeaux" start={M.france + 0.1} end={end} dx={210} dy={110} title="BORDEAUX" sub="south-west France" color="#ffffff" size={40} />
      <Pin t={t} shot="map" at="lat45" start={M.lat45} end={end} text="45° N" size={34} color="#ffffff" dy={-18} />
      <Pin t={t} shot="map" at="garonne" start={M.garonne} end={end} text="GARONNE" size={28} color={COL.cyan} />
      <Pin t={t} shot="map" at="dordogne" start={M.dordogne} end={end} text="DORDOGNE" size={28} color={COL.cyan} />
      <Callout t={t} shot="map" at="gironde" start={M.gironde + 0.2} end={end} dx={-240} dy={-120} title="GIRONDE ESTUARY" color={COL.cyan} size={34} />
      <Callout t={t} shot="map" at="leftbank" start={M.left} end={end} dx={-300} dy={150} title="LEFT BANK" sub="Médoc · Graves" color={COL.amber} size={46} />
      <Callout t={t} shot="map" at="rightbank" start={M.right} end={end} dx={260} dy={-170} title="RIGHT BANK" sub="Saint-Émilion · Pomerol" color={COL.magenta} size={46} />
      {coordV > 0 && (
        <div style={{ position: "absolute", left: 100, bottom: 90, opacity: coordV, fontFamily: MONO, fontSize: 24, color: "rgba(255,255,255,0.85)", textShadow: shadow, lineHeight: 1.5 }}>
          <div>44°50′N  0°34′W</div>
          <div style={{ opacity: 0.7 }}>GIRONDE · NOUVELLE-AQUITAINE</div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---------- SOIL
const Soil: React.FC<P> = ({ t, d }) => {
  const S = B.soil;
  const end = d - 0.4;
  const midL = S.right - 0.3;
  return (
    <AbsoluteFill>
      <Kicker t={t} n="01" label="TERROIR" end={end} />
      <Pin t={t} shot="soil" at="leftTop" start={0.3} end={midL} text="LEFT BANK" size={44} color={COL.amber} />
      <Callout t={t} shot="soil" at="gravel" start={S.gravel} end={midL} dx={250} dy={-30} title="GRAVEL" sub="rain drains straight through" color={COL.amber} size={40} />
      <Callout t={t} shot="soil" at="heat" start={S.heat} end={midL} dx={-260} dy={-110} title="HEAT" sub="stones store the sun's warmth" color="#ff7a2a" size={36} />
      <Callout t={t} shot="soil" at="roots" start={S.gravel + 1.2} end={midL} dx={260} dy={60} title="DEEP ROOTS" sub="dig metres down for water" color="#f4e2c0" size={36} />
      <Chip t={t} start={S.cab} end={midL} text="CABERNET SAUVIGNON" color={COL.amber} x={960} y={930} />
      <Pin t={t} shot="soil" at="rightTop" start={S.right} end={end} text="RIGHT BANK" size={44} color={COL.magenta} />
      <Callout t={t} shot="soil" at="clay" start={S.clay} end={end} dx={-240} dy={-60} title="CLAY" sub="cool, holds water" color={COL.magenta} size={40} />
      <Callout t={t} shot="soil" at="limestone" start={S.clay + 0.5} end={end} dx={240} dy={50} title="LIMESTONE" color="#f1ead8" size={36} />
      <Chip t={t} start={S.merlot} end={end} text="MERLOT" color={COL.magenta} x={960} y={930} />
    </AbsoluteFill>
  );
};

// ---------- GRAPES: donut chart of plantings
const DONUT = [
  { label: "Merlot", v: 62, c: "#c21f5b" },
  { label: "Cabernet Sauvignon", v: 25, c: "#5b2a86" },
  { label: "Cabernet Franc", v: 11, c: "#e0697a" },
  { label: "Petit Verdot, Malbec, Carménère", v: 2, c: "#f2c46d" },
];
const Donut: React.FC<{ t: number; start: number; active: number }> = ({ t, start, active }) => {
  const R = 82, sw = 32, C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
      <svg width={210} height={210} viewBox="-105 -105 210 210">
        <circle r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={sw} />
        {DONUT.map((s, i) => {
          const grow = interpolate(t, [start + i * 0.25, start + i * 0.25 + 0.8], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
          const len = (s.v / 100) * C * grow;
          const el = <circle key={s.label} r={R} fill="none" stroke={s.c} strokeWidth={i === active ? sw + 10 : sw} strokeDasharray={`${len} ${C}`} strokeDashoffset={-acc} transform="rotate(-90)" />;
          acc += (s.v / 100) * C;
          return el;
        })}
        <text textAnchor="middle" y={-2} fill="#fff" style={{ fontFamily: MONO, fontSize: 34, fontWeight: 700 }}>
          {Math.round(interpolate(t, [start, start + 1.2], [0, 62], clamp))}%
        </text>
        <text textAnchor="middle" y={24} fill="rgba(255,255,255,0.75)" style={{ fontFamily: SANS, fontSize: 16, fontWeight: 600, letterSpacing: 3 }}>
          MERLOT
        </text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {DONUT.map((s, i) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 14, opacity: ramp(t, start + 0.3 + i * 0.25, 0.4) * (i === active || active < 0 ? 1 : 0.7) }}>
            <div style={{ width: 18, height: 18, borderRadius: 4, background: s.c }} />
            <div style={{ fontFamily: MONO, fontSize: 22, width: 66, fontWeight: 700 }}>≈{s.v}%</div>
            <div style={{ fontFamily: SANS, fontSize: 20, fontWeight: 600, maxWidth: 220 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
const Grapes: React.FC<P> = ({ t, d }) => {
  const G = B.grapes;
  const end = d - 0.35;
  const active = t > G.cf ? 2 : t > G.cs ? 1 : 0;
  return (
    <AbsoluteFill>
      <Kicker t={t} n="02" label="THE GRAPES" end={end} />
      <Pin t={t} shot="grapes" at="merlot" start={G.merlot} end={end} text="MERLOT" size={30} color="#ff6a94" dy={70} />
      <Pin t={t} shot="grapes" at="cs" start={G.cs} end={end} text="CAB. SAUVIGNON" size={30} color="#c9a2ff" dy={70} />
      <Pin t={t} shot="grapes" at="cf" start={G.cf} end={end} text="CAB. FRANC" size={30} color="#ff9aa8" dy={70} />
      <Card t={t} start={G.merlot + 0.4} end={end} x={1240} y={150} w={580} title="RED VINES IN BORDEAUX">
        <Donut t={t} start={G.merlot + 0.6} active={active} />
        <div style={{ fontFamily: SANS, fontSize: 18, opacity: 0.6, marginTop: 16 }}>Share of red plantings, approximate</div>
      </Card>
    </AbsoluteFill>
  );
};

// ---------- VERAISON: ripening chart
const Ripening: React.FC<P> = ({ t, d }) => {
  const V = B.veraison;
  const end = d - 0.3;
  const w = 600, h = 300;
  const sugar = (x: number) => h - (0.1 + 0.8 / (1 + Math.exp(-(x - 0.45) * 9))) * h;
  const acid = (x: number) => h - (0.9 - 0.75 / (1 + Math.exp(-(x - 0.4) * 8))) * h;
  const path = (f: (x: number) => number, k: number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 60 * k; i++) {
      const x = i / 60;
      pts.push(`${i ? "L" : "M"} ${x * w} ${f(x)}`);
    }
    return pts.join(" ");
  };
  const ks = interpolate(t, [V.sugar - 0.4, V.sugar + 1.4], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const ka = interpolate(t, [V.acid - 0.3, V.acid + 1.2], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const months = ["JUL", "AUG", "SEP", "OCT"];
  return (
    <AbsoluteFill>
      <Kicker t={t} n="03" label="RIPENING" end={end} />
      <Callout t={t} shot="veraison" at="bunch" start={V.turn} end={end} dx={-200} dy={300} title="VÉRAISON" sub="the berries change colour" color="#d77bff" size={38} />
      <Card t={t} start={V.summer + 0.3} end={end} x={1120} y={250} w={700} title="AS THE GRAPES RIPEN">
        <svg width={w} height={h + 50} style={{ overflow: "visible" }}>
          {months.map((m, i) => (
            <g key={m}>
              <line x1={(i / 3) * w} x2={(i / 3) * w} y1={0} y2={h} stroke="rgba(255,255,255,0.12)" />
              <text x={(i / 3) * w} y={h + 36} fill="rgba(255,255,255,0.7)" textAnchor="middle" style={{ fontFamily: MONO, fontSize: 20 }}>
                {m}
              </text>
            </g>
          ))}
          <rect x={0.72 * w} y={0} width={0.24 * w} height={h} fill="rgba(242,196,109,0.14)" opacity={ramp(t, V.acid + 0.6, 0.5)} />
          <text x={0.84 * w} y={-10} textAnchor="middle" fill={COL.gold} opacity={ramp(t, V.acid + 0.6, 0.5)} style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 800, letterSpacing: 3 }}>
            HARVEST
          </text>
          <path d={path(sugar, ks)} fill="none" stroke={COL.amber} strokeWidth={6} strokeLinecap="round" />
          <path d={path(acid, ka)} fill="none" stroke={COL.green} strokeWidth={6} strokeLinecap="round" />
        </svg>
        <div style={{ display: "flex", gap: 36, marginTop: 8, fontFamily: DISPLAY, fontWeight: 800, fontSize: 24, letterSpacing: "0.14em" }}>
          <span style={{ color: COL.amber, opacity: ks }}>▲ SUGAR</span>
          <span style={{ color: COL.green, opacity: ka }}>▼ ACIDITY</span>
        </div>
      </Card>
    </AbsoluteFill>
  );
};

// ---------- HARVEST
const Harvest: React.FC<P> = ({ t, d }) => {
  const Hh = B.harvest;
  const end = d - 0.35;
  const v = env(t, Hh.sept - 0.2, end);
  return (
    <AbsoluteFill>
      <Kicker t={t} n="04" label="HARVEST" end={end} />
      {v > 0 && (
        <div style={{ position: "absolute", right: 110, top: 200, textAlign: "right", opacity: v, color: "#fff", textShadow: shadow }}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 26, letterSpacing: "0.3em", color: COL.gold }}>LES VENDANGES</div>
          <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 96, lineHeight: 1.05 }}>Sept → Oct</div>
        </div>
      )}
      <Chip t={t} start={Hh.hand} end={end} text="✋ PICKED BY HAND" color={COL.gold} x={1590} y={470} size={30} />
      <Callout t={t} shot="harvest" at="crate" start={Hh.crates} end={end} dx={-260} dy={-120} title="SMALL CRATES" sub="berries arrive unbroken" color="#ffffff" size={36} />
    </AbsoluteFill>
  );
};

// ---------- SORTING
const Sorting: React.FC<P> = ({ t, d }) => {
  const S = B.sorting;
  const end = d - 0.3;
  const steps = [
    { k: "SORT", at: S.sort },
    { k: "DESTEM", at: S.destem },
    { k: "CRUSH", at: S.crush },
  ];
  const v = env(t, S.sort - 0.5, end);
  return (
    <AbsoluteFill>
      <Kicker t={t} n="05" label="AT THE WINERY" end={end} />
      {v > 0 && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 120, display: "flex", justifyContent: "center", gap: 26, opacity: v }}>
          {steps.map((s, i) => {
            const on = ramp(t, s.at, 0.3);
            return (
              <React.Fragment key={s.k}>
                {i > 0 && <div style={{ alignSelf: "center", fontSize: 40, color: "rgba(255,255,255,0.6)", opacity: on }}>→</div>}
                <div style={{ padding: "16px 34px", borderRadius: 14, border: `2px solid ${on > 0.5 ? COL.gold : "rgba(255,255,255,0.3)"}`, background: on > 0.5 ? "rgba(242,196,109,0.18)" : "rgba(0,0,0,0.35)", fontFamily: DISPLAY, fontWeight: 800, fontSize: 40, letterSpacing: "0.16em", color: "#fff", scale: String(0.9 + 0.1 * on), opacity: 0.4 + 0.6 * on, textShadow: shadow }}>
                  {s.k}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}
      <Callout t={t} shot="sorting" at="drum" start={S.destem} end={end} dx={-200} dy={-150} title="DESTEMMER" sub="berries fall, stems are removed" color={COL.gold} size={34} />
    </AbsoluteFill>
  );
};

// ---------- VAT: fermentation equation + thermometer
const Vat: React.FC<P> = ({ t, d }) => {
  const V = B.vat;
  const end = d + 0.2;
  const part = (at: number, children: React.ReactNode, color: string, label: string) => {
    const k = ramp(t, at, 0.4);
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", opacity: k, translate: `0px ${(1 - k) * 16}px` }}>
        <div style={{ fontFamily: MONO, fontSize: 40, fontWeight: 700, color }}>{children}</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 800, letterSpacing: "0.2em", color: "rgba(255,255,255,0.8)", marginTop: 8 }}>{label}</div>
      </div>
    );
  };
  return (
    <AbsoluteFill>
      <Kicker t={t} n="06" label="FERMENTATION" end={end} />
      <Card t={t} start={V.yeast - 0.3} end={end} x={100} y={800} w={900} title="YEAST AT WORK">
        <div style={{ display: "flex", alignItems: "flex-start", gap: 26 }}>
          {part(V.sugar, <>C₆H₁₂O₆</>, COL.amber, "SUGAR")}
          <div style={{ fontFamily: MONO, fontSize: 46, opacity: ramp(t, V.alcohol - 0.2, 0.3) }}>→</div>
          {part(V.alcohol, <>2 C₂H₅OH</>, "#ffd9e4", "ALCOHOL")}
          <div style={{ fontFamily: MONO, fontSize: 46, opacity: ramp(t, V.co2 - 0.1, 0.3) }}>+</div>
          {part(V.co2, <>2 CO₂</>, COL.cyan, "CARBON DIOXIDE")}
        </div>
      </Card>
      <Callout t={t} shot="vat" at="cap" start={V.yeast + 0.2} end={end} dx={-260} dy={-110} title="CAP OF SKINS" sub="floats on top" color="#e9b3ff" size={34} />
      <Callout t={t} shot="vat" at="must" start={V.yeast} end={end} dx={340} dy={-40} title="YEASTS" sub="feed on the sugar" color="#ffe066" size={34} />
      <Card t={t} start={V.alcohol} end={end} x={1500} y={300} w={300} title="TEMP." accent={COL.ruby}>
        <div style={{ fontFamily: MONO, fontSize: 52, fontWeight: 700 }}>
          <Counter t={t} start={V.alcohol} from={18} to={28} dur={1.4} suffix="°C" />
        </div>
        <div style={{ fontFamily: SANS, fontSize: 20, opacity: 0.7, marginTop: 6 }}>typical: ~25–30 °C</div>
      </Card>
    </AbsoluteFill>
  );
};

// ---------- SKINS: the answer
const Molecule: React.FC<{ k: number }> = ({ k }) => {
  // simplified anthocyanin (flavylium) skeleton: A-ring + C-ring (with O+) + B-ring
  const hex6 = (cx: number, cy: number, r: number) => Array.from({ length: 6 }, (_, i) => `${cx + r * Math.cos((Math.PI / 3) * i + Math.PI / 6)},${cy + r * Math.sin((Math.PI / 3) * i + Math.PI / 6)}`).join(" ");
  const len = 1200;
  return (
    <svg width={420} height={180} viewBox="0 0 420 180">
      <g fill="none" stroke="#fff" strokeWidth={4} strokeDasharray={len} strokeDashoffset={len * (1 - k)} strokeLinejoin="round">
        <polygon points={hex6(80, 100, 46)} />
        <polygon points={hex6(160, 100, 46)} />
        <line x1={200} y1={77} x2={250} y2={57} />
        <polygon points={hex6(290, 57, 46)} />
        <line x1={330} y1={34} x2={372} y2={14} />
        <line x1={330} y1={80} x2={372} y2={100} />
        <line x1={40} y1={123} x2={10} y2={150} />
      </g>
      <text x={186} y={152} fill={COL.ruby} opacity={k} style={{ fontFamily: MONO, fontSize: 30, fontWeight: 700 }}>
        O⁺
      </text>
      <text x={376} y={18} fill="#fff" opacity={k} style={{ fontFamily: MONO, fontSize: 22 }}>OH</text>
      <text x={376} y={112} fill="#fff" opacity={k} style={{ fontFamily: MONO, fontSize: 22 }}>OH</text>
      <text x={0} y={174} fill="#fff" opacity={k} style={{ fontFamily: MONO, fontSize: 22 }}>HO</text>
    </svg>
  );
};
const Skins: React.FC<P> = ({ t, d }) => {
  const K = B.skins;
  const end = d - 0.3;
  const big = env(t, K.skins - 0.1, K.month + 0.5, 0.3, 0.4);
  const dayK = interpolate(t, [K.month, K.antho + 2.6], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Kicker t={t} n="06" label="FERMENTATION" end={end} />
      {big > 0 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 360, textAlign: "center", opacity: big, fontFamily: DISPLAY, fontWeight: 900, fontSize: 104, color: "#fff", textShadow: "0 6px 40px rgba(90,0,30,0.6)", lineHeight: 1.05 }}>
          <div style={{ fontSize: 40, letterSpacing: "0.4em", color: "#ffe0e8", marginBottom: 16 }}>THE ANSWER</div>
          THE COLOUR IS IN THE{" "}
          <span style={{ background: "linear-gradient(180deg,#ff7a96,#b0002a)", WebkitBackgroundClip: "text", color: "transparent", textShadow: "none" }}>SKINS</span>
        </div>
      )}
      <Card t={t} start={K.month} end={end} x={100} y={780} w={760} title="MACERATION · UP TO A MONTH">
        <div style={{ height: 34, borderRadius: 17, background: "linear-gradient(90deg,#f4c8d2,#e06a88,#a3123a,#5a0016)", position: "relative" }}>
          <div style={{ position: "absolute", left: `${dayK * 100}%`, top: -8, width: 6, height: 50, borderRadius: 3, background: "#fff", translate: "-50% 0", boxShadow: "0 0 12px #fff" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 22, marginTop: 12, opacity: 0.85 }}>
          <span>DAY 1</span>
          <span>DAY {Math.max(1, Math.round(dayK * 28))}</span>
          <span>~DAY 28</span>
        </div>
      </Card>
      <Card t={t} start={K.antho - 0.2} end={end} x={1240} y={200} w={580} title="ANTHOCYANINS" accent="#ff6a88">
        <Molecule k={ramp(t, K.antho, 1.2)} />
        <div style={{ fontFamily: SANS, fontSize: 24, marginTop: 10, opacity: 0.9 }}>red–purple pigments from the skins</div>
      </Card>
      <Chip t={t} start={K.tannin} end={end} text="+ TANNINS" color={COL.gold} x={1530} y={640} size={34} />
    </AbsoluteFill>
  );
};

// ---------- PRESS: malolactic
const Press: React.FC<P> = ({ t, d }) => {
  const P = B.press;
  const end = d - 0.35;
  const k = ramp(t, P.malic - 0.2, 0.6);
  return (
    <AbsoluteFill>
      <Kicker t={t} n="07" label="PRESSING" end={end} />
      <Callout t={t} shot="press" at="basket" start={P.press} end={end} dx={-220} dy={-160} title="BASKET PRESS" sub="squeezes the skins" color={COL.gold} size={34} />
      <Callout t={t} shot="press" at="pool" start={P.press + 0.8} end={end} dx={220} dy={170} title="NEW WINE" color="#ff5a7a" size={34} />
      <Card t={t} start={P.malo} end={end} x={1180} y={230} w={640} title="2ND FERMENTATION · MALOLACTIC">
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 64 }}>🍏</div>
            <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 24, letterSpacing: "0.1em", marginTop: 6 }}>MALIC ACID</div>
            <div style={{ fontFamily: SANS, fontSize: 20, opacity: 0.75 }}>sharp</div>
          </div>
          <div style={{ flex: 1, height: 4, background: `linear-gradient(90deg, ${COL.green}, #fff)`, borderRadius: 2, position: "relative" }}>
            <div style={{ position: "absolute", right: -6, top: -12, fontSize: 28, color: "#fff" }}>▶</div>
          </div>
          <div style={{ textAlign: "center", opacity: 0.3 + 0.7 * k }}>
            <div style={{ fontSize: 64 }}>🥛</div>
            <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 24, letterSpacing: "0.1em", marginTop: 6 }}>LACTIC ACID</div>
            <div style={{ fontFamily: SANS, fontSize: 20, opacity: 0.75 }}>soft, rounder</div>
          </div>
        </div>
      </Card>
    </AbsoluteFill>
  );
};

// ---------- CELLAR
const Cellar: React.FC<P> = ({ t, d }) => {
  const CL = B.cellar;
  const end = d - 0.35;
  const mid = CL.oxygen - 1.0;
  const monthsK = interpolate(t, [CL.months, CL.months + 1.6], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill>
      <Kicker t={t} n="08" label="AGEING IN OAK" end={end} />
      <Callout t={t} shot="cellar" at="oak" start={CL.oak} end={mid} dx={260} dy={-150} title="FRENCH OAK" sub="the Bordeaux barrique" color={COL.gold} size={38} />
      <Card t={t} start={CL.litres - 0.2} end={mid + 0.5} x={1180} y={600} w={640}>
        <div style={{ display: "flex", gap: 40, whiteSpace: "nowrap" }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 84, fontWeight: 700, lineHeight: 1 }}>
              <Counter t={t} start={CL.litres} from={0} to={225} dur={1.1} />
              <span style={{ fontSize: 40 }}> L</span>
            </div>
            <div style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 800, letterSpacing: "0.2em", opacity: 0.8 }}>PER BARREL</div>
          </div>
          <div style={{ opacity: ramp(t, CL.months - 0.2, 0.4) }}>
            <div style={{ fontFamily: MONO, fontSize: 84, fontWeight: 700, lineHeight: 1 }}>
              12–{Math.round(12 + 12 * monthsK)}
            </div>
            <div style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 800, letterSpacing: "0.2em", opacity: 0.8 }}>MONTHS</div>
          </div>
        </div>
      </Card>
      <Callout t={t} shot="cellar" at="oxygen" start={CL.oxygen} end={end} dx={-260} dy={-150} title="O₂" sub="tiny amounts seep through the wood" color={COL.cyan} size={46} />
      <Callout t={t} shot="cellar" at="toast" start={CL.oxygen + 0.9} end={end} dx={300} dy={-60} title="TOASTED OAK" sub="flavour from the barrel" color="#d8a46a" size={34} />
      <Chip t={t} start={CL.tannin} end={end} text="SOFTER TANNINS" color="#f4e2c0" x={1500} y={760} size={30} />
      <Chip t={t} start={CL.vanilla} end={end} text="VANILLA" color="#f6e3a8" x={1340} y={860} size={30} />
      <Chip t={t} start={CL.toast} end={end} text="TOAST" color="#d8a46a" x={1560} y={860} size={30} />
      <Chip t={t} start={CL.spice} end={end} text="SPICE" color="#e88a4a" x={1740} y={860} size={30} />
    </AbsoluteFill>
  );
};

// ---------- BLEND
const VAR_COL = ["#5b2a86", "#c21f5b", "#e0697a"];
const VAR_LBL = ["Cab. Sauvignon", "Merlot", "Cab. Franc"];
const BlendBar: React.FC<{ t: number; start: number; mix: number[]; label: string; color: string }> = ({ t, start, mix, label, color }) => (
  <div style={{ marginBottom: 26 }}>
    <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 26, letterSpacing: "0.2em", color, marginBottom: 10, opacity: ramp(t, start, 0.3) }}>{label}</div>
    <div style={{ display: "flex", height: 46, borderRadius: 10, overflow: "hidden", background: "rgba(255,255,255,0.08)" }}>
      {mix.map((m, i) => {
        const g = interpolate(t, [start + i * 0.18, start + i * 0.18 + 0.7], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
        return (
          <div key={i} style={{ width: `${m * 100 * g}%`, background: VAR_COL[i], display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 22, fontWeight: 700, color: "#fff", overflow: "hidden", whiteSpace: "nowrap" }}>
            {m >= 0.3 ? `${Math.round(m * 100)}% ${VAR_LBL[i]}` : `${Math.round(m * 100)}%`}
          </div>
        );
      })}
    </div>
  </div>
);
const Blend: React.FC<P> = ({ t, d }) => {
  const BL = B.blend;
  const end = d - 0.35;
  const v = env(t, BL.blend - 0.2, end);
  return (
    <AbsoluteFill>
      <Kicker t={t} n="09" label="ASSEMBLAGE" end={end} />
      {v > 0 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 170, textAlign: "center", opacity: v, color: "#fff", textShadow: shadow }}>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 76 }}>the blend</div>
        </div>
      )}
      <Pin t={t} shot="blend" at="cs" start={BL.art + 0.3} end={BL.left - 0.3} text="CAB. SAUVIGNON" size={24} color="#d3b3ff" dy={64} />
      <Pin t={t} shot="blend" at="merlot" start={BL.art + 0.5} end={BL.left - 0.3} text="MERLOT" size={24} color="#ff8ab0" dy={64} />
      <Pin t={t} shot="blend" at="cf" start={BL.art + 0.7} end={BL.left - 0.3} text="CAB. FRANC" size={24} color="#ffb3be" dy={64} />
      <Card t={t} start={BL.left - 0.2} end={end} x={100} y={720} w={1720}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60 }}>
          <BlendBar t={t} start={BL.left} mix={BLENDS.left} label="LEFT BANK · EXAMPLE" color={COL.amber} />
          {t > BL.right - 0.3 ? <BlendBar t={t} start={BL.right} mix={BLENDS.right} label="RIGHT BANK · EXAMPLE" color={COL.magenta} /> : <div />}
        </div>
        <div style={{ fontFamily: SANS, fontSize: 18, opacity: 0.6 }}>Illustrative blends — every château, every vintage is different.</div>
      </Card>
    </AbsoluteFill>
  );
};

// ---------- FINALE
const Finale: React.FC<P> = ({ t, d }) => {
  const F = B.finale;
  const dec = env(t, F.decades - 0.2, F.recap - 0.2);
  const words = ["SUN", "SOIL", "SKINS", "OAK"];
  const wordAt = [F.recap, F.recap + 0.42, F.recap + 0.85, F.recap + 1.35];
  const recapV = env(t, F.recap - 0.1, F.endcard + 0.4, 0.3, 0.5);
  const endV = env(t, F.endcard, d + 1, 0.9, 0.5);
  const fade = interpolate(t, [d - 1.2, d], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <Kicker t={t} n="10" label="IN THE BOTTLE" end={F.recap - 0.3} />
      {dec > 0 && (
        <Card t={t} start={F.decades - 0.2} end={F.recap - 0.2} x={1180} y={760} w={640} title="CELLARING POTENTIAL">
          <div style={{ display: "flex", alignItems: "center", gap: 18, fontFamily: MONO, fontSize: 30 }}>
            <span>2025</span>
            <div style={{ flex: 1, height: 6, borderRadius: 3, background: `linear-gradient(90deg, #f2c46d, #ff2e55)`, transformOrigin: "left", scale: `${ramp(t, F.decades, 1.2)} 1` }} />
            <span style={{ opacity: ramp(t, F.decades + 0.9, 0.4) }}>2050+</span>
          </div>
          <div style={{ fontFamily: SANS, fontSize: 22, opacity: 0.8, marginTop: 10 }}>great vintages evolve for decades</div>
        </Card>
      )}
      {recapV > 0 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", justifyContent: "center", gap: 46, opacity: recapV }}>
          {words.map((w, i) => {
            const k = interpolate(t, [wordAt[i], wordAt[i] + 0.25], [0, 1], { ...clamp, easing: Easing.bezier(0.2, 1.5, 0.4, 1) });
            return (
              <div key={w} style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 92, color: i === 2 ? "#ff3d64" : "#fff", opacity: Math.min(1, k * 1.4), scale: String(0.5 + 0.5 * k), textShadow: "0 6px 30px rgba(60,0,20,0.55)" }}>
                {w}
                {i < 3 ? <span style={{ color: COL.gold, marginLeft: 46 }}>·</span> : null}
              </div>
            );
          })}
        </div>
      )}
      {endV > 0 && (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: endV, background: `rgba(10,2,6,${0.35 * endV})` }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 700, letterSpacing: "0.5em", color: COL.gold }}>THAT'S THE RED OF</div>
          <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 190, letterSpacing: "0.18em", marginRight: "-0.18em", color: "#fff", textShadow: "0 10px 60px rgba(60,0,20,0.7)" }}>BORDEAUX</div>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 46, color: "rgba(255,255,255,0.9)" }}>from vine to glass</div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

const MAP: Record<string, React.FC<P>> = { hook: Hook, title: Title, map: Map, soil: Soil, grapes: Grapes, veraison: Ripening, harvest: Harvest, sorting: Sorting, vat: Vat, skins: Skins, press: Press, cellar: Cellar, blend: Blend, finale: Finale };
const STEP_OF: Record<string, number> = { map: 0, soil: 0, grapes: 1, veraison: 2, harvest: 3, sorting: 4, vat: 5, skins: 5, press: 6, cellar: 7, blend: 8, finale: 9 };

const ShotOverlay: React.FC<{ id: string; d: number }> = ({ id, d }) => {
  const f = useCurrentFrame();
  const C = MAP[id];
  return C ? <C t={f / FPS} d={d} /> : null;
};

export const Overlays: React.FC = () => {
  const frame = useCurrentFrame();
  const tg = frame / FPS;
  const cur = SHOTS.find((s) => tg >= s.start && tg < s.end) ?? SHOTS[SHOTS.length - 1];
  const step = STEP_OF[cur.id];
  const fin = shotById("finale");
  const stepV = step === undefined ? 0 : Math.min(ramp(tg, shotById("map").start + 0.6, 0.6), 1 - ramp(tg, fin.start + B.finale.recap - 0.4, 0.4));
  return (
    <AbsoluteFill>
      {SHOTS.map((s) => (
        <Sequence key={s.id} from={Math.round(s.start * FPS)} durationInFrames={Math.round((s.dur + 0.6) * FPS)} layout="none">
          <ShotOverlay id={s.id} d={s.dur} />
        </Sequence>
      ))}
      <Stepper active={step ?? -1} v={stepV} />
    </AbsoluteFill>
  );
};
