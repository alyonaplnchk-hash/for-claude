// One entry per video. Each episode becomes a folder of compositions in
// Remotion Studio: <id>-0-Intro, <id>-1-Card … <id>-9-Outro.
// The avu-video-intros skill (.claude/skills/avu-video-intros) explains
// how to add one.

export type Card = {
  // One entry per line; break lines by hand so they look balanced
  lines: string[];
  // Words shown in AVU gold (punctuation is ignored when matching)
  highlight?: string[];
  // Optional signature under the text, e.g. "Laura"
  byline?: string;
};

export type Episode = {
  // Letters, digits and hyphens only, e.g. "PS-LynchBages", "WT-Decanting"
  id: string;
  series: "producer-spotlight" | "wine-tips";
  // Background photo in public/
  photo: string;
  // Producer Spotlight only: the guest estate's logo, prepared with
  // scripts/prepare-logo.py (which prints the aspect)
  // name: the person interviewed, shown in the intro above the logo.
  // logoWidth: intro logo width in px (default 408); larger for compact logos.
  // outroHeight: logo height on the Thank you card (default 118).
  guest?: {
    logo: string;
    aspect: number;
    name?: string;
    logoWidth?: number;
    outroHeight?: number;
  };
  // Questions (Producer Spotlight) or tips (Wine Tips), in order
  cards: Card[];
  // Small caps line above every card; defaults per series
  cardLabel?: string;
  // Line under the script word in the intro; defaults per series
  // (e.g. "with Laura" when only Laura presents)
  introSubtitle?: string;
};

export const EPISODES: Episode[] = [
  {
    id: "PS-LynchBages",
    series: "producer-spotlight",
    photo: "store.jpg",
    guest: { logo: "guests/lynch-bages.png", aspect: 792 / 301 },
    cards: [
      {
        lines: [
          "What are the most",
          "memorable stories",
          "connected to",
          "Lynch-Bages?",
        ],
        highlight: ["Lynch-Bages"],
      },
      {
        lines: ["Who would you invite", "to share a bottle", "of Lynch-Bages?"],
        highlight: ["Lynch-Bages"],
      },
      {
        lines: [
          "Apart from",
          "Lynch-Bages,",
          "what’s your",
          "favourite bottle?",
        ],
        highlight: ["Lynch-Bages"],
      },
    ],
  },
  {
    id: "PS-CarmesHautBrion",
    series: "producer-spotlight",
    photo: "store.jpg",
    guest: {
      logo: "guests/les-carmes-haut-brion.png",
      aspect: 1249 / 759,
      name: "Guillaume Pouthier",
      logoWidth: 440,
      outroHeight: 175,
    },
    cards: [
      {
        lines: ["What surprises", "people when they", "visit the estate?"],
        highlight: ["surprises"],
      },
      {
        lines: ["What’s your favorite", "wine memory?"],
        highlight: ["memory"],
      },
      {
        lines: [
          "Beyond Les Carmes,",
          "where would you",
          "plant your next",
          "vineyard?",
        ],
        highlight: ["Les", "Carmes"],
      },
      {
        lines: ["Who is your", "wine hero?"],
        highlight: ["hero"],
      },
      {
        lines: [
          "If someone opens",
          "Les Carmes in 2076,",
          "what note would",
          "you leave them?",
        ],
        highlight: ["Les", "Carmes"],
      },
      {
        lines: ["What’s the next", "big thing in wine?"],
        highlight: ["next"],
      },
      {
        lines: ["Magnum or", "Marie-Jeanne?"],
        highlight: ["Magnum", "Marie-Jeanne"],
      },
    ],
  },
  {
    // Sample episode to preview the Wine Tips templates
    id: "WT-Sample",
    series: "wine-tips",
    photo: "store.jpg",
    cards: [
      {
        lines: ["Serve red wine", "slightly cooler", "than the room"],
        highlight: ["cooler"],
        byline: "Laura",
      },
      {
        lines: ["Hold the glass", "by the stem"],
        highlight: ["stem"],
        byline: "Ivano",
      },
    ],
  },
];

export const SERIES = {
  "producer-spotlight": {
    kicker: "PRODUCER",
    scriptWord: "Spotlight",
    scriptScale: 1,
    subtitle: "in conversation with",
    cardLabel: "PRODUCER SPOTLIGHT",
  },
  "wine-tips": {
    kicker: "WINE",
    scriptWord: "Tips",
    // A short word: written larger so it holds the frame
    scriptScale: 1.6,
    subtitle: "with Laura & Ivano",
    cardLabel: "WINE TIPS",
  },
} as const;
