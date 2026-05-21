// ── Plain-language glossary for finance terms ─────────────────
// Each term has a label (uppercase mono header), short description,
// and an optional band scale showing typical ranges.

const GLOSSARY = {
  vix: {
    label: 'VIX',
    range: '30-day implied vol',
    desc: 'Market\'s expectation of S&P 500 volatility over the next 30 days. ' +
          'Sometimes called the "fear gauge" — it spikes when traders pay up for downside protection.',
    scale: [
      { width: 33, color: 'var(--up)',     label: '<20 calm' },
      { width: 33, color: 'var(--accent)', label: '20-30 elevated' },
      { width: 34, color: 'var(--down)',   label: '>30 stress' },
    ],
  },
  vvix: {
    label: 'VVIX',
    range: 'Vol of vol',
    desc: 'Volatility of the VIX itself. Tells you how unstable the fear gauge is. ' +
          'High VVIX = traders are unsure where vol is headed; often leads VIX moves.',
    scale: [
      { width: 33, color: 'var(--up)',     label: '<85 calm' },
      { width: 33, color: 'var(--accent)', label: '85-110' },
      { width: 34, color: 'var(--down)',   label: '>110 stressed' },
    ],
  },
  skew: {
    label: 'SKEW',
    range: 'Tail-risk premium',
    desc: 'How much extra investors pay for far-OTM puts (crash insurance) ' +
          'relative to ATM options. High SKEW = market is pricing tail risk.',
    scale: [
      { width: 33, color: 'var(--up)',     label: '<130 normal' },
      { width: 33, color: 'var(--accent)', label: '130-150' },
      { width: 34, color: 'var(--down)',   label: '>150 elevated' },
    ],
  },
  putcall: {
    label: 'PUT/CALL',
    range: 'Options ratio',
    desc: 'Daily put volume divided by call volume on equity options. ' +
          'Above 1.0 = more puts traded (defensive); below 0.7 = call-heavy (greedy).',
    scale: [
      { width: 33, color: 'var(--down)',   label: '<0.7 greed' },
      { width: 33, color: 'var(--neutral)',label: '0.7-1.0' },
      { width: 34, color: 'var(--up)',     label: '>1.0 fear' },
    ],
  },
  hyg: {
    label: 'HYG / LQD',
    range: 'Credit spread proxy',
    desc: 'Ratio of high-yield (HYG) to investment-grade (LQD) bond ETFs. ' +
          'Falling ratio = junk-bond stress; rising ratio = risk-on credit appetite.',
    scale: [
      { width: 50, color: 'var(--down)', label: 'widening (stress)' },
      { width: 50, color: 'var(--up)',   label: 'tightening (risk-on)' },
    ],
  },
  zscore: {
    label: 'Z-SCORE',
    range: 'Std deviations',
    desc: 'How many standard deviations a value is from its rolling-window mean. ' +
          '|z| > 2 is statistically unusual; > 3 is rare.',
  },
  temperature: {
    label: 'MARKET TEMP',
    range: 'Composite, 0–100',
    desc: 'Custom composite of VIX level, put/call ratio, sector momentum, and ' +
          'price momentum. Higher = warmer / more risk-on. Lower = cooler / defensive.',
    scale: [
      { width: 20, color: 'var(--down)',   label: '0-20 cold' },
      { width: 20, color: '#c4823a',       label: '20-40 cool' },
      { width: 25, color: 'var(--accent)', label: '40-65 warm' },
      { width: 20, color: '#a4c062',       label: '65-85 hot' },
      { width: 15, color: 'var(--up)',     label: '85+ overheat' },
    ],
  },
  flow: {
    label: 'FLOW (EST.)',
    range: 'Daily net inflow',
    desc: 'Estimated dollar volume flowing into / out of a sector ETF, ' +
          'derived from price × volume × directional impulse. Positive = accumulation.',
  },
  breadth: {
    label: 'BREADTH',
    range: '% participating',
    desc: 'Percentage of sectors trading above their 50-day moving average. ' +
          'High breadth = broad rally; low breadth = narrow leadership.',
  },
  correlation: {
    label: 'PEARSON r',
    range: '−1 to +1',
    desc: 'Rolling correlation between daily returns. +1 = perfectly synced, ' +
          '0 = unrelated, −1 = perfectly opposite. High cross-asset r = regime convergence.',
  },
};

// ── Tooltip floater ──────────────────────────────────────────
(function setupTooltips() {
  const floater = document.createElement('div');
  floater.className = 'tooltip-floater';
  document.body.appendChild(floater);

  let activeTerm = null;

  function show(el, term) {
    const def = GLOSSARY[term];
    if (!def) return;

    const scaleHtml = def.scale ?
      `<div class="scale">${def.scale.map(s =>
        `<span style="flex:${s.width}; background:${s.color};" title="${s.label}"></span>`
      ).join('')}</div>` : '';

    floater.innerHTML = `
      <div class="ttl">
        <span>${def.label}</span>
        ${def.range ? `<span class="range">${def.range}</span>` : ''}
      </div>
      <div class="desc">${def.desc}</div>
      ${scaleHtml}
    `;
    // Position above the element, fall back to below if no room
    const rect = el.getBoundingClientRect();
    const ttRect = floater.getBoundingClientRect();
    const margin = 10;
    let top = rect.top - ttRect.height - margin;
    let left = rect.left + rect.width / 2 - ttRect.width / 2;
    if (top < 8) top = rect.bottom + margin;
    left = Math.max(8, Math.min(left, window.innerWidth - ttRect.width - 8));
    floater.style.top = top + 'px';
    floater.style.left = left + 'px';
    floater.classList.add('on');
    activeTerm = el;
  }

  function hide() {
    floater.classList.remove('on');
    activeTerm = null;
  }

  document.addEventListener('mouseover', e => {
    const el = e.target.closest('[data-term]');
    if (el && el !== activeTerm) show(el, el.dataset.term);
  });
  document.addEventListener('mouseout', e => {
    const el = e.target.closest('[data-term]');
    if (el && el === activeTerm) hide();
  });
  document.addEventListener('scroll', hide, true);
})();
