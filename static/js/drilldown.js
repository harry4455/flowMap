// ── drilldown.js (server-compatible version) ─────────────────
// setupDrilldown(sectors) — wires up sector row click → inline expand.
// Pass sectors array from SERVER_SECTORS injection.

function setupDrilldown(sectors) {
  const list = document.getElementById('sector-list');
  if (!list) return;

  // Inject styles once
  if (!document.getElementById('drilldown-styles')) {
    const style = document.createElement('style');
    style.id = 'drilldown-styles';
    style.textContent = `
      .sector-list .row .chev { position:absolute; right:16px; top:50%; transform:translateY(-50%); color:var(--faint); font-family:var(--mono); font-size:10px; opacity:0; transition:opacity .15s,transform .15s; }
      .sector-list .row:hover .chev { opacity:1; }
      .sector-list .row.open .chev { opacity:1; transform:translateY(-50%) rotate(90deg); color:var(--accent); }
      .sector-list .drill { background:var(--bg-deep); border-bottom:1px solid var(--border); overflow:hidden; max-height:0; transition:max-height .25s ease-out; }
      .sector-list .drill.open { max-height:320px; }
      .sector-list .drill-inner { padding:18px 20px; display:grid; grid-template-columns:1fr 1.3fr; gap:24px; }
      .sector-list .drill .dlbl { font-size:10px; text-transform:uppercase; letter-spacing:0.10em; color:var(--muted); margin-bottom:6px; }
      .sector-list .drill .holdings { display:grid; gap:8px; }
      .sector-list .drill .holding { display:grid; grid-template-columns:32px 1fr 56px 60px; gap:10px; align-items:center; padding:8px 10px; background:var(--surface); border:1px solid var(--border); border-radius:6px; font-size:12px; }
      .sector-list .drill .holding .h-chip { width:28px; height:22px; display:grid; place-items:center; background:var(--bg-deep); border:1px solid var(--border); border-radius:4px; font-family:var(--mono); font-size:9px; font-weight:600; color:var(--text-2); }
      .sector-list .drill .holding .h-w  { text-align:right; font-family:var(--mono); font-size:11px; color:var(--muted); }
      .sector-list .drill .holding .h-r  { text-align:right; font-family:var(--mono); font-size:11px; }
      .sector-list .drill .chart-wrap { background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:12px; }
      .sector-list .drill .chart-wrap .chead { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:8px; }
      .sector-list .drill .ds-chart { height:180px; }
      @media (max-width:800px) { .sector-list .drill-inner { grid-template-columns:1fr; } }
    `;
    document.head.appendChild(style);
  }

  list.querySelectorAll('.row').forEach(row => {
    if (!row.querySelector('.chev')) {
      const c = document.createElement('span'); c.className='chev'; c.textContent='▸';
      row.appendChild(c);
    }
    row.addEventListener('click', () => _toggleDrill(row, sectors));
  });
}

function _toggleDrill(row, sectors) {
  const ticker = row.dataset.ticker;
  const existing = row.nextElementSibling?.classList.contains('drill') ? row.nextElementSibling : null;
  document.querySelectorAll('.sector-list .drill.open').forEach(d => {
    d.classList.remove('open');
    d.previousElementSibling?.classList.remove('open');
    setTimeout(() => { if (!d.classList.contains('open')) d.remove(); }, 260);
  });
  if (existing) return;

  const drill = document.createElement('div');
  drill.className = 'drill';
  drill.innerHTML = _drillHTML(ticker, sectors);
  row.after(drill);
  row.classList.add('open');
  requestAnimationFrame(() => drill.classList.add('open'));
  setTimeout(() => _renderDrillChart(drill, ticker, sectors), 60);
}

function _drillHTML(ticker, sectors) {
  const s = (sectors || []).find(x => x.ticker === ticker);
  const holdings = (window.TOP_HOLDINGS || {})[ticker] || [];
  const holdingsHtml = holdings.map(h => {
    const rc = (h.ret||0) > 0 ? 'up' : (h.ret||0) < 0 ? 'down' : 'muted';
    return `<div class="holding">
      <span class="h-chip">${h.ticker}</span>
      <span>${h.name}</span>
      <span class="h-w">${h.weight}%</span>
      <span class="h-r ${rc}">${(h.ret||0) > 0 ? '+' : ''}${(h.ret||0).toFixed(2)}%</span>
    </div>`;
  }).join('') || '<div style="color:var(--muted);font-size:12px;padding:8px 0;">Holdings data not available</div>';

  const close  = s?.close ? `$${s.close.toFixed(2)}` : '—';
  const retCls = (s?.ret_1m||0) > 0 ? 'up' : 'down';
  const ret    = s?.ret_1m != null ? `${s.ret_1m > 0 ? '+' : ''}${s.ret_1m.toFixed(2)}% (1M)` : '—';

  return `<div class="drill-inner">
    <div>
      <div class="dlbl">Top Holdings · ${ticker}</div>
      <div class="holdings">${holdingsHtml}</div>
    </div>
    <div>
      <div class="chart-wrap">
        <div class="chead">
          <span class="dlbl" style="margin:0;">${ticker} · 90D Price</span>
          <span style="font-family:var(--mono);font-size:12px;color:var(--text-2);">
            ${close} <span class="${retCls}" style="margin-left:6px;">${ret}</span>
          </span>
        </div>
        <div class="ds-chart" id="ds-chart-${ticker}"></div>
      </div>
    </div>
  </div>`;
}

function _renderDrillChart(drillEl, ticker, sectors) {
  const el = drillEl.querySelector('.ds-chart'); if (!el) return;
  const s = (sectors || []).find(x => x.ticker === ticker);
  const days = 90;
  let r = (ticker.charCodeAt(0) * 7 + ticker.length) % 100;
  const rand = () => { r=(r*9301+49297)%233280; return r/233280-.5; };
  const ret   = (s?.ret_1m || 0) / 100;
  const close = s?.close || 100;
  const start = close / (1 + ret);
  let v = start;
  const dates = [], values = [];
  for (let i=0;i<days;i++) {
    v += (close - start)/days + rand() * close * 0.012;
    const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
    dates.push(d.toISOString().slice(5,10)); values.push(+v.toFixed(2));
  }
  const chart = echarts.init(el);
  const stroke    = ret > 0 ? T.up : T.down;
  const strokeDim = ret > 0 ? T.upDim : T.downDim;
  const strokeFade = ret > 0 ? T.upFade : T.downFade;
  chart.setOption({
    backgroundColor:'transparent',
    tooltip:{trigger:'axis',backgroundColor:'#1a1d27',borderColor:'#2a2d3a',textStyle:{color:'#e0e0e0',fontFamily:'JetBrains Mono, monospace',fontSize:11},formatter:p=>`${p[0].axisValue}<br/><b>$${p[0].value}</b>`},
    grid:{top:8,right:8,bottom:24,left:44},
    xAxis:{type:'category',data:dates,axisLine:{lineStyle:{color:'#2a2d3a'}},axisTick:{show:false},axisLabel:{color:'#8a8fa8',fontSize:9,fontFamily:'JetBrains Mono,monospace',interval:Math.floor(days/6)},splitLine:{show:false}},
    yAxis:{type:'value',scale:true,axisLine:{show:false},axisTick:{show:false},axisLabel:{color:'#8a8fa8',fontSize:9,fontFamily:'JetBrains Mono,monospace'},splitLine:{lineStyle:{color:'#2a2d3a',type:'dashed',opacity:.4}}},
    series:[{type:'line',data:values,smooth:false,symbol:'none',lineStyle:{width:1.5,color:stroke},areaStyle:{color:new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:strokeDim},{offset:1,color:strokeFade}])}}],
  });
}

// Static top-holdings data (replace with API call if desired)
window.TOP_HOLDINGS = {
  XLK: [{ticker:'MSFT',name:'Microsoft',weight:18.2,ret:4.81},{ticker:'AAPL',name:'Apple',weight:15.6,ret:6.22},{ticker:'NVDA',name:'Nvidia',weight:6.4,ret:9.31},{ticker:'AVGO',name:'Broadcom',weight:4.8,ret:2.41}],
  XLY: [{ticker:'AMZN',name:'Amazon',weight:20.1,ret:5.62},{ticker:'TSLA',name:'Tesla',weight:13.4,ret:8.14},{ticker:'HD',name:'Home Depot',weight:6.9,ret:1.92},{ticker:'MCD',name:"McDonald's",weight:4.2,ret:0.84}],
  XLC: [{ticker:'META',name:'Meta',weight:22.3,ret:6.18},{ticker:'GOOGL',name:'Alphabet A',weight:12.5,ret:2.84},{ticker:'GOOG',name:'Alphabet C',weight:11.8,ret:2.91},{ticker:'NFLX',name:'Netflix',weight:4.9,ret:1.42}],
  XLF: [{ticker:'BRK.B',name:'Berkshire B',weight:12.4,ret:1.92},{ticker:'JPM',name:'JPMorgan',weight:9.8,ret:3.04},{ticker:'V',name:'Visa',weight:7.2,ret:1.84},{ticker:'MA',name:'Mastercard',weight:6.4,ret:2.62}],
  XLI: [{ticker:'CAT',name:'Caterpillar',weight:4.6,ret:2.41},{ticker:'GE',name:'GE Aero',weight:4.4,ret:3.84},{ticker:'UBER',name:'Uber',weight:4.1,ret:1.62},{ticker:'UNP',name:'Union Pacific',weight:3.8,ret:-0.41}],
  XLV: [{ticker:'LLY',name:'Eli Lilly',weight:11.2,ret:-2.14},{ticker:'UNH',name:'UnitedHealth',weight:8.6,ret:-1.82},{ticker:'JNJ',name:'J&J',weight:6.4,ret:0.41},{ticker:'ABBV',name:'AbbVie',weight:5.2,ret:-0.62}],
  XLB: [{ticker:'LIN',name:'Linde',weight:19.4,ret:-0.84},{ticker:'SHW',name:'Sherwin-Williams',weight:6.8,ret:-2.41},{ticker:'ECL',name:'Ecolab',weight:5.9,ret:-1.62},{ticker:'APD',name:'Air Products',weight:4.8,ret:-0.92}],
  XLP: [{ticker:'COST',name:'Costco',weight:12.4,ret:-0.41},{ticker:'WMT',name:'Walmart',weight:11.8,ret:-1.84},{ticker:'PG',name:'P&G',weight:10.2,ret:-2.61},{ticker:'KO',name:'Coca-Cola',weight:8.4,ret:-1.92}],
  XLRE:[{ticker:'PLD',name:'Prologis',weight:9.2,ret:-2.62},{ticker:'AMT',name:'Amer. Tower',weight:7.4,ret:-1.84},{ticker:'EQIX',name:'Equinix',weight:6.8,ret:-2.42},{ticker:'WELL',name:'Welltower',weight:6.2,ret:-1.41}],
  XLU: [{ticker:'NEE',name:'NextEra',weight:12.6,ret:-2.84},{ticker:'SO',name:'Southern Co',weight:8.4,ret:-2.41},{ticker:'DUK',name:'Duke Energy',weight:7.2,ret:-1.92},{ticker:'CEG',name:'Constellation',weight:6.4,ret:-3.41}],
  XLE: [{ticker:'XOM',name:'ExxonMobil',weight:23.4,ret:-3.84},{ticker:'CVX',name:'Chevron',weight:16.2,ret:-4.41},{ticker:'COP',name:'ConocoPhillips',weight:8.2,ret:-2.92},{ticker:'WMB',name:'Williams Cos',weight:4.8,ret:-1.84}],
};
