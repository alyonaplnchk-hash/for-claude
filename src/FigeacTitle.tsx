import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  Img,
  Interactive,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

// Layers were cut from the reference frame (see scripts/extract_layers.py).
// Every layer is a full 1920x1080 image, so at rest each sits exactly where
// it was in the reference.
const layer = (name: string) => staticFile(`figeac/${name}.png`);

// Geometry taken from the reference image.
const PHOTO_WIDTH = 785; // photo / ivory split
const BOTTLE_CENTER = "794.5px 549px";
const MAIN_TITLE_LEFT = 957;
const MAIN_TITLE_RIGHT = 1806;
const WIPE_FEATHER = 110;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const easeInOut = Easing.bezier(0.45, 0, 0.55, 1);

const full: React.CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
  width: 1920,
  height: 1080,
};

export const FigeacTitle: React.FC = () => {
  const frame = useCurrentFrame();

  // Left-to-right wipe: the mask edge travels across the title,
  // the letters themselves never move.
  const wipeEdge = interpolate(
    frame,
    [90, 124],
    [MAIN_TITLE_LEFT - 10, MAIN_TITLE_RIGHT + WIPE_FEATHER + 10],
    { ...clamp, easing: easeInOut },
  );
  const wipeMask = `linear-gradient(to right, #000 ${wipeEdge - WIPE_FEATHER}px, transparent ${wipeEdge}px)`;

  return (
    <AbsoluteFill style={{ backgroundColor: "#cbc5b1" }}>
      {/* Sound design synthesised by scripts/make_sound.py */}
      <Audio src={staticFile("figeac/sound.wav")} />

      {/* Ivory background (clean plate) */}
      <Img src={layer("background")} style={full} />

      {/* 0:00–0:06 — slow documentary push-in on the château, ~2.5% */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: PHOTO_WIDTH,
          height: 1080,
          overflow: "hidden",
        }}
      >
        <Interactive.Div
          name="Château photo"
          style={{
            position: "absolute",
            inset: 0,
            transformOrigin: "50% 50%",
            // 0:00–0:01 — the château fades up out of the ivory
            opacity: interpolate(frame, [0, 27], [0, 1], {
              ...clamp,
              easing: Easing.bezier(0.33, 0, 0.2, 1),
            }),
            scale: interpolate(frame, [0, 180], [1, 1.025], {
              ...clamp,
              easing: easeInOut,
            }),
          }}
        >
          <Img
            src={layer("chateau-photo")}
            style={{ width: PHOTO_WIDTH, height: 1080, display: "block" }}
          />
        </Interactive.Div>
      </div>

      {/* 0:01–0:02 — bottle rises 60px, fades and scales 98% → 100% */}
      <Interactive.Div
        name="Bottle"
        style={{
          ...full,
          transformOrigin: BOTTLE_CENTER,
          opacity: interpolate(frame, [30, 54], [0, 1], {
            ...clamp,
            easing: Easing.bezier(0.33, 0, 0.2, 1),
          }),
          translate: interpolate(frame, [30, 60], ["0px 60px", "0px 0px"], {
            ...clamp,
            easing: easeOut,
          }),
          scale: interpolate(frame, [30, 60], [0.98, 1], {
            ...clamp,
            easing: easeOut,
          }),
        }}
      >
        <Img src={layer("bottle")} style={full} />
      </Interactive.Div>

      {/* 0:02–0:03 — "AVU WINE Stories" fades up 15px */}
      <Interactive.Div
        name="Series title"
        style={{
          ...full,
          opacity: interpolate(frame, [60, 84], [0, 1], {
            ...clamp,
            easing: Easing.bezier(0.33, 0, 0.2, 1),
          }),
          translate: interpolate(frame, [60, 90], ["0px 15px", "0px 0px"], {
            ...clamp,
            easing: easeOut,
          }),
        }}
      >
        <Img src={layer("title-series")} style={full} />
      </Interactive.Div>

      {/* 0:03–0:04.1 — "CHATEAU-FIGEAC" horizontal mask reveal */}
      <Interactive.Div
        name="Main title"
        style={{
          ...full,
          maskImage: wipeMask,
          WebkitMaskImage: wipeMask,
        }}
      >
        <Img src={layer("title-main")} style={full} />
      </Interactive.Div>

      {/* 0:04–0:04.5 — classification and lions, soft fade */}
      <Interactive.Div
        name="Classification"
        style={{
          ...full,
          opacity: interpolate(frame, [118, 135], [0, 1], {
            ...clamp,
            easing: Easing.bezier(0.33, 0, 0.2, 1),
          }),
        }}
      >
        <Img src={layer("title-class")} style={full} />
      </Interactive.Div>
      {/* 0:04.5–0:06 — hold on the finished composition */}
    </AbsoluteFill>
  );
};
