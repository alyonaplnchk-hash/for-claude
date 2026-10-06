import { Audio } from "@remotion/media";
import type React from "react";
import {
  AbsoluteFill,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { DustParticles, FilmGrain, Stage } from "../../components";
import { AVU } from "../../theme/avu";
import { FONTS } from "../../theme/fonts";
import { CLAMP, EASE } from "../../utils/animation";
import { AvuLogo } from "./AvuLogo";
import { AvuTitle } from "./AvuTitle";
import { AVU_LOGO_VIEWBOX } from "./logoPaths";

export const avuIntroSchema = z.object({
  /** Channel name revealed next to the logo. Keep it short (≈ 14 characters). */
  title: z.string(),
  /** Optional small line under the title. Leave empty to hide it. */
  subtitle: z.string(),
  withAudio: z.boolean(),
});

export type AvuIntroProps = z.infer<typeof avuIntroSchema>;

/**
 * The choreography, in seconds. Visuals and sound effects read the same
 * values, so moving a beat here keeps picture and sound in sync.
 */
export const AVU_INTRO_TIMELINE = {
  markDraw: [0.3, 2.0],
  markFill: [1.5, 2.4],
  strokeFade: [2.0, 2.6],
  chime: 1.95,
  wordmark: [2.0, 2.9],
  tagline: [2.6, 3.4],
  logoSheen: [3.0, 3.9],
  whoosh: 3.8,
  lockup: [3.9, 5.1],
  rule: [4.4, 5.3],
  titleStart: 4.7,
  titleStagger: 0.05,
  titleLetter: 1.0,
  subtitle: [5.7, 6.4],
  titleSheen: [6.0, 7.0],
  fadeOut: 0.7,
} as const;

const T = AVU_INTRO_TIMELINE;

/**
 * Channel intro for AVU Wine Stories.
 *
 * The logo draws itself and fills with gold, the wordmark and tagline
 * appear, then the logo glides aside and the channel name is revealed
 * beside it (below it on vertical formats).
 */
export const AvuIntro: React.FC<AvuIntroProps> = ({
  title,
  subtitle,
  withAudio,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const isPortrait = height > width;

  /** 0→1 between two moments (in seconds). */
  const span = (
    [start, end]: readonly [number, number],
    easing: (t: number) => number = EASE.out,
  ) =>
    interpolate(frame, [start * fps, end * fps], [0, 1], { ...CLAMP, easing });

  const lockup = span(T.lockup, EASE.inOut);

  // Lockup geometry in design pixels (the short side of the frame is 1080).
  const logoWidth = isPortrait ? 640 : 540;
  const gap = isPortrait ? 72 : 96;
  const ruleLength = isPortrait ? 280 : 320;
  const textBox = isPortrait
    ? { width: 860, height: 230 }
    : { width: 760, height: 260 };
  const logoHeight =
    (logoWidth * AVU_LOGO_VIEWBOX.height) / AVU_LOGO_VIEWBOX.width;
  // Until the lockup forms, the logo is shifted so it sits in the centre.
  const centreOffset =
    (gap * 2 + 2 + (isPortrait ? textBox.height : textBox.width)) / 2;
  const logoShift = (1 - lockup) * centreOffset;
  const introScale = interpolate(
    frame,
    [0, T.lockup[0] * fps],
    [1.12, 1.08],
    CLAMP,
  );
  const logoScale = introScale + (1 - introScale) * lockup;

  return (
    <Stage background={AVU.wineBlack}>
      {/* Wine-dark backdrop with a warm light behind the logo. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 45%, ${AVU.wine} 0%, ${AVU.wineDeep} 42%, ${AVU.wineBlack} 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 46%, rgba(212, 180, 110, 0.22) 0%, transparent 40%)",
          opacity: span([0.2, 2.4]),
        }}
      />
      <DustParticles color={AVU.champagne} fadeInSeconds={2} seed="avu-dust" />

      <AbsoluteFill
        style={{
          flexDirection: isPortrait ? "column" : "row",
          justifyContent: "center",
          alignItems: "center",
          // Very slow push-in across the whole intro.
          scale: interpolate(frame, [0, durationInFrames], [1, 1.035], CLAMP),
        }}
      >
        <div
          style={{
            width: logoWidth,
            height: logoHeight,
            flexShrink: 0,
            translate: isPortrait ? `0px ${logoShift}px` : `${logoShift}px 0px`,
            scale: logoScale,
          }}
        >
          <AvuLogo
            drawProgress={span(T.markDraw, EASE.inOut)}
            fillProgress={span(T.markFill)}
            strokeOpacity={1 - span(T.strokeFade)}
            wordmarkProgress={span(T.wordmark, EASE.inOut)}
            taglineProgress={span(T.tagline)}
            sheenProgress={span(T.logoSheen, EASE.inOut)}
            style={{ width: "100%", height: "100%" }}
          />
        </div>

        <div style={{ flexShrink: 0, width: gap, height: gap }} />

        {/* Thin gold rule between logo and title. */}
        <div
          style={{
            flexShrink: 0,
            width: isPortrait ? ruleLength : 2,
            height: isPortrait ? 2 : ruleLength,
            backgroundImage: `linear-gradient(${isPortrait ? 90 : 180}deg, transparent, ${AVU.champagne}, transparent)`,
            scale: isPortrait
              ? `${span(T.rule, EASE.inOut)} 1`
              : `1 ${span(T.rule, EASE.inOut)}`,
          }}
        />

        <div style={{ flexShrink: 0, width: gap, height: gap }} />

        <div
          style={{
            flexShrink: 0,
            width: textBox.width,
            height: textBox.height,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: isPortrait ? "center" : "flex-start",
          }}
        >
          <AvuTitle
            text={title}
            startFrame={Math.round(T.titleStart * fps)}
            staggerFrames={T.titleStagger * fps}
            letterFrames={Math.round(T.titleLetter * fps)}
            sheenProgress={span(T.titleSheen, EASE.inOut)}
            style={{
              fontFamily: FONTS.serif,
              fontStyle: "italic",
              fontWeight: 600,
              fontSize: isPortrait ? 168 : 160,
              lineHeight: 1.05,
              whiteSpace: "nowrap",
            }}
          />
          {subtitle ? (
            <div
              style={{
                marginTop: 18,
                color: AVU.goldLight,
                fontFamily: FONTS.body,
                fontSize: 26,
                fontWeight: 500,
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                opacity: span(T.subtitle),
                translate: `0px ${(1 - span(T.subtitle)) * 14}px`,
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>
      </AbsoluteFill>

      {/* Vignette, grain, and fades from/to black. */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, 0.6) 100%)",
        }}
      />
      <FilmGrain opacity={0.08} />
      <AbsoluteFill
        style={{
          backgroundColor: "black",
          opacity:
            1 -
            span([0, 0.8]) +
            interpolate(
              frame,
              [durationInFrames - T.fadeOut * fps, durationInFrames - 1],
              [0, 1],
              CLAMP,
            ),
        }}
      />

      {withAudio ? (
        <>
          <Audio
            name="Pad"
            src={staticFile("audio/avu-pad.mp3")}
            volume={(f) =>
              interpolate(
                f,
                [0, 1.5 * fps, durationInFrames - 1.2 * fps, durationInFrames],
                [0, 0.45, 0.45, 0],
                CLAMP,
              )
            }
          />
          <Audio
            name="Glass chime"
            src={staticFile("audio/glass-chime.mp3")}
            from={Math.round(T.chime * fps)}
            volume={0.9}
          />
          <Audio
            name="Whoosh"
            src={staticFile("audio/whoosh.mp3")}
            from={Math.round(T.whoosh * fps)}
            volume={0.18}
          />
        </>
      ) : null}
    </Stage>
  );
};
