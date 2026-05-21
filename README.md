# FlowMap

US stock market sector fund flows and fear index dashboard.  
"Where is money moving, and how scared is the market?" — answered in one view.

## Features

### Market Temperature
Composite 0–100 score (Extreme Fear → Extreme Greed) calculated from VIX level, sector momentum, and price momentum. Always visible in the top navbar.

### Sector Heatmap (`/sectors`)
11 S&P 500 sector ETFs (XLK, XLF, XLV, XLE, XLI, XLY, XLP, XLU, XLB, XLRE, XLC) visualized as a color-coded heatmap with selectable periods: 1D / 5D / 1M / 3M / YTD.

### Fear Index × Asset Correlation (`/fear`)
- Rolling Pearson correlation matrix between fear indexes and assets (20D / 60D / 120D)
- Fear index time series viewer: VIX, VVIX, SKEW
- Asset time series: SPY, QQQ, IWM, TLT, GLD, UUP, USO
- **HYG credit spread proxy** — HYG/LQD ratio with z-score indicator

### History (`/history`)
VIX / VVIX / SKEW historical charts with reference lines (VIX: 20/30, SKEW: 130/150). Selectable 3M / 6M / 1Y window.

### Auto-refresh
- DB refreshed every 15 minutes during market hours (9:30–16:15 ET, Mon–Fri)
- Browser auto-calls API every 5 minutes without page reload
- Manual refresh button + last-updated timestamp in navbar

### Korean / English i18n
Toggle between 한국어 and English — language persists via `localStorage`, charts re-render from cache without extra API calls.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Language | Python 3.12 |
| Web framework | FastAPI + Uvicorn |
| Database | SQLite (`flowmap.db`) |
| ORM / Migrations | SQLAlchemy 2 + Alembic |
| Scheduler | APScheduler (AsyncIOScheduler) |
| Templates | Jinja2 (SSR) |
| Charts | Apache ECharts 5 (CDN) |
| Data | yfinance, httpx |
| Processing | pandas + numpy |

---

## Project Structure

```
flowmap/
├── app/
│   ├── main.py               CLI entry (--health / --fetch / --backfill / --web / --serve)
│   ├── config.py
│   ├── models.py             SectorPrice, EtfFlow, FearIndex, CrawlState
│   ├── database.py
│   ├── fetchers/
│   │   ├── yfinance_fetcher.py
│   │   ├── cboe_fetcher.py
│   │   └── etf_flow_fetcher.py
│   ├── compute/
│   │   ├── sector_heatmap.py
│   │   ├── correlation.py
│   │   ├── credit_spread.py
│   │   └── market_temp.py
│   ├── scheduler/jobs.py
│   ├── api/routes.py
│   └── web/
│       ├── views.py
│       └── templates/
├── static/js/i18n.js
├── migrations/
├── .env.example
└── requirements.txt
```

---

## Quick Start

```bash
# 1. Clone and set up
git clone https://github.com/harry4455/flowMap.git
cd flowMap
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env

# 2. Initialize database
.venv/bin/alembic upgrade head

# 3. Backfill 1 year of historical data
.venv/bin/python -m app.main --backfill --days 365

# 4. Run (web server + scheduler)
.venv/bin/python -m app.main --serve --port 8001
```

Open [http://localhost:8001](http://localhost:8001).

### Other CLI commands

```bash
# Health check
.venv/bin/python -m app.main --health

# One-shot data fetch
.venv/bin/python -m app.main --fetch

# Web server only (no scheduler)
.venv/bin/python -m app.main --web --port 8001
```

---

## Data Sources

| Data | Source | Notes |
|---|---|---|
| Sector ETF prices (11) | yfinance | 15-min refresh during market hours |
| Asset prices (SPY, QQQ, IWM, TLT, GLD, UUP, USO) | yfinance | |
| VIX / VVIX / SKEW | yfinance | |
| HYG / LQD (credit spread proxy) | yfinance | |
| ETF fund flows | Volume proxy (yfinance) | Direction proxy only |
| Put/Call Ratio | CBOE | Currently blocked (403) |
