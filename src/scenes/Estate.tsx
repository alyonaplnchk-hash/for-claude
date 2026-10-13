import {
  AbsoluteFill,
  Easing,
  getStaticFiles,
  Img,
  Interactive,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { FigeacSeal } from "../components/FigeacSeal";
import { FigeacWordmark } from "../components/FigeacWordmark";
import { Paper } from "../components/Paper";
import { sans, serif } from "../fonts";
import { colors } from "../theme";

const PHOTO = "figeac-estate.jpg";

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// Gold line-art stand-in for the estate photo, used until public/figeac-estate.jpg is added.
const EstateIllustration: React.FC = () => (
  <svg width="100%" height="100%" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#E9ECEC" />
        <stop offset="100%" stopColor={colors.ivory} />
      </linearGradient>
    </defs>
    <rect width={1000} height={700} fill="url(#sky)" />
    {[
      [720, 220, 110], [820, 190, 120], [900, 250, 90], [640, 280, 70], [200, 300, 70], [90, 330, 60],
    ].map(([cx, cy, r], i) => (
      <circle key={i} cx={cx} cy={cy} r={r} fill={colors.goldLight} opacity={0.45} />
    ))}
    <g fill={colors.ivory} stroke={colors.goldDark} strokeWidth={3} strokeLinejoin="round">
      {/* Old manor */}
      <path d="M110 300 L170 250 L390 250 L450 300 Z" fill={colors.goldLight} />
      <rect x={120} y={300} width={320} height={170} />
      <rect x={160} y={215} width={22} height={40} />
      <rect x={380} y={215} width={22} height={40} />
      {/* Modern cellars */}
      <path d="M400 360 L430 330 L990 330 L1000 360 Z" fill={colors.goldLight} />
      <rect x={410} y={360} width={590} height={120} />
      <rect x={560} y={300} width={70} height={180} />
    </g>
    <g fill={colors.ink} opacity={0.75}>
      {[160, 230, 300, 370].map((x) => (
        <rect key={x} x={x} y={330} width={30} height={46} />
      ))}
      {[570, 600].map((x) => (
        <rect key={x} x={x} y={315} width={22} height={150} />
      ))}
      {[680, 760, 840, 920].map((x) => (
        <rect key={x} x={x} y={385} width={60} height={70} />
      ))}
    </g>
    {new Array(7).fill(true).map((_, row) => {
      const y = 480 + row * 34;
      const d = new Array(26)
        .fill(true)
        .map((__, k) => `${k === 0 ? "M" : "L"}${k * 40} ${y + Math.sin(k + row) * 6}`)
        .join(" ");
      return (
        <path
          key={row}
          d={`${d} L1000 700 L0 700 Z`}
          fill={row % 2 ? "#9AA06A" : "#B4B27A"}
          stroke={colors.goldDark}
          strokeWidth={1.5}
        />
      );
    })}
  </svg>
);

export const Estate: React.FC = () => {
  const frame = useCurrentFrame();
  const hasPhoto = getStaticFiles().some((f) => f.name === PHOTO);
  const stamp = interpolate(frame, [26, 42], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.34, 1.4, 0.64, 1),
  });

  return (
    <AbsoluteFill>
      <Paper />

      {/* Estate photo panel */}
      <div
        style={{
          position: "absolute",
          left: 100,
          top: 110,
          width: 1060,
          height: 860,
          padding: 14,
          border: `2px solid ${colors.gold}`,
          boxSizing: "border-box",
          clipPath: `inset(0 ${interpolate(frame, [0, 30], [100, 0], {
            ...clamp,
            easing: Easing.bezier(0.65, 0, 0.35, 1),
          })}% 0 0)`,
        }}
      >
        <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
          <div
            style={{
              width: "100%",
              height: "100%",
              scale: interpolate(frame, [0, 120], [1.12, 1], clamp),
            }}
          >
            {hasPhoto ? (
              <Img
                name="Estate photo"
                src={staticFile(PHOTO)}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <EstateIllustration />
            )}
          </div>
        </div>
      </div>

      {/* Right column */}
      <div
        style={{
          position: "absolute",
          left: 1220,
          top: 110,
          width: 620,
          height: 860,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Interactive.Div
          name="Kicker"
          style={{
            fontFamily: sans,
            fontWeight: 500,
            fontSize: 26,
            letterSpacing: "0.5em",
            color: colors.gold,
            opacity: interpolate(frame, [14, 30], [0, 1], clamp),
          }}
        >
          THIS EPISODE
        </Interactive.Div>
        <div
          style={{
            marginTop: 40,
            opacity: stamp,
            scale: interpolate(stamp, [0, 1], [1.6, 1]),
            rotate: `${interpolate(stamp, [0, 1], [-18, 0])}deg`,
            filter: "drop-shadow(0 10px 18px rgba(67,11,21,0.35))",
          }}
        >
          <FigeacSeal size={250} />
        </div>
        <div
          style={{
            marginTop: 50,
            opacity: interpolate(frame, [44, 60], [0, 1], clamp),
            translate: interpolate(frame, [44, 64], ["0px 26px", "0px 0px"], {
              ...clamp,
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          <FigeacWordmark fontSize={88} />
        </div>
        <Interactive.Div
          name="Appellation"
          style={{
            marginTop: 34,
            fontFamily: sans,
            fontWeight: 500,
            fontSize: 24,
            letterSpacing: "0.3em",
            color: colors.goldDark,
            opacity: interpolate(frame, [58, 74], [0, 1], clamp),
          }}
        >
          SAINT-ÉMILION · BORDEAUX
        </Interactive.Div>
        <Interactive.Div
          name="Classification"
          style={{
            marginTop: 14,
            fontFamily: serif,
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: 42,
            color: colors.ink,
            opacity: interpolate(frame, [66, 82], [0, 1], clamp),
          }}
        >
          Premier Grand Cru Classé A
        </Interactive.Div>
      </div>
    </AbsoluteFill>
  );
};
