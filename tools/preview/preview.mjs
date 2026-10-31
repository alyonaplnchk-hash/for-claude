// Fast engine preview: bundles src/film/harness.ts with esbuild, renders chosen times in headless
// Chromium and saves PNGs + timings. Usage:
//   node tools/preview/preview.mjs out_dir "hook@1.5" "hook@4" 12.3 ...   (shot@local or global seconds)
//   options: --scale=1 --samples=4
import { build } from "esbuild";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Playwright comes preinstalled globally in the cloud image; fall back to it if not local.
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
const args = process.argv.slice(2);
const opts = Object.fromEntries(args.filter((a) => a.startsWith("--")).map((a) => a.slice(2).split("=")));
const [outDir, ...specs] = args.filter((a) => !a.startsWith("--"));
fs.mkdirSync(outDir, { recursive: true });
const res = await build({ entryPoints: [path.join(root, "src/film/harness.ts")], bundle: true, write: false, format: "iife", target: "es2020", loader: { ".json": "json" } });
const js = res.outputFiles[0].text;
const browser = await chromium.launch({ args: ["--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on("console", (m) => console.log("[page]", m.text()));
page.on("pageerror", (e) => console.log("[pageerror]", e.message));
await page.setContent(`<html><body style="margin:0;background:#000"><canvas id="c" width="1920" height="1080"></canvas></body></html>`);
await page.addScriptTag({ content: js });
const info = await page.evaluate(([s, n]) => window.Film.setup(document.getElementById("c"), s, n), [Number(opts.scale ?? 1), Number(opts.samples ?? 4)]);
if (opts.list) console.log(info.shots.map((s) => `${s.id} ${s.start.toFixed(2)}-${s.end.toFixed(2)} (${s.dur.toFixed(2)})`).join("\n"), "\nTOTAL", info.total);
for (const spec of specs) {
  let ms;
  if (spec.includes("@")) {
    const [id, lt] = spec.split("@");
    ms = await page.evaluate(([i, l]) => window.Film.renderShot(i, l), [id, Number(lt)]);
  } else ms = await page.evaluate((t) => window.Film.render(t), Number(spec));
  if (opts.profile && spec.includes("@")) {
    const [id, lt] = spec.split("@");
    const prof = await page.evaluate(([i, l]) => window.Film.profileShot(i, l), [id, Number(lt)]);
    console.log("  profile", Object.entries(prof).map(([k, v]) => `${k}=${v.toFixed(0)}`).join(" "));
  }
  const t0 = Date.now();
  const file = path.join(outDir, spec.replace(/[@.]/g, "_") + ".png");
  await page.locator("#c").screenshot({ path: file });
  console.log(spec, "render", ms.toFixed(0), "ms", "shot", Date.now() - t0, "ms ->", file);
}
await browser.close();
