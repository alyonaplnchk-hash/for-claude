// Kinetic typography and hairline graphics for the 9:16 cut, in a minimal luxury-film style:
// a pale clouded backdrop, the narration set word by word in a high-contrast serif (italic
// lead-ins, bold capitals in wine for the key words), small tracked labels pinned to the 3D,
// thin arcs, dot grids and dashed rings, and blurred leaves and berries flying past the lens.
// Layout keeps clear of the Reels interface (top ~220 px, bottom ~360 px, right-hand icons).
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/fonts";
import { Engine } from "../engine/renderer";
import { buildShots } from "../scenes";
import { B } from "../beats";
import { FPS, SHOTS, TOTAL, shotById } from "../timeline";
import kinetic from "../kinetic.json";
import flybys from "../flybys.json";

loadFont({ family: "Playfair Display", url: staticFile("fonts/PlayfairDisplay.woff2"), weight: "400 900", style: "normal" });
loadFont({ family: "Playfair Display", url: staticFile("fonts/PlayfairDisplay-Italic.woff2"), weight: "400 900", style: "italic" });

const RW = 1080;
const RH = 1920;
const SERIF = "'Playfair Display', 'Newsreader', serif";
const SANS = "'Inter', 'Inter Display', sans-serif";
const C = {
  ink: "#1D1A1A",
  mute: "#7A7471",
  wine: "#76192F",
  hair: "rgba(29,26,26,0.42)",
  hairSoft: "rgba(29,26,26,0.22)",
  white: "#F7F2EE",
  blush: "#E9B9C3",
};
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const OUT = Easing.bezier(0.16, 1, 0.3, 1);
const ramp = (t: number, a: number, d: number, ease = OUT) => interpolate(t, [a, a + d], [0, 1], { ...clamp, easing: ease });
const win = (t: number, a: number, b: number, fin = 0.6, fout = 0.4) => Math.min(ramp(t, a, fin), 1 - ramp(t, b - fout, fout, Easing.in(Easing.cubic)));
// soft "focus pull" entrance used by every element
const reveal = (v: number, dy = 14): React.CSSProperties => ({ opacity: v, filter: v < 0.999 ? `blur(${(1 - v) * 10}px)` : undefined, translate: `0px ${(1 - v) * dy}px` });

const shots3d = buildShots(true);
function project(shot: string, local: number, name: string) {
  const s = shots3d[shot];
  const a = s?.anchors?.(local)?.[name];
  if (!a) return null;
  const p = Engine.project(s.camera(local), a, RW, RH);
  if (!p.visible || p.x < 30 || p.x > RW - 30 || p.y < 150 || p.y > RH - 300) return null;
  return p;
}

// ------------------------------------------------------------------ kinetic narration
type KW = { t: string; s: number; k: boolean };
type KP = { shot: string; line: string; start: number; end: number; words: KW[] };
const PHRASES = kinetic as KP[];

// where the words sit in each shot: top band or lower band (the subject stays clear)
const ZONE: Record<string, number> = {
  hook: 1250,
  map: 260,
  soil: 250,
  grapes: 1290,
  veraison: 1230,
  harvest: 250,
  sorting: 1300,
  vat: 250,
  skins: 300,
  press: 1420,
  cellar: 270,
  blend: 1300,
  finale: 250,
};
const DARK = new Set(["skins"]);

// lead-in words in italic on one line, key words in capitals on the next
function layout(words: KW[]): KW[][] {
  const runs: KW[][] = [];
  for (const w of words) {
    const last = runs[runs.length - 1];
    if (last && last[0].k === w.k) last.push(w);
    else runs.push([w]);
  }
  const lines: KW[][] = [];
  let cur: KW[] = [];
  runs.forEach((r, i) => {
    if (r[0].k) {
      const prev = runs[i - 1];
      if (prev && prev.length >= 2 && cur.length) {
        lines.push(cur);
        cur = [];
      }
      cur.push(...r);
      const next = runs[i + 1];
      if (next && next.length >= 2) {
        lines.push(cur);
        cur = [];
      }
    } else cur.push(...r);
  });
  if (cur.length) lines.push(cur);
  return lines;
}

const ITALIC = 62;
function capsSize(line: KW[]) {
  const caps = line.filter((w) => w.k).reduce((n, w) => n + w.t.length, 0) + Math.max(0, line.filter((w) => w.k).length - 1);
  const ital = line.filter((w) => !w.k).reduce((n, w) => n + w.t.length + 1, 0);
  if (!caps) return ITALIC;
  return Math.max(54, Math.min(104, (880 - ital * 0.43 * ITALIC) / (caps * 0.8)));
}

const Word: React.FC<{ w: KW; tg: number; size: number; dark: boolean; first: boolean }> = ({ w, tg, size, dark, first }) => {
  const p = ramp(tg, w.s - 0.06, 0.55);
  const m = p * 140 - 40;
  const style: React.CSSProperties = w.k
    ? { fontFamily: SERIF, fontWeight: 700, fontStyle: "normal", textTransform: "uppercase", fontSize: size, letterSpacing: "0.015em", color: dark ? C.blush : C.wine, lineHeight: 1.0 }
    : { fontFamily: SERIF, fontWeight: 400, fontStyle: "italic", fontSize: ITALIC, letterSpacing: "-0.01em", color: dark ? C.white : C.ink, lineHeight: 1.12 };
  return (
    <span
      style={{
        ...style,
        display: "inline-block",
        marginLeft: first ? 0 : w.k ? size * 0.24 : ITALIC * 0.24,
        opacity: p,
        filter: p < 0.999 ? `blur(${(1 - p) * 12}px)` : undefined,
        translate: `0px ${(1 - p) * 18}px`,
        WebkitMaskImage: p < 0.999 ? `linear-gradient(90deg, #000 ${m}%, transparent ${m + 40}%)` : undefined,
        maskImage: p < 0.999 ? `linear-gradient(90deg, #000 ${m}%, transparent ${m + 40}%)` : undefined,
      }}
    >
      {w.t}
    </span>
  );
};

const Phrase: React.FC<{ p: KP; tg: number; exit: number; top: number; dark: boolean; center?: boolean }> = ({ p, tg, exit, top, dark, center }) => {
  const out = 1 - ramp(tg, exit - 0.32, 0.32, Easing.in(Easing.cubic));
  if (tg < p.words[0].s - 0.1 || out <= 0) return null;
  const lines = layout(p.words);
  const age = tg - p.start;
  return (
    <div
      style={{
        position: "absolute",
        left: 70,
        right: 70,
        top,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: center ? "center" : "flex-start",
        textAlign: "center",
        opacity: out,
        filter: out < 0.999 ? `blur(${(1 - out) * 10}px)` : undefined,
        translate: `0px ${-age * 5 - (1 - out) * 18}px`,
        scale: String(1 + age * 0.004),
      }}
    >
      {lines.map((ln, i) => {
        const size = capsSize(ln);
        return (
          <div key={i} style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "baseline", marginTop: i ? (ln.some((w) => w.k) ? 6 : 2) : 0 }}>
            {ln.map((w, j) => (
              <Word key={j} w={w} tg={tg} size={size} dark={dark} first={j === 0} />
            ))}
          </div>
        );
      })}
    </div>
  );
};

const Kinetic: React.FC<{ tg: number }> = ({ tg }) => {
  const endcard = shotById("finale").start + B.finale.red;
  return (
    <>
      {PHRASES.map((p, i) => {
        const shot = shotById(p.shot);
        const next = PHRASES[i + 1];
        const sameShot = next && next.shot === p.shot;
        const last = i === PHRASES.length - 1;
        const exit = last ? TOTAL + 5 : sameShot ? next.words[0].s - 0.04 : Math.min(p.end + 1.0, shot.end - 0.2);
        if (tg < p.words[0].s - 0.2 || tg > exit + 0.1) return null;
        const finaleEnd = p.shot === "finale" && p.start >= endcard - 0.2;
        return <Phrase key={i} p={p} tg={tg} exit={exit} top={finaleEnd ? 700 : ZONE[p.shot] ?? 260} dark={DARK.has(p.shot)} center={finaleEnd} />;
      })}
    </>
  );
};

// ------------------------------------------------------------------ hairline graphics
type G = { t: number; d: number };

// a pinned label: ring on the 3D point, hairline leader, tracked caps label and an italic note
// dx: horizontal reach of the leader (its sign picks the side; "auto" points away from the centre)
const Mark: React.FC<{ t: number; shot: string; at: string; start: number; end: number; label: string; note?: string; dx?: number | "auto"; dy?: number; dark?: boolean }> = ({ t, shot, at, start, end, label, note, dx = "auto", dy = -90, dark }) => {
  const a = project(shot, t, at);
  const v = win(t, start, end, 0.7, 0.35);
  if (!a || v <= 0) return null;
  const textW = Math.max(label.length * 20 * 0.86, (note ?? "").length * 25 * 0.42) + 40;
  let right = dx === "auto" ? a.x < RW / 2 : dx >= 0;
  const reach = dx === "auto" ? 120 : Math.abs(dx);
  // flip when the text would run off the frame
  if (right && a.x + reach + textW > RW - 40) right = false;
  else if (!right && a.x - reach - textW < 40) right = true;
  const ex = Math.max(60, Math.min(RW - 60, a.x + (right ? reach : -reach)));
  const ey = a.y + dy;
  const len = Math.hypot(ex - a.x, ey - a.y);
  const draw = ramp(t, start, 0.6);
  const ink = dark ? "rgba(247,242,238,0.8)" : C.hair;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: v }}>
      <svg width={RW} height={RH} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <circle cx={a.x} cy={a.y} r={10 * draw} fill="none" stroke={ink} strokeWidth={1.4} />
        <circle cx={a.x} cy={a.y} r={3} fill={dark ? C.white : C.ink} />
        <line x1={a.x} y1={a.y} x2={ex} y2={ey} stroke={ink} strokeWidth={1.2} strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
        <line x1={ex} y1={ey} x2={ex + (right ? 26 : -26) * draw} y2={ey} stroke={ink} strokeWidth={1.2} />
      </svg>
      <div style={{ position: "absolute", top: ey - 15, left: right ? ex + 36 : undefined, right: right ? undefined : RW - ex + 36, textAlign: right ? "left" : "right", whiteSpace: "nowrap", textShadow: dark ? undefined : "0 0 14px rgba(236,236,237,0.95), 0 0 4px rgba(236,236,237,0.9)", ...reveal(ramp(t, start + 0.25, 0.6), 8) }}>
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 20, letterSpacing: "0.2em", textTransform: "uppercase", color: dark ? C.white : C.ink }}>{label}</div>
        {note ? <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 26, color: dark ? "rgba(247,242,238,0.75)" : C.mute, marginTop: 4 }}>{note}</div> : null}
      </div>
    </div>
  );
};

// an italic place name set straight onto the map
const Place: React.FC<{ t: number; at: string; start: number; end: number; name: string; dy?: number; size?: number; caps?: boolean }> = ({ t, at, start, end, name, dy = -34, size = 30, caps }) => {
  const a = project("map", t, at);
  const v = win(t, start, end, 0.7, 0.35);
  if (!a || v <= 0) return null;
  return (
    <div style={{ position: "absolute", left: a.x, top: a.y + dy, translate: "-50% -50%", whiteSpace: "nowrap", ...reveal(v, 8) }}>
      <span
        style={
          caps
            ? { fontFamily: SANS, fontWeight: 600, fontSize: 18, letterSpacing: "0.22em", textTransform: "uppercase", color: C.ink }
            : { fontFamily: SERIF, fontStyle: "italic", fontSize: size, color: C.ink, textShadow: "0 0 18px rgba(239,239,240,0.9)" }
        }
      >
        {name}
      </span>
    </div>
  );
};

const Arc: React.FC<{ t: number; start: number; end: number; cx: number; cy: number; r: number; a0: number; a1: number; dark?: boolean; width?: number }> = ({ t, start, end, cx, cy, r, a0, a1, dark, width = 1.3 }) => {
  const v = win(t, start, end, 1.4, 0.5);
  if (v <= 0) return null;
  const k = ramp(t, start, 1.6);
  const a = (a0 * Math.PI) / 180;
  const b = ((a0 + (a1 - a0) * k) * Math.PI) / 180;
  const large = Math.abs(b - a) > Math.PI ? 1 : 0;
  const d = `M ${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)} A ${r} ${r} 0 ${large} ${b > a ? 1 : 0} ${cx + r * Math.cos(b)} ${cy + r * Math.sin(b)}`;
  return (
    <svg width={RW} height={RH} style={{ position: "absolute", inset: 0, opacity: v }}>
      <path d={d} fill="none" stroke={dark ? "rgba(247,242,238,0.55)" : C.hair} strokeWidth={width} />
    </svg>
  );
};

const Ring: React.FC<{ t: number; start: number; end: number; x: number; y: number; r: number; dark?: boolean }> = ({ t, start, end, x, y, r, dark }) => {
  const v = win(t, start, end, 0.9, 0.45);
  if (v <= 0) return null;
  return (
    <svg width={RW} height={RH} style={{ position: "absolute", inset: 0, opacity: v }}>
      <circle cx={x} cy={y} r={r * (0.94 + 0.06 * v)} fill="none" stroke={dark ? "rgba(247,242,238,0.6)" : C.hair} strokeWidth={1.5} strokeDasharray="1.5 9" strokeLinecap="round" transform={`rotate(${t * 6} ${x} ${y})`} />
    </svg>
  );
};

const DotGrid: React.FC<{ t: number; start: number; end: number; x: number; y: number; cols: number; rows: number; gap?: number }> = ({ t, start, end, x, y, cols, rows, gap = 66 }) => {
  const v = win(t, start, end, 0.8, 0.4);
  if (v <= 0) return null;
  const cx = (cols - 1) / 2, cy = (rows - 1) / 2;
  const dots: React.ReactNode[] = [];
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      const dd = Math.hypot(i - cx, j - cy) / Math.hypot(cx, cy);
      const o = ramp(t, start + dd * 0.5, 0.5);
      const px = x + (i - cx) * gap, py = y + (j - cy) * gap;
      const plus = (i + j) % 3 === 0;
      dots.push(
        plus ? (
          <g key={`${i}-${j}`} opacity={o * 0.5}>
            <line x1={px - 5} y1={py} x2={px + 5} y2={py} stroke={C.ink} strokeWidth={1} />
            <line x1={px} y1={py - 5} x2={px} y2={py + 5} stroke={C.ink} strokeWidth={1} />
          </g>
        ) : (
          <circle key={`${i}-${j}`} cx={px} cy={py} r={2.2} fill={C.ink} opacity={o * 0.35} />
        ),
      );
    }
  return (
    <svg width={RW} height={RH} style={{ position: "absolute", inset: 0, opacity: v }}>
      {dots}
    </svg>
  );
};

// small tracked caps + italic line, the quiet "caption" of luxury layouts
const Note: React.FC<{ t: number; start: number; end: number; top: number; label?: string; children?: React.ReactNode; dark?: boolean; width?: number }> = ({ t, start, end, top, label, children, dark, width = 700 }) => {
  const v = win(t, start, end, 0.7, 0.35);
  if (v <= 0) return null;
  return (
    <div style={{ position: "absolute", top, left: (RW - width) / 2, width, textAlign: "center", ...reveal(v, 10) }}>
      {label ? <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 18, letterSpacing: "0.24em", textTransform: "uppercase", color: dark ? C.white : C.ink, marginBottom: 10 }}>{label}</div> : null}
      {children ? <div style={{ fontFamily: SANS, fontWeight: 400, fontSize: 23, lineHeight: 1.45, color: dark ? "rgba(247,242,238,0.78)" : C.mute }}>{children}</div> : null}
    </div>
  );
};

// ------------------------------------------------------------------ per-shot layouts
const Hook: React.FC<G> = ({ t, d }) => {
  const h = B.hook;
  return (
    <AbsoluteFill>
      <Arc t={t} start={0.2} end={d - 0.3} cx={540} cy={820} r={430} a0={200} a1={330} />
      <Arc t={t} start={0.6} end={d - 0.3} cx={540} cy={820} r={500} a0={20} a1={120} />
      <Mark t={t} shot="hook" at="drop" start={h.clear + 0.35} end={h.question - 0.15} label="Grape juice" note="colourless, even from red grapes" dx={150} dy={60} />
    </AbsoluteFill>
  );
};

const Title: React.FC<G> = ({ t, d }) => {
  const v = win(t, 0.35, d + 0.2, 0.9, 0.5);
  const k = ramp(t, 0.5, 1.2);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
      <div style={{ ...reveal(ramp(t, 0.35, 0.8)), opacity: v * ramp(t, 0.35, 0.8), fontFamily: SERIF, fontStyle: "italic", fontSize: 54, color: C.ink, marginBottom: 6 }}>how red wine is made in</div>
      <div style={{ ...reveal(ramp(t, 0.65, 0.9)), opacity: v * ramp(t, 0.65, 0.9), fontFamily: SERIF, fontWeight: 700, fontSize: 132, letterSpacing: "0.03em", color: C.wine, lineHeight: 1 }}>BORDEAUX</div>
      <div style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 30, opacity: v * ramp(t, 1.1, 0.8) }}>
        <div style={{ width: 70 * k, height: 1.2, background: C.hair }} />
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 19, letterSpacing: "0.32em", color: C.ink }}>FROM VINE TO GLASS</div>
        <div style={{ width: 70 * k, height: 1.2, background: C.hair }} />
      </div>
    </AbsoluteFill>
  );
};

const MapG: React.FC<G> = ({ t, d }) => {
  const M = B.map;
  const end = d - 0.45;
  return (
    <AbsoluteFill>
      <Mark t={t} shot="map" at="bordeaux" start={M.france + 0.5} end={end} label="Bordeaux" note="44°50′ N · 0°34′ W" dx={-150} dy={110} />
      <Place t={t} at="lat45" start={M.lat45 + 0.2} end={end} name="45° N" caps dy={-26} />
      <Place t={t} at="garonne" start={M.garonne} end={end} name="Garonne" />
      <Place t={t} at="dordogne" start={M.dordogne} end={end} name="Dordogne" />
      <Place t={t} at="gironde" start={M.gironde + 0.2} end={end} name="Gironde" size={34} />
      <Place t={t} at="medoc" start={M.left} end={end} name="Médoc" size={26} dy={-20} />
      <Place t={t} at="graves" start={M.left + 0.25} end={end} name="Graves" size={26} dy={-20} />
      <Place t={t} at="stemilion" start={M.right} end={end} name="Saint-Émilion" size={26} dy={-24} />
      <Place t={t} at="pomerol" start={M.right + 0.25} end={end} name="Pomerol" size={26} dy={-24} />
    </AbsoluteFill>
  );
};

const SoilG: React.FC<G> = ({ t, d }) => {
  const S = B.soil;
  const mid = S.right - 0.25;
  const end = d - 0.4;
  return (
    <AbsoluteFill>
      <Mark t={t} shot="soil" at="gravel" start={S.gravel + 0.2} end={mid} label="Gravel" note="drains fast" dx={-120} dy={150} />
      <Mark t={t} shot="soil" at="roots" start={S.gravel + 1.2} end={mid} label="Deep roots" dx={130} dy={130} />
      <Mark t={t} shot="soil" at="clay" start={S.clay} end={end} label="Clay" note="cool, holds water" dx={-120} dy={150} />
      <Mark t={t} shot="soil" at="limestone" start={S.clay + 0.6} end={end} label="Limestone" dx={120} dy={120} />
    </AbsoluteFill>
  );
};

const GrapesG: React.FC<G> = ({ t, d }) => {
  const G2 = B.grapes;
  const end = d - 0.35;
  return (
    <AbsoluteFill>
      <Mark t={t} shot="grapes" at="merlot" start={G2.merlot + 0.3} end={end} label="Merlot" note="≈ 60% of red vines" dy={-40} />
      <Mark t={t} shot="grapes" at="cs" start={G2.cs + 0.2} end={end} label="Cabernet Sauvignon" note="≈ 25%" dy={-40} />
      <Mark t={t} shot="grapes" at="cf" start={G2.cf + 0.2} end={end} label="Cabernet Franc" note="≈ 10%" dy={-40} />
      <Note t={t} start={G2.merlot + 1.4} end={end} top={1610} width={620}>
        Approximate share of Bordeaux red plantings
      </Note>
    </AbsoluteFill>
  );
};

const MONTHS = ["Jul", "Aug", "Sep", "Oct"];
const VeraisonG: React.FC<G> = ({ t, d }) => {
  const V = B.veraison;
  const end = d - 0.3;
  const a = project("veraison", t, "bunch");
  const k = ramp(t, V.summer + 0.2, 4.2, Easing.inOut(Easing.cubic));
  const v = win(t, V.summer + 0.1, end, 0.7, 0.35);
  const x0 = 290, x1 = 790, y = 1490;
  return (
    <AbsoluteFill>
      {a ? <Ring t={t} start={V.turn} end={end} x={a.x} y={a.y + 20} r={250} /> : null}
      {v > 0 ? (
        <div style={{ position: "absolute", inset: 0, ...reveal(v, 8) }}>
          <svg width={RW} height={RH} style={{ position: "absolute", inset: 0 }}>
            <line x1={x0} y1={y} x2={x1} y2={y} stroke={C.hairSoft} strokeWidth={1.2} />
            <line x1={x0} y1={y} x2={x0 + (x1 - x0) * k} y2={y} stroke={C.wine} strokeWidth={2} />
            {MONTHS.map((_, i) => (
              <circle key={i} cx={x0 + ((x1 - x0) * i) / 3} cy={y} r={4} fill={k * 3 >= i - 0.01 ? C.wine : "#cfcfd1"} />
            ))}
          </svg>
          {MONTHS.map((m, i) => (
            <div key={m} style={{ position: "absolute", left: x0 + ((x1 - x0) * i) / 3, top: y + 22, translate: "-50% 0", fontFamily: SANS, fontWeight: 600, fontSize: 18, letterSpacing: "0.22em", textTransform: "uppercase", color: C.ink }}>
              {m}
            </div>
          ))}
        </div>
      ) : null}
      <Note t={t} start={V.sugar - 0.1} end={end} top={1572} width={600}>
        <span style={{ color: C.wine }}>Sugar ↑</span>
        <span style={{ margin: "0 18px", color: C.hair }}>·</span>
        <span>Acidity ↓</span>
      </Note>
    </AbsoluteFill>
  );
};

const HarvestG: React.FC<G> = ({ t, d }) => {
  const Hh = B.harvest;
  return (
    <AbsoluteFill>
      <Mark t={t} shot="harvest" at="crate" start={Hh.crates - 0.2} end={d - 0.35} label="Small crates" note="the berries arrive whole" dx={-130} dy={-170} />
    </AbsoluteFill>
  );
};

const STEPS = ["Sort", "Destem", "Crush"];
const SortingG: React.FC<G> = ({ t, d }) => {
  const S = B.sorting;
  const at = [S.sort, S.destem, S.crush];
  const end = d - 0.3;
  const v = win(t, S.sort - 0.4, end, 0.7, 0.35);
  if (v <= 0) return null;
  const y = 1215;
  return (
    <AbsoluteFill style={{ ...reveal(v, 8) }}>
      <div style={{ position: "absolute", top: y, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 26 }}>
        {STEPS.map((s, i) => {
          const on = ramp(t, at[i], 0.4);
          return (
            <React.Fragment key={s}>
              {i ? <div style={{ width: 54, height: 1.2, background: C.hair }} /> : null}
              <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 19, letterSpacing: "0.24em", textTransform: "uppercase", color: on > 0.5 ? C.wine : "rgba(29,26,26,0.35)" }}>{s}</div>
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const VatG: React.FC<G> = ({ t, d }) => {
  const V = B.vat;
  const end = d + 0.2;
  return (
    <AbsoluteFill>
      <Mark t={t} shot="vat" at="cap" start={V.yeast + 0.3} end={end} label="Cap of skins" note="floats on top" dx={-120} dy={-120} />
      <Mark t={t} shot="vat" at="must" start={V.yeast} end={end} label="Yeasts" note="feed on the sugar" dx={110} dy={150} />
      <Note t={t} start={V.alcohol} end={end} top={1600} width={760}>
        <span style={{ fontFamily: SERIF, fontSize: 28, color: C.ink }}>
          C<sub>6</sub>H<sub>12</sub>O<sub>6</sub> → 2 C<sub>2</sub>H<sub>5</sub>OH + 2 CO<sub>2</sub>
        </span>
      </Note>
    </AbsoluteFill>
  );
};

const SkinsG: React.FC<G> = ({ t, d }) => {
  const K = B.skins;
  const end = d - 0.3;
  const k = ramp(t, K.month, 4.5, Easing.inOut(Easing.cubic));
  const v = win(t, K.month - 0.1, end, 0.7, 0.35);
  const x0 = 300, x1 = 780, y = 1500;
  // anthocyanin: a hairline drawing of the flavylium core (three rings)
  const hex6 = (cx: number, cy: number, r: number) => Array.from({ length: 6 }, (_, i) => `${cx + r * Math.cos((Math.PI / 3) * i + Math.PI / 6)},${cy + r * Math.sin((Math.PI / 3) * i + Math.PI / 6)}`).join(" ");
  const mol = ramp(t, K.antho - 0.2, 1.4);
  const r = 34;
  return (
    <AbsoluteFill>
      {v > 0 ? (
        <div style={{ position: "absolute", inset: 0, ...reveal(v, 8) }}>
          <svg width={RW} height={RH} style={{ position: "absolute", inset: 0 }}>
            <line x1={x0} y1={y} x2={x1} y2={y} stroke="rgba(247,242,238,0.3)" strokeWidth={1.2} />
            <line x1={x0} y1={y} x2={x0 + (x1 - x0) * k} y2={y} stroke={C.blush} strokeWidth={2} />
            <circle cx={x0 + (x1 - x0) * k} cy={y} r={5} fill={C.blush} />
          </svg>
          <div style={{ position: "absolute", top: y + 22, left: x0, translate: "-50% 0", fontFamily: SANS, fontWeight: 600, fontSize: 18, letterSpacing: "0.22em", color: C.white }}>DAY 1</div>
          <div style={{ position: "absolute", top: y + 22, left: x1, translate: "-50% 0", fontFamily: SANS, fontWeight: 600, fontSize: 18, letterSpacing: "0.22em", color: C.white }}>DAY 30</div>
        </div>
      ) : null}
      {mol > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: win(t, K.antho - 0.2, end, 0.6, 0.35) }}>
          <svg width={RW} height={RH} style={{ position: "absolute", inset: 0 }}>
            {[
              [450, 1250],
              [450 + r * Math.sqrt(3), 1250],
              [450 + (r * Math.sqrt(3)) / 2, 1250 - r * 1.5],
            ].map(([cx, cy], i) => (
              <polygon key={i} points={hex6(cx, cy, r)} fill="none" stroke="rgba(247,242,238,0.75)" strokeWidth={1.4} strokeDasharray={240} strokeDashoffset={240 * (1 - ramp(t, K.antho - 0.2 + i * 0.25, 0.9))} />
            ))}
          </svg>
          <div style={{ position: "absolute", top: 1235, left: 640, fontFamily: SERIF, fontStyle: "italic", fontSize: 28, color: C.white, ...reveal(ramp(t, K.antho + 0.4, 0.7), 6) }}>anthocyanin</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const PressG: React.FC<G> = ({ t, d }) => {
  const P2 = B.press;
  const end = d - 0.35;
  const v = win(t, P2.malo + 0.3, end, 0.7, 0.35);
  const k = ramp(t, P2.malo + 0.5, 1.2);
  return (
    <AbsoluteFill>
      <Mark t={t} shot="press" at="basket" start={P2.press} end={P2.malo + 0.2} label="Basket press" note="the skins are squeezed" dy={-120} />
      {v > 0 ? (
        <div style={{ position: "absolute", top: 270, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 24, ...reveal(v, 8) }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 19, letterSpacing: "0.24em", color: C.ink }}>MALIC</div>
            <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 24, color: C.mute }}>sharp</div>
          </div>
          <svg width={150} height={20}>
            <line x1={4} y1={10} x2={4 + 136 * k} y2={10} stroke={C.hair} strokeWidth={1.3} />
            <path d={`M ${132 * k - 4} 4 L ${140 * k} 10 L ${132 * k - 4} 16`} fill="none" stroke={C.hair} strokeWidth={1.3} opacity={k} />
          </svg>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 19, letterSpacing: "0.24em", color: C.wine }}>LACTIC</div>
            <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 24, color: C.mute }}>soft, round</div>
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const HeroRing: React.FC<{ t: number; start: number; end: number }> = ({ t, start, end }) => {
  const a = project("cellar", t, "hero");
  return a ? <Ring t={t} start={start} end={end} x={a.x} y={a.y + 40} r={190} /> : null;
};
const CellarG: React.FC<G> = ({ t, d }) => {
  const CL = B.cellar;
  const end = d - 0.35;
  const mid = CL.oxygen - 0.9;
  return (
    <AbsoluteFill>
      <HeroRing t={t} start={CL.oak + 0.4} end={mid} />
      <Mark t={t} shot="cellar" at="oxygen" start={CL.oxygen} end={end} label="Oxygen" note="seeps slowly through the wood" dx={-110} dy={-150} />
      <Mark t={t} shot="cellar" at="toast" start={CL.oxygen + 0.9} end={end} label="Toasted staves" note="vanilla, toast, spice" dx={110} dy={150} />
    </AbsoluteFill>
  );
};

const BLENDS = [
  { name: "Left Bank", mix: [70, 25, 5] },
  { name: "Right Bank", mix: [15, 80, 5] },
];
const VARIETY = ["Cab. Sauvignon", "Merlot", "Cab. Franc"];
const VCOL = ["#4B2238", "#8E2A3F", "#C9919C"];
const BlendG: React.FC<G> = ({ t, d }) => {
  const BL = B.blend;
  const end = d - 0.35;
  const at = [BL.left, BL.right];
  return (
    <AbsoluteFill>
      {BLENDS.map((b, i) => {
        const v = win(t, at[i] - 0.2, end, 0.7, 0.35);
        if (v <= 0) return null;
        const k = ramp(t, at[i], 1.1);
        let acc = 0;
        const y = 250 + i * 104;
        return (
          <div key={b.name} style={{ position: "absolute", top: y, left: 190, width: 700, ...reveal(v, 8) }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: SANS, fontWeight: 600, fontSize: 18, letterSpacing: "0.22em", textTransform: "uppercase", color: C.ink, marginBottom: 14 }}>
              <span>{b.name}</span>
              <span style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, letterSpacing: 0, textTransform: "none", fontSize: 23, color: C.mute }}>
                {b.mix[0] > b.mix[1] ? "Cabernet Sauvignon-led" : "Merlot-led"}
              </span>
            </div>
            <svg width={700} height={6}>
              {b.mix.map((m, j) => {
                const x = acc;
                acc += (m / 100) * 700;
                return <rect key={j} x={x * k} y={0} width={Math.max(0, (m / 100) * 700 * k - 4)} height={6} fill={VCOL[j]} />;
              })}
            </svg>
          </div>
        );
      })}
      <Note t={t} start={BL.left + 0.6} end={end} top={470} width={760}>
        {VARIETY.map((v, j) => (
          <span key={v} style={{ marginRight: 22, whiteSpace: "nowrap" }}>
            <span style={{ display: "inline-block", width: 9, height: 9, borderRadius: 9, background: VCOL[j], marginRight: 8 }} />
            {v}
          </span>
        ))}
        <div style={{ fontSize: 19, marginTop: 6, fontStyle: "italic" }}>Illustrative blends. Every château and vintage differs.</div>
      </Note>
    </AbsoluteFill>
  );
};

const FinaleG: React.FC<G> = ({ t, d }) => {
  const F = B.finale;
  const card = F.red + 0.6;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "#E9E9EA", opacity: 0.93 * ramp(t, F.red - 0.45, 1.0, Easing.inOut(Easing.cubic)) }} />
      <Mark t={t} shot="finale" at="label" start={F.bottled + 0.6} end={F.recap - 0.3} label="Cellaring" note="the finest wines evolve for decades" dx={150} dy={-160} />
      <DotGrid t={t} start={F.red - 0.4} end={d + 1} x={540} y={800} cols={9} rows={5} />
      <Arc t={t} start={F.recap - 0.2} end={d + 1} cx={540} cy={860} r={380} a0={190} a1={350} />
      <Arc t={t} start={F.recap + 0.2} end={d + 1} cx={540} cy={860} r={450} a0={15} a1={165} />
      <div style={{ position: "absolute", top: 1020, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 22, opacity: ramp(t, card, 0.9) }}>
        <div style={{ width: 70 * ramp(t, card, 1.2), height: 1.2, background: C.hair }} />
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 19, letterSpacing: "0.32em", color: C.ink }}>FROM VINE TO GLASS</div>
        <div style={{ width: 70 * ramp(t, card, 1.2), height: 1.2, background: C.hair }} />
      </div>
    </AbsoluteFill>
  );
};

const LAYERS: Record<string, React.FC<G>> = { hook: Hook, title: Title, map: MapG, soil: SoilG, grapes: GrapesG, veraison: VeraisonG, harvest: HarvestG, sorting: SortingG, vat: VatG, skins: SkinsG, press: PressG, cellar: CellarG, blend: BlendG, finale: FinaleG };

// ------------------------------------------------------------------ flybys
type Fly = { shot: string; dt: number; kind: "leaf" | "berry" | "drop"; n: number; dir: number; big?: boolean; seed: number };
const LEAF = "M100 8 C112 30 128 34 150 26 C146 48 154 62 178 70 C160 84 158 98 170 118 C146 116 132 126 128 150 C116 138 106 140 102 192 L98 192 C94 140 84 138 72 150 C68 126 54 116 30 118 C42 98 40 84 22 70 C46 62 54 48 50 26 C72 34 88 30 100 8 Z";
const Sprite: React.FC<{ kind: Fly["kind"]; id: string }> = ({ kind, id }) => {
  if (kind === "leaf")
    return (
      <svg viewBox="0 0 200 200" width="100%" height="100%">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#93A57F" />
            <stop offset="1" stopColor="#4E6343" />
          </linearGradient>
        </defs>
        <path d={LEAF} fill={`url(#${id})`} />
      </svg>
    );
  if (kind === "drop")
    return (
      <svg viewBox="0 0 200 200" width="100%" height="100%">
        <defs>
          <radialGradient id={id} cx="0.38" cy="0.62" r="0.7">
            <stop offset="0" stopColor="#B4485E" />
            <stop offset="0.55" stopColor="#7A1A30" />
            <stop offset="1" stopColor="#3E0A17" />
          </radialGradient>
        </defs>
        <path d="M100 10 C100 10 160 90 160 130 C160 165 133 190 100 190 C67 190 40 165 40 130 C40 90 100 10 100 10 Z" fill={`url(#${id})`} />
      </svg>
    );
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%">
      <defs>
        <radialGradient id={id} cx="0.36" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#7C6290" />
          <stop offset="0.45" stopColor="#3A2149" />
          <stop offset="1" stopColor="#140818" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="92" fill={`url(#${id})`} />
    </svg>
  );
};

const Flybys: React.FC<{ tg: number }> = ({ tg }) => (
  <>
    {(flybys as Fly[]).flatMap((f) => {
      const T = shotById(f.shot).start + f.dt;
      if (tg < T - 1.2 || tg > T + 1.4) return [];
      return Array.from({ length: f.n }, (_, i) => {
        const r = (k: string) => random(`fly-${f.seed}-${i}-${k}`);
        const big = !!f.big;
        const size = big ? 700 + r("s") * 450 : 280 + r("s") * 460;
        const dur = big ? 0.55 + r("d") * 0.2 : 0.75 + r("d") * 0.45;
        const t0 = T - dur / 2 + (i - (f.n - 1) / 2) * 0.09 + (r("o") - 0.5) * 0.15;
        const p = (tg - t0) / dur;
        if (p <= 0 || p >= 1) return null;
        const ease = Easing.inOut(Easing.sin)(p);
        const y0 = (big ? 0.3 : 0.12) * RH + r("y0") * RH * (big ? 0.4 : 0.76);
        const y1 = y0 + (r("y1") - 0.35) * RH * 0.5;
        const x0 = f.dir > 0 ? -size * 0.8 : RW + size * 0.8;
        const x1 = f.dir > 0 ? RW + size * 0.8 : -size * 0.8;
        const x = x0 + (x1 - x0) * ease;
        const y = y0 + (y1 - y0) * ease;
        const rot = r("r") * 360 + (r("w") - 0.5) * 240 * p;
        const blur = big ? 34 : 10 + (size / 640) * 22;
        return (
          <div key={`${f.seed}-${i}`} style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, rotate: `${rot}deg`, filter: `blur(${blur}px)`, opacity: big ? 0.92 : 0.88 }}>
            <Sprite kind={f.kind} id={`g-${f.seed}-${i}`} />
          </div>
        );
      });
    })}
  </>
);

// ------------------------------------------------------------------ assembly
export const LuxeBackdrop: React.FC = () => {
  const tg = useCurrentFrame() / FPS;
  return (
    <Img
      src={staticFile("textures/clouds.png")}
      style={{ position: "absolute", left: -110 - tg * 0.8, top: -140 + Math.sin(tg * 0.05) * 30, width: 1300, height: 2200, maxWidth: "none", mixBlendMode: "multiply", opacity: 0.9 }}
    />
  );
};

export const LuxeOverlays: React.FC = () => {
  const tg = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill>
      {SHOTS.map((s) => {
        const L = LAYERS[s.id];
        if (!L || tg < s.start - 0.6 || tg > s.end + 0.6) return null;
        return (
          <AbsoluteFill key={s.id}>
            <L t={tg - s.start} d={s.dur} />
          </AbsoluteFill>
        );
      })}
      <Kinetic tg={tg} />
      <Flybys tg={tg} />
    </AbsoluteFill>
  );
};
