/* Baut eine Seite aus layout.js (wird von editor.html geschrieben).
   Alle Positionen sind in Entwurfs-Einheiten gespeichert und werden hier
   in Prozent umgerechnet – die Seite skaliert dadurch mit der Fensterbreite.
   Hat eine Seite eine eigene mobile Anordnung (p.mobile), werden zwei
   Bühnen gebaut; welche sichtbar ist, entscheidet eine Media-Query in
   canvas.css (stage-desktop / stage-mobile). Ohne eigene mobile Anordnung
   gibt es nur eine Bühne, die wie bisher proportional mitskaliert. */
(function () {
  var L = window.LAYOUT;
  var name = document.body.getAttribute('data-page');
  var p = L && L.pages && L.pages[name];
  if (!p) { document.body.textContent = 'Seite „' + name + '“ nicht in layout.js gefunden.'; return; }

  if (p.title) document.title = p.title;
  document.documentElement.style.background = document.body.style.background = p.background || '#000';

  /* Zusätzliche Schriften nur laden, wenn ein Textfeld sie wirklich nutzt (Barlow lädt die Seite selbst). */
  var FONT_QUERY = {
    'Barlow Condensed': 'Barlow+Condensed:wght@300;400;500;600', 'Courier Prime': 'Courier+Prime:wght@400;700',
    'Cutive Mono': 'Cutive+Mono', 'Permanent Marker': 'Permanent+Marker',
    'Playfair Display': 'Playfair+Display:wght@400;500;600', 'Special Elite': 'Special+Elite'
  };
  var used = {};
  (p.items.concat(p.mobile && p.mobile.items || [])).forEach(function (it) {
    if (it.type === 'text' && it.font && FONT_QUERY[it.font]) used[it.font] = 1;
  });
  var fams = Object.keys(used).map(function (f) { return 'family=' + FONT_QUERY[f]; });
  if (fams.length) {
    var fl = document.createElement('link');
    fl.rel = 'stylesheet';
    fl.href = 'https://fonts.googleapis.com/css2?' + fams.join('&') + '&display=swap';
    document.head.appendChild(fl);
  }

  /* Audio-Player: ein Element pro Player, es spielt immer nur einer gleichzeitig */
  var allAudio = [];
  var PL_HTML = '<div class="pl"><button class="pl-btn" type="button" aria-label="Abspielen"><svg class="i-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg><svg class="i-pause" viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg></button><div class="pl-main"><div class="pl-title"></div><div class="pl-row"><div class="pl-track" role="slider" tabindex="0" aria-label="Position" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="pl-fill"></div><div class="pl-knob"></div></div><div class="pl-time">0:00</div></div></div></div>';
  function fmt(t) { if (!isFinite(t)) return '–:–'; var m = Math.floor(t / 60), s = Math.floor(t % 60); return m + ':' + (s < 10 ? '0' : '') + s; }
  function buildPlayer(it, el, W) {
    el.classList.add('it-player');
    el.style.setProperty('--k', (100 / W * it.h / 64) + 'cqw');
    el.style.setProperty('--ac', it.accent || '#AE0315');
    el.innerHTML = PL_HTML;
    var root = el.firstChild, btn = root.querySelector('.pl-btn'), track = root.querySelector('.pl-track'),
        fill = root.querySelector('.pl-fill'), knob = root.querySelector('.pl-knob'), time = root.querySelector('.pl-time');
    root.querySelector('.pl-title').textContent = it.title || '';
    var a = new Audio(); a.preload = 'metadata'; a.src = it.src; allAudio.push(a);
    function ui() {
      var d = a.duration, r = d > 0 ? a.currentTime / d : 0;
      fill.style.width = knob.style.left = (r * 100) + '%';
      track.setAttribute('aria-valuenow', Math.round(r * 100));
      time.textContent = fmt(a.currentTime) + ' / ' + fmt(d);
    }
    btn.addEventListener('click', function () {
      if (a.paused) {
        allAudio.forEach(function (o) { if (o !== a) o.pause(); });
        var pr = a.play(); if (pr && pr.catch) pr.catch(function () {});
      } else a.pause();
    });
    a.addEventListener('play', function () { root.classList.add('playing'); btn.setAttribute('aria-label', 'Pause'); });
    a.addEventListener('pause', function () { root.classList.remove('playing'); btn.setAttribute('aria-label', 'Abspielen'); });
    a.addEventListener('ended', function () { a.currentTime = 0; ui(); });
    a.addEventListener('timeupdate', ui); a.addEventListener('loadedmetadata', ui); a.addEventListener('durationchange', ui);
    function seek(e) {
      var b = track.getBoundingClientRect(), r = Math.min(1, Math.max(0, (e.clientX - b.left) / b.width));
      if (a.duration > 0) { a.currentTime = r * a.duration; ui(); }
    }
    var dragging = false;
    track.addEventListener('pointerdown', function (e) { dragging = true; track.setPointerCapture(e.pointerId); seek(e); });
    track.addEventListener('pointermove', function (e) { if (dragging) seek(e); });
    track.addEventListener('pointerup', function () { dragging = false; });
    track.addEventListener('pointercancel', function () { dragging = false; });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { a.currentTime = Math.min(a.duration || 0, a.currentTime + 5); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { a.currentTime = Math.max(0, a.currentTime - 5); e.preventDefault(); }
    });
    ui();
  }

  function buildStage(items, W, H, variantClass) {
    function pct(v, total) { return (v / total * 100) + '%'; }
    function cq(v) { return (v / W * 100) + 'cqw'; }

    var stage = document.createElement('main');
    stage.className = variantClass ? 'stage ' + variantClass : 'stage';
    stage.style.aspectRatio = W + ' / ' + H;

    items.forEach(function (it) {
      var el = document.createElement(it.link ? 'a' : 'div');
      el.className = 'it';
      if (it.link) {
        el.href = it.link;
        if (it.newTab) { el.target = '_blank'; el.rel = 'noopener'; }
      }
      var s = el.style;
      s.left = pct(it.x, W);
      s.top = pct(it.y, H);
      s.width = pct(it.w, W);
      if (it.rot) s.transform = 'rotate(' + it.rot + 'deg)';
      if (it.opacity != null && it.opacity < 1) s.opacity = it.opacity;

      if (it.type === 'player') {
        s.height = pct(it.h, H);
        s.color = it.color || '#e2e2d8';
        buildPlayer(it, el, W);
        stage.appendChild(el);
        return;
      }
      if (it.type === 'text') {
        el.classList.add('it-text');
        el.textContent = it.text;
        s.fontSize = cq(it.size);
        s.color = it.color || '#e2e2d8';
        s.fontWeight = it.weight || 400;
        s.textAlign = it.align || 'left';
        if (it.font) s.fontFamily = "'" + it.font + "', sans-serif";
      } else {
        s.height = pct(it.h, H);
        var img = document.createElement('img');
        img.src = it.src;
        img.alt = it.alt || '';
        img.decoding = 'async';
        if (it.y > 1200) img.loading = 'lazy';
        if (it.pos) img.style.objectPosition = it.pos;
        if (it.radius) img.style.borderRadius = cq(it.radius);
        el.appendChild(img);
      }
      stage.appendChild(el);
    });
    return stage;
  }

  var hasMobile = !!(p.mobile && p.mobile.items && p.mobile.items.length);
  if (hasMobile) {
    document.body.appendChild(buildStage(p.items, L.width, p.height, 'stage-desktop'));
    document.body.appendChild(buildStage(p.mobile.items, L.mobileWidth || 480, p.mobile.height, 'stage-mobile'));
  } else {
    document.body.appendChild(buildStage(p.items, L.width, p.height, null));
  }

  var nav = document.createElement('nav');
  nav.className = 'auto-nav';
  var home = document.createElement('a');
  home.href = 'index.html'; home.className = 'auto-nav-home'; home.textContent = 'Pascal Ritter';
  nav.appendChild(home);
  var navLinks = document.createElement('div');
  navLinks.className = 'auto-nav-links';
  Object.keys(L.pages).forEach(function (n) {
    var pg = L.pages[n];
    if (n === name || pg.showInNav === false) return;
    var a = document.createElement('a');
    a.href = n + '.html';
    a.textContent = pg.navLabel || (n.charAt(0).toUpperCase() + n.slice(1));
    navLinks.appendChild(a);
  });
  nav.appendChild(navLinks);
  document.body.appendChild(nav);

  var legal = document.createElement('footer');
  legal.className = 'legal';
  legal.innerHTML = '<a href="impressum.html">Impressum</a><a href="datenschutz.html">Datenschutz</a>';
  document.body.appendChild(legal);
})();
