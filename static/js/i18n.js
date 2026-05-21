// ── i18n.js (updated with new keys) ──────────────────────────

const TRANSLATIONS = {
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.sectors':   'Sectors',
    'nav.fear':      'Fear & Correlation',
    'nav.history':   'History',

    'temp.title':           'Market Temperature',
    'temp.composite':       'Composite · 4 factors',
    'temp.nodata':          'Waiting for data',
    'temp.vix':             'VIX Level',
    'temp.put_call':        'Put/Call Ratio',
    'temp.sector_momentum': 'Sector Momentum',
    'temp.price_momentum':  'Price Momentum',

    'sector.perf_title':       'Sector Performance',
    'sector.full_heatmap':     'Full heatmap →',
    'sectors.subtitle_short':  '11 SPDR sectors · daily flow',
    'sectors.page_title':      'Sector Flows',
    'sectors.subtitle':        'Daily returns · estimated flows',
    'sectors.settle':          'Flows settle 15:00 ET',
    'sectors.period':          'Period:',
    'sectors.summary':         'Sector Summary',
    'sectors.sorted':          'Sorted by 1M return',
    'sectors.leader':          'Leader · 1M',
    'sectors.laggard':         'Laggard · 1M',
    'sectors.breadth':         'Breadth · above 50D MA',
    'th.sector': 'Sector', 'th.etf': 'ETF', 'th.close': 'Close',
    'th.1d': '1D', 'th.5d': '5D', 'th.1m': '1M', 'th.flow': 'Flow (est.)',

    'heatmap.title': '20-Day Heatmap',
    'heatmap.sub':   'Returns by sector × day',

    'fear.page_title':      'Fear Index × Asset Correlation',
    'fear.subtitle':        'Pearson r — rolling window',
    'fear.rolling':         'Rolling-window Pearson r',
    'fear.corr_title':      'Correlation Matrix',
    'fear.ts_title':        'Time Series',
    'fear.ts_sub':          'Daily close · symbol picker',
    'fear.spread_title':    'HYG Credit Spread',
    'fear.spread_subtitle': 'HYG/LQD ratio · proxy for high-yield risk',
    'fear.spread_chart':    'HYG/LQD Ratio',
    'fear.spread_nodata':   'No data — fetch HYG/LQD first',
    'fear.spread_stress':   'Stress',
    'fear.spread_widening': 'Widening',
    'fear.spread_tight':    'Tight',
    'fear.spread_tightening': 'Tightening',
    'fear.spread_neutral':  'Neutral',

    'history.page_title':  'Market Temperature History',
    'history.subtitle':    'VIX · VVIX · SKEW over time — regime context',
    'history.vix_title':   'VIX History',
    'history.vix_sub':     'Reference lines at 20 · 30',
    'history.vvix_title':  'VVIX',
    'history.vvix_sub':    'Volatility of VIX',
    'history.skew_title':  'SKEW',
    'history.skew_sub':    'Tail-risk premium',
    'history.vix_current': 'VIX · Current',
    'history.vix_avg':     'VIX · 3M Avg',
    'history.days_above':  'Days VIX > 20',
    'history.regime':      'Regime',
    'history.last':        'last',
    'history.calm':        '≤20 Calm',
    'history.elevated':    '20–30 Elevated',
    'history.stress':      '>30 Stress',

    'narrative.loading': 'Reading the tape…',
    'narrative.nodata':  '—',

    'empty.waiting_title': 'Waiting for data',
    'empty.waiting_desc':  'Run fetch to populate this panel.',

    'common.nodata':    'No data',
    'common.loading':   'Loading…',
    'common.error':     'Error',
    'refresh.updated':  'Updated',
    'refresh.just_now': 'just now',
    'refresh.min_ago':  'min ago',
  },
  ko: {
    'nav.dashboard': '대시보드',
    'nav.sectors':   '섹터 흐름',
    'nav.fear':      '공포 & 상관관계',
    'nav.history':   '히스토리',

    'temp.title':           '시장 온도계',
    'temp.composite':       '복합 지표 · 4가지 요소',
    'temp.nodata':          '데이터 대기 중',
    'temp.vix':             'VIX 레벨',
    'temp.put_call':        '풋/콜 비율',
    'temp.sector_momentum': '섹터 모멘텀',
    'temp.price_momentum':  '가격 모멘텀',

    'sector.perf_title':      '섹터 성과',
    'sector.full_heatmap':    '전체 히트맵 →',
    'sectors.subtitle_short': '11개 SPDR 섹터 · 일간 자금흐름',
    'sectors.page_title':     '섹터 흐름',
    'sectors.subtitle':       '일간 수익률 · 추정 자금흐름',
    'sectors.settle':         '자금흐름 확정 15:00 ET',
    'sectors.period':         '기간:',
    'sectors.summary':        '섹터 요약',
    'sectors.sorted':         '1개월 수익률 기준 정렬',
    'sectors.leader':         '선두 · 1M',
    'sectors.laggard':        '후미 · 1M',
    'sectors.breadth':        '폭 · 50일 이동평균 초과',
    'th.sector': '섹터', 'th.etf': 'ETF', 'th.close': '종가',
    'th.1d': '1일', 'th.5d': '5일', 'th.1m': '1개월', 'th.flow': '자금흐름 (추정)',

    'heatmap.title': '20일 히트맵',
    'heatmap.sub':   '섹터 × 일별 수익률',

    'fear.page_title':      '공포지수 × 자산 상관관계',
    'fear.subtitle':        '피어슨 r — 롤링 윈도우',
    'fear.rolling':         '롤링 윈도우 피어슨 r',
    'fear.corr_title':      '상관관계 행렬',
    'fear.ts_title':        '시계열',
    'fear.ts_sub':          '일간 종가 · 종목 선택',
    'fear.spread_title':    'HYG 크레딧 스프레드',
    'fear.spread_subtitle': 'HYG/LQD 비율 · 하이일드 위험 프록시',
    'fear.spread_chart':    'HYG/LQD 비율',
    'fear.spread_nodata':   '데이터 없음',
    'fear.spread_stress':   '스트레스',
    'fear.spread_widening': '스프레드 확대',
    'fear.spread_tight':    '타이트',
    'fear.spread_tightening': '스프레드 축소',
    'fear.spread_neutral':  '중립',

    'history.page_title':  '시장 온도 히스토리',
    'history.subtitle':    'VIX · VVIX · SKEW 추이 — 레짐 컨텍스트',
    'history.vix_title':   'VIX 히스토리',
    'history.vix_sub':     '기준선 20 · 30',
    'history.vvix_title':  'VVIX',
    'history.vvix_sub':    'VIX의 변동성',
    'history.skew_title':  'SKEW',
    'history.skew_sub':    '테일 리스크 프리미엄',
    'history.vix_current': 'VIX · 현재',
    'history.vix_avg':     'VIX · 3개월 평균',
    'history.days_above':  'VIX > 20 일수',
    'history.regime':      '레짐',
    'history.last':        '최근',
    'history.calm':        '≤20 안정',
    'history.elevated':    '20–30 경계',
    'history.stress':      '>30 스트레스',

    'narrative.loading': '테이프 읽는 중…',
    'narrative.nodata':  '—',

    'empty.waiting_title': '데이터 대기 중',
    'empty.waiting_desc':  'fetch를 실행하면 여기에 데이터가 표시됩니다.',

    'common.nodata':    '데이터 없음',
    'common.loading':   '로딩 중…',
    'common.error':     '오류',
    'refresh.updated':  '업데이트',
    'refresh.just_now': '방금',
    'refresh.min_ago':  '분 전',
  },
};

const SECTOR_NAMES = {
  en: { XLK:'Technology', XLF:'Financials', XLV:'Health Care', XLE:'Energy',
        XLI:'Industrials', XLY:'Consumer Disc.', XLP:'Consumer Staples',
        XLU:'Utilities', XLB:'Materials', XLRE:'Real Estate', XLC:'Communication' },
  ko: { XLK:'기술', XLF:'금융', XLV:'헬스케어', XLE:'에너지',
        XLI:'산업재', XLY:'임의소비재', XLP:'필수소비재',
        XLU:'유틸리티', XLB:'소재', XLRE:'부동산', XLC:'커뮤니케이션' },
};

let currentLang = localStorage.getItem('flowmap_lang') || 'en';

function t(key) {
  return TRANSLATIONS[currentLang]?.[key] ?? TRANSLATIONS['en'][key] ?? key;
}

function sectorName(ticker) {
  return SECTOR_NAMES[currentLang]?.[ticker] ?? ticker;
}

function applyLang() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  const btn = document.getElementById('lang-toggle');
  if (btn) btn.textContent = currentLang === 'ko' ? 'EN' : '한국어';
  document.documentElement.lang = currentLang === 'ko' ? 'ko' : 'en';
}

function toggleLang() {
  currentLang = currentLang === 'en' ? 'ko' : 'en';
  localStorage.setItem('flowmap_lang', currentLang);
  applyLang();
  document.dispatchEvent(new CustomEvent('langchange'));
}
