// Story beats in shot-local seconds. Offsets inside each narration clip come from the pauses
// found with ffmpeg silencedetect, so visuals and infographics land on the spoken words.
import { shotById } from "./timeline";

const vo = (shot: string, id: string, offset = 0) => {
  const s = shotById(shot);
  const v = s.vo.find((x) => x.id === id);
  return (v ? v.start : 0) + offset;
};

export const B = {
  hook: { squeeze: vo("hook", "hook1", 0), clear: vo("hook", "hook1", 1.5), question: vo("hook", "hook2", 0), ruby: vo("hook", "hook2", 1.75) },
  map: {
    france: vo("map", "map1", 0),
    lat45: vo("map", "map1", 2.55),
    garonne: vo("map", "map1", 4.75),
    dordogne: vo("map", "map1", 5.45),
    gironde: vo("map", "map1", 6.7),
    split: vo("map", "map2", 0),
    left: vo("map", "map2", 1.7),
    right: vo("map", "map2", 2.7),
  },
  soil: { left: vo("soil", "soil1", 0), gravel: vo("soil", "soil1", 1.2), heat: vo("soil", "soil1", 3.0), cab: vo("soil", "soil1", 4.5), right: vo("soil", "soil2", 0), clay: vo("soil", "soil2", 1.1), merlot: vo("soil", "soil2", 2.5) },
  grapes: { merlot: vo("grapes", "grapes1", 0.1), cs: vo("grapes", "grapes1", 3.1), cf: vo("grapes", "grapes1", 4.0) },
  veraison: { summer: vo("veraison", "harvest1", 0), turn: vo("veraison", "harvest1", 0.85), sugar: vo("veraison", "harvest1", 3.25), acid: vo("veraison", "harvest1", 4.1) },
  harvest: { sept: vo("harvest", "harvest2", 0.3), hand: vo("harvest", "harvest2", 2.5), crates: vo("harvest", "harvest2", 3.6) },
  sorting: { sort: vo("sorting", "sort1", 1.4), destem: vo("sorting", "sort1", 2.1), crush: vo("sorting", "sort1", 2.9) },
  vat: { yeast: vo("vat", "ferm1", 1.15), sugar: vo("vat", "ferm1", 1.7), alcohol: vo("vat", "ferm1", 2.3), co2: vo("vat", "ferm1", 3.25) },
  skins: { answer: vo("skins", "ferm2", 0), skins: vo("skins", "ferm2", 1.4), month: vo("skins", "ferm3", 0.2), soak: vo("skins", "ferm3", 1.0), antho: vo("skins", "ferm3", 2.5), tannin: vo("skins", "ferm3", 5.0) },
  press: { press: vo("press", "press1", 0.3), malo: vo("press", "press1", 2.4), malic: vo("press", "press1", 4.2) },
  cellar: { oak: vo("cellar", "barrel1", 0.9), litres: vo("cellar", "barrel1", 2.45), months: vo("cellar", "barrel1", 4.8), oxygen: vo("cellar", "barrel2", 0.9), tannin: vo("cellar", "barrel2", 2.6), vanilla: vo("cellar", "barrel2", 4.6), toast: vo("cellar", "barrel2", 5.6), spice: vo("cellar", "barrel2", 6.1) },
  blend: { art: vo("blend", "blend1", 0), blend: vo("blend", "blend1", 2.25), left: vo("blend", "blend1", 3.2), right: vo("blend", "blend1", 6.35) },
  finale: { bottled: vo("finale", "bottle1", 0), decades: vo("finale", "bottle1", 2.6), recap: vo("finale", "end1", 0), red: vo("finale", "end1", 2.07), endcard: vo("finale", "end1", 3.4) },
};
