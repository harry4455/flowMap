// ── anomaly.js (server-compatible version) ─────────────────
// initAnomalies(sectors, fear) — wires up data-anomaly glows.
// Pass arrays from server JSON injection.

const ANOMALY_THRESHOLDS = {
  sector_1d: 1.0,
  sector_1m: 3.5,
};

function initAnomalies(sectors, fear) {
  clearAnomalies();

  // Sector rows (Dashboard + Sectors page)
  if (Array.isArray(sectors)) {
    document.querySelectorAll('[data-ticker]').forEach(row => {
      const s = sectors.find(x => x.ticker === row.dataset.ticker);
      if (!s) return;
      const a1d = _classify(s.ret_1d, ANOMALY_THRESHOLDS.sector_1d);
      const a1m = _classify(s.ret_1m, ANOMALY_THRESHOLDS.sector_1m);
      const a = a1d || a1m;
      if (a) row.setAttribute('data-anomaly', a);
    });
  }

  // Fear cards
  if (Array.isArray(fear)) {
    document.querySelectorAll('.fear-card').forEach((card, i) => {
      const f = fear[i]; if (!f) return;
      const chg = f.change || 0;
      // |change| > 10% of value = notable
      const notable = Math.abs(chg) > Math.abs(f.value || 1) * 0.08;
      if (notable) {
        const anomaly = chg > 0 ? 'down' : 'up'; // VIX up = bearish
        card.setAttribute('data-anomaly', anomaly);
        _addBadge(card, anomaly === 'up' ? 'EASING' : 'RISING');
      }
    });
  }

  // Stat cards with data-anomaly-target
  document.querySelectorAll('[data-anomaly-target]').forEach(el => {
    el.setAttribute('data-anomaly', el.dataset.anomalyTarget);
    _addBadge(el, el.dataset.anomalyTarget === 'up' ? 'OUTPERF' : 'UNDERPERF');
  });
}

function clearAnomalies() {
  document.querySelectorAll('[data-anomaly]').forEach(el => el.removeAttribute('data-anomaly'));
  document.querySelectorAll('.anomaly-badge').forEach(el => el.remove());
}

function _classify(value, threshold) {
  if (value == null || Math.abs(value) < threshold) return null;
  return value > 0 ? 'up' : 'down';
}

function _addBadge(card, text) {
  if (card.querySelector('.anomaly-badge')) return;
  const b = document.createElement('span');
  b.className = 'anomaly-badge';
  b.textContent = text;
  b.style.cssText = 'position:absolute;top:12px;right:12px;';
  card.appendChild(b);
}
