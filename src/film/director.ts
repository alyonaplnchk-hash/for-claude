// Ties the timeline to the engine: given a global time, renders the right shot(s) and transition.
import { Engine } from "./engine/renderer";
import { V3 } from "./engine/math";
import { SHOTS, shotsAt } from "./timeline";
import { buildShots } from "./scenes";
import { modernize, setFloor } from "./modern";
import { disk } from "./engine/geometry";
import { Shot } from "./scenes/common";

export class Director {
  engine: Engine;
  shots: Record<string, Shot>;
  private ready = new Set<string>();
  private portrait: boolean;
  constructor(canvas: HTMLCanvasElement, renderScale = 1, samples = 4) {
    this.engine = new Engine(canvas, renderScale, samples);
    this.portrait = canvas.height > canvas.width;
    this.shots = buildShots(this.portrait);
    setFloor(this.engine.mesh(disk(400, 96)));
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
    const fa = sa ? modernize(a.id, sa.frame(t - a.start)) : null;
    if (b && tr && p !== undefined) {
      const sb = this.shot(b.id);
      const fb = sb ? modernize(b.id, sb.frame(t - b.start)) : null;
      // dips go through the pale backdrop in the vertical cut and through warm dark in the landscape cut
      const col = tr.col ?? (tr.type === 6 ? (this.portrait ? ([0.905, 0.905, 0.91] as V3) : ([0.035, 0.028, 0.022] as V3)) : undefined);
      if (fa && fb) return this.engine.render(fa, fb, { type: tr.type, p, col, dir: tr.dir });
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
    this.engine.render(modernize(id, s.frame(local)));
  }
}
