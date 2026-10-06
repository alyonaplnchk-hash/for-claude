/**
 * Font loading. Fonts are bundled in public/fonts (SIL Open Font License, see
 * the OFL-*.txt files next to them), so renders never depend on the network.
 *
 * `loadFont()` from @remotion/fonts delays rendering until each file is
 * ready, so frames never render with a fallback font. Import `FONTS` in any
 * component that sets a fontFamily, so scenes also work when previewed alone.
 *
 * To add a weight: drop the .woff2 into public/fonts and add a loadFont()
 * call. To use a Google Font instead, see AGENTS.md → "Fonts".
 */
import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

const DISPLAY = "Space Grotesk";
const BODY = "Inter";
const MONO = "JetBrains Mono";

const files = [
  {
    family: DISPLAY,
    weight: "500",
    file: "space-grotesk-latin-500-normal.woff2",
  },
  {
    family: DISPLAY,
    weight: "700",
    file: "space-grotesk-latin-700-normal.woff2",
  },
  { family: BODY, weight: "400", file: "inter-latin-400-normal.woff2" },
  { family: BODY, weight: "500", file: "inter-latin-500-normal.woff2" },
  { family: BODY, weight: "600", file: "inter-latin-600-normal.woff2" },
  {
    family: MONO,
    weight: "500",
    file: "jetbrains-mono-latin-500-normal.woff2",
  },
] as const;

for (const { family, weight, file } of files) {
  loadFont({ family, weight, url: staticFile(`fonts/${file}`) });
}

export const FONTS = {
  /** Headlines and large kinetic type. */
  display: `"${DISPLAY}", system-ui, sans-serif`,
  /** Body copy, captions, labels. */
  body: `"${BODY}", system-ui, sans-serif`,
  /** Code, numbers, technical readouts. */
  mono: `"${MONO}", ui-monospace, monospace`,
} as const;
