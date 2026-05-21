// ── fear-page.js ───────────────────────────────────────────
// Renders Fear page charts: sparklines, credit spread, correlation, time series.
// Called as: initFearPage(serverFear)

function initFearPage(fear) {
  // ── Fear sparklines ───────────────────────────────────────
  if (Array.isArray(fear)) {
    fear.forEach((f, i) => {
      const el = document.getElementById('fear-spark-' + i);
      if (!el) return;
      const chart = echarts.init(el, null, { renderer: 'svg' });
      let r = i * 17 + 3, v = f.value || 50;
      const data = Array.from({ length: 30 }, () => {
        r = (r*9301+49297)%233280; v += (r/233280-.5)*(v*0.02); return +v.toFixed(2);
      });
      const down = (f.change || 0) < 0;
      const stroke = down ? 'oklch(0.74 0.14 155)' : 'oklch(0.67 0.18 25)';
      chart.setOption({
        grid:{top:0,right:0,bottom:0,left:0},
        xAxis:{type:'category',show:false,data:data.map((_,x)=>x)},
        yAxis:{type:'value',show:false,scale:true},
        series:[{type:'line',data,smooth:true,symbol:'none',
          lineStyle:{width:1.4,color:stroke},
          areaStyle:{color:new echarts.graphic.LinearGradient(0,0,0,1,[
            {offset:0,color:stroke.replace(')','/0.28)')},{offset:1,color:stroke.replace(')','/0)')}
          ])},
        }],
      });
      // Regime marker
      const ranges = { VIX:[10,35], VVIX:[70,130], SKEW:[110,160] };
      const key = (f.symbol||'').toUpperCase().replace('/','').replace(' ','');
      const rng = ranges[key] || [v*0.7, v*1.3];
      const pct = Math.max(5, Math.min(95, ((f.value-rng[0])/(rng[1]-rng[0]))*100));
      const marker = document.getElementById('fear-marker-' + i);
      if (marker) marker.style.left = pct + '%';
    });
  }

  // ── Credit spread big chart ───────────────────────────────
  let spreadWindow = 90;
  function loadSpread(w) {
    fetch('/api/fear/credit_spread?window=' + w)
      .then(r => r.json())
      .then(d => {
        if (!d || d.status === 'no_data' || d.status === 'missing_data') return;
        const val = d.current?.toFixed(4) ?? '—';
        const el = document.getElementById('spread-big-value');
        if (el) el.textContent = val;
        const zEl = document.getElementById('spread-big-zscore');
        if (zEl && d.zscore != null) {
          const z = d.zscore, cls = z < -0.5 ? 'up' : z > 0.5 ? 'down' : 'muted';
          zEl.innerHTML = `<span class="${cls}">z = ${z > 0 ? '+' : ''}${z}</span> · vs ${w}D`;
        }
        const labelEl = document.getElementById('spread-big-label');
        if (labelEl && d.label) {
          const lm = { Stress:'Stress', Widening:'Widening', Tight:'Tight', Tightening:'Tightening', Neutral:'Neutral' };
          labelEl.textContent = lm[d.label] || d.label;
          labelEl.className = 'regime-label ' + (d.label === 'Tightening' || d.label === 'Tight' ? 'up' : d.label === 'Stress' || d.label === 'Widening' ? 'down' : 'muted');
        }
        if (d.dates?.length) {
          const chartEl = document.getElementById('credit-chart-big');
          const chart = chartEl._chart || echarts.init(chartEl);
          chartEl._chart = chart;
          const mean = d.values.reduce((a,b)=>a+b,0) / d.values.length;
          chart.setOption({
            backgroundColor:'transparent',
            tooltip:{trigger:'axis',backgroundColor:'#1a1d27',borderColor:'#2a2d3a',textStyle:{color:'#e0e0e0',fontFamily:T.mono,fontSize:12},formatter:p=>`${d.dates[p[0].dataIndex]}<br/>HYG/LQD: <b>${p[0].value.toFixed(4)}</b>`},
            grid:{top:12,right:16,bottom:28,left:56},
            xAxis:{type:'category',data:d.dates,axisLine:{lineStyle:{color:T.border}},axisTick:{show:false},axisLabel:{color:T.muted,fontSize:10,fontFamily:T.mono,interval:Math.floor(d.dates.length/6)},splitLine:{show:false}},
            yAxis:{type:'value',scale:true,axisLine:{show:false},axisTick:{show:false},axisLabel:{color:T.muted,fontSize:10,fontFamily:T.mono},splitLine:{lineStyle:{color:T.border,type:'dashed',opacity:.5}}},
            series:[{type:'line',data:d.values,smooth:false,symbol:'none',
              lineStyle:{width:1.6,color:'oklch(0.74 0.14 155)'},
              areaStyle:{color:new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'oklch(0.74 0.14 155/0.22)'},{offset:1,color:'oklch(0.74 0.14 155/0)'}])},
              markLine:{silent:true,symbol:'none',lineStyle:{type:'dashed',color:T.muted,opacity:.6},label:{color:T.muted,fontSize:10,fontFamily:T.mono,formatter:'mean',position:'end'},data:[{yAxis:+mean.toFixed(4)}]},
            }],
          }, true);
          new ResizeObserver(() => chart.resize()).observe(chartEl);
        }
      }).catch(() => {});
  }
  loadSpread(spreadWindow);
  document.getElementById('spread-tabs')?.addEventListener('click', e => {
    const btn = e.target.closest('button'); if (!btn) return;
    document.querySelectorAll('#spread-tabs button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    spreadWindow = +btn.dataset.w;
    loadSpread(spreadWindow);
  });

  // ── Correlation matrix ────────────────────────────────────
  let corrWindow = 20;
  function loadCorr(w) {
    fetch('/api/fear/correlation?window=' + w)
      .then(r => r.json())
      .then(d => renderCorr(d))
      .catch(() => {});
  }
  function renderCorr(d) {
    const el = document.getElementById('corr-chart'); if (!el) return;
    if (!d?.symbols?.length) return;
    const chart = el._chart || echarts.init(el); el._chart = chart;
    const n = d.symbols.length, data = [];
    for (let i=0;i<n;i++) for (let j=0;j<n;j++) data.push([j,i,d.matrix[i][j]]);
    chart.setOption({
      backgroundColor:'transparent',
      tooltip:{backgroundColor:'#1a1d27',borderColor:'#2a2d3a',textStyle:{color:'#e0e0e0',fontFamily:T.mono,fontSize:12},
        formatter:p=>`<b>${d.symbols[p.data[1]]}</b> × <b>${d.symbols[p.data[0]]}</b><br/>r = <b>${p.data[2].toFixed(2)}</b>`},
      grid:{top:12,right:16,bottom:36,left:56},
      xAxis:{type:'category',data:d.symbols,axisLine:{show:false},axisTick:{show:false},axisLabel:{color:T.muted,fontSize:11,fontFamily:T.mono},splitLine:{show:false}},
      yAxis:{type:'category',data:d.symbols,inverse:true,axisLine:{show:false},axisTick:{show:false},axisLabel:{color:T.text2,fontSize:11,fontFamily:T.mono},splitLine:{show:false}},
      visualMap:{min:-1,max:1,show:false,inRange:{color:['#d44a4a','#6e3838','#2a2d3a','#356755','#6dc28a']}},
      series:[{type:'heatmap',data,
        label:{show:true,formatter:p=>p.data[2].toFixed(2).replace(/^0/,'').replace(/^-0/,'-'),fontSize:10,color:'#e8e8e8',fontFamily:T.mono},
        itemStyle:{borderRadius:2,borderColor:T.bgHex,borderWidth:1.5},
        emphasis:{itemStyle:{borderColor:'#e0e0e0',borderWidth:1}},
      }],
    }); new ResizeObserver(()=>chart.resize()).observe(el);
  }
  loadCorr(corrWindow);
  document.getElementById('corr-tabs')?.addEventListener('click', e => {
    const btn = e.target.closest('button'); if (!btn) return;
    document.querySelectorAll('#corr-tabs button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); corrWindow = +btn.dataset.w; loadCorr(corrWindow);
  });

  // ── Time series ───────────────────────────────────────────
  let tsSymbol = 'VIX', tsWindow = 90;
  function loadTs(sym, w) {
    fetch(`/api/fear/timeseries/${sym}?window=${w}`)
      .then(r => r.json())
      .then(d => renderTs(d, sym))
      .catch(() => {});
  }
  function renderTs(d, sym) {
    const el = document.getElementById('ts-chart'); if (!el) return;
    const chart = el._chart || echarts.init(el); el._chart = chart;
    if (!d?.dates?.length) return;
    const isFear = ['VIX','VVIX','SKEW','PUT_CALL'].includes(sym);
    const stroke = isFear ? 'oklch(0.78 0.13 35)' : 'oklch(0.72 0.13 220)';
    chart.setOption({
      backgroundColor:'transparent',
      tooltip:{trigger:'axis',backgroundColor:'#1a1d27',borderColor:'#2a2d3a',textStyle:{color:'#e0e0e0',fontFamily:T.mono,fontSize:12},axisPointer:{type:'cross',lineStyle:{color:T.border,type:'dashed'}}},
      grid:{top:20,right:20,bottom:32,left:56},
      xAxis:{type:'category',data:d.dates,axisLine:{lineStyle:{color:T.border}},axisTick:{show:false},axisLabel:{color:T.muted,fontSize:10,fontFamily:T.mono},splitLine:{show:false}},
      yAxis:{type:'value',scale:true,axisLine:{show:false},axisTick:{show:false},axisLabel:{color:T.muted,fontSize:10,fontFamily:T.mono},splitLine:{lineStyle:{color:T.border,type:'dashed',opacity:.5}}},
      series:[{type:'line',data:d.values,smooth:false,symbol:'none',
        lineStyle:{width:1.6,color:stroke},
        areaStyle:{color:new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:stroke.replace(')','/0.22)')},{offset:1,color:stroke.replace(')','/0)')}])},
      }],
    }, true); new ResizeObserver(()=>chart.resize()).observe(el);
  }
  loadTs(tsSymbol, tsWindow);
  document.getElementById('ts-tabs')?.addEventListener('click', e => {
    const btn = e.target.closest('button'); if (!btn) return;
    document.querySelectorAll('#ts-tabs button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active'); tsWindow = +btn.dataset.w; loadTs(tsSymbol, tsWindow);
  });
  document.getElementById('ts-symbol')?.addEventListener('change', e => {
    tsSymbol = e.target.value; loadTs(tsSymbol, tsWindow);
  });
}
