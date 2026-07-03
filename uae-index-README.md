# UAE Index Dashboard

Static-rendered dashboard for UAE-listed equities, served at
[https://naitongzhang.com/uae-index/](https://naitongzhang.com/uae-index/).

## What's inside

| Module | File | Purpose |
|---|---|---|
| Layout | `_layouts/uae-index.html` | Page layout (extends default, includes panels) |
| Panels | `_includes/uae-index/*.html` | Market overview, indices chart, stocks table, custom index builder, about |
| Front-end JS | `assets/js/uae-index/*.js` | Tabs, ECharts, sparklines, filters, custom index math |
| Stylesheet | `assets/css/uae-index/style.scss` | Dashboard styles (loaded as `style.css` after Jekyll build) |
| Data | `_data/uae/*.json` | Pre-rendered data files (regenerated daily) |
| Cron job | `.github/workflows/uae-index-update.yml` | Daily data refresh |
| Python | `scripts/uae-index/*.py` | Yahoo Finance + DFM API fetchers |

## Data sources

- **DFM equities** (52/52 live): Yahoo Finance via `yfinance`. Prices in AED.
- **DFMGI**: DFM's official `https://api2.dfm.ae/mw/v1/indices` (~135 days).
- **UAE ETF** (iShares MSCI UAE, USD): Yahoo Finance as a USD-denominated cross-check benchmark.
- **ADX equities** (52 tickers): metadata only. Yahoo Finance does not carry ADX local tickers.

## How the daily refresh works

1. **Cron** triggers `.github/workflows/uae-index-update.yml` at 12:30 UTC Mon-Fri
   (16:30 Dubai, after market close).
2. Python runs `scripts/uae-index/run_all.py`, which calls `fetch_indices.py` then
   `fetch_stocks.py`, then writes `meta.json`.
3. If any data file changed, the workflow commits and pushes back to `main`.
4. The existing Jekyll deploy workflow (`jekyll-gh-pages.yml`) rebuilds the site.

## Local development

```bash
# Install Python deps
pip install -r scripts/uae-index/requirements.txt

# Run the data pipeline locally
python scripts/uae-index/run_all.py

# (Optional) Run Jekyll locally
bundle install
bundle exec jekyll serve
```

## Limitations

- **ADX index** (FTSE ADX General) is not on Yahoo Finance. UI shows N/A.
- **Custom index builder** only uses DFM stocks (ADX has no price feed here).
- **Data is end-of-day**. No intraday, no Level 2, no order book.
- **No portfolio tracker**. This dashboard is a market/index view; if you want portfolio
  P&L, edit tickers in `_data/uae/tickers.json` to add your holdings (planned future work).

## Why ADX prices are N/A

Yahoo Finance exposes DFM equities under `.AE` (e.g. `EMAAR.AE`) but does not carry
ADX equities (IHC, FAB, TAQA, ALDAR, ADNOC, …) under any accessible ticker. Both DFM and
ADX require paid subscriptions (LSEG/Refinitiv/ICE) for full local data. For a free
build that runs on GitHub Actions without API keys, DFM-only is what we ship. ADX
metadata (sector, name, ISIN-style listing) is preserved so future builds with a paid
source can flip coverage on without restructuring the layout.