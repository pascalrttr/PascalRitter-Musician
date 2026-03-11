(function() {
  const lang = localStorage.getItem('lang') || 'de';
  if (lang === 'en') applyLang('en');

  function applyLang(l) {
    document.querySelectorAll('[data-de]').forEach(el => {
      el.textContent = l === 'en' ? el.dataset.en : el.dataset.de;
    });
    document.querySelectorAll('.lang-toggle').forEach(btn => {
      btn.textContent = l === 'en' ? 'DE' : 'EN';
    });
    document.documentElement.lang = l;
  }

  window.toggleLang = function() {
    const current = localStorage.getItem('lang') || 'de';
    const next = current === 'de' ? 'en' : 'de';
    localStorage.setItem('lang', next);
    applyLang(next);
  };
})();
