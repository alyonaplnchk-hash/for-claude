import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { Paper } from "../components/Paper";
import { sans, serif } from "../fonts";
import { colors } from "../theme";

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const line = {
  fill: "none",
  stroke: colors.gold,
  strokeWidth: 2.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

// Champagne flute with rising bubbles.
const FluteIcon: React.FC<{ frame: number }> = ({ frame }) => (
  <g>
    <path {...line} d="M41 12 L59 12 L57 52 Q50 60 43 52 Z" />
    <path {...line} d="M50 58 L50 84 M38 86 L62 86" />
    <path d="M43.5 30 L56.5 30 L56 50 Q50 56 44 50 Z" fill={colors.goldLight} opacity={0.6} />
    {[0, 1, 2, 3].map((i) => {
      const t = ((frame + i * 9) % 36) / 36;
      return (
        <circle
          key={i}
          cx={47 + (i % 2) * 6}
          cy={50 - t * 22}
          r={1.3 + i * 0.25}
          fill={colors.ivory}
          stroke={colors.gold}
          strokeWidth={0.8}
          opacity={1 - t}
        />
      );
    })}
  </g>
);

// Riddling table (pupitre) with angled bottle necks.
const RiddlingIcon: React.FC = () => (
  <g>
    <path {...line} d="M30 88 L46 12 L54 12 L70 88" />
    <path {...line} d="M38 52 L62 52" />
    {[24, 38, 52, 66, 78].map((y, i) => {
      const left = 46 - (y - 12) * 0.21;
      const right = 54 + (y - 12) * 0.21;
      return (
        <g key={i}>
          <ellipse cx={left + 4} cy={y} rx={2.6} ry={3.4} {...line} strokeWidth={1.8} />
          <ellipse cx={right - 4} cy={y} rx={2.6} ry={3.4} {...line} strokeWidth={1.8} />
        </g>
      );
    })}
  </g>
);

// A framed artist's label with a brushstroke.
const ArtLabelIcon: React.FC = () => (
  <g>
    <rect x={24} y={18} width={52} height={66} rx={2} {...line} />
    <rect x={29} y={23} width={42} height={36} {...line} strokeWidth={1.5} />
    <path
      d="M33 50 C38 34 45 46 50 38 C55 30 60 44 67 30"
      fill="none"
      stroke={colors.wine}
      strokeWidth={4}
      strokeLinecap="round"
    />
    <path {...line} strokeWidth={1.8} d="M33 68 L67 68 M38 75 L62 75" />
  </g>
);

// Grape cluster with leaf and tendril.
const GrapesIcon: React.FC = () => (
  <g>
    <path {...line} d="M50 14 L50 26 M50 18 C58 10 68 14 66 22" />
    <path {...line} d="M50 22 C40 12 26 18 30 30 C38 32 46 28 50 22 Z" />
    {[
      [38, 34], [50, 34], [62, 34],
      [44, 45], [56, 45],
      [38, 56], [50, 56], [62, 56],
      [44, 67], [56, 67],
      [50, 78],
    ].map(([cx, cy], i) => (
      <circle key={i} cx={cx} cy={cy} r={6} {...line} strokeWidth={2} />
    ))}
  </g>
);

const PEOPLE = [
  { name: "Dom Pérignon", dates: "1638 – 1715", fact: "Cellar master at Hautvillers", icon: "flute" },
  { name: "Barbe-Nicole Clicquot", dates: "1777 – 1866", fact: "Created the riddling table, 1816", icon: "riddling" },
  { name: "Philippe de Rothschild", dates: "1902 – 1988", fact: "Artist labels at Mouton, 1945", icon: "label" },
  { name: "Thierry Manoncourt", dates: "1917 – 2010", fact: "Led Château Figeac from 1947", icon: "grapes" },
] as const;

export const Personalities: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <Paper />
      <AbsoluteFill
        style={{
          translate: interpolate(frame, [0, 135], ["20px 0px", "-20px 0px"], clamp),
        }}
      >
        <Interactive.Div
          name="Heading"
          style={{
            position: "absolute",
            top: 150,
            width: "100%",
            textAlign: "center",
            fontFamily: sans,
            fontWeight: 500,
            fontSize: 30,
            letterSpacing: "0.5em",
            color: colors.gold,
            opacity: interpolate(frame, [0, 18], [0, 1], clamp),
          }}
        >
          THE LEGENDS BEHIND THE BOTTLE
        </Interactive.Div>

        {PEOPLE.map((p, i) => {
          const start = 8 + i * 14;
          const cx = 300 + i * 440;
          const appear = interpolate(frame, [start, start + 22], [0, 1], {
            ...clamp,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          });
          const ring = interpolate(frame, [start, start + 34], [0, 1], {
            ...clamp,
            easing: Easing.bezier(0.45, 0, 0.2, 1),
          });

          return (
            <div
              key={p.name}
              style={{
                position: "absolute",
                left: cx - 210,
                top: 250,
                width: 420,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                opacity: appear,
                translate: `0px ${(1 - appear) * 50}px`,
              }}
            >
              <svg width={280} height={350} viewBox="0 0 280 350">
                <ellipse cx={140} cy={175} rx={128} ry={162} fill={colors.ivory} />
                <ellipse
                  cx={140}
                  cy={175}
                  rx={134}
                  ry={168}
                  fill="none"
                  stroke={colors.gold}
                  strokeWidth={4}
                  pathLength={1}
                  strokeDasharray="1 1"
                  strokeDashoffset={1 - ring}
                />
                <ellipse
                  cx={140}
                  cy={175}
                  rx={120}
                  ry={154}
                  fill="none"
                  stroke={colors.goldLight}
                  strokeWidth={1.5}
                  pathLength={1}
                  strokeDasharray="1 1"
                  strokeDashoffset={ring - 1}
                />
                <g transform="translate(35 70) scale(2.1)" opacity={appear}>
                  {p.icon === "flute" && <FluteIcon frame={frame} />}
                  {p.icon === "riddling" && <RiddlingIcon />}
                  {p.icon === "label" && <ArtLabelIcon />}
                  {p.icon === "grapes" && <GrapesIcon />}
                </g>
              </svg>
              <div
                style={{
                  marginTop: 34,
                  fontFamily: serif,
                  fontWeight: 600,
                  fontSize: 42,
                  lineHeight: 1.1,
                  color: colors.ink,
                  textAlign: "center",
                }}
              >
                {p.name}
              </div>
              <div
                style={{
                  marginTop: 12,
                  fontFamily: sans,
                  fontWeight: 500,
                  fontSize: 22,
                  letterSpacing: "0.25em",
                  color: colors.gold,
                }}
              >
                {p.dates}
              </div>
              <div
                style={{
                  marginTop: 14,
                  fontFamily: serif,
                  fontStyle: "italic",
                  fontWeight: 500,
                  fontSize: 32,
                  lineHeight: 1.2,
                  color: colors.goldDark,
                  textAlign: "center",
                  width: 380,
                }}
              >
                {p.fact}
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
