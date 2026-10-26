/* AVU constellation: the AVU mark at the centre, selected producers as named stars grouped by region,
   and a faint seeded starfield (one point per producer in the selection). Night grounds only.

   Markup (inside a .avu-on-dark section):
     <div class="avu-sky" id="sky">
       <canvas aria-hidden="true"></canvas>
       <div class="avu-sky__layer">
         <svg viewBox="0 0 1000 620" aria-hidden="true" class="avu-sky__svg"></svg>
         <div class="avu-sky__mark"><!-- assets/avu-logo-mark.svg inline --></div>
       </div>
       <div class="avu-sky__info" aria-live="polite"><strong>Bordeaux, Champagne, Tuscany</strong>Hover over an estate…</div>
     </div>
     <div class="avu-sky-list"></div>   <!-- phones: region groups -->

   Config:
     window.AVU_SKY = {
       stars: 420,
       nodes: [{ id, short, name, place, region, x, y, side: 'r'|'l'|'b', yt }],   // x 0–1000, y 0–620
       regions: [{ id, label, x, y, hub }],
       links: [['latour', 'mouton'], ...]
     };
   The node list used on the homepage is in references/patterns.md. */
(function () {
  var cfg = window.AVU_SKY;
  var sky = document.querySelector('.avu-sky');
  if (!cfg || !sky) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var YT = 'https://www.youtube.com/watch?v=';
  var NS = 'http://www.w3.org/2000/svg';
  var svg = sky.querySelector('.avu-sky__svg');
  var layer = sky.querySelector('.avu-sky__layer');
  var info = sky.querySelector('.avu-sky__info');
  var infoDefault = info.innerHTML;
  var byId = {};
  cfg.nodes.forEach(function (n) { byId[n.id] = n; });

  function line(a, b, region, cls) {
    var l = document.createElementNS(NS, 'line');
    l.setAttribute('x1', a.x); l.setAttribute('y1', a.y); l.setAttribute('x2', b.x); l.setAttribute('y2', b.y);
    l.setAttribute('class', 'ln' + (cls ? ' ' + cls : '')); l.setAttribute('data-region', region);
    svg.appendChild(l);
  }
  var center = { x: 500, y: 310 };
  cfg.regions.forEach(function (r) {
    var hub = byId[r.hub];
    var dx = hub.x - center.x, dy = hub.y - center.y, d = Math.sqrt(dx * dx + dy * dy);
    line({ x: center.x + dx / d * 62, y: center.y + dy / d * 58 }, hub, r.id, 'ln--avu');
    var lab = document.createElement('div');
    lab.className = 'avu-sky__region'; lab.textContent = r.label;
    lab.style.left = r.x / 10 + '%'; lab.style.top = r.y / 6.2 + '%';
    layer.appendChild(lab);
  });
  (cfg.links || []).forEach(function (p) { line(byId[p[0]], byId[p[1]], byId[p[0]].region); });

  var dots = {}, halos = {}, btns = {}, current = null;
  cfg.nodes.forEach(function (n) {
    var h = document.createElementNS(NS, 'circle');
    h.setAttribute('cx', n.x); h.setAttribute('cy', n.y); h.setAttribute('r', 14); h.setAttribute('class', 'halo');
    var c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', n.x); c.setAttribute('cy', n.y); c.setAttribute('r', 3.6); c.setAttribute('class', 'dot');
    svg.appendChild(h); svg.appendChild(c); dots[n.id] = c; halos[n.id] = h;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'avu-sky__star'; b.textContent = n.short; b.setAttribute('data-side', n.side || 'r');
    b.setAttribute('aria-label', n.name + ', ' + n.place);
    b.style.left = n.x / 10 + '%'; b.style.top = n.y / 6.2 + '%';
    ['mouseenter', 'focus', 'click'].forEach(function (ev) { b.addEventListener(ev, function () { show(n); }); });
    layer.appendChild(b); btns[n.id] = b;
  });
  function clear() {
    if (!current) return;
    dots[current].classList.remove('is-on'); halos[current].classList.remove('is-on'); btns[current].classList.remove('is-on');
    current = null;
  }
  function show(n) {
    clear();
    current = n.id;
    dots[n.id].classList.add('is-on'); halos[n.id].classList.add('is-on'); btns[n.id].classList.add('is-on');
    sky.setAttribute('data-active', n.region);
    info.innerHTML = '';
    var s = document.createElement('strong'); s.textContent = n.name; info.appendChild(s);
    info.appendChild(document.createTextNode(n.place));
    if (n.yt) {
      info.appendChild(document.createElement('br'));
      var a = document.createElement('a'); a.className = 'avu-link'; a.href = YT + n.yt; a.target = '_blank'; a.rel = 'noopener';
      a.textContent = 'Watch the story ↗'; info.appendChild(a);
    }
  }
  sky.addEventListener('mouseleave', function () { clear(); sky.removeAttribute('data-active'); info.innerHTML = infoDefault; });

  /* Phones: producers in collapsible region groups */
  var list = document.querySelector('.avu-sky-list');
  if (list) cfg.regions.forEach(function (r, ri) {
    var det = document.createElement('details'); if (ri === 0) det.open = true;
    var sum = document.createElement('summary'); sum.textContent = r.label; det.appendChild(sum);
    var ul = document.createElement('ul');
    cfg.nodes.filter(function (n) { return n.region === r.id; }).forEach(function (n) {
      var li = document.createElement('li');
      var span = document.createElement('span'); span.textContent = n.name; li.appendChild(span);
      if (n.yt) { var a = document.createElement('a'); a.href = YT + n.yt; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Watch ↗'; li.appendChild(a); }
      ul.appendChild(li);
    });
    det.appendChild(ul); list.appendChild(det);
  });

  /* Starfield, seeded so it draws the same every time */
  var canvas = sky.querySelector('canvas'), ctx = canvas.getContext('2d');
  var seed = 20160101;
  function rnd() { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
  var stars = [];
  for (var i = 0; i < (cfg.stars || 420); i++) stars.push({ x: rnd(), y: rnd(), r: 0.4 + rnd() * 1.1, a: 0.15 + rnd() * 0.45, s: 0.4 + rnd() * 1.2, ph: rnd() * 6.28 });
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  var starColor = getComputedStyle(document.documentElement).getPropertyValue('--avu-night-ink').trim() || '#EEE5D7';
  function size() {
    var r = canvas.getBoundingClientRect(); W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = starColor;
    for (var k = 0; k < stars.length; k++) {
      var st = stars[k], tw = reduce ? 1 : 0.75 + 0.25 * Math.sin(t * st.s + st.ph);
      ctx.globalAlpha = st.a * tw;
      ctx.beginPath(); ctx.arc(st.x * W, st.y * H, st.r, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  var raf = 0;
  function loop(now) { draw(now / 1000); raf = requestAnimationFrame(loop); }
  size(); draw(0);
  new ResizeObserver(function () { size(); draw(performance.now() / 1000); }).observe(sky);
  if (!reduce) {
    new IntersectionObserver(function (e) {
      cancelAnimationFrame(raf);
      if (e[0].isIntersecting) raf = requestAnimationFrame(loop);
    }).observe(sky);
    sky.addEventListener('pointermove', function (e) {
      var r = sky.getBoundingClientRect();
      layer.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
      layer.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
    });
  }
})();
