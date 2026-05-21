// ── history-page.js ────────────────────────────────────────
// Fetches VIX/VVIX/SKEW timeseries from /api/fear/timeseries/:symbol
// and renders the History page charts.

function loadHistory(days) {
  _loadChart('VIX',  days, '#e8924e', 'rgba(232,146,78,0.22)', 'rgba(232,146,78,0)',    [20,30], 'vix-chart',  'vix-error', true);
  _loadChart('VVIX', days, '#b87fd4', 'rgba(184,127,212,0.22)', 'rgba(184,127,212,0)',  [],      'vvix-chart', null,        false);
  _loadChart('SKEW', days, '#5a9fd4', 'rgba(90,159,212,0.22)',  'rgba(90,159,212,0)',   [130,150], 'skew-chart', null,      false);
}

function _loadChart(symbol, days, color, colorDim, colorFade, markLines, chartId, errorId, updateStats) {
  const el = document.getElementById(chartId); if (!el) return;
  fetch(`/api/fear/timeseries/${symbol}?window=${days}`)
    .then(r => r.json())
    .then(d => {
      if (!d?.dates?.length) {
        if (errorId) _showErr(errorId, t('common.nodata'));
        return;
      }
      const chart = el._chart || echarts.init(el); el._chart = chart;
      chart.setOption({
        backgroundColor: 'transparent',
        tooltip: {
          trigger:'axis', backgroundColor:'#1a1d27', borderColor:'#2a2d3a',
          textStyle:{color:'#e0e0e0',fontFamily:T.mono,fontSize:12},
          axisPointer:{type:'cross',lineStyle:{color:T.border,type:'dashed'}},
          formatter: p => `${p[0].axisValue}<br/>${symbol}: <b>${p[0].value}</b>`,
        },
        grid:{top:16,right:24,bottom:36,left:56},
        xAxis:{type:'category',data:d.dates,axisLine:{lineStyle:{color:T.border}},axisTick:{show:false},axisLabel:{color:T.muted,fontSize:10,fontFamily:T.mono},splitLine:{show:false}},
        yAxis:{type:'value',scale:true,axisLine:{show:false},axisTick:{show:false},axisLabel:{color:T.muted,fontSize:10,fontFamily:T.mono},splitLine:{lineStyle:{color:T.border,type:'dashed',opacity:.4}}},
        series:[{type:'line',data:d.values,smooth:false,symbol:'none',
          lineStyle:{width:1.8,color},
          areaStyle:{color:new echarts.graphic.LinearGradient(0,0,0,1,[
            {offset:0,color:colorDim},{offset:1,color:colorFade}
          ])},
          markArea: symbol === 'VIX' ? {silent:true,itemStyle:{opacity:.18},data:[
            [{yAxis:20,itemStyle:{color:'#e3a447'}},{yAxis:30}],
            [{yAxis:30,itemStyle:{color:'#d44a4a'}},{yAxis:100}],
          ]} : undefined,
          markLine: markLines.length ? {silent:true,symbol:'none',
            lineStyle:{type:'dashed',color:T.muted,opacity:.6},
            label:{color:T.muted,fontSize:10,fontFamily:T.mono,formatter:'{c}',position:'insideEndTop'},
            data:markLines.map(v=>({yAxis:v})),
          } : undefined,
        }],
      }, true);
      new ResizeObserver(() => chart.resize()).observe(el);

      // Update last value callouts
      const last = d.values[d.values.length - 1];
      if (symbol === 'VVIX') {
        const el2 = document.getElementById('last-vvix');
        if (el2) el2.textContent = last;
      }
      if (symbol === 'SKEW') {
        const el2 = document.getElementById('last-skew');
        if (el2) el2.textContent = last;
      }

      if (updateStats) _updateVixStats(d.values, days);
    })
    .catch(e => { if (errorId) _showErr(errorId, e.message); });
}

function _updateVixStats(values, days) {
  const last   = values[values.length - 1];
  const prev   = values[values.length - 2] || last;
  const avg    = values.reduce((a,b)=>a+b,0) / values.length;
  const min    = Math.min(...values), max = Math.max(...values);
  const above20 = values.filter(v=>v>20).length;
  const above30 = values.filter(v=>v>30).length;
  const labels = { 90:'3M', 180:'6M', 365:'1Y' };

  const $  = id => document.getElementById(id);
  if ($('stat-vix-cur'))   $('stat-vix-cur').textContent = last.toFixed(2);
  if ($('stat-vix-avg'))   $('stat-vix-avg').textContent = avg.toFixed(1);
  if ($('stat-avg-lbl'))   $('stat-avg-lbl').textContent = `VIX · ${labels[days] || days+'D'} Avg`;
  if ($('stat-vix-range')) $('stat-vix-range').textContent = `Range ${min.toFixed(1)} – ${max.toFixed(1)}`;
  if ($('stat-vix-days'))  $('stat-vix-days').textContent = above20;
  if ($('stat-vix-pct'))   $('stat-vix-pct').textContent  = `of last ${days} sessions`;

  const chg = last - prev;
  const chgEl = $('stat-vix-chg');
  if (chgEl) {
    chgEl.textContent = `${chg<0?'▼':'▲'} ${chg>0?'+':''}${chg.toFixed(2)} (1D)`;
    chgEl.className = 'sub ' + (chg < 0 ? 'up' : 'down');
  }

  const reg = $('stat-regime'), sub = $('stat-regime-sub');
  if (reg) {
    if (above30 > 0) {
      reg.textContent = 'Stress'; reg.style.color = 'var(--down)';
      if (sub) sub.textContent = `${above30} days above 30`;
    } else if (above20 > 5) {
      reg.textContent = 'Elevated'; reg.style.color = 'var(--accent)';
      if (sub) sub.textContent = `${above20} days above 20`;
    } else {
      reg.textContent = 'Calm'; reg.style.color = 'var(--up)';
      if (sub) sub.textContent = above20 ? `${above20} brief spikes` : 'Sub-20 throughout window';
    }
  }
}

function _showErr(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.style.display = 'block'; el.textContent = '⚠ ' + msg; }
}
