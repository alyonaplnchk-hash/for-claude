// Shot list and timing. Shot lengths are derived from the narration clip durations, so the
// picture always follows the voice.
import voDur from "./vo-durations.json";

export const FPS = 30;
export const W = 1920;
export const H = 1080;

// Transition types understood by the engine's transition shader.
export const TR = { DISSOLVE: 0, WHIP: 1, ZOOM: 2, INK: 3, FLASH: 4 } as const;

type ShotSpec = {
  id: string;
  vo?: string[];
  lead?: number;
  gap?: number;
  tail?: number;
  fixed?: number;
  tr?: { type: number; dur: number; col?: [number, number, number]; dir?: [number, number] };
};

export const SHOT_SPECS: ShotSpec[] = [
  { id: "hook", vo: ["hook1", "hook2"], lead: 0.35, gap: 0.85, tail: 0.75 },
  { id: "title", fixed: 3.4, tr: { type: TR.INK, dur: 0.9, col: [1.0, 0.25, 0.35] } },
  { id: "map", vo: ["map1", "map2"], lead: 0.6, gap: 0.45, tail: 0.7, tr: { type: TR.ZOOM, dur: 0.8 } },
  { id: "soil", vo: ["soil1", "soil2"], lead: 0.45, gap: 0.55, tail: 0.7, tr: { type: TR.ZOOM, dur: 0.8 } },
  { id: "grapes", vo: ["grapes1"], lead: 0.45, tail: 0.6, tr: { type: TR.WHIP, dur: 0.6, dir: [1, 0] } },
  { id: "veraison", vo: ["harvest1"], lead: 0.35, tail: 0.25, tr: { type: TR.DISSOLVE, dur: 0.8 } },
  { id: "harvest", vo: ["harvest2"], lead: 0.2, tail: 0.6, tr: { type: TR.WHIP, dur: 0.6, dir: [1, 0] } },
  { id: "sorting", vo: ["sort1"], lead: 0.35, tail: 0.5, tr: { type: TR.WHIP, dur: 0.6, dir: [-1, 0] } },
  { id: "vat", vo: ["ferm1"], lead: 0.4, tail: 0.45, tr: { type: TR.WHIP, dur: 0.6, dir: [0, 1] } },
  { id: "skins", vo: ["ferm2", "ferm3"], lead: 0.3, gap: 0.45, tail: 0.6, tr: { type: TR.ZOOM, dur: 0.8 } },
  { id: "press", vo: ["press1"], lead: 0.45, tail: 0.55, tr: { type: TR.WHIP, dur: 0.6, dir: [1, 0] } },
  { id: "cellar", vo: ["barrel1", "barrel2"], lead: 0.6, gap: 0.5, tail: 0.6, tr: { type: TR.FLASH, dur: 0.8, col: [1.0, 0.75, 0.45] } },
  { id: "blend", vo: ["blend1"], lead: 0.45, tail: 0.6, tr: { type: TR.WHIP, dur: 0.6, dir: [-1, 0] } },
  { id: "finale", vo: ["bottle1", "end1"], lead: 0.45, gap: 0.8, tail: 4.2, tr: { type: TR.DISSOLVE, dur: 1.0 } },
];

export type ShotTiming = { id: string; start: number; end: number; dur: number; vo: { id: string; start: number; dur: number }[]; tr?: ShotSpec["tr"] };

const durations = voDur as Record<string, number>;

export const SHOTS: ShotTiming[] = (() => {
  let t = 0;
  return SHOT_SPECS.map((s) => {
    const vo: ShotTiming["vo"] = [];
    let local = s.lead ?? 0.4;
    (s.vo ?? []).forEach((id, i) => {
      if (i > 0) local += s.gap ?? 0.5;
      vo.push({ id, start: local, dur: durations[id] });
      local += durations[id];
    });
    const dur = s.fixed ?? local + (s.tail ?? 0.5);
    const shot = { id: s.id, start: t, end: t + dur, dur, vo, tr: s.tr };
    t += dur;
    return shot;
  });
})();

export const TOTAL = SHOTS[SHOTS.length - 1].end;
export const TOTAL_FRAMES = Math.ceil(TOTAL * FPS);

export const shotById = (id: string) => SHOTS.find((s) => s.id === id)!;

// Which shot(s) are visible at global time t, and the transition between them.
export function shotsAt(t: number) {
  for (let i = 0; i < SHOTS.length; i++) {
    const s = SHOTS[i];
    const next = SHOTS[i + 1];
    if (next?.tr) {
      const half = next.tr.dur / 2;
      if (t >= next.start - half && t < next.start + half) {
        return { a: s, b: next, p: (t - (next.start - half)) / next.tr.dur, tr: next.tr };
      }
    }
    if (t < s.end || i === SHOTS.length - 1) return { a: s };
  }
  return { a: SHOTS[SHOTS.length - 1] };
}
