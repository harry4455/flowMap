// ── narrative.js (server-compatible version) ─────────────────
// Generates the "Today's story" bar.
// renderNarrative(el, { sectors, fear, temp }) — calls /api/narrative
// first, falls back to deterministic synthesis if the endpoint isn't set up.

async function renderNarrative(rootEl, data) {
  if (!rootEl) return;
  rootEl.classList.add('loading');
  rootEl.innerHTML = `<div class="glyph">✱</div><div class="body" data-i18n="narrative.loading">Reading the tape…</div>`;

  const { sectors = [], fear = [], temp = {} } = data || {};
  if (!sectors.length && !fear.length) {
    rootEl.classList.remove('loading');
    rootEl.innerHTML = `<div class="glyph">✱</div><div class="body muted" data-i18n="narrative.nodata">—</div>`;
    return;
  }

  const now = new Date();
  const stamp = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', timeZoneName:'short' });

  let text = null;

  // 1. Try the server-side /api/narrative endpoint (Flask route, see README)
  try {
    const res = await Promise.race([
      fetch('/api/narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectors, fear, temp }),
      }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000)),
    ]);
    if (res.ok) {
      const d = await res.json();
      text = d.text || d.narrative || null;
    }
  } catch (e) {
    // silent — fall through to deterministic
  }

  // 2. Deterministic fallback (always works, no API needed)
  if (!text) text = _buildFallback(sectors, fear, temp);

  rootEl.classList.remove('loading');
  rootEl.innerHTML = `
    <div class="glyph">✱</div>
    <div class="body">${text}</div>
    <div class="stamp">SYNTH · ${stamp}</div>
  `;
}

function _buildFallback(sectors, fear, temp) {
  const sorted = [...sectors].sort((a,b) => (b.ret_1m||0) - (a.ret_1m||0));
  const leader  = sorted[0], laggard = sorted[sorted.length - 1];
  const above   = sectors.filter(s => (s.ret_1m||0) > 0).length;
  const breadth = Math.round((above / sectors.length) * 100);
  const vix     = fear.find(f => f.symbol === 'VIX' || f.symbol === 'vix');
  const vixDir  = vix && (vix.change || 0) < 0 ? 'easing' : 'lifting';
  const vixCls  = vix && (vix.change || 0) < 0 ? 'up' : 'down';
  const tone    = temp.level ? temp.level.toLowerCase() : 'neutral';
  const breadthAdj = breadth >= 60 ? 'broad' : breadth >= 40 ? 'mixed' : 'narrow';

  let out = `Markets <strong>${tone}</strong>`;
  if (vix) {
    out += ` — <strong data-term="vix">VIX</strong> ${vixDir} to <span class="num">${vix.value}</span>`;
    if (vix.change != null) out += ` <span class="num ${vixCls}">${vix.change > 0 ? '+' : ''}${vix.change}</span>`;
    out += '.';
  }
  if (leader) {
    const lCls = (leader.ret_1m||0) > 0 ? 'up' : 'down';
    out += ` <strong>${leader.name}</strong> leading at <span class="num ${lCls}">${(leader.ret_1m||0) > 0 ? '+' : ''}${(leader.ret_1m||0).toFixed(2)}%</span>`;
  }
  if (laggard && laggard !== leader) {
    const lgCls = (laggard.ret_1m||0) > 0 ? 'up' : 'down';
    out += `, <strong>${laggard.name}</strong> lagging <span class="num ${lgCls}">${(laggard.ret_1m||0) > 0 ? '+' : ''}${(laggard.ret_1m||0).toFixed(2)}%</span>.`;
  }
  if (sectors.length) {
    out += ` Breadth <span class="num">${breadth}%</span> — ${breadthAdj} participation.`;
  }
  return out;
}
