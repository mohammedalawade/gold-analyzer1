import { db } from '../server/db';
import { goldPrices, recommendations, sentimentData, notifications, economicIndicators, geopoliticalEvents } from '../server/schema';
import { desc, eq, count } from 'drizzle-orm';
import fs from 'fs';

const prices = db.select().from(goldPrices).orderBy(desc(goldPrices.id)).limit(30).all().reverse();
const rec = db.select().from(recommendations).orderBy(desc(recommendations.id)).limit(1).get();
const sent = db.select().from(sentimentData).orderBy(desc(sentimentData.id)).limit(1).get();

const indicators = db.select().from(economicIndicators).orderBy(desc(economicIndicators.id)).limit(20).all();
const uniqueInd: typeof indicators = [];
const seen = new Set<string>();
for (const i of indicators) { if (!seen.has(i.name)) { seen.add(i.name); uniqueInd.push(i); } }

const events = db.select().from(geopoliticalEvents).orderBy(desc(geopoliticalEvents.id)).limit(6).all();
const unreadCount = db.select({ count: count() }).from(notifications).where(eq(notifications.read, false)).get();
const notifs = db.select().from(notifications).orderBy(desc(notifications.id)).limit(10).all();

const priceData = prices.map((p, i) => {
  const d = p.createdAt ? new Date(p.createdAt) : new Date(Date.now() - (prices.length - i) * 300000);
  return { label: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), price: p.priceUsd };
});

const stats = {
  avg: prices.length ? (prices.reduce((a, b) => a + b.priceUsd, 0) / prices.length).toFixed(2) : '0',
  min: prices.length ? Math.min(...prices.map(p => p.priceUsd)).toFixed(2) : '0',
  max: prices.length ? Math.max(...prices.map(p => p.priceUsd)).toFixed(2) : '0',
  latest: prices.length ? prices[prices.length - 1].priceUsd.toFixed(2) : '0',
  change: prices.length > 1 ? (prices[prices.length - 1].priceUsd - prices[prices.length - 2].priceUsd).toFixed(2) : '0',
  changePct: prices.length > 1 ? (((prices[prices.length - 1].priceUsd - prices[prices.length - 2].priceUsd) / prices[prices.length - 2].priceUsd) * 100).toFixed(2) : '0',
};

const svgWidth = 700;
const svgHeight = 260;
const padding = { top: 20, right: 20, bottom: 30, left: 50 };
const innerW = svgWidth - padding.left - padding.right;
const innerH = svgHeight - padding.top - padding.bottom;
const values = priceData.map(d => d.price);
const minP = Math.min(...values) * 0.998;
const maxP = Math.max(...values) * 1.002;
const points = priceData.map((d, i) => {
  const x = padding.left + (i / (priceData.length - 1 || 1)) * innerW;
  const y = padding.top + innerH - ((d.price - minP) / (maxP - minP || 1)) * innerH;
  return { x, y };
});
const linePath = points.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ');
const areaPath = linePath + ' L' + points[points.length - 1].x.toFixed(1) + ',' + (padding.top + innerH) + ' L' + points[0].x.toFixed(1) + ',' + (padding.top + innerH) + ' Z';

const recColor = rec?.action === 'BUY' ? '#4ade80' : rec?.action === 'SELL' ? '#f87171' : '#facc15';
const sentColor = (sent?.fearGreedIndex || 50) < 25 ? '#ef4444' : (sent?.fearGreedIndex || 50) < 45 ? '#f97316' : (sent?.fearGreedIndex || 50) < 55 ? '#eab308' : (sent?.fearGreedIndex || 50) < 75 ? '#84cc16' : '#22c55e';
const sentLabel = sent?.sentimentLabel || 'Neutral';
const fgVal = sent?.fearGreedIndex || 50;
const gaugeRadius = 60;
const gaugeStroke = 8;
const gaugeNorm = gaugeRadius - gaugeStroke * 2;
const circ = gaugeNorm * 2 * Math.PI;
const offset = circ - (fgVal / 100) * circ;

function getNotifColor(t: string) {
  if (t === 'price_spike') return '#f87171';
  if (t === 'recommendation_change') return '#d4af37';
  if (t === 'sentiment_shift') return '#facc15';
  if (t === 'geopolitical_event') return '#60a5fa';
  return '#9ca3af';
}
function getNotifIcon(t: string) {
  if (t === 'price_spike') return '⚠️';
  if (t === 'recommendation_change') return '↔️';
  if (t === 'sentiment_shift') return '📊';
  if (t === 'geopolitical_event') return '🌍';
  return '🔔';
}

const html = `<!DOCTYPE html>
<html lang="ar">
<head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Gold Psychology Analyzer — Preview</title>
<style>
:root{--bg:#0b0b0f;--card:#13131f;--border:#2a2a3c;--gold:#d4af37;--text:#e5e7eb;--muted:#9ca3af;--red:#ef4444;--green:#4ade80;--yellow:#facc15;}
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--text);line-height:1.5;min-height:100vh;}
.container{max-width:1200px;margin:0 auto;padding:20px;}
header{display:flex;align-items:center;justify-content:space-between;padding:16px 0;border-bottom:1px solid var(--border);margin-bottom:24px;}
.logo{display:flex;align-items:center;gap:12px;}
.logo-icon{width:32px;height:32px;background:linear-gradient(135deg,#d4af37,#f5e18f,#b5902f);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--bg);font-weight:bold;font-size:14px;}
h1{font-size:20px;background:linear-gradient(90deg,#d4af37,#f5e18f,#d4af37);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
.bell{position:relative;padding:8px;border-radius:8px;background:var(--card);border:1px solid var(--border);cursor:pointer;}
.badge{position:absolute;top:-4px;right:-4px;background:var(--red);color:white;font-size:11px;font-weight:bold;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;}
.grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px;}
@media(max-width:768px){.grid-3{grid-template-columns:1fr;}}
.grid-2{display:grid;grid-template-columns:2fr 1fr;gap:16px;margin-bottom:24px;}
@media(max-width:768px){.grid-2{grid-template-columns:1fr;}}
.card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:20px;box-shadow:0 4px 20px rgba(0,0,0,0.3);}
.card-title{color:var(--gold);font-size:14px;font-weight:600;margin-bottom:12px;display:flex;align-items:center;gap:6px;}
.big-price{font-size:36px;font-weight:700;letter-spacing:-1px;margin-bottom:4px;}
.change{font-size:14px;font-weight:500;margin-bottom:12px;display:flex;align-items:center;gap:4px;}
.stats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px;}
.stat-box{background:rgba(11,11,15,0.5);border-radius:8px;padding:10px;text-align:center;font-size:12px;}
.stat-label{color:var(--muted);margin-bottom:4px;}
.stat-value{color:white;font-weight:600;}
.gauge-wrap{display:flex;flex-direction:column;align-items:center;}
.gauge-val{font-size:32px;font-weight:700;color:white;}
.gauge-label{font-size:12px;padding:4px 12px;border-radius:20px;margin-top:4px;font-weight:600;}
.rec-box{display:flex;align-items:center;gap:16px;}
.rec-icon{width:48px;height:48px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:bold;}
.rec-action{font-size:28px;font-weight:700;}
.rec-conf{font-size:12px;color:var(--muted);}
.rec-reason{font-size:13px;color:var(--muted);background:rgba(11,11,15,0.5);border-radius:8px;padding:12px;border:1px solid var(--border);margin-top:12px;}
.chart-wrap{margin-top:8px;}
.chart-svg{width:100%;height:auto;}
.axis{fill:var(--muted);font-size:11px;}
.line{fill:none;stroke:var(--gold);stroke-width:2.5;stroke-linejoin:round;stroke-linecap:round;}
.area{fill:url(#goldGrad);opacity:0.25;}
.grid-line{stroke:var(--border);stroke-dasharray:3 3;}
.axis-line{stroke:var(--border);}
.ind-item{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(42,42,60,0.5);font-size:14px;}
.ind-item:last-child{border-bottom:none;}
.ind-name{color:var(--muted);}
.ind-val{color:white;font-weight:600;}
.events-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
@media(max-width:768px){.events-grid{grid-template-columns:1fr;}}
.ev-card{background:rgba(11,11,15,0.5);border:1px solid var(--border);border-radius:8px;padding:14px;}
.ev-title{font-size:13px;font-weight:600;color:white;display:flex;justify-content:space-between;align-items:center;}
.ev-score{font-size:11px;padding:2px 8px;border-radius:12px;font-weight:600;}
.ev-desc{font-size:12px;color:var(--muted);margin-top:6px;}
.ev-time{font-size:11px;color:#4b5563;margin-top:8px;}
.notif-list{display:none;position:absolute;right:0;top:40px;width:340px;background:var(--card);border:1px solid var(--border);border-radius:12px;box-shadow:0 20px 50px rgba(0,0,0,0.5);z-index:50;max-height:400px;overflow-y:auto;}
.notif-list.show{display:block;}
.notif-hdr{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid var(--border);}
.notif-itm{padding:12px 16px;border-bottom:1px solid rgba(42,42,60,0.5);display:flex;gap:10px;align-items:flex-start;}
.notif-itm:last-child{border-bottom:none;}
.notif-dot{width:8px;height:8px;border-radius:50%;margin-top:6px;flex-shrink:0;}
.notif-title{font-size:13px;font-weight:600;color:white;}
.notif-msg{font-size:12px;color:var(--muted);margin-top:2px;}
.notif-time{font-size:11px;color:#4b5563;margin-top:4px;}
.unread-dot{background:var(--red);}
.read-dot{background:#374151;}
.footer{text-align:center;color:#4b5563;font-size:12px;margin-top:32px;padding-bottom:24px;}
</style>
</head>
<body>
<div class="container">
<header>
  <div class="logo">
    <div class="logo-icon">Au</div>
    <div><h1>Gold Psychology Analyzer</h1><p style="font-size:12px;color:var(--muted);margin-top:2px;">Real-time sentiment &amp; cycle intelligence</p></div>
  </div>
  <div style="position:relative;">
    <div class="bell" onclick="document.getElementById('notifs').classList.toggle('show')">
      🔔
      ${(unreadCount?.count || 0) > 0 ? `<span class="badge">${unreadCount?.count}</span>` : ''}
    </div>
    <div class="notif-list" id="notifs">
      <div class="notif-hdr"><span style="font-size:13px;font-weight:600;">Notifications</span><span style="font-size:11px;color:var(--muted);">${notifs.filter(n => !n.read).length} unread</span></div>
      ${notifs.map(n => {
        const col = getNotifColor(n.type);
        return `<div class="notif-itm">
          <div class="notif-dot ${n.read ? 'read-dot' : 'unread-dot'}" style="background:${col};"></div>
          <div style="flex:1;">
            <div class="notif-title">${getNotifIcon(n.type)} ${n.title}</div>
            <div class="notif-msg">${n.message}</div>
            <div class="notif-time">${n.createdAt ? new Date(n.createdAt).toLocaleTimeString() : ''}</div>
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>
</header>

<div class="grid-3">
  <div class="card">
    <div class="card-title">📈 Gold Spot Price <span style="margin-left:auto;color:var(--muted);font-weight:400;">USD/troy oz</span></div>
    <div class="big-price">$${stats.latest}</div>
    <div class="change" style="color:${Number(stats.change) >= 0 ? 'var(--green)' : 'var(--red)'};">
      ${Number(stats.change) >= 0 ? '▲' : '▼'} ${stats.change > 0 ? '+' : ''}${stats.change} (${stats.changePct}%)
    </div>
    <div class="stats-grid">
      <div class="stat-box"><div class="stat-label">Low (30m)</div><div class="stat-value">$${stats.min}</div></div>
      <div class="stat-box"><div class="stat-label">High (30m)</div><div class="stat-value">$${stats.max}</div></div>
      <div class="stat-box"><div class="stat-label">Avg (30m)</div><div class="stat-value">$${stats.avg}</div></div>
    </div>
  </div>

  <div class="card">
    <div class="card-title">⚖️ Fear &amp; Greed</div>
    <div class="gauge-wrap">
      <svg width="160" height="160" viewBox="0 0 160 160" style="transform:rotate(-90deg);">
        <circle cx="80" cy="80" r="${gaugeNorm}" stroke="var(--border)" stroke-width="${gaugeStroke}" fill="none"/>
        <circle cx="80" cy="80" r="${gaugeNorm}" stroke="${sentColor}" stroke-width="${gaugeStroke}" fill="none"
          stroke-dasharray="${circ} ${circ}" stroke-dashoffset="${offset}" stroke-linecap="round" style="transition:stroke-dashoffset 0.5s;"/>
      </svg>
      <div style="position:absolute;margin-top:-110px;text-align:center;">
        <div class="gauge-val">${fgVal}</div>
        <div class="gauge-label" style="background:${sentColor}22;color:${sentColor};">${sentLabel}</div>
      </div>
    </div>
    <p style="text-align:center;font-size:11px;color:var(--muted);margin-top:-20px;">0 = Extreme Fear · 100 = Extreme Greed</p>
  </div>

  <div class="card">
    <div class="card-title">💡 Smart Signal</div>
    <div class="rec-box">
      <div class="rec-icon" style="background:${recColor}22;color:${recColor};">${rec?.action === 'BUY' ? '📈' : rec?.action === 'SELL' ? '📉' : '➖'}</div>
      <div>
        <div class="rec-action" style="color:${recColor};">${rec?.action || '—'}</div>
        <div class="rec-conf">Confidence: ${rec?.confidence || 0}%</div>
      </div>
    </div>
    <div class="rec-reason">${rec?.reasoning || 'Waiting for data...'}</div>
  </div>
</div>

<div class="grid-2">
  <div class="card">
    <div class="card-title">📊 Price History (5-min intervals)</div>
    <div class="chart-wrap">
      <svg class="chart-svg" viewBox="0 0 ${svgWidth} ${svgHeight}">
        <defs><linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stop-color="#d4af37" stop-opacity="0.4"/><stop offset="95%" stop-color="#d4af37" stop-opacity="0"/></linearGradient></defs>
        ${Array.from({length:6}, (_, i) => {
          const y = padding.top + (i / 5) * innerH;
          return `<line class="grid-line" x1="${padding.left}" y1="${y.toFixed(1)}" x2="${svgWidth - padding.right}" y2="${y.toFixed(1)}"/>`;
        }).join('')}
        <path class="area" d="${areaPath}"/>
        <path class="line" d="${linePath}"/>
        <text class="axis" x="${padding.left}" y="${svgHeight - 5}">${priceData[0]?.label || ''}</text>
        <text class="axis" x="${svgWidth - padding.right - 30}" y="${svgHeight - 5}">${priceData[priceData.length - 1]?.label || ''}</text>
        <text class="axis" x="10" y="${padding.top + 4}">$${maxP.toFixed(0)}</text>
        <text class="axis" x="10" y="${svgHeight - padding.bottom + 4}">$${minP.toFixed(0)}</text>
        <line class="axis-line" x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${svgHeight - padding.bottom}"/>
        <line class="axis-line" x1="${padding.left}" y1="${svgHeight - padding.bottom}" x2="${svgWidth - padding.right}" y2="${svgHeight - padding.bottom}"/>
      </svg>
    </div>
  </div>

  <div style="display:flex;flex-direction:column;gap:16px;">
    <div class="card">
      <div class="card-title">🧠 Sentiment Analysis</div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;"><span style="font-size:14px;color:var(--muted);">Latest Index</span><span style="font-size:18px;font-weight:700;">${fgVal}/100</span></div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-top:1px solid var(--border);"><span style="font-size:14px;color:var(--muted);">Label</span><span style="font-size:14px;font-weight:600;color:var(--gold);">${sentLabel}</span></div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-top:1px solid var(--border);"><span style="font-size:14px;color:var(--muted);">Recent Delta</span><span style="font-size:14px;font-weight:600;color:${Number(stats.change) >= 0 ? 'var(--green)' : 'var(--red)'};">${Number(stats.change) >= 0 ? '+' : ''}${stats.change}</span></div>
      <p style="font-size:11px;color:var(--muted);margin-top:10px;line-height:1.5;">The Fear &amp; Greed index is derived from price momentum versus a short-term average. Extreme readings may signal contrarian opportunities in gold.</p>
    </div>

    <div class="card">
      <div class="card-title">📉 Macro Indicators</div>
      ${uniqueInd.map(i => `<div class="ind-item"><span class="ind-name">${i.name}</span><span class="ind-val">${i.value.toFixed(2)} <span style="font-size:11px;color:var(--muted);">${i.unit || ''}</span></span></div>`).join('')}
    </div>
  </div>
</div>

<div class="card">
  <div class="card-title">🌍 Geopolitical &amp; Market Events</div>
  <div class="events-grid">
    ${events.map(e => {
      const isHigh = (e.impactScore || 0) >= 5;
      const isMed = (e.impactScore || 0) >= 3;
      const badgeColor = isHigh ? 'var(--red)' : isMed ? '#f97316' : 'var(--muted)';
      return `<div class="ev-card">
        <div class="ev-title">${e.title}<span class="ev-score" style="background:${badgeColor}22;color:${badgeColor};">Impact ${e.impactScore}</span></div>
        <div class="ev-desc">${e.description || ''}</div>
        <div class="ev-time">${e.createdAt ? new Date(e.createdAt).toLocaleString() : ''}</div>
      </div>`;
    }).join('')}
  </div>
</div>

<div class="footer">Gold Psychology Analyzer · Snapshot generated ${new Date().toLocaleString()} · Auto-refresh every 5 minutes when server is running</div>
</div>
</body>
</html>`;

fs.mkdirSync('./public', { recursive: true });
fs.writeFileSync('./public/dashboard-preview.html', html);
console.log('✅ Preview generated: public/dashboard-preview.html');
console.log('Prices rendered:', priceData.length, 'points');
console.log('Latest:', stats.latest, 'Rec:', rec?.action, 'Sentiment:', sentLabel);
