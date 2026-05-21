from fastapi import APIRouter
from fastapi.requests import Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from app.compute import correlation, market_temp, sector_heatmap

templates = Jinja2Templates(directory="app/web/templates")
router = APIRouter()


@router.get("/", response_class=HTMLResponse)
def index(request: Request):
    temp = market_temp.get_temperature()
    summary = sector_heatmap.get_sector_summary()
    fear = _get_fear_cards()
    return templates.TemplateResponse(request=request, name="index.html", context={
        "temp": temp,
        "summary": summary,
        "fear": fear,
    })


@router.get("/sectors", response_class=HTMLResponse)
def sectors_page(request: Request):
    summary = sector_heatmap.get_sector_summary()
    return templates.TemplateResponse(request=request, name="sectors.html", context={
        "summary": summary,
    })


@router.get("/fear", response_class=HTMLResponse)
def fear_page(request: Request):
    fear = _get_fear_cards()
    return templates.TemplateResponse(request=request, name="fear.html", context={
        "fear": fear,
    })


@router.get("/history", response_class=HTMLResponse)
def history_page(request: Request):
    return templates.TemplateResponse(request=request, name="history.html", context={})


def _get_fear_cards() -> list[dict]:
    from datetime import date
    from sqlalchemy import select
    from app.database import get_session
    from app.models import FearIndex
    from app.compute.correlation import FEAR_SYMBOLS

    result = []
    with get_session() as s:
        for symbol in FEAR_SYMBOLS:
            rows = s.execute(
                select(FearIndex.value, FearIndex.date)
                .where(FearIndex.symbol == symbol)
                .order_by(FearIndex.date.desc())
                .limit(2)
            ).fetchall()
            if not rows:
                continue
            cur = rows[0]
            prev = rows[1] if len(rows) > 1 else None
            change = round(cur.value - prev.value, 2) if prev else None
            result.append({
                "symbol": symbol,
                "value": round(cur.value, 2),
                "date": cur.date.isoformat(),
                "change": change,
                "change_sign": "+" if change and change > 0 else "",
            })
    return result
