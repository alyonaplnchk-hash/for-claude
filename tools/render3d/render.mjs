// Renders the 3D layer of the film to JPEG frames with the custom WebGL2 engine running in
// headless Chromium (software GPU). Frames land in public/frames3d/NNNNN.jpg for Remotion.
// Usage: node tools/render3d/render.mjs [--from=0] [--to=N] [--step=1] [--workers=2] [--scale=0.75]
//        [--out=public/frames3d] [--shots=hook,map] [--force]
import { build } from "esbuild";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const req = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = req("playwright"));
} catch {
  const g = execSync("npm root -g").toString().trim();
  ({ chromium } = createRequire(g + "/")("playwright"));
}
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const opts = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith("--")).map((a) => { const [k, v] = a.slice(2).split("="); return [k, v ?? "1"]; }));
const out = path.resolve(root, opts.out ?? "public/frames3d");
fs.mkdirSync(out, { recursive: true });
const res = await build({ entryPoints: [path.join(root, "src/film/harness.ts")], bundle: true, write: false, format: "iife", target: "es2020", loader: { ".json": "json" } });
const js = res.outputFiles[0].text;
const FPS = 30;

// figure out the frame list
const probe = await chromium.launch();
const pp = await probe.newPage();
await pp.setContent(`<canvas id="c" width="64" height="36"></canvas>`);
await pp.addScriptTag({ content: js });
const info = await pp.evaluate(() => ({ shots: window.Film.timeline().shots, total: window.Film.timeline().total }));
await probe.close();
const totalFrames = Math.ceil(info.total * FPS);
let frames = [];
const from = Number(opts.from ?? 0), to = Number(opts.to ?? totalFrames - 1), step = Number(opts.step ?? 1);
for (let f = from; f <= to; f += step) frames.push(f);
if (opts.shots) {
  const ids = opts.shots.split(",");
  const ranges = info.shots.filter((s) => ids.includes(s.id)).map((s) => [Math.floor((s.start - 0.6) * FPS), Math.ceil((s.end + 0.6) * FPS)]);
  frames = frames.filter((f) => ranges.some(([a, b]) => f >= a && f <= b));
}
if (!opts.force) frames = frames.filter((f) => !fs.existsSync(path.join(out, String(f).padStart(5, "0") + ".jpg")));
const workers = Number(opts.workers ?? 2);
console.log(`rendering ${frames.length} frames with ${workers} workers -> ${out}`);
const chunks = Array.from({ length: workers }, (_, w) => frames.slice(Math.floor((w * frames.length) / workers), Math.floor(((w + 1) * frames.length) / workers)));
const t0 = Date.now();
let done = 0;
await Promise.all(
  chunks.map(async (list, w) => {
    if (!list.length) return;
    const browser = await chromium.launch({ args: ["--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    page.on("pageerror", (e) => console.log(`[w${w}] pageerror`, e.message));
    await page.setContent(`<html><body style="margin:0;background:#000"><canvas id="c" width="1920" height="1080"></canvas></body></html>`);
    await page.addScriptTag({ content: js });
    await page.evaluate(([s]) => window.Film.setup(document.getElementById("c"), s, 4), [Number(opts.scale ?? 0.75)]);
    for (const f of list) {
      const data = await page.evaluate((t) => window.Film.frameJPEG(t, 0.93), f / FPS);
      fs.writeFileSync(path.join(out, String(f).padStart(5, "0") + ".jpg"), Buffer.from(data.split(",")[1], "base64"));
      done++;
      if (done % 20 === 0) {
        const el = (Date.now() - t0) / 1000;
        console.log(`${done}/${frames.length}  ${(el / done).toFixed(2)} s/frame  eta ${((frames.length - done) * el / done / 60).toFixed(1)} min`);
      }
    }
    await browser.close();
  }),
);
console.log(`done in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
