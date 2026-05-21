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

## 지표 읽는 법

FlowMap을 처음 사용하거나 각 지표에 익숙하지 않은 분들을 위한 가이드입니다.

### 시장 온도계 (Market Temperature)

대시보드 상단의 게이지가 **시장 전체 심리**를 0~100 점수로 요약합니다.

| 구간 | 상태 | 해석 |
|---|---|---|
| 0–20 | Extreme Fear (극도의 공포) | 투자자 패닉. 역사적으로 중장기 매수 기회가 많았음 |
| 20–40 | Fear (공포) | 심리 위축, 방어적 포지션 선호 |
| 40–65 | Neutral (중립) | 방향성 불명확, 개별 종목/섹터 선별 중요 |
| 65–85 | Greed (탐욕) | 낙관 과잉. 과매수 여부 점검 권장 |
| 85–100 | Extreme Greed (극도의 탐욕) | 과열 신호. 조정 위험 인지 필요 |

> **구성 요소**: VIX 레벨(30%) + 섹터 모멘텀(25%) + 가격 모멘텀(25%) + Put/Call 비율(20%)  
> Put/Call 데이터가 없을 경우 나머지 세 요소로 정규화합니다.

---

### VIX — S&P 500 공포지수

S&P 500 옵션 시장에서 도출하는 **향후 30일 예상 연환산 변동성**입니다. CBOE가 산출하며, 투자자들이 하락 보험(풋옵션)을 얼마나 비싸게 구매하는지를 반영합니다. 주가지수와 대체로 반대 방향으로 움직여 "공포지수"라는 별명을 갖고 있습니다.

| 수준 | 상태 | 해석 |
|---|---|---|
| 20 미만 | 안정 | 낙관적 심리, 강세장 지속 |
| 20–30 | 경계 | 불확실성 증가, 변동성 확대 가능성 |
| 30–40 | 공포 | 급락 또는 조정 진행, 헤지 수요 급증 |
| 40 이상 | 극도 공포 | 금융위기(2008년 80), 코로나(2020년 85) 수준의 패닉 |

**VIX를 볼 때 주의사항**
- VIX는 **방향**이 아니라 **크기**를 예측합니다. 크게 오를 수도, 크게 내릴 수도 있다는 의미입니다.
- VIX 급등 후 평균회귀 경향이 있어, 역발상 투자자들은 VIX > 40 구간에서 매수 기회를 탐색합니다.
- VIX 선물 콘탱고(미래 > 현재) 구간에서 VIX ETF 장기 보유는 비용이 큽니다.

---

### VVIX — 변동성의 변동성

VIX 옵션 가격에서 도출한 **VIX 자체의 변동성**입니다. 공포 지수가 얼마나 불안정한지를 측정하며, 종종 VIX 급등보다 먼저 상승하는 선행 지표 특성을 보입니다.

| 수준 | 해석 |
|---|---|
| 85 미만 | 안정. 공포지수의 움직임이 예측 가능한 범위 |
| 85–110 | 주의. 변동성 국면 진입 가능성 증가 |
| 110 이상 | 불안정. VIX 급변 가능성 높음, 옵션 프리미엄 급등 |

---

### SKEW — 꼬리 리스크 지수

S&P 500의 외가격(OTM) 풋옵션과 등가격(ATM) 옵션의 가격 차이를 지수화한 것입니다. 시장이 **정규분포를 벗어난 대형 폭락(블랙스완)을 얼마나 우려하는지**를 측정합니다.

| 수준 | 해석 |
|---|---|
| 100 (이론값) | 정규분포 가정. 꼬리 리스크 보험료 없음 |
| 130 미만 | 정상 범위. 블랙스완 우려 낮음 |
| 130–150 | 꼬리 리스크 헤징 수요 증가. 기관투자자 방어 강화 |
| 150 이상 | 극단적 하락 대비 포지션 급증. VIX가 아직 낮아도 주의 |

> SKEW는 평소에는 VIX와 상관성이 낮습니다. VIX는 낮은데 SKEW가 높으면, 시장이 표면적으로는 평온하지만 내부적으로 꼬리 리스크를 크게 우려하는 상황입니다.

---

### HYG/LQD 신용 스프레드 (프록시)

**HYG**(iShares iBoxx High Yield Corporate Bond ETF, 정크본드)와 **LQD**(iShares iBoxx Investment Grade Corporate Bond ETF, 투자등급 채권)의 가격 비율입니다.

- **비율 상승** → HYG가 LQD보다 강세 → 정크본드 스프레드 축소 → 신용 환경 양호 (리스크온)
- **비율 하락** → HYG가 LQD보다 약세 → 정크본드 스프레드 확대 → 신용 위험 상승 (리스크오프)

현재 비율의 이상 수준은 **z-score**(표준편차 단위)로 표시됩니다.

| z-score | 상태 | 해석 |
|---|---|---|
| +1.5 이상 | Tight | 신용 환경 매우 양호. 기업 자금조달 용이, 경기 팽창 국면 |
| +0.5 ~ +1.5 | Tightening | 신용 스프레드 축소 추세 |
| −0.5 ~ +0.5 | Neutral | 역사적 평균 수준 |
| −1.5 ~ −0.5 | Widening | 스프레드 확대 추세. 경기 둔화 우려 |
| −1.5 미만 | Stress | 신용 위기 신호. 주식 시장 연쇄 하락 위험 |

> **한계**: 실제 OAS(Option-Adjusted Spread)가 아닌 ETF 가격 비율 기반의 프록시입니다. 방향성과 이상 수준 파악에 활용하고, 정밀한 스프레드 수치는 FRED나 Bloomberg에서 확인하세요.

---

### 섹터 흐름 & 히트맵 (Sector Flows & Heatmap)

S&P 500을 구성하는 11개 GICS 섹터 ETF(SPDR 시리즈)의 수익률과 추정 자금 흐름을 보여줍니다.

**히트맵 읽는 법**
- 색상 강도 = 해당 기간 수익률 크기 (기준: ±3%)
- 진한 초록 → 강한 상승 | 진한 빨강 → 강한 하락
- 행(가로): 날짜 | 열(세로): 섹터

**자금 흐름(Flow) 읽는 법**
- 양수(+): 해당 섹터로 자금 순유입 (매수 압력)
- 음수(−): 자금 순유출 (매도 압력)
- ⚠️ 거래량 기반 프록시이므로 방향성 참고용으로만 활용하세요.

**섹터 특성 요약**

| 티커 | 섹터 | 특성 | 강세 환경 |
|---|---|---|---|
| XLK | 기술 (Technology) | 성장주, 장기 금리 민감 | 금리 하락, 경기 확장 |
| XLF | 금융 (Financials) | 순이자마진, 대출 성장 | 금리 상승, 경기 확장 |
| XLV | 헬스케어 (Health Care) | 방어적, 경기 무관 | 경기 둔화·침체 |
| XLE | 에너지 (Energy) | 원유·천연가스 가격 연동 | 원자재 강세, 인플레이션 |
| XLI | 산업재 (Industrials) | 설비투자, 경기 선행 | 경기 확장 초·중기 |
| XLY | 임의소비재 (Cons. Discretionary) | 소비 심리 반영 | 고용 증가, 임금 상승 |
| XLP | 필수소비재 (Cons. Staples) | 방어적, 필수 수요 | 경기 둔화·침체 |
| XLU | 유틸리티 (Utilities) | 고배당, 채권 대체재 | 금리 하락, 경기 둔화 |
| XLB | 소재 (Materials) | 원자재 가격 연동 | 인플레이션, 경기 확장 |
| XLRE | 부동산 (Real Estate) | 금리 민감, 인플레 헤지 | 금리 하락 |
| XLC | 통신 (Communication Svcs) | 테크+미디어 혼합 | 광고 시장 성장 |

**섹터 로테이션 사이클 (참고)**
경기 확장 초기: XLI, XLK → 확장 후기: XLE, XLB → 침체 초기: XLV, XLP, XLU → 회복: XLF, XLY

---

### 상관관계 행렬 (Correlation Matrix)

공포지수(VIX, VVIX, SKEW)와 주요 자산(SPY, QQQ, IWM, TLT, GLD, UUP, USO) 간의 **롤링 피어슨 상관계수**를 히트맵으로 보여줍니다.

- **+1 (진한 초록)**: 두 지표가 완전히 같은 방향으로 움직임
- **0 (중간색)**: 무관계
- **−1 (진한 빨강)**: 완전히 반대 방향으로 움직임

**주요 관계 해석**

| 패턴 | 의미 |
|---|---|
| VIX↑ & SPY↓ (음의 상관) | 정상적 관계. 주가 하락 시 공포 상승 |
| VIX↑ & TLT↑ (양의 상관) | 위기 국면. 주식 팔고 미국 국채로 피신 |
| VIX↑ & GLD↑ (양의 상관) | 안전자산 선호 극대화. 달러·금 동반 강세 |
| VIX↑ & UUP↑ (양의 상관) | 달러 강세 동반. 신흥국·상품 시장 압박 |
| VIX와 모든 자산 상관 급변 | 레짐 전환 신호. 기존 헤지 전략 재검토 필요 |

> 상관관계는 **창(window)** 에 따라 크게 달라집니다. 20D는 최근 급변을, 120D는 중기 구조적 관계를 봅니다.

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
