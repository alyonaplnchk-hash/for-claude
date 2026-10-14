import { colors } from "../theme";

export const EMBLEM_PATHS = [
  // Sweeping left stroke
  "M105 145 C150 147 200 147 228 150 C265 155 295 180 315 220 C330 248 342 278 350 300 C380 370 410 445 440 510 L448 520 L390 545 C340 543 305 520 285 475 C260 420 235 360 210 305 C190 262 170 220 155 193 C143 172 127 156 105 145 Z",
  // Bold right "U" stroke
  "M555 17 L772 18 C771 120 771 250 772 380 C773 470 720 520 655 540 C620 551 585 556 550 556 L395 553 L440 520 C500 505 548 455 552 395 C554 360 554 300 555 260 Z",
];

// Vector redraw of the AVU "VU" emblem from the AVU Luxury Wines logo.
export const AvuEmblem: React.FC<{
  width: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({ width, color = colors.gold, style }) => {
  return (
    <svg width={width} viewBox="90 0 700 570" style={style}>
      {EMBLEM_PATHS.map((d) => (
        <path key={d} fill={color} d={d} />
      ))}
    </svg>
  );
};
