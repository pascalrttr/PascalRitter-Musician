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

      if (it.type === 'text') {
        el.classList.add('it-text');
        el.textContent = it.text;
        s.fontSize = cq(it.size);
        s.color = it.color || '#e2e2d8';
        s.fontWeight = it.weight || 400;
        s.textAlign = it.align || 'left';
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
