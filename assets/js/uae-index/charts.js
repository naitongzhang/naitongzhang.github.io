// UAE - Charts (indices chart + sparkline helper)
(function () {
  'use strict';

  // ---- Indices chart ----
  function initIndicesChart() {
    const el = document.getElementById('uae-indices-chart');
    if (!el || typeof echarts === 'undefined') return;
    const chart = echarts.init(el, null, { renderer: 'canvas' });

    function getRangeDays() {
      const sel = document.querySelector('[data-idx-range]');
      return sel ? parseInt(sel.value, 10) || 90 : 90;
    }
    function getRebase() {
      const cb = document.querySelector('[data-idx-rebase]');
      return cb ? cb.checked : true;
    }

    function buildSeriesData(history, days, rebase) {
      if (!history || history.length === 0) return null;
      const sliced = history.slice(-Math.min(days, history.length));
      const values = sliced.map((d) => [d.date, d.close]).filter((d) => d[1] !== null);
      if (values.length === 0) return null;
      if (rebase) {
        const base = values[0][1];
        return values.map((d) => [d[0], (d[1] / base) * 100]);
      }
      return values;
    }

    function render() {
      const days = getRangeDays();
      const rebase = getRebase();
      const series = [];
      const colors = { DFMGI: '#d4af37', UAEETF: '#0a66c2', ADXGI: '#7c3aed' };

      (window.UAE_DATA.indices.indices || []).forEach((idx) => {
        const data = buildSeriesData(idx.history, days, rebase);
        if (!data) return;
        series.push({
          name: idx.id,
          type: 'line',
          data,
          smooth: true,
          lineStyle: { width: 2, color: colors[idx.id] || '#666' },
          itemStyle: { color: colors[idx.id] || '#666' },
          showSymbol: false,
          connectNulls: true,
        });
      });

      const yName = rebase ? 'Index (rebased to 100)' : 'Value';
      chart.setOption({
        title: { text: 'UAE Indices', left: 'center', textStyle: { fontSize: 16 } },
        tooltip: { trigger: 'axis' },
        legend: { bottom: 0 },
        grid: { left: 60, right: 30, top: 50, bottom: 50 },
        xAxis: { type: 'time' },
        yAxis: { type: 'value', name: yName, scale: true },
        dataZoom: [
          { type: 'inside' },
          { type: 'slider', height: 20, bottom: 30 },
        ],
        series,
      }, true);
    }

    document.querySelectorAll('[data-idx-range], [data-idx-rebase]').forEach((e) => {
      e.addEventListener('change', render);
    });

    window.addEventListener('resize', () => chart.resize());

    // Defer initial render until layout settles
    setTimeout(render, 50);
  }

  // ---- Sparkline helper (also exposed for filters.js) ----
  window.UAE_sparkline = function (history, opts) {
    const w = (opts && opts.width) || 90;
    const h = (opts && opts.height) || 22;
    const pad = 1;
    const closes = (history || []).slice(-60).map((d) => d.close).filter((c) => c !== null && c !== undefined);
    if (closes.length < 2) return null;
    const min = Math.min.apply(null, closes);
    const max = Math.max.apply(null, closes);
    const range = max - min || 1;
    const points = closes.map((c, i) => {
      const x = pad + (i / (closes.length - 1)) * (w - 2 * pad);
      const y = pad + (1 - (c - min) / range) * (h - 2 * pad);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    const up = closes[closes.length - 1] >= closes[0];
    const color = up ? '#16a34a' : '#dc2626';
    return `<svg class="uae-spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><polyline fill="none" stroke="${color}" stroke-width="1.2" points="${points}"/></svg>`;
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIndicesChart);
  } else {
    initIndicesChart();
  }
})();