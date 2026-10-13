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

const LINE_START = 160;
const LINE_END = 1760;
const LINE_Y = 600;
const DRAW_FROM = 8;
const DRAW_TO = 72;

const MILESTONES = [
  { year: "6000 BC", place: "Georgia", caption: "The first vintages" },
  { year: "2nd c.", place: "Saint-Émilion", caption: "The Figeacus villa" },
  { year: "1855", place: "Bordeaux", caption: "The Grand Classification" },
  { year: "2022", place: "Château Figeac", caption: "Premier Grand Cru Classé A" },
];

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// A vine that winds along the timeline.
const vinePath = (() => {
  const pts: string[] = [];
  for (let x = LINE_START; x <= LINE_END; x += 20) {
    const y = LINE_Y + Math.sin((x - LINE_START) / 95) * 26;
    pts.push(`${x === LINE_START ? "M" : "L"}${x} ${y.toFixed(1)}`);
  }
  return pts.join(" ");
})();

export const History: React.FC = () => {
  const frame = useCurrentFrame();
  const drawn = interpolate(frame, [DRAW_FROM, DRAW_TO], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.45, 0, 0.2, 1),
  });

  return (
    <AbsoluteFill>
      <Paper />
      <AbsoluteFill
        style={{
          scale: interpolate(frame, [0, 105], [1, 1.04], clamp),
        }}
      >
        <Interactive.Div
          name="Kicker"
          style={{
            position: "absolute",
            top: 230,
            width: "100%",
            textAlign: "center",
            fontFamily: sans,
            fontWeight: 500,
            fontSize: 30,
            letterSpacing: "0.5em",
            color: colors.gold,
            opacity: interpolate(frame, [0, 20], [0, 1], clamp),
            translate: interpolate(frame, [0, 20], ["0px 20px", "0px 0px"], {
              ...clamp,
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          EIGHT THOUSAND YEARS OF WINE
        </Interactive.Div>

        <svg width={1920} height={1080} style={{ position: "absolute" }}>
          <path
            d={vinePath}
            pathLength={1}
            fill="none"
            stroke={colors.goldLight}
            strokeWidth={2}
            strokeDasharray="1 1"
            strokeDashoffset={1 - drawn}
          />
          <line
            x1={LINE_START}
            x2={LINE_START + (LINE_END - LINE_START) * drawn}
            y1={LINE_Y}
            y2={LINE_Y}
            stroke={colors.gold}
            strokeWidth={3}
          />
        </svg>

        {MILESTONES.map((m, i) => {
          const x = LINE_START + 190 + i * ((LINE_END - LINE_START - 380) / 3);
          const reach =
            DRAW_FROM + ((x - LINE_START) / (LINE_END - LINE_START)) * (DRAW_TO - DRAW_FROM);
          const pop = interpolate(frame, [reach - 2, reach + 10], [0, 1], {
            ...clamp,
            easing: Easing.bezier(0.34, 1.56, 0.64, 1),
          });
          const fade = interpolate(frame, [reach, reach + 14], [0, 1], clamp);
          const rise = interpolate(frame, [reach, reach + 18], [24, 0], {
            ...clamp,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          });

          return (
            <div key={m.year}>
              <div
                style={{
                  position: "absolute",
                  left: x - 15,
                  top: LINE_Y - 15,
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  border: `3px solid ${colors.gold}`,
                  backgroundColor: colors.ivory,
                  scale: pop,
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    margin: 5,
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    backgroundColor: colors.wine,
                  }}
                />
              </div>
              <div
                style={{
                  position: "absolute",
                  left: x - 200,
                  width: 400,
                  top: LINE_Y - 170,
                  textAlign: "center",
                  fontFamily: serif,
                  fontWeight: 600,
                  fontSize: 92,
                  color: colors.goldDark,
                  opacity: fade,
                  translate: `0px ${rise}px`,
                }}
              >
                {m.year}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: x - 210,
                  width: 420,
                  top: LINE_Y + 50,
                  textAlign: "center",
                  opacity: fade,
                  translate: `0px ${-rise}px`,
                }}
              >
                <div
                  style={{
                    fontFamily: sans,
                    fontWeight: 500,
                    fontSize: 24,
                    letterSpacing: "0.3em",
                    color: colors.gold,
                    textTransform: "uppercase",
                  }}
                >
                  {m.place}
                </div>
                <div
                  style={{
                    marginTop: 12,
                    fontFamily: serif,
                    fontStyle: "italic",
                    fontWeight: 500,
                    fontSize: 36,
                    color: colors.ink,
                  }}
                >
                  {m.caption}
                </div>
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
