// UAE - Custom Index Builder
(function () {
  'use strict';

  function init() {
    const tbody = document.querySelector('[data-builder-tbody]');
    if (!tbody) return;

    const stocks = ((window.UAE_DATA.stocks && window.UAE_DATA.stocks.stocks) || [])
      .filter((s) => s.exchange === 'DFM' && s.price !== null && s.history && s.history.length > 5);

    // Default basket comes from tickers.json:default_index (Yahoo-Finance-available DFM stocks).
    // Falls back to all DFM stocks if absent.
    const defaultTickers = ((window.UAE_DATA.tickers && window.UAE_DATA.tickers.default_index && window.UAE_DATA.tickers.default_index.tickers) || [])
      .filter(Boolean);
    const defaultSet = new Set(defaultTickers);
    const defaultWeighting = (window.UAE_DATA.tickers && window.UAE_DATA.tickers.default_index && window.UAE_DATA.tickers.default_index.weighting) || 'market_cap';
    const defaultStartDays = (window.UAE_DATA.tickers && window.UAE_DATA.tickers.default_index && window.UAE_DATA.tickers.default_index.start_period_days) || -90;

    // Apply default weighting + start period to the controls so the UI matches the JSON config.
    if (defaultWeighting && weightingSel) weightingSel.value = defaultWeighting;
    if (typeof defaultStartDays === 'number' && startSel) {
      const match = Array.from(startSel.options).find((o) => parseInt(o.value, 10) === defaultStartDays);
      if (match) startSel.value = String(defaultStartDays);
    }

    const search = document.querySelector('[data-builder-search]');
    const sectorSel = document.querySelector('[data-builder-sector]');
    const topnInput = document.querySelector('[data-builder-topn]');
    const weightingSel = document.querySelector('[data-builder-weighting]');
    const startSel = document.querySelector('[data-builder-start]');
    const addBtn = document.querySelector('[data-builder-addtopn]');
    const clearBtn = document.querySelector('[data-builder-clear]');
    const calcBtn = document.querySelector('[data-builder-calc]');
    const countEl = document.querySelector('[data-builder-selected-count]');
    const statsEl = document.querySelector('[data-builder-stats]');

    // Populate sector dropdown
    const sectors = [...new Set(stocks.map((s) => s.sector).filter(Boolean))].sort();
    sectors.forEach((sec) => {
      const opt = document.createElement('option');
      opt.value = sec;
      opt.textContent = sec;
      sectorSel.appendChild(opt);
    });

    // Local state: which tickers are selected
    const state = {}; // ticker -> {customWeight}

    function filteredList() {
      const q = (search.value || '').toLowerCase().trim();
      const sec = sectorSel.value;
      return stocks.filter((s) => {
        if (sec && s.sector !== sec) return false;
        if (q) {
          const blob = `${s.symbol} ${s.name}`.toLowerCase();
          if (!blob.includes(q)) return false;
        }
        return true;
      });
    }

    function computeWeights(rows) {
      const w = weightingSel.value;
      if (w === 'equal') {
        const each = rows.length ? 1 / rows.length : 0;
        return rows.map(() => each);
      }
      if (w === 'market_cap') {
        const caps = rows.map((r) => r.market_cap || 0);
        const sum = caps.reduce((a, b) => a + b, 0) || 1;
        return caps.map((c) => c / sum);
      }
      if (w === 'inverse_vol') {
        const vols = rows.map((r) => calcVol(r.history));
        const inv = vols.map((v) => (v > 0 ? 1 / v : 0));
        const sum = inv.reduce((a, b) => a + b, 0) || 1;
        return inv.map((x) => x / sum);
      }
      if (w === 'custom') {
        const total = rows.reduce((acc, r) => acc + (state[r.ticker]?.customWeight || 0), 0) || 1;
        return rows.map((r) => (state[r.ticker]?.customWeight || 0) / total);
      }
      return rows.map(() => 1 / Math.max(1, rows.length));
    }

    function calcVol(history) {
      // 30-day realized volatility (annualized) of log returns
      const closes = history.slice(-30).map((d) => d.close).filter((c) => c !== null);
      if (closes.length < 2) return 0.5;
      const logRets = [];
      for (let i = 1; i < closes.length; i++) {
        logRets.push(Math.log(closes[i] / closes[i - 1]));
      }
      const mean = logRets.reduce((a, b) => a + b, 0) / logRets.length;
      const variance = logRets.reduce((a, b) => a + (b - mean) ** 2, 0) / logRets.length;
      return Math.sqrt(variance) * Math.sqrt(252);
    }

    function renderList() {
      const list = filteredList();
      const selected = list.filter((s) => state[s.ticker]);
      const weights = computeWeights(selected);
      const wMap = {};
      selected.forEach((s, i) => (wMap[s.ticker] = weights[i]));

      const html = list.map((s) => {
        const isSel = !!state[s.ticker];
        const w = wMap[s.ticker];
        const wTxt = isSel
          ? (w !== undefined ? (w * 100).toFixed(2) + '%' : '—')
          : '—';
        const customTxt = isSel && weightingSel.value === 'custom'
          ? `<input type="number" min="0" step="0.1" value="${state[s.ticker].customWeight || 1}" data-builder-cw="${s.ticker}" style="width:80px"/>`
          : '—';
        return `
          <tr class="${isSel ? 'is-selected' : ''}">
            <td><input type="checkbox" ${isSel ? 'checked' : ''} data-builder-cb="${s.ticker}"/></td>
            <td><strong>${s.symbol}</strong></td>
            <td>${s.name}</td>
            <td class="num">${window.UAE_formatNumber(s.price)}</td>
            <td class="num">${window.UAE_formatAED(s.market_cap || 0)}</td>
            <td class="num">${wTxt}</td>
            <td class="num">${customTxt}</td>
          </tr>`;
      }).join('');
      tbody.innerHTML = html;
      countEl.textContent = `${selected.length} selected`;
    }

    function autoComputeIndex() {
      const selected = filteredList().filter((s) => state[s.ticker]);
      if (selected.length === 0) {
        statsEl.innerHTML = '<em>Select at least one stock.</em>';
        renderChart([], []);
        return;
      }

      const startOffset = parseInt(startSel.value, 10) || -90;
      const weights = computeWeights(selected);
      // For each selected, find min history length, then align dates
      // Simple approach: take all unique dates, then compute weighted return per date.
      const dateMap = {}; // date -> {totalWeight, weightedCloseSum, count}
      selected.forEach((s, i) => {
        const w = weights[i];
        s.history.forEach((d) => {
          if (d.close === null || d.close === undefined) return;
          if (!dateMap[d.date]) dateMap[d.date] = { w: 0, swx: 0 };
          dateMap[d.date].w += w;
          dateMap[d.date].swx += w * d.close;
        });
      });

      // Build aligned series: use stocks' normalized base
      const allDates = Object.keys(dateMap).sort();
      const startIdx = Math.max(0, allDates.length + startOffset);
      const dates = allDates.slice(startIdx);
      if (dates.length < 2) {
        statsEl.innerHTML = '<em>Not enough overlapping history.</em>';
        renderChart([], []);
        return;
      }

      // Rebase each stock to 100 at startIdx date
      const bases = {};
      selected.forEach((s) => {
        const startDate = dates[0];
        const baseEntry = s.history.find((d) => d.date === startDate);
        if (baseEntry && baseEntry.close) bases[s.ticker] = baseEntry.close;
      });
      const series = dates.map((d) => {
        let sum = 0;
        let totalW = 0;
        selected.forEach((s, i) => {
          const base = bases[s.ticker];
          if (!base) return;
          const entry = s.history.find((h) => h.date === d);
          if (!entry || entry.close === null) return;
          sum += weights[i] * (entry.close / base) * 100;
          totalW += weights[i];
        });
        return totalW > 0 ? [d, sum / totalW] : [d, null];
      }).filter((d) => d[1] !== null);

      // Stats
      const first = series[0][1], last = series[series.length - 1][1];
      const totalRet = ((last / first) - 1) * 100;
      // Annualized vol of daily index returns
      const rets = [];
      for (let i = 1; i < series.length; i++) {
        const r = Math.log(series[i][1] / series[i - 1][1]);
        if (isFinite(r)) rets.push(r);
      }
      const mean = rets.length ? rets.reduce((a, b) => a + b, 0) / rets.length : 0;
      const variance = rets.length ? rets.reduce((a, b) => a + (b - mean) ** 2, 0) / rets.length : 0;
      const annVol = Math.sqrt(variance) * Math.sqrt(252) * 100;
      const daysSpan = (new Date(series[series.length - 1][0]) - new Date(series[0][0])) / (86400000);
      const annRet = daysSpan > 0 ? ((Math.pow(last / first, 365 / daysSpan)) - 1) * 100 : 0;

      statsEl.innerHTML = `
        <strong>Rebased index value:</strong> ${last.toFixed(2)} &nbsp;
        <strong>Total return:</strong> <span class="${totalRet >= 0 ? 'is-up' : 'is-down'}">${totalRet >= 0 ? '+' : ''}${totalRet.toFixed(2)}%</span> &nbsp;
        <strong>Annualized return:</strong> <span class="${annRet >= 0 ? 'is-up' : 'is-down'}">${annRet >= 0 ? '+' : ''}${annRet.toFixed(2)}%</span> &nbsp;
        <strong>Annualized vol:</strong> ${annVol.toFixed(2)}% &nbsp;
        <strong>Stocks:</strong> ${selected.length} &nbsp;
        <strong>Method:</strong> ${weightingSel.value.replace('_', ' ')}
      `;

      renderChart(series, selected.map((s, i) => ({ name: s.symbol, weight: weights[i] })));
    }

    function renderChart(series, weights) {
      const el = document.getElementById('uae-builder-chart');
      if (!el || typeof echarts === 'undefined') return;
      const chart = el.__echart || (el.__echart = echarts.init(el));
      const data = series.map(([d, v]) => [d, v]);

      chart.setOption({
        title: { text: 'Custom Index', left: 'center', textStyle: { fontSize: 16 } },
        tooltip: { trigger: 'axis' },
        grid: { left: 60, right: 30, top: 50, bottom: 50 },
        xAxis: { type: 'time' },
        yAxis: { type: 'value', name: 'Rebased to 100', scale: true },
        dataZoom: [
          { type: 'inside' },
          { type: 'slider', height: 20, bottom: 10 },
        ],
        series: [{
          name: 'Custom',
          type: 'line',
          data,
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 2.5, color: '#0a66c2' },
          areaStyle: { color: 'rgba(10,102,194,0.08)' },
        }],
      }, true);
    }

    // ---- Event wiring ----
    tbody.addEventListener('click', (e) => {
      const cb = e.target.closest('[data-builder-cb]');
      if (!cb) return;
      const t = cb.dataset.builderCb;
      if (cb.checked) {
        state[t] = { customWeight: 1 };
      } else {
        delete state[t];
      }
      renderList();
    });

    tbody.addEventListener('input', (e) => {
      const cw = e.target.closest('[data-builder-cw]');
      if (!cw) return;
      const t = cw.dataset.builderCw;
      if (state[t]) state[t].customWeight = parseFloat(cw.value) || 0;
      renderList();
    });

    addBtn.addEventListener('click', () => {
      const n = Math.max(1, parseInt(topnInput.value, 10) || 10);
      const sorted = [...stocks].sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0));
      sorted.slice(0, n).forEach((s) => {
        if (!state[s.ticker]) state[s.ticker] = { customWeight: 1 };
      });
      renderList();
    });

    clearBtn.addEventListener('click', () => {
      Object.keys(state).forEach((k) => delete state[k]);
      renderList();
    });

    calcBtn.addEventListener('click', autoComputeIndex);

    [search, sectorSel, weightingSel, startSel].forEach((el) => {
      el.addEventListener('change', () => { renderList(); });
      el.addEventListener('input', () => { renderList(); });
    });

    window.addEventListener('resize', () => {
      const el = document.getElementById('uae-builder-chart');
      if (el && el.__echart) el.__echart.resize();
    });

    renderList();
    // Auto-compute once with DEFAULT basket (from tickers.json:default_index).
    // If the JSON default_index is empty or missing, fall back to all DFM stocks.
    setTimeout(() => {
      const targetTickers = defaultSet.size > 0
        ? stocks.filter((s) => defaultSet.has(s.ticker))
        : stocks;
      targetTickers.forEach((s) => {
        if (!state[s.ticker]) state[s.ticker] = { customWeight: 1 };
      });
      renderList();
      autoComputeIndex();
    }, 50);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();