import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { GoldDust } from "../components/GoldDust";
import { Paper } from "../components/Paper";
import { playfair, script } from "../fonts";
import { colors } from "../theme";

export const TITLE_DURATION = 210;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const IMPACT = 22;
const RIPPLES = [IMPACT, IMPACT + 9, IMPACT + 18];

// A drop of liquid gold that falls to centre and sends out ripples.
const GoldDrop: React.FC<{ frame: number }> = ({ frame }) => {
  const y = interpolate(frame, [0, IMPACT], [-80, 540], {
    ...clamp,
    easing: Easing.in(Easing.quad),
  });
  const dropOpacity = interpolate(frame, [IMPACT - 1, IMPACT + 2], [1, 0], clamp);

  return (
    <svg width={1920} height={1080} style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="dropFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#D9C79A" />
          <stop offset="55%" stopColor={colors.gold} />
          <stop offset="100%" stopColor={colors.goldDark} />
        </linearGradient>
      </defs>
      <path
        d="M0 -34 C10 -16 16 -6 16 4 C16 14 9 20 0 20 C-9 20 -16 14 -16 4 C-16 -6 -10 -16 0 -34 Z"
        transform={`translate(960 ${y - 20})`}
        fill="url(#dropFill)"
        opacity={dropOpacity}
      />
      {RIPPLES.map((start) => (
        <ellipse
          key={start}
          cx={960}
          cy={540}
          rx={interpolate(frame, [start, start + 60], [0, 760], {
            ...clamp,
            easing: Easing.out(Easing.cubic),
          })}
          ry={interpolate(frame, [start, start + 60], [0, 260], {
            ...clamp,
            easing: Easing.out(Easing.cubic),
          })}
          fill="none"
          stroke={colors.gold}
          strokeWidth={2}
          opacity={interpolate(frame, [start, start + 4, start + 60], [0, 0.7, 0], clamp)}
        />
      ))}
    </svg>
  );
};

export const AvuTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const write = interpolate(frame, [58, 108], [-15, 100], {
    ...clamp,
    easing: Easing.bezier(0.45, 0, 0.35, 1),
  });
  const rule = interpolate(frame, [96, 128], [0, 230], {
    ...clamp,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill>
      <Paper />
      <GoldDrop frame={frame} />

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          scale: interpolate(frame, [0, TITLE_DURATION], [1, 1.035], clamp),
        }}
      >
        {/* AVU */}
        <div
          style={{
            display: "flex",
            fontFamily: playfair,
            fontWeight: 600,
            fontSize: 250,
            lineHeight: 1,
            letterSpacing: `${interpolate(frame, [28, 90], [0.45, 0.16], {
              ...clamp,
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            })}em`,
            marginRight: "-0.16em",
          }}
        >
          {["A", "V", "U"].map((letter, i) => {
            const start = 28 + i * 7;
            return (
              <span
                key={letter}
                style={{
                  display: "inline-block",
                  opacity: interpolate(frame, [start, start + 18], [0, 1], clamp),
                  translate: `0px ${interpolate(frame, [start, start + 26], [70, 0], {
                    ...clamp,
                    easing: Easing.bezier(0.16, 1, 0.3, 1),
                  })}px`,
                  filter: `blur(${interpolate(frame, [start, start + 20], [14, 0], clamp)}px)`,
                  background: `linear-gradient(100deg, ${colors.goldDark} 0%, ${colors.gold} 35%, #E2D3A8 50%, ${colors.gold} 65%, ${colors.goldDark} 100%)`,
                  backgroundSize: "300% 100%",
                  backgroundPosition: `${interpolate(frame, [84, 132], [100, 0], {
                    ...clamp,
                    easing: Easing.bezier(0.45, 0, 0.55, 1),
                  })}% 0%`,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                {letter}
              </span>
            );
          })}
        </div>

        {/* Wine Stories, written on from left to right */}
        <Interactive.Div
          name="Wine Stories"
          style={{
            marginTop: -28,
            padding: "0 60px",
            fontFamily: script,
            fontSize: 210,
            lineHeight: 1.1,
            color: colors.gold,
            WebkitMaskImage: `linear-gradient(90deg, #000 ${write}%, transparent ${write + 15}%)`,
            maskImage: `linear-gradient(90deg, #000 ${write}%, transparent ${write + 15}%)`,
          }}
        >
          Wine Stories
        </Interactive.Div>

        {/* Ornament */}
        <div
          style={{
            marginTop: 6,
            display: "flex",
            alignItems: "center",
            gap: 22,
            opacity: interpolate(frame, [94, 104], [0, 1], clamp),
          }}
        >
          <div style={{ width: rule, height: 1.5, backgroundColor: colors.gold }} />
          <div
            style={{
              width: 12,
              height: 12,
              rotate: "45deg",
              border: `1.5px solid ${colors.gold}`,
              scale: interpolate(frame, [94, 110], [0, 1], {
                ...clamp,
                easing: Easing.bezier(0.34, 1.56, 0.64, 1),
              }),
            }}
          />
          <div style={{ width: rule, height: 1.5, backgroundColor: colors.gold }} />
        </div>

        <Interactive.Div
          name="Tagline"
          style={{
            marginTop: 34,
            fontFamily: playfair,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 40,
            letterSpacing: "0.04em",
            color: colors.goldDark,
            opacity: interpolate(frame, [116, 140], [0, 1], clamp),
            translate: interpolate(frame, [116, 144], ["0px 18px", "0px 0px"], {
              ...clamp,
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          The stories behind great wines
        </Interactive.Div>
      </AbsoluteFill>

      <GoldDust />
    </AbsoluteFill>
  );
};
