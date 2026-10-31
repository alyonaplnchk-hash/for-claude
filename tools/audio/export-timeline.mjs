// Dumps shot timing, narration placement and story beats (global seconds) to JSON for the audio mix.
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const entry = `import { SHOTS, TOTAL } from "./timeline"; import { B } from "./beats";
const beats = {}; for (const [shot, o] of Object.entries(B)) { const s = SHOTS.find((x) => x.id === shot); for (const [k, v] of Object.entries(o)) beats[shot + "." + k] = s.start + v; }
console.log(JSON.stringify({ total: TOTAL, shots: SHOTS, beats }));`;
const res = await build({ stdin: { contents: entry, resolveDir: path.join(root, "src/film"), loader: "ts" }, bundle: true, write: false, platform: "node", format: "cjs", loader: { ".json": "json" } });
const out = [];
const orig = console.log;
console.log = (s) => out.push(s);
new Function("require", "module", "exports", res.outputFiles[0].text)(() => ({}), { exports: {} }, {});
console.log = orig;
fs.writeFileSync(path.join(root, "tools/audio/timeline.json"), out[0]);
console.log("wrote tools/audio/timeline.json");
