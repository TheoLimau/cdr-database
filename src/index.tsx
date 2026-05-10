import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'
import api from './routes/api'

type Bindings = { DB: D1Database }
const app = new Hono<{ Bindings: Bindings }>()

app.use('/static/*', serveStatic({ root: './public' }))
app.route('/api', api)

app.get('*', (c) => {
  const html = String.raw`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>CDR Intelligence Platform</title>
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css">
<style>
:root{
  --bg:#0a0f1e;--bg2:#0e1628;--bg3:#131d32;--card:#111827;--card2:#1a2236;
  --border:#1e2d4a;--border2:#2a3f5f;
  --accent:#00d4ff;--green:#00e5a0;--amber:#f59e0b;--purple:#8b5cf6;--pink:#ec4899;--orange:#f97316;
  --text1:#e2e8f0;--text2:#94a3b8;--text3:#5a7399;
  --glow:0 0 20px rgba(0,212,255,.15);
}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text1);font-family:'Inter',system-ui,sans-serif;display:flex;height:100vh;overflow:hidden}

/* ── SIDEBAR ── */
#sidebar{width:240px;min-width:240px;background:var(--bg2);border-right:1px solid var(--border);display:flex;flex-direction:column;overflow-y:auto;transition:width .25s}
#sidebar.collapsed{width:60px;min-width:60px}
#sidebar.collapsed .nav-label,.sidebar-logo span,.sidebar-logo .logo-sub,#sidebar.collapsed .nav-text,#sidebar.collapsed .nav-badge{display:none}
.sidebar-logo{display:flex;align-items:center;gap:10px;padding:20px 16px 16px;border-bottom:1px solid var(--border)}
.sidebar-logo .logo-icon{width:34px;height:34px;background:linear-gradient(135deg,var(--accent),var(--green));border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.sidebar-logo span{font-size:13px;font-weight:700;color:var(--text1);line-height:1.2}
.sidebar-logo .logo-sub{font-size:10px;color:var(--text3);margin-top:1px}
.nav-section{padding:12px 8px 4px}
.nav-label{font-size:10px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;padding:0 8px;margin-bottom:4px}
.nav-btn{display:flex;align-items:center;gap:9px;width:100%;padding:8px 10px;border-radius:8px;border:none;cursor:pointer;background:transparent;color:var(--text2);font-size:12.5px;font-weight:500;transition:all .18s;text-align:left;position:relative}
.nav-btn:hover{background:var(--card2);color:var(--text1)}
.nav-btn.active{background:linear-gradient(135deg,rgba(0,212,255,.14),rgba(0,229,160,.07));color:var(--accent);border:1px solid rgba(0,212,255,.18)}
.nav-btn .icon{font-size:14px;width:18px;text-align:center;flex-shrink:0}
.nav-badge{margin-left:auto;font-size:9px;font-weight:700;padding:1px 6px;border-radius:10px;background:rgba(0,212,255,.15);color:var(--accent)}
.nav-badge.green{background:rgba(0,229,160,.15);color:var(--green)}
.nav-badge.purple{background:rgba(139,92,246,.15);color:var(--purple)}
.nav-badge.pink{background:rgba(236,72,153,.15);color:var(--pink)}
.sidebar-toggle{margin:auto 8px 12px;padding:8px 10px;border-radius:8px;border:none;background:var(--card);color:var(--text3);cursor:pointer;font-size:12px;width:calc(100% - 16px);text-align:left;transition:all .18s}
.sidebar-toggle:hover{color:var(--text1)}

/* ── MAIN ── */
#main{flex:1;display:flex;flex-direction:column;overflow:hidden}
#topbar{height:54px;min-height:54px;background:var(--bg2);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 20px;gap:12px}
.topbar-title{font-size:15px;font-weight:700;color:var(--text1)}
.topbar-sub{font-size:11px;color:var(--text3);margin-left:4px}
#topbar-search{flex:1;max-width:380px;position:relative;margin-left:auto}
#topbar-search input{width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:9px;padding:7px 14px 7px 34px;color:var(--text1);font-size:12px;outline:none;transition:border-color .2s}
#topbar-search input:focus{border-color:var(--accent)}
#topbar-search .icon{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--text3);font-size:12px}
#search-dropdown{position:absolute;top:calc(100% + 6px);left:0;right:0;background:var(--card);border:1px solid var(--border2);border-radius:10px;z-index:100;display:none;max-height:320px;overflow-y:auto}
#search-dropdown.open{display:block}
.search-item{padding:9px 14px;cursor:pointer;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--border)}
.search-item:last-child{border-bottom:none}
.search-item:hover{background:var(--card2)}
.search-item .si-type{font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px;text-transform:uppercase;flex-shrink:0}
.search-item .si-label{font-size:12px;color:var(--text1);font-weight:600}
.search-item .si-sub{font-size:10px;color:var(--text3)}
#content{flex:1;overflow-y:auto;padding:20px}

/* ── PAGES ── */
.page{display:none}
.page.active{display:block}

/* ── CARDS / KPI ── */
.kpi-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px;margin-bottom:20px}
.kpi-card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;position:relative;overflow:hidden;transition:border-color .2s}
.kpi-card:hover{border-color:var(--border2)}
.kpi-label{font-size:10px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.6px;margin-bottom:6px}
.kpi-value{font-size:22px;font-weight:800;color:var(--text1);line-height:1}
.kpi-value.accent{color:var(--accent)}
.kpi-value.green{color:var(--green)}
.kpi-value.amber{color:var(--amber)}
.kpi-value.purple{color:var(--purple)}
.kpi-sub{font-size:10px;color:var(--text3);margin-top:4px}
.kpi-icon{position:absolute;right:14px;top:14px;font-size:20px;opacity:.25}
.kpi-trend{font-size:10px;margin-top:5px;font-weight:600}
.kpi-trend.up{color:var(--green)}
.kpi-trend.down{color:var(--pink)}

/* ── SECTION HEADER ── */
.sec-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;gap:10px;flex-wrap:wrap}
.sec-title{font-size:14px;font-weight:700;color:var(--text1)}
.sec-sub{font-size:11px;color:var(--text3);margin-top:1px}

/* ── CHARTS ── */
.charts-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;margin-bottom:20px}
.chart-card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px}
.chart-title{font-size:12px;font-weight:700;color:var(--text2);margin-bottom:2px}
.chart-sub{font-size:10px;color:var(--text3);margin-bottom:12px}
.chart-wrap{position:relative}

/* ── TABLE ── */
.table-wrap{background:var(--card);border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-bottom:16px}
.table-scroll{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:12px}
thead th{background:var(--bg3);color:var(--text3);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;padding:10px 14px;text-align:left;white-space:nowrap;border-bottom:1px solid var(--border);cursor:pointer;user-select:none}
thead th:hover{color:var(--text2)}
thead th.sorted{color:var(--accent)}
tbody tr{border-bottom:1px solid var(--border);transition:background .15s}
tbody tr:last-child{border-bottom:none}
tbody tr:hover{background:var(--card2)}
tbody td{padding:9px 14px;color:var(--text2);white-space:nowrap}
td.td-main{color:var(--text1);font-weight:600}
td.td-link{color:var(--accent);cursor:pointer;font-weight:600}
td.td-link:hover{text-decoration:underline}
.td-num{text-align:right;font-variant-numeric:tabular-nums}
.badge{display:inline-flex;align-items:center;font-size:10px;font-weight:700;padding:2px 8px;border-radius:5px;text-transform:uppercase;letter-spacing:.4px}
.badge-green{background:rgba(0,229,160,.12);color:var(--green)}
.badge-blue{background:rgba(0,212,255,.12);color:var(--accent)}
.badge-purple{background:rgba(139,92,246,.12);color:var(--purple)}
.badge-amber{background:rgba(245,158,11,.12);color:var(--amber)}
.badge-pink{background:rgba(236,72,153,.12);color:var(--pink)}
.badge-gray{background:rgba(90,115,153,.12);color:var(--text3)}
.badge-orange{background:rgba(249,115,22,.12);color:var(--orange)}

/* ── FILTERS ── */
.filter-bar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;align-items:center}
.filter-input{background:var(--card);border:1px solid var(--border2);border-radius:8px;padding:7px 12px;color:var(--text1);font-size:12px;outline:none;transition:border-color .2s}
.filter-input:focus{border-color:var(--accent)}
.filter-select{background:var(--card);border:1px solid var(--border2);border-radius:8px;padding:7px 10px;color:var(--text1);font-size:12px;outline:none;cursor:pointer}
.filter-btn{padding:7px 14px;border-radius:8px;border:1px solid var(--border2);background:var(--card);color:var(--text2);font-size:12px;cursor:pointer;transition:all .18s}
.filter-btn:hover,.filter-btn.active{border-color:var(--accent);color:var(--accent);background:rgba(0,212,255,.06)}
.filter-count{font-size:11px;color:var(--text3);margin-left:auto}

/* ── PAGINATION ── */
.pagination{display:flex;align-items:center;gap:6px;padding:12px 14px;justify-content:center;border-top:1px solid var(--border)}
.page-btn{padding:5px 10px;border-radius:6px;border:1px solid var(--border);background:var(--bg3);color:var(--text2);font-size:11px;cursor:pointer;transition:all .18s}
.page-btn:hover:not(:disabled){border-color:var(--accent);color:var(--accent)}
.page-btn.active{background:var(--accent);border-color:var(--accent);color:#000;font-weight:700}
.page-btn:disabled{opacity:.35;cursor:not-allowed}
.page-info{font-size:11px;color:var(--text3)}

/* ── PROGRESS BAR ── */
.progress-wrap{height:5px;background:var(--bg3);border-radius:3px;overflow:hidden;width:80px;display:inline-block;vertical-align:middle}
.progress-fill{height:100%;border-radius:3px;transition:width .4s}

/* ── RIBBON ── */
.ribbon{display:flex;align-items:center;gap:12px;background:rgba(0,212,255,.05);border:1px solid rgba(0,212,255,.18);border-radius:11px;padding:11px 16px;margin-bottom:18px;flex-wrap:wrap}
.ribbon-icon{font-size:18px;flex-shrink:0}
.ribbon-text{font-size:11.5px;color:var(--text2);line-height:1.5;flex:1}

/* ── ANOMALY CARDS ── */
.anomaly-list{display:flex;flex-direction:column;gap:8px}
.anomaly-card{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px 16px;display:flex;align-items:center;gap:12px;transition:border-color .2s}
.anomaly-card:hover{border-color:var(--border2)}
.anomaly-card.high{border-left:3px solid var(--pink)}
.anomaly-card.medium{border-left:3px solid var(--amber)}
.anomaly-card.low{border-left:3px solid var(--accent)}
.anomaly-icon{font-size:18px;flex-shrink:0}
.anomaly-body{flex:1}
.anomaly-name{font-size:12px;font-weight:700;color:var(--text1)}
.anomaly-desc{font-size:11px;color:var(--text3);margin-top:2px}
.anomaly-sev{font-size:9px;font-weight:700;padding:2px 8px;border-radius:5px;text-transform:uppercase}

/* ── DETAIL PANEL ── */
#detail-panel{position:fixed;right:0;top:0;bottom:0;width:480px;background:var(--bg2);border-left:1px solid var(--border);z-index:50;transform:translateX(100%);transition:transform .28s cubic-bezier(.4,0,.2,1);overflow-y:auto;display:flex;flex-direction:column}
#detail-panel.open{transform:translateX(0)}
.detail-header{padding:20px;border-bottom:1px solid var(--border);display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.detail-title{font-size:16px;font-weight:800;color:var(--text1)}
.detail-close{background:var(--bg3);border:none;border-radius:8px;padding:6px 10px;color:var(--text3);cursor:pointer;font-size:14px;flex-shrink:0;transition:all .18s}
.detail-close:hover{color:var(--text1)}
.detail-body{padding:20px;flex:1}
.detail-section{margin-bottom:20px}
.detail-section-title{font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--border)}
.detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.detail-stat{background:var(--bg3);border-radius:8px;padding:10px 12px}
.detail-stat-label{font-size:9px;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:.5px}
.detail-stat-value{font-size:16px;font-weight:800;color:var(--text1);margin-top:2px}

/* ── LOADING ── */
.loading{display:flex;align-items:center;justify-content:center;padding:48px;color:var(--text3);font-size:13px;gap:10px}
.spinner{width:18px;height:18px;border:2px solid var(--border2);border-top-color:var(--accent);border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.empty{text-align:center;padding:48px;color:var(--text3);font-size:13px}

/* ── METHOD COLORS ── */
.m-Biochar{color:#00e5a0}.m-BECCS{color:#00d4ff}.m-DACCS{color:#8b5cf6}
.m-Enhanced-Weathering{color:#f59e0b}.m-Mineralization{color:#ec4899}
.m-Ocean-Alkalinity{color:#06b6d4}.m-Ocean-Removal{color:#10b981}
.m-Biomass-Storage{color:#f97316}.m-Other{color:#94a3b8}

/* ── RESPONSIVE ── */
@media(max-width:900px){
  #sidebar{width:60px;min-width:60px}
  #sidebar .nav-label,.sidebar-logo span,.sidebar-logo .logo-sub,.nav-text,.nav-badge{display:none}
  .kpi-grid{grid-template-columns:repeat(2,1fr)}
  #detail-panel{width:100%}
}
@media(max-width:600px){
  #content{padding:12px}
  .kpi-grid{grid-template-columns:1fr 1fr}
  .charts-grid{grid-template-columns:1fr}
}
</style>
</head>
<body>

<!-- SIDEBAR -->
<nav id="sidebar">
  <div class="sidebar-logo">
    <div class="logo-icon">🌍</div>
    <div>
      <span>CDR Intelligence</span>
      <div class="logo-sub">4 registries · Live data</div>
    </div>
  </div>

  <div class="nav-section">
    <div class="nav-label">Overview</div>
    <button class="nav-btn active" onclick="showPage('dashboard')"><span class="icon">📊</span><span class="nav-text">Dashboard</span></button>
    <button class="nav-btn" onclick="showPage('intelligence')"><span class="icon">🧠</span><span class="nav-text">Market Intelligence</span></button>
  </div>

  <div class="nav-section">
    <div class="nav-label">Data Explorer</div>
    <button class="nav-btn" onclick="showPage('transactions')"><span class="icon">⚡</span><span class="nav-text">Transactions</span><span class="nav-badge" id="nb-tx">5.5K</span></button>
    <button class="nav-btn" onclick="showPage('suppliers')"><span class="icon">🏭</span><span class="nav-text">Suppliers</span><span class="nav-badge" id="nb-sup">212</span></button>
    <button class="nav-btn" onclick="showPage('buyers')"><span class="icon">💼</span><span class="nav-text">Buyers</span></button>
    <button class="nav-btn" onclick="showPage('methods')"><span class="icon">🔬</span><span class="nav-text">Methods</span></button>
  </div>

  <div class="nav-section">
    <div class="nav-label">Registries</div>
    <button class="nav-btn" onclick="showPage('puro')"><span class="icon">🌱</span><span class="nav-text">Puro.earth</span><span class="nav-badge green">113</span></button>
    <button class="nav-btn" onclick="showPage('rainbow')"><span class="icon">🌈</span><span class="nav-text">Rainbow Std</span><span class="nav-badge purple">115</span></button>
    <button class="nav-btn" onclick="showPage('isometric')"><span class="icon">⚖️</span><span class="nav-text">Isometric</span><span class="nav-badge pink">305</span></button>
  </div>

  <div class="nav-section">
    <div class="nav-label">Analysis</div>
    <button class="nav-btn" onclick="showPage('anomalies')"><span class="icon">🚨</span><span class="nav-text">Anomalies</span><span class="nav-badge" id="nb-anom" style="background:rgba(236,72,153,.15);color:var(--pink)"></span></button>
  </div>

  <button class="sidebar-toggle" onclick="toggleSidebar()"><i class="fas fa-bars"></i> <span>Collapse</span></button>
</nav>

<!-- MAIN -->
<div id="main">
  <!-- TOPBAR -->
  <header id="topbar">
    <div>
      <div class="topbar-title" id="topbar-title">Dashboard</div>
      <span class="topbar-sub" id="topbar-sub">CDR market overview</span>
    </div>
    <div id="topbar-search">
      <i class="fas fa-search icon"></i>
      <input type="text" id="global-search" placeholder="Search suppliers, projects, buyers…" autocomplete="off" oninput="globalSearch(this.value)">
      <div id="search-dropdown"></div>
    </div>
  </header>

  <div id="content">

    <!-- ══════════════════════════════════════════════════════ -->
    <!-- PAGE: DASHBOARD                                        -->
    <!-- ══════════════════════════════════════════════════════ -->
    <div class="page active" id="page-dashboard">
      <div class="kpi-grid" id="dash-kpis">
        <div class="loading"><div class="spinner"></div> Loading…</div>
      </div>
      <div class="charts-grid" id="dash-charts">
        <div class="chart-card">
          <div class="chart-title">Volume by Year (tCO₂)</div>
          <div class="chart-sub">Annual committed volume growth</div>
          <div class="chart-wrap" style="height:200px"><canvas id="ch-timeline"></canvas></div>
        </div>
        <div class="chart-card">
          <div class="chart-title">Volume by Method</div>
          <div class="chart-sub">Committed volume per CDR technology</div>
          <div class="chart-wrap" style="height:200px"><canvas id="ch-methods"></canvas></div>
        </div>
        <div class="chart-card">
          <div class="chart-title">Transaction Status</div>
          <div class="chart-sub">Contracted · Delivered · Retired · Partial</div>
          <div class="chart-wrap" style="height:200px"><canvas id="ch-status"></canvas></div>
        </div>
        <div class="chart-card">
          <div class="chart-title">Top Buyers by Volume</div>
          <div class="chart-sub">Market concentration analysis</div>
          <div class="chart-wrap" style="height:200px"><canvas id="ch-buyers"></canvas></div>
        </div>
      </div>
      <div class="sec-header">
        <div><div class="sec-title">🏭 Top Suppliers</div><div class="sec-sub">Ranked by committed volume</div></div>
        <button class="filter-btn" onclick="showPage('suppliers')">View all →</button>
      </div>
      <div class="table-wrap"><div class="table-scroll"><table>
        <thead><tr><th>Supplier</th><th>Country</th><th>Method</th><th class="td-num">Committed</th><th class="td-num">Delivered</th><th class="td-num">Rate</th><th class="td-num">Price/t</th></tr></thead>
        <tbody id="dash-sup-tbody"><tr><td colspan="7" class="loading"><div class="spinner"></div> Loading…</td></tr></tbody>
      </table></div></div>
    </div>

    <!-- ══════════════════════════════════════════════════════ -->
    <!-- PAGE: MARKET INTELLIGENCE                              -->
    <!-- ══════════════════════════════════════════════════════ -->
    <div class="page" id="page-intelligence">
      <div class="ribbon">
        <div class="ribbon-icon">🧠</div>
        <div class="ribbon-text"><strong style="color:var(--accent)">Market Intelligence</strong> — Automated insights from 5,498 transactions across 4 registries. Price analysis, concentration metrics, and delivery performance.</div>
      </div>
      <div class="kpi-grid" id="intel-kpis"></div>
      <div class="charts-grid">
        <div class="chart-card" style="grid-column:1/-1">
          <div class="chart-title">Price per tCO₂ by Method</div>
          <div class="chart-sub">Avg · Min · Max price range for each CDR technology</div>
          <div class="chart-wrap" style="height:240px"><canvas id="ch-price-method"></canvas></div>
        </div>
        <div class="chart-card">
          <div class="chart-title">Delivery Rate by Method</div>
          <div class="chart-sub">% of committed volume actually delivered</div>
          <div class="chart-wrap" style="height:220px"><canvas id="ch-delivery-rate"></canvas></div>
        </div>
        <div class="chart-card">
          <div class="chart-title">Supply vs Demand Gap</div>
          <div class="chart-sub">Committed vs delivered across methods</div>
          <div class="chart-wrap" style="height:220px"><canvas id="ch-gap"></canvas></div>
        </div>
      </div>
      <div class="sec-header" style="margin-top:8px">
        <div><div class="sec-title">🚨 Price Anomalies</div><div class="sec-sub">Suppliers with prices significantly above or below method average</div></div>
        <button class="filter-btn" onclick="showPage('anomalies')">All anomalies →</button>
      </div>
      <div id="intel-anomalies" class="anomaly-list"></div>
    </div>

    <!-- ══════════════════════════════════════════════════════ -->
    <!-- PAGE: TRANSACTIONS                                     -->
    <!-- ══════════════════════════════════════════════════════ -->
    <div class="page" id="page-transactions">
      <div class="filter-bar">
        <input class="filter-input" style="flex:1;min-width:200px" type="text" id="tx-q" placeholder="🔍 Search supplier, buyer, technology…" oninput="debounce(filterTx,300)()">
        <select class="filter-select" id="tx-method" onchange="filterTx()"><option value="">All Methods</option></select>
        <select class="filter-select" id="tx-status" onchange="filterTx()">
          <option value="">All Status</option>
          <option>Contracted</option><option>Delivered</option><option>Retired</option><option>Partial</option>
        </select>
        <select class="filter-select" id="tx-year" onchange="filterTx()"><option value="">All Years</option></select>
        <span class="filter-count" id="tx-count"></span>
      </div>
      <div class="table-wrap">
        <div class="table-scroll"><table>
          <thead><tr>
            <th onclick="sortTx('tx_date')">Date</th>
            <th onclick="sortTx('volume')">Volume</th>
            <th>Method</th>
            <th onclick="sortTx('supplier_name')">Supplier</th>
            <th onclick="sortTx('buyer_name')">Buyer</th>
            <th>Status</th>
            <th onclick="sortTx('price_per_ton')">Price/t</th>
          </tr></thead>
          <tbody id="tx-tbody"><tr><td colspan="7" class="loading"><div class="spinner"></div></td></tr></tbody>
        </table></div>
        <div class="pagination" id="tx-pagination"></div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════ -->
    <!-- PAGE: SUPPLIERS                                        -->
    <!-- ══════════════════════════════════════════════════════ -->
    <div class="page" id="page-suppliers">
      <div class="filter-bar">
        <input class="filter-input" style="flex:1;min-width:200px" type="text" id="sup-q" placeholder="🔍 Search supplier or city…" oninput="debounce(filterSup,300)()">
        <select class="filter-select" id="sup-method" onchange="filterSup()"><option value="">All Methods</option></select>
        <select class="filter-select" id="sup-country" onchange="filterSup()"><option value="">All Countries</option></select>
        <select class="filter-select" id="sup-sort" onchange="filterSup()">
          <option value="committed">Sort: Volume</option>
          <option value="delivery_rate">Sort: Delivery Rate</option>
          <option value="price_per_ton">Sort: Price</option>
          <option value="tx_count">Sort: Transactions</option>
          <option value="name">Sort: Name</option>
        </select>
        <span class="filter-count" id="sup-count"></span>
      </div>
      <div class="table-wrap">
        <div class="table-scroll"><table>
          <thead><tr>
            <th>Supplier</th><th>Country</th><th>Method</th>
            <th class="td-num">Committed</th><th class="td-num">Delivered</th>
            <th class="td-num">Rate</th><th class="td-num">Price/t</th><th class="td-num">Tx</th>
          </tr></thead>
          <tbody id="sup-tbody"><tr><td colspan="8" class="loading"><div class="spinner"></div></td></tr></tbody>
        </table></div>
        <div class="pagination" id="sup-pagination"></div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════ -->
    <!-- PAGE: BUYERS                                           -->
    <!-- ══════════════════════════════════════════════════════ -->
    <div class="page" id="page-buyers">
      <div class="ribbon">
        <div class="ribbon-icon">💼</div>
        <div class="ribbon-text" id="buyers-ribbon">Loading buyer concentration data…</div>
      </div>
      <div class="charts-grid">
        <div class="chart-card">
          <div class="chart-title">Top 10 Buyers by Volume</div>
          <div class="chart-sub">tCO₂ committed</div>
          <div class="chart-wrap" style="height:260px"><canvas id="ch-buyers-detail"></canvas></div>
        </div>
        <div class="chart-card">
          <div class="chart-title">Market Share %</div>
          <div class="chart-sub">Concentration by buyer</div>
          <div class="chart-wrap" style="height:260px"><canvas id="ch-buyers-pct"></canvas></div>
        </div>
      </div>
      <div class="table-wrap"><div class="table-scroll"><table>
        <thead><tr><th>#</th><th>Buyer</th><th class="td-num">Volume (tCO₂)</th><th class="td-num">Market Share</th><th class="td-num">Transactions</th></tr></thead>
        <tbody id="buyers-tbody"></tbody>
      </table></div></div>
    </div>

    <!-- ══════════════════════════════════════════════════════ -->
    <!-- PAGE: METHODS                                          -->
    <!-- ══════════════════════════════════════════════════════ -->
    <div class="page" id="page-methods">
      <div class="kpi-grid" id="methods-kpis"></div>
      <div class="charts-grid">
        <div class="chart-card" style="grid-column:1/-1">
          <div class="chart-title">Price Range per Method ($/tCO₂)</div>
          <div class="chart-sub">Min, average and max observed price</div>
          <div class="chart-wrap" style="height:260px"><canvas id="ch-method-price"></canvas></div>
        </div>
      </div>
      <div id="methods-cards" class="charts-grid"></div>
    </div>

    <!-- ══════════════════════════════════════════════════════ -->
    <!-- PAGE: PURO PROJECTS                                    -->
    <!-- ══════════════════════════════════════════════════════ -->
    <div class="page" id="page-puro">
      <div class="filter-bar">
        <input class="filter-input" style="flex:1;min-width:200px" type="text" id="puro-q" placeholder="🔍 Search project or supplier…" oninput="debounce(filterPuro,300)()">
        <select class="filter-select" id="puro-method" onchange="filterPuro()"><option value="">All Methods</option></select>
        <select class="filter-select" id="puro-country" onchange="filterPuro()"><option value="">All Countries</option></select>
        <span class="filter-count" id="puro-count"></span>
      </div>
      <div class="table-wrap">
        <div class="table-scroll"><table>
          <thead><tr><th>Project</th><th>Method</th><th>Country</th><th>Supplier</th><th>Start</th><th>End</th></tr></thead>
          <tbody id="puro-tbody"></tbody>
        </table></div>
        <div class="pagination" id="puro-pagination"></div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════ -->
    <!-- PAGE: RAINBOW                                          -->
    <!-- ══════════════════════════════════════════════════════ -->
    <div class="page" id="page-rainbow">
      <div class="filter-bar">
        <input class="filter-input" style="flex:1;min-width:200px" type="text" id="rb-q" placeholder="🔍 Search project or developer…" oninput="debounce(filterRainbow,300)()">
        <select class="filter-select" id="rb-method" onchange="filterRainbow()"><option value="">All Methodologies</option></select>
        <select class="filter-select" id="rb-country" onchange="filterRainbow()"><option value="">All Countries</option></select>
        <select class="filter-select" id="rb-status" onchange="filterRainbow()"><option value="">All Status</option></select>
        <span class="filter-count" id="rb-count"></span>
      </div>
      <div class="table-wrap">
        <div class="table-scroll"><table>
          <thead><tr><th>Project</th><th>Developer</th><th>Methodology</th><th>Country</th><th>Status</th><th class="td-num">Issued Credits</th><th class="td-num">Available</th></tr></thead>
          <tbody id="rb-tbody"></tbody>
        </table></div>
        <div class="pagination" id="rb-pagination"></div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════ -->
    <!-- PAGE: ISOMETRIC                                        -->
    <!-- ══════════════════════════════════════════════════════ -->
    <div class="page" id="page-isometric">
      <div class="ribbon">
        <div class="ribbon-icon">⚖️</div>
        <div class="ribbon-text"><strong style="color:var(--pink)">Isometric Registry</strong> — Science-based permanence ratings. 305 issuances · 99,731 tCO₂ issued · 32,616 retired (32.7% retirement rate)</div>
      </div>
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-label">Credits Issued</div><div class="kpi-value accent">99,731</div><div class="kpi-sub">tCO₂ total</div><div class="kpi-icon">📋</div></div>
        <div class="kpi-card"><div class="kpi-label">Credits Retired</div><div class="kpi-value green">32,616</div><div class="kpi-sub">tCO₂ retired</div><div class="kpi-icon">✅</div></div>
        <div class="kpi-card"><div class="kpi-label">Retirement Rate</div><div class="kpi-value amber">32.7%</div><div class="kpi-sub">of issued</div><div class="kpi-icon">📈</div></div>
        <div class="kpi-card"><div class="kpi-label">Active Protocols</div><div class="kpi-value purple">17</div><div class="kpi-sub">pathways</div><div class="kpi-icon">🔬</div></div>
      </div>
      <div class="sec-header"><div><div class="sec-title">🏆 Top Suppliers</div><div class="sec-sub">By issued credits</div></div></div>
      <div class="table-wrap"><div class="table-scroll"><table>
        <thead><tr><th>Supplier</th><th>Pathway</th><th class="td-num">Credits</th><th class="td-num">Projects</th></tr></thead>
        <tbody id="iso-tbody"></tbody>
      </table></div></div>
      <div class="sec-header" style="margin-top:16px"><div><div class="sec-title">📋 Recent Issuances</div></div></div>
      <div class="table-wrap"><div class="table-scroll"><table>
        <thead><tr><th>Supplier</th><th>Project</th><th>Pathway</th><th>Date</th><th class="td-num">Credits</th><th>Durability</th></tr></thead>
        <tbody id="iso-recent-tbody"></tbody>
      </table></div></div>
    </div>

    <!-- ══════════════════════════════════════════════════════ -->
    <!-- PAGE: ANOMALIES                                        -->
    <!-- ══════════════════════════════════════════════════════ -->
    <div class="page" id="page-anomalies">
      <div class="ribbon" style="border-color:rgba(236,72,153,.25);background:rgba(236,72,153,.04)">
        <div class="ribbon-icon">🚨</div>
        <div class="ribbon-text"><strong style="color:var(--pink)">Anomaly Detection</strong> — Automatically detected price outliers. Suppliers whose price deviates more than 20% from their method's average are flagged.</div>
      </div>
      <div class="filter-bar">
        <button class="filter-btn active" id="anom-all" onclick="filterAnomalies('')">All</button>
        <button class="filter-btn" id="anom-high" onclick="filterAnomalies('high')">🔴 High</button>
        <button class="filter-btn" id="anom-med" onclick="filterAnomalies('medium')">🟡 Medium</button>
        <span class="filter-count" id="anom-count"></span>
      </div>
      <div id="anomalies-list" class="anomaly-list"></div>
    </div>

  </div><!-- /content -->
</div><!-- /main -->

<!-- DETAIL PANEL -->
<div id="detail-panel">
  <div class="detail-header">
    <div>
      <div class="detail-title" id="detail-title">Supplier Detail</div>
      <div style="font-size:11px;color:var(--text3);margin-top:3px" id="detail-sub"></div>
    </div>
    <button class="detail-close" onclick="closeDetail()"><i class="fas fa-times"></i></button>
  </div>
  <div class="detail-body" id="detail-body"></div>
</div>
<div id="detail-overlay" onclick="closeDetail()" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:49"></div>

<script>
// ══════════════════════════════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════════════════════════════
var MC={'Biochar':'#00e5a0','BECCS':'#00d4ff','DACCS':'#8b5cf6','Enhanced Weathering':'#f59e0b','Mineralization':'#ec4899','Ocean Alkalinity':'#06b6d4','Ocean Removal':'#10b981','Biomass Storage':'#f97316','Other':'#94a3b8'};
var STATUS_BADGE={'Contracted':'badge-blue','Delivered':'badge-green','Retired':'badge-amber','Partial':'badge-orange'};

function fmtNum(n){
  if(n===null||n===undefined)return '—';
  var v=parseFloat(n);
  if(isNaN(v))return '—';
  if(v>=1e6)return (v/1e6).toFixed(2)+'M';
  if(v>=1e3)return (v/1e3).toFixed(1)+'K';
  return v.toFixed(0);
}
function fmtPrice(v){
  if(!v||parseFloat(v)===0)return '—';
  return '$'+parseFloat(v).toFixed(0);
}
function fmtRate(committed,delivered){
  if(!committed||committed===0)return '0%';
  return (delivered/committed*100).toFixed(1)+'%';
}
function rateBar(rate,width){
  width=width||60;
  var r=parseFloat(rate)||0;
  var col=r>=50?'#00e5a0':r>=10?'#f59e0b':'#ec4899';
  return '<div class="progress-wrap" style="width:'+width+'px"><div class="progress-fill" style="width:'+Math.min(r,100)+'%;background:'+col+'"></div></div>';
}
function methodBadge(m){
  var col=MC[m]||'#94a3b8';
  return '<span class="badge" style="background:'+col+'22;color:'+col+'">'+( m||'—')+'</span>';
}
function debounce(fn,ms){
  var t;
  return function(){clearTimeout(t);t=setTimeout(fn,ms);};
}
async function api(path){
  var r=await fetch('/api'+path);
  var j=await r.json();
  return j.data;
}

// ══════════════════════════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════════════════════════
var pageMeta={
  dashboard:{title:'Dashboard',sub:'CDR market overview · 4 registries'},
  intelligence:{title:'Market Intelligence',sub:'Automated insights & price analysis'},
  transactions:{title:'Transactions',sub:'5,498 CDR transactions · 2019–2025'},
  suppliers:{title:'Suppliers',sub:'212 CDR producers'},
  buyers:{title:'Buyers',sub:'Market concentration analysis'},
  methods:{title:'Methods',sub:'CDR technology analysis'},
  puro:{title:'Puro.earth Registry',sub:'113 registered projects'},
  rainbow:{title:'Rainbow Standard',sub:'115 projects · Biomass carbon removal'},
  isometric:{title:'Isometric',sub:'305 issuances · Science-based permanence'},
  anomalies:{title:'Anomaly Detection',sub:'Automated price outlier detection'},
};
var pageInit={};

function showPage(id){
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active');});
  var pg=document.getElementById('page-'+id);
  if(!pg)return;
  pg.classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(function(b){
    b.classList.toggle('active', b.getAttribute('onclick')==="showPage('"+id+"')");
  });
  var m=pageMeta[id]||{title:id,sub:''};
  document.getElementById('topbar-title').textContent=m.title;
  document.getElementById('topbar-sub').textContent=m.sub;
  if(!pageInit[id]){
    pageInit[id]=true;
    var inits={
      dashboard:initDashboard,
      intelligence:initIntelligence,
      transactions:initTransactions,
      suppliers:initSuppliers,
      buyers:initBuyers,
      methods:initMethods,
      puro:initPuro,
      rainbow:initRainbow,
      isometric:initIsometric,
      anomalies:initAnomalies,
    };
    if(inits[id])inits[id]();
  }
}

function toggleSidebar(){
  document.getElementById('sidebar').classList.toggle('collapsed');
}

// ══════════════════════════════════════════════════════════════
// CHART HELPERS
// ══════════════════════════════════════════════════════════════
var CHARTS={};
function mkChart(id,cfg){
  if(CHARTS[id])CHARTS[id].destroy();
  var canvas=document.getElementById(id);
  if(!canvas)return;
  CHARTS[id]=new Chart(canvas,cfg);
  return CHARTS[id];
}
var GRID={color:'rgba(30,45,74,0.5)'};
var TICKS={color:'#5a7399',font:{size:10}};
var BORDER={display:false};
function baseAxes(extra){
  return Object.assign({x:{grid:{display:false},ticks:TICKS,border:BORDER},y:{grid:GRID,ticks:TICKS,border:BORDER}},extra||{});
}

// ══════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════
async function initDashboard(){
  var d=await api('/kpis');

  // KPI cards
  var k=d.kpi;
  var rate=(k.total_delivered/k.total_committed*100).toFixed(1);
  document.getElementById('dash-kpis').innerHTML=
    kpiCard('Total Committed',fmtNum(k.total_committed)+'<span style="font-size:13px;color:var(--text3)"> tCO₂</span>','accent','📋','All 4 registries combined')+
    kpiCard('Total Delivered',fmtNum(k.total_delivered)+'<span style="font-size:13px;color:var(--text3)"> tCO₂</span>','green','✅','Actually removed')+
    kpiCard('Delivery Rate',rate+'<span style="font-size:13px;color:var(--text3)">%</span>','amber','⚡','Committed vs delivered')+
    kpiCard('Transactions',fmtNum(k.total_transactions),'accent','⚡','CDR.fyi tracked')+
    kpiCard('Suppliers',k.unique_suppliers,'purple','🏭','Unique producers')+
    kpiCard('Buyers',k.unique_buyers,'','💼','Unique purchasers');

  // Timeline chart
  var years=d.timeline.map(function(t){return t.year;});
  var vols=d.timeline.map(function(t){return t.volume;});
  mkChart('ch-timeline',{type:'bar',data:{labels:years,datasets:[{label:'Volume (tCO₂)',data:vols,backgroundColor:'rgba(0,212,255,0.55)',borderColor:'#00d4ff',borderWidth:1,borderRadius:5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return ' '+fmtNum(ctx.raw)+' tCO₂';}}}},scales:baseAxes({y:{grid:GRID,ticks:{color:'#5a7399',font:{size:10},callback:function(v){return fmtNum(v);}},border:BORDER}})}});

  // Methods chart
  var mnames=d.methods.map(function(m){return m.method;});
  var mvols=d.methods.map(function(m){return m.committed;});
  var mcols=mnames.map(function(m){return (MC[m]||'#94a3b8')+'99';});
  mkChart('ch-methods',{type:'doughnut',data:{labels:mnames,datasets:[{data:mvols,backgroundColor:mcols,borderWidth:2,borderColor:'#131d32'}]},options:{responsive:true,maintainAspectRatio:false,cutout:'55%',plugins:{legend:{position:'right',labels:{color:'#8fa8cc',font:{size:10},boxWidth:12}},tooltip:{callbacks:{label:function(ctx){return ' '+ctx.label+': '+fmtNum(ctx.raw)+' tCO₂';}}}}}});

  // Status chart
  var snames=d.status_dist.map(function(s){return s.status;});
  var scounts=d.status_dist.map(function(s){return s.count;});
  var scols={'Contracted':'rgba(0,212,255,0.6)','Delivered':'rgba(0,229,160,0.6)','Retired':'rgba(245,158,11,0.6)','Partial':'rgba(249,115,22,0.6)'};
  mkChart('ch-status',{type:'doughnut',data:{labels:snames,datasets:[{data:scounts,backgroundColor:snames.map(function(s){return scols[s]||'rgba(90,115,153,0.6)';}),borderWidth:2,borderColor:'#131d32'}]},options:{responsive:true,maintainAspectRatio:false,cutout:'55%',plugins:{legend:{position:'right',labels:{color:'#8fa8cc',font:{size:10},boxWidth:12}}}}});

  // Buyers chart
  var bnames=d.top_buyers.slice(0,8).map(function(b){return b.name;});
  var bvols=d.top_buyers.slice(0,8).map(function(b){return b.volume;});
  mkChart('ch-buyers',{type:'bar',data:{labels:bnames,datasets:[{data:bvols,backgroundColor:'rgba(139,92,246,0.55)',borderColor:'#8b5cf6',borderWidth:1,borderRadius:4}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return ' '+fmtNum(ctx.raw)+' tCO₂';}}}},scales:{x:{grid:GRID,ticks:{color:'#5a7399',font:{size:10},callback:function(v){return fmtNum(v);}},border:BORDER},y:{grid:{display:false},ticks:{color:'#8fa8cc',font:{size:10}},border:BORDER}}}});

  // Top suppliers table
  var sups=await api('/suppliers?limit=10&sort=committed');
  var html='';
  sups.rows.forEach(function(s){
    var rate=s.delivery_rate||0;
    html+='<tr>'+
      '<td class="td-link" onclick="openSupplierDetail(\''+esc(s.name)+'\')">'+s.name+'</td>'+
      '<td>'+( s.country||'—')+'</td>'+
      '<td>'+methodBadge(s.canonical_method)+'</td>'+
      '<td class="td-num">'+fmtNum(s.committed)+'</td>'+
      '<td class="td-num">'+fmtNum(s.delivered)+'</td>'+
      '<td class="td-num">'+rateBar(rate)+' <span style="font-size:10px;color:var(--text3)">'+rate+'%</span></td>'+
      '<td class="td-num">'+fmtPrice(s.price_per_ton)+'</td>'+
    '</tr>';
  });
  document.getElementById('dash-sup-tbody').innerHTML=html||'<tr><td colspan="7" class="empty">No data</td></tr>';
}

function kpiCard(label,value,color,icon,sub){
  var cls=color?'kpi-value '+color:'kpi-value';
  return '<div class="kpi-card"><div class="kpi-label">'+label+'</div><div class="'+cls+'">'+value+'</div><div class="kpi-sub">'+( sub||'')+'</div><div class="kpi-icon">'+icon+'</div></div>';
}
function esc(s){return String(s||'').replace(/'/g,"\\'").replace(/"/g,'&quot;');}

// ══════════════════════════════════════════════════════════════
// MARKET INTELLIGENCE
// ══════════════════════════════════════════════════════════════
async function initIntelligence(){
  var [methods,anomalies]=await Promise.all([api('/methods'),api('/anomalies')]);

  // KPI cards
  document.getElementById('intel-kpis').innerHTML=
    kpiCard('Methods Tracked',methods.methods.length,'accent','🔬','CDR technologies')+
    kpiCard('Anomalies Found',anomalies.rows.length,'pink','🚨','Price outliers')+
    kpiCard('High Severity',anomalies.rows.filter(function(a){return a.severity==='high';}).length,'','🔴','Deviation >40%')+
    kpiCard('Price Range','$'+Math.min.apply(null,methods.methods.filter(function(m){return m.min_price>0;}).map(function(m){return m.min_price;})).toFixed(0)+'–$'+Math.max.apply(null,methods.methods.map(function(m){return m.max_price;})).toFixed(0),'amber','💰','Min–max per tCO₂');

  // Price by method
  var mlist=methods.methods.filter(function(m){return m.avg_price>0;});
  mkChart('ch-price-method',{type:'bar',data:{
    labels:mlist.map(function(m){return m.method;}),
    datasets:[
      {label:'Min',data:mlist.map(function(m){return m.min_price||0;}),backgroundColor:'rgba(0,229,160,0.3)',borderColor:'#00e5a0',borderWidth:1,borderRadius:3},
      {label:'Avg',data:mlist.map(function(m){return m.avg_price||0;}),backgroundColor:'rgba(0,212,255,0.55)',borderColor:'#00d4ff',borderWidth:1,borderRadius:3},
      {label:'Max',data:mlist.map(function(m){return m.max_price||0;}),backgroundColor:'rgba(245,158,11,0.3)',borderColor:'#f59e0b',borderWidth:1,borderRadius:3},
    ]
  },options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#8fa8cc',font:{size:10},boxWidth:12}},tooltip:{callbacks:{label:function(ctx){return ' '+ctx.dataset.label+': $'+ctx.raw.toFixed(0)+'/t';}}}},scales:baseAxes({x:{grid:{display:false},ticks:{color:'#8fa8cc',font:{size:10},maxRotation:30},border:BORDER}})}});

  // Delivery rate
  var mdr=methods.methods.filter(function(m){return m.total_committed>0;});
  var drVals=mdr.map(function(m){return m.total_committed>0?Math.min(m.total_delivered/m.total_committed*100,100):0;});
  mkChart('ch-delivery-rate',{type:'bar',data:{
    labels:mdr.map(function(m){return m.method;}),
    datasets:[{data:drVals,backgroundColor:drVals.map(function(v){return v>=50?'rgba(0,229,160,0.6)':v>=10?'rgba(245,158,11,0.6)':'rgba(236,72,153,0.6)';}),borderRadius:4}]
  },options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return ' '+ctx.raw.toFixed(1)+'%';}}}},scales:baseAxes({y:{grid:GRID,ticks:{color:'#5a7399',font:{size:10},callback:function(v){return v+'%';}},border:BORDER}})}});

  // Gap chart
  mkChart('ch-gap',{type:'bar',data:{
    labels:methods.methods.map(function(m){return m.method;}),
    datasets:[
      {label:'Committed',data:methods.methods.map(function(m){return m.total_committed;}),backgroundColor:'rgba(0,212,255,0.4)',borderRadius:3},
      {label:'Delivered',data:methods.methods.map(function(m){return m.total_delivered;}),backgroundColor:'rgba(0,229,160,0.7)',borderRadius:3},
    ]
  },options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#8fa8cc',font:{size:10},boxWidth:12}},tooltip:{callbacks:{label:function(ctx){return ' '+ctx.dataset.label+': '+fmtNum(ctx.raw)+' tCO₂';}}}},scales:baseAxes({x:{grid:{display:false},ticks:{color:'#8fa8cc',font:{size:10},maxRotation:30},border:BORDER},y:{grid:GRID,ticks:{color:'#5a7399',font:{size:10},callback:function(v){return fmtNum(v);}},border:BORDER}})}});

  // Top anomalies
  var html='';
  anomalies.rows.slice(0,8).forEach(function(a){
    var sevCls=a.severity==='high'?'badge-pink':a.severity==='medium'?'badge-amber':'badge-blue';
    var icon=a.deviation_pct>0?'📈':'📉';
    html+='<div class="anomaly-card '+a.severity+'">'+
      '<div class="anomaly-icon">'+icon+'</div>'+
      '<div class="anomaly-body">'+
        '<div class="anomaly-name">'+a.supplier_name+'</div>'+
        '<div class="anomaly-desc">'+a.description+'</div>'+
      '</div>'+
      '<div><span class="badge '+sevCls+'">'+a.severity+'</span></div>'+
    '</div>';
  });
  document.getElementById('intel-anomalies').innerHTML=html||'<div class="empty">No anomalies detected</div>';
}

// ══════════════════════════════════════════════════════════════
// TRANSACTIONS
// ══════════════════════════════════════════════════════════════
var TX_STATE={page:1,sort:'tx_date',order:'desc'};

async function initTransactions(){
  var opts=await api('/filters/options');
  var sel=document.getElementById('tx-method');
  opts.methods.forEach(function(m){sel.innerHTML+='<option>'+m+'</option>';});
  var ysel=document.getElementById('tx-year');
  opts.years.forEach(function(y){ysel.innerHTML+='<option>'+y+'</option>';});
  filterTx();
}

async function filterTx(){
  TX_STATE.page=1;
  await loadTx();
}

function sortTx(col){
  if(TX_STATE.sort===col)TX_STATE.order=TX_STATE.order==='desc'?'asc':'desc';
  else{TX_STATE.sort=col;TX_STATE.order='desc';}
  loadTx();
}

async function loadTx(){
  var q=encodeURIComponent(document.getElementById('tx-q').value||'');
  var method=encodeURIComponent(document.getElementById('tx-method').value||'');
  var status=encodeURIComponent(document.getElementById('tx-status').value||'');
  var year=document.getElementById('tx-year').value||'';
  var url='/transactions?q='+q+'&method='+method+'&status='+status+'&year='+year+'&sort='+TX_STATE.sort+'&order='+TX_STATE.order+'&page='+TX_STATE.page+'&limit=100';
  document.getElementById('tx-tbody').innerHTML='<tr><td colspan="7" class="loading"><div class="spinner"></div></td></tr>';
  var d=await api(url);
  document.getElementById('tx-count').textContent=d.total.toLocaleString()+' transactions';
  var html='';
  d.rows.forEach(function(tx){
    var bclass=STATUS_BADGE[tx.status]||'badge-gray';
    html+='<tr>'+
      '<td>'+( tx.tx_date||'—')+'</td>'+
      '<td class="td-num">'+fmtNum(tx.volume)+'</td>'+
      '<td>'+methodBadge(tx.canonical_method)+'</td>'+
      '<td class="td-link" onclick="openSupplierDetail(\''+esc(tx.supplier_name)+'\')">'+( tx.supplier_name||'—')+'</td>'+
      '<td>'+( tx.buyer_name||'—')+'</td>'+
      '<td><span class="badge '+bclass+'">'+( tx.status||'—')+'</span></td>'+
      '<td class="td-num">'+fmtPrice(tx.price_per_ton)+'</td>'+
    '</tr>';
  });
  document.getElementById('tx-tbody').innerHTML=html||'<tr><td colspan="7" class="empty">No transactions match filters</td></tr>';
  renderPagination('tx-pagination',d.page,d.pages,function(p){TX_STATE.page=p;loadTx();});
}

// ══════════════════════════════════════════════════════════════
// SUPPLIERS
// ══════════════════════════════════════════════════════════════
var SUP_STATE={page:1,sort:'committed'};

async function initSuppliers(){
  var opts=await api('/filters/options');
  var msel=document.getElementById('sup-method');
  opts.methods.forEach(function(m){msel.innerHTML+='<option>'+m+'</option>';});
  var csel=document.getElementById('sup-country');
  opts.countries.forEach(function(c){csel.innerHTML+='<option>'+c+'</option>';});
  filterSup();
}

async function filterSup(){
  SUP_STATE.page=1;
  await loadSup();
}

async function loadSup(){
  var q=encodeURIComponent(document.getElementById('sup-q').value||'');
  var method=encodeURIComponent(document.getElementById('sup-method').value||'');
  var country=encodeURIComponent(document.getElementById('sup-country').value||'');
  var sort=document.getElementById('sup-sort').value||'committed';
  SUP_STATE.sort=sort;
  var url='/suppliers?q='+q+'&method='+method+'&country='+country+'&sort='+sort+'&page='+SUP_STATE.page+'&limit=50';
  document.getElementById('sup-tbody').innerHTML='<tr><td colspan="8" class="loading"><div class="spinner"></div></td></tr>';
  var d=await api(url);
  document.getElementById('sup-count').textContent=d.total.toLocaleString()+' suppliers';
  document.getElementById('nb-sup').textContent=d.total;
  var html='';
  d.rows.forEach(function(s){
    var rate=s.delivery_rate||0;
    html+='<tr>'+
      '<td class="td-link" onclick="openSupplierDetail(\''+esc(s.name)+'\')">'+s.name+'</td>'+
      '<td>'+( s.country||'—')+'</td>'+
      '<td>'+methodBadge(s.canonical_method)+'</td>'+
      '<td class="td-num">'+fmtNum(s.committed)+'</td>'+
      '<td class="td-num">'+fmtNum(s.delivered)+'</td>'+
      '<td class="td-num">'+rateBar(rate)+' <span style="font-size:10px;color:var(--text3)">'+rate+'%</span></td>'+
      '<td class="td-num">'+fmtPrice(s.price_per_ton)+'</td>'+
      '<td class="td-num">'+s.tx_count+'</td>'+
    '</tr>';
  });
  document.getElementById('sup-tbody').innerHTML=html||'<tr><td colspan="8" class="empty">No suppliers</td></tr>';
  renderPagination('sup-pagination',d.page,d.pages,function(p){SUP_STATE.page=p;loadSup();});
}

// ══════════════════════════════════════════════════════════════
// BUYERS
// ══════════════════════════════════════════════════════════════
async function initBuyers(){
  var d=await api('/buyers');
  var buyers=d.rows;
  var total=buyers.reduce(function(s,b){return s+b.volume;},0);

  document.getElementById('buyers-ribbon').innerHTML=
    '<strong style="color:var(--accent)">Market Concentration Alert</strong> — '+
    '<strong>Microsoft</strong> alone accounts for <strong style="color:var(--amber)">'+buyers[0].pct+'%</strong> of all volume. '+
    'Top 3 buyers control <strong style="color:var(--amber)">'+(buyers.slice(0,3).reduce(function(s,b){return s+b.pct;},0).toFixed(1))+'%</strong> of the market. '+
    'HHI Index indicates <strong style="color:var(--pink)">highly concentrated</strong> market.';

  var bnames=buyers.slice(0,10).map(function(b){return b.name;});
  var bvols=buyers.slice(0,10).map(function(b){return b.volume;});
  var bpcts=buyers.slice(0,10).map(function(b){return b.pct;});
  mkChart('ch-buyers-detail',{type:'bar',data:{labels:bnames,datasets:[{data:bvols,backgroundColor:'rgba(139,92,246,0.55)',borderColor:'#8b5cf6',borderWidth:1,borderRadius:4}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return ' '+fmtNum(ctx.raw)+' tCO₂';}}}},scales:{x:{grid:GRID,ticks:{color:'#5a7399',font:{size:10},callback:function(v){return fmtNum(v);}},border:BORDER},y:{grid:{display:false},ticks:{color:'#8fa8cc',font:{size:10}},border:BORDER}}}});
  mkChart('ch-buyers-pct',{type:'doughnut',data:{labels:bnames,datasets:[{data:bpcts,backgroundColor:['rgba(139,92,246,0.7)','rgba(0,212,255,0.6)','rgba(0,229,160,0.6)','rgba(245,158,11,0.6)','rgba(236,72,153,0.6)','rgba(249,115,22,0.5)','rgba(6,182,212,0.5)','rgba(16,185,129,0.5)','rgba(139,92,246,0.4)','rgba(90,115,153,0.5)'],borderWidth:2,borderColor:'#131d32'}]},options:{responsive:true,maintainAspectRatio:false,cutout:'50%',plugins:{legend:{position:'right',labels:{color:'#8fa8cc',font:{size:10},boxWidth:12}},tooltip:{callbacks:{label:function(ctx){return ' '+ctx.label+': '+ctx.raw.toFixed(1)+'%';}}}}}});

  var html='';
  buyers.forEach(function(b,i){
    html+='<tr><td class="td-num" style="color:var(--text3)">'+(i+1)+'</td><td class="td-main">'+b.name+'</td><td class="td-num">'+fmtNum(b.volume)+'</td><td class="td-num"><span class="badge '+(i===0?'badge-pink':i<3?'badge-amber':'badge-gray')+'">'+b.pct.toFixed(1)+'%</span></td><td class="td-num">'+b.tx_count+'</td></tr>';
  });
  document.getElementById('buyers-tbody').innerHTML=html;
}

// ══════════════════════════════════════════════════════════════
// METHODS
// ══════════════════════════════════════════════════════════════
async function initMethods(){
  var d=await api('/methods');
  var methods=d.methods;

  // KPI
  document.getElementById('methods-kpis').innerHTML=methods.map(function(m){
    var col=MC[m.method]||'#94a3b8';
    var rate=m.total_committed>0?(m.total_delivered/m.total_committed*100).toFixed(1):0;
    return '<div class="kpi-card" style="border-color:'+col+'33"><div class="kpi-label">'+m.method+'</div><div class="kpi-value" style="color:'+col+'">'+fmtNum(m.total_committed)+'</div><div class="kpi-sub">tCO₂ · '+m.supplier_count+' suppliers · '+rate+'% delivered</div></div>';
  }).join('');

  // Price range chart
  var mf=methods.filter(function(m){return m.avg_price>0;});
  mkChart('ch-method-price',{type:'bar',data:{
    labels:mf.map(function(m){return m.method;}),
    datasets:[
      {label:'Min $',data:mf.map(function(m){return m.min_price||0;}),backgroundColor:'rgba(0,229,160,0.4)',borderRadius:3},
      {label:'Avg $',data:mf.map(function(m){return m.avg_price||0;}),backgroundColor:'rgba(0,212,255,0.6)',borderRadius:3},
      {label:'Max $',data:mf.map(function(m){return m.max_price||0;}),backgroundColor:'rgba(245,158,11,0.4)',borderRadius:3},
    ]
  },options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#8fa8cc',font:{size:10},boxWidth:12}},tooltip:{callbacks:{label:function(ctx){return ' '+ctx.dataset.label+': $'+ctx.raw.toFixed(0)+'/t';}}}},scales:baseAxes({x:{grid:{display:false},ticks:{color:'#8fa8cc',font:{size:10}},border:BORDER}})}});

  // Method detail cards
  document.getElementById('methods-cards').innerHTML=methods.map(function(m){
    var col=MC[m.method]||'#94a3b8';
    var rate=m.total_committed>0?(m.total_delivered/m.total_committed*100).toFixed(1):0;
    return '<div class="chart-card" style="border-color:'+col+'33">'+
      '<div class="chart-title" style="color:'+col+'">'+m.method+'</div>'+
      '<div class="chart-sub">'+m.supplier_count+' suppliers</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">'+
        '<div class="detail-stat"><div class="detail-stat-label">Committed</div><div class="detail-stat-value" style="font-size:14px;color:'+col+'">'+fmtNum(m.total_committed)+'</div></div>'+
        '<div class="detail-stat"><div class="detail-stat-label">Delivered</div><div class="detail-stat-value" style="font-size:14px;color:var(--green)">'+fmtNum(m.total_delivered)+'</div></div>'+
        '<div class="detail-stat"><div class="detail-stat-label">Delivery Rate</div><div class="detail-stat-value" style="font-size:14px;color:var(--amber)">'+rate+'%</div></div>'+
        '<div class="detail-stat"><div class="detail-stat-label">Avg Price</div><div class="detail-stat-value" style="font-size:14px">'+( m.avg_price?'$'+m.avg_price.toFixed(0):'—')+'</div></div>'+
      '</div>'+
    '</div>';
  }).join('');
}

// ══════════════════════════════════════════════════════════════
// PURO PROJECTS
// ══════════════════════════════════════════════════════════════
var PURO_STATE={page:1};

async function initPuro(){
  var opts=await api('/filters/options');
  var msel=document.getElementById('puro-method');
  opts.methods.forEach(function(m){msel.innerHTML+='<option>'+m+'</option>';});
  // countries from puro
  var rows=await api('/projects/puro?limit=1000');
  var countries=[...new Set(rows.rows.map(function(r){return r.country;}).filter(Boolean))].sort();
  var csel=document.getElementById('puro-country');
  countries.forEach(function(c){csel.innerHTML+='<option>'+c+'</option>';});
  filterPuro();
}

async function filterPuro(){
  PURO_STATE.page=1;
  await loadPuro();
}

async function loadPuro(){
  var q=encodeURIComponent(document.getElementById('puro-q').value||'');
  var method=encodeURIComponent(document.getElementById('puro-method').value||'');
  var country=encodeURIComponent(document.getElementById('puro-country').value||'');
  var url='/projects/puro?q='+q+'&method='+method+'&country='+country+'&page='+PURO_STATE.page+'&limit=50';
  document.getElementById('puro-tbody').innerHTML='<tr><td colspan="6" class="loading"><div class="spinner"></div></td></tr>';
  var d=await api(url);
  document.getElementById('puro-count').textContent=d.total.toLocaleString()+' projects';
  var html='';
  d.rows.forEach(function(p){
    html+='<tr>'+
      '<td class="td-main">'+p.name+'</td>'+
      '<td>'+methodBadge(p.canonical_method)+'</td>'+
      '<td>'+( p.country||'—')+'</td>'+
      '<td class="td-link" onclick="openSupplierDetail(\''+esc(p.supplier_name)+'\')">'+( p.supplier_name||'—')+'</td>'+
      '<td>'+( p.start_date||'—')+'</td>'+
      '<td>'+( p.end_date||'—')+'</td>'+
    '</tr>';
  });
  document.getElementById('puro-tbody').innerHTML=html||'<tr><td colspan="6" class="empty">No projects</td></tr>';
  renderPagination('puro-pagination',d.page,d.pages,function(pg){PURO_STATE.page=pg;loadPuro();});
}

// ══════════════════════════════════════════════════════════════
// RAINBOW
// ══════════════════════════════════════════════════════════════
var RB_STATE={page:1};

async function initRainbow(){
  var rows=await api('/projects/rainbow?limit=200');
  var methods=[...new Set(rows.rows.map(function(r){return r.methodology;}).filter(Boolean))].sort();
  var countries=[...new Set(rows.rows.map(function(r){return r.country;}).filter(Boolean))].sort();
  var statuses=[...new Set(rows.rows.map(function(r){return r.status;}).filter(Boolean))].sort();
  var msel=document.getElementById('rb-method');
  methods.forEach(function(m){msel.innerHTML+='<option>'+m+'</option>';});
  var csel=document.getElementById('rb-country');
  countries.forEach(function(c){csel.innerHTML+='<option>'+c+'</option>';});
  var ssel=document.getElementById('rb-status');
  statuses.forEach(function(s){ssel.innerHTML+='<option>'+s+'</option>';});
  filterRainbow();
}

async function filterRainbow(){
  RB_STATE.page=1;
  await loadRainbow();
}

async function loadRainbow(){
  var q=encodeURIComponent(document.getElementById('rb-q').value||'');
  var method=encodeURIComponent(document.getElementById('rb-method').value||'');
  var country=encodeURIComponent(document.getElementById('rb-country').value||'');
  var status=encodeURIComponent(document.getElementById('rb-status').value||'');
  var url='/projects/rainbow?q='+q+'&methodology='+method+'&country='+country+'&status='+status+'&page='+RB_STATE.page+'&limit=50';
  document.getElementById('rb-tbody').innerHTML='<tr><td colspan="7" class="loading"><div class="spinner"></div></td></tr>';
  var d=await api(url);
  document.getElementById('rb-count').textContent=d.total.toLocaleString()+' projects';
  var statusBadge={'CREDITED':'badge-green','ACTIVE':'badge-blue','RETIRED':'badge-amber','CLOSED':'badge-gray'};
  var html='';
  d.rows.forEach(function(p){
    var sb=statusBadge[p.status]||'badge-gray';
    html+='<tr>'+
      '<td class="td-main">'+p.name+'</td>'+
      '<td>'+( p.developer||'—')+'</td>'+
      '<td>'+( p.methodology||'—')+'</td>'+
      '<td>'+( p.country||'—')+'</td>'+
      '<td><span class="badge '+sb+'">'+( p.status||'—')+'</span></td>'+
      '<td class="td-num">'+fmtNum(p.issued_credits)+'</td>'+
      '<td class="td-num">'+fmtNum(p.available_credits)+'</td>'+
    '</tr>';
  });
  document.getElementById('rb-tbody').innerHTML=html||'<tr><td colspan="7" class="empty">No projects</td></tr>';
  renderPagination('rb-pagination',d.page,d.pages,function(pg){RB_STATE.page=pg;loadRainbow();});
}

// ══════════════════════════════════════════════════════════════
// ISOMETRIC
// ══════════════════════════════════════════════════════════════
async function initIsometric(){
  // static data from JSON (no extra API needed)
  var topSup=[
    {name:'Vaulted Deep',credits:10443.8,projects:1,pathway:'BiCRS'},
    {name:'Alt Carbon',credits:9345.31,projects:2,pathway:'EW'},
    {name:'Heirloom Carbon',credits:9029.12,projects:1,pathway:'DAC'},
    {name:'Lithos Carbon',credits:6880.09,projects:2,pathway:'EW'},
    {name:'CarbonBuilt',credits:6679.23,projects:1,pathway:'BiCRS'},
  ];
  var html='';
  topSup.forEach(function(s,i){
    html+='<tr><td class="td-link" onclick="openSupplierDetail(\''+esc(s.name)+'\')">'+s.name+'</td><td>'+s.pathway+'</td><td class="td-num">'+fmtNum(s.credits)+'</td><td class="td-num">'+s.projects+'</td></tr>';
  });
  document.getElementById('iso-tbody').innerHTML=html;

  var d=await api('/projects/isometric');
  var html2='';
  d.rows.forEach(function(p){
    html2+='<tr>'+
      '<td class="td-link" onclick="openSupplierDetail(\''+esc(p.supplier_name)+'\')">'+( p.supplier_name||'—')+'</td>'+
      '<td class="td-main">'+p.name+'</td>'+
      '<td>'+( p.pathway||'—')+'</td>'+
      '<td>'+( p.issued_date||'—')+'</td>'+
      '<td class="td-num">'+fmtNum(p.issued)+'</td>'+
      '<td><span class="badge badge-purple">'+( p.issued_date?'1000Y+':'—')+'</span></td>'+
    '</tr>';
  });
  document.getElementById('iso-recent-tbody').innerHTML=html2||'<tr><td colspan="6" class="empty">No data</td></tr>';
}

// ══════════════════════════════════════════════════════════════
// ANOMALIES
// ══════════════════════════════════════════════════════════════
var ALL_ANOMALIES=[];

async function initAnomalies(){
  var d=await api('/anomalies');
  ALL_ANOMALIES=d.rows;
  document.getElementById('nb-anom').textContent=ALL_ANOMALIES.length;
  filterAnomalies('');
}

function filterAnomalies(sev){
  ['anom-all','anom-high','anom-med'].forEach(function(id){
    document.getElementById(id).classList.remove('active');
  });
  if(sev==='')document.getElementById('anom-all').classList.add('active');
  else if(sev==='high')document.getElementById('anom-high').classList.add('active');
  else document.getElementById('anom-med').classList.add('active');
  var list=sev?ALL_ANOMALIES.filter(function(a){return a.severity===sev;}):ALL_ANOMALIES;
  document.getElementById('anom-count').textContent=list.length+' anomalies';
  var html='';
  list.forEach(function(a){
    var sevCls=a.severity==='high'?'badge-pink':a.severity==='medium'?'badge-amber':'badge-blue';
    var icon=a.deviation_pct>0?'📈':'📉';
    html+='<div class="anomaly-card '+a.severity+'">'+
      '<div class="anomaly-icon">'+icon+'</div>'+
      '<div class="anomaly-body">'+
        '<div class="anomaly-name"><span class="td-link" onclick="openSupplierDetail(\''+esc(a.supplier_name)+'\')">'+a.supplier_name+'</span> · <span style="color:'+( MC[a.canonical_method]||'#94a3b8')+'">'+( a.canonical_method||'')+'</span></div>'+
        '<div class="anomaly-desc">'+a.description+'</div>'+
      '</div>'+
      '<div style="text-align:right">'+
        '<span class="badge '+sevCls+'">'+a.severity+'</span>'+
        '<div style="font-size:10px;color:var(--text3);margin-top:4px">'+(a.deviation_pct>0?'+':'')+a.deviation_pct.toFixed(1)+'% vs avg</div>'+
      '</div>'+
    '</div>';
  });
  document.getElementById('anomalies-list').innerHTML=html||'<div class="empty">No anomalies</div>';
}

// ══════════════════════════════════════════════════════════════
// DETAIL PANEL — SUPPLIER
// ══════════════════════════════════════════════════════════════
async function openSupplierDetail(name){
  document.getElementById('detail-title').textContent=name;
  document.getElementById('detail-sub').textContent='Loading…';
  document.getElementById('detail-body').innerHTML='<div class="loading"><div class="spinner"></div> Loading supplier data…</div>';
  document.getElementById('detail-panel').classList.add('open');
  document.getElementById('detail-overlay').style.display='block';

  var d=await api('/suppliers/'+encodeURIComponent(name));
  var s=d.supplier;
  if(!s){document.getElementById('detail-body').innerHTML='<div class="empty">Supplier not found</div>';return;}

  var rate=s.delivery_rate||0;
  var rateCol=rate>=50?'var(--green)':rate>=10?'var(--amber)':'var(--pink)';
  document.getElementById('detail-sub').textContent=(s.country||'')+(s.canonical_method?' · '+s.canonical_method:'');

  var html=
    '<div class="detail-section">'+
      '<div class="detail-section-title">Key Metrics</div>'+
      '<div class="detail-grid">'+
        '<div class="detail-stat"><div class="detail-stat-label">Committed</div><div class="detail-stat-value" style="color:var(--accent)">'+fmtNum(s.committed)+'</div></div>'+
        '<div class="detail-stat"><div class="detail-stat-label">Delivered</div><div class="detail-stat-value" style="color:var(--green)">'+fmtNum(s.delivered)+'</div></div>'+
        '<div class="detail-stat"><div class="detail-stat-label">Delivery Rate</div><div class="detail-stat-value" style="color:'+rateCol+'">'+rate+'%</div></div>'+
        '<div class="detail-stat"><div class="detail-stat-label">Price/t</div><div class="detail-stat-value" style="color:var(--amber)">'+fmtPrice(s.price_per_ton)+'</div></div>'+
        '<div class="detail-stat"><div class="detail-stat-label">Transactions</div><div class="detail-stat-value">'+s.tx_count+'</div></div>'+
        '<div class="detail-stat"><div class="detail-stat-label">Method</div><div class="detail-stat-value" style="font-size:12px;color:'+(MC[s.canonical_method]||'#94a3b8')+'">'+( s.canonical_method||'—')+'</div></div>'+
      '</div>'+
    '</div>';

  if(s.city||s.first_tx){
    html+='<div class="detail-section">'+
      '<div class="detail-section-title">Profile</div>'+
      (s.city?'<div style="font-size:12px;color:var(--text2);margin-bottom:6px"><i class="fas fa-map-marker-alt" style="color:var(--text3);margin-right:6px"></i>'+s.city+'</div>':'')+
      (s.first_tx?'<div style="font-size:11px;color:var(--text3)">Active: '+s.first_tx+' → '+(s.last_tx||'present')+'</div>':'')+
    '</div>';
  }

  if(d.anomalies&&d.anomalies.length){
    html+='<div class="detail-section">'+
      '<div class="detail-section-title">⚠️ Price Anomalies</div>'+
      d.anomalies.map(function(a){return '<div style="font-size:11px;color:var(--amber);background:rgba(245,158,11,.07);border-radius:6px;padding:7px 10px;margin-bottom:4px">'+a.description+'</div>';}).join('')+
    '</div>';
  }

  if(d.puro_projects&&d.puro_projects.length){
    html+='<div class="detail-section">'+
      '<div class="detail-section-title">🌱 Puro.earth Projects ('+d.puro_projects.length+')</div>'+
      d.puro_projects.map(function(p){return '<div style="font-size:11px;color:var(--text2);padding:5px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text1);font-weight:600">'+p.name+'</span><span style="float:right;color:var(--text3)">'+( p.country||'')+'</span></div>';}).join('')+
    '</div>';
  }

  if(d.cross_registry){
    var cr=d.cross_registry;
    var regs=[];
    if(cr.has_puro)regs.push('<span class="badge badge-green">Puro</span>');
    if(cr.has_rainbow)regs.push('<span class="badge badge-purple">Rainbow</span>');
    if(cr.has_isometric)regs.push('<span class="badge badge-pink">Isometric</span>');
    regs.push('<span class="badge badge-blue">CDR.fyi</span>');
    html+='<div class="detail-section">'+
      '<div class="detail-section-title">🔗 Registry Presence</div>'+
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">'+regs.join('')+'</div>'+
      '<div style="font-size:11px;color:var(--text3)">Appears in '+cr.registry_count+' registr'+(cr.registry_count===1?'y':'ies')+'</div>'+
    '</div>';
  }

  // Recent transactions (last 5)
  if(d.txs&&d.txs.length){
    html+='<div class="detail-section">'+
      '<div class="detail-section-title">⚡ Recent Transactions ('+Math.min(d.txs.length,5)+')</div>'+
      '<table style="width:100%;font-size:11px"><thead><tr style="color:var(--text3)"><th style="padding:3px 6px">Date</th><th style="padding:3px 6px;text-align:right">Vol</th><th style="padding:3px 6px">Buyer</th><th style="padding:3px 6px">Status</th></tr></thead><tbody>'+
      d.txs.slice(0,5).map(function(tx){
        return '<tr><td style="padding:3px 6px">'+( tx.tx_date||'—')+'</td><td style="padding:3px 6px;text-align:right;color:var(--accent)">'+fmtNum(tx.volume)+'</td><td style="padding:3px 6px;color:var(--text2)">'+( tx.buyer_name||'—')+'</td><td style="padding:3px 6px"><span class="badge '+(STATUS_BADGE[tx.status]||'badge-gray')+'" style="font-size:9px">'+( tx.status||'—')+'</span></td></tr>';
      }).join('')+
      '</tbody></table>'+
    '</div>';
  }

  document.getElementById('detail-body').innerHTML=html;
}

function closeDetail(){
  document.getElementById('detail-panel').classList.remove('open');
  document.getElementById('detail-overlay').style.display='none';
}

// ══════════════════════════════════════════════════════════════
// GLOBAL SEARCH
// ══════════════════════════════════════════════════════════════
var searchTimer=null;
function globalSearch(q){
  clearTimeout(searchTimer);
  var dd=document.getElementById('search-dropdown');
  if(!q||q.length<2){dd.classList.remove('open');return;}
  searchTimer=setTimeout(async function(){
    var d=await api('/search?q='+encodeURIComponent(q));
    if(!d.results.length){dd.innerHTML='<div class="search-item"><div class="si-label" style="color:var(--text3)">No results</div></div>';dd.classList.add('open');return;}
    var typeCls={supplier:'badge-blue',buyer:'badge-purple',puro:'badge-green',rainbow:'badge-amber'};
    dd.innerHTML=d.results.map(function(r){
      var action=r.type==='supplier'||r.type==='buyer'?'openSupplierDetail(\''+esc(r.value)+'\')':'showPage(\''+r.type+'\')';
      return '<div class="search-item" onclick="'+action+';closeSearch()">'+
        '<span class="si-type badge '+(typeCls[r.type]||'badge-gray')+'" style="font-size:9px">'+r.type+'</span>'+
        '<div><div class="si-label">'+r.label+'</div><div class="si-sub">'+r.sub+'</div></div>'+
      '</div>';
    }).join('');
    dd.classList.add('open');
  },280);
}
function closeSearch(){
  document.getElementById('search-dropdown').classList.remove('open');
  document.getElementById('global-search').value='';
}
document.addEventListener('click',function(e){
  if(!document.getElementById('topbar-search').contains(e.target))
    document.getElementById('search-dropdown').classList.remove('open');
});

// ══════════════════════════════════════════════════════════════
// PAGINATION HELPER
// ══════════════════════════════════════════════════════════════
function renderPagination(containerId,page,pages,cb){
  var el=document.getElementById(containerId);
  if(!el)return;
  if(pages<=1){el.innerHTML='';return;}
  var btns='<button class="page-btn" '+(page<=1?'disabled':'')+' onclick="('+cb+')('+( page-1)+')">‹ Prev</button>';
  var start=Math.max(1,page-2),end=Math.min(pages,page+2);
  for(var i=start;i<=end;i++){
    btns+='<button class="page-btn '+(i===page?'active':'')+'" onclick="('+cb+')('+i+')">'+i+'</button>';
  }
  btns+='<button class="page-btn" '+(page>=pages?'disabled':'')+' onclick="('+cb+')('+( page+1)+')">Next ›</button>';
  btns+='<span class="page-info">Page '+page+' of '+pages+'</span>';
  el.innerHTML=btns;
}

// ══════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════
showPage('dashboard');
</script>
</body>
</html>`;
  return c.html(html);
})

export default app
