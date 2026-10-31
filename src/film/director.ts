// Ties the timeline to the engine: given a global time, renders the right shot(s) and transition.
import { Engine } from "./engine/renderer";
import { SHOTS, shotsAt } from "./timeline";
import { buildShots } from "./scenes";
import { Shot } from "./scenes/common";

export class Director {
  engine: Engine;
  shots: Record<string, Shot>;
  private ready = new Set<string>();
  constructor(canvas: HTMLCanvasElement, renderScale = 1, samples = 4) {
    this.engine = new Engine(canvas, renderScale, samples);
    this.shots = buildShots();
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
    const fa = sa ? sa.frame(t - a.start) : null;
    if (b && tr && p !== undefined) {
      const sb = this.shot(b.id);
      const fb = sb ? sb.frame(t - b.start) : null;
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
    this.engine.render(s.frame(local));
  }
}
