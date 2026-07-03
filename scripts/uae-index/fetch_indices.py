#!/usr/bin/env python3
"""
Fetch DFMGI index history from Yahoo Finance + DFM official /api2 endpoint.

Outputs: _data/uae/indices.json
Schema:
  {
    "generated_at": "ISO8601",
    "indices": [
      {
        "id": "DFMGI",
        "name": "DFM General Index",
        "exchange": "DFM",
        "currency": "AED",
        "history": [{"date": "YYYY-MM-DD", "close": X, "change": X, "change_pct": X, "volume": N}, ...]
      },
      ...
    ]
  }
"""
import json
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

import yfinance as yf


REPO_ROOT = Path(__file__).resolve().parents[2]
OUTPUT_JSON = REPO_ROOT / "_data" / "uae" / "indices.json"


# Yahoo Finance ticker symbols for UAE official indices.
# Note: not all are covered (some return empty / 404), we try a list and keep what works.
INDICES = [
    # DFM
    {"id": "DFMGI",  "name": "DFM General Index",       "exchange": "DFM", "yahoo": "^DFMGI"},
    {"id": "DFMRI",  "name": "DFM Real Estate Index",   "exchange": "DFM", "yahoo": None},   # not covered
    {"id": "DFMBI",  "name": "DFM Banks Index",         "exchange": "DFM", "yahoo": None},
    # ADX
    {"id": "ADXGI",  "name": "FTSE ADX General Index",  "exchange": "ADX", "yahoo": "^ADI"},
    {"id": "ADXSM",  "name": "ADX Sharjah Index",       "exchange": "ADX", "yahoo": None},
    # USD-denominated UAE benchmark
    {"id": "UAEETF", "name": "iShares MSCI UAE ETF (USD)", "exchange": "ETF", "yahoo": "UAE"},
]


def fetch_yahoo(yahoo_symbol, fallback_id):
    if not yahoo_symbol:
        return {"id": fallback_id, "history": [], "note": "Not covered by Yahoo Finance."}
    try:
        tk = yf.Ticker(yahoo_symbol)
        hist = tk.history(period="max", auto_adjust=False)
        if hist is None or len(hist) == 0:
            return {"id": fallback_id, "yahoo_symbol": yahoo_symbol, "history": [], "note": "Yahoo returned no data."}

        history = []
        prev_close = None
        for idx, row in hist.iterrows():
            close = float(row["Close"]) if not _is_nan(row.get("Close")) else None
            vol = int(row["Volume"]) if not _is_nan(row.get("Volume")) else None
            change = None
            change_pct = None
            if close is not None and prev_close not in (None, 0):
                change = close - prev_close
                change_pct = change / prev_close * 100.0
            history.append({
                "date": idx.strftime("%Y-%m-%d"),
                "close": close,
                "change": None if change is None else round(change, 4),
                "change_pct": None if change_pct is None else round(change_pct, 2),
                "volume": vol,
            })
            prev_close = close if close is not None else prev_close

        return {"id": fallback_id, "yahoo_symbol": yahoo_symbol, "history": history}
    except Exception as e:
        return {"id": fallback_id, "yahoo_symbol": yahoo_symbol, "history": [], "error": str(e)[:160]}


def fetch_dfm_official():
    """Augment with DFM's official /indices endpoint (last ~100 trading days, daily)."""
    try:
        url = "https://api2.dfm.ae/mw/v1/indices"
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json",
            "Origin": "https://marketwatch.dfm.ae",
            "Referer": "https://marketwatch.dfm.ae/",
        })
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        # data is list of {id, change, changepercentage, value, volume}
        history = []
        for row in data:
            history.append({
                "date": _dfm_ts_to_date(row.get("id")),
                "close": row.get("value"),
                "change": row.get("change"),
                "change_pct": row.get("changepercentage"),
                "volume": row.get("volume"),
            })
        return history
    except Exception as e:
        print(f"DFM official fetch failed: {e}")
        return []


def _dfm_ts_to_date(ts):
    """DFM id looks like '2026-07-03T13:41:00'. Keep the full ISO timestamp so
    the front-end can render intraday granularity; truncate to date only when
    callers explicitly need a daily key."""
    if not ts:
        return None
    return ts


def _is_nan(v):
    try:
        return v != v
    except Exception:
        return False


def main():
    print("Fetching UAE indices...")
    indices_out = []

    # DFMGI: prefer DFM official (more reliable) → fallback to Yahoo
    dfm_hist = fetch_dfm_official()
    dfmgi_entry = {
        "id": "DFMGI",
        "name": "DFM General Index",
        "exchange": "DFM",
        "currency": "AED",
        "source": "DFM official /api2.dfm.ae/mw/v1/indices" if dfm_hist else "Yahoo Finance",
        "history": dfm_hist,
    }
    if not dfm_hist:
        # Fallback to Yahoo
        yh = fetch_yahoo("^DFMGI", "DFMGI")
        dfmgi_entry["source"] = "Yahoo Finance"
        dfmgi_entry["history"] = yh["history"]
        dfmgi_entry["yahoo_symbol"] = yh.get("yahoo_symbol")
    indices_out.append(dfmgi_entry)
    print(f"  DFMGI: {len(dfmgi_entry['history'])} rows")

    # ADXGI: Yahoo only
    adxgi = fetch_yahoo("^ADI", "ADXGI")
    indices_out.append({
        "id": "ADXGI",
        "name": "FTSE ADX General Index",
        "exchange": "ADX",
        "currency": "AED",
        "source": "Yahoo Finance" if adxgi.get("yahoo_symbol") else "N/A",
        "history": adxgi["history"],
        "note": adxgi.get("note") or adxgi.get("error"),
    })
    print(f"  ADXGI: {len(adxgi['history'])} rows")

    # UAE ETF (USD benchmark)
    uae = fetch_yahoo("UAE", "UAEETF")
    indices_out.append({
        "id": "UAEETF",
        "name": "iShares MSCI UAE ETF",
        "exchange": "ETF",
        "currency": "USD",
        "source": "Yahoo Finance",
        "history": uae["history"],
    })
    print(f"  UAEETF: {len(uae['history'])} rows")

    # Other DFM sub-indices (placeholder, will be empty until DFM exposes more)
    for sub in [
        {"id": "DFMRI", "name": "DFM Real Estate Index"},
        {"id": "DFMBI", "name": "DFM Banks Index"},
        {"id": "DFMSI", "name": "DFM Services Index"},
    ]:
        indices_out.append({
            "id": sub["id"],
            "name": sub["name"],
            "exchange": "DFM",
            "currency": "AED",
            "source": "N/A",
            "history": [],
            "note": "Sub-indices not exposed via DFM official API. Manual entry only.",
        })

    # ---- Synthetic DFMGI proxy from DFM stock history ----
    # Read stocks.json if available; build a daily market-cap-weighted index.
    stocks_json = REPO_ROOT / "_data" / "uae" / "stocks.json"
    history_json = REPO_ROOT / "assets" / "data" / "history.json"
    if stocks_json.exists() and history_json.exists():
        try:
            with stocks_json.open("r", encoding="utf-8") as f:
                sdata = json.load(f)
            with history_json.open("r", encoding="utf-8") as f:
                hdata = json.load(f)
            synth = build_synthetic_dfmgi(sdata.get("stocks", []), hdata.get("history", {}))
            if synth:
                indices_out.append({
                    "id": "DFMGI_SYNTH",
                    "name": "DFM General Index (synthetic, market-cap weighted)",
                    "exchange": "DFM",
                    "currency": "AED",
                    "source": "Synthetic: daily total market cap of 52 DFM stocks (rebased to 100)",
                    "history": synth,
                    "note": "Proxy for official DFMGI. Daily market-cap-weighted index computed from the 52 DFM stocks' daily close prices and current market caps.",
                })
                print(f"  DFMGI_SYNTH: {len(synth)} rows (replaces single-point DFMGI for daily history)")
                # Replace the official intraday DFMGI row in place with a note, since the
                # synthetic daily series supersedes it for chart purposes.
                dfmgi_idx = next((i for i, x in enumerate(indices_out) if x["id"] == "DFMGI"), None)
                if dfmgi_idx is not None:
                    # Keep the intraday feed as `intraday` for the live stats card,
                    # but make sure the `history` array doesn't dominate the chart.
                    intraday = indices_out[dfmgi_idx].get("history", [])
                    indices_out[dfmgi_idx]["history"] = []
                    indices_out[dfmgi_idx]["intraday"] = intraday
                    indices_out[dfmgi_idx]["note"] = "Official DFMGI intraday series stored under .intraday. Use DFMGI_SYNTH for daily chart."
        except Exception as e:
            print(f"Synthetic DFMGI build failed: {e}")

    output = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "indices": indices_out,
    }

    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_JSON.open("w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False, allow_nan=False)

    print(f"\nWrote {OUTPUT_JSON.relative_to(REPO_ROOT)}")


def build_synthetic_dfmgi(stocks, history_index):
    """Build a daily market-cap-weighted DFMGI proxy from DFM stock history.

    history_index: {ticker: [{date, close, volume}, ...]} — same dict that
    fetch_stocks.py writes to history.json. Stocks pass without an entry in
    this dict are skipped (e.g. ADX-only stocks).

    Method: index_t = sum(w_s * close_s_t / close_s_base) * 100
    where w_s = market_cap_s / sum(market_cap_s) is the constant weight
    (current market cap).

    Safeguards against yfinance backfilled weekend/holiday data:
    - For each date, require at least MIN_COVERAGE_FRACTION of valid stocks
      to have a close; otherwise the date is treated as a non-trading day
      and skipped.
    - Forward-fill missing stock closes with the previous trading day's value
      so a single missing stock doesn't drop out of the index.

    Base date = earliest date where >= MIN_COVERAGE_FRACTION of stocks have data.
    """
    MIN_COVERAGE_FRACTION = 0.85  # need >= 85% of valid stocks to call it a trading day

    valid = [s for s in stocks if s.get("exchange") == "DFM"
             and s.get("price") is not None
             and s.get("market_cap")
             and history_index.get(s["ticker"])]
    if len(valid) < 5:
        return []

    # Build date -> {ticker: close} map
    date_to_closes = {}
    for s in valid:
        for h in history_index[s["ticker"]]:
            if h.get("close") is not None:
                date_to_closes.setdefault(h["date"], {})[s["ticker"]] = h["close"]

    min_required = int(len(valid) * MIN_COVERAGE_FRACTION)

    # Find earliest date where enough stocks have a close
    base_date = None
    for d in sorted(date_to_closes.keys()):
        if len(date_to_closes[d]) >= min_required:
            base_date = d
            break
    if not base_date:
        return []

    # Compute weights from current market cap (constant over the period)
    total_cap = sum(s["market_cap"] for s in valid)
    if total_cap <= 0:
        return []
    weights = {s["ticker"]: s["market_cap"] / total_cap for s in valid}

    base_closes = date_to_closes[base_date]

    # Walk dates in order. Forward-fill each stock's price between its actual
    # trading days so the index stays continuous.
    last_known = dict(base_closes)  # seed with base-date closes
    history = []
    for d in sorted(date_to_closes.keys()):
        if d < base_date:
            continue
        closes = date_to_closes[d]
        # Require minimum coverage
        if len(closes) < min_required:
            continue
        # Forward-fill any missing ticker from previous trading day
        for ticker in weights:
            if ticker in closes:
                last_known[ticker] = closes[ticker]
            else:
                closes[ticker] = last_known.get(ticker)
        # Compute weighted ratio
        idx_val = 0.0
        for ticker, w in weights.items():
            cur = closes.get(ticker)
            base = base_closes.get(ticker)
            if cur is not None and base:
                idx_val += w * (cur / base) * 100.0
        if idx_val > 0:
            history.append({"date": d, "close": round(idx_val, 4)})

    return history


if __name__ == "__main__":
    sys.exit(main())