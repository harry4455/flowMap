# CLAUDE.md

## Commands

```bash
# Setup
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env

# DB migration
.venv/bin/alembic upgrade head
.venv/bin/alembic revision --autogenerate -m "description"

# Health check
.venv/bin/python -m app.main --health

# Fetch all data (one-shot, for testing)
.venv/bin/python -m app.main --fetch

# Backfill historical data (default 365 days)
.venv/bin/python -m app.main --backfill --days 365

# Run web server
.venv/bin/python -m app.main --web

# Run everything (web + scheduler)
.venv/bin/python -m app.main --serve
```

## Architecture

Three layers:

- **Fetchers** (`app/fetchers/`) — pull raw data and persist to DB:
  - `yfinance_fetcher.py` — sector ETF prices + fear indexes (VIX, VVIX, SKEW)
  - `cboe_fetcher.py` — daily Put/Call ratio from CBOE
  - `etf_flow_fetcher.py` — ETF fund flows from etf.com

- **Compute** (`app/compute/`) — read DB, return structured dicts for API:
  - `sector_heatmap.py` — pct_change matrix per sector per day
  - `correlation.py` — rolling correlation matrix (fear indexes × assets)
  - `market_temp.py` — composite 0–100 market temperature score

- **Web** (`app/web/`) — FastAPI + Jinja2 + ECharts:
  - `views.py` — HTML page routes
  - `templates/` — Jinja2 with ECharts from CDN

- **API** (`app/api/routes.py`) — JSON endpoints consumed by frontend ECharts

- **Scheduler** (`app/scheduler/jobs.py`) — APScheduler AsyncIOScheduler, wired in `main.py` lifespan

## Key constants

Sector ETFs (11): XLK, XLF, XLV, XLE, XLI, XLY, XLP, XLU, XLB, XLRE, XLC

Fear symbols (yfinance): `^VIX`, `^VVIX`, `^SKEW`

Asset symbols: SPY, QQQ, IWM, TLT, GLD, UUP, USO

## Module conventions

- `app/config.py` — `Config` dataclass + `load_config()`. All env access goes through here.
- `app/database.py` — `init_db(url)` called once at startup; `get_session()` context manager.
- Dates stored as Python `date` objects (SQLAlchemy `Date` column).
- Monetary amounts (flow_usd, aum_usd) stored as INTEGER (USD cents).
- `crawl_state.last_date` is the last successfully fetched date; fetchers skip up to and including this date.
