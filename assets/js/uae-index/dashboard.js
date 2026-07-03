// UAE Index Dashboard - main entry
// All data is pre-loaded as window.UAE_DATA (set in _layouts/uae-index.html)

(function () {
  'use strict';

  if (!window.UAE_DATA) {
    console.error('UAE_DATA not loaded.');
    return;
  }

  // ---- Tabs ----
  const tabs = document.querySelectorAll('.uae-tab');
  const panels = document.querySelectorAll('.uae-panel');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach((t) => t.classList.toggle('is-active', t === tab));
      panels.forEach((p) => {
        const active = p.dataset.panel === target;
        p.classList.toggle('is-active', active);
        if (active) p.removeAttribute('hidden');
        else p.setAttribute('hidden', '');
      });
      window.dispatchEvent(new Event('resize'));
    });
  });

  // ---- Helpers ----
  window.UAE_formatNumber = function (n, decimals = 2) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    return Number(n).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  window.UAE_formatAED = function (n) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n.toFixed(2);
  };

  window.UAE_formatPct = function (n) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    const sign = n > 0 ? '+' : '';
    return sign + n.toFixed(2) + '%';
  };

  // ---- Load sub-modules ----
  function loadModule(name) {
    const s = document.createElement('script');
    s.src = '/assets/js/uae-index/' + name + '.js';
    s.defer = true;
    document.head.appendChild(s);
  }

  ['charts', 'filters', 'custom-index'].forEach(loadModule);
})();