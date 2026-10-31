// Standalone entry for fast previews outside Remotion (bundled by tools/preview).
import { Director } from "./director";
import { SHOTS, TOTAL } from "./timeline";

let d: Director;
const px = new Uint8Array(4);
// readPixels forces the GPU process to finish, so timings are real.
const sync = () => d.engine.gl.readPixels(0, 0, 1, 1, d.engine.gl.RGBA, d.engine.gl.UNSIGNED_BYTE, px);
(window as any).Film = {
  timeline() {
    return { shots: SHOTS, total: TOTAL };
  },
  frameJPEG(t: number, q = 0.93) {
    d.render(t);
    return (d.engine.gl.canvas as HTMLCanvasElement).toDataURL("image/jpeg", q);
  },
  setup(canvas: HTMLCanvasElement, scale = 1, samples = 4) {
    d = new Director(canvas, scale, samples);
    return { shots: SHOTS, total: TOTAL };
  },
  render(t: number) {
    const t0 = performance.now();
    d.render(t);
    sync();
    return performance.now() - t0;
  },
  profileShot(id: string, local: number) {
    d.engine.profile = {};
    d.renderShot(id, local);
    const p = d.engine.profile;
    d.engine.profile = null;
    delete p._last;
    return p;
  },
  renderShot(id: string, local: number) {
    const t0 = performance.now();
    d.renderShot(id, local);
    sync();
    return performance.now() - t0;
  },
};
