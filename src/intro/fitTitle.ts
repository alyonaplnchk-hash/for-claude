import { useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";

// Largest font size (up to maxSize) at which every line, set in the given
// font with the given letter-spacing (in em), fits within maxWidth.
export const useFitTitle = ({
  lines,
  font: family,
  maxSize,
  maxWidth,
  tracking = 0,
}: {
  lines: string[];
  font: string;
  maxSize: number;
  maxWidth: number;
  tracking?: number;
}) => {
  const [size, setSize] = useState(maxSize);
  const key = lines.join("\n");
  const [handle] = useState(() => delayRender("Fit the episode title"));
  useEffect(() => {
    const font = `400 ${maxSize}px "${family}"`;
    document.fonts
      .load(font)
      .then(() => {
        const ctx = document.createElement("canvas").getContext("2d");
        if (ctx && key) {
          ctx.font = font;
          const widest = Math.max(
            ...key
              .split("\n")
              .map(
                (line) =>
                  ctx.measureText(line).width +
                  (line.length - 1) * tracking * maxSize,
              ),
          );
          // Width grows in proportion to size, so one measurement is enough
          setSize(Math.min(maxSize, Math.floor((maxSize * maxWidth) / widest)));
        }
        continueRender(handle);
      })
      .catch((err) => {
        continueRender(handle);
        throw err;
      });
  }, [key, family, maxSize, maxWidth, tracking, handle]);
  return size;
};
