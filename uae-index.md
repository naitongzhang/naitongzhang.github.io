---
layout: uae-index
title: UAE Index Dashboard
permalink: /uae-index/
description: Live UAE equities dashboard — DFM and ADX stocks, indices, custom index builder.
---

This page is a static-rendered dashboard for UAE-listed equities. Data is refreshed daily
by a GitHub Actions cron job.

- **DFM (Dubai Financial Market)** equities: live prices via Yahoo Finance.
- **ADX (Abu Dhabi Securities Exchange)** equities: sector/metadata only — Yahoo Finance
  does not cover ADX local tickers. Live prices not available in this build.
- **Custom Index Builder**: pick stocks, set weights, get a synthetic index — all in the browser.

Source code and methodology: see [`scripts/uae-index/`]({{ '/tree/master/scripts/uae-index' | relative_url }})
on the repo.