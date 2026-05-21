// ── charts-common.js ──────────────────────────────────────────
// Shared ECharts theme tokens. Hardcoded as hex/rgba so ECharts
// (zrender) can parse them — CSS oklch() strings are NOT supported.

window.T = {
  up:      '#6dc28a',
  down:    '#d44a4a',
  text:    '#e8e8ee',
  text2:   '#b0b0c0',
  muted:   '#888',
  border:  '#2a2d3a',
  bg:      '#181b25',
  accent:  '#e3a447',
  bgHex:   '#181b25',
  heat:    ['#d44a4a','#8b3a3a','#3a2d2d','#2d3a33','#5a9a78','#6dc28a'],
  mono:    '"JetBrains Mono", ui-monospace, monospace',
  // Pre-computed rgba variants for LinearGradient area fills
  upDim:   'rgba(109, 194, 138, 0.22)',
  upFade:  'rgba(109, 194, 138, 0)',
  downDim: 'rgba(212, 74, 74, 0.22)',
  downFade:'rgba(212, 74, 74, 0)',
  fearDim: 'rgba(232, 146, 78, 0.22)',
  fearFade:'rgba(232, 146, 78, 0)',
  blueDim: 'rgba(90, 159, 212, 0.22)',
  blueFade:'rgba(90, 159, 212, 0)',
};
