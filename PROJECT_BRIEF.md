# FlowMap — Project Brief

글로벌 주식 시장의 **섹터 자금 흐름**과 **공포지수 × 자산 상관관계**를 시각화하는 웹 대시보드.
"지금 돈이 어디로 가고 있고, 시장은 얼마나 무서워하고 있나"를 한 화면에서 파악한다.

---

## 1. 목적 및 배경

- **동기**: 섹터 로테이션과 공포 지표를 결합해 시장 국면을 직관적으로 파악하고 투자 판단에 활용
- **주요 사용자**: 초기에는 본인 단독, 이후 공개 고려
- **관심 범위**: 미국 주식 시장 중심 (S&P 500 섹터 ETF 기준)
- **핵심 가치**: 여러 곳에 흩어진 데이터(섹터 흐름 + 공포 지수들)를 하나의 화면에서 통합 조회

---

## 2. 핵심 기능

### 2.1 섹터 자금 흐름 히트맵 (Feature A) ✅ 구현 완료

S&P 500 11개 섹터 ETF의 **가격 변화율 + 거래량 기반 자금 흐름**을 히트맵으로 시각화.

| 표시 항목 | 설명 | 상태 |
|---|---|---|
| 색상 강도 | 수익률 크기 (초록 = 상승, 빨강 = 하락) | ✅ |
| 기간 선택 | 1D / 5D / 1M / 3M / YTD | ✅ |
| 섹터 ETF | XLK, XLF, XLV, XLE, XLI, XLY, XLP, XLU, XLB, XLRE, XLC | ✅ |
| 자금 유출입 | 거래량 × 가격 × 방향 프록시 (실제 etf.com 데이터 대신) | ⚠️ 프록시 |
| 섹터 드릴다운 | 섹터 내 대표 종목 상위 5개 | ❌ 미구현 |

---

### 2.2 공포지수 × 자산 상관관계 뷰어 (Feature B) ✅ 구현 완료

| 지수 | 설명 | 상태 |
|---|---|---|
| VIX | S&P 500 변동성 지수 | ✅ |
| VVIX | VIX의 변동성 | ✅ |
| SKEW | 꼬리 리스크 지수 | ✅ |
| MOVE | 채권 시장 변동성 | ❌ yfinance 미지원 |
| HYG 스프레드 | HYG/LQD 비율 프록시 (z-score 포함) | ✅ |
| Put/Call Ratio | 옵션 시장 센티멘트 | ⚠️ CBOE CDN 403 차단 |

**자산**: SPY, QQQ, IWM, TLT, GLD, UUP(DXY 프록시), USO(WTI 프록시) ✅

**출력 형태**

| 기능 | 상태 |
|---|---|
| 상관관계 히트맵 행렬 (20D / 60D / 120D 선택) | ✅ |
| 시계열 오버레이 차트 (심볼 선택) | ✅ |
| 공포 급등 이후 X일 평균 수익률 통계 테이블 | ❌ 미구현 |

---

### 2.3 시장 온도계 (Feature C) ✅ 구현 완료

- 0~100 점수, 5단계 분류 (극단적 공포 / 공포 / 중립 / 탐욕 / 극단적 탐욕)
- 구성 요소: VIX 레벨(30%) + 섹터 모멘텀(25%) + 가격 모멘텀(25%) + Put/Call(20%, 현재 미수집)
- 대시보드 상단 상시 표시

---

### 2.4 텔레그램 알림 (Feature D) → Phase 2

---

## 3. Phase 1에서 추가 구현된 기능 (기획안 외)

### 3.1 한국어 / 영어 다국어 지원 ✅

- `static/js/i18n.js` — 번역 사전, `t(key)`, `sectorName(ticker)` 전역 함수
- navbar 우측 토글 버튼 (한국어 ↔ EN)
- `localStorage`로 언어 선택 유지
- 언어 전환 시 차트 캐시 데이터로 재렌더 (API 재호출 없음)
- 섹터명도 언어별 번역 적용

### 3.2 자동 갱신 / Last Updated ✅

- 브라우저에서 **5분마다** 자동 API 재호출 (페이지 리로드 없음)
- navbar에 ● 상태 점 + "Updated N분 전" 표시
- ↻ 수동 새로고침 버튼
- 서버 켜두면 스케줄러(DB 15분 갱신) + 브라우저(5분 재호출) 자동 동작

### 3.3 히스토리 페이지 (`/history`) ✅

- VIX / VVIX / SKEW 시계열 차트 (3M / 6M / 1Y 선택)
- 기준선 표시 (VIX: 20/30, SKEW: 130/150)

### 3.4 REST API 레이어 ✅

- `/api/market/temperature`
- `/api/sectors/heatmap?period=`
- `/api/sectors/summary`
- `/api/fear/correlation?window=`
- `/api/fear/timeseries/{symbol}?window=`
- `/api/fear/current`

---

## 4. 데이터 소스 현황

| 데이터 | 소스 | 상태 |
|---|---|---|
| 섹터 ETF 가격/거래량 (11종) | yfinance | ✅ 장중 15분 갱신 |
| 자산 가격 (SPY, QQQ, IWM, TLT, GLD, UUP, USO) | yfinance | ✅ |
| VIX / VVIX / SKEW | yfinance | ✅ |
| ETF 자금 유출입 | 거래량 프록시 (yfinance) | ⚠️ 방향성만 신뢰 |
| Put/Call Ratio | CBOE | ❌ CDN 403 차단 — Playwright 스크래퍼 필요 |
| MOVE 지수 | — | ❌ yfinance 미지원 — 대안 소스 필요 |
| HYG 스프레드 | yfinance (HYG/LQD 계산) | ❌ 미구현 |

---

## 5. 기술 스택

| 영역 | 선택 |
|---|---|
| 언어 | Python 3.12 |
| 웹 프레임워크 | FastAPI + Uvicorn |
| DB | SQLite (flowmap.db) |
| ORM / Migration | SQLAlchemy 2 + Alembic |
| 스케줄러 | APScheduler (AsyncIOScheduler) |
| 템플릿 | Jinja2 (SSR) |
| 차트 | Apache ECharts 5 (CDN) |
| i18n | 자체 구현 (static/js/i18n.js) |
| HTTP 클라이언트 | httpx |
| 데이터 처리 | pandas + numpy |

---

## 6. 프로젝트 구조 (현재)

```
flowmap/
├── app/
│   ├── main.py                 CLI 엔트리 (--health / --fetch / --web / --serve)
│   ├── config.py
│   ├── models.py               SectorPrice, EtfFlow, FearIndex, CrawlState
│   ├── database.py
│   ├── fetchers/
│   │   ├── yfinance_fetcher.py  섹터 ETF + 자산 + 공포지수
│   │   ├── cboe_fetcher.py      Put/Call (현재 차단)
│   │   └── etf_flow_fetcher.py  ETF 자금 흐름 프록시
│   ├── compute/
│   │   ├── sector_heatmap.py
│   │   ├── correlation.py
│   │   └── market_temp.py
│   ├── scheduler/jobs.py
│   ├── api/routes.py
│   └── web/
│       ├── views.py
│       └── templates/          base / index / sectors / fear / history
├── static/js/i18n.js
├── migrations/
├── .env / .env.example
├── requirements.txt
└── flowmap.db
```

---

## 7. 웹 UI 페이지 구성

| 경로 | 내용 | 상태 |
|---|---|---|
| `/` | 온도계 + 섹터 성과 테이블 + 공포지수 카드 | ✅ |
| `/sectors` | 섹터 히트맵 (기간 선택) + 섹터 요약 테이블 | ✅ |
| `/fear` | 상관관계 행렬 + 시계열 오버레이 | ✅ |
| `/history` | VIX / VVIX / SKEW 히스토리 차트 | ✅ |
| `/alerts` | 알림 설정 UI | Phase 2 |

---

## 8. 스케줄 (현재 동작 중)

| Job | 주기 | 비고 |
|---|---|---|
| 섹터 가격 + 공포지수 갱신 | 장중 15분 (9:30–16:15 ET, 월–금) | yfinance |
| ETF 자금 흐름 | 매일 07:00 ET | 전일 프록시 계산 |
| CBOE Put/Call | 매일 07:10 ET | 현재 차단 |
| 브라우저 자동 갱신 | 5분마다 | JS setInterval |

---

## 9. 구현 로드맵

### Phase 1 — 완료 ✅

| # | 작업 | 상태 |
|---|---|---|
| 1.1 | 스캐폴드, DB 모델, Alembic | ✅ |
| 1.2 | yfinance fetcher — 1년치 백필 | ✅ |
| 1.3 | CBOE Put/Call fetcher | ⚠️ 차단 |
| 1.4 | 섹터 히트맵 + /sectors | ✅ |
| 1.5 | 상관관계 행렬 + /fear | ✅ |
| 1.6 | 시장 온도 + 대시보드 | ✅ |
| 1.7 | ETF 자금 흐름 + 연동 | ✅ (프록시) |
| 1.8 | 스케줄러 통합 | ✅ |
| 1.9 | 한국어/영어 다국어 | ✅ (기획 외 추가) |
| 1.10 | 자동 갱신 + Last Updated | ✅ (기획 외 추가) |

### Phase 2 — 예정

| # | 작업 | 우선순위 |
|---|---|---|
| 2.1 | **HYG 크레딧 스프레드** 추가 (yfinance HYG/LQD 계산) | ✅ 완료 |
| 2.2 | **공포 급등 이후 수익률 통계** 테이블 (역발상 참고) | 높음 |
| 2.3 | **시장 breadth 지표** — 52주 고점/저점 비율, 상승 종목 비율 | 높음 |
| 2.4 | **수익률 곡선 스프레드** — 2Y/10Y 스프레드 (경기 선행 지표) | 높음 |
| 2.5 | **섹터 드릴다운** — 섹터 클릭 시 상위 10개 종목 수익률 | 중간 |
| 2.6 | **Put/Call Ratio** — Playwright 스크래퍼로 CBOE 차단 우회 | 중간 |
| 2.7 | **텔레그램 알림 봇** — VIX 임계값, 온도 단계 변경 | 중간 |
| 2.8 | **TradingView Pine Script** 인디케이터 경량 버전 배포 | 낮음 |
| 2.9 | **Watchlist** — 관심 종목 등록 후 개별 추적 | 낮음 |

---

## 10. 미해결 기술 이슈

| 이슈 | 원인 | 해결 방향 |
|---|---|---|
| CBOE Put/Call 403 | CDN 봇 차단 | Playwright headless 스크래퍼 |
| ETF 자금 흐름 정확도 낮음 | 거래량 프록시 사용 | etf.com Playwright 스크래퍼 or 유료 API |
| MOVE 지수 미수집 | yfinance 미지원 | ICE BofA MOVE via FRED API (무료) |

---

## 11. 합의된 결정 사항

- 서비스명: **FlowMap**
- nps-tracker와 별개 프로젝트
- 주식 시장 중심 (크립토 Phase 2 이후)
- 텔레그램 알림은 Phase 2
- 웹 대시보드 메인, TradingView 인디케이터 Phase 2
- DB SQLite → 규모 커지면 TimescaleDB
- 실시간 불필요 — 15분 DB 갱신 + 5분 브라우저 갱신으로 충분
- 한국어/영어 다국어 지원
