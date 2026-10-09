import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import {
  AVU_ASPECT,
  AVU_LOGO,
  clamp,
  fadeIn,
  Grain,
  HandFlourish,
  HandwrittenWord,
  StorePhoto,
  Vignette,
} from "./shared";
import { AVU_GOLD } from "./Ecriture";

// Closing card: "Thank you" written by hand, then both houses side by side.
export const THANK_YOU_DURATION = 6 * 30;

export type ThankYouProps = {
  guestLogo: string;
  guestLogoAspect: number;
  photo: string;
};

// Heights balanced by eye: the AVU mark is airier, so it sits a little taller.
const AVU_HEIGHT = 156;
const GUEST_HEIGHT = 118;

export const ThankYouCard: React.FC<ThankYouProps> = ({
  guestLogo,
  guestLogoAspect,
  photo,
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: "#EEE8DD" }}>
      <StorePhoto
        src={photo}
        durationInFrames={THANK_YOU_DURATION}
        blurTo={11}
        blurFrom={[-1, 0]}
        tone="saturate(0.72) sepia(0.12) brightness(0.95)"
      />
      <AbsoluteFill style={{ backgroundColor: "#EFE9DE", opacity: 0.36 }} />
      <Vignette color="#B7AA94" strength={0.35} />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 70% 32% at 50% 50%, #EFE9DE 0%, rgba(239,233,222,0.6) 55%, rgba(239,233,222,0) 100%)",
          opacity: 0.6,
        }}
      />
      <Grain opacity={0.11} />

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <HandwrittenWord
          word="Thank you"
          start={8}
          duration={58}
          width={800}
          ink={AVU_GOLD}
        />
        <div style={{ marginTop: -22, marginLeft: 120 }}>
          <HandFlourish start={60} length={22} width={420} ink={AVU_GOLD} />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 64,
            marginTop: 110,
          }}
        >
          <Img
            src={staticFile(AVU_LOGO)}
            style={{
              height: AVU_HEIGHT,
              width: AVU_HEIGHT * AVU_ASPECT,
              ...fadeIn(frame, 76, 30),
            }}
          />
          <div
            style={{
              width: 1.5,
              backgroundColor: AVU_GOLD,
              opacity: 0.55,
              height: interpolate(frame, [80, 104], [0, GUEST_HEIGHT], {
                ...clamp,
              }),
            }}
          />
          <Img
            src={staticFile(guestLogo)}
            style={{
              height: GUEST_HEIGHT,
              width: GUEST_HEIGHT * guestLogoAspect,
              ...fadeIn(frame, 86, 30),
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
