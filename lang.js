(function() {
  var lang = localStorage.getItem('lang') || 'de';
  applyLang(lang);

  function applyLang(l) {
    document.querySelectorAll('[data-de]').forEach(function(el) {
      el.textContent = l === 'en' ? el.dataset.en : el.dataset.de;
    });
    document.querySelectorAll('.lang-toggle').forEach(function(btn) {
      btn.textContent = l === 'en' ? 'DE' : 'EN';
    });
    document.documentElement.lang = l;
  }

  window.toggleLang = function() {
    var current = localStorage.getItem('lang') || 'de';
    var next = current === 'de' ? 'en' : 'de';
    localStorage.setItem('lang', next);
    applyLang(next);
  };
})();
