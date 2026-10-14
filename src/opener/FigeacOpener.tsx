import {
  AbsoluteFill,
  Easing,
  Img,
  Interactive,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { playfair, sans, script } from "../fonts";

export const OPENER_DURATION = 240;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// Exact gold sampled from the AVU Luxury Wines logo, on the logo's white.
const GOLD = "#88764A";
const GOLD_DEEP = "#6F5F38";
const WHITE = "#FFFFFF";
const PANEL_X = 1060;

const smooth = Easing.bezier(0.65, 0, 0.35, 1);
const settle = Easing.bezier(0.16, 1, 0.3, 1);

// A line of text that slides up out of an invisible mask.
const MaskLine: React.FC<{
  frame: number;
  start: number;
  children: React.ReactNode;
  style: React.CSSProperties;
}> = ({ frame, start, children, style }) => (
  <div style={{ overflow: "hidden", paddingBottom: 6 }}>
    <div
      style={{
        ...style,
        translate: `0px ${interpolate(frame, [start, start + 28], [110, 0], {
          ...clamp,
          easing: settle,
        })}%`,
      }}
    >
      {children}
    </div>
  </div>
);

export const FigeacOpener: React.FC = () => {
  const frame = useCurrentFrame();

  const divider = interpolate(frame, [0, 26], [0, 1080], { ...clamp, easing: smooth });
  const panel = interpolate(frame, [16, 52], [0, 100], { ...clamp, easing: smooth });
  const write = interpolate(frame, [78, 122], [-15, 100], {
    ...clamp,
    easing: Easing.bezier(0.45, 0, 0.35, 1),
  });
  const rule = interpolate(frame, [112, 140], [0, 120], { ...clamp, easing: settle });
  const bottle = interpolate(frame, [52, 92], [0, 1], { ...clamp, easing: settle });

  return (
    <AbsoluteFill style={{ backgroundColor: WHITE }}>
      {/* Estate photo, full-bleed on the right, opened from the gold divider */}
      <div
        style={{
          position: "absolute",
          left: PANEL_X,
          top: 0,
          width: 1920 - PANEL_X,
          height: 1080,
          overflow: "hidden",
          clipPath: `inset(0 ${100 - panel}% 0 0)`,
        }}
      >
        <Img
          name="Chateau Figeac"
          src={staticFile("figeac/estate.jpg")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "52% 50%",
            scale: interpolate(frame, [16, OPENER_DURATION], [1.16, 1.03], clamp),
          }}
        />
        {/* Soft white fade where the photo meets the page */}
        <AbsoluteFill
          style={{
            background: "linear-gradient(90deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 22%)",
          }}
        />
        {/* Inset hairline frame */}
        <div
          style={{
            position: "absolute",
            inset: 36,
            border: "1px solid rgba(255,255,255,0.7)",
            opacity: interpolate(frame, [50, 70], [0, 1], clamp),
          }}
        />
      </div>

      {/* Gold divider line */}
      <div
        style={{
          position: "absolute",
          left: PANEL_X - 1,
          top: 0,
          width: 2,
          height: divider,
          backgroundColor: GOLD,
        }}
      />

      {/* Bottle, standing on the divider, with a soft floor shadow */}
      <div
        style={{
          position: "absolute",
          left: PANEL_X - 128,
          top: 150,
          width: 256,
          height: 900,
          opacity: bottle,
          translate: `0px ${(1 - bottle) * 90}px`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 18,
            right: 18,
            bottom: -14,
            height: 34,
            borderRadius: "50%",
            background: "radial-gradient(ellipse at center, rgba(40,30,10,0.35) 0%, rgba(40,30,10,0) 70%)",
          }}
        />
        <Img
          name="Figeac bottle"
          src={staticFile("figeac/bottle.png")}
          style={{
            position: "absolute",
            bottom: 0,
            left: 9,
            height: 892,
            filter: "drop-shadow(14px 18px 22px rgba(40, 30, 10, 0.28))",
          }}
        />
      </div>

      {/* Left editorial column */}
      <div style={{ position: "absolute", left: 150, top: 175, width: 760 }}>
        <Img
          name="AVU emblem"
          src={staticFile("avu/emblem.png")}
          style={{
            width: 118,
            opacity: interpolate(frame, [22, 44], [0, 1], clamp),
            clipPath: `inset(${interpolate(frame, [22, 50], [100, 0], { ...clamp, easing: smooth })}% 0 0 0)`,
          }}
        />

        <div style={{ marginTop: 70 }}>
          <MaskLine
            frame={frame}
            start={36}
            style={{
              fontFamily: playfair,
              fontWeight: 700,
              fontSize: 132,
              lineHeight: 1,
              letterSpacing: "0.02em",
              color: GOLD_DEEP,
            }}
          >
            AVU WINE
          </MaskLine>
          <MaskLine
            frame={frame}
            start={46}
            style={{
              fontFamily: playfair,
              fontWeight: 700,
              fontSize: 132,
              lineHeight: 1,
              letterSpacing: "0.02em",
              color: GOLD_DEEP,
            }}
          >
            STORIES
          </MaskLine>
        </div>

        <Interactive.Div
          name="Chateau Figeac"
          style={{
            marginTop: -10,
            marginLeft: -12,
            padding: "0 24px",
            fontFamily: script,
            fontSize: 156,
            lineHeight: 1.15,
            whiteSpace: "nowrap",
            color: GOLD,
            WebkitMaskImage: `linear-gradient(90deg, #000 ${write}%, transparent ${write + 15}%)`,
            maskImage: `linear-gradient(90deg, #000 ${write}%, transparent ${write + 15}%)`,
          }}
        >
          Château Figeac
        </Interactive.Div>

        <div style={{ marginTop: 26, display: "flex", alignItems: "center", gap: 28 }}>
          <div style={{ width: rule, height: 1.5, backgroundColor: GOLD }} />
          <Interactive.Div
            name="Appellation"
            style={{
              fontFamily: sans,
              fontWeight: 500,
              fontSize: 22,
              letterSpacing: "0.38em",
              color: GOLD,
              opacity: interpolate(frame, [122, 144], [0, 1], clamp),
            }}
          >
            SAINT-ÉMILION
          </Interactive.Div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
