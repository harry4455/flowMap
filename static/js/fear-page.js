// ── fear-page.js ───────────────────────────────────────────
// Module-level state (persists across initFearPage re-calls)
let _spreadWindow = 90, _corrWindow = 20, _tsSymbol = 'VIX', _tsWindow = 90;
let _listenersAttached = false;

// ── Credit spread ─────────────────────────────────────────
function loadSpread(w) {
  _spreadWindow = w;
  const chartEl = document.getElementById('credit-chart-big');
  if (!chartEl) return;

  fetch('/api/fear/credit_spread?window=' + w)
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(d => {
      if (!d || d.status === 'no_data' || d.status === 'missing_data') return;

      const valEl = document.getElementById('spread-big-value');
      if (valEl) valEl.textContent = d.current != null ? d.current.toFixed(4) : '—';

      const zEl = document.getElementById('spread-big-zscore');
      if (zEl && d.zscore != null) {
        const z = d.zscore, cls = z < -0.5 ? 'up' : z > 0.5 ? 'down' : 'muted';
        zEl.innerHTML = `<span class="${cls}">z = ${z > 0 ? '+' : ''}${z}</span> · vs ${w}D`;
      }

      const labelEl = document.getElementById('spread-big-label');
      if (labelEl && d.label) {
        const lm = { Stress:'Stress', Widening:'Widening', Tight:'Tight', Tightening:'Tightening', Neutral:'Neutral' };
        labelEl.textContent = lm[d.label] || d.label;
        labelEl.className = 'regime-label ' + (
          d.label === 'Tightening' || d.label === 'Tight' ? 'up' :
          d.label === 'Stress'     || d.label === 'Widening' ? 'down' : 'muted'
        );
      }

      if (!d.dates?.length) return;
      const chart = chartEl._chart || echarts.init(chartEl);
      chartEl._chart = chart;
      const mean = d.values.reduce((a, b) => a + b, 0) / d.values.length;
      chart.setOption({
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis', backgroundColor: '#1a1d27', borderColor: '#2a2d3a',
          textStyle: { color: '#e0e0e0', fontFamily: T.mono, fontSize: 12 },
          formatter: p => `${d.dates[p[0].dataIndex]}<br/>HYG/LQD: <b>${p[0].value.toFixed(4)}</b>`,
        },
        grid: { top: 12, right: 16, bottom: 28, left: 56 },
        xAxis: {
          type: 'category', data: d.dates,
          axisLine: { lineStyle: { color: T.border } }, axisTick: { show: false },
          axisLabel: { color: T.muted, fontSize: 10, fontFamily: T.mono,
            formatter: v => v.slice(5), interval: Math.max(0, Math.floor(d.dates.length / 6) - 1) },
          splitLine: { show: false },
        },
        yAxis: {
          type: 'value', scale: true, axisLine: { show: false }, axisTick: { show: false },
          axisLabel: { color: T.muted, fontSize: 10, fontFamily: T.mono },
          splitLine: { lineStyle: { color: T.border, type: 'dashed', opacity: .5 } },
        },
        series: [{
          type: 'line', data: d.values, smooth: false, symbol: 'none',
          lineStyle: { width: 1.6, color: T.up },
          areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: T.upDim },
            { offset: 1, color: T.upFade },
          ])},
          markLine: {
            silent: true, symbol: 'none',
            lineStyle: { type: 'dashed', color: T.muted, opacity: .6 },
            label: { color: T.muted, fontSize: 10, fontFamily: T.mono, formatter: 'mean', position: 'end' },
            data: [{ yAxis: +mean.toFixed(4) }],
          },
        }],
      }, true);
      if (!chartEl._observer) {
        chartEl._observer = new ResizeObserver(() => chart.resize());
        chartEl._observer.observe(chartEl);
      }
    })
    .catch(e => console.warn('loadSpread error:', e));
}

// ── Correlation matrix ────────────────────────────────────
function loadCorr(w) {
  _corrWindow = w;
  const el = document.getElementById('corr-chart');
  if (!el) return;

  fetch('/api/fear/correlation?window=' + w)
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(d => {
      if (!d?.symbols?.length) return;
      const chart = el._chart || echarts.init(el);
      el._chart = chart;
      const n = d.symbols.length, data = [];
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++)
          data.push([j, i, d.matrix[i][j]]);
      chart.setOption({
        backgroundColor: 'transparent',
        tooltip: {
          backgroundColor: '#1a1d27', borderColor: '#2a2d3a',
          textStyle: { color: '#e0e0e0', fontFamily: T.mono, fontSize: 12 },
          formatter: p => `<b>${d.symbols[p.data[1]]}</b> × <b>${d.symbols[p.data[0]]}</b><br/>r = <b>${p.data[2]?.toFixed(2) ?? 'n/a'}</b>`,
        },
        grid: { top: 12, right: 16, bottom: 36, left: 56 },
        xAxis: { type: 'category', data: d.symbols, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: T.muted, fontSize: 11, fontFamily: T.mono }, splitLine: { show: false } },
        yAxis: { type: 'category', data: d.symbols, inverse: true, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: T.text2, fontSize: 11, fontFamily: T.mono }, splitLine: { show: false } },
        visualMap: { min: -1, max: 1, show: false, inRange: { color: ['#d44a4a','#6e3838','#2a2d3a','#356755','#6dc28a'] } },
        series: [{
          type: 'heatmap', data,
          label: { show: true, formatter: p => (p.data[2] ?? 0).toFixed(2).replace(/^0/, '').replace(/^-0/, '-'), fontSize: 10, color: '#e8e8e8', fontFamily: T.mono },
          itemStyle: { borderRadius: 2, borderColor: T.bgHex, borderWidth: 1.5 },
          emphasis: { itemStyle: { borderColor: '#e0e0e0', borderWidth: 1 } },
        }],
      }, true);
      if (!el._observer) {
        el._observer = new ResizeObserver(() => chart.resize());
        el._observer.observe(el);
      }
    })
    .catch(e => console.warn('loadCorr error:', e));
}

// ── Time series ───────────────────────────────────────────
function loadTs(sym, w) {
  _tsSymbol = sym;
  _tsWindow = w;
  const el = document.getElementById('ts-chart');
  if (!el) return;

  fetch(`/api/fear/timeseries/${sym}?window=${w}`)
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(d => {
      if (!d?.dates?.length) return;
      const chart = el._chart || echarts.init(el);
      el._chart = chart;
      const isFear = ['VIX','VVIX','SKEW','PUT_CALL'].includes(sym);
      const stroke   = isFear ? '#e8924e' : '#5a9fd4';
      const strokeDim  = isFear ? T.fearDim  : T.blueDim;
      const strokeFade = isFear ? T.fearFade : T.blueFade;
      chart.setOption({
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis', backgroundColor: '#1a1d27', borderColor: '#2a2d3a',
          textStyle: { color: '#e0e0e0', fontFamily: T.mono, fontSize: 12 },
          axisPointer: { type: 'cross', lineStyle: { color: T.border, type: 'dashed' } },
        },
        grid: { top: 20, right: 20, bottom: 32, left: 56 },
        xAxis: { type: 'category', data: d.dates, axisLine: { lineStyle: { color: T.border } }, axisTick: { show: false }, axisLabel: { color: T.muted, fontSize: 10, fontFamily: T.mono, formatter: v => v.slice(5) }, splitLine: { show: false } },
        yAxis: { type: 'value', scale: true, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: T.muted, fontSize: 10, fontFamily: T.mono }, splitLine: { lineStyle: { color: T.border, type: 'dashed', opacity: .5 } } },
        series: [{
          type: 'line', data: d.values, smooth: false, symbol: 'none',
          lineStyle: { width: 1.6, color: stroke },
          areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: strokeDim },
            { offset: 1, color: strokeFade },
          ])},
        }],
      }, true);
      if (!el._observer) {
        el._observer = new ResizeObserver(() => chart.resize());
        el._observer.observe(el);
      }
    })
    .catch(e => console.warn('loadTs error:', e));
}

// ── Fear sparklines (re-called on server data refresh) ────
function initFearPage(fear) {
  if (Array.isArray(fear)) {
    fear.forEach((f, i) => {
      const el = document.getElementById('fear-spark-' + i);
      if (!el) return;
      const existing = echarts.getInstanceByDom(el);
      const chart = existing || echarts.init(el, null, { renderer: 'svg' });
      let r = i * 17 + 3, v = f.value || 50;
      const data = Array.from({ length: 30 }, () => {
        r = (r*9301+49297)%233280; v += (r/233280-.5)*(v*0.02); return +v.toFixed(2);
      });
      const down = (f.change || 0) < 0;
      const stroke    = down ? T.up : T.down;
      const strokeDim = down ? 'rgba(109, 194, 138, 0.28)' : 'rgba(212, 74, 74, 0.28)';
      chart.setOption({
        grid: { top:0, right:0, bottom:0, left:0 },
        xAxis: { type:'category', show:false, data:data.map((_,x)=>x) },
        yAxis: { type:'value', show:false, scale:true },
        series: [{ type:'line', data, smooth:true, symbol:'none',
          lineStyle: { width:1.4, color:stroke },
          areaStyle: { color:new echarts.graphic.LinearGradient(0,0,0,1,[
            {offset:0, color:strokeDim},
            {offset:1, color: down ? T.upFade : T.downFade}
          ])},
        }],
      }, true);

      const ranges = { VIX:[10,35], VVIX:[70,130], SKEW:[110,160] };
      const key = (f.symbol||'').toUpperCase().replace('/','').replace(' ','');
      const rng = ranges[key] || [v*0.7, v*1.3];
      const pct = Math.max(5, Math.min(95, ((f.value-rng[0])/(rng[1]-rng[0]))*100));
      const marker = document.getElementById('fear-marker-' + i);
      if (marker) marker.style.left = pct + '%';
    });
  }

  // Initial data loads (only fire if not already loaded)
  loadSpread(_spreadWindow);
  loadCorr(_corrWindow);
  loadTs(_tsSymbol, _tsWindow);

  // Register event listeners once
  if (!_listenersAttached) {
    _listenersAttached = true;

    document.getElementById('spread-tabs')?.addEventListener('click', e => {
      const btn = e.target.closest('button'); if (!btn) return;
      document.querySelectorAll('#spread-tabs button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadSpread(+btn.dataset.w);
    });

    document.getElementById('corr-tabs')?.addEventListener('click', e => {
      const btn = e.target.closest('button'); if (!btn) return;
      document.querySelectorAll('#corr-tabs button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadCorr(+btn.dataset.w);
    });

    document.getElementById('ts-tabs')?.addEventListener('click', e => {
      const btn = e.target.closest('button'); if (!btn) return;
      document.querySelectorAll('#ts-tabs button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadTs(_tsSymbol, +btn.dataset.w);
    });

    document.getElementById('ts-symbol')?.addEventListener('change', e => {
      loadTs(e.target.value, _tsWindow);
    });
  }
}
