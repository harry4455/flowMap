"""
Market temperature score: 0 (extreme fear) → 100 (extreme greed).

Components and weights:
  VIX level          30%  — high VIX = fear
  Put/Call ratio     20%  — high P/C = fear
  Sector momentum    25%  — defensive sectors outperforming = fear
  Price momentum     25%  — SPY/QQQ vs 20d MA direction

Levels:
  0–20   Extreme Fear
  21–40  Fear
  41–60  Neutral
  61–80  Greed
  81–100 Extreme Greed
"""

from datetime import date, timedelta

import pandas as pd
from sqlalchemy import select

from app.database import get_session
from app.models import FearIndex, SectorPrice

DEFENSIVE = {"XLU", "XLP", "XLV"}
OFFENSIVE = {"XLK", "XLY", "XLF", "XLI"}

LEVELS = [
    (20, "Extreme Fear",  "#d32f2f"),
    (40, "Fear",          "#f57c00"),
    (60, "Neutral",       "#fbc02d"),
    (80, "Greed",         "#388e3c"),
    (100, "Extreme Greed", "#1b5e20"),
]


def get_temperature() -> dict:
    vix_score = _vix_component()
    pc_score = _put_call_component()
    sector_score = _sector_momentum_component()
    price_score = _price_momentum_component()

    if all(v is None for v in [vix_score, pc_score, sector_score, price_score]):
        return {"score": None, "level": "No data", "color": "#888", "components": {}}

    weights = [(vix_score, 0.30), (pc_score, 0.20), (sector_score, 0.25), (price_score, 0.25)]
    total_w = sum(w for v, w in weights if v is not None)
    score = sum(v * w for v, w in weights if v is not None) / total_w if total_w > 0 else None

    if score is None:
        return {"score": None, "level": "No data", "color": "#888", "components": {}}

    score = round(max(0, min(100, score)), 1)
    level, color = _classify(score)

    return {
        "score": score,
        "level": level,
        "color": color,
        "components": {
            "vix": round(vix_score, 1) if vix_score is not None else None,
            "put_call": round(pc_score, 1) if pc_score is not None else None,
            "sector_momentum": round(sector_score, 1) if sector_score is not None else None,
            "price_momentum": round(price_score, 1) if price_score is not None else None,
        },
    }


def _vix_component() -> float | None:
    """High VIX → low score (fear). VIX ~10 = greed (100), VIX ~40+ = fear (0)."""
    vix = _latest_fear("VIX")
    if vix is None:
        return None
    # linear clamp: VIX 10 → 100, VIX 40 → 0
    return max(0.0, min(100.0, (40 - vix) / 30 * 100))


def _put_call_component() -> float | None:
    """High P/C ratio → fear. P/C 0.5 = greed (100), P/C 1.2+ = fear (0)."""
    pc = _latest_fear("PUT_CALL")
    if pc is None:
        return None
    return max(0.0, min(100.0, (1.2 - pc) / 0.7 * 100))


def _sector_momentum_component() -> float | None:
    """Defensive outperforming offensive → fear."""
    since = date.today() - timedelta(days=10)
    with get_session() as s:
        rows = s.execute(
            select(SectorPrice.ticker, SectorPrice.pct_change)
            .where(SectorPrice.ticker.in_(DEFENSIVE | OFFENSIVE))
            .where(SectorPrice.date >= since)
            .order_by(SectorPrice.date.desc())
        ).fetchall()

    if not rows:
        return None

    df = pd.DataFrame(rows, columns=["ticker", "pct_change"])
    latest = df.groupby("ticker")["pct_change"].first()

    def_avg = latest[latest.index.isin(DEFENSIVE)].mean()
    off_avg = latest[latest.index.isin(OFFENSIVE)].mean()

    if pd.isna(def_avg) or pd.isna(off_avg):
        return None

    # diff > 0 means defensive winning → fear. Map [-3%, +3%] → [100, 0]
    diff = float(def_avg - off_avg) * 100  # in pct points
    return max(0.0, min(100.0, 50 - diff * 16.7))


def _price_momentum_component() -> float | None:
    """SPY above 20d MA → greed; below → fear."""
    since = date.today() - timedelta(days=30)
    with get_session() as s:
        rows = s.execute(
            select(SectorPrice.date, SectorPrice.close)
            .where(SectorPrice.ticker == "SPY")
            .where(SectorPrice.date >= since)
            .order_by(SectorPrice.date.desc())
            .limit(21)
        ).fetchall()

    if len(rows) < 5:
        return None

    closes = [r.close for r in rows if r.close]
    if len(closes) < 5:
        return None

    current = closes[0]
    ma20 = sum(closes) / len(closes)
    diff_pct = (current - ma20) / ma20 * 100  # percent above/below MA

    # +3% above MA → greed (100); -3% below → fear (0)
    return max(0.0, min(100.0, 50 + diff_pct * 16.7))


def _latest_fear(symbol: str) -> float | None:
    with get_session() as s:
        row = s.execute(
            select(FearIndex.value)
            .where(FearIndex.symbol == symbol)
            .order_by(FearIndex.date.desc())
            .limit(1)
        ).fetchone()
    return float(row.value) if row else None


def _classify(score: float) -> tuple[str, str]:
    for threshold, label, color in LEVELS:
        if score <= threshold:
            return label, color
    return "Extreme Greed", "#1b5e20"
