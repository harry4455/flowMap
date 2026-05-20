import argparse
import asyncio
import logging
import sys
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.config import load_config
from app.database import init_db

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")
logger = logging.getLogger(__name__)


def build_app(cfg) -> FastAPI:
    from app.api.routes import router as api_router
    from app.web.views import router as web_router
    from app.scheduler.jobs import create_scheduler

    scheduler = create_scheduler()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        scheduler.start()
        logger.info("scheduler started")
        yield
        scheduler.shutdown(wait=False)

    app = FastAPI(title="FlowMap", lifespan=lifespan)
    app.include_router(api_router)
    app.include_router(web_router)
    try:
        app.mount("/static", StaticFiles(directory="static"), name="static")
    except Exception:
        pass  # static dir may not exist yet

    return app


def cmd_health(cfg) -> None:
    from sqlalchemy import text
    from app.database import get_session
    with get_session() as s:
        s.execute(text("SELECT 1"))
    print("OK — DB connection healthy")


def cmd_fetch(cfg, days: int = 365) -> None:
    from app.fetchers.yfinance_fetcher import fetch_sector_prices, fetch_fear_indexes
    from app.fetchers.cboe_fetcher import fetch_put_call_ratio
    from app.fetchers.etf_flow_fetcher import fetch_etf_flows

    logger.info("fetching sector prices (lookback %d days)…", days)
    n = fetch_sector_prices(lookback_days=days)
    logger.info("sector prices: +%d rows", n)

    logger.info("fetching fear indexes…")
    n = fetch_fear_indexes(lookback_days=days)
    logger.info("fear indexes: +%d rows", n)

    logger.info("fetching CBOE Put/Call ratio…")
    n = fetch_put_call_ratio()
    logger.info("put/call: +%d rows", n)

    logger.info("fetching ETF flows…")
    n = fetch_etf_flows(lookback_days=days)
    logger.info("ETF flows: +%d rows", n)

    print("fetch complete")


def main() -> None:
    parser = argparse.ArgumentParser(prog="flowmap")
    parser.add_argument("--health",   action="store_true", help="DB health check and exit")
    parser.add_argument("--fetch",    action="store_true", help="run all fetchers once and exit")
    parser.add_argument("--backfill", action="store_true", help="backfill historical data")
    parser.add_argument("--days",     type=int, default=365, help="lookback days for fetch/backfill")
    parser.add_argument("--web",      action="store_true", help="run web server only (no scheduler)")
    parser.add_argument("--serve",    action="store_true", help="run web server + scheduler (default)")
    parser.add_argument("--host",     default="0.0.0.0")
    parser.add_argument("--port",     type=int, default=8000)
    args = parser.parse_args()

    cfg = load_config()
    init_db(cfg.database_url)

    if args.health:
        cmd_health(cfg)
        sys.exit(0)

    if args.fetch or args.backfill:
        cmd_fetch(cfg, days=args.days)
        sys.exit(0)

    # default: run web server
    app = build_app(cfg)
    if args.web:
        # disable scheduler lifespan for web-only mode
        from app.api.routes import router as api_router
        from app.web.views import router as web_router
        bare = FastAPI(title="FlowMap")
        bare.include_router(api_router)
        bare.include_router(web_router)
        try:
            from fastapi.staticfiles import StaticFiles
            bare.mount("/static", StaticFiles(directory="static"), name="static")
        except Exception:
            pass
        app = bare

    uvicorn.run(app, host=args.host, port=args.port)


if __name__ == "__main__":
    main()
