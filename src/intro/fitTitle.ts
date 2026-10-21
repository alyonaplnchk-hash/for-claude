import { useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { SORA } from "./shared";

// Largest font size (up to maxSize) at which every line, set in Sora caps
// with the given letter-spacing (in em), fits within maxWidth.
export const useFitTitle = ({
  lines,
  maxSize,
  maxWidth,
  tracking,
}: {
  lines: string[];
  maxSize: number;
  maxWidth: number;
  tracking: number;
}) => {
  const [size, setSize] = useState(maxSize);
  const key = lines.join("\n");
  const [handle] = useState(() => delayRender("Fit the episode title"));
  useEffect(() => {
    const font = `400 ${maxSize}px ${SORA}`;
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
  }, [key, maxSize, maxWidth, tracking, handle]);
  return size;
};
