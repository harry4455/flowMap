import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.fetchers.cboe_fetcher import fetch_put_call_ratio
from app.fetchers.etf_flow_fetcher import fetch_etf_flows
from app.fetchers.yfinance_fetcher import fetch_fear_indexes, fetch_sector_prices

logger = logging.getLogger(__name__)


def _run_prices():
    try:
        n = fetch_sector_prices(lookback_days=5)
        logger.info("scheduled: sector prices +%d rows", n)
    except Exception as exc:
        logger.error("scheduled sector prices failed: %s", exc)


def _run_fear():
    try:
        n = fetch_fear_indexes(lookback_days=5)
        logger.info("scheduled: fear indexes +%d rows", n)
    except Exception as exc:
        logger.error("scheduled fear indexes failed: %s", exc)


def _run_flows():
    try:
        n = fetch_etf_flows(lookback_days=5)
        logger.info("scheduled: ETF flows +%d rows", n)
    except Exception as exc:
        logger.error("scheduled ETF flows failed: %s", exc)


def _run_cboe():
    try:
        n = fetch_put_call_ratio()
        logger.info("scheduled: Put/Call +%d rows", n)
    except Exception as exc:
        logger.error("scheduled CBOE failed: %s", exc)


def create_scheduler() -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler(timezone="America/New_York")

    # Every 15 min during US market hours (9:30–16:15 ET, Mon–Fri)
    scheduler.add_job(_run_prices, "cron", day_of_week="mon-fri",
                      hour="9-16", minute="*/15", id="prices")
    scheduler.add_job(_run_fear,   "cron", day_of_week="mon-fri",
                      hour="9-16", minute="*/15", id="fear")

    # Daily after market close (flow data is next-day)
    scheduler.add_job(_run_flows, "cron", day_of_week="mon-fri",
                      hour=7, minute=0, id="etf_flows")
    scheduler.add_job(_run_cboe,  "cron", day_of_week="mon-fri",
                      hour=7, minute=10, id="cboe")

    return scheduler
