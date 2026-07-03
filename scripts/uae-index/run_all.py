#!/usr/bin/env python3
"""
Top-level driver: runs fetch_indices.py + fetch_stocks.py and writes _data/uae/meta.json.

Usage: python scripts/uae-index/run_all.py
"""
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPTS_DIR = REPO_ROOT / "scripts" / "uae-index"
META_JSON = REPO_ROOT / "_data" / "uae" / "meta.json"
STOCKS_JSON = REPO_ROOT / "_data" / "uae" / "stocks.json"
INDICES_JSON = REPO_ROOT / "_data" / "uae" / "indices.json"


def run(script_name):
    print(f"\n=== {script_name} ===")
    result = subprocess.run(
        [sys.executable, str(SCRIPTS_DIR / script_name)],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
    )
    print(result.stdout)
    if result.returncode != 0:
        print("STDERR:", result.stderr, file=sys.stderr)
        sys.exit(result.returncode)


def write_meta():
    with STOCKS_JSON.open("r", encoding="utf-8") as f:
        stocks = json.load(f)
    with INDICES_JSON.open("r", encoding="utf-8") as f:
        indices = json.load(f)

    meta = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "site_version": "1.0.0",
        "data_source": {
            "primary": "Yahoo Finance via yfinance (DFM coverage ~50-60%)",
            "augmenting": "DFM official API (https://api2.dfm.ae/mw/v1/indices)",
            "missing": "ADX equities — Yahoo Finance does not carry ADX tickers; manual entry not supported in this build.",
        },
        "coverage": stocks["coverage"],
        "tickers_count": stocks["count"],
        "indices_count": len(indices["indices"]),
        "dfmgi_latest": _latest_close(indices, "DFMGI"),
        "adxgi_latest": _latest_close(indices, "ADXGI"),
        "notes": [
            "All AED-denominated prices from Yahoo Finance.",
            "ADX rows show sector/subsector metadata only — price = null.",
            "Index history spans ~1 year (DFMGI from DFM official = ~100 trading days).",
        ],
    }
    with META_JSON.open("w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2, ensure_ascii=False)
    print(f"Wrote {META_JSON.relative_to(REPO_ROOT)}")


def _latest_close(indices_data, idx_id):
    for idx in indices_data["indices"]:
        if idx["id"] == idx_id and idx["history"]:
            return idx["history"][-1]
    return None


def main():
    run("fetch_indices.py")
    run("fetch_stocks.py")
    write_meta()
    print("\nAll done.")


if __name__ == "__main__":
    main()