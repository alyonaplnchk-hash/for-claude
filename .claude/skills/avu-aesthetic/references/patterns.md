# AVU block recipes and page templates

Every block below uses classes from `assets/avu-tokens.css` and `assets/avu-components.css`. `assets/starter.html` puts them together in a working page; copy it rather than starting from nothing.

## Contents
1. Page setup
2. Rhythm rules
3. Blocks: header, film, statement and facts, section head, spread, bottle cards, spec table, quote, cards on night, constellation, two services, tiles, membership tiers, portrait and story, closing visit card with form, footer
4. Page templates: homepage, Our Wines, a bottle, Producers, Services, The Wine Club, Membership, Our story
5. Small rules that keep it AVU

## 1. Page setup

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Albert+Sans:wght@300;400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap">
<link rel="stylesheet" href="avu-tokens.css">
<link rel="stylesheet" href="avu-components.css">
...
<script>window.AVU_FILMS = { /* see the film block */ };</script>
<script src="film.js"></script>
```

For a single-file artifact, paste both CSS files into one `<style>` and both scripts inline. Logos: paste the SVG from `assets/avu-logo-*.svg` inline so `currentColor` works; inside a link, replace `role="img" aria-label=…` with `aria-hidden="true" focusable="false"` and put the label on the link.

## 2. Rhythm rules

- Alternate three scales: **big frame** (film or full-width picture), **light spread** (picture beside text), **compact object block** (bottle cards, facts, tiers).
- Alternate grounds: cream → night → cream → paper → night (film) → cream → paper → cream → night (footer). Never two night sections in a row except a film followed by the footer.
- Never two full-screen films next to each other; at most three films per page.
- Section padding is `--avu-section`; use `--avu-section-compact` for statement and facts.
- Every block: one eyebrow, one headline, at most one supporting line, one action.

## 3. Blocks

### Header
Transparent and white over a film; solid cream with a gold logo after 60 px of scroll (add `.is-solid` from script, or `.avu-header--solid` on pages without a film). Navigation splits around the centred logo, as on both reference sites.

```html
<header class="avu-header" id="top-bar">
  <div class="avu-wrap avu-header__inner">
    <nav class="avu-nav" aria-label="Main, left">
      <a href="/wines">Our Wines</a><a href="/producers">Producers</a><a href="/services">Services</a><a href="/club">The Wine Club</a>
    </nav>
    <button class="avu-menu-btn" aria-expanded="false" aria-controls="mobile-nav">Menu</button>
    <a class="avu-wordmark" href="/" aria-label="AVU Luxury Wines, home"><!-- avu-logo-lockup.svg inline --></a>
    <nav class="avu-nav avu-nav--right" aria-label="Main, right">
      <a href="/membership">Membership</a><a href="https://www.youtube.com/@AVUWineStories">Stories</a><a href="/contact">Contact</a>
      <span class="avu-lang"><b>EN</b><span aria-disabled="true">DE</span></span>
    </nav>
    <span class="avu-lang avu-lang--mobile"><b>EN</b><span aria-disabled="true">DE</span></span>
  </div>
</header>
<nav class="avu-mobile-nav" id="mobile-nav" aria-label="Main">…same links, plus Personal Wine Butler, Worldwide delivery, Our story…</nav>
```

### Film (first screen, section, or framed)
Three sizes: `.avu-film` (first screen, 100svh), `.avu-film--section` (88svh, lower on the page), `.avu-film--frame` (a square inside a spread, no caption). The caption sits low and centred; the shade is local to it.

```html
<section class="avu-film" data-film="building" aria-label="The AVU SA Building in Melide">
  <div class="avu-film__stage"></div>
  <div class="avu-film__caption avu-wrap">
    <p class="avu-eyebrow">Melide · Lake Lugano · Switzerland</p>
    <h1 class="avu-display avu-h1">Access to the world's greatest wines</h1>
    <p class="avu-film__line">A Swiss fine wine merchant serving private clients worldwide.</p>
    <a class="avu-link" href="/membership">Request an invitation</a>
  </div>
  <p class="avu-film__place">The AVU SA Building · Melide</p>
  <button class="avu-film__pause" aria-pressed="false" aria-label="Pause film"></button>
</section>
```

```js
window.AVU_FILMS = {
  building: { base: 'assets/photos/', shot: 3, fade: 0.9, shots: [
    { src: 'b-wide.jpg',     from: [0, 0, 1.05, 0],   to: [1, 2, 1.15, 0.1] },  // wide: slow push in
    { src: 'b-pavilion.jpg', from: [-2, 0, 1.1, 0],   to: [2, -2, 1.16, 0] },   // wide/medium: lateral drift
    { src: 'b-roof.jpg',     from: [0, -4, 1.16, 0],  to: [0, 3, 1.1, 0] },     // medium: tilt down
    { src: 'b-front.jpg',    from: [0, 2, 1.08, 0],   to: [0, -2, 1.16, 0] },   // medium: rise
    { src: 'b-corner.jpg',   from: [0, -2, 1.12, -0.2], to: [0, 1, 1.06, 0.2] } // close: gentle roll, loops back to wide
  ] }
};
```

Camera grammar: `[x %, y %, scale, rotate°]`. Scale stays between 1.04 and 1.3; translation within ±7 %; rotation within ±0.3°. Push in on wides, drift sideways on mediums, small pull-backs or rolls on close-ups. Keep a minimum scale of 1.04 so edges never show.

### Statement and facts
One centred sentence, four facts with exact labels, one press link.

```html
<section class="avu-statement-block avu-wrap" aria-labelledby="statement-title">
  <p class="avu-eyebrow">AVU · Since 2016</p>
  <h2 id="statement-title" class="avu-statement">AVU is among the largest buyers of Mouton Rothschild and Cheval Blanc. These long-standing relationships give our private clients access to exceptional wines.</h2>
  <div class="avu-facts">
    <div class="avu-fact"><div class="avu-fact__n">600,000+</div><div class="avu-fact__l">Bottles in stock</div></div>
    <div class="avu-fact"><div class="avu-fact__n">400+</div><div class="avu-fact__l">Producers in our selection</div></div>
    <div class="avu-fact"><div class="avu-fact__n">5</div><div class="avu-fact__l">Warehouses</div></div>
    <div class="avu-fact"><div class="avu-fact__n">85</div><div class="avu-fact__l">Team members</div></div>
  </div>
  <p>Featured in Forbes Italia <a class="avu-link" href="https://forbes.it/2026/10/09/fabio-cattaneo-avu-business-globale-vini-lusso">Read the interview ↗</a></p>
</section>
```

### Section head
```html
<div class="avu-head">
  <p class="avu-eyebrow">Personal service</p>
  <h2 class="avu-display avu-h2">We know your cellar, and we bring it to you</h2>
  <p class="avu-lede">One optional line.</p>
</div>
```

### Spread (picture or framed film beside text)
Use `.avu-spread--flip` to put the picture on the right; alternate down a page to get Patek's zigzag. Proof rows use `.avu-rules.avu-proofs`.

```html
<div class="avu-spread">
  <div class="avu-film avu-film--frame" data-film="shop" aria-label="The Wine Shop and its stock">
    <div class="avu-film__stage"></div>
    <button class="avu-film__pause" aria-pressed="false" aria-label="Pause film"></button>
  </div>
  <div class="avu-spread__text">
    <p class="avu-eyebrow avu-eyebrow--left">Provenance and care</p>
    <h2 class="avu-display avu-h2">Unrivalled stock, ready to ship</h2>
    <p class="avu-lede">The vast majority of our collection is physically owned by AVU and professionally stored in temperature-controlled warehouses.</p>
    <ul class="avu-rules avu-proofs">
      <li><b>Sourced</b><span>Through trusted relationships with leading producers and long-established partners.</span></li>
      <li><b>Stored</b><span>In temperature- and humidity-controlled warehouses, with in-bond options.</span></li>
      <li><b>Checked</b><span>We inspect every bottle personally before it leaves us.</span></li>
    </ul>
    <a class="avu-link" href="/storage">Discover our stock &amp; storage</a>
  </div>
</div>
```
For a still picture instead of a film: `<figure class="avu-spread__media"><img …></figure>` (4:5 crop).

### Bottle cards
4:5 image, producer in caps, wine in light sans, one reason line, the provenance or vintage line in italics, one enquiry link. Three per row; the first may be wider (`.avu-bottles__grid`) or all equal (`--even`).

```html
<figure class="avu-bottle">
  <img src="shop-monfortino.jpg" width="1067" height="1600" alt="Three bottles of Giacomo Conterno Barolo Riserva Monfortino on a backlit shelf" loading="lazy">
  <figcaption>
    <div class="avu-bottle__producer">Giacomo Conterno</div>
    <div class="avu-bottle__wine">Barolo Riserva Monfortino</div>
    <p class="avu-bottle__why">Made only in the finest vintages.</p>
    <p class="avu-bottle__meta">Vintage and format: to be confirmed by AVU</p>
    <a class="avu-link" href="/contact?topic=wine" data-topic="wine">Enquire about this wine</a>
  </figcaption>
</figure>
```

### Specification table (bottle page)
Vacheron's "Watch specifications", for wine. Only rows AVU can vouch for.

```html
<table class="avu-specs">
  <tr><th scope="row">Producer</th><td>Domaine de la Romanée-Conti</td></tr>
  <tr><th scope="row">Appellation</th><td>La Tâche Grand Cru, Vosne-Romanée</td></tr>
  <tr><th scope="row">Vintage</th><td>To be confirmed by AVU</td></tr>
  <tr><th scope="row">Format</th><td>To be confirmed by AVU</td></tr>
  <tr><th scope="row">Provenance</th><td>Sourced directly / from a long-established partner</td></tr>
  <tr><th scope="row">Storage</th><td>Temperature- and humidity-controlled, in bond</td></tr>
  <tr><th scope="row">Condition</th><td>Inspected by AVU before dispatch</td></tr>
</table>
```

### Quote
Patek's President's quote, AVU style. Only approved words, with name and role.

```html
<figure class="avu-quote">
  <blockquote>Approved quotation only.</blockquote>
  <figcaption>Fabio Cattaneo, founder</figcaption>
</figure>
```

### Cards on night (producer proof)
Two cards: filmed producer conversations (placeholder until approved, `.avu-card--pending` plus a visible note) and AVU Wine Stories with an episode list.

```html
<section class="avu-section avu-band--night avu-on-dark">
  <div class="avu-wrap">
    <div class="avu-head">…Relationships that open cellar doors…</div>
    <div class="avu-cards">
      <div class="avu-card avu-card--pending">
        <p class="avu-eyebrow avu-eyebrow--left">Producer conversations</p>
        <h3 class="avu-display avu-h3">In their own words</h3>
        <p>…</p>
        <p class="avu-note">Published only with the estate's written approval.</p>
      </div>
      <div class="avu-card">
        <p class="avu-eyebrow avu-eyebrow--left">AVU Wine Stories</p>
        <h3 class="avu-display avu-h3">The history behind great estates</h3>
        <ul class="avu-episodes">
          <li><a href="https://www.youtube.com/watch?v=Rkzcw_c3QbA"><span>Château Mouton Rothschild: ambition, art and excellence</span><span>Watch ↗</span></a></li>
        </ul>
        <a class="avu-link" href="https://www.youtube.com/@AVUWineStories">All episodes on YouTube ↗</a>
      </div>
    </div>
  </div>
</section>
```

### Constellation
The AVU mark at the centre, selected producers as stars by region, a faint starfield of 420 points (one per producer in the selection). Night ground only. Markup is in the header comment of `assets/constellation.js`; this is the homepage configuration:

```js
window.AVU_SKY = {
  stars: 420,
  nodes: [
    { id: 'mouton', short: 'Mouton Rothschild', name: 'Château Mouton Rothschild', place: 'Pauillac, Bordeaux · Premier Grand Cru Classé since 1973', region: 'bordeaux', x: 180, y: 210, side: 'r', yt: 'Rkzcw_c3QbA' },
    { id: 'latour', short: 'Latour', name: 'Château Latour', place: 'Pauillac, Bordeaux · Premier Grand Cru Classé, 1855', region: 'bordeaux', x: 115, y: 305, side: 'l' },
    { id: 'lynch', short: 'Lynch-Bages', name: 'Château Lynch-Bages', place: 'Pauillac, Bordeaux · Cinquième Grand Cru Classé, 1855', region: 'bordeaux', x: 205, y: 390, side: 'r' },
    { id: 'margaux', short: 'Margaux', name: 'Château Margaux', place: 'Margaux, Bordeaux · Premier Grand Cru Classé, 1855', region: 'bordeaux', x: 300, y: 465, side: 'r' },
    { id: 'cheval', short: 'Cheval Blanc', name: 'Château Cheval Blanc', place: 'Saint-Émilion, Bordeaux', region: 'bordeaux', x: 330, y: 160, side: 'r', yt: 'J9AGlVDvncU' },
    { id: 'lepin', short: 'Le Pin', name: 'Le Pin', place: 'Pomerol, Bordeaux', region: 'bordeaux', x: 375, y: 262, side: 'b', yt: 'JAXg_IO27ew' },
    { id: 'krug', short: 'Krug', name: 'Krug', place: 'Reims, Champagne', region: 'champagne', x: 640, y: 122, side: 'l', yt: 'VLRDnrb-iGs' },
    { id: 'dp', short: 'Dom Pérignon', name: 'Dom Pérignon', place: 'Champagne', region: 'champagne', x: 760, y: 88, side: 'r', yt: 'Lf2dwSadNmc' },
    { id: 'roederer', short: 'Louis Roederer', name: 'Louis Roederer', place: 'Reims, Champagne', region: 'champagne', x: 842, y: 168, side: 'r' },
    { id: 'billecart', short: 'Billecart-Salmon', name: 'Billecart-Salmon', place: 'Mareuil-sur-Aÿ, Champagne', region: 'champagne', x: 722, y: 205, side: 'b' },
    { id: 'masseto', short: 'Masseto', name: 'Masseto', place: 'Bolgheri, Tuscany', region: 'tuscany', x: 688, y: 440, side: 'l', yt: 'V8ORSYccgxg' },
    { id: 'ornellaia', short: 'Ornellaia', name: "Tenuta dell'Ornellaia", place: 'Bolgheri, Tuscany', region: 'tuscany', x: 800, y: 500, side: 'r' }
  ],
  regions: [
    { id: 'bordeaux', label: 'Bordeaux', x: 150, y: 120, hub: 'lepin' },
    { id: 'champagne', label: 'Champagne', x: 860, y: 58, hub: 'billecart' },
    { id: 'tuscany', label: 'Tuscany', x: 870, y: 572, hub: 'masseto' }
  ],
  links: [['latour', 'mouton'], ['mouton', 'cheval'], ['cheval', 'lepin'], ['latour', 'lynch'], ['lynch', 'margaux'], ['mouton', 'lepin'],
    ['krug', 'dp'], ['dp', 'roederer'], ['roederer', 'billecart'], ['billecart', 'krug'], ['masseto', 'ornellaia']]
};
```
To add a region, extend `regions`, give it a hub node, and add a `[data-active="<id>"] .ln[data-region="<id>"]` rule to the CSS. Keep the constellation compact (max 860 px wide) and inside the producers section; it supports the proof, it is not the proof.

### Two services side by side
```html
<div class="avu-duo">
  <div>
    <img src="shop-advisor.jpg" alt="An AVU advisor showing a bottle to a client among the brass racks of The Wine Shop" loading="lazy">
    <p class="avu-eyebrow avu-eyebrow--left">Personal Wine Butler</p>
    <h3 class="avu-display avu-h3">Your dedicated private wine advisor</h3>
    <p>…</p>
    <ul class="avu-rules"><li>Builds and manages your collection</li>…</ul>
  </div>
  <div>
    …Worldwide delivery…
    <div class="avu-case"><b>When the occasion cannot wait</b><p>The Los Angeles case.</p></div>
  </div>
</div>
```

### Tiles (2 × 2, Vacheron's services index)
```html
<div class="avu-tiles">
  <a class="avu-tile" href="/services/butler">
    <img src="shop-advisor.jpg" alt="" loading="lazy">
    <div class="avu-tile__text"><h3 class="avu-display avu-h3">Personal Wine Butler</h3><span class="avu-link">Meet your advisor</span></div>
  </a>
  …Worldwide delivery, Storage, Tastings and trips…
</div>
```

### Membership tiers
```html
<div class="avu-tiers">
  <div class="avu-tier"><h3 class="avu-tier__name">Silver</h3><div class="avu-tier__how">When you join</div><p>…</p></div>
  <div class="avu-tier"><h3 class="avu-tier__name">Gold</h3><div class="avu-tier__how">Over CHF 50,000 a year</div><p>…</p></div>
  <div class="avu-tier"><h3 class="avu-tier__name">Platinum</h3><div class="avu-tier__how">By invitation only</div><p>…</p></div>
</div>
<a class="avu-btn" href="/contact?topic=membership" data-topic="membership">Request an invitation</a>
```

### Portrait and story
```html
<div class="avu-portrait-grid">
  <figure class="avu-portrait"><img src="fabio.jpg" alt="Portrait of Fabio Cattaneo, founder of AVU"><figcaption>Fabio Cattaneo, founder</figcaption></figure>
  <div>
    <p class="avu-eyebrow avu-eyebrow--left">Our story</p>
    <h2 class="avu-display avu-h2">A young house, built on relationships</h2>
    <p class="avu-lede">Forbes Italia facts only.</p>
    <a class="avu-link" href="https://forbes.it/2026/10/09/fabio-cattaneo-avu-business-globale-vini-lusso">Read the Forbes Italia interview ↗</a>
  </div>
</div>
```

### Closing visit card with form
Ends every page. The topic select changes the button text (see `references/avu-facts.md` for the four topics); links elsewhere on the page carry `data-topic` to preselect it.

```html
<div class="avu-visit-card">
  <div>
    <div class="avu-visit__media"><img src="b-side.jpg" alt="The AVU SA Building in Melide, with The Wine Club pavilion in front"><h2 class="avu-display avu-h3">Visit AVU in Melide</h2></div>
    <address class="avu-address"><b>AVU SA Building</b><br>Via Carona 2, 6815 Melide, Switzerland<br>+41 91 252 48 88 · members@avu.wine</address>
  </div>
  <div>
    <p class="avu-eyebrow avu-eyebrow--left">Contact</p>
    <h2 class="avu-display avu-h3">Speak to our team</h2>
    <form class="avu-form">…topic select, name, email, country, preferred language, message, <button class="avu-btn">Send your enquiry</button>…</form>
  </div>
</div>
```

### Footer
Dark, full stacked logo in light gold, address and contacts, three link columns (Discover, Services, Follow), then the UVA line.

```html
<footer class="avu-footer"><div class="avu-wrap">
  <div class="avu-footer__grid">…</div>
  <div class="avu-uva">
    <span class="avu-uva__line">The grape · The producer · The terroir · The vintage · The bottle</span>
    <span>AVU is UVA, the grape, read backwards. © AVU SA · Privacy · Terms</span>
  </div>
</div></footer>
```

## 4. Page templates

Each list is the block order. Pages without a first-screen film use `.avu-header--solid` and start with an intro (eyebrow, H1, lede, centred) as on patek.com's Collection and Values pages.

**Homepage** (agreed order): building film → statement and facts → producers on night (cards + constellation) → stock spread with framed shop film → rare bottle cards → two services on paper → Wine Club film (`--section`) → membership tiers → portrait and story on paper → visit card with form → footer.

**Our Wines**: intro ("Our Wines", one line on the stock) → filter row by region and type (text buttons, no dropdown chrome) → bottle cards grid, `--even`, 3 per row → spread on provenance and storage → visit card.

**A bottle** (Vacheron product page): two-up 4:5 images (bottle, label close-up) beside producer caps label, wine name as H1, one line, "Enquire about this wine" button → spec table → producer spread with the AVU Wine Stories episode if one exists → three more bottle cards from the same producer or region → visit card.

**Producers**: film or wide picture of a cellar visit → statement → the constellation full width on night → region sections, each a zigzag of producer spreads (picture, name, place, one paragraph, episode link) → producer conversations (approved only) → visit card.

**Services**: wide picture with H1 → statement ("At AVU, we believe that exceptional service is measured not by what is easy, but by what is possible.") → 2 × 2 tiles (Personal Wine Butler, Worldwide delivery, Storage, Tastings and trips) → the Los Angeles case as a quote-like block → visit card.

**The Wine Club**: club film → statement on what happens there (private dinners, tastings, producer visits, events) → zigzag of three spreads (dining room, the wine wall, members' lockers) → "Plan your visit" visit card. Keep Membership on its own page.

**Membership**: intro → tiers → one spread on what membership gives (with a photo of a tasting) → "Request an invitation" button → visit card.

**Our story**: banner of the building → portrait and story → the seven values as a zigzag, each with its proof → UVA–AVU sentence → visit card.

## 5. Small rules that keep it AVU

- Eyebrow, then headline, then at most one line, then one action. If the block needs more, it is two blocks.
- Captions for places use the real names: "The AVU SA Building · Melide", "The pavilion, AVU SA Building".
- Alt text describes what is in the picture, with names of wines and places; decorative film frames have `alt=""` because the section carries an `aria-label`.
- Notes for unconfirmed content use `.avu-note` and say exactly what is missing.
- A dark section always gets `.avu-on-dark` so labels, links and buttons switch to the night palette.
