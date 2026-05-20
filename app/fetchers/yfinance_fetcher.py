import logging
from datetime import date, timedelta

import pandas as pd
import yfinance as yf
from sqlalchemy.dialects.sqlite import insert

from app.database import get_session
from app.models import CrawlState, FearIndex, SectorPrice

logger = logging.getLogger(__name__)

SECTOR_ETFS: dict[str, str] = {
    "XLK": "Technology",
    "XLF": "Financials",
    "XLV": "Health Care",
    "XLE": "Energy",
    "XLI": "Industrials",
    "XLY": "Consumer Discretionary",
    "XLP": "Consumer Staples",
    "XLU": "Utilities",
    "XLB": "Materials",
    "XLRE": "Real Estate",
    "XLC": "Communication Services",
}

FEAR_SYMBOLS: dict[str, str] = {
    "^VIX": "VIX",
    "^VVIX": "VVIX",
    "^SKEW": "SKEW",
}

ASSET_SYMBOLS: list[str] = ["SPY", "QQQ", "IWM", "TLT", "GLD", "UUP", "USO", "HYG", "LQD"]

SOURCE_PRICES = "yfinance_prices"
SOURCE_FEAR = "yfinance_fear"


def _last_fetched_date(source: str) -> date | None:
    with get_session() as s:
        row = s.get(CrawlState, source)
        return row.last_date if row else None


def _update_crawl_state(source: str, last_date: date, error: str | None = None) -> None:
    with get_session() as s:
        row = s.get(CrawlState, source)
        if row is None:
            row = CrawlState(source=source)
            s.add(row)
        row.last_date = last_date
        row.last_error = error


def _fetch_start(source: str, lookback_days: int) -> date:
    last = _last_fetched_date(source)
    if last:
        return last + timedelta(days=1)
    return date.today() - timedelta(days=lookback_days)


def fetch_sector_prices(lookback_days: int = 365) -> int:
    start = _fetch_start(SOURCE_PRICES, lookback_days)
    if start > date.today():
        logger.info("sector prices up to date")
        return 0

    tickers = list(SECTOR_ETFS.keys()) + ASSET_SYMBOLS
    logger.info("fetching %d tickers from %s", len(tickers), start)

    df_raw = yf.download(
        tickers,
        start=start.isoformat(),
        auto_adjust=True,
        progress=False,
        group_by="ticker",
    )

    rows_saved = 0
    all_tickers = list(SECTOR_ETFS.keys()) + ASSET_SYMBOLS
    for ticker in all_tickers:
        try:
            sub = df_raw[ticker][["Open", "High", "Low", "Close", "Volume"]].dropna(how="all")
        except KeyError:
            logger.warning("no data for %s", ticker)
            continue

        sub = sub.copy()
        sub["pct_change"] = sub["Close"].pct_change()

        with get_session() as s:
            for ts, row in sub.iterrows():
                dt = ts.date() if hasattr(ts, "date") else ts
                stmt = (
                    insert(SectorPrice)
                    .values(
                        ticker=ticker,
                        date=dt,
                        open=_safe(row["Open"]),
                        high=_safe(row["High"]),
                        low=_safe(row["Low"]),
                        close=_safe(row["Close"]),
                        volume=int(row["Volume"]) if pd.notna(row["Volume"]) else None,
                        pct_change=_safe(row["pct_change"]),
                    )
                    .on_conflict_do_nothing()
                )
                s.execute(stmt)
                rows_saved += 1

    _update_crawl_state(SOURCE_PRICES, date.today())
    logger.info("saved %d sector price rows", rows_saved)
    return rows_saved


def fetch_fear_indexes(lookback_days: int = 365) -> int:
    start = _fetch_start(SOURCE_FEAR, lookback_days)
    if start > date.today():
        logger.info("fear indexes up to date")
        return 0

    rows_saved = 0
    for yf_symbol, label in FEAR_SYMBOLS.items():
        try:
            ticker = yf.Ticker(yf_symbol)
            hist = ticker.history(start=start.isoformat(), auto_adjust=True)
            if hist.empty:
                logger.warning("no data for %s", yf_symbol)
                continue

            with get_session() as s:
                for ts, row in hist.iterrows():
                    dt = ts.date() if hasattr(ts, "date") else ts
                    stmt = (
                        insert(FearIndex)
                        .values(symbol=label, date=dt, value=float(row["Close"]))
                        .on_conflict_do_nothing()
                    )
                    s.execute(stmt)
                    rows_saved += 1
        except Exception as exc:
            logger.error("failed to fetch %s: %s", yf_symbol, exc)

    _update_crawl_state(SOURCE_FEAR, date.today())
    logger.info("saved %d fear index rows", rows_saved)
    return rows_saved


def _safe(val) -> float | None:
    import math
    if val is None:
        return None
    try:
        f = float(val)
        return None if math.isnan(f) else f
    except (TypeError, ValueError):
        return None
