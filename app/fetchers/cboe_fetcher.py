"""
CBOE daily Put/Call ratio fetcher.
CBOE publishes historical P/C data at:
  https://cdn.cboe.com/api/global/us_indices/daily_prices/PC_Data.csv
Columns: DATE, P/C Ratio (TOTAL), P/C Ratio (INDEX), P/C Ratio (EQUITY)
We store the TOTAL ratio under symbol "PUT_CALL".
"""

import logging
from datetime import date, timedelta
from io import StringIO

import httpx
import pandas as pd
from sqlalchemy.dialects.sqlite import insert

from app.database import get_session
from app.models import CrawlState, FearIndex

logger = logging.getLogger(__name__)

# CBOE CDN blocks automated requests (403). Try both known URLs.
CBOE_URLS = [
    "https://cdn.cboe.com/api/global/us_indices/daily_prices/PC_Data.csv",
    "https://www.cboe.com/publish/ScheduledTask/MktData/datahouse/totalpc.csv",
]
SOURCE = "cboe_putcall"
SYMBOL = "PUT_CALL"


def _last_fetched_date() -> date | None:
    with get_session() as s:
        row = s.get(CrawlState, SOURCE)
        return row.last_date if row else None


def fetch_put_call_ratio() -> int:
    last = _last_fetched_date()
    since = (last + timedelta(days=1)) if last else date(2010, 1, 1)

    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Referer": "https://www.cboe.com/us/options/market_statistics/daily/",
    }
    logger.info("fetching CBOE Put/Call ratio since %s", since)
    resp = None
    for url in CBOE_URLS:
        try:
            r = httpx.get(url, timeout=30, follow_redirects=True, headers=headers)
            if r.status_code == 200:
                resp = r
                break
            logger.debug("CBOE URL %s returned %d", url, r.status_code)
        except Exception as exc:
            logger.debug("CBOE URL %s error: %s", url, exc)

    if resp is None:
        logger.warning(
            "CBOE Put/Call data unavailable (all URLs blocked). "
            "Market temperature will skip this component. "
            "TODO: implement browser-based scraper (Playwright) for reliable access."
        )
        return 0

    try:
        df = pd.read_csv(StringIO(resp.text))
        df.columns = [c.strip() for c in df.columns]

        # Normalise the date column (first column)
        date_col = df.columns[0]
        df[date_col] = pd.to_datetime(df[date_col], errors="coerce")
        df = df.dropna(subset=[date_col])

        # Pick the TOTAL put/call column (first numeric column after date)
        value_col = [c for c in df.columns if c != date_col][0]
        df = df[[date_col, value_col]].rename(columns={date_col: "date", value_col: "value"})
        df["date"] = df["date"].dt.date
        df = df[df["date"] >= since]
        df = df.dropna(subset=["value"])
    except Exception as exc:
        logger.error("CBOE parse failed: %s", exc)
        _set_error(str(exc))
        return 0

    rows_saved = 0
    with get_session() as s:
        for _, row in df.iterrows():
            stmt = (
                insert(FearIndex)
                .values(symbol=SYMBOL, date=row["date"], value=float(row["value"]))
                .on_conflict_do_nothing()
            )
            s.execute(stmt)
            rows_saved += 1

    if not df.empty:
        _set_state(df["date"].max())
    logger.info("saved %d Put/Call rows", rows_saved)
    return rows_saved


def _set_state(last_date: date) -> None:
    with get_session() as s:
        row = s.get(CrawlState, SOURCE)
        if row is None:
            row = CrawlState(source=SOURCE)
            s.add(row)
        row.last_date = last_date
        row.last_error = None


def _set_error(msg: str) -> None:
    with get_session() as s:
        row = s.get(CrawlState, SOURCE)
        if row is None:
            row = CrawlState(source=SOURCE)
            s.add(row)
        row.last_error = msg
