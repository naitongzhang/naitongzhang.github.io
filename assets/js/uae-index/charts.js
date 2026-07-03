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
      if (!sel) return 90;
      const v = parseInt(sel.value, 10);
      // 0 = "Maximum" (no windowing); NaN = default to 90 days
      if (Number.isNaN(v)) return 90;
      return v;
    }
    function getRebase() {
      const cb = document.querySelector('[data-idx-rebase]');
      return cb ? cb.checked : true;
    }

    function buildSeriesData(history, days, rebase, commonEndDate, commonStartDate) {
      if (!history || history.length === 0) return null;
      const endTs = commonEndDate
        ? new Date(commonEndDate).getTime()
        : new Date(history[history.length - 1].date).getTime();
      const startTs = commonStartDate
        ? new Date(commonStartDate).getTime()
        : (days > 0 ? endTs - days * 86400000 : new Date(history[0].date).getTime());
      const window = history.filter((d) => {
        const t = new Date(d.date).getTime();
        return t >= startTs && t <= endTs;
      });
      if (window.length === 0) return null;

      const values = window.map((d) => [d.date, d.close]).filter((d) => d[1] !== null && d[1] !== undefined);
      if (values.length === 0) return null;

      const seen = new Set();
      const deduped = [];
      for (const v of values) {
        if (seen.has(v[0])) continue;
        seen.add(v[0]);
        deduped.push(v);
      }
      if (deduped.length === 0) return null;

      if (rebase) {
        // Anchor at the SHARED start date (caller-supplied). All series in
        // the chart use this absolute date as their 100 anchor.
        const anchorEntry = window.find((d) => new Date(d.date).getTime() >= startTs && d.close);
        if (!anchorEntry || !anchorEntry.close) return null;
        const base = anchorEntry.close;
        return deduped.map((d) => [d[0], (d[1] / base) * 100]);
      }
      return deduped;
    }

    function isIntradayIndex(idxId) {
      // DFMGI from DFM official API is intraday (timestamped minute-level updates).
      // Everything else is daily.
      return idxId === 'DFMGI';
    }

    function render() {
      const days = getRangeDays();
      const rebase = getRebase();
      const series = [];
      const colors = { DFMGI_SYNTH: '#d4af37', DFMGI: '#d4af37', UAEETF: '#0a66c2', NAITONG_ETF: '#e11d48', ADXGI: '#7c3aed' };

      const plottables = (window.UAE_DATA.indices.indices || []).filter(
        (idx) => idx.id !== 'DFMGI' && idx.history && idx.history.length > 0
      );
      // Common end = the latest date ALL plottable series share. We pick the
      // earliest "last date" so every series reaches the same window end.
      let commonEnd = null;
      plottables.forEach((idx) => {
        const last = idx.history[idx.history.length - 1].date;
        if (!commonEnd || new Date(last).getTime() < new Date(commonEnd).getTime()) {
          commonEnd = last;
        }
      });
      // Common start anchor (used for rebase): all series are scaled so that
      // their value at commonStart == 100.
      let commonStart = null;
      if (days > 0) {
        commonStart = new Date(new Date(commonEnd).getTime() - days * 86400000).toISOString().slice(0, 10);
      } else {
        // Maximum: pick the latest "first date" so all series actually start at 100 on a date they all share.
        commonStart = null;
        plottables.forEach((idx) => {
          const first = idx.history[0].date;
          if (!commonStart || new Date(first).getTime() > new Date(commonStart).getTime()) {
            commonStart = first;
          }
        });
      }

      plottables.forEach((idx) => {
        const data = buildSeriesData(idx.history, days, rebase, commonEnd, commonStart);
        if (!data) return;
        series.push({
          name: idx.name || idx.id,
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
        legend: { bottom: 0, data: series.map((s) => s.name) },
        grid: { left: 60, right: 30, top: 50, bottom: 50 },
        xAxis: { type: 'time' },
        yAxis: { type: 'value', name: yName, scale: true },
        // Lock zoom to the displayed window so both lines share the same start date.
        dataZoom: [
          { type: 'inside', start: 0, end: 100 },
          { type: 'slider', start: 0, end: 100, height: 20, bottom: 30 },
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