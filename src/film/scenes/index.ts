import { Shot, ShotFactory, Camera } from "./common";
import { SHOTS } from "../timeline";
import { hook } from "./hook";
import { title } from "./title";
import { map } from "./map";
import { soil } from "./soil";
import { grapes, veraison, harvest } from "./grapes";
import { sorting, vat, skins } from "./winery";
import { press, cellar } from "./cellar";
import { blend, finale } from "./finale";

const FACTORIES: Record<string, ShotFactory> = {
  hook,
  title,
  map,
  soil,
  grapes,
  veraison,
  harvest,
  sorting,
  vat,
  skins,
  press,
  cellar,
  blend,
  finale,
};

// Vertical framing: widen the vertical field of view so the subject keeps a similar size,
// unless the shot provides its own portrait camera.
const PORTRAIT_K = 1.6;
export function portraitCamera(c: Camera): Camera {
  const fov = (2 * Math.atan(Math.tan((c.fov * Math.PI) / 360) * PORTRAIT_K) * 180) / Math.PI;
  return { ...c, fov };
}
// how far to pull the camera back in the vertical cut, for more air around the subject
const PULL: Record<string, number> = { hook: 1.45, map: 1.1, soil: 1.25, grapes: 1.2, veraison: 1.3, sorting: 1.15, vat: 1.25, press: 1.6, cellar: 1.1, blend: 1.1, finale: 1.25 };
function pullBack(c: Camera, k: number): Camera {
  if (k === 1) return c;
  const p: [number, number, number] = [c.target[0] + (c.pos[0] - c.target[0]) * k, c.target[1] + (c.pos[1] - c.target[1]) * k, c.target[2] + (c.pos[2] - c.target[2]) * k];
  return { ...c, pos: p };
}
function toPortrait(s: Shot, id: string): Shot {
  const cam = (t: number) => pullBack(s.cameraPortrait ? s.cameraPortrait(t) : portraitCamera(s.camera(t)), PULL[id] ?? 1);
  return {
    init: (e) => s.init(e),
    camera: cam,
    anchors: s.anchors ? (t) => s.anchors!(t) : undefined,
    frame: (t) => {
      const f = s.frame(t);
      const c = cam(t);
      // keep depth of field on the subject when the portrait camera sits at another distance
      if (f.post?.dof) {
        const d = (k: Camera) => Math.hypot(k.pos[0] - k.target[0], k.pos[1] - k.target[1], k.pos[2] - k.target[2]);
        f.post = { ...f.post, dof: { ...f.post.dof, focus: (f.post.dof.focus * d(c)) / d(s.camera(t)) } };
      }
      return { ...f, camera: c };
    },
  };
}

export function buildShots(portrait = false): Record<string, Shot> {
  const out: Record<string, Shot> = {};
  for (const s of SHOTS) {
    const f = FACTORIES[s.id];
    if (f) out[s.id] = portrait ? toPortrait(f(s.dur), s.id) : f(s.dur);
  }
  return out;
}
