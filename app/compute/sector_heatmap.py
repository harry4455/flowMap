from datetime import date, timedelta

import pandas as pd
from sqlalchemy import select

from app.database import get_session
from app.models import EtfFlow, SectorPrice

SECTOR_ETFS: dict[str, str] = {
    "XLK": "Technology",
    "XLF": "Financials",
    "XLV": "Health Care",
    "XLE": "Energy",
    "XLI": "Industrials",
    "XLY": "Consumer Disc.",
    "XLP": "Consumer Staples",
    "XLU": "Utilities",
    "XLB": "Materials",
    "XLRE": "Real Estate",
    "XLC": "Communication",
}

PERIODS: dict[str, int] = {
    "1D": 2,
    "5D": 7,
    "1M": 31,
    "3M": 93,
    "YTD": (date.today() - date(date.today().year, 1, 1)).days + 1,
}


def get_heatmap_data(period: str = "1M") -> dict:
    """
    Returns data for an ECharts heatmap:
      dates: [str, ...]              — trading days in period
      sectors: [str, ...]            — sector ETF tickers
      sector_names: {ticker: name}
      data: [[date_idx, sector_idx, pct_change], ...]
      flows: {ticker: flow_usd_millions | null}
    """
    days = PERIODS.get(period, PERIODS["1M"])
    since = date.today() - timedelta(days=days)

    with get_session() as s:
        rows = s.execute(
            select(SectorPrice.ticker, SectorPrice.date, SectorPrice.pct_change)
            .where(SectorPrice.ticker.in_(SECTOR_ETFS.keys()))
            .where(SectorPrice.date >= since)
            .order_by(SectorPrice.date)
        ).fetchall()

    if not rows:
        return {"dates": [], "sectors": [], "sector_names": SECTOR_ETFS, "data": [], "flows": {}}

    df = pd.DataFrame(rows, columns=["ticker", "date", "pct_change"])
    df["date"] = pd.to_datetime(df["date"]).dt.date

    all_dates = sorted(df["date"].unique().tolist())
    sectors = list(SECTOR_ETFS.keys())

    date_idx = {d: i for i, d in enumerate(all_dates)}
    sector_idx = {t: i for i, t in enumerate(sectors)}

    data = []
    for _, row in df.iterrows():
        if pd.isna(row["pct_change"]):
            continue
        d_i = date_idx.get(row["date"])
        s_i = sector_idx.get(row["ticker"])
        if d_i is not None and s_i is not None:
            data.append([d_i, s_i, round(float(row["pct_change"]) * 100, 2)])

    flows = _get_latest_flows(sectors)

    return {
        "dates": [d.isoformat() for d in all_dates],
        "sectors": sectors,
        "sector_names": SECTOR_ETFS,
        "data": data,
        "flows": flows,
    }


def get_sector_summary() -> list[dict]:
    """Latest 1D/5D/1M returns + today's flow for each sector."""
    result = []
    today = date.today()

    with get_session() as s:
        for ticker, name in SECTOR_ETFS.items():
            rows = s.execute(
                select(SectorPrice.date, SectorPrice.close, SectorPrice.pct_change)
                .where(SectorPrice.ticker == ticker)
                .order_by(SectorPrice.date.desc())
                .limit(22)
            ).fetchall()

            if not rows:
                continue

            closes = [r.close for r in rows if r.close is not None]
            ret_1d = rows[0].pct_change if rows else None
            ret_5d = _period_return(closes, 5)
            ret_1m = _period_return(closes, 21)

            result.append({
                "ticker": ticker,
                "name": name,
                "close": closes[0] if closes else None,
                "ret_1d": _pct(ret_1d),
                "ret_5d": _pct(ret_5d),
                "ret_1m": _pct(ret_1m),
            })

    flows = _get_latest_flows(list(SECTOR_ETFS.keys()))
    for item in result:
        item["flow_m"] = flows.get(item["ticker"])

    return result


def _period_return(closes: list[float], n: int) -> float | None:
    if len(closes) < n + 1:
        return None
    return closes[0] / closes[n] - 1


def _pct(v: float | None) -> float | None:
    if v is None:
        return None
    return round(v * 100, 2)


def _get_latest_flows(tickers: list[str]) -> dict[str, float | None]:
    flows: dict[str, float | None] = {t: None for t in tickers}
    with get_session() as s:
        for ticker in tickers:
            row = s.execute(
                select(EtfFlow.flow_usd)
                .where(EtfFlow.ticker == ticker)
                .order_by(EtfFlow.date.desc())
                .limit(1)
            ).fetchone()
            if row and row.flow_usd is not None:
                flows[ticker] = round(row.flow_usd / 100 / 1_000_000, 1)  # → millions USD
    return flows
