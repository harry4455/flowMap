"""
ETF fund-flow fetcher.

Estimates daily fund flows via a volume-price proxy:
  flow_proxy = volume * close * sign(pct_change)

High volume on up-days ≈ inflow; high volume on down-days ≈ outflow.
This is a directional proxy only — not actual creation/redemption unit data.
Replace with etf.com data for exact figures.
"""

import logging
from datetime import date, timedelta

import numpy as np
import pandas as pd
import yfinance as yf
from sqlalchemy.dialects.sqlite import insert

from app.database import get_session
from app.models import CrawlState, EtfFlow

logger = logging.getLogger(__name__)

SOURCE = "etf_flow"
SECTOR_ETFS = ["XLK", "XLF", "XLV", "XLE", "XLI", "XLY", "XLP", "XLU", "XLB", "XLRE", "XLC"]


def _last_fetched_date() -> date | None:
    with get_session() as s:
        row = s.get(CrawlState, SOURCE)
        return row.last_date if row else None


def fetch_etf_flows(lookback_days: int = 365) -> int:
    last = _last_fetched_date()
    start = (last + timedelta(days=1)) if last else (date.today() - timedelta(days=lookback_days))

    if start > date.today():
        logger.info("ETF flows up to date")
        return 0

    logger.info("estimating ETF flows since %s", start)
    rows_saved = 0

    for ticker in SECTOR_ETFS:
        try:
            t = yf.Ticker(ticker)
            hist = t.history(start=(start - timedelta(days=25)).isoformat(), auto_adjust=True)
            if hist.empty:
                continue

            hist = hist[["Close", "Volume"]].copy()
            hist["pct_change"] = hist["Close"].pct_change()
            hist["vol_20d_avg"] = hist["Volume"].rolling(20, min_periods=5).mean()

            # flow proxy: dollar volume * direction, normalised by 20d avg volume
            hist["flow"] = hist["Volume"] * hist["Close"] * np.sign(hist["pct_change"].fillna(0))
            hist["aum_proxy"] = hist["Close"] * hist["vol_20d_avg"]  # rough AUM proxy
            hist = hist.dropna(subset=["flow"])

            # filter to requested range
            mask = hist.index.date >= start  # type: ignore[operator]
            hist = hist[mask]

            with get_session() as s:
                for ts, row in hist.iterrows():
                    dt = ts.date() if hasattr(ts, "date") else ts
                    stmt = (
                        insert(EtfFlow)
                        .values(
                            ticker=ticker,
                            date=dt,
                            flow_usd=int(row["flow"] * 100),       # cents
                            aum_usd=int(row["aum_proxy"] * 100) if pd.notna(row["aum_proxy"]) else None,
                            source="yfinance_vol_proxy",
                        )
                        .on_conflict_do_nothing()
                    )
                    s.execute(stmt)
                    rows_saved += 1

        except Exception as exc:
            logger.error("ETF flow fetch failed for %s: %s", ticker, exc)

    _set_state(date.today())
    logger.info("saved %d ETF flow rows", rows_saved)
    return rows_saved


def _set_state(last_date: date) -> None:
    with get_session() as s:
        row = s.get(CrawlState, SOURCE)
        if row is None:
            row = CrawlState(source=SOURCE)
            s.add(row)
        row.last_date = last_date
        row.last_error = None
