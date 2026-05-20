const TRANSLATIONS = {
  en: {
    'nav.dashboard':   'Dashboard',
    'nav.sectors':     'Sectors',
    'nav.fear':        'Fear & Correlation',
    'nav.history':     'History',

    'temp.title':      'Market Temperature',
    'temp.nodata':     'No data — run fetch first',
    'temp.vix':        'VIX Level',
    'temp.put_call':   'Put/Call Ratio',
    'temp.sector_momentum': 'Sector Momentum',
    'temp.price_momentum':  'Price Momentum',

    'sector.perf_title': 'Sector Performance',
    'sector.full_heatmap': 'Full heatmap →',
    'th.sector': 'Sector', 'th.etf': 'ETF', 'th.close': 'Close',
    'th.1d': '1D', 'th.5d': '5D', 'th.1m': '1M', 'th.flow': 'Flow (est.)',

    'sectors.page_title': 'Sector Heatmap',
    'sectors.subtitle':   'Daily returns by sector — color intensity = magnitude',
    'sectors.period':     'Period:',
    'sectors.summary':    'Sector Summary',

    'fear.page_title': 'Fear Index × Asset Correlation',
    'fear.subtitle':   'Pearson r — rolling window',
    'fear.corr_title': 'Correlation Matrix',
    'fear.ts_title':   'Time Series',
    'fear.spread_title':    'HYG Credit Spread (Proxy)',
    'fear.spread_subtitle': 'HYG/LQD ratio · z-score vs window',
    'fear.spread_ratio':    'HYG/LQD Ratio',
    'fear.spread_nodata':   'No data — fetch HYG/LQD first',
    'fear.spread_stress':   'Stress',
    'fear.spread_widening': 'Widening',
    'fear.spread_tight':    'Tight',
    'fear.spread_tightening': 'Tightening',
    'fear.spread_neutral':  'Neutral',

    'history.page_title': 'Market Temperature History',
    'history.subtitle':   'VIX · VVIX · SKEW over time',
    'history.vix_title':  'VIX History',
    'history.vvix_title': 'VVIX (Volatility of VIX)',
    'history.skew_title': 'SKEW Index',

    'common.nodata':   'No data',
    'common.loading':  'Loading…',
    'common.error':    'Error',
    'refresh.updated': 'Updated',
    'refresh.just_now': 'just now',
    'refresh.min_ago':  'min ago',
  },
  ko: {
    'nav.dashboard':   '대시보드',
    'nav.sectors':     '섹터 흐름',
    'nav.fear':        '공포 & 상관관계',
    'nav.history':     '히스토리',

    'temp.title':      '시장 온도계',
    'temp.nodata':     '데이터 없음 — fetch를 먼저 실행하세요',
    'temp.vix':        'VIX 레벨',
    'temp.put_call':   '풋/콜 비율',
    'temp.sector_momentum': '섹터 모멘텀',
    'temp.price_momentum':  '가격 모멘텀',

    'sector.perf_title': '섹터 성과',
    'sector.full_heatmap': '전체 히트맵 →',
    'th.sector': '섹터', 'th.etf': 'ETF', 'th.close': '종가',
    'th.1d': '1일', 'th.5d': '5일', 'th.1m': '1개월', 'th.flow': '자금흐름 (추정)',

    'sectors.page_title': '섹터 히트맵',
    'sectors.subtitle':   '섹터별 일간 수익률 — 색상 강도 = 변동 크기',
    'sectors.period':     '기간:',
    'sectors.summary':    '섹터 요약',

    'fear.page_title': '공포지수 × 자산 상관관계',
    'fear.subtitle':   '피어슨 r — 롤링 윈도우',
    'fear.corr_title': '상관관계 행렬',
    'fear.ts_title':   '시계열',
    'fear.spread_title':    'HYG 크레딧 스프레드 (프록시)',
    'fear.spread_subtitle': 'HYG/LQD 비율 · 윈도우 대비 z-score',
    'fear.spread_ratio':    'HYG/LQD 비율',
    'fear.spread_nodata':   '데이터 없음 — HYG/LQD를 먼저 fetch하세요',
    'fear.spread_stress':   '스트레스',
    'fear.spread_widening': '스프레드 확대',
    'fear.spread_tight':    '타이트',
    'fear.spread_tightening': '스프레드 축소',
    'fear.spread_neutral':  '중립',

    'history.page_title': '시장 온도 히스토리',
    'history.subtitle':   'VIX · VVIX · SKEW 추이',
    'history.vix_title':  'VIX 히스토리',
    'history.vvix_title': 'VVIX (VIX의 변동성)',
    'history.skew_title': 'SKEW 지수',

    'common.nodata':   '데이터 없음',
    'common.loading':  '로딩 중…',
    'common.error':    '오류',
    'refresh.updated': '업데이트',
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
