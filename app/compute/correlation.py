from datetime import date, timedelta

import numpy as np
import pandas as pd
from sqlalchemy import select

from app.database import get_session
from app.models import FearIndex, SectorPrice

FEAR_SYMBOLS = ["VIX", "VVIX", "SKEW", "PUT_CALL"]
ASSET_SYMBOLS = ["SPY", "QQQ", "IWM", "TLT", "GLD", "UUP", "USO"]
ALL_SYMBOLS = FEAR_SYMBOLS + ASSET_SYMBOLS


def get_correlation_matrix(window: int = 60) -> dict:
    """
    Returns a correlation matrix between fear indexes and asset prices.
    Uses daily % changes for assets and raw values for fear indexes.
    """
    since = date.today() - timedelta(days=window + 10)

    fear_df = _load_fear(since)
    asset_df = _load_assets(since)

    if fear_df.empty and asset_df.empty:
        return {"symbols": [], "matrix": [], "window": window, "last_updated": None}

    combined = pd.concat([fear_df, asset_df], axis=1).dropna(how="all")
    combined = combined.tail(window)

    available = [c for c in ALL_SYMBOLS if c in combined.columns]
    if len(available) < 2:
        return {"symbols": available, "matrix": [], "window": window, "last_updated": None}

    sub = combined[available].dropna()
    if sub.empty or len(sub) < 5:
        return {"symbols": available, "matrix": [], "window": window, "last_updated": None}

    corr = sub.corr(method="pearson")
    last_date = sub.index.max()

    return {
        "symbols": available,
        "matrix": _round_matrix(corr, available),
        "window": window,
        "last_updated": last_date.isoformat() if hasattr(last_date, "isoformat") else str(last_date),
    }


def get_timeseries(symbol: str, window: int = 90) -> dict:
    """Returns date + value arrays for a single symbol (fear index or asset)."""
    since = date.today() - timedelta(days=window + 5)

    if symbol in FEAR_SYMBOLS:
        df = _load_fear(since)
        series = df.get(symbol)
    else:
        df = _load_assets(since)
        series = df.get(symbol)

    if series is None or series.empty:
        return {"symbol": symbol, "dates": [], "values": []}

    series = series.tail(window).dropna()
    def _to_date_str(d) -> str:
        if hasattr(d, "date"):
            return d.date().isoformat()
        if hasattr(d, "isoformat"):
            return d.isoformat()[:10]
        return str(d)[:10]

    return {
        "symbol": symbol,
        "dates": [_to_date_str(d) for d in series.index],
        "values": [round(float(v), 4) for v in series.values],
    }


def _load_fear(since: date) -> pd.DataFrame:
    with get_session() as s:
        rows = s.execute(
            select(FearIndex.symbol, FearIndex.date, FearIndex.value)
            .where(FearIndex.date >= since)
            .order_by(FearIndex.date)
        ).fetchall()

    if not rows:
        return pd.DataFrame()

    df = pd.DataFrame(rows, columns=["symbol", "date", "value"])
    df["date"] = pd.to_datetime(df["date"])
    pivot = df.pivot_table(index="date", columns="symbol", values="value", aggfunc="last")
    return pivot


def _load_assets(since: date) -> pd.DataFrame:
    with get_session() as s:
        rows = s.execute(
            select(SectorPrice.ticker, SectorPrice.date, SectorPrice.pct_change)
            .where(SectorPrice.ticker.in_(ASSET_SYMBOLS))
            .where(SectorPrice.date >= since)
            .order_by(SectorPrice.date)
        ).fetchall()

    if not rows:
        return pd.DataFrame()

    df = pd.DataFrame(rows, columns=["ticker", "date", "pct_change"])
    df["date"] = pd.to_datetime(df["date"])
    pivot = df.pivot_table(index="date", columns="ticker", values="pct_change", aggfunc="last")
    return pivot


def _round_matrix(corr: pd.DataFrame, symbols: list[str]) -> list[list[float]]:
    matrix = []
    for s in symbols:
        row = []
        for t in symbols:
            v = corr.loc[s, t] if s in corr.index and t in corr.columns else float("nan")
            row.append(round(float(v), 3) if not np.isnan(v) else None)
        matrix.append(row)
    return matrix
