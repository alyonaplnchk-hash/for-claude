// Ties the timeline to the engine: given a global time, renders the right shot(s) and transition.
import { Engine, ShotFrame } from "./engine/renderer";
import { SHOTS, shotsAt } from "./timeline";
import { buildShots } from "./scenes";
import { Shot } from "./scenes/common";

export class Director {
  engine: Engine;
  shots: Record<string, Shot>;
  private ready = new Set<string>();
  constructor(canvas: HTMLCanvasElement, renderScale = 1, samples = 4) {
    this.engine = new Engine(canvas, renderScale, samples);
    this.shots = buildShots(canvas.height > canvas.width);
  }
  private shot(id: string) {
    const s = this.shots[id];
    if (!s) return null;
    if (!this.ready.has(id)) {
      s.init(this.engine);
      this.ready.add(id);
    }
    return s;
  }
  render(t: number) {
    const { a, b, p, tr } = shotsAt(t);
    this.engine.time = t;
    const sa = this.shot(a.id);
    const fa = sa ? grade(sa.frame(t - a.start)) : null;
    if (b && tr && p !== undefined) {
      const sb = this.shot(b.id);
      const fb = sb ? grade(sb.frame(t - b.start)) : null;
      if (fa && fb) return this.engine.render(fa, fb, { type: tr.type, p, col: tr.col, dir: tr.dir });
      if (fb && !fa) return this.engine.render(fb);
    }
    if (fa) this.engine.render(fa);
  }
  // Render a single shot at local time (for previews).
  renderShot(id: string, local: number) {
    const s = this.shot(id);
    if (!s) return;
    const st = SHOTS.find((x) => x.id === id)!;
    this.engine.time = st.start + local;
    this.engine.render(grade(s.frame(local)));
  }
}

// House grade on top of every shot: quieter saturation and bloom, gentle contrast,
// warm highlights and lifted blacks, fine grain.
function grade(f: ShotFrame): ShotFrame {
  const p = { ...(f.post ?? {}) };
  p.sat = (p.sat ?? 1.05) * 0.94;
  p.bloom = (p.bloom ?? 0.6) * 0.85;
  p.contrast = 1 + ((p.contrast ?? 1.05) - 1) * 0.7;
  p.vignette = Math.max(p.vignette ?? 0.45, 0.5);
  p.grain = 0.022;
  p.ca = 0.004;
  p.lift = p.lift ?? [0.012, 0.009, 0.006];
  p.tintHigh = p.tintHigh ?? [0.05, 0.028, -0.01];
  return { ...f, post: p };
}
