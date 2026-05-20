from datetime import date, timedelta

import numpy as np
import pandas as pd
from sqlalchemy import select

from app.database import get_session
from app.models import SectorPrice

CREDIT_SYMBOLS = ["HYG", "LQD"]


def get_credit_spread(window: int = 90) -> dict:
    """
    HYG/LQD price ratio as a high-yield credit stress proxy.
    A falling ratio means HY bonds are underperforming IG — credit stress rising.
    Z-score < -1: widening spread (stress), > +1: tightening (calm).
    """
    since = date.today() - timedelta(days=window + 30)

    with get_session() as s:
        rows = s.execute(
            select(SectorPrice.ticker, SectorPrice.date, SectorPrice.close)
            .where(SectorPrice.ticker.in_(CREDIT_SYMBOLS))
            .where(SectorPrice.date >= since)
            .order_by(SectorPrice.date)
        ).fetchall()

    if not rows:
        return {"dates": [], "values": [], "current": None, "zscore": None, "status": "no_data"}

    df = pd.DataFrame(rows, columns=["ticker", "date", "close"])
    df["date"] = pd.to_datetime(df["date"])
    pivot = df.pivot_table(index="date", columns="ticker", values="close", aggfunc="last")

    if "HYG" not in pivot.columns or "LQD" not in pivot.columns:
        return {"dates": [], "values": [], "current": None, "zscore": None, "status": "missing_data"}

    pivot = pivot.dropna(subset=["HYG", "LQD"])
    if pivot.empty:
        return {"dates": [], "values": [], "current": None, "zscore": None, "status": "empty"}

    ratio = (pivot["HYG"] / pivot["LQD"]).tail(window)

    current = float(ratio.iloc[-1]) if len(ratio) > 0 else None
    zscore = None
    if len(ratio) >= 20:
        mean = ratio.mean()
        std = ratio.std()
        if std > 0:
            zscore = round(float((ratio.iloc[-1] - mean) / std), 2)

    def _to_date_str(d):
        if hasattr(d, "date"):
            return d.date().isoformat()
        if hasattr(d, "isoformat"):
            return d.isoformat()[:10]
        return str(d)[:10]

    return {
        "dates": [_to_date_str(d) for d in ratio.index],
        "values": [round(float(v), 4) for v in ratio.values],
        "current": round(current, 4) if current is not None else None,
        "zscore": zscore,
        "status": "ok",
    }


def get_current_spread_card() -> dict | None:
    """Returns a summary dict suitable for displaying as a fear card."""
    result = get_credit_spread(window=60)
    if result["status"] != "ok" or result["current"] is None:
        return None

    zscore = result["zscore"]
    # Interpret: low zscore = HYG underperforming = stress
    if zscore is not None:
        if zscore < -1.5:
            label = "Stress"
        elif zscore < -0.5:
            label = "Widening"
        elif zscore > 1.5:
            label = "Tight"
        elif zscore > 0.5:
            label = "Tightening"
        else:
            label = "Neutral"
    else:
        label = None

    return {
        "symbol": "HYG/LQD",
        "value": result["current"],
        "zscore": zscore,
        "label": label,
        "dates": result["dates"],
        "values": result["values"],
    }
