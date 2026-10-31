// Infographic building blocks in a science-documentary style. All motion is driven by the
// shot-local time `t` (seconds), so every element is frame-accurate in Remotion.
import React from "react";
import { Easing, interpolate } from "remotion";
import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { Engine } from "../engine/renderer";
import { buildShots } from "../scenes";
import { W, H } from "../timeline";

// Playfair Display (OFL), bundled locally in public/fonts so renders never depend on the network.
loadFont({ family: "Playfair Display", url: staticFile("fonts/PlayfairDisplay.woff2"), weight: "400 900", style: "normal" });
loadFont({ family: "Playfair Display", url: staticFile("fonts/PlayfairDisplay-Italic.woff2"), weight: "400 900", style: "italic" });
export const SERIF = "'Playfair Display', 'DejaVu Serif', serif";
export const SANS = "Inter, 'Inter Display', 'DejaVu Sans', sans-serif";
export const DISPLAY = "'Inter Display', Inter, sans-serif";
export const MONO = "'JetBrains Mono', 'DejaVu Sans Mono', monospace";

export const COL = {
  amber: "#ffb23a",
  magenta: "#ff3d8b",
  cyan: "#5fe1ff",
  ruby: "#ff2e55",
  gold: "#f2c46d",
  green: "#9fe06a",
  white: "#ffffff",
  ink: "rgba(8,8,12,0.55)",
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const OUT = Easing.bezier(0.16, 1, 0.3, 1);

// 0..1 envelope: rises over `fin` after `a`, falls over `fout` before `b`.
export const env = (t: number, a: number, b = 1e9, fin = 0.45, fout = 0.35) =>
  Math.min(interpolate(t, [a, a + fin], [0, 1], { ...clamp, easing: OUT }), interpolate(t, [b - fout, b], [1, 0], { ...clamp, easing: Easing.in(Easing.cubic) }));
export const ramp = (t: number, a: number, d = 0.5) => interpolate(t, [a, a + d], [0, 1], { ...clamp, easing: OUT });

const shots = buildShots();
export function anchor(shot: string, t: number, name: string) {
  const s = shots[shot];
  const a = s?.anchors?.(t)?.[name];
  if (!a) return { x: -999, y: -999, visible: false };
  return Engine.project(s.camera(t), a, W, H);
}

export const shadow = "0 2px 18px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.6)";

// Pointer from a 3D anchor to a text label: pulsing dot, elbow line that draws itself, label.
export const Callout: React.FC<{
  t: number;
  shot: string;
  at: string;
  start: number;
  end?: number;
  dx: number;
  dy: number;
  title: string;
  sub?: string;
  color?: string;
  size?: number;
}> = ({ t, shot, at, start, end = 1e9, dx, dy, title, sub, color = COL.white, size = 40 }) => {
  const a = anchor(shot, t, at);
  const v = env(t, start, end, 0.6, 0.35);
  if (v <= 0 || !a.visible) return null;
  const draw = ramp(t, start, 0.55);
  const txt = ramp(t, start + 0.3, 0.5);
  const ex = a.x + dx * 0.55, ey = a.y + dy;
  const lx = a.x + dx, ly = ey;
  const len = Math.hypot(ex - a.x, ey - a.y) + Math.abs(lx - ex);
  const right = dx >= 0;
  const pulse = (t * 1.4) % 1;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: v, pointerEvents: "none" }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <circle cx={a.x} cy={a.y} r={7 + pulse * 22} fill="none" stroke={color} strokeWidth={2} opacity={(1 - pulse) * 0.8} />
        <circle cx={a.x} cy={a.y} r={7} fill={color} stroke="rgba(0,0,0,0.4)" strokeWidth={1.5} />
        <path
          d={`M ${a.x} ${a.y} L ${ex} ${ey} L ${lx} ${ly}`}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeDasharray={len}
          strokeDashoffset={len * (1 - draw)}
          style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.6))" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: right ? lx + 16 : undefined,
          right: right ? undefined : W - lx + 16,
          top: ly - size * 0.72,
          textAlign: right ? "left" : "right",
          opacity: txt,
          translate: `${(1 - txt) * (right ? -20 : 20)}px 0px`,
          color: "#fff",
          textShadow: shadow,
          whiteSpace: "nowrap",
        }}
      >
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: size, letterSpacing: "0.04em", color, lineHeight: 1.05 }}>{title}</div>
        {sub ? <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: size * 0.62, marginTop: 6, opacity: 0.95 }}>{sub}</div> : null}
      </div>
    </div>
  );
};

// Floating label pinned to a 3D point without a leader (map place names).
export const Pin: React.FC<{ t: number; shot: string; at: string; start: number; end?: number; text: string; color?: string; size?: number; dot?: boolean; italic?: boolean; dy?: number }> = ({ t, shot, at, start, end = 1e9, text, color = "#fff", size = 30, dot = false, italic = false, dy = -24 }) => {
  const a = anchor(shot, t, at);
  const v = env(t, start, end, 0.6, 0.35);
  if (v <= 0 || !a.visible) return null;
  return (
    <div style={{ position: "absolute", left: a.x, top: a.y + dy, translate: "-50% -100%", opacity: v, scale: String(0.9 + 0.1 * v), textAlign: "center", whiteSpace: "nowrap" }}>
      <div style={{ fontFamily: italic ? SERIF : DISPLAY, fontStyle: italic ? "italic" : "normal", fontWeight: italic ? 400 : 800, fontSize: size, letterSpacing: italic ? "0.02em" : "0.18em", color, textShadow: shadow }}>{text}</div>
      {dot ? <div style={{ width: 2, height: 18, background: color, margin: "6px auto 0", opacity: 0.8 }} /> : null}
    </div>
  );
};

// Chapter tag, top-left.
export const Kicker: React.FC<{ t: number; n: string; label: string; start?: number; end: number }> = ({ t, n, label, start = 0.15, end }) => {
  const v = env(t, start, end, 0.5, 0.3);
  if (v <= 0) return null;
  const w = ramp(t, start + 0.1, 0.7);
  return (
    <div style={{ position: "absolute", left: 100, top: 84, opacity: v, color: "#fff", textShadow: shadow }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
        <span style={{ fontFamily: MONO, fontSize: 26, fontWeight: 600, color: COL.gold }}>{n}</span>
        <span style={{ fontFamily: DISPLAY, fontSize: 30, fontWeight: 800, letterSpacing: "0.32em" }}>{label}</span>
      </div>
      <div style={{ height: 2, width: 320 * w, background: "linear-gradient(90deg, #f2c46d, rgba(242,196,109,0))", marginTop: 12 }} />
    </div>
  );
};

// Glass data panel.
export const Card: React.FC<{ t: number; start: number; end: number; x: number; y: number; w: number; title?: string; children: React.ReactNode; accent?: string }> = ({ t, start, end, x, y, w, title, children, accent = COL.gold }) => {
  const v = env(t, start, end, 0.55, 0.35);
  if (v <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        opacity: v,
        translate: `0px ${(1 - v) * 24}px`,
        background: "linear-gradient(160deg, rgba(14,12,18,0.62), rgba(14,12,18,0.42))",
        border: "1px solid rgba(255,255,255,0.16)",
        borderRadius: 18,
        padding: "26px 30px",
        color: "#fff",
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        backdropFilter: "blur(10px)",
      }}
    >
      {title ? (
        <div style={{ fontFamily: DISPLAY, fontSize: 24, fontWeight: 800, letterSpacing: "0.26em", color: accent, marginBottom: 18 }}>{title}</div>
      ) : null}
      {children}
    </div>
  );
};

export const Chip: React.FC<{ t: number; start: number; end: number; text: string; color: string; x: number; y: number; size?: number }> = ({ t, start, end, text, color, x, y, size = 34 }) => {
  const v = env(t, start, end, 0.4, 0.3);
  if (v <= 0) return null;
  const pop = interpolate(t, [start, start + 0.18, start + 0.36], [0.6, 1.08, 1], clamp);
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: v, scale: String(pop), translate: "-50% -50%", padding: `${size * 0.32}px ${size * 0.7}px`, borderRadius: 999, background: color, color: "#160a10", fontFamily: DISPLAY, fontWeight: 800, fontSize: size, letterSpacing: "0.12em", boxShadow: `0 8px 30px ${color}66`, whiteSpace: "nowrap" }}>
      {text}
    </div>
  );
};

// Process tracker shown through the film.
export const STEPS = ["TERROIR", "GRAPES", "RIPENING", "HARVEST", "CRUSH", "FERMENT", "PRESS", "OAK", "BLEND", "BOTTLE"];
export const Stepper: React.FC<{ active: number; v: number }> = ({ active, v }) => {
  if (v <= 0) return null;
  return (
    <div style={{ position: "absolute", right: 100, top: 92, display: "flex", gap: 22, alignItems: "center", opacity: v * 0.95 }}>
      {STEPS.map((s, i) => {
        const on = i === active;
        const done = i < active;
        return (
          <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ width: on ? 14 : 9, height: on ? 14 : 9, borderRadius: 9, background: on ? COL.gold : done ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.3)", boxShadow: on ? "0 0 14px #f2c46d" : "none" }} />
            <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 15, letterSpacing: "0.16em", color: on ? COL.gold : "rgba(255,255,255,0.6)", textShadow: shadow }}>{s}</div>
          </div>
        );
      })}
    </div>
  );
};

// Number that counts up.
export const Counter: React.FC<{ t: number; start: number; from: number; to: number; dur?: number; suffix?: string; decimals?: number; style?: React.CSSProperties }> = ({ t, start, from, to, dur = 1.2, suffix = "", decimals = 0, style }) => {
  const k = interpolate(t, [start, start + dur], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const val = from + (to - from) * k;
  return (
    <span style={style}>
      {val.toFixed(decimals)}
      {suffix}
    </span>
  );
};
