// Regenerates src/scriptGlyphs.ts: the Pinyon Script outlines used to
// "write by hand" (HandwrittenWord). Add a word to scripts/script-words.txt,
// then run:  node scripts/gen-script-glyphs.cjs && npx prettier -w src/scriptGlyphs.ts
const fs = require("fs");
const path = require("path");
const opentype = require("opentype.js");

const root = path.join(__dirname, "..");
const font = opentype.loadSync(
  path.join(__dirname, "fonts/pinyon-script-latin-400-normal.woff"),
);
const words = fs
  .readFileSync(path.join(__dirname, "script-words.txt"), "utf8")
  .split("\n")
  .map((w) => w.trim())
  .filter(Boolean);

const SIZE = 200;
const out = {};
for (const word of words) {
  const glyphs = font.stringToGlyphs(word);
  let x = 0;
  const parts = [];
  glyphs.forEach((g, i) => {
    const d = g.getPath(x, 0, SIZE).toPathData(2);
    if (d) parts.push({ d, x });
    x += (g.advanceWidth * SIZE) / font.unitsPerEm;
    if (i < glyphs.length - 1) {
      x += (font.getKerningValue(g, glyphs[i + 1]) * SIZE) / font.unitsPerEm;
    }
  });
  const bb = font.getPath(word, 0, 0, SIZE).getBoundingBox();
  out[word] = { glyphs: parts, box: [bb.x1, bb.y1, bb.x2 - bb.x1, bb.y2 - bb.y1] };
}

fs.writeFileSync(
  path.join(root, "src/scriptGlyphs.ts"),
  "export const SCRIPT_GLYPHS = " + JSON.stringify(out) + " as const;\n",
);
console.log("Wrote", Object.keys(out).join(", "));
