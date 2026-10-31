import { Shot, ShotFactory } from "./common";
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

export function buildShots(): Record<string, Shot> {
  const out: Record<string, Shot> = {};
  for (const s of SHOTS) {
    const f = FACTORIES[s.id];
    if (f) out[s.id] = f(s.dur);
  }
  return out;
}
