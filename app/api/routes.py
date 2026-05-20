from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from app.compute import correlation, credit_spread, market_temp, sector_heatmap

router = APIRouter(prefix="/api")


@router.get("/market/temperature")
def api_temperature():
    return market_temp.get_temperature()


@router.get("/sectors/heatmap")
def api_sector_heatmap(period: str = Query(default="1M", pattern="^(1D|5D|1M|3M|YTD)$")):
    return sector_heatmap.get_heatmap_data(period)


@router.get("/sectors/summary")
def api_sector_summary():
    return sector_heatmap.get_sector_summary()


@router.get("/fear/correlation")
def api_correlation(window: int = Query(default=60, ge=10, le=252)):
    return correlation.get_correlation_matrix(window)


@router.get("/fear/timeseries/{symbol}")
def api_timeseries(symbol: str, window: int = Query(default=90, ge=10, le=365)):
    allowed = set(correlation.FEAR_SYMBOLS + correlation.ASSET_SYMBOLS)
    if symbol not in allowed:
        return JSONResponse(status_code=404, content={"error": "unknown symbol"})
    return correlation.get_timeseries(symbol, window)


@router.get("/fear/credit_spread")
def api_credit_spread(window: int = Query(default=90, ge=30, le=365)):
    return credit_spread.get_credit_spread(window)


@router.get("/fear/current")
def api_fear_current():
    from datetime import date, timedelta
    from sqlalchemy import select
    from app.database import get_session
    from app.models import FearIndex

    result = []
    since = date.today() - timedelta(days=5)
    with get_session() as s:
        for symbol in correlation.FEAR_SYMBOLS:
            row = s.execute(
                select(FearIndex.symbol, FearIndex.date, FearIndex.value)
                .where(FearIndex.symbol == symbol)
                .order_by(FearIndex.date.desc())
                .limit(2)
            ).fetchall()
            if not row:
                continue
            current = row[0]
            prev = row[1] if len(row) > 1 else None
            change = round(current.value - prev.value, 3) if prev else None
            result.append({
                "symbol": symbol,
                "value": round(current.value, 2),
                "date": current.date.isoformat(),
                "change": change,
            })
    return result
