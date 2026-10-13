import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { AvuEmblem } from "../components/AvuEmblem";
import { Paper } from "../components/Paper";
import { sans, serif } from "../fonts";
import { colors } from "../theme";

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const BOWL = "M95 50 C70 190 115 300 200 305 C285 300 330 190 305 50";

const WineGlass: React.FC<{ frame: number }> = ({ frame }) => {
  const outline = interpolate(frame, [0, 22], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.45, 0, 0.2, 1),
  });
  const level = interpolate(frame, [14, 60], [305, 165], {
    ...clamp,
    easing: Easing.bezier(0.33, 0, 0.3, 1),
  });
  const slosh = interpolate(frame, [14, 70], [7, 1.5], clamp);
  const surface = new Array(23)
    .fill(true)
    .map((_, k) => {
      const x = 60 + k * 13;
      const y = level + Math.sin(x / 22 + frame / 3.5) * slosh;
      return `${k === 0 ? "M" : "L"}${x} ${y.toFixed(1)}`;
    })
    .join(" ");
  const streamTop = interpolate(frame, [52, 60], [-120, level], clamp);
  const streamOpacity = interpolate(frame, [8, 12, 58, 60], [0, 1, 1, 0], clamp);

  return (
    <svg width={430} height={640} viewBox="0 -15 400 600" style={{ overflow: "visible" }}>
      <defs>
        <clipPath id="bowl">
          <path d={`${BOWL} Z`} />
        </clipPath>
        <linearGradient id="wineFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8E1B2E" />
          <stop offset="100%" stopColor={colors.wineDeep} />
        </linearGradient>
      </defs>
      <rect
        x={197}
        y={streamTop}
        width={6}
        height={Math.max(0, level - streamTop)}
        rx={3}
        fill={colors.wine}
        opacity={streamOpacity}
      />
      <g clipPath="url(#bowl)">
        <path d={`${surface} L346 330 L60 330 Z`} fill="url(#wineFill)" />
      </g>
      <g
        fill="none"
        stroke={colors.gold}
        strokeWidth={4}
        strokeLinecap="round"
        pathLength={1}
      >
        <path d={BOWL} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - outline} />
        <path d="M200 305 L200 500" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - outline} />
        <path
          d="M115 512 Q200 494 285 512"
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1 - outline}
        />
      </g>
      <path
        d="M112 90 C102 170 122 235 155 268"
        fill="none"
        stroke={colors.ivory}
        strokeWidth={6}
        strokeLinecap="round"
        opacity={0.55 * outline}
      />
    </svg>
  );
};

export const Finale: React.FC = () => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [66, 92], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.45, 0, 0.2, 1),
  });

  return (
    <AbsoluteFill>
      <Paper />

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          opacity: interpolate(frame, [62, 78], [1, 0], clamp),
          scale: interpolate(frame, [62, 80], [1, 0.85], {
            ...clamp,
            easing: Easing.bezier(0.45, 0, 0.55, 1),
          }),
        }}
      >
        <WineGlass frame={frame} />
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: "center", paddingTop: 150 }}>
        <div
          style={{
            clipPath: `inset(${(1 - reveal) * 100}% 0 0 0)`,
            translate: `0px ${(1 - reveal) * 20}px`,
          }}
        >
          <AvuEmblem width={330} />
        </div>
        <Interactive.Div
          name="AVU"
          style={{
            marginTop: 10,
            fontFamily: serif,
            fontWeight: 600,
            fontSize: 150,
            lineHeight: 1,
            letterSpacing: "0.14em",
            paddingLeft: "0.14em",
            color: colors.gold,
            opacity: interpolate(frame, [82, 98], [0, 1], clamp),
            translate: interpolate(frame, [82, 102], ["0px 24px", "0px 0px"], {
              ...clamp,
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          AVU
        </Interactive.Div>
        <div
          style={{
            marginTop: 28,
            display: "flex",
            alignItems: "center",
            gap: 30,
            opacity: interpolate(frame, [92, 106], [0, 1], clamp),
          }}
        >
          <div
            style={{
              height: 2,
              backgroundColor: colors.gold,
              width: interpolate(frame, [92, 116], [0, 160], {
                ...clamp,
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
            }}
          />
          <div
            style={{
              fontFamily: sans,
              fontWeight: 500,
              fontSize: 40,
              letterSpacing: "0.6em",
              paddingLeft: "0.6em",
              color: colors.gold,
            }}
          >
            WINE STORIES
          </div>
          <div
            style={{
              height: 2,
              backgroundColor: colors.gold,
              width: interpolate(frame, [92, 116], [0, 160], {
                ...clamp,
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
            }}
          />
        </div>
        <Interactive.Div
          name="Tagline"
          style={{
            marginTop: 36,
            fontFamily: serif,
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: 44,
            color: colors.ink,
            opacity: interpolate(frame, [104, 120], [0, 1], clamp),
          }}
        >
          Every great bottle has a story
        </Interactive.Div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
