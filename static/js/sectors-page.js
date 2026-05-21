// ── sectors-page.js ────────────────────────────────────────
// Renders the full heatmap + summary table on the Sectors page.
// Called as: initSectorsPage(serverSectors)

function initSectorsPage(sectors) {
  if (!Array.isArray(sectors) || !sectors.length) return;

  // ── Summary rows ─────────────────────────────────────────
  const root = document.getElementById('summary-rows');
  if (root) {
    const sorted = [...sectors].sort((a, b) => (b.ret_1m || 0) - (a.ret_1m || 0));
    const maxFlow = Math.max(...sectors.map(s => Math.abs(s.flow_m || 0))) || 1;

    root.innerHTML = sorted.map((s, i) => {
      const cell = (v) => {
        if (v == null) return '<span class="num-cell muted">—</span>';
        const cls  = v > 0 ? 'up' : v < 0 ? 'down' : 'muted';
        const arr  = v > 0 ? '▲' : v < 0 ? '▼' : '·';
        return `<span class="num-cell ${cls}"><span class="arrow">${arr}</span>${v > 0 ? '+' : ''}${v.toFixed(2)}%</span>`;
      };
      const fl = s.flow_m;
      const flCls = fl > 0 ? 'up' : fl < 0 ? 'down' : 'muted';
      const flowPct = Math.min(50, (Math.abs(fl || 0) / maxFlow) * 50);
      return `
        <div class="grid-tmpl row" data-ticker="${s.ticker}">
          <span class="ticker-chip">${s.ticker.replace('XL','')}</span>
          <span class="name-cell">${s.name}<span class="tk">${s.ticker}</span></span>
          <span class="num-cell" style="color:var(--text-2);">${s.close ? '$' + s.close.toFixed(2) : '—'}</span>
          ${cell(s.ret_1d)}
          ${cell(s.ret_5d)}
          ${cell(s.ret_1m)}
          <span class="spark-cell" id="sect-spark-${i}"></span>
          <span class="flow-cell">
            <span class="flow-bar"><span class="center"></span>
              <span class="fill ${(fl||0) > 0 ? 'pos' : 'neg'}" style="width:${flowPct.toFixed(1)}%;"></span>
            </span>
            <span class="flow-val ${flCls}">${fl != null ? (fl > 0 ? '+' : '') + fl.toFixed(0) + 'M' : '—'}</span>
          </span>
        </div>`;
    }).join('');

    // Sparklines
    sorted.forEach((s, i) => {
      const el = document.getElementById('sect-spark-' + i);
      if (!el) return;
      const chart = echarts.init(el, null, { renderer: 'svg' });
      let r = (s.ticker.charCodeAt(0) * 7 + i) % 100, v = s.close || 100;
      const rand = () => { r = (r*9301+49297)%233280; return r/233280-.5; };
      const data = Array.from({ length: 20 }, () => {
        v += rand() * v * 0.012 + (s.ret_1m || 0) / 40;
        return +v.toFixed(2);
      });
      const upTrend = (s.ret_1m || 0) > 0;
      const stroke = upTrend ? 'oklch(0.74 0.14 155)' : 'oklch(0.67 0.18 25)';
      chart.setOption({
        grid: { top:2, right:2, bottom:2, left:2 },
        xAxis: { type:'category', show:false, data: data.map((_,x)=>x) },
        yAxis: { type:'value', show:false, scale:true },
        series: [{ type:'line', data, smooth:true, symbol:'none',
          lineStyle: { width:1.4, color: stroke },
          areaStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1,[
            { offset:0, color: stroke.replace(')', ' / 0.22)') },
            { offset:1, color: stroke.replace(')', ' / 0)') },
          ])},
        }],
      });
    });
  }

  // ── Full heatmap ──────────────────────────────────────────
  const heatEl = document.getElementById('sectors-heatmap');
  if (!heatEl) return;
  const chart = echarts.init(heatEl);
  const days = 30;
  const dates = Array.from({ length: days }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
    return d.toISOString().slice(5, 10);
  });
  const data = [];
  let r = 13;
  const rand = () => { r=(r*9301+49297)%233280; return r/233280-.5; };
  dates.forEach((_, di) => {
    const market = rand() * 1.6;
    sectors.forEach((s, si) => {
      const bias = (s.ret_1m || 0) / 30;
      const beta = 0.4 + (rand() + 0.5) * 0.8;
      data.push([di, si, +(market * beta + rand() * 1.2 + bias).toFixed(2)]);
    });
  });
  chart.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      backgroundColor: '#1a1d27', borderColor: '#2a2d3a',
      textStyle: { color: '#e0e0e0', fontFamily: T.mono, fontSize: 12 },
      formatter: p => {
        const [di, si, v] = p.data;
        return `<b>${sectors[si].ticker}</b> · ${sectors[si].name}<br/>${dates[di]}<br/>` +
          `<b style="color:${v>0?T.up:T.down}">${v>0?'+':''}${v}%</b>`;
      }
    },
    grid: { top:8, right:16, bottom:36, left:180 },
    xAxis: { type:'category', data:dates, axisLine:{lineStyle:{color:T.border}}, axisTick:{show:false},
      axisLabel:{color:T.muted,fontSize:10,fontFamily:T.mono,interval:2}, splitLine:{show:false} },
    yAxis: { type:'category', data:sectors.map(s=>`${s.ticker}    ${s.name}`), axisLine:{show:false},
      axisTick:{show:false}, axisLabel:{color:T.text2,fontSize:12}, splitLine:{show:false}, inverse:true },
    visualMap: { min:-3, max:3, show:false, inRange:{ color: T.heat } },
    series: [{ type:'heatmap', data,
      itemStyle:{ borderRadius:2, borderColor:T.bgHex, borderWidth:1.5 },
      emphasis:{itemStyle:{borderColor:'#e0e0e0',borderWidth:1}},
    }],
  });
  new ResizeObserver(() => chart.resize()).observe(heatEl);
}
