---
name: avu-aesthetic
description: AVU's visual and editorial design system for avu.wine and anything that looks like it, distilled from a measured analysis of patek.com and vacheron-constantin.com and adapted to a Swiss fine wine merchant. Use it whenever you design, build, mock up, restyle or review any AVU page, section, landing page, HTML mockup, homepage film, banner, email layout or presentation look — and whenever the user mentions AVU, avu.wine, "luxury" or "Patek / Vacheron style" for AVU, the AVU brief, the AVU mockup, Wine Club / Wine Shop pages, or asks what a block should look like, even if they never say "aesthetic" or "design system".
---

# AVU aesthetic

AVU (AVU SA, Melide near Lugano) sells rare and fine wine to private clients worldwide. Its site has one job: make a first-time visitor believe, within seconds, that AVU is real, reputable and worth trusting with significant sums. This skill turns that job into a visual and editorial system. It borrows the restraint and rhythm of Patek Philippe and the warmth of Vacheron Constantin, measured from their live sites in October 2026, and applies them to wine.

The short version: **the bottle, its provenance and the people behind it are the heroes; the house in Melide frames them.** Luxury here means restraint, real material, exact facts and one clear action per block.

## How to use this skill

1. **Know the page's job.** Decide which visitor question the page answers (is AVU real, can they get this wine, will someone look after me). Pick the matching page template in `references/patterns.md`.
2. **Start from the tokens.** Link or paste `assets/avu-tokens.css` (colours, type, spacing, motion, buttons, links) and then `assets/avu-components.css` (the blocks). Do not invent new colours or sizes; extend the token file if something is genuinely missing.
3. **Build from the patterns.** `references/patterns.md` has the block recipes (header, film, statement and facts, spread, bottle cards, spec table, quote, producer cards, constellation, services, tiles, membership tiers, portrait, visit card with form, footer) and the page templates for inner pages. `assets/starter.html` is a working page that already uses them; copy it with the other files in `assets/`. Where a photo is not available yet, use the `.avu-ph` placeholder that names the photo that belongs there.
4. **Use real AVU material.** Photos, films, logo and facts follow the rules below and `references/avu-facts.md`. Never fill gaps with invented numbers, vintages, quotes or endorsements; leave a visible "to be confirmed by AVU" note instead.
5. **Check before you show.** Run the checklist at the end of this file. For a page you built, look at it once at desktop and phone width.

When the user wants to know *why* something looks the way it does, or wants to go deeper into one reference, read `references/patek-philippe.md` or `references/vacheron-constantin.md`. They contain the measured values and the page-by-page patterns.

Files in this skill:

| File | Read or use when |
| --- | --- |
| `references/patterns.md` | Building any block or page |
| `references/avu-facts.md` | Writing any fact, number, quote, membership term or contact detail |
| `references/patek-philippe.md`, `references/vacheron-constantin.md` | Explaining a choice, or adapting another pattern from the references |
| `assets/avu-tokens.css`, `assets/avu-components.css` | Every page |
| `assets/film.js`, `assets/constellation.js` | Pages with films or the producers constellation |
| `assets/starter.html` | Starting a new page or mockup |
| `assets/avu-logo-lockup.svg`, `-mark.svg`, `-full.svg` | Header, emblem, footer |

## The ten principles

1. **The object is the hero.** Patek opens collections with studio watches on dark, vignetted ground; Vacheron puts each watch on a quiet cream tile. For AVU the object is the bottle (and the case, the cellar, the label). Show it big, lit, sharp, with nothing competing.
2. **Proof over adjectives.** Both houses prove claims with things you can see: the manufacture, the archive, the president's words. AVU proves with stock it physically owns, named producers, filmed producer conversations, real rooms and real people. A fact with a source beats "exceptional" every time.
3. **Restraint is the luxury.** One accent colour, two typefaces, one action per block, lots of empty space. Remove before adding. If a block needs a badge, a sticker or a second button to work, the block is wrong.
4. **Rhythm: big frame → light editorial spread → compact object block.** Never stack two identical full-screen photo-with-centred-text blocks back to back. Alternate scale and background (cream, paper, night) the way Patek alternates white bands with dark product tiles.
5. **Short, calm headlines.** Two to seven words, sentence case (Vacheron) — e.g. "Around the table at AVU", "Unrivalled stock, ready to ship". The supporting line does the explaining.
6. **Narrow text, wide images.** Running text sits in a column of 30–36em (Patek's text columns measure 400–590 px; Vacheron's 435–660 px). Images take the full width or a half.
7. **Slow, smooth motion.** Fades and gentle rises only, eased out over 0.5–0.8 s (Patek: `cubic-bezier(.19,1,.22,1)`; Vacheron: `cubic-bezier(.65,0,.35,1)` at 0.6 s). Films move like a drone or a dolly, never like a slideshow. Everything respects reduced motion and has a pause button.
8. **Warm, not white.** AVU uses Vacheron's warm cream ground (wine, oak, cork, paper) rather than Patek's white, with a dark "night" ground for evening content (The Wine Club, producers). The only accent is the brand gold of the logo, #89764B.
9. **The house speaks in the first person plural, the founder in his own words.** Like Patek quoting Thierry Stern, AVU quotes Fabio Cattaneo — only from approved sources (see facts file).
10. **Every page ends with a way in.** Vacheron closes pages with a framed "discover in person" card. AVU closes with "Visit AVU in Melide" beside "Speak to our team", and the button text says exactly what will happen.

## Tokens at a glance

The full set is in `assets/avu-tokens.css`. The essentials:

| Role | Value | Note |
| --- | --- | --- |
| Ground | `--avu-cream #F4ECE0`, `--avu-paper #FAF6EF` | Cream for the page, paper for cards and alternating bands |
| Night ground | `--avu-night #14120F`, `--avu-night-2 #1D1A16` | Wine Club, producers, footer |
| Text | `--avu-ink #2E2218`, `--avu-ink-2 #4F3F31` | Dark brown, never pure black |
| Small labels | `--avu-label #6F5B47`, `--avu-gold-deep #6E5E36` | ≥ 5:1 on cream, safe at 12 px |
| Brand gold | `--avu-gold #89764B` | Logo, rules, large text only (3.8:1 on cream) |
| Gold on night | `--avu-gold-light #D9C293` | Labels and links on dark grounds |
| Display type | Light humanist sans, 300, sentence case | Mockups: Albert Sans; production: a licensed face in the spirit of Prelo |
| Body type | Book serif, 18 px / 1.65 | Mockups: Newsreader; Patek uses Lora |
| Labels | 12 px caps, 600, letter-spacing .22em, a 28 px gold rule above | Vacheron's Söhne Kräftig 12 px / .2em pattern |
| Section spacing | `clamp(80px, 10vw, 144px)` top and bottom | Halve it for compact blocks |
| Container | 1280 px max, gutters 16 px (phone) / 56 px (desktop) | Text column 34em |
| Motion | 0.5–0.8 s, `cubic-bezier(.19,1,.22,1)` | Films: 3 s per shot, 0.9 s cross-fade |

Two button systems only: a solid dark rectangle for the one main action of a block (`.avu-btn`), and an underlined caps text link for everything editorial (`.avu-link`). Patek's rounded pill is not used.

## Page architecture

The agreed homepage order (keep it unless the user changes it):

1. **First screen** — film of the building (wide → medium → close), one headline, one line saying what AVU is ("A Swiss fine wine merchant serving private clients worldwide."), one link (Request an invitation). The shade sits behind the text, not over the whole picture.
2. **Statement and proof of scale** — one centred sentence, four facts with exact labels, the Forbes Italia link.
3. **Producers** — filmed producer conversations (when approved), AVU Wine Stories episodes, a compact constellation of selected producers.
4. **Stock, storage and rare bottles** — a spread with the shop film framed beside three proofs (sourced, stored, checked), then three bottle cards.
5. **Personal service** — Personal Wine Butler and worldwide delivery in one spread, with the Los Angeles case.
6. **The Wine Club** — full-screen evening film, lower on the page.
7. **Membership** — Silver, Gold, Platinum explained, separate from The Wine Club.
8. **Our story** — Fabio's portrait, the Forbes facts, one value with its proof.
9. **Contact** — visit Melide on one side, "Speak to our team" with a topic selector on the other.
10. **Footer** — dark, logo, phone and email, link columns, the UVA line.

Three films at most per page. Inner pages (Our Wines, a bottle, Producers, Services, The Wine Club, Membership, Our story) have templates in `references/patterns.md`.

## Photography and film

- **Real AVU material only.** The building, The Wine Shop, The Wine Club, the cellars, the bottles, the team. No stock images, no AI-generated "luxury lifestyle" (yachts, jets) pictures.
- **Latest photos win.** In AVU's photo folder the watermarked Marco Reggi previews are the newest shoot (the building with The Wine Club pavilion in front). Older unwatermarked exteriors show the building before the pavilion was built — do not use them for the building. Previews are fine in mockups and are replaced by their originals before launch.
- **Shot sizes alternate like an edit:** wide → medium → close, one triad per place. Patek's homepage films run 14–20 s with shots of about 2.5–3 s; AVU films are 15 s, five shots of 3 s, ending on an image that loops cleanly into the first.
- **People:** faces are allowed in natural moments (an advisor showing a bottle, Fabio's portrait). Avoid posed group scenes that read as stock (a table of smiling people raising glasses, a client walking out with a bag).
- **Bottles:** labels must be sharp and readable; never let AI regenerate a label, a logo or a building. If AI video is used (Higgsfield Cinema Studio), animate wide shots only, keep close-ups as real photos with a gentle browser move, and reject any clip that invents architecture.
- **Shade, don't bury.** A light top gradient for the header and a soft radial shade behind the caption. Keep the light and materials of the photo visible.
- **Crops:** product and portrait 4:5; editorial 4:3 or 3:2; hero 16:9 or full screen; detail band 16:9 cut from a high-resolution portrait.

`assets/film.js` is the browser film engine used in the mockups (camera moves and cross-fades over stills, pause button, reduced-motion fallback). Configure it with a `window.AVU_FILMS` object as shown in `references/patterns.md`. `assets/constellation.js` draws the producers constellation (configured with `window.AVU_SKY`).

## Voice and copy

- English first (German second). Plain, calm, exact. Short sentences, active voice, "we" for AVU.
- Headlines of two to seven words in sentence case; one supporting line under them.
- Specific beats grand: "The vast majority of our collection is physically owned by AVU" (AVU's own wording), not "all our wine is ours".
- Names of things people recognise: Personal Wine Butler (with the explanation "your dedicated private wine advisor"), The Wine Club (a place), AVU Membership (a status), Our Wines, Our story.
- Button text states the result: "Enquire about this wine", "Request an invitation", "Read the Forbes Italia interview", "Plan your visit". Never "Learn more" or "Click here".
- No prices, no carts, no "Exclusive!" badges, no exclamation marks.
- A claim about a producer relationship needs a source. An AVU Wine Stories film is editorial, not an endorsement; only a filmed statement approved in writing by the estate counts as one.

## AVU-specific rules

- **Logo:** `assets/avu-logo-lockup.svg` (horizontal, as on the building's sign) in the header; `assets/avu-logo-mark.svg` (mark with AVU) as an emblem; `assets/avu-logo-full.svg` (stacked, with LUXURY WINES) in the footer. All use `currentColor`: white over films, brand gold on cream, light gold on night. Never stretch, recolour outside the palette or redraw.
- **UVA–AVU:** AVU read backwards is UVA, Italian for grape. Keep it a quiet thread: the footer line "The grape · The producer · The terroir · The vintage · The bottle" and one sentence on the About page. No animations or gimmicks built on it.
- **Facts and sources:** read `references/avu-facts.md` before writing any number, membership term, warehouse, founder fact or quote. It also lists what is still unconfirmed and what must never appear.

## Do not

- Copy either house's logo, wording, photography or exact layouts — borrow principles, not assets.
- Use pure white or pure black grounds, more than one accent colour, rounded pill buttons, drop shadows on cards, or emoji.
- Put two full-screen photo blocks with centred captions back to back, or more than three films on a page.
- Invent vintages, formats, prices, client counts, quotes, awards or endorsements.
- Show the building from the unwatermarked pre-pavilion photos.

## Checklist before showing a page

- [ ] The first screen says what AVU is, and there is exactly one action on it.
- [ ] Every block has one job, one headline, one action; button text says what happens.
- [ ] Rhythm alternates big frame, light spread and compact object block; grounds alternate cream, paper and night.
- [ ] Only tokens from `avu-tokens.css`; small text uses `--avu-label` or `--avu-gold-deep`, never `--avu-gold`.
- [ ] Every number, quote and membership term matches `references/avu-facts.md`, or is marked "to be confirmed by AVU".
- [ ] Photos are AVU's own and the latest; films alternate wide, medium and close, about 3 s per shot, with a pause button.
- [ ] Works at 390 px wide with no sideways scrolling; text columns stay near 34em on desktop.
- [ ] Motion is slow (0.5–0.8 s) and switches off under reduced motion.
