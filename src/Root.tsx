import "./index.css";
import { Composition, Folder } from "remotion";
import { MyComposition } from "./Composition";
import { EPISODES, SERIES } from "./episodes";
import { AVU_GOLD, Ecriture, ECRITURE_DURATION } from "./intro/Ecriture";
import { Editorial, EDITORIAL_DURATION } from "./intro/Editorial";
import { Nocturne, NOCTURNE_DURATION } from "./intro/Nocturne";
import { QuestionCard, QUESTION_DURATION } from "./intro/QuestionCard";
import { FPS, IntroProps } from "./intro/shared";
import { ThankYouCard, THANK_YOU_DURATION } from "./intro/ThankYouCard";
import { DividerCard, DIVIDER_DURATION } from "./intro/DividerCard";
import { MapCard, MAP_DURATION } from "./intro/MapCard";

const video = { fps: FPS, width: 1080, height: 1920 };

// Logo width used by the intro; height follows the logo's aspect.
const GUEST_LOGO_WIDTH = 480;

// The approved Producer Spotlight look, shared by every episode.
const INTRO_LOOK = {
  ink: AVU_GOLD,
  originalLogos: true,
  veil: 0.36,
  textVeil: 0.55,
};

// Early design explorations, kept for reference.
const lynchBages: IntroProps = {
  guestLogo: "guests/lynch-bages.png",
  guestLogoWidth: GUEST_LOGO_WIDTH,
  guestLogoAspect: 792 / 301,
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {EPISODES.map((ep) => {
        const series = SERIES[ep.series];
        return (
          <Folder key={ep.id} name={ep.id}>
            <Composition
              id={`${ep.id}-0-Intro`}
              component={Ecriture}
              durationInFrames={ECRITURE_DURATION}
              {...video}
              defaultProps={{
                ...INTRO_LOOK,
                photo: ep.photo,
                kicker: series.kicker,
                scriptWord: series.scriptWord,
                scriptScale: series.scriptScale,
                subtitle: ep.introSubtitle ?? series.subtitle,
                guestLogo: ep.guest?.logo,
                guestLogoAspect: ep.guest?.aspect ?? 1,
                // The template draws the logo at 85% of this width
                guestLogoWidth: (ep.guest?.logoWidth ?? 408) / 0.85,
                guestName: ep.guest?.name,
              }}
            />
            {ep.cards.map((card, i) => (
              <Composition
                key={i}
                id={`${ep.id}-${i + 1}-Card`}
                component={QuestionCard}
                durationInFrames={QUESTION_DURATION}
                {...video}
                defaultProps={{
                  lines: card.lines,
                  highlight: card.highlight ?? [],
                  byline: card.byline,
                  label: ep.cardLabel ?? series.cardLabel,
                  photo: ep.photo,
                }}
              />
            ))}
            {ep.divider ? (
              <Composition
                id={`${ep.id}-${ep.cards.length + 1}-${ep.divider.name}`}
                component={DividerCard}
                durationInFrames={DIVIDER_DURATION}
                {...video}
                defaultProps={{
                  label: ep.cardLabel ?? series.cardLabel,
                  scriptWord: ep.divider.scriptWord,
                  scriptScale: ep.divider.scriptScale ?? 1.6,
                  subtitle: ep.divider.subtitle,
                  photo: ep.photo,
                }}
              />
            ) : null}
            {(ep.maps ?? []).map((m) => (
              <Composition
                key={m.name}
                id={`${ep.id}-Map-${m.name}`}
                component={MapCard}
                durationInFrames={MAP_DURATION}
                {...video}
                defaultProps={{
                  countryId: m.countryId,
                  countryName: m.countryName,
                  countryLabelAt: m.countryLabelAt,
                  city: m.city,
                  from: m.from,
                  to: m.to,
                }}
              />
            ))}
            <Composition
              id={`${ep.id}-9-Outro`}
              component={ThankYouCard}
              durationInFrames={THANK_YOU_DURATION}
              {...video}
              defaultProps={{
                guestLogo: ep.guest?.logo,
                guestLogoAspect: ep.guest?.aspect,
                guestLogoHeight: ep.guest?.outroHeight,
                avuLogoHeight: ep.guest?.outroAvuHeight,
                photo: ep.photo,
              }}
            />
          </Folder>
        );
      })}

      <Folder name="Explorations">
        <MyComposition />
        <Composition
          id="Spotlight-A-Ecriture"
          component={Ecriture}
          durationInFrames={ECRITURE_DURATION}
          {...video}
          defaultProps={lynchBages}
        />
        <Composition
          id="Spotlight-A-Ecriture-Gold"
          component={Ecriture}
          durationInFrames={ECRITURE_DURATION}
          {...video}
          defaultProps={{ ...lynchBages, ink: AVU_GOLD, text: AVU_GOLD }}
        />
        <Composition
          id="Spotlight-B-Editorial"
          component={Editorial}
          durationInFrames={EDITORIAL_DURATION}
          {...video}
          defaultProps={lynchBages}
        />
        <Composition
          id="Spotlight-C-Nocturne"
          component={Nocturne}
          durationInFrames={NOCTURNE_DURATION}
          {...video}
          defaultProps={lynchBages}
        />
      </Folder>
    </>
  );
};
