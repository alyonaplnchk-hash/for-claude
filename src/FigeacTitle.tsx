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
// Left edge of the bottle silhouette. The photo behind the bottle is not in
// the source image, so until the bottle stands in front of it the photo is
// cropped here and shows only original pixels.
const PHOTO_CROP = 666;
const MAIN_TITLE_LEFT = 957;
const MAIN_TITLE_RIGHT = 1806;
const WIPE_FEATHER = 110;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const easeOutCubic = Easing.bezier(0.33, 1, 0.68, 1);
const easeInOut = Easing.bezier(0.45, 0, 0.55, 1);
const camera = Easing.bezier(0.33, 0, 0.67, 1);

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
      {/* Ivory background */}
      <Img src={layer("background")} style={full} />

      {/* Château photo, visible from the first frame, ~2% documentary push-in */}
      <PhotoBand frame={frame} left={0} right={PHOTO_CROP} opacity={1} />
      {/* The strip that lies behind the bottle joins as the bottle arrives */}
      <PhotoBand
        frame={frame}
        left={PHOTO_CROP}
        right={PHOTO_WIDTH}
        opacity={interpolate(frame, [36, 46], [0, 1], {
          ...clamp,
          easing: easeInOut,
        })}
      />

      {/* 0:01–0:02 — bottle, solid almost at once, rises 45px with a soft ease-out */}
      <Interactive.Div
        name="Bottle"
        style={{
          ...full,
          opacity: interpolate(frame, [30, 33], [0, 1], clamp),
          translate: interpolate(frame, [30, 60], ["0px 45px", "0px 0px"], {
            ...clamp,
            easing: easeOutCubic,
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

// One vertical band of the château photo. Every band carries the same
// push-in, so together they read as a single photograph.
const PhotoBand: React.FC<{
  frame: number;
  left: number;
  right: number;
  opacity: number;
}> = ({ frame, left, right, opacity }) => (
  <div
    style={{
      position: "absolute",
      left,
      top: 0,
      width: right - left,
      height: 1080,
      overflow: "hidden",
      opacity,
    }}
  >
    <div
      style={{
        position: "absolute",
        left: -left,
        top: 0,
        width: PHOTO_WIDTH,
        height: 1080,
        transformOrigin: `${PHOTO_WIDTH / 2}px 540px`,
        scale: interpolate(frame, [0, 180], [1, 1.02], {
          ...clamp,
          easing: camera,
        }),
      }}
    >
      <Img
        src={layer("chateau-photo")}
        style={{ width: PHOTO_WIDTH, height: 1080, display: "block" }}
      />
    </div>
  </div>
);
