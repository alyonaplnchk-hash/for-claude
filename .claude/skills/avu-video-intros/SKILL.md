---
name: avu-video-intros
description: Make the branded on-screen graphics for AVU Luxury Wines video series — Producer Spotlight (interviews with a wine estate) and Wine Tips (Laura and Ivano sharing tips). One episode = an animated intro with a hand-written title, a card per interview question or tip, and a closing "Thank you" card, rendered as vertical 1080×1920 videos in the exact AVU gold. Use this skill whenever the user asks for a заставка, интро, intro, title card, question card, вопрос для интервью, tip card, типс, "Thank you" ending, or a new episode of Producer Spotlight or Wine Tips, or sends a new estate logo or list of questions/tips to "make like last time" — even if they don't name the series.
---

# AVU video intros: Producer Spotlight & Wine Tips

The user (AVU marketing) films two vertical video series and needs matching
graphics for each episode. The look was designed and approved with them over
many rounds, so the job is to **fill the template with new content, not to
redesign it**. Their feedback during design was consistent: it must feel
quiet, muted and hand-made ("not too AI"), the gold must be exactly the AVU
logo colour, and logos must keep their own colours.

Talk to the user in the language they write in (usually Russian).

## Where the work lives

Everything is in the Remotion project in the GitHub repo
`alyonaplnchk-hash/for-claude`. If it isn't already the working directory,
attach and clone it (add_repo, then clone), run `npm i`, and work there.
Commit and push to the branch the session tells you to use.

| Path | What it is |
|---|---|
| `src/episodes.ts` | **The only file you normally edit.** One entry per episode + per-series defaults (`SERIES`). |
| `public/guests/` | Guest estate logos (transparent PNG). |
| `public/store.jpg` | Default background: the AVU store photo. |
| `src/intro/Ecriture.tsx` | Intro template (hand-written title). |
| `src/intro/QuestionCard.tsx` | Question / tip card template. |
| `src/intro/ThankYouCard.tsx` | Closing card template. |
| `scripts/prepare-logo.py` | Cleans a guest logo (removes white background, trims, keeps colours). |
| `scripts/render-episode.sh` | Renders a whole episode into `out/<episode-id>/`. |
| `scripts/script-words.txt` + `gen-script-glyphs.cjs` | Words that can be "written by hand". |

Each episode shows up in Remotion as a folder of compositions:
`<id>-0-Intro`, `<id>-1-Card`, `<id>-2-Card`, …, `<id>-9-Outro`.

## What each series looks like

Shared look (don't change unless asked): blurred store photo with a light
cream veil, soft film grain and vignette; Sora for small caps, Playfair
Display Italic for sentences, Pinyon Script for the hand-written word.
Gold `#89764B` for the script word, flourishes and highlighted words; text
`#4A443B`.

**Producer Spotlight** (`series: "producer-spotlight"`)
- Intro (7 s): PRODUCER → *Spotlight* written by hand in gold → flourish →
  "in conversation with" → GUEST NAME (if given) → guest logo, AVU logo on top.
- Cards (6 s each): label PRODUCER SPOTLIGHT, the question rises word by word,
  the estate name in gold. Everything is on screen by ~3 s — the user asked
  for "smooth but fast, fully written within 3 seconds". Cards over 10 words
  speed up their word reveal automatically to keep that limit.
- Divider (4 s, optional): a section break before the flash questions
  Laura asks on camera — label PRODUCER SPOTLIGHT, *Flash* written by hand
  (fast) → flourish → "questions". Fully on screen by ~1 s; the
  editor shows it for 1.5–2 s. Set `divider` on the episode:
  `{ name: "FlashQuestions", scriptWord: "Flash", subtitle: "questions", scriptScale: 1.36 }`
  (the user asked for Flash 15% smaller than the first try at 1.6)
  → composition `<id>-<last card + 1>-FlashQuestions`, so it always follows the last question (template `src/intro/DividerCard.tsx`).
- Outro (6 s): *Thank you* written by hand, then AVU logo | guest logo.

**Wine Tips** (`series: "wine-tips"`)
- Intro: WINE → *Tips* written by hand (larger, `scriptScale: 1.6`, because
  a short word otherwise looks lost) → "with Laura & Ivano" → AVU logo. No
  guest logo.
- Cards: label WINE TIPS, the tip, key word(s) in gold, and a `byline` with
  who shares it ("Laura" / "Ivano").
- Outro: *Thank you* + AVU logo alone.

## Workflow

### 1. Collect the content

Ask only for what's missing; the user often sends things one message at a time.

- Producer Spotlight: estate name, its logo file, the guest's name (shown
  in the intro), the questions.
- Wine Tips: the tips and who presents each one (Laura, Ivano, or both).
- Optional: a different background photo; a card label other than the default.

If they send questions/tips one by one, render each card as it arrives —
that's how they worked before — and keep adding them to the same episode.

### 2. Prepare the guest logo (Producer Spotlight)

```bash
python3 scripts/prepare-logo.py <uploaded file> public/guests/<estate-slug>.png
```

It prints the aspect (e.g. `792 / 301`) to put in the episode. Look at the
result. If it warns that the logo is small, say so and suggest asking the
estate for a large PNG or SVG — low-res logos look soft on screen. Never
re-colour the guest logo; the user explicitly wants original colours.

### 3. Add the episode to `src/episodes.ts`

```ts
{
  id: "PS-ChateauMargaux",          // PS- or WT- prefix, letters/digits/hyphens
  series: "producer-spotlight",
  photo: "store.jpg",
  guest: {
    logo: "guests/chateau-margaux.png",
    aspect: 1200 / 410,
    name: "Philippe Bascaules",   // shown in caps under "in conversation with"
    logoWidth: 440,               // optional; default 408 suits wide logos
    outroHeight: 180,             // optional; Thank you card, default 118
    outroAvuHeight: 144,          // optional; AVU on that card, default 156
  },
  cards: [
    {
      lines: ["What makes", "Château Margaux", "different?"],
      highlight: ["Château", "Margaux"],
    },
  ],
},
```

Check the intro still for the logo size: a tall, compact logo (stacked
crest + name, like Les Carmes Haut-Brion) needs a larger `logoWidth`
(~440) to keep its lettering readable. On the Thank you card the AVU mark
is dense and bold, so next to a light, thin-lined logo it reads larger
than its size: raise `outroHeight` (~180) and lower `outroAvuHeight`
(~144) until both look equal. On Les Carmes the user found 156/175 AVU-heavy and 132/200 Carmes-heavy; small steps matter. A
wide one-line logo (Lynch-Bages) is fine at the defaults. When unsure,
render 3–4 size pairs side by side as stills and pick by eye.

Wine Tips cards add `byline: "Laura"`. If only one host presents the
episode, set `introSubtitle: "with Laura"`.

**Breaking lines by hand matters** — it's what makes the cards look
designed. At the card's 82 px size about 20 characters fit on a line.
Aim for 2–4 lines of similar length, break at natural phrase boundaries,
and give a long estate name its own line rather than letting it wrap
(e.g. "Apart from / Lynch-Bages, / what's your / favourite bottle?").
When the user says "keep it tight", rewrite the question shorter
(aim for ≤ 13 words) keeping its idea and the estate name, and tell them
what you cut. Use sentence case and curly apostrophes (’) even when the user types the
question in capitals — the series uses sentence case throughout. Keep their
spelling as typed ("favourite" in one episode, "favorite" in another).

Gold word: the estate name when the question contains it; otherwise the
one word that carries the question ("surprises", "memory").

`highlight` lists single words; punctuation (?.,!:;… and quotes) is ignored when matching, so
list "Lynch-Bages" for "Lynch-Bages?".

### 4. Preview before rendering

Rendering takes ~2 minutes per part, so check stills first:

```bash
HS=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
npx remotion still <id>-1-Card /tmp/preview.png --frame=170 --scale=0.5 --browser-executable=$HS
```

Useful frames: intro 205 (final state), cards 40 (mid-reveal) and 170,
outro 175. Look at every still: no line wrapping you didn't intend, the gold
word is right, nothing overlaps, logos balanced.

### 5. Render

```bash
scripts/render-episode.sh <episode-id>          # whole episode
scripts/render-exact.sh <composition-id> out/<name>   # a single part
```

Each part comes out as two files:
- `<part>-hevc10.mp4` — **main file**. 10-bit HEVC; gold decodes to exactly
  `#89764B`. Plays on iPhone, Mac, Instagram.
- `<part>.mp4` — H.264 fallback for older editors; gold is `#89764A`
  because 8-bit video can't represent `#89764B` exactly.

Why the custom script: Remotion's own encoder shifted the gold by 2–3 units.
The user checks the colour, so always render through these scripts.

### 6. Deliver

Send the files with SendUserFile (HEVC first, then H.264), commit
`src/episodes.ts` and any new logo, and push. `out/` is git-ignored — the
videos are delivered as files, not committed.

In the reply: what's in each file, the timings, anything you decided (line
breaks, which words are gold), and any concern (e.g. low-res logo).

## Adding a new hand-written word

Only the words in `scripts/script-words.txt` can be animated by hand
(currently Spotlight, Thank you, Tips, Flash). To add one (e.g. for a new series):

```bash
echo "Cheers" >> scripts/script-words.txt
node scripts/gen-script-glyphs.cjs && npx prettier -w src/scriptGlyphs.ts
```

Then reference it as `scriptWord` in `SERIES`. Use `scriptScale` > 1 for
short words.

## A new series

Add an entry to `SERIES` in `src/episodes.ts` (kicker, scriptWord,
scriptScale, subtitle, cardLabel) and to the `series` union type. Confirm
the wording with the user before rendering.

## Environment notes

- Google Fonts can't load in the cloud container; fonts are bundled in
  `public/fonts`. Don't switch back to `@remotion/google-fonts`.
- Remotion can't download its own Chrome here; use the preinstalled
  headless shell (the scripts find it automatically).
- No music by default — the user asked to remove it. A synthesized bed
  exists (`scripts/compose-intro-music.py`, `music` prop on the intro) if
  they ask for sound again; licensed tracks from them are better.

## History worth knowing

The `Explorations` folder in Remotion holds earlier designs (a magazine
layout, a dark "Nocturne" version, the first bright version). The user
rejected the first bright one as "too perfect / too AI". If they ask for
something new or different, start from their feedback and show stills
before committing to a full render.
