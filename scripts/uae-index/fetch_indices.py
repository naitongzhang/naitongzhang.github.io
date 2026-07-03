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
    # UAE benchmark ETF
    {"id": "UAEETF", "name": "iShares MSCI UAE ETF (USD)", "exchange": "ETF", "yahoo": "UAE"},
]


def fetch_yahoo(yahoo_symbol, fallback_id):
    if not yahoo_symbol:
        return {"id": fallback_id, "history": [], "note": "Not covered by Yahoo Finance."}
    try:
        tk = yf.Ticker(yahoo_symbol)
        hist = tk.history(period="1y", auto_adjust=False)
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
    # id looks like "2026-07-03T11:41:00"
    if not ts:
        return None
    try:
        return ts[:10]
    except Exception:
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

    output = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "indices": indices_out,
    }

    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_JSON.open("w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False, allow_nan=False)

    print(f"\nWrote {OUTPUT_JSON.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    sys.exit(main())