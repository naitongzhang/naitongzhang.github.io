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

  // ---- Async-load stock history (large file) ----
  // stocks.json is the small snapshot (~50 KB). history.json is ~6 MB and
  // is fetched on demand so the initial page payload stays small.
  function loadHistory() {
    // Always dispatch the event so the UI doesn't hang — even on failure.
    function done(ok) {
      window.UAE_HISTORY_READY = ok;
      window.dispatchEvent(new Event('uae-history-ready'));
    }
    fetch('/assets/data/history.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('history fetch failed: ' + r.status);
        return r.json();
      })
      .then(function (hdata) {
        const histByTicker = hdata && hdata.history ? hdata.history : {};
        if (window.UAE_DATA && window.UAE_DATA.stocks && Array.isArray(window.UAE_DATA.stocks.stocks)) {
          window.UAE_DATA.stocks.stocks.forEach(function (s) {
            if (histByTicker[s.ticker]) s.history = histByTicker[s.ticker];
          });
        }
        done(true);
      })
      .catch(function (e) {
        console.warn('UAE history.json failed to load; showing snapshot only', e);
        done(false);
      });
  }

  // Kick off async history load (don't block initial render).
  loadHistory();

  // ---- Load sub-modules ----
  function loadModule(name) {
    const s = document.createElement('script');
    s.src = '/assets/js/uae-index/' + name + '.js';
    s.defer = true;
    document.head.appendChild(s);
  }

  ['charts', 'filters', 'custom-index'].forEach(loadModule);
})();