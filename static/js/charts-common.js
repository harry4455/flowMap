// ── charts-common.js ──────────────────────────────────────────
// Shared ECharts theme tokens, used across all page scripts.
// Must be loaded before any page-specific chart scripts.

(function() {
  const css = getComputedStyle(document.documentElement);
  window.T = {
    up:     css.getPropertyValue('--up').trim()     || '#6dc28a',
    down:   css.getPropertyValue('--down').trim()   || '#d44a4a',
    text:   css.getPropertyValue('--text').trim()   || '#e0e0e0',
    text2:  css.getPropertyValue('--text-2').trim() || '#c0c0c0',
    muted:  css.getPropertyValue('--muted').trim()  || '#888',
    border: css.getPropertyValue('--border').trim() || '#333',
    bg:     css.getPropertyValue('--bg').trim()     || '#181b25',
    accent: css.getPropertyValue('--accent').trim() || '#e3a447',
    bgHex:  '#181b25',
    heat:   ['#d44a4a','#8b3a3a','#3a2d2d','#2d3a33','#5a9a78','#6dc28a'],
    mono:   '"JetBrains Mono", ui-monospace, monospace',
  };
})();
