import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Fonts are bundled in public/fonts (SIL Open Font License) so renders work offline.
export const serif = "Cormorant Garamond";
export const sans = "Montserrat";
export const display = "Bebas Neue";
export const playfair = "Playfair Display";
export const script = "Italianno";

const fonts: { family: string; file: string; weight: string; style?: string }[] = [
  { family: serif, file: "cormorant-garamond-latin-500-normal", weight: "500" },
  { family: serif, file: "cormorant-garamond-latin-600-normal", weight: "600" },
  { family: serif, file: "cormorant-garamond-latin-500-italic", weight: "500", style: "italic" },
  { family: sans, file: "montserrat-latin-500-normal", weight: "500" },
  { family: display, file: "bebas-neue-latin-400-normal", weight: "400" },
  { family: playfair, file: "playfair-display-latin-600-normal", weight: "600" },
  { family: playfair, file: "playfair-display-latin-700-normal", weight: "700" },
  { family: playfair, file: "playfair-display-latin-400-italic", weight: "400", style: "italic" },
  { family: script, file: "italianno-latin-400-normal", weight: "400" },
];

fonts.forEach(({ family, file, weight, style }) => {
  loadFont({
    family,
    url: staticFile(`fonts/${file}.woff2`),
    weight,
    style: style ?? "normal",
  });
});
