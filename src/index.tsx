import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

app.use('/static/*', serveStatic({ root: './public' }))

app.get('/', (c) => {
  const html = String.raw`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CDR Intelligence Platform</title>
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root{--bg:#0a0f1e;--bg2:#0d1526;--bg3:#111827;--card:#131d32;--card2:#1a2540;--border:#1e2d4a;--border2:#243352;--accent:#00d4ff;--accent2:#0099cc;--green:#00e5a0;--green2:#00b87a;--amber:#f59e0b;--red:#ef4444;--purple:#8b5cf6;--pink:#ec4899;--text1:#f0f6ff;--text2:#8fa8cc;--text3:#5a7399;--glow:0 0 20px rgba(0,212,255,0.15);--glow-green:0 0 20px rgba(0,229,160,0.15)}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text1);font-family:'Inter',sans-serif;min-height:100vh;overflow-x:hidden}
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:var(--bg2)}
::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px}
::-webkit-scrollbar-thumb:hover{background:var(--accent2)}
#sidebar{position:fixed;top:0;left:0;width:240px;height:100vh;background:var(--bg2);border-right:1px solid var(--border);display:flex;flex-direction:column;z-index:100;transition:width .3s ease}
.logo-area{padding:24px 20px 20px;border-bottom:1px solid var(--border)}
.logo-badge{display:flex;align-items:center;gap:10px}
.logo-icon{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,var(--accent),var(--green));display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;box-shadow:var(--glow)}
.logo-text{font-size:13px;font-weight:700;color:var(--text1);letter-spacing:.5px}
.logo-sub{font-size:10px;color:var(--text3);font-weight:400;margin-top:2px;letter-spacing:1px;text-transform:uppercase}
nav{padding:16px 12px;flex:1;overflow-y:auto}
.nav-section{margin-bottom:8px}
.nav-label{font-size:9px;color:var(--text3);font-weight:600;letter-spacing:2px;text-transform:uppercase;padding:8px 8px 4px}
.nav-btn{display:flex;align-items:center;gap:10px;width:100%;padding:9px 12px;border-radius:8px;border:none;cursor:pointer;background:transparent;color:var(--text2);font-size:13px;font-weight:500;transition:all .2s;text-align:left;margin-bottom:2px}
.nav-btn:hover{background:var(--card2);color:var(--text1)}
.nav-btn.active{background:linear-gradient(135deg,rgba(0,212,255,.15),rgba(0,229,160,.08));color:var(--accent);border:1px solid rgba(0,212,255,.2)}
.nav-btn .icon{font-size:15px;width:20px;text-align:center}
.nav-badge{margin-left:auto;background:var(--accent);color:#000;font-size:9px;font-weight:700;padding:2px 6px;border-radius:10px}
.nav-badge.green{background:var(--green)}
.sidebar-footer{padding:16px 12px;border-top:1px solid var(--border);font-size:10px;color:var(--text3)}
.data-badge{background:rgba(0,229,160,.1);border:1px solid rgba(0,229,160,.2);border-radius:6px;padding:8px 10px;margin-bottom:8px}
.data-badge span{color:var(--green);font-weight:700;font-size:11px}
#main{margin-left:240px;min-height:100vh}
.topbar{background:var(--bg2);border-bottom:1px solid var(--border);padding:0 28px;height:60px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50}
.topbar-left{display:flex;align-items:center;gap:16px}
.page-title{font-size:16px;font-weight:700;color:var(--text1)}
.page-sub{font-size:12px;color:var(--text3)}
.topbar-right{display:flex;align-items:center;gap:12px}
.live-badge{display:flex;align-items:center;gap:6px;background:rgba(0,229,160,.1);border:1px solid rgba(0,229,160,.25);border-radius:20px;padding:5px 12px;font-size:11px;font-weight:600;color:var(--green)}
.live-dot{width:6px;height:6px;border-radius:50%;background:var(--green);animation:pulse 1.5s infinite}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)}}
.page{display:none;padding:28px}
.page.active{display:block}
.kpi-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:16px;margin-bottom:28px}
.kpi-card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:18px;position:relative;overflow:hidden;transition:all .2s}
.kpi-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--accent),var(--green));opacity:0;transition:opacity .2s}
.kpi-card:hover{border-color:var(--border2);transform:translateY(-2px);box-shadow:var(--glow)}
.kpi-card:hover::before{opacity:1}
.kpi-label{font-size:10px;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px}
.kpi-value{font-size:22px;font-weight:800;color:var(--text1);line-height:1;margin-bottom:6px}
.kpi-value.accent{color:var(--accent)}
.kpi-value.green{color:var(--green)}
.kpi-value.amber{color:var(--amber)}
.kpi-sub{font-size:11px;color:var(--text3)}
.kpi-icon{position:absolute;top:16px;right:16px;font-size:20px;opacity:.3}
.charts-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:28px}
.charts-grid-3{display:grid;grid-template-columns:2fr 1fr;gap:20px;margin-bottom:28px}
.chart-card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:20px}
.chart-card.full{grid-column:1/-1}
.chart-title{font-size:13px;font-weight:700;color:var(--text1);margin-bottom:4px}
.chart-sub{font-size:11px;color:var(--text3);margin-bottom:16px}
.chart-wrap{position:relative;height:220px}
.chart-wrap.tall{height:280px}
.section-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
.section-title{font-size:15px;font-weight:700;color:var(--text1)}
.section-sub{font-size:11px;color:var(--text3)}
.table-wrap{background:var(--card);border:1px solid var(--border);border-radius:14px;overflow:hidden}
.table-toolbar{padding:14px 18px;display:flex;align-items:center;gap:12px;border-bottom:1px solid var(--border);flex-wrap:wrap}
.search-box{flex:1;min-width:180px;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text1);font-size:12px;outline:none;transition:border-color .2s}
.search-box::placeholder{color:var(--text3)}
.search-box:focus{border-color:var(--accent)}
.filter-select{background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text1);font-size:12px;outline:none;cursor:pointer;transition:border-color .2s}
.filter-select:focus{border-color:var(--accent)}
.filter-select option{background:var(--bg3)}
table{width:100%;border-collapse:collapse}
thead{background:var(--bg3)}
th{padding:10px 14px;text-align:left;font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid var(--border);white-space:nowrap;cursor:pointer;user-select:none}
th:hover{color:var(--text2)}
td{padding:11px 14px;font-size:12px;color:var(--text2);border-bottom:1px solid rgba(30,45,74,.5);vertical-align:middle}
tr:last-child td{border-bottom:none}
tr:hover td{background:rgba(19,29,50,.6);color:var(--text1)}
.td-bold{font-weight:600;color:var(--text1)}
.td-mono{font-family:'Courier New',monospace;font-size:11px}
.badge{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:5px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;white-space:nowrap}
.badge-delivered{background:rgba(0,229,160,.15);color:var(--green);border:1px solid rgba(0,229,160,.25)}
.badge-contracted{background:rgba(0,212,255,.15);color:var(--accent);border:1px solid rgba(0,212,255,.25)}
.badge-retired{background:rgba(139,92,246,.15);color:var(--purple);border:1px solid rgba(139,92,246,.25)}
.badge-partial{background:rgba(245,158,11,.15);color:var(--amber);border:1px solid rgba(245,158,11,.25)}
.badge-bcr{background:rgba(0,212,255,.12);color:var(--accent)}
.badge-wood{background:rgba(0,229,160,.12);color:var(--green)}
.badge-beccs{background:rgba(139,92,246,.12);color:var(--purple)}
.badge-erw{background:rgba(245,158,11,.12);color:var(--amber)}
.badge-bgs{background:rgba(236,72,153,.12);color:var(--pink)}
.badge-other{background:rgba(90,115,153,.12);color:var(--text2)}
.pagination{display:flex;align-items:center;justify-content:space-between;padding:12px 18px;border-top:1px solid var(--border);font-size:12px;color:var(--text3)}
.page-btns{display:flex;gap:4px}
.page-btn{padding:5px 10px;border-radius:6px;border:1px solid var(--border);background:var(--bg3);color:var(--text2);font-size:12px;cursor:pointer;transition:all .2s}
.page-btn:hover{border-color:var(--accent);color:var(--accent)}
.page-btn.active{background:var(--accent);border-color:var(--accent);color:#000;font-weight:700}
.page-btn:disabled{opacity:.4;cursor:not-allowed}
.supplier-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.supplier-card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:18px;transition:all .2s;cursor:pointer}
.supplier-card:hover{border-color:var(--accent);box-shadow:var(--glow);transform:translateY(-2px)}
.sc-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px}
.sc-name{font-size:13px;font-weight:700;color:var(--text1);line-height:1.3}
.sc-country{font-size:11px;color:var(--text3);margin-top:3px}
.sc-rank{background:linear-gradient(135deg,var(--accent),var(--green));color:#000;font-size:10px;font-weight:800;width:24px;height:24px;border-radius:6px;display:flex;align-items:center;justify-content:center}
.sc-metrics{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
.sc-metric{background:var(--bg3);border-radius:8px;padding:8px}
.sc-metric-label{font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:.5px}
.sc-metric-value{font-size:14px;font-weight:700;color:var(--text1);margin-top:2px}
.sc-metric-value.green{color:var(--green)}
.sc-metric-value.accent{color:var(--accent)}
.delivery-bar{background:var(--border);border-radius:3px;height:4px;margin-top:10px;overflow:hidden}
.delivery-fill{height:100%;background:linear-gradient(90deg,var(--green2),var(--green));border-radius:3px;transition:width 1s ease}
.insight-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}
.insight-card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:22px}
.method-bars{display:flex;flex-direction:column;gap:10px}
.method-bar-item{}
.method-bar-header{display:flex;justify-content:space-between;margin-bottom:5px}
.method-bar-name{font-size:11px;color:var(--text2);font-weight:500}
.method-bar-val{font-size:11px;color:var(--text1);font-weight:700}
.method-bar-track{background:var(--border);border-radius:3px;height:6px;overflow:hidden}
.method-bar-fill{height:100%;border-radius:3px;transition:width 1.5s ease}
.status-legend{display:flex;flex-direction:column;gap:10px;margin-top:12px}
.status-item{display:flex;align-items:center;gap:10px}
.status-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
.status-name{font-size:12px;color:var(--text2);flex:1}
.status-count{font-size:12px;font-weight:700;color:var(--text1)}
.ribbon{background:linear-gradient(135deg,rgba(0,212,255,.08),rgba(0,229,160,.05));border:1px solid rgba(0,212,255,.15);border-radius:10px;padding:12px 16px;display:flex;align-items:center;gap:12px;margin-bottom:16px}
.ribbon-icon{font-size:20px}
.ribbon-text{font-size:12px;color:var(--text2)}
.ribbon-text strong{color:var(--accent)}
.col-toggle{display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text2);cursor:pointer;padding:4px 8px;border-radius:5px;border:1px solid var(--border);background:var(--bg3);transition:all .15s;user-select:none;white-space:nowrap}
.col-toggle:hover{border-color:var(--accent);color:var(--text1)}
.col-toggle input{cursor:pointer}
.dc-row-new td{background:rgba(0,229,160,.04)!important;}
.dc-row-new td:first-child{border-left:3px solid var(--green);}
.dc-row-active td{background:rgba(245,158,11,.03)!important;}
.dc-row-active td:first-child{border-left:3px solid var(--amber);}
.dc-source-puro{color:var(--green2);font-weight:600;font-size:10px;}
.dc-source-cdr{color:var(--accent);font-weight:600;font-size:10px;}
.dc-source-rainbow{color:var(--purple);font-weight:600;font-size:10px;}
.dc-source-iso{color:var(--pink);font-weight:600;font-size:10px;}
.hero-glow{position:absolute;width:500px;height:300px;border-radius:50%;background:radial-gradient(ellipse,rgba(0,212,255,.06),transparent 70%);pointer-events:none;top:-100px;right:-100px}
@media(max-width:1200px){.kpi-grid{grid-template-columns:repeat(3,1fr)}.supplier-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:900px){#sidebar{width:60px}.logo-text,.logo-sub,.nav-btn span,.nav-label,.nav-badge,.sidebar-footer .data-badge{display:none}.nav-btn{justify-content:center;padding:10px}#main{margin-left:60px}.kpi-grid{grid-template-columns:repeat(2,1fr)}.charts-grid,.charts-grid-3{grid-template-columns:1fr}.supplier-grid{grid-template-columns:1fr}.insight-grid{grid-template-columns:1fr}}
</style>
</head>
<body>

<nav id="sidebar">
  <div class="logo-area">
    <div class="logo-badge">
      <div class="logo-icon">🌍</div>
      <div>
        <div class="logo-text">CDR Intelligence</div>
        <div class="logo-sub">Platform</div>
      </div>
    </div>
  </div>
  <nav>
    <div class="nav-section">
      <div class="nav-label">Overview</div>
      <button class="nav-btn active" onclick="showPage('dashboard')"><span class="icon">📊</span><span>Dashboard</span></button>
    </div>
    <div class="nav-section">
      <div class="nav-label">Market Data</div>
      <button class="nav-btn" onclick="showPage('transactions')"><span class="icon">⚡</span><span>Transactions</span><span class="nav-badge">5.5K</span></button>
      <button class="nav-btn" onclick="showPage('suppliers')"><span class="icon">🏭</span><span>Suppliers</span><span class="nav-badge">212</span></button>
    </div>
    <div class="nav-section">
      <div class="nav-label">Registry</div>
      <button class="nav-btn" onclick="showPage('projects')"><span class="icon">🌱</span><span>Puro Projects</span><span class="nav-badge green">113</span></button>
      <button class="nav-btn" onclick="showPage('methods')"><span class="icon">🔬</span><span>Methods</span></button>
    </div>
    <div class="nav-section">
      <div class="nav-label">Analysis</div>
      <button class="nav-btn" onclick="showPage('insights')"><span class="icon">🧠</span><span>Insights</span></button>
    </div>
    <div class="nav-section">
      <div class="nav-label">Other Registries</div>
      <button class="nav-btn" onclick="showPage('rainbow')"><span class="icon">🌈</span><span>Rainbow Standard</span><span class="nav-badge" style="background:var(--purple)">115</span></button>
      <button class="nav-btn" onclick="showPage('isometric')"><span class="icon">⚖️</span><span>Isometric</span><span class="nav-badge" style="background:var(--pink)">305</span></button>
    </div>
    <div class="nav-section">
      <div class="nav-label">Tools</div>
      <button class="nav-btn" onclick="showPage('datacontrol')" style="position:relative;"><span class="icon">🗄️</span><span>Data Control</span><span class="nav-badge" style="background:linear-gradient(135deg,#f59e0b,#ef4444);">NEW</span></button>
    </div>
  </nav>
  <div class="sidebar-footer">
    <div class="data-badge">
      <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;">Data Coverage</div>
      <span>5,498 transactions</span><br>
      <span style="color:var(--text3);font-size:10px;">4 Registries · May 2026</span>
    </div>
    <div style="font-size:10px;color:var(--text3);">Puro · CDR.fyi · Rainbow · Isometric</div>
  </div>
</nav>

<div id="main">
  <div class="topbar">
    <div class="topbar-left">
      <div>
        <div class="page-title" id="page-title">Dashboard</div>
        <div class="page-sub" id="page-sub">CDR market overview · Oct 2025</div>
      </div>
    </div>
    <div class="topbar-right">
      <div class="live-badge"><div class="live-dot"></div>Live Data</div>
      <div style="font-size:11px;color:var(--text3);padding:5px 12px;background:var(--bg3);border:1px solid var(--border);border-radius:8px;">🗓 May 8, 2026</div>
    </div>
  </div>

  <!-- DASHBOARD -->
  <div class="page active" id="page-dashboard">
    <div style="position:relative;">
      <div class="hero-glow"></div>
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-label">Total Committed</div><div class="kpi-value accent">38.5M</div><div class="kpi-sub">tonnes CO₂e</div><div class="kpi-icon">📦</div></div>
        <div class="kpi-card"><div class="kpi-label">Total Delivered</div><div class="kpi-value green">927K</div><div class="kpi-sub">tonnes CO₂e</div><div class="kpi-icon">✅</div></div>
        <div class="kpi-card"><div class="kpi-label">Delivery Rate</div><div class="kpi-value amber">2.41%</div><div class="kpi-sub">committed → delivered</div><div class="kpi-icon">📈</div></div>
        <div class="kpi-card"><div class="kpi-label">Transactions</div><div class="kpi-value">5,490</div><div class="kpi-sub">total orders</div><div class="kpi-icon">⚡</div></div>
        <div class="kpi-card"><div class="kpi-label">Unique Suppliers</div><div class="kpi-value">213</div><div class="kpi-sub">active producers</div><div class="kpi-icon">🏭</div></div>
        <div class="kpi-card"><div class="kpi-label">Unique Buyers</div><div class="kpi-value">517</div><div class="kpi-sub">purchasers</div><div class="kpi-icon">🏢</div></div>
      </div>
      <div class="charts-grid-3">
        <div class="chart-card">
          <div class="chart-title">Volume by CDR Method</div>
          <div class="chart-sub">Total tonnes committed per removal pathway</div>
          <div class="chart-wrap tall"><canvas id="methodChart"></canvas></div>
        </div>
        <div class="chart-card">
          <div class="chart-title">Transaction Status</div>
          <div class="chart-sub">Distribution of 5,490 orders</div>
          <div style="display:flex;align-items:center;justify-content:center;height:180px;">
            <canvas id="statusChart" style="max-width:160px;max-height:160px;"></canvas>
          </div>
          <div class="status-legend" id="statusLegend"></div>
        </div>
      </div>
      <div class="charts-grid">
        <div class="chart-card">
          <div class="chart-title">Top 10 Suppliers by Delivery</div>
          <div class="chart-sub">Tonnes CO₂ actually delivered</div>
          <div class="chart-wrap"><canvas id="supplierChart"></canvas></div>
        </div>
        <div class="chart-card">
          <div class="chart-title">Delivery Performance by Method</div>
          <div class="chart-sub">Committed vs. Delivered — log scale (tCO₂e)</div>
          <div class="chart-wrap"><canvas id="deliveryChart"></canvas></div>
        </div>
      </div>
      <div class="section-header">
        <div>
          <div class="section-title">Puro.earth Registry — 113 Projects</div>
          <div class="section-sub">Registered removal projects by methodology and country</div>
        </div>
      </div>
      <div class="charts-grid">
        <div class="chart-card">
          <div class="chart-title">Projects by Methodology</div>
          <div class="chart-sub">From Puro.earth official registry export — May 2026</div>
          <div class="chart-wrap"><canvas id="puroMethodChart"></canvas></div>
        </div>
        <div class="chart-card">
          <div class="chart-title">Projects by Country (Top 10)</div>
          <div class="chart-sub">Geographic distribution of Puro projects</div>
          <div class="chart-wrap"><canvas id="puroCountryChart"></canvas></div>
        </div>
      </div>

      <!-- CROSS-REGISTRY OVERVIEW -->
      <div class="section-header" style="margin-top:8px;">
        <div>
          <div class="section-title">🌐 Multi-Registry Overview</div>
          <div class="section-sub">Aggregated data across 4 registries: Puro.earth, CDR.fyi, Rainbow Standard, Isometric</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px;">
        <div class="kpi-card" style="border-color:rgba(0,212,255,0.3);">
          <div class="kpi-label">Puro.earth</div>
          <div class="kpi-value accent" style="font-size:18px;">113</div>
          <div class="kpi-sub">registered projects</div>
          <div style="margin-top:8px;font-size:10px;color:var(--text3);">38.5M t committed · 927K t delivered</div>
          <div style="margin-top:6px;"><span class="badge badge-bcr">8 methods</span></div>
        </div>
        <div class="kpi-card" style="border-color:rgba(0,229,160,0.3);">
          <div class="kpi-label">CDR.fyi Market</div>
          <div class="kpi-value green" style="font-size:18px;">5,490</div>
          <div class="kpi-sub">transactions tracked</div>
          <div style="margin-top:8px;font-size:10px;color:var(--text3);">213 suppliers · 517 buyers</div>
          <div style="margin-top:6px;"><span class="badge badge-delivered">2020–2025</span></div>
        </div>
        <div class="kpi-card" style="border-color:rgba(139,92,246,0.3);">
          <div class="kpi-label">Rainbow Standard</div>
          <div class="kpi-value" style="font-size:18px;color:var(--purple);">115</div>
          <div class="kpi-sub">listed projects</div>
          <div style="margin-top:8px;font-size:10px;color:var(--text3);">421,377 credits issued · 25 countries</div>
          <div style="margin-top:6px;"><span class="badge" style="background:rgba(139,92,246,0.15);color:var(--purple);border:1px solid rgba(139,92,246,0.25);">BiCRS + Avoidance</span></div>
        </div>
        <div class="kpi-card" style="border-color:rgba(236,72,153,0.3);">
          <div class="kpi-label">Isometric</div>
          <div class="kpi-value" style="font-size:18px;color:var(--pink);">99,731</div>
          <div class="kpi-sub">credits issued</div>
          <div style="margin-top:8px;font-size:10px;color:var(--text3);">305 issuances · 32,616 retired</div>
          <div style="margin-top:6px;"><span class="badge" style="background:rgba(236,72,153,0.15);color:var(--pink);border:1px solid rgba(236,72,153,0.25);">17 protocols</span></div>
        </div>
      </div>
      <div class="charts-grid">
        <div class="chart-card">
          <div class="chart-title">Credits Issued by Registry</div>
          <div class="chart-sub">Comparison of verified credits across registries</div>
          <div class="chart-wrap"><canvas id="registryCompareChart"></canvas></div>
        </div>
        <div class="chart-card">
          <div class="chart-title">Rainbow Standard — Credits by Methodology</div>
          <div class="chart-sub">Distribution of issued credits across pathways</div>
          <div class="chart-wrap"><canvas id="rainbowMethodChart"></canvas></div>
        </div>
      </div>
    </div>
  </div>

  <!-- TRANSACTIONS -->
  <div class="page" id="page-transactions">
    <div class="ribbon"><div class="ribbon-icon">⚡</div><div class="ribbon-text"><strong>5,498 transactions</strong> · Real CDR market data from 2020 to Oct 2025 · Sources: Puro.earth, ACT, Carbonfuture, Isometric, Frontier, South Pole</div></div>
    <div class="table-wrap">
      <div class="table-toolbar">
        <input type="text" class="search-box" id="tx-search" placeholder="🔍  Search supplier, buyer, method..." oninput="filterTx()">
        <select class="filter-select" id="tx-method" onchange="filterTx()">
          <option value="">All Methods</option>
          <option>Biochar Carbon Removal BCR</option>
          <option>Biomass Geological Sequestration</option>
          <option>Mineralization</option>
          <option>Bioenergy With Carbon Capture And Sequestration BECCS</option>
          <option>Marine Biomass Carbon Capture And Sequestration MBCCS</option>
          <option>Biomass Direct Storage</option>
          <option>Enhanced Weathering</option>
          <option>Direct Air Carbon Capture And Sequestration DACCS</option>
          <option>Alkalinity Enhancement</option>
          <option>Direct Ocean Removal</option>
        </select>
        <select class="filter-select" id="tx-status" onchange="filterTx()">
          <option value="">All Statuses</option>
          <option>Delivered</option>
          <option>Contracted</option>
          <option>Retired</option>
          <option>Partial</option>
        </select>
        <select class="filter-select" id="tx-marketplace" onchange="filterTx()">
          <option value="">All Marketplaces</option>
          <option>Puro</option>
          <option>ACT</option>
          <option>Carbonfuture</option>
        </select>
        <span id="tx-count" style="font-size:12px;color:var(--text3);margin-left:auto;white-space:nowrap;"></span>
      </div>
      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th onclick="sortTx('date')">Date ↕</th>
              <th onclick="sortTx('supplier')">Supplier ↕</th>
              <th onclick="sortTx('purchaser')">Purchaser ↕</th>
              <th onclick="sortTx('method')">Method ↕</th>
              <th onclick="sortTx('tonnes')" style="text-align:right;">Tonnes ↕</th>
              <th onclick="sortTx('delivered')" style="text-align:right;">Delivered ↕</th>
              <th onclick="sortTx('status')">Status ↕</th>
              <th>Marketplace</th>
            </tr>
          </thead>
          <tbody id="tx-body"></tbody>
        </table>
      </div>
      <div class="pagination">
        <span id="tx-info"></span>
        <div class="page-btns" id="tx-pages"></div>
      </div>
    </div>
  </div>

  <!-- SUPPLIERS -->
  <div class="page" id="page-suppliers">
    <div class="ribbon"><div class="ribbon-icon">🏭</div><div class="ribbon-text"><strong>212 CDR Suppliers</strong> tracked · Ranked by total tonnes delivered · Includes delivery rate, technology, pricing</div></div>
    <div style="margin-bottom:16px;display:flex;gap:12px;flex-wrap:wrap;">
      <input type="text" class="search-box" style="max-width:280px;" id="sup-search" placeholder="🔍  Search supplier, country..." oninput="filterSup()">
      <select class="filter-select" id="sup-tech" onchange="filterSup()">
        <option value="">All Technologies</option>
        <option>Biochar Carbon Removal BCR</option>
        <option>Biomass Geological Sequestration</option>
        <option>Enhanced Weathering</option>
        <option>Direct Air Carbon Capture And Sequestration DACCS</option>
        <option>Mineralization</option>
        <option>Marine Biomass Carbon Capture And Sequestration MBCCS</option>
      </select>
      <select class="filter-select" id="sup-country" onchange="filterSup()"></select>
    </div>
    <div class="supplier-grid" id="supplier-grid"></div>
    <div class="pagination" style="background:var(--card);border:1px solid var(--border);border-radius:14px;margin-top:16px;">
      <span id="sup-info"></span>
      <div class="page-btns" id="sup-pages"></div>
    </div>
  </div>

  <!-- PROJECTS -->
  <div class="page" id="page-projects">
    <div class="ribbon"><div class="ribbon-icon">🌱</div><div class="ribbon-text"><strong>113 projects</strong> from Puro.earth official registry · May 8, 2026 export · 8 CDR methodologies · 30+ countries</div></div>
    <div class="table-wrap">
      <div class="table-toolbar">
        <input type="text" class="search-box" id="proj-search" placeholder="🔍  Search project name, supplier, country..." oninput="filterProj()">
        <select class="filter-select" id="proj-method" onchange="filterProj()">
          <option value="">All Methods</option>
          <option>Biochar Carbon Removal</option>
          <option>Wood in Construction</option>
          <option>Biomass Geological Seq.</option>
          <option>Enhanced Rock Weathering</option>
          <option>Carbonization Org. Waste</option>
          <option>BECCS</option>
          <option>BECCS (v2)</option>
        </select>
        <select class="filter-select" id="proj-country" onchange="filterProj()"></select>
        <span id="proj-count" style="font-size:12px;color:var(--text3);margin-left:auto;white-space:nowrap;"></span>
      </div>
      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th onclick="sortProj('id')">ID ↕</th>
              <th onclick="sortProj('name')">Project Name ↕</th>
              <th onclick="sortProj('supplier')">Supplier ↕</th>
              <th onclick="sortProj('method')">Methodology ↕</th>
              <th onclick="sortProj('country')">Country ↕</th>
              <th onclick="sortProj('start')">Start ↕</th>
              <th onclick="sortProj('end')">End ↕</th>
              <th>Status</th>
              <th>Rules Version</th>
            </tr>
          </thead>
          <tbody id="proj-body"></tbody>
        </table>
      </div>
      <div class="pagination">
        <span id="proj-info"></span>
        <div class="page-btns" id="proj-pages"></div>
      </div>
    </div>
  </div>

  <!-- METHODS -->
  <div class="page" id="page-methods">
    <div id="methods-content"></div>
  </div>

  <!-- INSIGHTS -->
  <div class="page" id="page-insights">
    <div class="insight-grid" id="insights-content"></div>
  </div>

  <!-- RAINBOW STANDARD -->
  <div class="page" id="page-rainbow">
    <div class="ribbon" style="background:linear-gradient(135deg,rgba(139,92,246,.08),rgba(236,72,153,.05));border-color:rgba(139,92,246,.2);">
      <div class="ribbon-icon">🌈</div>
      <div class="ribbon-text"><strong style="color:var(--purple);">Rainbow Standard Registry</strong> · 115 projects · Biomass Carbon Removal, Biobased Construction, Biogas, Electronic Refurbishment · 25 countries · registry.rainbowstandard.io</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:12px;margin-bottom:24px;">
      <div class="kpi-card"><div class="kpi-label">Total Projects</div><div class="kpi-value" style="color:var(--purple);" id="rb-total">115</div><div class="kpi-sub">registered projects</div><div class="kpi-icon">📋</div></div>
      <div class="kpi-card"><div class="kpi-label">Credits Issued</div><div class="kpi-value" style="color:var(--pink);" id="rb-issued">421,377</div><div class="kpi-sub">tCO₂eq verified</div><div class="kpi-icon">✅</div></div>
      <div class="kpi-card"><div class="kpi-label">Credits Available</div><div class="kpi-value green" id="rb-available">282,202</div><div class="kpi-sub">on market now</div><div class="kpi-icon">💹</div></div>
      <div class="kpi-card"><div class="kpi-label">Credited Projects</div><div class="kpi-value accent" id="rb-credited">—</div><div class="kpi-sub">with issued credits</div><div class="kpi-icon">🌱</div></div>
      <div class="kpi-card"><div class="kpi-label">Removal Projects</div><div class="kpi-value" style="color:var(--purple);" id="rb-removal">—</div><div class="kpi-sub">BiCRS + construction</div><div class="kpi-icon">⬇️</div></div>
      <div class="kpi-card"><div class="kpi-label">Avoidance Projects</div><div class="kpi-value amber" id="rb-avoid">—</div><div class="kpi-sub">Biogas + refurb</div><div class="kpi-icon">🛡️</div></div>
      <div class="kpi-card"><div class="kpi-label">Countries</div><div class="kpi-value" id="rb-countries">25</div><div class="kpi-sub">unique countries</div><div class="kpi-icon">🌍</div></div>
    </div>
    <div class="charts-grid" style="margin-bottom:24px;">
      <div class="chart-card">
        <div class="chart-title">Projects by Methodology</div>
        <div class="chart-sub">Distribution across Rainbow Standard pathways</div>
        <div class="chart-wrap"><canvas id="rbMethodChart"></canvas></div>
      </div>
      <div class="chart-card">
        <div class="chart-title">Projects by Country</div>
        <div class="chart-sub">Geographic distribution of registered projects</div>
        <div class="chart-wrap"><canvas id="rbCountryChart"></canvas></div>
      </div>
    </div>
    <div class="charts-grid" style="margin-bottom:24px;">
      <div class="chart-card">
        <div class="chart-title">Project Status Distribution</div>
        <div class="chart-sub">Credited · Validated · Listed · Registered · Withdrawn</div>
        <div style="display:flex;align-items:center;justify-content:center;height:180px;">
          <canvas id="rbStatusChart" style="max-width:160px;max-height:160px;"></canvas>
        </div>
        <div class="status-legend" id="rbStatusLegend"></div>
      </div>
      <div class="chart-card">
        <div class="chart-title">Credits by Methodology</div>
        <div class="chart-sub">Total issued credits per pathway (Credited projects only)</div>
        <div class="chart-wrap"><canvas id="rbCreditsChart"></canvas></div>
      </div>
    </div>
    <div class="table-wrap">
      <div class="table-toolbar">
        <input type="text" class="search-box" id="rb-search" placeholder="🔍  Search project, company, country..." oninput="filterRb()">
        <select class="filter-select" id="rb-type" onchange="filterRb()">
          <option value="">All Types</option>
          <option value="Removal">Removal</option>
          <option value="Avoidance">Avoidance</option>
        </select>
        <select class="filter-select" id="rb-method" onchange="filterRb()">
          <option value="">All Methodologies</option>
          <option value="Biomass carbon removal and storage">Biomass carbon removal</option>
          <option value="Biobased construction materials">Biobased construction</option>
          <option value="Biogas from anaerobic digestion">Biogas</option>
          <option value="Refurbishing of electronic devices">Electronic refurbishment</option>
          <option value="General requirements">General requirements</option>
          <option value="Textile recycling">Textile recycling</option>
        </select>
        <select class="filter-select" id="rb-mechanism" onchange="filterRb()">
          <option value="">All Mechanisms</option>
          <option value="REMOVAL">Removal</option>
          <option value="AVOIDANCE">Avoidance</option>
        </select>
        <select class="filter-select" id="rb-status" onchange="filterRb()">
          <option value="">All Statuses</option>
          <option value="CREDITED">Credited</option>
          <option value="VALIDATED">Validated</option>
          <option value="LISTED">Listed</option>
          <option value="REGISTERED">Registered</option>
          <option value="PUBLIC_COMMENT_PERIOD">Comment Period</option>
          <option value="REJECTED">Rejected</option>
          <option value="WITHDRAWN">Withdrawn</option>
        </select>
        <span id="rb-count" style="font-size:12px;color:var(--text3);margin-left:auto;white-space:nowrap;"></span>
      </div>
      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th onclick="sortRb('name')">Project ↕</th>
              <th onclick="sortRb('developer')">Developer ↕</th>
              <th onclick="sortRb('methodology')">Methodology ↕</th>
              <th onclick="sortRb('mechanism')">Mechanism ↕</th>
              <th onclick="sortRb('country')">Country ↕</th>
              <th onclick="sortRb('city')">City ↕</th>
              <th onclick="sortRb('status')">Status ↕</th>
              <th onclick="sortRb('issuedCredits')" style="text-align:right;">Issued ↕</th>
              <th onclick="sortRb('availableCredits')" style="text-align:right;">Available ↕</th>
              <th>Durability</th>
            </tr>
          </thead>
          <tbody id="rb-body"></tbody>
        </table>
      </div>
      <div class="pagination">
        <span id="rb-info"></span>
        <div class="page-btns" id="rb-pages"></div>
      </div>
    </div>
  </div>

  <!-- ISOMETRIC -->
  <div class="page" id="page-isometric">
    <div class="ribbon" style="background:linear-gradient(135deg,rgba(236,72,153,.08),rgba(139,92,246,.05));border-color:rgba(236,72,153,.2);">
      <div class="ribbon-icon">⚖️</div>
      <div class="ribbon-text"><strong style="color:var(--pink);">Isometric Registry</strong> · 305 issuances · 17 certified protocols · BiCRS, EW, Marine, DACCS · registry.isometric.com</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:16px;margin-bottom:24px;">
      <div class="kpi-card"><div class="kpi-label">Credits Issued</div><div class="kpi-value" style="color:var(--pink);">99,731</div><div class="kpi-sub">tCO₂ verified</div><div class="kpi-icon">📋</div></div>
      <div class="kpi-card"><div class="kpi-label">Credits Retired</div><div class="kpi-value" style="color:var(--purple);">32,616</div><div class="kpi-sub">permanently retired</div><div class="kpi-icon">🔒</div></div>
      <div class="kpi-card"><div class="kpi-label">Retirement Rate</div><div class="kpi-value green">32.7%</div><div class="kpi-sub">issued → retired</div><div class="kpi-icon">📈</div></div>
      <div class="kpi-card"><div class="kpi-label">Total Issuances</div><div class="kpi-value accent">305</div><div class="kpi-sub">credit batches</div><div class="kpi-icon">⚡</div></div>
      <div class="kpi-card"><div class="kpi-label">Active Protocols</div><div class="kpi-value amber">17</div><div class="kpi-sub">certified pathways</div><div class="kpi-icon">🔬</div></div>
    </div>
    <div class="charts-grid" style="margin-bottom:24px;">
      <div class="chart-card">
        <div class="chart-title">Credits by CDR Pathway</div>
        <div class="chart-sub">Total credits issued across Isometric pathways (all 305 issuances)</div>
        <div class="chart-wrap"><canvas id="isoPathwayChart"></canvas></div>
      </div>
      <div class="chart-card">
        <div class="chart-title">Top Suppliers by Credits Issued</div>
        <div class="chart-sub">Leading suppliers in recent issuances (BiCRS dominant)</div>
        <div class="chart-wrap"><canvas id="isoSupplierChart"></canvas></div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px;margin-bottom:24px;">
      <div class="chart-card">
        <div class="chart-title">🔬 Certified Protocols (17)</div>
        <div class="chart-sub">All pathways currently under the Isometric Standard</div>
        <div id="iso-protocols-grid" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:14px;"></div>
      </div>
      <div class="chart-card">
        <div class="chart-title">Issued vs Retired Credits</div>
        <div class="chart-sub">Issuance lifecycle status</div>
        <div style="display:flex;align-items:center;justify-content:center;height:180px;">
          <canvas id="isoStatusChart" style="max-width:180px;max-height:180px;"></canvas>
        </div>
      </div>
    </div>
    <div class="table-wrap">
      <div class="table-toolbar">
        <input type="text" class="search-box" id="iso-search" placeholder="🔍  Search supplier, project, pathway..." oninput="filterIso()">
        <select class="filter-select" id="iso-pathway" onchange="filterIso()">
          <option value="">All Pathways</option>
          <option value="BiCRS">BiCRS</option>
          <option value="EW">Enhanced Weathering</option>
          <option value="Marine">Marine</option>
          <option value="DACCS">DACCS</option>
        </select>
        <span id="iso-count" style="font-size:12px;color:var(--text3);margin-left:auto;white-space:nowrap;"></span>
      </div>
      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th onclick="sortIso('supplier')">Supplier ↕</th>
              <th onclick="sortIso('project')">Project ↕</th>
              <th onclick="sortIso('pathway')">Pathway ↕</th>
              <th onclick="sortIso('date')">Issuance Date ↕</th>
              <th onclick="sortIso('credits')" style="text-align:right;">Credits ↕</th>
              <th>Durability</th>
              <th>Certificate</th>
            </tr>
          </thead>
          <tbody id="iso-body"></tbody>
        </table>
      </div>
      <div class="pagination">
        <span id="iso-info"></span>
        <div class="page-btns" id="iso-pages"></div>
      </div>
    </div>
    <div style="margin-top:20px;" class="chart-card">
      <div class="chart-title">ℹ️ About Isometric Standard</div>
      <div class="chart-sub" style="margin-top:8px;line-height:1.8;">
        Isometric is an independent carbon registry built from the ground up for scientific rigor. Every credit is verified against the Isometric Standard — a protocol library covering 17 CDR pathways across removal and avoidance categories. Credits represent 1 tonne of CO₂ removed from the atmosphere. The registry provides full provenance data, issuance certificates, and transparent retirement tracking.
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px;">
        <div class="sc-metric" style="text-align:center;padding:14px;">
          <div class="sc-metric-label">Permanence Focus</div>
          <div style="font-size:20px;margin:6px 0;">⏳</div>
          <div style="font-size:11px;color:var(--text2);">Most credits rated 200Y+ or 1,000Y+ durability</div>
        </div>
        <div class="sc-metric" style="text-align:center;padding:14px;">
          <div class="sc-metric-label">Transparent MRV</div>
          <div style="font-size:20px;margin:6px 0;">🔍</div>
          <div style="font-size:11px;color:var(--text2);">Every issuance includes certificate and full data provenance</div>
        </div>
        <div class="sc-metric" style="text-align:center;padding:14px;">
          <div class="sc-metric-label">Science-First</div>
          <div style="font-size:20px;margin:6px 0;">🔬</div>
          <div style="font-size:11px;color:var(--text2);">Protocols developed with leading climate scientists and institutions</div>
        </div>
      </div>
    </div>
  </div>

  <!-- DATA CONTROL CENTER -->
  <div class="page" id="page-datacontrol">
    <div class="ribbon" style="background:linear-gradient(135deg,rgba(245,158,11,.08),rgba(239,68,68,.05));border-color:rgba(245,158,11,.25);">
      <div class="ribbon-icon">🗄️</div>
      <div class="ribbon-text"><strong style="color:var(--amber);">Data Control Center</strong> · Unified view of all CDR registries · Filter · Sort · Export · Track updates · registry.rainbowstandard.io · registry.isometric.com · puro.earth · cdr.fyi</div>
      <div style="margin-left:auto;display:flex;gap:8px;flex-shrink:0;">
        <button onclick="dcExportCSV()" style="background:rgba(0,229,160,.12);border:1px solid rgba(0,229,160,.3);color:var(--green);padding:6px 14px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">⬇ CSV</button>
        <button onclick="dcExportXLSX()" style="background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.3);color:var(--amber);padding:6px 14px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">⬇ XLSX</button>
      </div>
    </div>

    <!-- KPI strip -->
    <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:20px;" id="dc-kpi-strip">
      <div class="kpi-card" style="padding:14px;"><div class="kpi-label">Total Records</div><div class="kpi-value" style="font-size:22px;color:var(--amber);" id="dc-total">—</div><div class="kpi-sub">across all registries</div></div>
      <div class="kpi-card" style="padding:14px;"><div class="kpi-label">Filtered</div><div class="kpi-value" style="font-size:22px;color:var(--accent);" id="dc-filtered">—</div><div class="kpi-sub">matching current filters</div></div>
      <div class="kpi-card" style="padding:14px;"><div class="kpi-label">New (last 90d)</div><div class="kpi-value green" style="font-size:22px;" id="dc-new">—</div><div class="kpi-sub">recently added</div></div>
      <div class="kpi-card" style="padding:14px;"><div class="kpi-label">Sources</div><div class="kpi-value" style="font-size:22px;color:var(--purple);">4</div><div class="kpi-sub">registries unified</div></div>
      <div class="kpi-card" style="padding:14px;"><div class="kpi-label">Total Volume</div><div class="kpi-value" style="font-size:22px;color:var(--pink);" id="dc-volume">—</div><div class="kpi-sub">tCO₂ in view</div></div>
      <div class="kpi-card" style="padding:14px;"><div class="kpi-label">Last Refresh</div><div class="kpi-value" style="font-size:14px;color:var(--text2);" id="dc-refreshed">—</div><div class="kpi-sub">data snapshot</div></div>
    </div>

    <!-- Toolbar -->
    <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:16px;">
      <!-- Row 1: search + source + show-new toggle -->
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:12px;">
        <input type="text" id="dc-search" placeholder="🔍  Search any field…" oninput="filterDC()" style="flex:1;min-width:200px;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:9px 14px;color:var(--text1);font-size:13px;outline:none;">
        <select id="dc-source" onchange="filterDC()" class="filter-select">
          <option value="">All Sources</option>
          <option value="Puro.earth">Puro.earth</option>
          <option value="CDR.fyi">CDR.fyi</option>
          <option value="Rainbow Standard">Rainbow Standard</option>
          <option value="Isometric">Isometric</option>
        </select>
        <select id="dc-mechanism" onchange="filterDC()" class="filter-select">
          <option value="">All Mechanisms</option>
          <option value="Removal">Removal</option>
          <option value="Avoidance">Avoidance</option>
          <option value="Transaction">Transaction</option>
        </select>
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text2);cursor:pointer;white-space:nowrap;">
          <input type="checkbox" id="dc-only-new" onchange="filterDC()" style="accent-color:var(--green);width:14px;height:14px;"> <span style="color:var(--green);font-weight:600;">🟢 New only</span>
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text2);cursor:pointer;white-space:nowrap;">
          <input type="checkbox" id="dc-only-credited" onchange="filterDC()" style="accent-color:var(--amber);width:14px;height:14px;"> <span style="color:var(--amber);font-weight:600;">⭐ Credited only</span>
        </label>
        <button onclick="dcResetFilters()" style="background:transparent;border:1px solid var(--border2);color:var(--text3);padding:8px 14px;border-radius:8px;cursor:pointer;font-size:12px;white-space:nowrap;">✕ Reset</button>
      </div>
      <!-- Row 2: date range + country + methodology + volume -->
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:12px;">
        <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text3);">
          <span>📅 From</span>
          <input type="date" id="dc-date-from" onchange="filterDC()" style="background:var(--bg3);border:1px solid var(--border2);border-radius:6px;padding:6px 10px;color:var(--text2);font-size:12px;outline:none;">
          <span>To</span>
          <input type="date" id="dc-date-to" onchange="filterDC()" style="background:var(--bg3);border:1px solid var(--border2);border-radius:6px;padding:6px 10px;color:var(--text2);font-size:12px;outline:none;">
        </div>
        <select id="dc-country" onchange="filterDC()" class="filter-select">
          <option value="">All Countries</option>
        </select>
        <select id="dc-methodology" onchange="filterDC()" class="filter-select">
          <option value="">All Methodologies</option>
        </select>
        <select id="dc-status" onchange="filterDC()" class="filter-select">
          <option value="">All Statuses</option>
          <option value="CREDITED">Credited</option>
          <option value="VALIDATED">Validated</option>
          <option value="LISTED">Listed</option>
          <option value="REGISTERED">Registered</option>
          <option value="Delivered">Delivered</option>
          <option value="Contracted">Contracted</option>
          <option value="Partial">Partial</option>
        </select>
      </div>
      <!-- Row 3: column visibility -->
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
        <span style="font-size:11px;color:var(--text3);font-weight:600;letter-spacing:1px;text-transform:uppercase;">Columns:</span>
        <label class="col-toggle"><input type="checkbox" checked onchange="dcToggleCol('dc-col-source')"> Source</label>
        <label class="col-toggle"><input type="checkbox" checked onchange="dcToggleCol('dc-col-company')"> Company</label>
        <label class="col-toggle"><input type="checkbox" checked onchange="dcToggleCol('dc-col-methodology')"> Methodology</label>
        <label class="col-toggle"><input type="checkbox" checked onchange="dcToggleCol('dc-col-country')"> Country</label>
        <label class="col-toggle"><input type="checkbox" checked onchange="dcToggleCol('dc-col-date')"> Date</label>
        <label class="col-toggle"><input type="checkbox" checked onchange="dcToggleCol('dc-col-volume')"> Volume</label>
        <label class="col-toggle"><input type="checkbox" checked onchange="dcToggleCol('dc-col-price')"> Price</label>
        <label class="col-toggle"><input type="checkbox" checked onchange="dcToggleCol('dc-col-status')"> Status</label>
        <label class="col-toggle"><input type="checkbox" checked onchange="dcToggleCol('dc-col-mechanism')"> Mechanism</label>
        <label class="col-toggle"><input type="checkbox" onchange="dcToggleCol('dc-col-notes')"> Notes</label>
        <div style="margin-left:auto;display:flex;align-items:center;gap:10px;">
          <label style="font-size:11px;color:var(--text3);">Rows/page:</label>
          <select id="dc-per-page" onchange="DC_PER_PAGE=+this.value;dcPage=1;renderDCTable();" class="filter-select" style="width:80px;">
            <option value="25">25</option>
            <option value="50" selected>50</option>
            <option value="100">100</option>
            <option value="250">250</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;overflow:hidden;">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--border);background:var(--card2);">
        <span id="dc-count" style="font-size:12px;color:var(--text3);"></span>
        <div style="display:flex;gap:8px;align-items:center;">
          <span style="font-size:11px;color:var(--text3);">Sort by:</span>
          <select id="dc-sort-field" onchange="dcSortKey=this.value;filterDC();" class="filter-select" style="width:130px;">
            <option value="date">Date</option>
            <option value="volume">Volume</option>
            <option value="name">Name</option>
            <option value="company">Company</option>
            <option value="country">Country</option>
            <option value="source">Source</option>
            <option value="status">Status</option>
          </select>
          <button id="dc-sort-dir-btn" onclick="dcSortDir*=-1;document.getElementById('dc-sort-dir-btn').textContent=dcSortDir===1?'↑ ASC':'↓ DESC';filterDC();" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text2);padding:5px 10px;border-radius:6px;cursor:pointer;font-size:11px;">↓ DESC</button>
        </div>
      </div>
      <div style="overflow-x:auto;max-height:65vh;overflow-y:auto;" id="dc-table-wrap">
        <table id="dc-table" style="min-width:1100px;">
          <thead>
            <tr style="position:sticky;top:0;z-index:10;background:var(--bg2);">
              <th style="width:36px;padding:10px 8px;text-align:center;"><input type="checkbox" id="dc-select-all" onchange="dcSelectAll(this.checked)" style="accent-color:var(--amber);"></th>
              <th onclick="dcSort('name')" style="min-width:200px;" class="dc-col-name">Project/Name ↕</th>
              <th onclick="dcSort('source')" class="dc-col-source">Source ↕</th>
              <th onclick="dcSort('company')" class="dc-col-company">Company/Supplier ↕</th>
              <th onclick="dcSort('methodology')" class="dc-col-methodology">Methodology ↕</th>
              <th onclick="dcSort('mechanism')" class="dc-col-mechanism">Mechanism ↕</th>
              <th onclick="dcSort('country')" class="dc-col-country">Country ↕</th>
              <th onclick="dcSort('date')" class="dc-col-date">Date ↕</th>
              <th onclick="dcSort('volume')" style="text-align:right;" class="dc-col-volume">Volume (tCO₂) ↕</th>
              <th onclick="dcSort('price')" style="text-align:right;" class="dc-col-price">Price (€/t) ↕</th>
              <th onclick="dcSort('status')" class="dc-col-status">Status ↕</th>
              <th class="dc-col-notes" style="display:none;">Notes</th>
            </tr>
          </thead>
          <tbody id="dc-body"></tbody>
        </table>
      </div>
      <div class="pagination" style="padding:12px 16px;border-top:1px solid var(--border);">
        <span id="dc-info" style="font-size:12px;color:var(--text3);"></span>
        <div class="page-btns" id="dc-pages"></div>
      </div>
    </div>

    <!-- Legend -->
    <div style="display:flex;gap:20px;margin-top:12px;flex-wrap:wrap;">
      <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text3);">
        <div style="width:10px;height:10px;border-radius:50%;background:var(--green);flex-shrink:0;"></div> New entry (≤90 days)
      </div>
      <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text3);">
        <div style="width:10px;height:10px;border-radius:50%;background:var(--amber);flex-shrink:0;"></div> Recently active project
      </div>
      <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text3);">
        <div style="width:10px;height:10px;border-radius:50%;background:var(--purple);flex-shrink:0;"></div> Rainbow Standard
      </div>
      <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text3);">
        <div style="width:10px;height:10px;border-radius:50%;background:var(--pink);flex-shrink:0;"></div> Isometric
      </div>
      <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text3);">
        <div style="width:10px;height:10px;border-radius:50%;background:var(--accent);flex-shrink:0;"></div> CDR.fyi Transaction
      </div>
      <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text3);">
        <div style="width:10px;height:10px;border-radius:50%;background:var(--green2);flex-shrink:0;"></div> Puro.earth Project
      </div>
      <span id="dc-selected-info" style="margin-left:auto;font-size:11px;color:var(--amber);font-weight:600;"></span>
    </div>
  </div>

</div>

<script>
var DATA=null,txFiltered=[],txPage=1,TX_PER_PAGE=50,projFiltered=[],projPage=1,PROJ_PER_PAGE=25,supFiltered=[],supPage=1,SUP_PER_PAGE=18,txSortKey='date',txSortDir=-1,projSortKey='id',projSortDir=1;

async function loadData(){
  try{
    var r=await fetch('/static/cdr_data.json');
    DATA=await r.json();
    initApp();
  }catch(e){console.error('Failed to load data',e);}
}

function initApp(){
  renderDashboard();
  txFiltered=DATA.txs.map(function(t,i){return{idx:i,date:t[0],tonnes:t[1],method:t[2],supplier:t[3],purchaser:t[4],status:t[5],marketplace:t[6]||'',delivered:t[7]};});
  projFiltered=DATA.projects.slice();
  supFiltered=DATA.suppliers.slice();
  // Country filters
  var pcs=[...new Set(DATA.projects.map(function(p){return p.country;}))].sort();
  var ps=document.getElementById('proj-country');
  ps.innerHTML='<option value="">All Countries</option>';
  pcs.forEach(function(c){var o=document.createElement('option');o.value=c;o.textContent=c;ps.appendChild(o);});
  var scs=[...new Set(DATA.suppliers.map(function(s){return s.country||'';}).filter(Boolean))].sort();
  var ss=document.getElementById('sup-country');
  ss.innerHTML='<option value="">All Countries</option>';
  scs.forEach(function(c){var o=document.createElement('option');o.value=c;o.textContent=c;ss.appendChild(o);});
}

var pageMeta={
  dashboard:{title:'Dashboard',sub:'CDR market overview · 4 registries · May 2026'},
  transactions:{title:'Transaction Explorer',sub:'5,498 real CDR transactions · 2020–2025'},
  suppliers:{title:'Supplier Intelligence',sub:'212 CDR producers ranked by delivery volume'},
  projects:{title:'Puro.earth Registry',sub:'113 registered projects · May 2026 export'},
  methods:{title:'Removal Methods',sub:'CDR pathways analysis & comparison'},
  insights:{title:'Market Insights',sub:'Strategic analysis of the CDR landscape'},
  rainbow:{title:'Rainbow Standard Registry',sub:'115 projects · Biomass Carbon Removal, Biobased Construction, Biogas · 25 countries'},
  isometric:{title:'Isometric Registry',sub:'305 issuances · 99,731 credits · 17 certified protocols'},
  datacontrol:{title:'Data Control Center',sub:'Unified CDR data · All registries · Filter · Export · Track updates'}
};
var chartsRendered={};

function showPage(id){
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active');});
  document.querySelectorAll('.nav-btn').forEach(function(b){b.classList.remove('active');});
  document.getElementById('page-'+id).classList.add('active');
  document.querySelector('[onclick="showPage(\''+id+'\')"]').classList.add('active');
  var m=pageMeta[id]||{};
  document.getElementById('page-title').textContent=m.title||id;
  document.getElementById('page-sub').textContent=m.sub||'';
  if(!chartsRendered[id]){
    chartsRendered[id]=true;
    if(id==='transactions')filterTx();
    else if(id==='suppliers')filterSup();
    else if(id==='projects')filterProj();
    else if(id==='methods')renderMethods();
    else if(id==='insights')renderInsights();
    else if(id==='rainbow')renderRainbow();
    else if(id==='isometric')renderIsometric();
    else if(id==='datacontrol')renderDataControl();
  }
}

var MCOL=['#00d4ff','#00e5a0','#8b5cf6','#f59e0b','#ec4899','#06b6d4','#10b981','#f97316','#a78bfa','#34d399','#94a3b8'];
function shortM(m){var mp={'Biochar Carbon Removal BCR':'Biochar BCR','Biomass Geological Sequestration':'Biomass Geo.','Bioenergy With Carbon Capture And Sequestration BECCS':'BECCS','Direct Air Carbon Capture And Sequestration DACCS':'DACCS','Marine Biomass Carbon Capture And Sequestration MBCCS':'Marine','Enhanced Weathering':'Enh. Weathering','Alkalinity Enhancement':'Alkalinity','Mineralization':'Mineraliz.','Biomass Direct Storage':'BDS','Direct Ocean Removal':'Ocean','Other':'Other'};return mp[m]||m;}

function renderDashboard(){
  if(!DATA)return;
  var methods=DATA.methods;
  // Method bar chart
  new Chart(document.getElementById('methodChart'),{type:'bar',data:{labels:methods.map(function(m){return shortM(m.method);}),datasets:[{label:'Committed (t)',data:methods.map(function(m){return m.committed;}),backgroundColor:MCOL,borderRadius:4,borderSkipped:false}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return' '+fmtNum(ctx.raw)+' t';}}}},scales:{x:{grid:{color:'rgba(30,45,74,0.5)'},ticks:{color:'#5a7399',font:{size:10},callback:function(v){return fmtShort(v);}},border:{display:false}},y:{grid:{display:false},ticks:{color:'#8fa8cc',font:{size:10}},border:{display:false}}}}});
  // Status donut
  var sd=DATA.kpis.statusDist;
  var scol={Delivered:'#00e5a0',Contracted:'#00d4ff',Retired:'#8b5cf6',Partial:'#f59e0b'};
  new Chart(document.getElementById('statusChart'),{type:'doughnut',data:{labels:Object.keys(sd),datasets:[{data:Object.values(sd),backgroundColor:Object.keys(sd).map(function(k){return scol[k];}),borderWidth:2,borderColor:'#131d32'}]},options:{responsive:false,cutout:'65%',plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return' '+ctx.label+': '+ctx.raw.toLocaleString();}}}}}});
  var leg=document.getElementById('statusLegend');
  Object.keys(sd).forEach(function(k){leg.innerHTML+='<div class="status-item"><div class="status-dot" style="background:'+scol[k]+'"></div><span class="status-name">'+k+'</span><span class="status-count">'+sd[k].toLocaleString()+'</span></div>';});
  // Top 10 suppliers
  var t10=DATA.suppliers.filter(function(s){return s.delivered>0;}).slice(0,10);
  new Chart(document.getElementById('supplierChart'),{type:'bar',data:{labels:t10.map(function(s){return s.supplier.length>18?s.supplier.slice(0,16)+'…':s.supplier;}),datasets:[{label:'Delivered',data:t10.map(function(s){return s.delivered;}),backgroundColor:'rgba(0,229,160,0.7)',borderColor:'#00e5a0',borderWidth:1,borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return' '+fmtNum(ctx.raw)+' t delivered';}}}},scales:{x:{grid:{display:false},ticks:{color:'#8fa8cc',font:{size:9},maxRotation:35},border:{display:false}},y:{grid:{color:'rgba(30,45,74,0.5)'},ticks:{color:'#5a7399',font:{size:10},callback:function(v){return fmtShort(v);}},border:{display:false}}}}});
  // Delivery perf
  var tm=methods.filter(function(m){return m.committed>0;}).slice(0,8);
  new Chart(document.getElementById('deliveryChart'),{type:'bar',data:{labels:tm.map(function(m){return shortM(m.method);}),datasets:[{label:'Committed',data:tm.map(function(m){return m.committed;}),backgroundColor:'rgba(0,212,255,0.3)',borderColor:'#00d4ff',borderWidth:1,borderRadius:2},{label:'Delivered',data:tm.map(function(m){return m.delivered;}),backgroundColor:'rgba(0,229,160,0.7)',borderColor:'#00e5a0',borderWidth:1,borderRadius:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#8fa8cc',font:{size:10}}}},scales:{x:{grid:{display:false},ticks:{color:'#8fa8cc',font:{size:9},maxRotation:30},border:{display:false}},y:{type:'logarithmic',grid:{color:'rgba(30,45,74,0.5)'},ticks:{color:'#5a7399',font:{size:10},callback:function(v){return fmtShort(v);}},border:{display:false}}}}});
  // Puro method
  var mc={};DATA.projects.forEach(function(p){mc[p.method]=(mc[p.method]||0)+1;});
  var mk=Object.keys(mc).sort(function(a,b){return mc[b]-mc[a];});
  new Chart(document.getElementById('puroMethodChart'),{type:'bar',data:{labels:mk,datasets:[{label:'Projects',data:mk.map(function(k){return mc[k];}),backgroundColor:MCOL,borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{color:'#8fa8cc',font:{size:9},maxRotation:35},border:{display:false}},y:{grid:{color:'rgba(30,45,74,0.5)'},ticks:{color:'#5a7399',font:{size:10},stepSize:10},border:{display:false}}}}});
  // Puro country
  var cc={};DATA.projects.forEach(function(p){cc[p.country]=(cc[p.country]||0)+1;});
  var ck=Object.keys(cc).sort(function(a,b){return cc[b]-cc[a];}).slice(0,10);
  new Chart(document.getElementById('puroCountryChart'),{type:'bar',data:{labels:ck,datasets:[{label:'Projects',data:ck.map(function(k){return cc[k];}),backgroundColor:'rgba(0,212,255,0.6)',borderColor:'#00d4ff',borderWidth:1,borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{color:'#8fa8cc',font:{size:9},maxRotation:35},border:{display:false}},y:{grid:{color:'rgba(30,45,74,0.5)'},ticks:{color:'#5a7399',font:{size:10}},border:{display:false}}}}});
  // Cross-registry comparison
  new Chart(document.getElementById('registryCompareChart'),{type:'bar',data:{labels:['Puro.earth\n(Delivered)','Rainbow Std\n(Credits)','Isometric\n(Issued)','Isometric\n(Retired)'],datasets:[{label:'Credits / Tonnes',data:[927053,421377,99731,32616],backgroundColor:['rgba(0,212,255,0.7)','rgba(139,92,246,0.7)','rgba(236,72,153,0.7)','rgba(236,72,153,0.4)'],borderColor:['#00d4ff','#8b5cf6','#ec4899','#ec4899'],borderWidth:1,borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return' '+fmtNum(ctx.raw)+' tCO₂';}}}},scales:{x:{grid:{display:false},ticks:{color:'#8fa8cc',font:{size:10}},border:{display:false}},y:{grid:{color:'rgba(30,45,74,0.5)'},ticks:{color:'#5a7399',font:{size:10},callback:function(v){return fmtShort(v);}},border:{display:false}}}}});
  // Rainbow methodology breakdown for cross-registry chart
  if(DATA.rainbow){
    var rbm=DATA.rainbow.methodologyDist;
    var rbmk=Object.keys(rbm).sort(function(a,b){return rbm[b]-rbm[a];});
    new Chart(document.getElementById('rainbowMethodChart'),{type:'doughnut',data:{labels:rbmk,datasets:[{data:rbmk.map(function(k){return rbm[k];}),backgroundColor:['#8b5cf6','#a78bfa','#ec4899','#f59e0b','#06b6d4'],borderWidth:2,borderColor:'#131d32'}]},options:{responsive:true,maintainAspectRatio:false,cutout:'50%',plugins:{legend:{position:'right',labels:{color:'#8fa8cc',font:{size:10},boxWidth:12}},tooltip:{callbacks:{label:function(ctx){return' '+ctx.label+': '+ctx.raw+' projects';}}}}}});
  }
}

function filterTx(){
  if(!DATA)return;
  var q=(document.getElementById('tx-search').value||'').toLowerCase();
  var method=document.getElementById('tx-method').value;
  var status=document.getElementById('tx-status').value;
  var mp=document.getElementById('tx-marketplace').value;
  txFiltered=DATA.txs.map(function(t,i){return{idx:i,date:t[0],tonnes:t[1],method:t[2],supplier:t[3],purchaser:t[4],status:t[5],marketplace:t[6]||'',delivered:t[7]};}).filter(function(t){
    if(q&&!t.supplier.toLowerCase().includes(q)&&!t.purchaser.toLowerCase().includes(q)&&!t.method.toLowerCase().includes(q))return false;
    if(method&&t.method!==method)return false;
    if(status&&t.status!==status)return false;
    if(mp&&t.marketplace!==mp)return false;
    return true;
  });
  txFiltered.sort(function(a,b){var va=a[txSortKey],vb=b[txSortKey];if(typeof va==='string')return txSortDir*va.localeCompare(vb);return txSortDir*((va||0)-(vb||0));});
  txPage=1;
  document.getElementById('tx-count').textContent=txFiltered.length.toLocaleString()+' results';
  renderTxTable();
}

function sortTx(key){if(txSortKey===key)txSortDir*=-1;else{txSortKey=key;txSortDir=-1;}filterTx();}

var statusCls={Delivered:'badge-delivered',Contracted:'badge-contracted',Retired:'badge-retired',Partial:'badge-partial'};
var mShort={'Biochar Carbon Removal BCR':'BCR','Biomass Geological Sequestration':'BGS','Bioenergy With Carbon Capture And Sequestration BECCS':'BECCS','Direct Air Carbon Capture And Sequestration DACCS':'DACCS','Marine Biomass Carbon Capture And Sequestration MBCCS':'MBCCS','Enhanced Weathering':'Enh.W.','Alkalinity Enhancement':'Alk.','Mineralization':'Min.','Biomass Direct Storage':'BDS','Direct Ocean Removal':'Ocean'};
var mBadge={'Biochar Carbon Removal BCR':'badge-bcr','Biomass Geological Sequestration':'badge-bgs','Bioenergy With Carbon Capture And Sequestration BECCS':'badge-beccs','Enhanced Weathering':'badge-erw','Wood in Construction':'badge-wood'};

function renderTxTable(){
  var start=(txPage-1)*TX_PER_PAGE;
  var rows=txFiltered.slice(start,start+TX_PER_PAGE);
  var tbody=document.getElementById('tx-body');
  tbody.innerHTML=rows.map(function(t){
    var dlv=t.delivered>0?'<span style="color:var(--green)">'+fmtNum(t.delivered)+'</span>':'<span style="color:var(--text3)">—</span>';
    return '<tr><td class="td-mono">'+t.date+'</td><td class="td-bold">'+t.supplier+'</td><td>'+t.purchaser+'</td><td><span class="badge '+(mBadge[t.method]||'badge-other')+'">'+(mShort[t.method]||t.method)+'</span></td><td style="text-align:right;" class="td-bold">'+fmtNum(t.tonnes)+'</td><td style="text-align:right;">'+dlv+'</td><td><span class="badge '+(statusCls[t.status]||'badge-other')+'">'+t.status+'</span></td><td><span style="color:var(--text3);font-size:11px;">'+(t.marketplace||'—')+'</span></td></tr>';
  }).join('');
  var total=txFiltered.length,pages=Math.ceil(total/TX_PER_PAGE);
  document.getElementById('tx-info').textContent='Showing '+(start+1)+'–'+Math.min(start+TX_PER_PAGE,total)+' of '+total.toLocaleString();
  renderPagination('tx-pages',txPage,pages,function(p){txPage=p;renderTxTable();window.scrollTo(0,200);});
}

function filterProj(){
  if(!DATA)return;
  var q=(document.getElementById('proj-search').value||'').toLowerCase();
  var method=document.getElementById('proj-method').value;
  var country=document.getElementById('proj-country').value;
  projFiltered=DATA.projects.filter(function(p){
    if(q&&!p.name.toLowerCase().includes(q)&&!p.supplier.toLowerCase().includes(q)&&!p.country.toLowerCase().includes(q))return false;
    if(method&&p.method!==method)return false;
    if(country&&p.country!==country)return false;
    return true;
  });
  projFiltered.sort(function(a,b){var va=a[projSortKey],vb=b[projSortKey];if(typeof va==='string')return projSortDir*va.localeCompare(vb);return projSortDir*((va||0)-(vb||0));});
  projPage=1;
  document.getElementById('proj-count').textContent=projFiltered.length.toLocaleString()+' projects';
  renderProjTable();
}

function sortProj(key){if(projSortKey===key)projSortDir*=-1;else{projSortKey=key;projSortDir=1;}filterProj();}

var flagMap={US:'🇺🇸',GB:'🇬🇧',FI:'🇫🇮',CA:'🇨🇦',AU:'🇦🇺',SE:'🇸🇪',NO:'🇳🇴',DE:'🇩🇪',FR:'🇫🇷',BR:'🇧🇷',KE:'🇰🇪',IN:'🇮🇳',PH:'🇵🇭',BO:'🇧🇴',ES:'🇪🇸',RO:'🇷🇴',NA:'🇳🇦',CN:'🇨🇳',RS:'🇷🇸',MX:'🇲🇽',CO:'🇨🇴',PE:'🇵🇪',IS:'🇮🇸',KH:'🇰🇭',TH:'🇹🇭'};
var mbCls={'Biochar Carbon Removal':'badge-bcr','Wood in Construction':'badge-wood','BECCS':'badge-beccs','BECCS (v2)':'badge-beccs','Enhanced Rock Weathering':'badge-erw','Biomass Geological Seq.':'badge-bgs'};

function renderProjTable(){
  var start=(projPage-1)*PROJ_PER_PAGE;
  var rows=projFiltered.slice(start,start+PROJ_PER_PAGE);
  var now=new Date();
  var tbody=document.getElementById('proj-body');
  tbody.innerHTML=rows.map(function(p){
    var active=new Date(p.end)>now;
    var flag=flagMap[p.countryCode]||'🌍';
    var rv=p.rules.replace('Puro Standard General Rules ','').replace('Puro Rules ','');
    var nameCell=p.url?'<a href="'+p.url+'" target="_blank" style="color:var(--text1);text-decoration:none;" onmouseover="this.style.color=\'var(--accent)\'" onmouseout="this.style.color=\'var(--text1)\'">'+p.name+' ↗</a>':p.name;
    return '<tr><td class="td-mono" style="color:var(--text3);">#'+p.id+'</td><td class="td-bold" style="max-width:200px;">'+nameCell+'</td><td>'+p.supplier+'</td><td><span class="badge '+(mbCls[p.method]||'badge-other')+'">'+p.method+'</span></td><td>'+flag+' '+p.country+'</td><td class="td-mono" style="color:var(--text3);">'+p.start+'</td><td class="td-mono" style="color:var(--text3);">'+p.end+'</td><td><span class="badge '+(active?'badge-delivered':'badge-retired')+'">'+(active?'Active':'Ended')+'</span></td><td style="font-size:10px;color:var(--text3);">'+rv+'</td></tr>';
  }).join('');
  var total=projFiltered.length,pages=Math.ceil(total/PROJ_PER_PAGE);
  document.getElementById('proj-info').textContent='Showing '+(start+1)+'–'+Math.min(start+PROJ_PER_PAGE,total)+' of '+total.toLocaleString();
  renderPagination('proj-pages',projPage,pages,function(p){projPage=p;renderProjTable();window.scrollTo(0,200);});
}

function filterSup(){
  if(!DATA)return;
  var q=(document.getElementById('sup-search').value||'').toLowerCase();
  var tech=document.getElementById('sup-tech').value;
  var country=document.getElementById('sup-country').value;
  supFiltered=DATA.suppliers.filter(function(s){
    if(q&&!s.supplier.toLowerCase().includes(q)&&!(s.country||'').toLowerCase().includes(q))return false;
    if(tech&&!(s.technology||'').includes(tech))return false;
    if(country&&s.country!==country)return false;
    return true;
  });
  supPage=1;
  renderSupGrid();
}

function renderSupGrid(){
  var start=(supPage-1)*SUP_PER_PAGE;
  var rows=supFiltered.slice(start,start+SUP_PER_PAGE);
  var grid=document.getElementById('supplier-grid');
  grid.innerHTML=rows.map(function(s,i){
    var rank=start+i+1;
    var dr=s.committed>0?(s.delivered/s.committed*100):0;
    var ts=(s.technology||'').split(',')[0].replace('Biochar Carbon Removal BCR','Biochar').replace('Biomass Geological Sequestration','Biomass Geo.').replace('Direct Air Carbon Capture And Sequestration DACCS','DACCS').replace('Enhanced Weathering','Enh.W.').replace('Marine Biomass Carbon Capture And Sequestration MBCCS','Marine').trim();
    var bp=Math.min(100,dr);
    var drColor=dr>50?'var(--green)':dr>10?'var(--amber)':'var(--text2)';
    var priceStr=s.price&&s.price!=='N/A'?'<div style="margin-top:8px;font-size:10px;color:var(--text3);">💰 ~'+s.price+' USD/t · '+s.firstTx+' → '+s.lastTx+'</div>':'';
    return '<div class="supplier-card"><div class="sc-header"><div><div class="sc-name">'+s.supplier+'</div><div class="sc-country">📍 '+(s.city?s.city+', ':'')+( s.country||'—')+'</div><div style="margin-top:6px;"><span class="badge badge-other" style="font-size:9px;">'+(ts||'CDR')+'</span></div></div><div class="sc-rank">'+rank+'</div></div><div class="sc-metrics"><div class="sc-metric"><div class="sc-metric-label">Committed</div><div class="sc-metric-value accent">'+fmtShort(s.committed)+'</div></div><div class="sc-metric"><div class="sc-metric-label">Delivered</div><div class="sc-metric-value green">'+fmtShort(s.delivered)+'</div></div><div class="sc-metric"><div class="sc-metric-label">Transactions</div><div class="sc-metric-value">'+s.count.toLocaleString()+'</div></div><div class="sc-metric"><div class="sc-metric-label">Delivery Rate</div><div class="sc-metric-value" style="color:'+drColor+'">'+dr.toFixed(1)+'%</div></div></div><div style="margin-top:10px;"><div style="display:flex;justify-content:space-between;font-size:9px;color:var(--text3);margin-bottom:4px;"><span>Delivery performance</span><span>'+dr.toFixed(1)+'%</span></div><div class="delivery-bar"><div class="delivery-fill" style="width:'+bp+'%"></div></div></div>'+priceStr+'</div>';
  }).join('');
  var total=supFiltered.length,pages=Math.ceil(total/SUP_PER_PAGE);
  document.getElementById('sup-info').textContent='Showing '+(start+1)+'–'+Math.min(start+SUP_PER_PAGE,total)+' of '+total.toLocaleString();
  renderPagination('sup-pages',supPage,pages,function(p){supPage=p;renderSupGrid();window.scrollTo(0,200);});
}

function renderMethods(){
  if(!DATA)return;
  var methods=DATA.methods;
  var maxC=Math.max.apply(null,methods.map(function(m){return m.committed;}));
  var mdesc={'Biochar Carbon Removal BCR':'Biomass pyrolysis creating stable carbon. Most traded CDR pathway — highest transaction volume with 96 suppliers.','Biomass Geological Sequestration':'Organic material stored underground in geological formations. High committed volume but low delivery rate so far.','Bioenergy With Carbon Capture And Sequestration BECCS':'Largest committed volume. Industrial BECCS plants capturing CO₂ from bioenergy combustion.','Direct Air Carbon Capture And Sequestration DACCS':'Direct capture of CO₂ from ambient air with permanent underground storage.','Enhanced Weathering':'Accelerating silicate rock weathering to sequester atmospheric CO₂ via soil amendment.','Mineralization':'CO₂ chemically bound into solid mineral form. Used in construction materials (concrete).','Marine Biomass Carbon Capture And Sequestration MBCCS':'Ocean-based sequestration using marine biomass including kelp and macroalgae.','Alkalinity Enhancement':'Increasing ocean alkalinity to enhance natural CO₂ uptake capacity.','Biomass Direct Storage':'Direct burial or preservation of biomass to prevent decomposition and CO₂ release.','Direct Ocean Removal':'Direct removal and sequestration of dissolved CO₂ from seawater.','Other':'Emerging CDR methodologies not yet classified in the main pathways.'};
  var content='<div style="display:grid;gap:16px;">';
  methods.forEach(function(m,i){
    var pct=(m.committed/maxC*100).toFixed(1);
    var dr=m.committed>0?(m.delivered/m.committed*100).toFixed(2):0;
    var drc=parseFloat(dr)>5?'var(--green)':parseFloat(dr)>1?'var(--amber)':'var(--red)';
    content+='<div class="chart-card" style="display:grid;grid-template-columns:3fr 1fr 1fr 1fr 1fr;gap:20px;align-items:center;"><div><div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;"><div style="width:12px;height:12px;border-radius:3px;background:'+MCOL[i]+';flex-shrink:0;"></div><div style="font-size:13px;font-weight:700;color:var(--text1);">'+m.method+'</div></div><div style="font-size:11px;color:var(--text3);margin-bottom:8px;">'+(mdesc[m.method]||'')+'</div><div class="method-bar-track" style="height:6px;"><div class="method-bar-fill" style="width:'+pct+'%;background:'+MCOL[i]+';"></div></div></div><div style="text-align:center;"><div style="font-size:10px;color:var(--text3);margin-bottom:4px;">COMMITTED</div><div style="font-size:15px;font-weight:700;color:var(--accent);">'+fmtShort(m.committed)+'</div><div style="font-size:10px;color:var(--text3);">tonnes</div></div><div style="text-align:center;"><div style="font-size:10px;color:var(--text3);margin-bottom:4px;">DELIVERED</div><div style="font-size:15px;font-weight:700;color:var(--green);">'+fmtShort(m.delivered)+'</div><div style="font-size:10px;color:var(--text3);">tonnes</div></div><div style="text-align:center;"><div style="font-size:10px;color:var(--text3);margin-bottom:4px;">DELIV. RATE</div><div style="font-size:15px;font-weight:700;color:'+drc+';">'+dr+'%</div></div><div style="text-align:center;"><div style="font-size:10px;color:var(--text3);margin-bottom:4px;">TRANSACTIONS</div><div style="font-size:15px;font-weight:700;color:var(--text1);">'+m.count.toLocaleString()+'</div><div style="font-size:10px;color:var(--text3);">'+m.suppliers+' suppliers</div></div></div>';
  });
  content+='</div>';
  document.getElementById('methods-content').innerHTML=content;
}

function renderInsights(){
  if(!DATA)return;
  // Top buyers
  var bc={};
  DATA.txs.forEach(function(t){bc[t[4]]=(bc[t[4]]||0)+t[1];});
  var tb=Object.entries(bc).filter(function(e){return e[0]!=='Not Disclosed';}).sort(function(a,b){return b[1]-a[1];}).slice(0,8);
  // Method delivery rates
  var mr=DATA.methods.filter(function(m){return m.committed>10000;}).map(function(m){return Object.assign({},m,{rate:m.delivered/m.committed*100});}).sort(function(a,b){return b.rate-a.rate;});
  // Country projects
  var pcc={};DATA.projects.forEach(function(p){pcc[p.country]=(pcc[p.country]||0)+1;});
  var pcs=Object.entries(pcc).sort(function(a,b){return b[1]-a[1];}).slice(0,10);
  var maxPc=pcs[0][1];
  var fmap={US:'🇺🇸',Finland:'🇫🇮','United Kingdom':'🇬🇧',Australia:'🇦🇺',Canada:'🇨🇦',France:'🇫🇷',Norway:'🇳🇴',Sweden:'🇸🇪',Germany:'🇩🇪',Brazil:'🇧🇷'};
  var actProj=DATA.projects.filter(function(p){return new Date(p.end)>new Date();}).length;
  var ic='';
  // Card 1 - top buyers
  ic+='<div class="insight-card"><div class="chart-title" style="margin-bottom:4px;">🏆 Top Buyers by Volume Committed</div><div class="chart-sub">Largest CDR purchasers (disclosed buyers only)</div><div class="method-bars" style="margin-top:16px;">';
  tb.forEach(function(e,i){var pct=(e[1]/tb[0][1]*100).toFixed(0);var c2=['#00d4ff','#00e5a0','#8b5cf6','#f59e0b','#ec4899','#06b6d4','#10b981','#f97316'];ic+='<div class="method-bar-item"><div class="method-bar-header"><span class="method-bar-name">'+e[0]+'</span><span class="method-bar-val">'+fmtShort(e[1])+' t</span></div><div class="method-bar-track"><div class="method-bar-fill" style="width:'+pct+'%;background:'+c2[i]+';"></div></div></div>';});
  ic+='</div></div>';
  // Card 2 - delivery rate by method
  ic+='<div class="insight-card"><div class="chart-title" style="margin-bottom:4px;">⚡ Delivery Rate by CDR Method</div><div class="chart-sub">What fraction of contracted volume has been delivered?</div><div class="method-bars" style="margin-top:16px;">';
  mr.forEach(function(m){var pct=Math.min(100,m.rate).toFixed(0);var col=m.rate>10?'#00e5a0':m.rate>3?'#f59e0b':'#ef4444';ic+='<div class="method-bar-item"><div class="method-bar-header"><span class="method-bar-name">'+shortM(m.method)+'</span><span class="method-bar-val" style="color:'+col+'">'+m.rate.toFixed(2)+'%</span></div><div class="method-bar-track"><div class="method-bar-fill" style="width:'+pct+'%;background:'+col+';"></div></div></div>';});
  ic+='</div></div>';
  // Card 3 - geo
  ic+='<div class="insight-card"><div class="chart-title" style="margin-bottom:4px;">🌍 Puro Registry: Geographic Distribution</div><div class="chart-sub">Distribution of 113 registered projects by country</div><div class="method-bars" style="margin-top:16px;">';
  pcs.forEach(function(e){ic+='<div class="method-bar-item"><div class="method-bar-header"><span class="method-bar-name">'+(fmap[e[0]]||'🌍')+' '+e[0]+'</span><span class="method-bar-val">'+e[1]+' projects</span></div><div class="method-bar-track"><div class="method-bar-fill" style="width:'+(e[1]/maxPc*100).toFixed(0)+'%;background:#00d4ff;"></div></div></div>';});
  ic+='</div></div>';
  // Card 4 - market concentration
  ic+='<div class="insight-card"><div class="chart-title" style="margin-bottom:4px;">📊 Market Concentration Metrics</div><div class="chart-sub">Key structural indicators of the global CDR market</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px;"><div class="sc-metric" style="text-align:center;padding:16px;"><div class="sc-metric-label">BECCS Share of Committed</div><div style="font-size:28px;font-weight:800;color:var(--purple);margin:8px 0;">65.3%</div><div style="font-size:10px;color:var(--text3);">25.2M of 38.5M tonnes</div></div><div class="sc-metric" style="text-align:center;padding:16px;"><div class="sc-metric-label">Biochar Share of Deliveries</div><div style="font-size:28px;font-weight:800;color:var(--accent);margin:8px 0;">86.4%</div><div style="font-size:10px;color:var(--text3);">800K of 927K t delivered</div></div><div class="sc-metric" style="text-align:center;padding:16px;"><div class="sc-metric-label">Top 5 Suppliers Share</div><div style="font-size:28px;font-weight:800;color:var(--green);margin:8px 0;">56%</div><div style="font-size:10px;color:var(--text3);">of all tonnes delivered</div></div><div class="sc-metric" style="text-align:center;padding:16px;"><div class="sc-metric-label">Avg Tonnes per Transaction</div><div style="font-size:28px;font-weight:800;color:var(--amber);margin:8px 0;">7,017</div><div style="font-size:10px;color:var(--text3);">tonnes per order</div></div><div class="sc-metric" style="text-align:center;padding:16px;"><div class="sc-metric-label">Puro Active Projects</div><div style="font-size:28px;font-weight:800;color:var(--text1);margin:8px 0;">'+actProj+'</div><div style="font-size:10px;color:var(--text3);">of 113 total projects</div></div><div class="sc-metric" style="text-align:center;padding:16px;"><div class="sc-metric-label">Overall Delivery Rate</div><div style="font-size:28px;font-weight:800;color:var(--red);margin:8px 0;">2.41%</div><div style="font-size:10px;color:var(--text3);">committed → delivered gap</div></div></div></div>';
  document.getElementById('insights-content').innerHTML=ic;
}

function fmtNum(n){if(!n)return'0';return Math.round(n).toLocaleString();}
function fmtShort(n){if(!n||n===0)return'0';if(n>=1e9)return(n/1e9).toFixed(1)+'B';if(n>=1e6)return(n/1e6).toFixed(1)+'M';if(n>=1e3)return(n/1e3).toFixed(1)+'K';return Math.round(n).toString();}

function renderPagination(cid,current,total,onClick){
  var c=document.getElementById(cid);
  if(total<=1){c.innerHTML='';return;}
  var h='';
  h+='<button class="page-btn" '+(current===1?'disabled':'')+' onclick="('+onClick.toString()+')(1)">«</button>';
  h+='<button class="page-btn" '+(current===1?'disabled':'')+' onclick="('+onClick.toString()+')('+(current-1)+')">‹</button>';
  var s=Math.max(1,current-2),e=Math.min(total,current+2);
  if(s>1){h+='<button class="page-btn" onclick="('+onClick.toString()+')(1)">1</button>';if(s>2)h+='<span style="padding:0 4px;color:var(--text3)">…</span>';}
  for(var i=s;i<=e;i++){h+='<button class="page-btn '+(i===current?'active':'')+'" onclick="('+onClick.toString()+')('+i+')">'+i+'</button>';}
  if(e<total){if(e<total-1)h+='<span style="padding:0 4px;color:var(--text3)">…</span>';h+='<button class="page-btn" onclick="('+onClick.toString()+')('+total+')">'+total+'</button>';}
  h+='<button class="page-btn" '+(current===total?'disabled':'')+' onclick="('+onClick.toString()+')('+(current+1)+')">›</button>';
  h+='<button class="page-btn" '+(current===total?'disabled':'')+' onclick="('+onClick.toString()+')('+total+')">»</button>';
  c.innerHTML=h;
}

// ====================================================
// RAINBOW STANDARD
// ====================================================
var rbFiltered=[],rbPage=1,RB_PER_PAGE=25,rbSortKey='issuedCredits',rbSortDir=-1;

function renderRainbow(){
  if(!DATA||!DATA.rainbow)return;
  var rb=DATA.rainbow;
  // KPI dinamici
  document.getElementById('rb-total').textContent=fmtNum(rb.kpis.totalProjects);
  document.getElementById('rb-issued').textContent=fmtNum(rb.kpis.totalIssuedCredits);
  document.getElementById('rb-available').textContent=fmtNum(rb.kpis.totalAvailableCredits);
  document.getElementById('rb-credited').textContent=rb.kpis.creditedProjects;
  document.getElementById('rb-removal').textContent=rb.kpis.removalProjects;
  document.getElementById('rb-avoid').textContent=rb.kpis.avoidanceProjects;
  document.getElementById('rb-countries').textContent=rb.kpis.countries;
  // Methodology bar chart
  var mDist=rb.methodologyDist;
  var mKeys=Object.keys(mDist).sort(function(a,b){return mDist[b]-mDist[a];});
  var mCols=['#8b5cf6','#a78bfa','#ec4899','#f59e0b','#06b6d4','#10b981'];
  new Chart(document.getElementById('rbMethodChart'),{type:'bar',data:{labels:mKeys,datasets:[{label:'Projects',data:mKeys.map(function(k){return mDist[k];}),backgroundColor:mCols,borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{color:'#8fa8cc',font:{size:9},maxRotation:30},border:{display:false}},y:{grid:{color:'rgba(30,45,74,0.5)'},ticks:{color:'#5a7399',font:{size:10},stepSize:5},border:{display:false}}}}});
  // Country bar chart
  var cDist=rb.countryDist;
  var cKeys=Object.keys(cDist).sort(function(a,b){return cDist[b]-cDist[a];}).slice(0,12);
  new Chart(document.getElementById('rbCountryChart'),{type:'bar',data:{labels:cKeys,datasets:[{label:'Projects',data:cKeys.map(function(k){return cDist[k];}),backgroundColor:'rgba(139,92,246,0.6)',borderColor:'#8b5cf6',borderWidth:1,borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{color:'#8fa8cc',font:{size:9},maxRotation:35},border:{display:false}},y:{grid:{color:'rgba(30,45,74,0.5)'},ticks:{color:'#5a7399',font:{size:10},stepSize:2},border:{display:false}}}}});
  // Status donut
  var sDist=rb.statusDist;
  var sCols={CREDITED:'#8b5cf6',VALIDATED:'#a78bfa',LISTED:'#f59e0b',REGISTERED:'#06b6d4',PUBLIC_COMMENT_PERIOD:'#10b981',REJECTED:'#ef4444',WITHDRAWN:'#6b7280'};
  new Chart(document.getElementById('rbStatusChart'),{type:'doughnut',data:{labels:Object.keys(sDist),datasets:[{data:Object.values(sDist),backgroundColor:Object.keys(sDist).map(function(k){return sCols[k]||'#5a7399';}),borderWidth:2,borderColor:'#131d32'}]},options:{responsive:false,cutout:'65%',plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return' '+ctx.label+': '+ctx.raw;}}}}}});
  var leg=document.getElementById('rbStatusLegend');
  leg.innerHTML='';
  Object.keys(sDist).forEach(function(k){leg.innerHTML+='<div class="status-item"><div class="status-dot" style="background:'+(sCols[k]||'#5a7399')+'"></div><span class="status-name">'+k+'</span><span class="status-count">'+sDist[k]+'</span></div>';});
  // Credits by methodology (only credited projects)
  var credByMethod={};
  rb.projects.filter(function(p){return p.status==='CREDITED'&&p.issuedCredits>0;}).forEach(function(p){credByMethod[p.methodology]=(credByMethod[p.methodology]||0)+p.issuedCredits;});
  var cbmk=Object.keys(credByMethod).sort(function(a,b){return credByMethod[b]-credByMethod[a];});
  new Chart(document.getElementById('rbCreditsChart'),{type:'bar',data:{labels:cbmk,datasets:[{label:'Credits',data:cbmk.map(function(k){return credByMethod[k];}),backgroundColor:['rgba(236,72,153,0.7)','rgba(139,92,246,0.7)','rgba(245,158,11,0.7)','rgba(6,182,212,0.7)'],borderRadius:4}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return' '+fmtNum(ctx.raw)+' credits';}}}},scales:{x:{grid:{color:'rgba(30,45,74,0.5)'},ticks:{color:'#5a7399',font:{size:10},callback:function(v){return fmtShort(v);}},border:{display:false}},y:{grid:{display:false},ticks:{color:'#8fa8cc',font:{size:10}},border:{display:false}}}}});
  // Init table
  rbFiltered=rb.projects.slice();
  filterRb();
}

function filterRb(){
  if(!DATA||!DATA.rainbow)return;
  var q=(document.getElementById('rb-search').value||'').toLowerCase();
  var mechanism=document.getElementById('rb-mechanism').value;
  var method=document.getElementById('rb-method').value;
  var status=document.getElementById('rb-status').value;
  rbFiltered=DATA.rainbow.projects.filter(function(p){
    if(q&&!p.name.toLowerCase().includes(q)&&!(p.developer||'').toLowerCase().includes(q)&&!p.country.toLowerCase().includes(q)&&!(p.city||'').toLowerCase().includes(q))return false;
    if(mechanism&&p.mechanism!==mechanism)return false;
    if(method&&p.methodology!==method)return false;
    if(status&&p.status!==status)return false;
    return true;
  });
  rbFiltered.sort(function(a,b){var va=a[rbSortKey],vb=b[rbSortKey];if(typeof va==='string')return rbSortDir*(va||'').localeCompare(vb||'');return rbSortDir*((va||0)-(vb||0));});
  rbPage=1;
  document.getElementById('rb-count').textContent=rbFiltered.length+' of '+DATA.rainbow.kpis.totalProjects+' projects';
  renderRbTable();
}

function sortRb(key){if(rbSortKey===key)rbSortDir*=-1;else{rbSortKey=key;rbSortDir=-1;}filterRb();}

var rbStatusCls={CREDITED:'badge-retired',VALIDATED:'badge-contracted',LISTED:'badge-partial',REGISTERED:'badge-other',PUBLIC_COMMENT_PERIOD:'badge-bcr',REJECTED:'badge-other',WITHDRAWN:'badge-other'};
var rbMechCls={REMOVAL:'badge-delivered',AVOIDANCE:'badge-partial'};
var rbMethodShort={'Biomass carbon removal and storage':'BiCRS','Biobased construction materials':'Biobased Const.','Biogas from anaerobic digestion':'Biogas','Refurbishing of electronic devices':'Electronics','General requirements':'General','Textile recycling':'Textiles','Textile to fibre recycling':'Tex→Fibre','Organic waste collection':'Organic Waste','Wet waste valorisation':'Wet Waste','Natural refrigerants in stationary refrigeration':'Refrigerants','Biochar applications':'Biochar'};

function renderRbTable(){
  var start=(rbPage-1)*RB_PER_PAGE;
  var rows=rbFiltered.slice(start,start+RB_PER_PAGE);
  var tbody=document.getElementById('rb-body');
  tbody.innerHTML=rows.map(function(p){
    var issuedStr=p.issuedCredits>0?'<span style="color:var(--purple);font-weight:700;">'+fmtNum(p.issuedCredits)+'</span>':'<span style="color:var(--text3)">—</span>';
    var availStr=p.availableCredits>0?'<span style="color:var(--green);font-weight:700;">'+fmtNum(p.availableCredits)+'</span>':'<span style="color:var(--text3)">—</span>';
    var durStr=p.durability&&p.durability!=='N/A'?'<span style="font-size:10px;color:var(--accent);">'+p.durability+'</span>':'<span style="color:var(--text3)">N/A</span>';
    var mShort=rbMethodShort[p.methodology]||p.methodology;
    var mBadge=p.mechanism==='REMOVAL'?'badge-bcr':'badge-erw';
    var cityStr=(p.city&&p.city.trim())?p.city+(p.location&&p.location!==p.city?' <span style="color:var(--text3);font-size:10px;">('+p.location+')</span>':''):'<span style="color:var(--text3)">—</span>';
    return '<tr><td class="td-bold" style="max-width:200px;"><a href="https://registry.rainbowstandard.io" target="_blank" style="color:var(--purple);text-decoration:none;">'+p.name+'</a></td><td style="font-size:12px;">'+p.developer+'</td><td><span class="badge badge-other" style="font-size:10px;">'+mShort+'</span></td><td><span class="badge '+(rbMechCls[p.mechanism]||'badge-other')+'">'+p.mechanism+'</span></td><td>'+p.country+'</td><td style="font-size:11px;">'+cityStr+'</td><td><span class="badge '+(rbStatusCls[p.status]||'badge-other')+'">'+p.status+'</span></td><td style="text-align:right;">'+issuedStr+'</td><td style="text-align:right;">'+availStr+'</td><td>'+durStr+'</td></tr>';
  }).join('');
  var total=rbFiltered.length,pages=Math.ceil(total/RB_PER_PAGE);
  document.getElementById('rb-info').textContent='Showing '+(start+1)+'–'+Math.min(start+RB_PER_PAGE,total)+' of '+total;
  renderPagination('rb-pages',rbPage,pages,function(p){rbPage=p;renderRbTable();window.scrollTo(0,200);});
}

// ====================================================
// ISOMETRIC
// ====================================================
var isoFiltered=[],isoPage=1,ISO_PER_PAGE=10,isoSortKey='date',isoSortDir=-1;

function renderIsometric(){
  if(!DATA||!DATA.isometric)return;
  var iso=DATA.isometric;
  // Pathway chart
  var pd=iso.pathwayDist;
  var pk=Object.keys(pd).sort(function(a,b){return pd[b]-pd[a];});
  var pCols=['#ec4899','#8b5cf6','#06b6d4','#f59e0b','#5a7399'];
  new Chart(document.getElementById('isoPathwayChart'),{type:'bar',data:{labels:pk,datasets:[{label:'Credits',data:pk.map(function(k){return pd[k];}),backgroundColor:pCols,borderRadius:4}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return' '+fmtNum(ctx.raw)+' tCO₂';}}}},scales:{x:{grid:{color:'rgba(30,45,74,0.5)'},ticks:{color:'#5a7399',font:{size:10},callback:function(v){return fmtShort(v);}},border:{display:false}},y:{grid:{display:false},ticks:{color:'#8fa8cc',font:{size:11}},border:{display:false}}}}});
  // Top suppliers chart
  var ts=iso.topSuppliers.slice(0,8);
  new Chart(document.getElementById('isoSupplierChart'),{type:'bar',data:{labels:ts.map(function(s){return s.name;}),datasets:[{label:'Credits',data:ts.map(function(s){return s.credits;}),backgroundColor:'rgba(236,72,153,0.7)',borderColor:'#ec4899',borderWidth:1,borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return' '+fmtNum(ctx.raw)+' tCO₂';}}}}  ,scales:{x:{grid:{display:false},ticks:{color:'#8fa8cc',font:{size:9},maxRotation:30},border:{display:false}},y:{grid:{color:'rgba(30,45,74,0.5)'},ticks:{color:'#5a7399',font:{size:10},callback:function(v){return fmtShort(v);}},border:{display:false}}}}});
  // Status donut (issued vs retired vs outstanding)
  var outstanding=iso.kpis.creditsIssued-iso.kpis.creditsRetired;
  new Chart(document.getElementById('isoStatusChart'),{type:'doughnut',data:{labels:['Retired','Outstanding'],datasets:[{data:[iso.kpis.creditsRetired,outstanding],backgroundColor:['#8b5cf6','rgba(236,72,153,0.5)'],borderWidth:2,borderColor:'#131d32'}]},options:{responsive:false,cutout:'60%',plugins:{legend:{position:'bottom',labels:{color:'#8fa8cc',font:{size:10},boxWidth:12}},tooltip:{callbacks:{label:function(ctx){return' '+ctx.label+': '+fmtNum(ctx.raw)+' tCO₂';}}}}}});
  // Protocols grid
  var pg=document.getElementById('iso-protocols-grid');
  var catCols={Removal:'rgba(236,72,153,0.15)',Nature:'rgba(0,229,160,0.15)',Avoidance:'rgba(245,158,11,0.15)'};
  var cat=iso.protocolCategories;
  var allProtos=[];
  Object.keys(cat).forEach(function(c){cat[c].forEach(function(p){allProtos.push({name:p,cat:c});});});
  pg.innerHTML=allProtos.map(function(p){
    var col=p.cat==='Removal'?'#ec4899':p.cat==='Nature-based'?'#00e5a0':'#f59e0b';
    return '<div style="background:rgba(30,45,74,0.4);border:1px solid rgba(30,45,74,0.8);border-radius:8px;padding:8px 10px;"><div style="font-size:10px;font-weight:600;color:'+col+';">'+p.name+'</div><div style="font-size:9px;color:var(--text3);margin-top:2px;">'+p.cat+'</div></div>';
  }).join('');
  // Init issuances table
  isoFiltered=iso.recentIssuances.slice();
  filterIso();
}

function filterIso(){
  if(!DATA||!DATA.isometric)return;
  var q=(document.getElementById('iso-search').value||'').toLowerCase();
  var pathway=document.getElementById('iso-pathway').value;
  isoFiltered=DATA.isometric.recentIssuances.filter(function(iss){
    if(q&&!iss.supplier.toLowerCase().includes(q)&&!iss.project.toLowerCase().includes(q)&&!iss.pathway.toLowerCase().includes(q))return false;
    if(pathway&&iss.pathway!==pathway)return false;
    return true;
  });
  isoFiltered.sort(function(a,b){var va=a[isoSortKey],vb=b[isoSortKey];if(typeof va==='string')return isoSortDir*va.localeCompare(vb);return isoSortDir*((va||0)-(vb||0));});
  isoPage=1;
  document.getElementById('iso-count').textContent=isoFiltered.length+' issuances (showing recent 10)';
  renderIsoTable();
}

function sortIso(key){if(isoSortKey===key)isoSortDir*=-1;else{isoSortKey=key;isoSortDir=-1;}filterIso();}

var isoPathwayCls={BiCRS:'badge-bcr',EW:'badge-erw',Marine:'badge-bgs',DACCS:'badge-beccs'};

function renderIsoTable(){
  var start=(isoPage-1)*ISO_PER_PAGE;
  var rows=isoFiltered.slice(start,start+ISO_PER_PAGE);
  var tbody=document.getElementById('iso-body');
  tbody.innerHTML=rows.map(function(iss){
    return '<tr><td class="td-bold">'+iss.supplier+'</td><td>'+iss.project+'</td><td><span class="badge '+(isoPathwayCls[iss.pathway]||'badge-other')+'">'+iss.pathway+'</span></td><td class="td-mono" style="color:var(--text3);">'+iss.date+'</td><td style="text-align:right;"><span style="color:var(--pink);font-weight:700;">'+iss.credits.toFixed(2)+'</span></td><td><span style="font-size:10px;color:var(--green);">'+iss.durability+'</span></td><td><span style="font-size:10px;color:var(--text3);">⬇ registry.isometric.com</span></td></tr>';
  }).join('');
  var total=isoFiltered.length,pages=Math.ceil(total/ISO_PER_PAGE);
  document.getElementById('iso-info').textContent='Showing '+(start+1)+'–'+Math.min(start+ISO_PER_PAGE,total)+' of '+total+' recent issuances';
  renderPagination('iso-pages',isoPage,pages,function(p){isoPage=p;renderIsoTable();window.scrollTo(0,200);});
}

// ====================================================
// DATA CONTROL CENTER
// ====================================================
var dcAllRows=[],dcFiltered=[],dcPage=1,DC_PER_PAGE=50,dcSortKey='date',dcSortDir=-1;
var dcSelectedIds=new Set();

function buildDCRows(){
  var rows=[];
  var now=new Date();
  var cutoff90=new Date(now-90*24*60*60*1000);

  // --- Puro.earth Projects ---
  if(DATA&&DATA.projects){
    DATA.projects.forEach(function(p){
      var d=p.creditingPeriodEnd||p.creditingPeriodStart||'';
      var isNew=d&&new Date(d)>=cutoff90;
      rows.push({
        id:'puro-'+p.id,
        name:p.name||p.id,
        source:'Puro.earth',
        company:p.supplier||'',
        methodology:p.method||'',
        mechanism:'Removal',
        country:p.country||'',
        city:'',
        date:d,
        volume:p.delivered||0,
        price:0,
        status:p.status||'',
        notes:'Puro.earth registry · '+p.standard,
        isNew:isNew,
        isActive:p.status==='Active'
      });
    });
  }

  // --- CDR.fyi Transactions ---
  if(DATA&&DATA.txs){
    DATA.txs.forEach(function(t,i){
      var d=t[0]||'';
      var isNew=d&&new Date(d)>=cutoff90;
      rows.push({
        id:'tx-'+i,
        name:'Transaction · '+t[2],
        source:'CDR.fyi',
        company:t[3]||'',
        methodology:t[2]||'',
        mechanism:'Transaction',
        country:'',
        city:'',
        date:d,
        volume:t[1]||0,
        price:0,
        status:t[5]||'',
        notes:'Purchaser: '+(t[4]||'—')+' · Marketplace: '+(t[6]||'—'),
        isNew:isNew,
        isActive:t[5]==='Delivered'
      });
    });
  }

  // --- Rainbow Standard Projects ---
  if(DATA&&DATA.rainbow&&DATA.rainbow.projects){
    DATA.rainbow.projects.forEach(function(p){
      var isNew=p.status==='PUBLIC_COMMENT_PERIOD'||p.status==='VALIDATED';
      rows.push({
        id:'rb-'+p.id,
        name:p.name,
        source:'Rainbow Standard',
        company:p.developer||'',
        methodology:p.methodology||'',
        mechanism:p.mechanism==='REMOVAL'?'Removal':'Avoidance',
        country:p.country||'',
        city:p.city||'',
        date:'2025-'+(p.status==='CREDITED'?'01':'08')+'-01',
        volume:p.issuedCredits||0,
        price:0,
        status:p.status,
        notes:'Available: '+(p.availableCredits||0)+' · Durability: '+p.durability+' · '+p.location,
        isNew:isNew,
        isActive:p.status==='CREDITED'
      });
    });
  }

  // --- Isometric Issuances ---
  if(DATA&&DATA.isometric&&DATA.isometric.recentIssuances){
    DATA.isometric.recentIssuances.forEach(function(iss,i){
      var d=iss.date||'';
      var isNew=d&&new Date(d)>=cutoff90;
      rows.push({
        id:'iso-'+i,
        name:iss.project||iss.supplier,
        source:'Isometric',
        company:iss.supplier||'',
        methodology:iss.pathway||'',
        mechanism:'Removal',
        country:'',
        city:'',
        date:d,
        volume:iss.credits||0,
        price:0,
        status:iss.status||'Issued',
        notes:'Protocol: '+iss.pathway+' · registry.isometric.com · Durability: '+iss.durability,
        isNew:isNew,
        isActive:true
      });
    });
  }

  return rows;
}

function renderDataControl(){
  if(!DATA)return;
  dcAllRows=buildDCRows();

  // Populate dynamic dropdowns
  var countries=[...new Set(dcAllRows.map(function(r){return r.country;}).filter(Boolean))].sort();
  var dc=document.getElementById('dc-country');
  dc.innerHTML='<option value="">All Countries</option>';
  countries.forEach(function(c){var o=document.createElement('option');o.value=c;o.textContent=c;dc.appendChild(o);});

  var methods=[...new Set(dcAllRows.map(function(r){return r.methodology;}).filter(Boolean))].sort();
  var dm=document.getElementById('dc-methodology');
  dm.innerHTML='<option value="">All Methodologies</option>';
  methods.forEach(function(m){var o=document.createElement('option');o.value=m;o.textContent=m;dm.appendChild(o);});

  // Timestamp
  document.getElementById('dc-refreshed').textContent=new Date().toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});

  // KPIs
  var newCount=dcAllRows.filter(function(r){return r.isNew;}).length;
  document.getElementById('dc-total').textContent=fmtNum(dcAllRows.length);
  document.getElementById('dc-new').textContent=fmtNum(newCount);

  filterDC();
}

function filterDC(){
  if(!dcAllRows.length)return;
  var q=(document.getElementById('dc-search').value||'').toLowerCase();
  var source=document.getElementById('dc-source').value;
  var mechanism=document.getElementById('dc-mechanism').value;
  var country=document.getElementById('dc-country').value;
  var method=document.getElementById('dc-methodology').value;
  var status=document.getElementById('dc-status').value;
  var onlyNew=document.getElementById('dc-only-new').checked;
  var onlyCredited=document.getElementById('dc-only-credited').checked;
  var dateFrom=document.getElementById('dc-date-from').value;
  var dateTo=document.getElementById('dc-date-to').value;

  dcFiltered=dcAllRows.filter(function(r){
    if(q){
      var hay=(r.name+' '+r.company+' '+r.methodology+' '+r.country+' '+r.source+' '+r.status+' '+r.city+' '+r.notes).toLowerCase();
      if(!hay.includes(q))return false;
    }
    if(source&&r.source!==source)return false;
    if(mechanism&&r.mechanism!==mechanism)return false;
    if(country&&r.country!==country)return false;
    if(method&&r.methodology!==method)return false;
    if(status&&r.status!==status)return false;
    if(onlyNew&&!r.isNew)return false;
    if(onlyCredited&&!(r.status==='CREDITED'||r.status==='Delivered'||r.status==='Active'))return false;
    if(dateFrom&&r.date&&r.date<dateFrom)return false;
    if(dateTo&&r.date&&r.date>dateTo)return false;
    return true;
  });

  dcFiltered.sort(function(a,b){
    var va=a[dcSortKey],vb=b[dcSortKey];
    if(typeof va==='string')return dcSortDir*(va||'').localeCompare(vb||'');
    return dcSortDir*((va||0)-(vb||0));
  });

  dcPage=1;
  var vol=dcFiltered.reduce(function(s,r){return s+(r.volume||0);},0);
  document.getElementById('dc-filtered').textContent=fmtNum(dcFiltered.length);
  document.getElementById('dc-volume').textContent=fmtShort(vol);
  document.getElementById('dc-count').textContent=fmtNum(dcFiltered.length)+' records matching filters ('+fmtNum(dcAllRows.length)+' total)';
  renderDCTable();
}

function dcSort(key){
  dcSortKey=key;
  document.getElementById('dc-sort-field').value=key;
  filterDC();
}

function dcResetFilters(){
  document.getElementById('dc-search').value='';
  document.getElementById('dc-source').value='';
  document.getElementById('dc-mechanism').value='';
  document.getElementById('dc-country').value='';
  document.getElementById('dc-methodology').value='';
  document.getElementById('dc-status').value='';
  document.getElementById('dc-only-new').checked=false;
  document.getElementById('dc-only-credited').checked=false;
  document.getElementById('dc-date-from').value='';
  document.getElementById('dc-date-to').value='';
  filterDC();
}

var dcSourceCls={'Puro.earth':'dc-source-puro','CDR.fyi':'dc-source-cdr','Rainbow Standard':'dc-source-rainbow','Isometric':'dc-source-iso'};
var dcSourceDot={'Puro.earth':'var(--green2)','CDR.fyi':'var(--accent)','Rainbow Standard':'var(--purple)','Isometric':'var(--pink)'};
var dcMechBadge={Removal:'badge-delivered',Avoidance:'badge-partial',Transaction:'badge-contracted'};
var dcStatusBadge={CREDITED:'badge-retired',Delivered:'badge-delivered',Active:'badge-delivered',Contracted:'badge-contracted',VALIDATED:'badge-contracted',LISTED:'badge-partial',REGISTERED:'badge-other',PUBLIC_COMMENT_PERIOD:'badge-bcr',Issued:'badge-bcr',WITHDRAWN:'badge-other',REJECTED:'badge-other'};

function renderDCTable(){
  var start=(dcPage-1)*DC_PER_PAGE;
  var pageRows=dcFiltered.slice(start,start+DC_PER_PAGE);
  var tbody=document.getElementById('dc-body');

  tbody.innerHTML=pageRows.map(function(r){
    var dot='<div style="width:8px;height:8px;border-radius:50%;background:'+dcSourceDot[r.source]+';display:inline-block;margin-right:5px;flex-shrink:0;"></div>';
    var srcHtml=dot+'<span class="'+(dcSourceCls[r.source]||'')+'">'+r.source+'</span>';
    var volHtml=r.volume>0?'<span style="font-weight:700;color:var(--text1);">'+fmtNum(Math.round(r.volume))+'</span>':'<span style="color:var(--text3)">—</span>';
    var priceHtml=r.price>0?'<span style="color:var(--amber);">€'+r.price.toFixed(0)+'</span>':'<span style="color:var(--text3)">—</span>';
    var statusHtml=r.status?'<span class="badge '+(dcStatusBadge[r.status]||'badge-other')+'">'+r.status+'</span>':'—';
    var mechHtml=r.mechanism?'<span class="badge '+(dcMechBadge[r.mechanism]||'badge-other')+'">'+r.mechanism+'</span>':'—';
    var newDot=r.isNew?'<span title="New entry" style="display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--green);margin-right:4px;flex-shrink:0;"></span>':'';
    var chk=dcSelectedIds.has(r.id)?'checked':'';
    var rowCls=r.isNew?'dc-row-new':r.isActive?'dc-row-active':'';
    var cityStr=r.city?r.city+(r.country?' · '+r.country:''):r.country||'—';
    return '<tr class="'+rowCls+'">'
      +'<td style="text-align:center;"><input type="checkbox" '+chk+' onchange="dcToggleRow(\''+r.id+'\',this.checked)" style="accent-color:var(--amber);"></td>'
      +'<td class="td-bold dc-col-name" style="max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="'+r.name+'">'+newDot+r.name+'</td>'
      +'<td class="dc-col-source" style="white-space:nowrap;">'+srcHtml+'</td>'
      +'<td class="dc-col-company" style="font-size:11px;max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="'+r.company+'">'+r.company+'</td>'
      +'<td class="dc-col-methodology" style="font-size:11px;max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="'+r.methodology+'">'+r.methodology+'</td>'
      +'<td class="dc-col-mechanism">'+mechHtml+'</td>'
      +'<td class="dc-col-country" style="font-size:11px;white-space:nowrap;">'+cityStr+'</td>'
      +'<td class="dc-col-date td-mono" style="color:var(--text3);white-space:nowrap;">'+r.date+'</td>'
      +'<td class="dc-col-volume" style="text-align:right;white-space:nowrap;">'+volHtml+'</td>'
      +'<td class="dc-col-price" style="text-align:right;white-space:nowrap;">'+priceHtml+'</td>'
      +'<td class="dc-col-status">'+statusHtml+'</td>'
      +'<td class="dc-col-notes" style="display:none;font-size:10px;color:var(--text3);max-width:200px;">'+r.notes+'</td>'
      +'</tr>';
  }).join('');

  var total=dcFiltered.length,pages=Math.ceil(total/DC_PER_PAGE);
  document.getElementById('dc-info').textContent='Showing '+(start+1)+'–'+Math.min(start+DC_PER_PAGE,total)+' of '+fmtNum(total);
  renderPagination('dc-pages',dcPage,pages,function(p){dcPage=p;renderDCTable();document.getElementById('dc-table-wrap').scrollTop=0;});
}

function dcToggleCol(cls){
  document.querySelectorAll('.'+cls).forEach(function(el){
    el.style.display=el.style.display==='none'?'':'none';
  });
}

function dcToggleRow(id,checked){
  if(checked)dcSelectedIds.add(id);else dcSelectedIds.delete(id);
  var info=document.getElementById('dc-selected-info');
  if(dcSelectedIds.size>0)info.textContent=dcSelectedIds.size+' row(s) selected';
  else info.textContent='';
}

function dcSelectAll(checked){
  var start=(dcPage-1)*DC_PER_PAGE;
  var pageRows=dcFiltered.slice(start,start+DC_PER_PAGE);
  pageRows.forEach(function(r){if(checked)dcSelectedIds.add(r.id);else dcSelectedIds.delete(r.id);});
  renderDCTable();
  var info=document.getElementById('dc-selected-info');
  if(dcSelectedIds.size>0)info.textContent=dcSelectedIds.size+' row(s) selected';
  else info.textContent='';
}

function dcExportCSV(){
  var rows=dcSelectedIds.size>0?dcFiltered.filter(function(r){return dcSelectedIds.has(r.id);}):dcFiltered;
  var headers=['Name','Source','Company','Methodology','Mechanism','Country','City','Date','Volume_tCO2','Price_EUR','Status','Notes'];
  var csv=headers.join(',')+'\n';
  csv+=rows.map(function(r){
    return [r.name,r.source,r.company,r.methodology,r.mechanism,r.country,r.city,r.date,r.volume,r.price,r.status,r.notes]
      .map(function(v){return '"'+(v===null||v===undefined?'':String(v).replace(/"/g,'""'))+'"';}).join(',');
  }).join('\n');
  var blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;a.download='CDR_data_export_'+new Date().toISOString().slice(0,10)+'.csv';a.click();
  URL.revokeObjectURL(url);
}

function dcExportXLSX(){
  // Build table HTML for SheetJS-style export via data URI
  var rows=dcSelectedIds.size>0?dcFiltered.filter(function(r){return dcSelectedIds.has(r.id);}):dcFiltered;
  var headers=['Name','Source','Company','Methodology','Mechanism','Country','City','Date','Volume (tCO2)','Price (EUR/t)','Status','Notes'];
  var tsv=headers.join('\t')+'\n';
  tsv+=rows.map(function(r){
    return [r.name,r.source,r.company,r.methodology,r.mechanism,r.country,r.city,r.date,r.volume,r.price,r.status,r.notes].join('\t');
  }).join('\n');
  // SheetJS not loaded; export as TSV with .xls extension (opens in Excel)
  var blob=new Blob([tsv],{type:'application/vnd.ms-excel;charset=utf-8;'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;a.download='CDR_data_export_'+new Date().toISOString().slice(0,10)+'.xls';a.click();
  URL.revokeObjectURL(url);
}

loadData();
</script>
</body>
</html>`;
  return c.html(html);
})

export default app
