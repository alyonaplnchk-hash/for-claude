# Patek Philippe (patek.com): what we measured and what AVU takes

Measured with a headless browser at 1440 px wide in October 2026 on six pages: Home, Our collections, Calatrava, Our values, Salons & Maisons, Servicing. Values are computed styles, not guesses. Use them to explain choices, not to copy the site.

## Contents
1. The system in one paragraph
2. Type
3. Colour and grounds
4. Layout and grid
5. Imagery and film
6. Buttons, links and motion
7. Page patterns
8. What AVU takes, adapts and leaves

## 1. The system in one paragraph

A white page, one muted gold-brown, two typefaces, and very large photographs. Headlines are light, all caps, widely spaced; reading text is a warm book serif. Every page opens with a full-width picture or film, then a centred introduction, then alternating picture-and-text rows, and ends on a dark banner that leads to the next story. Nothing is decorated: no shadows, no frames, no icons beyond a play button.

## 2. Type

| Use | Font | Size / line height | Weight | Case and spacing | Colour |
| --- | --- | --- | --- | --- | --- |
| H1 page title | Open Sans | 40 / 48 px | 300 | ALL CAPS, 0.12 px | gold-brown on white, white on images |
| H2 section | Open Sans | 32 / 38.4 px | 300 | ALL CAPS, 1.08 px | gold-brown |
| H2 on image banner | Open Sans | 24 / 30 px | 300 | ALL CAPS, 0.72 px | white |
| Eyebrow above titles | Open Sans | 14 / 18 px | 400 | ALL CAPS, 0.28 px | gold-brown or white |
| Reference numbers (5226G-001) | Open Sans | 16 / 20 px | 300 | ALL CAPS, 0.48 px | gold-brown |
| Reading text | Lora | 16 / 26 px | 400 | sentence case | #2E2E33 |
| Navigation | Lora | 15.2 px | 400 | sentence case | #2E2E33 |
| Quote | Lora | 16 / 26 px | 400 | sentence case | gold-brown, on a grey panel |
| Quote attribution | Open Sans | 14 / 20 px | 400 | "Thierry Stern, President" | #2E2E33 |

Observations
- The hierarchy comes from case and spacing, not from size: H1 is only 40 px. The page feels calm because nothing shouts.
- Sans for naming things, serif for telling things. Every page keeps that split.
- Line height of reading text is generous (1.63).

## 3. Colour and grounds

| Role | Value |
| --- | --- |
| Page | #FFFFFF |
| Quote and intro panels | #F8F7F7 |
| Product tiles, collection page | #101010 / #000000 studio grounds |
| Accent (headlines, labels, buttons) | rgb(140, 122, 102) = #8C7A66 |
| Text | #2E2E33 |
| Footer helper text | #C4BDB4 |

One accent only, a desaturated gold-brown. Black appears only inside photographs and product tiles, never as large flat UI.

## 4. Layout and grid

- Content container: 1360 px max; full-bleed media up to 1920 px.
- Header: 99 px tall; fixed and transparent over the first image, white and sticky on pages that start with text. Logo (emblem) centred, "MENU" on the left, search and account icons on the right.
- Text columns are narrow: 400 px (introductions over images), 486 px (zigzag text), 588 px (centred introductions), 832 px (captions on collection tiles).
- Zigzag rows: a 588 × 588 square image with a 486 px text column beside it, alternating sides (text starts at x 120 or x 834).
- Long pages: 6,650 to 10,490 px at desktop.

## 5. Imagery and film

| Where | Size at 1440 | Ratio | Kind |
| --- | --- | --- | --- |
| Homepage first screen | 1440 × 990 | 1.45 | autoplay film, muted |
| Homepage, further full-width films | 1440 × 990 | 1.45 | two more films |
| Collection tiles | 1489 × 1046 | 1.42 | studio watch on dark vignette, 11 in a row down the page |
| Calatrava and Salons first screen | 1440 × 810 | 16:9 | photo |
| Half tiles | 720 × 810 | 0.89 | photo beside text |
| Zigzag squares | 588 × 588 | 1:1 | photo or film with a play icon |
| Intro banner on Values and Servicing | 1440 × 450 | 3.2 | wide crop |
| Closing banner | 1200 × 480 | 2.5 | dark image with text and a white pill |
| Product row | 252 × 340 | 0.74 | three watches with reference, name, material |

- Films on the homepage run about 14 to 20 seconds with cuts every 2.5 to 3 seconds; movements are slow pushes and pans.
- Craft is shown in hands-and-tool close-ups (engraving, setting, restoration), the house in architecture, the product in studio light.
- The site carries a visible "Reduce motion" control.

## 6. Buttons, links and motion

- One button style: a transparent pill, 52 px tall, 1 px border in gold-brown (or white on images), radius 999 px, padding 0 24 px, Open Sans 14 px caps.
- Transition on everything: 0.7 s cubic-bezier(0.19, 1, 0.22, 1), a long, soft ease-out.
- Button text names the destination: "Our values", "Calatrava watches", "The Geneva salon", "Points of sale".

## 7. Page patterns

**Home.** Film with H1 and "Discover more" → two more full-width films (Rare handcrafts, Limited editions) → zigzag of the house: "The last family-owned Genevan manufacture", "Innovation and tradition", the museum on a dark band → a lifestyle film "Our collections" → "Our commitment to service" → "Points of sale" → footer. Order: product, proof (manufacture, museum), service, where to buy.

**Collection.** Centred intro (eyebrow, H1, paragraph) → eleven dark tiles, one per collection, each with eyebrow, H2 and a white pill, aligned left or right alternately.

**Calatrava (a collection).** Photo first screen → intro → half tiles and zigzag → President's quote on a grey panel with signature → "The modern Calatrava" → three-watch product row → dark banner to the next collection.

**Our values.** Wide banner → intro → ten values, each a square image and a short text in a zigzag → President's quote → founders banner.

**Salons & Maisons.** Photo first screen → intro → one row per salon (Geneva, Paris, London, Shanghai, Beijing): half image, gold H2, short text, pill.

**Servicing.** Banner → intro "Our commitment to service" → film of hands → zigzag ("A close relationship", "The time it takes", "Training watchmakers") → dark banner "The art of restoration".

**Footer.** White, four link columns (Manufacture, Collection, Service, Points of sale), small logo, legal row, language and "Reduce motion".

## 8. What AVU takes, adapts and leaves

| Patek does | AVU does |
| --- | --- |
| Films of 14–20 s with 2.5–3 s cuts on the first screen | Three films of 15 s (building, shop, club), five shots of 3 s, wide → medium → close |
| Product, then proof, then service, then where to buy | Wines and producers, then stock and provenance, then service, then Melide |
| Narrow text columns (400–590 px) | `--avu-measure: 34em` |
| One muted accent | AVU's own logo gold #89764B, with a deeper and a lighter variant for contrast |
| Soft 0.7 s ease-out | `--avu-ease` is the same curve |
| President's quote with signature on a quiet panel | Fabio Cattaneo, quoted only from approved sources (Forbes Italia) |
| Each page ends on a dark banner to the next story | Each page ends with the visit and contact card |
| Values as a zigzag of image and text | AVU's seven values, each with its proof |
| All-caps light headlines | Not taken: AVU headlines are sentence case (Vacheron), labels stay caps |
| Transparent pill buttons | Not taken: AVU uses a solid rectangle for the main action and underlined caps links elsewhere |
| White page | Not taken: AVU uses a warm cream ground |
