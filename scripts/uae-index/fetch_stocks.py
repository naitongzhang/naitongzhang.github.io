#!/usr/bin/env python3
"""
Fetch DFM stock snapshot data from Yahoo Finance.

Outputs: _data/uae/stocks.json
Schema:
  {
    "generated_at": "ISO8601 timestamp",
    "source": "Yahoo Finance via yfinance",
    "exchange": "DFM",
    "count": N,
    "stocks": [
      {
        "ticker": "EMAAR.AE",
        "symbol": "EMAAR",
        "name": "...",
        "exchange": "DFM",
        "currency": "AED",
        "sector": "...",
        "subsector": "...",
        "price": 12.06,
        "previous_close": ...,
        "change": ...,
        "change_pct": ...,
        "volume": ...,
        "market_cap": ...,
        "day_high": ...,
        "day_low": ...,
        "year_high": ...,
        "year_low": ...,
        "history": [{"date": "YYYY-MM-DD", "close": X}, ...]   # 90 trading days
      },
      ...
    ],
    "missing": ["TICKER.AE", ...]   # DFM tickers not found on Yahoo
  }
"""
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import yfinance as yf


REPO_ROOT = Path(__file__).resolve().parents[2]
TICKERS_JSON = REPO_ROOT / "_data" / "uae" / "tickers.json"
OUTPUT_JSON = REPO_ROOT / "_data" / "uae" / "stocks.json"


def load_tickers():
    with TICKERS_JSON.open("r", encoding="utf-8") as f:
        data = json.load(f)
    return data["dfm"], data["adx"]


def fetch_one(ticker_meta, period="10y"):
    """Fetch one ticker: info + up to ~10y of price history. Returns (record, ok)."""
    ticker = ticker_meta["ticker"]
    try:
        tk = yf.Ticker(ticker)
        info = tk.info or {}

        # History: up to 10 years of daily OHLCV. yfinance clamps to actual availability per stock.
        hist = tk.history(period=period, auto_adjust=False)
        history = []
        if hist is not None and len(hist) > 0:
            for idx, row in hist.iterrows():
                history.append({
                    "date": idx.strftime("%Y-%m-%d"),
                    "close": None if _is_nan(row.get("Close")) else float(row["Close"]),
                    "volume": int(row["Volume"]) if not _is_nan(row.get("Volume")) else None,
                })

        price = info.get("currentPrice") or info.get("regularMarketPrice") or info.get("previousClose")
        prev_close = info.get("previousClose") or info.get("regularMarketPreviousClose")
        change = None
        change_pct = None
        if price is not None and prev_close not in (None, 0):
            change = float(price) - float(prev_close)
            change_pct = change / float(prev_close) * 100.0

        record = {
            "ticker": ticker,
            "symbol": ticker_meta.get("symbol", ticker.replace(".AE", "")),
            "name": info.get("longName") or info.get("shortName") or ticker_meta.get("name"),
            "exchange": info.get("exchange", "DFM"),
            "currency": info.get("currency", "AED"),
            "sector": info.get("sector") or ticker_meta.get("sector"),
            "subsector": info.get("industry") or ticker_meta.get("subsector"),
            "price": None if price is None else float(price),
            "previous_close": None if prev_close is None else float(prev_close),
            "change": None if change is None else round(change, 4),
            "change_pct": None if change_pct is None else round(change_pct, 2),
            "volume": info.get("volume") or info.get("regularMarketVolume"),
            "market_cap": info.get("marketCap"),
            "day_high": info.get("dayHigh") or info.get("regularMarketDayHigh"),
            "day_low": info.get("dayLow") or info.get("regularMarketDayLow"),
            "year_high": info.get("fiftyTwoWeekHigh"),
            "year_low": info.get("fiftyTwoWeekLow"),
            "pe_trailing": info.get("trailingPE"),
            "pe_forward": info.get("forwardPE"),
            "pb": info.get("priceToBook"),
            "dividend_yield": info.get("dividendYield"),
            "history": history,
        }
        return record, True
    except Exception as e:
        return {
            "ticker": ticker,
            "symbol": ticker_meta.get("symbol", ticker.replace(".AE", "")),
            "name": ticker_meta.get("name"),
            "exchange": "DFM",
            "sector": ticker_meta.get("sector"),
            "subsector": ticker_meta.get("subsector"),
            "error": str(e)[:160],
        }, False


def _is_nan(v):
    try:
        return v != v  # NaN check
    except Exception:
        return False


def main():
    dfm_tickers, adx_tickers = load_tickers()
    print(f"DFM tickers: {len(dfm_tickers)}, ADX tickers: {len(adx_tickers)}")

    records = []
    missing = []
    ok_count = 0
    for i, meta in enumerate(dfm_tickers, 1):
        rec, ok = fetch_one(meta)
        if ok and rec.get("price") is not None:
            records.append(rec)
            ok_count += 1
            print(f"  [{i}/{len(dfm_tickers)}] OK {rec['ticker']}: {rec['price']}")
        else:
            missing.append(meta["ticker"])
            records.append(rec)
            print(f"  [{i}/{len(dfm_tickers)}] MISS {rec['ticker']}")
        # Light throttle to be polite to Yahoo
        if i % 10 == 0:
            time.sleep(1.0)

    # ADX rows: include metadata but mark price as None
    for meta in adx_tickers:
        records.append({
            "ticker": meta["ticker"],
            "symbol": meta.get("symbol"),
            "name": meta.get("name"),
            "exchange": "ADX",
            "currency": "AED",
            "sector": meta.get("sector"),
            "subsector": meta.get("subsector"),
            "price": None,
            "note": "ADX equities not covered by Yahoo Finance. Live data unavailable in this build.",
        })

    output = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "Yahoo Finance via yfinance (DFM only; ADX metadata-only)",
        "coverage": {
            "dfm_total": len(dfm_tickers),
            "dfm_ok": ok_count,
            "adx_total": len(adx_tickers),
        },
        "count": len(records),
        "stocks": records,
        "missing_dfm": missing,
    }

    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_JSON.open("w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False, allow_nan=False)

    print(f"\nWrote {OUTPUT_JSON.relative_to(REPO_ROOT)}")
    print(f"  DFM ok: {ok_count}/{len(dfm_tickers)}")
    print(f"  ADX (metadata only): {len(adx_tickers)}")
    print(f"  Missing DFM tickers: {missing}")


if __name__ == "__main__":
    sys.exit(main())