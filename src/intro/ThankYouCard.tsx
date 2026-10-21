import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
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
  // Omit both for a series without a guest (Wine Tips)
  guestLogo?: string;
  guestLogoAspect?: number;
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
  // A shorter composition plays the same animation faster; the pen keeps
  // at least 40 frames so "Thank you" still reads as written by hand.
  const { durationInFrames } = useVideoConfig();
  const pace = durationInFrames / THANK_YOU_DURATION;
  const t = (f: number) => Math.round(f * pace);
  const writeStart = t(8);
  const writeEnd = writeStart + Math.max(40, t(58));
  const logoStart = writeEnd + t(10);
  return (
    <AbsoluteFill style={{ backgroundColor: "#EEE8DD" }}>
      <StorePhoto
        src={photo}
        durationInFrames={durationInFrames}
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
          start={writeStart}
          duration={writeEnd - writeStart}
          width={800}
          ink={AVU_GOLD}
        />
        <div style={{ marginTop: -22, marginLeft: 120 }}>
          <HandFlourish
            start={writeEnd - 6}
            length={Math.max(16, t(22))}
            width={420}
            ink={AVU_GOLD}
          />
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
              ...fadeIn(frame, logoStart, t(30)),
            }}
          />
          {guestLogo && guestLogoAspect ? (
            <>
              <div
                style={{
                  width: 1.5,
                  backgroundColor: AVU_GOLD,
                  opacity: 0.55,
                  height: interpolate(
                    frame,
                    [logoStart + t(4), logoStart + t(28)],
                    [0, GUEST_HEIGHT],
                    {
                      ...clamp,
                    },
                  ),
                }}
              />
              <Img
                src={staticFile(guestLogo)}
                style={{
                  height: GUEST_HEIGHT,
                  width: GUEST_HEIGHT * guestLogoAspect,
                  ...fadeIn(frame, logoStart + t(10), t(30)),
                }}
              />
            </>
          ) : null}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
