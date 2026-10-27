/* AVU film engine: drone- and dolly-style camera moves with cross-fades over still photos.
   Paced like patek.com's homepage films (14–20 s, shots of about 3 s).

   Markup:
     <section class="avu-film" data-film="building" aria-label="The AVU SA Building in Melide">
       <div class="avu-film__stage"></div>
       ...caption...
       <button class="avu-film__pause" aria-pressed="false" aria-label="Pause film"></button>
     </section>
   Optional: put the pause button in <div class="avu-film__controls"> next to <div class="avu-film__progress"
   aria-hidden="true"></div>, and the engine draws one thin line per shot that fills as the shot plays.

   Config (before this script runs):
     window.AVU_FILMS = {
       building: { base: 'assets/photos/', shot: 3, fade: 0.9, shots: [
         { src: 'b-wide.jpg',  from: [0, 0, 1.05, 0], to: [1, 2, 1.15, 0.1] },   // [x %, y %, scale, rotate deg]
         { src: 'cradle.jpg', pos: '60% 40%',                // focal point: crop and zoom centre
           from: [0, 0, 1.14, 0], to: [0, 0, 1.03, 0],
           mobile: { src: 'cradle-tall.jpg', pos: '50% 45%', from: [0, 0, 1.12, 0], to: [0, 0, 1.03, 0] } },
         // below 700 px `mobile` may replace src, pos, from and to; a string replaces src only
         ...
       ] }
     };

   Behaviour: plays only while on screen, has a pause button, and shows the first frame still
   under prefers-reduced-motion (the pause button is then hidden). The first film on the page
   loads its first photo eagerly; everything else is lazy. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function lerp(a, b, t) { return a + (b - a) * t; }
  /* Mostly linear with a soft start and end, so the camera never stops dead between shots */
  function ease(t) { return t * 0.7 + (0.5 - 0.5 * Math.cos(Math.PI * t)) * 0.3; }
  function smooth(t) { return t * t * (3 - 2 * t); }

  function initFilm(el, cfg, isFirst) {
    var shots = cfg.shots, SHOT = cfg.shot || 3, FADE = cfg.fade || 0.9, base = cfg.base || '';
    var narrow = window.matchMedia('(max-width: 700px)').matches;
    var stage = el.querySelector('.avu-film__stage');
    var pauseBtn = el.querySelector('.avu-film__pause');
    /* Below 700 px a shot's `mobile` settings replace its photo, focal point and camera move */
    shots = shots.map(function (s) {
      var m = !narrow || !s.mobile ? {} : typeof s.mobile === 'string' ? { src: s.mobile } : s.mobile;
      return { src: m.src || s.src, pos: m.pos || s.mpos || s.pos, from: m.from || s.from, to: m.to || s.to };
    });
    var imgs = shots.map(function (s, i) {
      var im = document.createElement('img');
      var pos = s.pos;
      im.src = base + s.src; im.alt = ''; im.decoding = 'async';
      if (pos) { im.style.objectPosition = pos; im.style.transformOrigin = pos; }
      if (!isFirst || i > 0) im.loading = 'lazy';
      stage.appendChild(im);
      return im;
    });
    /* Optional progress: one thin line per shot */
    var progress = el.querySelector('.avu-film__progress'), bars = [];
    if (progress) shots.forEach(function () {
      var seg = document.createElement('i'), fill = document.createElement('b');
      seg.appendChild(fill); progress.appendChild(seg); bars.push(fill);
    });
    var total = SHOT * shots.length, elapsed = 0, last = null, playing = !reduce, visible = false, raf = 0;

    function render(t) {
      shots.forEach(function (s, i) {
        var local = ((t - (i * SHOT - FADE)) % total + total) % total;
        var im = imgs[i];
        if (local < SHOT + FADE) {
          var p = ease(local / (SHOT + FADE)), a = s.from, b = s.to;
          im.style.transform = 'translate3d(' + lerp(a[0], b[0], p).toFixed(3) + '%,' + lerp(a[1], b[1], p).toFixed(3) + '%,0) scale(' + lerp(a[2], b[2], p).toFixed(4) + ') rotate(' + lerp(a[3], b[3], p).toFixed(3) + 'deg)';
          im.style.opacity = local < FADE ? smooth(local / FADE).toFixed(3) : '1';
          im.style.zIndex = local < FADE ? '2' : '1';
        } else {
          im.style.opacity = '0';
        }
      });
      if (bars.length) {
        var tt = (t % total + total) % total, active = Math.min(shots.length - 1, Math.floor(tt / SHOT)), p = (tt - active * SHOT) / SHOT;
        bars.forEach(function (b, k) { b.style.transform = 'scaleX(' + (k < active ? 1 : k === active ? p.toFixed(3) : 0) + ')'; });
      }
    }
    function frame(now) {
      if (last !== null) elapsed += Math.min(0.1, (now - last) / 1000);
      last = now;
      render(elapsed % total);
      raf = requestAnimationFrame(frame);
    }
    function sync() {
      cancelAnimationFrame(raf); last = null;
      if (playing && visible) raf = requestAnimationFrame(frame);
    }

    render(FADE);
    if (reduce) { if (pauseBtn) pauseBtn.hidden = true; return; }
    new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; sync(); }, { threshold: 0.05 }).observe(el);
    if (pauseBtn) pauseBtn.addEventListener('click', function () {
      playing = !playing;
      pauseBtn.setAttribute('aria-pressed', String(!playing));
      pauseBtn.setAttribute('aria-label', playing ? 'Pause film' : 'Play film');
      sync();
    });
  }

  function init(root) {
    var films = window.AVU_FILMS || {};
    var els = (root || document).querySelectorAll('[data-film]');
    Array.prototype.forEach.call(els, function (el, i) {
      var cfg = films[el.getAttribute('data-film')];
      if (cfg && !el.hasAttribute('data-film-ready')) {
        el.setAttribute('data-film-ready', '');
        initFilm(el, cfg, i === 0);
      }
    });
  }

  window.AVUFilm = { init: init };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(); });
  else init();
})();
