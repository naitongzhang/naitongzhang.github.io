// UAE - Stocks table filter / sort / search
(function () {
  'use strict';

  function init() {
    const table = document.querySelector('[data-stocks-table]');
    if (!table) return;
    const tbody = table.querySelector('tbody');
    const search = document.querySelector('[data-stocks-search]');
    const exchangeSel = document.querySelector('[data-stocks-exchange]');
    const sectorSel = document.querySelector('[data-stocks-sector]');
    const sortSel = document.querySelector('[data-stocks-sort]');
    const summary = document.querySelector('[data-stocks-summary]');

    // Wait for async history.json. Fall back to rendering without history if
    // it doesn't arrive within a reasonable window.
    if (!window.UAE_HISTORY_READY && window.UAE_HISTORY_LOADING !== false) {
      if (window.UAE_HISTORY_LOADING === undefined) {
        window.UAE_HISTORY_LOADING = true;
        setTimeout(function () {
          if (window.UAE_HISTORY_READY === undefined) {
            window.UAE_HISTORY_READY = false;
            window.dispatchEvent(new Event('uae-history-ready'));
          }
        }, 8000);
      }
      window.addEventListener('uae-history-ready', init, { once: true });
      return;
    }

    const stocks = (window.UAE_DATA.stocks && window.UAE_DATA.stocks.stocks) || [];

    // Populate sector dropdown
    const sectors = [...new Set(stocks.map((s) => s.sector).filter(Boolean))].sort();
    sectors.forEach((sec) => {
      const opt = document.createElement('option');
      opt.value = sec;
      opt.textContent = sec;
      sectorSel.appendChild(opt);
    });

    function makeSparkline(history) {
      // Compact 60-trading-day mini sparkline as inline SVG.
      if (!history || history.length < 2) return '<span class="uae-spark na">—</span>';
      const closes = history.slice(-60).map((d) => d.close).filter((c) => c !== null);
      if (closes.length < 2) return '<span class="uae-spark na">—</span>';
      const w = 90, h = 22, pad = 1;
      const min = Math.min(...closes), max = Math.max(...closes);
      const range = max - min || 1;
      const points = closes.map((c, i) => {
        const x = pad + (i / (closes.length - 1)) * (w - 2 * pad);
        const y = pad + (1 - (c - min) / range) * (h - 2 * pad);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');
      const up = closes[closes.length - 1] >= closes[0];
      const color = up ? '#16a34a' : '#dc2626';
      return `<svg class="uae-spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><polyline fill="none" stroke="${color}" stroke-width="1.2" points="${points}"/></svg>`;
    }

    function fmtCap(n) {
      if (n === null || n === undefined) return '—';
      return window.UAE_formatAED(n) + ' AED';
    }
    function fmtVol(n) {
      if (n === null || n === undefined) return '—';
      return window.UAE_formatAED(n);
    }

    function render() {
      const q = (search.value || '').toLowerCase().trim();
      const ex = exchangeSel.value;
      const sec = sectorSel.value;
      const sortKey = sortSel.value;

      let rows = stocks.filter((s) => {
        if (ex !== 'all' && s.exchange !== ex) return false;
        if (sec && s.sector !== sec) return false;
        if (q) {
          const blob = `${s.ticker} ${s.symbol} ${s.name}`.toLowerCase();
          if (!blob.includes(q)) return false;
        }
        return true;
      });

      rows.sort((a, b) => {
        switch (sortKey) {
          case 'market_cap_desc': return (b.market_cap || 0) - (a.market_cap || 0);
          case 'market_cap_asc':  return (a.market_cap || 0) - (b.market_cap || 0);
          case 'change_pct_desc': return (b.change_pct || -1e9) - (a.change_pct || -1e9);
          case 'change_pct_asc':  return (a.change_pct || 1e9) - (b.change_pct || 1e9);
          case 'symbol_asc':      return (a.symbol || '').localeCompare(b.symbol || '');
          case 'name_asc':        return (a.name || '').localeCompare(b.name || '');
          default: return 0;
        }
      });

      const html = rows.map((s) => {
        const priceCell = s.price === null || s.price === undefined
          ? `<span class="uae-na">N/A</span>`
          : window.UAE_formatNumber(s.price);
        const chgCell = s.change_pct === null || s.change_pct === undefined
          ? '—'
          : `<span class="${s.change_pct >= 0 ? 'is-up' : 'is-down'}">${window.UAE_formatPct(s.change_pct)}</span>`;
        const absChg = s.change === null || s.change === undefined
          ? '—'
          : `<span class="${s.change >= 0 ? 'is-up' : 'is-down'}">${s.change >= 0 ? '+' : ''}${window.UAE_formatNumber(s.change)}</span>`;
        const pe = s.pe_trailing === null || s.pe_trailing === undefined ? '—' : window.UAE_formatNumber(s.pe_trailing);
        const dy = s.dividend_yield === null || s.dividend_yield === undefined
          ? '—'
          : (s.dividend_yield < 1 ? (s.dividend_yield * 100).toFixed(2) + '%' : s.dividend_yield.toFixed(2) + '%');
        return `
          <tr>
            <td><strong>${s.symbol || s.ticker}</strong></td>
            <td>${s.name || ''}</td>
            <td><span class="uae-badge uae-badge-${s.exchange.toLowerCase()}">${s.exchange}</span></td>
            <td>${s.sector || '—'}</td>
            <td class="num">${priceCell}</td>
            <td class="num">${absChg}</td>
            <td class="num">${chgCell}</td>
            <td class="num">${fmtVol(s.volume)}</td>
            <td class="num">${fmtCap(s.market_cap)}</td>
            <td class="num">${pe}</td>
            <td class="num">${dy}</td>
            <td>${makeSparkline(s.history)}</td>
          </tr>`;
      }).join('');

      tbody.innerHTML = html || '<tr><td colspan="12" class="uae-empty">No stocks match the filters.</td></tr>';
      summary.textContent = `${rows.length} of ${stocks.length} shown`;
    }

    [search, exchangeSel, sectorSel, sortSel].forEach((el) => {
      el.addEventListener('input', render);
      el.addEventListener('change', render);
    });

    render();

    // Re-render after the async history.json finishes loading so sparklines
    // get populated without blocking the initial table render.
    if (window.UAE_HISTORY_READY) {
      // Already loaded — render once more in case anything is stale.
      render();
    } else {
      window.addEventListener('uae-history-ready', render, { once: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();