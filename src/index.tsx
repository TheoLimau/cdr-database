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
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%230a0f1e'/><text x='50%' y='50%' dominant-baseline='central' text-anchor='middle' font-size='20'>🌿</text></svg>">
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
/* ── HAMBURGER BUTTON (mobile only) ─────────────────────────── */
#hamburger{display:none;position:fixed;top:14px;left:14px;z-index:200;background:var(--card2);border:1px solid var(--border2);border-radius:10px;width:40px;height:40px;align-items:center;justify-content:center;cursor:pointer;flex-direction:column;gap:5px;padding:8px;transition:background .2s}
#hamburger span{display:block;width:20px;height:2px;background:var(--text2);border-radius:2px;transition:all .3s}
#hamburger.open span:nth-child(1){transform:translateY(7px) rotate(45deg)}
#hamburger.open span:nth-child(2){opacity:0;transform:scaleX(0)}
#hamburger.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
/* ── OVERLAY (mobile only) ───────────────────────────────────── */
#sidebar-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99;backdrop-filter:blur(2px)}
/* ── TABLE SCROLL HINT ───────────────────────────────────────── */
.table-scroll-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;position:relative}
.table-scroll-wrap::after{content:'';position:absolute;top:0;right:0;bottom:0;width:32px;background:linear-gradient(to left,var(--card),transparent);pointer-events:none;opacity:0;transition:opacity .3s}
.table-scroll-wrap.has-scroll::after{opacity:1}
.scroll-hint{display:none;font-size:10px;color:var(--text3);text-align:right;padding:4px 8px 0;}
/* ── FILTER COLLAPSE (mobile) ─────────────────────────────────── */
.filter-panel{transition:max-height .3s ease,opacity .3s ease;max-height:600px;opacity:1;overflow:hidden}
.filter-panel.collapsed{max-height:0;opacity:0}
.filter-toggle-btn{display:none;width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;color:var(--text2);padding:10px 14px;font-size:12px;font-weight:600;cursor:pointer;text-align:left;margin-bottom:10px}
/* ─────────────────────────────────────────────────────────────── */
/* TABLET  ≤1200px                                                 */
/* ─────────────────────────────────────────────────────────────── */
@media(max-width:1200px){
  .kpi-grid{grid-template-columns:repeat(3,1fr)}
  .supplier-grid{grid-template-columns:repeat(2,1fr)}
}
/* ─────────────────────────────────────────────────────────────── */
/* SMALL TABLET  ≤900px                                            */
/* ─────────────────────────────────────────────────────────────── */
@media(max-width:900px){
  #hamburger{display:flex}
  #sidebar{transform:translateX(-100%);width:260px;transition:transform .3s ease;z-index:100}
  #sidebar.open{transform:translateX(0)}
  #sidebar-overlay.open{display:block}
  #main{margin-left:0}
  .topbar{padding:0 14px 0 64px;height:56px}
  .page-title{font-size:14px}
  .page-sub{font-size:11px}
  .live-badge{padding:4px 10px;font-size:10px}
  .page{padding:16px}
  .kpi-grid{grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:16px}
  .kpi-card{padding:14px}
  .kpi-value{font-size:18px}
  .kpi-icon{font-size:16px;top:12px;right:12px}
  .charts-grid,.charts-grid-3{grid-template-columns:1fr;gap:14px}
  .chart-wrap{height:180px}
  .chart-wrap.tall{height:220px}
  .supplier-grid{grid-template-columns:repeat(2,1fr)}
  .insight-grid{grid-template-columns:1fr}
  .ribbon{flex-wrap:wrap;gap:8px;padding:10px 12px}
  .ribbon-text{font-size:11px}
  .scroll-hint{display:block}
  .filter-toggle-btn{display:block}
  .table-toolbar{padding:10px 12px;gap:8px}
  .search-box{min-width:140px}
  .pagination{flex-wrap:wrap;gap:6px;padding:10px 12px}
  .page-btns{flex-wrap:wrap}
  .page-btn{padding:7px 11px;min-width:36px;min-height:36px}
  th{padding:8px 10px;font-size:9px}
  td{padding:9px 10px;font-size:11px}
}
/* ─────────────────────────────────────────────────────────────── */
/* MOBILE  ≤600px                                                  */
/* ─────────────────────────────────────────────────────────────── */
@media(max-width:600px){
  .topbar{height:52px;padding:0 10px 0 60px}
  .page-sub{display:none}
  .topbar-right .live-badge{display:flex}
  .topbar-right>*:last-child{display:none}
  .page{padding:12px}
  .kpi-grid{grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}
  .kpi-card{padding:12px 10px;border-radius:10px}
  .kpi-label{font-size:9px;margin-bottom:6px}
  .kpi-value{font-size:16px}
  .kpi-sub{font-size:10px}
  .kpi-icon{display:none}
  .charts-grid,.charts-grid-3{gap:10px}
  .chart-card{padding:14px}
  .chart-title{font-size:12px}
  .chart-sub{font-size:10px;margin-bottom:10px}
  .chart-wrap{height:160px}
  .chart-wrap.tall{height:190px}
  .supplier-grid{grid-template-columns:1fr}
  .ribbon{padding:8px 10px}
  .ribbon-icon{font-size:16px}
  .ribbon-text{font-size:10px}
  .table-toolbar{padding:8px 10px;gap:6px}
  .search-box{font-size:13px;padding:10px 12px;min-height:44px}
  .filter-select{font-size:12px;padding:10px 10px;min-height:44px}
  .section-title{font-size:13px}
  th{padding:8px 8px;font-size:9px}
  td{padding:8px 8px;font-size:11px}
  .badge{font-size:9px;padding:2px 6px}
  .page-btn{padding:8px 12px;min-width:38px;min-height:38px;font-size:11px}
  .nav-btn{padding:10px 12px;min-height:44px}
  .pagination{padding:8px 10px}
  /* dc specific */
  #dc-kpi-strip{grid-template-columns:repeat(2,1fr)!important;gap:8px!important}
  .col-toggle{padding:6px 8px;font-size:10px;min-height:36px}
  /* hide secondary topbar info on very small */
  #dc-table{min-width:700px}
}

/* ===== PRICE DISCOVERY ===== */
.price-card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;position:relative;overflow:hidden;transition:all .2s}
.price-card:hover{border-color:var(--border2);transform:translateY(-2px)}
.price-bar-wrap{height:8px;background:var(--bg3);border-radius:4px;margin:8px 0;overflow:hidden}
.price-bar-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,var(--accent),var(--green));transition:width .6s ease}
/* ===== DELIVERY GAP ===== */
.gap-clock-item{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(30,45,74,.4)}
.gap-clock-item:last-child{border-bottom:none}
.gap-years{font-size:20px;font-weight:800;min-width:54px;text-align:right;flex-shrink:0}
.gap-method{font-size:12px;font-weight:600;color:var(--text1)}
.gap-rate{font-size:11px;color:var(--text3)}
/* ===== CROSS REGISTRY ===== */
.cr-card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:18px;transition:all .2s}
.cr-card:hover{border-color:var(--border2);box-shadow:var(--glow)}
.cr-card.multi{border-color:rgba(139,92,246,.35);background:linear-gradient(135deg,rgba(139,92,246,.04),var(--card))}
.cr-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px;gap:8px}
.cr-name{font-size:14px;font-weight:700;color:var(--text1)}
.cr-country{font-size:11px;color:var(--text3)}
.cr-registries{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
.cr-reg-badge{font-size:10px;font-weight:700;padding:2px 8px;border-radius:5px;text-transform:uppercase;letter-spacing:.5px}
.cr-stat-row{display:flex;gap:16px;flex-wrap:wrap;margin-top:8px;padding-top:8px;border-top:1px solid var(--border)}
.cr-stat{font-size:11px;color:var(--text3)}
.cr-stat strong{color:var(--text1);font-weight:600}
/* ===== GEOGRAPHY ===== */
.geo-country-row{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;transition:background .15s}
.geo-country-row:hover{background:var(--card2)}
.geo-bar{height:6px;border-radius:3px;background:var(--accent);flex-shrink:0}
/* ===== SPARKLINES ===== */
.kpi-sparkline{margin-top:8px;height:32px;position:relative}
.sparkline-svg{width:100%;height:32px;overflow:visible}
/* ===== LAST UPDATED BADGE ===== */
.updated-badge{display:inline-flex;align-items:center;gap:5px;font-size:10px;color:var(--text3);background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:3px 8px;margin-top:4px}
.updated-dot{width:5px;height:5px;border-radius:50%;background:var(--green);flex-shrink:0}
/* ===== CSV UPLOAD ===== */
#csv-dropzone.drag-over{border-color:var(--accent);background:rgba(0,212,255,.05)}
/* ===== RIBBON ===== */
.ribbon{display:flex;align-items:center;gap:12px;background:rgba(0,212,255,.06);border:1px solid rgba(0,212,255,.2);border-radius:12px;padding:12px 16px;margin-bottom:20px;flex-wrap:wrap}
.ribbon-icon{font-size:20px;flex-shrink:0}
.ribbon-text{font-size:12px;color:var(--text2);line-height:1.5;flex:1}
/* ===== PRICE SECTION IN CDR.fyi ===== */
.price-discovery-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin-bottom:20px}
@media(max-width:900px){
  .price-discovery-grid{grid-template-columns:1fr 1fr}
  #cr-grid{grid-template-columns:1fr}
}
@media(max-width:600px){
  .price-discovery-grid{grid-template-columns:1fr}
}

</style>
</head>
<body>

<!-- HAMBURGER BUTTON -->
<button id="hamburger" onclick="toggleSidebar()" aria-label="Menu">
  <span></span><span></span><span></span>
</button>
<!-- SIDEBAR OVERLAY -->
<div id="sidebar-overlay" onclick="closeSidebar()"></div>

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
      <button class="nav-btn" onclick="showPage('deliverygap')"><span class="icon">⚠️</span><span>Delivery Gap</span><span class="nav-badge" style="background:#ef4444;">!</span></button>
      <button class="nav-btn" onclick="showPage('geography')"><span class="icon">🌍</span><span>Geography</span></button>
      <button class="nav-btn" onclick="showPage('crossregistry')"><span class="icon">🔗</span><span>Cross-Registry</span></button>
    </div>
    <div class="nav-section">
      <div class="nav-label">Other Registries</div>
      <button class="nav-btn" onclick="showPage('rainbow')"><span class="icon">🌈</span><span>Rainbow Standard</span><span class="nav-badge" style="background:var(--purple)">115</span></button>
      <button class="nav-btn" onclick="showPage('isometric')"><span class="icon">⚖️</span><span>Isometric</span><span class="nav-badge" style="background:var(--pink)">305</span></button>
    </div>
    <div class="nav-section">
      <div class="nav-label">Tools</div>
      <button class="nav-btn" onclick="showPage('datacontrol')"><span class="icon">🗄️</span><span>Data Control</span></button>
      <button class="nav-btn" onclick="showPage('csvupload')"><span class="icon">📤</span><span>Update Rainbow CSV</span></button>
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
      <div class="table-scroll-wrap" id="tx-scroll">
        <div class="scroll-hint">← scorri per vedere più colonne →</div>
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
      <div class="table-scroll-wrap" id="proj-scroll">
        <div class="scroll-hint">← scorri per vedere più colonne →</div>
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
      <div class="table-scroll-wrap" id="rb-scroll">
        <div class="scroll-hint">← scorri per vedere più colonne →</div>
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
      <div class="table-scroll-wrap" id="iso-scroll">
        <div class="scroll-hint">← scorri per vedere più colonne →</div>
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
      <div class="table-scroll-wrap" style="max-height:65vh;overflow-y:auto;" id="dc-table-wrap">
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
  
  <!-- DELIVERY GAP PAGE -->
  <div class="page" id="page-deliverygap">
    <div class="ribbon" style="background:linear-gradient(135deg,rgba(239,68,68,.1),rgba(245,158,11,.05));border-color:rgba(239,68,68,.3);">
      <div class="ribbon-icon">⚠️</div>
      <div class="ribbon-text"><strong style="color:#ef4444;">Delivery Gap Analysis</strong> · Only <strong style="color:var(--amber);">5.4%</strong> of contracted CDR has been physically delivered · BECCS and DACCS have near-zero delivery rates · Data source: CDR.fyi 5,498 transactions</div>
    </div>
    <!-- KPI strip -->
    <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:20px;" class="kpi-grid" id="dg-kpi-strip">
      <div class="kpi-card"><div class="kpi-label">Total Contracted</div><div class="kpi-value accent" id="dg-contracted">—</div><div class="kpi-sub">tCO₂ promised</div><div class="kpi-icon">📋</div></div>
      <div class="kpi-card"><div class="kpi-label">Total Delivered</div><div class="kpi-value green" id="dg-delivered">—</div><div class="kpi-sub">tCO₂ physically removed</div><div class="kpi-icon">✅</div></div>
      <div class="kpi-card"><div class="kpi-label">Delivery Gap</div><div class="kpi-value" style="color:#ef4444;" id="dg-gap">—</div><div class="kpi-sub">tCO₂ never delivered</div><div class="kpi-icon">❌</div></div>
      <div class="kpi-card"><div class="kpi-label">Overall Rate</div><div class="kpi-value amber" id="dg-rate">—</div><div class="kpi-sub">delivered / total</div><div class="kpi-icon">📊</div></div>
      <div class="kpi-card"><div class="kpi-label">Best Performer</div><div class="kpi-value green" style="font-size:14px;" id="dg-best">—</div><div class="kpi-sub">highest delivery rate</div><div class="kpi-icon">🏆</div></div>
      <div class="kpi-card"><div class="kpi-label">At Risk</div><div class="kpi-value" style="color:#ef4444;font-size:14px;" id="dg-atrisk">—</div><div class="kpi-sub">methods &lt;2% delivery</div><div class="kpi-icon">🔴</div></div>
    </div>
    <!-- Microsoft warning -->
    <div id="ms-warning" style="background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.3);border-radius:12px;padding:14px 18px;margin-bottom:20px;display:flex;align-items:flex-start;gap:12px;">
      <div style="font-size:22px;flex-shrink:0;">⚠️</div>
      <div>
        <div style="font-size:13px;font-weight:700;color:var(--amber);margin-bottom:4px;">Market Concentration Alert — HHI: 6,368 (Highly Concentrated)</div>
        <div style="font-size:12px;color:var(--text2);line-height:1.6;">
          <strong style="color:var(--text1);">Microsoft</strong> has purchased <strong style="color:var(--amber);">79.5%</strong> of all CDR.fyi volume (30.9M tCO₂ of 38.8M total). 
          The top 3 buyers control <strong style="color:var(--amber);">87.2%</strong> and the top 10 control <strong style="color:var(--amber);">94.6%</strong>. 
          This extreme concentration (HHI 6,368 vs. competitive threshold of 1,500) means the market growth figures reflect primarily one company's purchasing decisions, not broad market adoption.
          An HHI above 2,500 is classified as a highly concentrated market by antitrust standards.
        </div>
      </div>
    </div>
    <div class="charts-grid">
      <div class="chart-card" style="grid-column:1/-1;">
        <div class="chart-title">Contracted vs. Delivered by Technology (tCO₂e)</div>
        <div class="chart-sub">Stacked view — the gap between contracted and delivered represents carbon that was promised but not yet removed</div>
        <div class="chart-wrap tall"><canvas id="dgStackedChart"></canvas></div>
      </div>
    </div>
    <div class="charts-grid">
      <div class="chart-card">
        <div class="chart-title">Delivery Rate by Technology (%)</div>
        <div class="chart-sub">Percentage of contracted volume that has been physically delivered</div>
        <div class="chart-wrap"><canvas id="dgRateChart"></canvas></div>
      </div>
      <div class="chart-card">
        <div class="chart-title">Gap Clock — Years to Close at Current Rate</div>
        <div class="chart-sub">At current delivery pace, how many years to fulfill existing contracts</div>
        <div id="dg-gap-clock" style="padding:12px 0;"></div>
      </div>
    </div>
    <!-- Buyer concentration -->
    <div class="section-header" style="margin-top:8px;">
      <div><div class="section-title">🏢 Buyer Concentration — Top 20 Purchasers</div><div class="section-sub">CDR.fyi volume by purchaser · HHI index measures market concentration</div></div>
    </div>
    <div class="charts-grid">
      <div class="chart-card">
        <div class="chart-title">Volume Share — Top 15 Buyers</div>
        <div class="chart-sub">Horizontal bar · tCO₂ purchased · 518 unique buyers total</div>
        <div class="chart-wrap tall"><canvas id="dgBuyerChart"></canvas></div>
      </div>
      <div class="chart-card">
        <div style="display:flex;flex-direction:column;gap:12px;padding:4px 0;" id="dg-buyer-table"></div>
      </div>
    </div>
    <!-- YoY Growth -->
    <div class="section-header" style="margin-top:8px;">
      <div><div class="section-title">📈 CDR Market Growth 2019–2025</div><div class="section-sub">Annual transaction volume and year-over-year growth rate</div></div>
    </div>
    <div class="charts-grid">
      <div class="chart-card" style="grid-column:1/-1;">
        <div class="chart-title">Annual CDR Volume (tCO₂e) with YoY Growth %</div>
        <div class="chart-sub">Bar = volume · Line = year-over-year growth percentage</div>
        <div class="chart-wrap tall"><canvas id="dgTimelineChart"></canvas></div>
      </div>
    </div>
  </div>

  <!-- GEOGRAPHY PAGE -->
  <div class="page" id="page-geography">
    <div class="ribbon" style="background:linear-gradient(135deg,rgba(16,185,129,.08),rgba(0,212,255,.05));border-color:rgba(16,185,129,.25);">
      <div class="ribbon-icon">🌍</div>
      <div class="ribbon-text"><strong style="color:var(--green);">Geographic Distribution</strong> · Where CDR is being produced and registered across 4 registries · Supply-side geography</div>
    </div>
    <div class="charts-grid">
      <div class="chart-card">
        <div class="chart-title">CDR.fyi — Supplier Countries by Committed Volume</div>
        <div class="chart-sub">Top supplier nations by total contracted tCO₂e</div>
        <div class="chart-wrap tall"><canvas id="geoSupplierChart"></canvas></div>
      </div>
      <div class="chart-card">
        <div class="chart-title">Puro.earth — Projects by Country</div>
        <div class="chart-sub">Number of registered projects per country</div>
        <div class="chart-wrap tall"><canvas id="geoPuroChart"></canvas></div>
      </div>
    </div>
    <div class="charts-grid">
      <div class="chart-card">
        <div class="chart-title">Rainbow Standard — Projects by Country</div>
        <div class="chart-sub">Rainbow projects per country · 25 countries covered</div>
        <div class="chart-wrap tall"><canvas id="geoRainbowChart"></canvas></div>
      </div>
      <div class="chart-card">
        <div class="chart-title">Cross-Registry Country Overlap</div>
        <div class="chart-sub">Countries present in multiple registries</div>
        <div id="geo-overlap-table" style="padding:4px 0;overflow-y:auto;max-height:260px;"></div>
      </div>
    </div>
    <!-- World heatmap SVG -->
    <div class="chart-card" style="margin-top:0;">
      <div class="chart-title">🗺 Global CDR Activity Heatmap</div>
      <div class="chart-sub">Country score = sum of (supplier count×3) + (Puro projects×2) + Rainbow projects · Circle size proportional to activity</div>
      <div id="geo-world-map" style="position:relative;width:100%;background:var(--bg3);border-radius:10px;overflow:hidden;margin-top:12px;min-height:340px;"></div>
    </div>
  </div>

  <!-- CROSS-REGISTRY SUPPLIER PAGE -->
  <div class="page" id="page-crossregistry">
    <div class="ribbon" style="background:linear-gradient(135deg,rgba(139,92,246,.08),rgba(0,212,255,.05));border-color:rgba(139,92,246,.25);">
      <div class="ribbon-icon">🔗</div>
      <div class="ribbon-text"><strong style="color:var(--purple);">Cross-Registry Supplier Profiles</strong> · Fuzzy-matched suppliers appearing across CDR.fyi, Puro.earth and Rainbow Standard · 24 multi-registry suppliers identified out of 50 total</div>
    </div>
    <!-- Search + filter -->
    <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;">
      <input type="text" id="cr-search" placeholder="🔍 Search supplier…" oninput="filterCR()" style="flex:1;min-width:200px;background:var(--card);border:1px solid var(--border2);border-radius:8px;padding:9px 14px;color:var(--text1);font-size:13px;outline:none;">
      <select id="cr-filter" onchange="filterCR()" class="filter-select">
        <option value="">All Suppliers</option>
        <option value="multi">Multi-Registry Only</option>
        <option value="cdrfyi">CDR.fyi Only</option>
      </select>
      <select id="cr-method" onchange="filterCR()" class="filter-select">
        <option value="">All Methods</option>
        <option value="Biochar">Biochar</option>
        <option value="BECCS">BECCS</option>
        <option value="DACCS">DACCS</option>
        <option value="Enhanced Weathering">Enhanced Weathering</option>
        <option value="Biomass Storage">Biomass Storage</option>
        <option value="Mineralization">Mineralization</option>
      </select>
      <span id="cr-count" style="font-size:12px;color:var(--text3);padding:9px 0;"></span>
    </div>
    <div id="cr-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:16px;"></div>
  </div>

  <!-- CSV UPLOAD PAGE -->
  <div class="page" id="page-csvupload">
    <div class="ribbon" style="background:linear-gradient(135deg,rgba(139,92,246,.08),rgba(0,212,255,.05));border-color:rgba(139,92,246,.25);">
      <div class="ribbon-icon">📤</div>
      <div class="ribbon-text"><strong style="color:var(--purple);">Update Rainbow Standard Data</strong> · Upload the official CSV export from registry.rainbowstandard.io to refresh the Rainbow dataset without redeployment</div>
    </div>
    <div style="max-width:720px;margin:0 auto;">
      <div class="chart-card" style="margin-bottom:20px;">
        <div class="chart-title" style="margin-bottom:8px;">How to export Rainbow CSV</div>
        <ol style="font-size:13px;color:var(--text2);line-height:2;padding-left:20px;">
          <li>Go to <a href="https://registry.rainbowstandard.io" target="_blank" style="color:var(--accent);">registry.rainbowstandard.io</a></li>
          <li>Navigate to the Projects section</li>
          <li>Click <strong style="color:var(--text1);">"Export CSV"</strong> button (top right)</li>
          <li>Save the downloaded file</li>
          <li>Drag & drop or select it below</li>
        </ol>
        <div style="margin-top:12px;background:rgba(0,212,255,.06);border:1px solid rgba(0,212,255,.2);border-radius:8px;padding:10px 14px;font-size:12px;color:var(--text3);">
          ℹ️ The platform parses the CSV entirely in your browser — no data is sent to any server. The JSON is stored only in your session until page reload.
        </div>
      </div>
      <!-- Drop zone -->
      <div id="csv-dropzone" style="border:2px dashed var(--border2);border-radius:14px;padding:48px 24px;text-align:center;cursor:pointer;transition:all .2s;background:var(--card);" ondragover="event.preventDefault();this.style.borderColor='var(--accent)'" ondragleave="this.style.borderColor='var(--border2)'" ondrop="handleCSVDrop(event)">
        <div style="font-size:48px;margin-bottom:12px;">📂</div>
        <div style="font-size:15px;font-weight:700;color:var(--text1);margin-bottom:6px;">Drop Rainbow CSV here</div>
        <div style="font-size:12px;color:var(--text3);margin-bottom:16px;">or click to browse</div>
        <input type="file" id="csv-file-input" accept=".csv" style="display:none;" onchange="handleCSVFile(this.files[0])">
        <button onclick="document.getElementById('csv-file-input').click()" style="background:rgba(0,212,255,.12);border:1px solid rgba(0,212,255,.3);color:var(--accent);padding:10px 24px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;">Select File</button>
      </div>
      <div id="csv-status" style="margin-top:16px;"></div>
      <div id="csv-preview" style="margin-top:16px;"></div>
    </div>
  </div>


</div>

<script>
var DATA=null,txFiltered=[],txPage=1,TX_PER_PAGE=50,projFiltered=[],projPage=1,PROJ_PER_PAGE=25,supFiltered=[],supPage=1,SUP_PER_PAGE=18,txSortKey='date',txSortDir=-1,projSortKey='id',projSortDir=1;

// ====================================================
// MOBILE SIDEBAR DRAWER
// ====================================================
function toggleSidebar(){
  var sb=document.getElementById('sidebar');
  var ov=document.getElementById('sidebar-overlay');
  var hb=document.getElementById('hamburger');
  var open=sb.classList.toggle('open');
  ov.classList.toggle('open',open);
  hb.classList.toggle('open',open);
  document.body.style.overflow=open?'hidden':'';
}
function closeSidebar(){
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
  document.getElementById('hamburger').classList.remove('open');
  document.body.style.overflow='';
}
// Close sidebar when a nav button is clicked on mobile
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.nav-btn').forEach(function(btn){
    btn.addEventListener('click',function(){
      if(window.innerWidth<=900)closeSidebar();
    });
  });
  // Init scroll-hint visibility on all table wrappers
  document.querySelectorAll('.table-scroll-wrap').forEach(function(el){
    checkScrollHint(el);
    el.addEventListener('scroll',function(){checkScrollHint(el);},{passive:true});
  });
  // Close sidebar on ESC
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape')closeSidebar();
  });
  // Handle resize: if desktop, always show sidebar, remove overlay
  window.addEventListener('resize',function(){
    if(window.innerWidth>900){
      document.getElementById('sidebar').classList.remove('open');
      document.getElementById('sidebar-overlay').classList.remove('open');
      document.getElementById('hamburger').classList.remove('open');
      document.body.style.overflow='';
    }
  });
});

function checkScrollHint(el){
  // Show gradient fade if content is wider than container
  if(el.scrollWidth>el.clientWidth+4){
    el.classList.add('has-scroll');
  } else {
    el.classList.remove('has-scroll');
  }
}

async function loadData(){
  try{
    var r=await fetch('/static/cdr_data.json');
    DATA=await r.json();
    initApp();
  }catch(e){console.error('Failed to load data',e);}
}

function initApp(){
  renderDashboard();
  injectMicrosoftWarning();
  injectPriceDiscovery();
  renderSparklines();
  renderLastUpdatedBadge();
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
  deliverygap:{title:'Delivery Gap Analysis',sub:'Contracted vs. Delivered · 5.4% overall delivery rate · BECCS 0% · Biochar 54%'},
  geography:{title:'Geographic Distribution',sub:'Global CDR supply-side heatmap · 20 CDR.fyi · 28 Puro · 25 Rainbow countries'},
  crossregistry:{title:'Cross-Registry Supplier Profiles',sub:'50 suppliers profiled · 24 cross-registry matches · Puro + Rainbow'},
  rainbow:{title:'Rainbow Standard Registry',sub:'115 projects · Biomass Carbon Removal, Biobased Construction, Biogas · 25 countries'},
  isometric:{title:'Isometric Registry',sub:'305 issuances · 99,731 credits · 17 certified protocols'},
  datacontrol:{title:'Data Control Center',sub:'Unified CDR data · All registries · Filter · Export · Track updates'},
  csvupload:{title:'Update Rainbow CSV',sub:'Upload official Rainbow Standard CSV export to refresh data'}
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
  // scroll to top on mobile when switching page
  if(window.innerWidth<=900)window.scrollTo({top:0,behavior:'smooth'});
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
    else if(id==='deliverygap')renderDeliveryGap();
    else if(id==='geography')renderGeography();
    else if(id==='crossregistry')renderCrossRegistry();
  }
  // re-check scroll hints after page switch
  setTimeout(function(){
    document.querySelectorAll('.table-scroll-wrap').forEach(function(el){checkScrollHint(el);});
  },100);
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


// ============================================================
// HELPER: format numbers (fmtShort/fmtNum defined earlier)
// ============================================================
function fmtPct(n){if(!n&&n!==0)return'—';return n.toFixed(1)+'%';}

// ============================================================
// PRICE DISCOVERY — injected into CDR.fyi transactions page
// ============================================================
function renderPriceDiscovery(){
  if(!DATA||!DATA.priceDiscovery)return;
  var pd=DATA.priceDiscovery;
  var container=document.getElementById('price-discovery-content')||document.getElementById('price-discovery-section');
  if(!container)return;
  var methods=Object.keys(pd).sort(function(a,b){return pd[b].avg-pd[a].avg;});
  var maxAvg=Math.max.apply(null,methods.map(function(m){return pd[m].avg;}));
  var methodColors={'Biochar':'#00e5a0','BECCS':'#00d4ff','DACCS':'#8b5cf6','Enhanced Weathering':'#f59e0b','Mineralization':'#ec4899','Ocean Alkalinity':'#06b6d4','Ocean Removal':'#10b981','Biomass Storage':'#f97316'};
  var html='<div class="price-discovery-grid">';
  methods.forEach(function(m){
    var d=pd[m];
    var col=methodColors[m]||'#94a3b8';
    var barW=Math.round(d.avg/maxAvg*100);
    html+='<div class="price-card">'+
      '<div style="font-size:10px;font-weight:700;color:'+col+';text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;">'+m+'</div>'+
      '<div style="font-size:26px;font-weight:800;color:var(--text1);">$'+Math.round(d.avg)+'</div>'+
      '<div style="font-size:10px;color:var(--text3);margin-bottom:4px;">avg / tCO₂e · n='+d.n+' supplier'+(d.n>1?'s':'')+'</div>'+
      '<div class="price-bar-wrap"><div class="price-bar-fill" style="width:'+barW+'%;background:'+col+';opacity:.7;"></div></div>'+
      '<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text3);">'+
        '<span>Min $'+d.min+'</span><span>Max $'+d.max+'</span>'+
      '</div>'+
    '</div>';
  });
  html+='</div>';
  // Top priced suppliers table
  html+='<div class="table-wrap" style="margin-top:0;"><table style="width:100%"><thead><tr>'+
    '<th>Supplier</th><th>Method</th><th>Country</th><th style="text-align:right">Price ($/tCO₂)</th><th style="text-align:right">Committed (t)</th>'+
    '</tr></thead><tbody>';
  var allSuppliers=[];
  methods.forEach(function(m){if(pd[m].suppliers)pd[m].suppliers.forEach(function(s){allSuppliers.push({...s,method:m});});});
  allSuppliers.sort(function(a,b){return b.price-a.price;}).slice(0,15).forEach(function(s){
    var col=methodColors[s.method]||'#94a3b8';
    html+='<tr><td class="td-bold">'+s.supplier+'</td>'+
      '<td><span class="badge" style="background:'+col+'22;color:'+col+';border:1px solid '+col+'44;">'+s.method+'</span></td>'+
      '<td>'+s.country+'</td>'+
      '<td style="text-align:right;font-weight:700;color:var(--accent);">$'+s.price+'</td>'+
      '<td style="text-align:right;">'+fmtShort(s.committed)+'</td></tr>';
  });
  html+='</tbody></table></div>';
  container.innerHTML=html;
}

// ============================================================
// DELIVERY GAP PAGE
// ============================================================
function renderDeliveryGap(){
  if(!DATA)return;
  var dg=DATA.deliveryGap||{};
  var bc=DATA.buyerConcentration||{};
  var tl=DATA.timeline||[];
  var methodOrder=['BECCS','DACCS','Biomass Storage','Enhanced Weathering','Mineralization','Ocean Alkalinity','Ocean Removal','Biochar','Other'];
  var methodColors={'Biochar':'#00e5a0','BECCS':'#00d4ff','DACCS':'#8b5cf6','Enhanced Weathering':'#f59e0b','Mineralization':'#ec4899','Ocean Alkalinity':'#06b6d4','Ocean Removal':'#10b981','Biomass Storage':'#f97316','Other':'#94a3b8'};

  // KPIs
  var totalContr=0,totalDel=0;
  var bestMethod='',bestRate=0,atRisk=0;
  Object.keys(dg).forEach(function(m){
    var d=dg[m];
    totalContr+=d.contracted;
    totalDel+=d.delivered+d.partial;
    if(d.deliveryRate>bestRate&&m!=='Other'){bestRate=d.deliveryRate;bestMethod=m;}
    if(d.deliveryRate<2&&d.total>100000)atRisk++;
  });
  var overallRate=totalContr>0?(totalDel/totalContr*100):0;
  var el=function(id,v){var e=document.getElementById(id);if(e)e.textContent=v;};
  el('dg-contracted',fmtShort(totalContr));
  el('dg-delivered',fmtShort(totalDel));
  el('dg-gap',fmtShort(totalContr-totalDel));
  el('dg-rate',overallRate.toFixed(1)+'%');
  el('dg-best',bestMethod+' '+bestRate.toFixed(0)+'%');
  el('dg-atrisk',atRisk+' methods');

  // Stacked bar chart: contracted vs delivered
  var labels=methodOrder.filter(function(m){return dg[m]&&dg[m].total>10000;});
  new Chart(document.getElementById('dgStackedChart'),{
    type:'bar',
    data:{
      labels:labels,
      datasets:[
        {label:'Contracted',data:labels.map(function(m){return dg[m]?dg[m].contracted:0;}),backgroundColor:labels.map(function(m){var c=methodColors[m]||'#94a3b8';return c+'66';}),borderColor:labels.map(function(m){return methodColors[m]||'#94a3b8';}),borderWidth:1,borderRadius:4},
        {label:'Delivered',data:labels.map(function(m){return dg[m]?(dg[m].delivered+dg[m].partial):0;}),backgroundColor:labels.map(function(m){return methodColors[m]||'#94a3b8';}),borderRadius:4}
      ]
    },
    options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,
      plugins:{legend:{labels:{color:'#8fa8cc',font:{size:11}}},
        tooltip:{callbacks:{label:function(ctx){return ' '+ctx.dataset.label+': '+fmtNum(ctx.raw)+' tCO₂';}}}},
      scales:{
        x:{stacked:false,grid:{color:'rgba(30,45,74,.5)'},ticks:{color:'#5a7399',font:{size:10},callback:function(v){return fmtShort(v);}},border:{display:false}},
        y:{grid:{display:false},ticks:{color:'#8fa8cc',font:{size:10}},border:{display:false}}
      }}
  });

  // Delivery rate bar chart
  var rateLabels=labels.slice().sort(function(a,b){return (dg[b]?dg[b].deliveryRate:0)-(dg[a]?dg[a].deliveryRate:0);});
  new Chart(document.getElementById('dgRateChart'),{
    type:'bar',
    data:{
      labels:rateLabels,
      datasets:[{
        label:'Delivery Rate %',
        data:rateLabels.map(function(m){return dg[m]?dg[m].deliveryRate:0;}),
        backgroundColor:rateLabels.map(function(m){var r=dg[m]?dg[m].deliveryRate:0;return r<2?'#ef444488':r<10?'#f59e0b88':'#00e5a088';}),
        borderColor:rateLabels.map(function(m){var r=dg[m]?dg[m].deliveryRate:0;return r<2?'#ef4444':r<10?'#f59e0b':'#00e5a0';}),
        borderWidth:1,borderRadius:4
      }]
    },
    options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return ' '+ctx.raw.toFixed(1)+'% delivery rate';}}}},
      scales:{
        x:{max:100,grid:{color:'rgba(30,45,74,.5)'},ticks:{color:'#5a7399',font:{size:10},callback:function(v){return v+'%';}},border:{display:false}},
        y:{grid:{display:false},ticks:{color:'#8fa8cc',font:{size:10}},border:{display:false}}
      }}
  });

  // Gap clock
  var clockEl=document.getElementById('dg-gap-clock');
  if(clockEl){
    // Calculate annual delivery rate from timeline
    var recent=tl.slice(-3);
    var annualDel=recent.length>0?recent.reduce(function(s,t){return s+(t.vol||0);},0)/recent.length:0;
    // Annual delivery fraction ~ based on delivered ratio historically
    var delFraction=totalContr>0?totalDel/totalContr:0;
    var annualActualDel=annualDel*delFraction;
    var html='';
    var clockMethods=labels.filter(function(m){return dg[m]&&dg[m].contracted>50000;}).sort(function(a,b){return dg[b].contracted-dg[a].contracted;});
    clockMethods.forEach(function(m){
      var d=dg[m];
      var gap=Math.max(0,d.contracted-d.delivered-d.partial);
      // Annual delivery = total delivered over ~6 years of CDR.fyi data (2019-2025)
      var totalDelivered=d.delivered+d.partial;
      var annualDelForMethod=totalDelivered>0?totalDelivered/6:0;
      var years=annualDelForMethod>0?Math.round(gap/annualDelForMethod):999;
      var col=methodColors[m]||'#94a3b8';
      var yearsDisplay=years>200?'∞':years>50?'50+':years.toString();
      var yearsCol=years>50?'#ef4444':years>20?'#f59e0b':'#00e5a0';
      html+='<div class="gap-clock-item">'+
        '<div class="gap-years" style="color:'+yearsCol+'">'+yearsDisplay+'y</div>'+
        '<div style="flex:1;">'+
          '<div class="gap-method">'+m+'</div>'+
          '<div class="gap-rate">Gap: '+fmtShort(gap)+' tCO₂ · Rate: '+d.deliveryRate.toFixed(1)+'%</div>'+
        '</div>'+
        '<div style="width:36px;height:36px;border-radius:50%;border:3px solid '+col+'33;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:'+col+';">'+d.deliveryRate.toFixed(0)+'%</div>'+
      '</div>';
    });
    clockEl.innerHTML=html||'<div style="color:var(--text3);font-size:12px;padding:20px;text-align:center;">No significant gap data</div>';
  }

  // Buyer chart
  var buyers=bc.topBuyers||[];
  var buyerLabels=buyers.slice(0,12).map(function(b){return b.name.length>22?b.name.slice(0,22)+'…':b.name;});
  var buyerVols=buyers.slice(0,12).map(function(b){return b.volume;});
  var buyerColors=buyerVols.map(function(v,i){return i===0?'#00d4ff88':i<3?'#f59e0b88':'#8b5cf688';});
  var buyerBorders=buyerVols.map(function(v,i){return i===0?'#00d4ff':i<3?'#f59e0b':'#8b5cf6';});
  new Chart(document.getElementById('dgBuyerChart'),{
    type:'bar',
    data:{labels:buyerLabels,datasets:[{label:'Volume tCO₂',data:buyerVols,backgroundColor:buyerColors,borderColor:buyerBorders,borderWidth:1,borderRadius:4}]},
    options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return ' '+fmtNum(ctx.raw)+' tCO₂ ('+buyers[ctx.dataIndex].pct+'%)';}}}},
      scales:{x:{grid:{color:'rgba(30,45,74,.5)'},ticks:{color:'#5a7399',font:{size:10},callback:function(v){return fmtShort(v);}},border:{display:false}},y:{grid:{display:false},ticks:{color:'#8fa8cc',font:{size:10}},border:{display:false}}}}
  });

  // Buyer table cards
  var btEl=document.getElementById('dg-buyer-table');
  if(btEl){
    var bhtml='<div style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Top Buyers Ranked by Volume</div>';
    bhtml+='<div style="background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.25);border-radius:8px;padding:10px 12px;margin-bottom:10px;font-size:12px;color:var(--text2);">'+
      '<span style="color:var(--amber);font-weight:700;">HHI Index: '+bc.hhi+'</span> — Highly Concentrated Market<br>'+
      '<span style="color:var(--text3);">HHI &gt; 2,500 = highly concentrated · &gt; 1,500 = concentrated · &lt; 1,500 = competitive</span></div>';
    buyers.slice(0,10).forEach(function(b,i){
      var col=i===0?'#00d4ff':i<3?'#f59e0b':'#8fa8cc';
      var barW=Math.round(b.pct);
      bhtml+='<div style="margin-bottom:8px;">'+
        '<div style="display:flex;justify-content:space-between;margin-bottom:3px;">'+
          '<span style="font-size:12px;font-weight:600;color:var(--text1);">'+(i+1)+'. '+b.name+'</span>'+
          '<span style="font-size:11px;color:'+col+';font-weight:700;">'+b.pct+'%</span>'+
        '</div>'+
        '<div style="height:5px;background:var(--bg3);border-radius:3px;overflow:hidden;">'+
          '<div style="height:100%;width:'+Math.min(barW,100)+'%;background:'+col+';border-radius:3px;"></div>'+
        '</div>'+
        '<div style="font-size:10px;color:var(--text3);margin-top:2px;">'+fmtShort(b.volume)+' tCO₂ · '+b.tx+' transactions</div>'+
      '</div>';
    });
    btEl.innerHTML=bhtml;
  }

  // Timeline chart (bar+line combo)
  var tlYears=tl.map(function(t){return t.year;});
  var tlVols=tl.map(function(t){return t.vol;});
  var tlYoy=tl.map(function(t){return t.yoy;});
  new Chart(document.getElementById('dgTimelineChart'),{
    type:'bar',
    data:{
      labels:tlYears,
      datasets:[
        {type:'bar',label:'Volume (tCO₂)',data:tlVols,backgroundColor:'#00d4ff44',borderColor:'#00d4ff',borderWidth:1,borderRadius:4,yAxisID:'y'},
        {type:'line',label:'YoY Growth %',data:tlYoy,borderColor:'#f59e0b',backgroundColor:'transparent',borderWidth:2,pointBackgroundColor:'#f59e0b',pointRadius:4,tension:.3,yAxisID:'y2',spanGaps:true}
      ]
    },
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{labels:{color:'#8fa8cc',font:{size:11}}},
        tooltip:{callbacks:{label:function(ctx){return ctx.dataset.yAxisID==='y2'?' YoY: '+(ctx.raw!=null?ctx.raw+'%':'base'):' Volume: '+fmtShort(ctx.raw)+' tCO₂';}}}},  
      scales:{
        x:{grid:{color:'rgba(30,45,74,.5)'},ticks:{color:'#8fa8cc',font:{size:11}},border:{display:false}},
        y:{position:'left',grid:{color:'rgba(30,45,74,.5)'},ticks:{color:'#5a7399',font:{size:10},callback:function(v){return fmtShort(v);}},border:{display:false}},
        y2:{position:'right',grid:{display:false},ticks:{color:'#f59e0b',font:{size:10},callback:function(v){return v!=null?v+'%':'';}},border:{display:false}}
      }}
  });
}

// ============================================================
// GEOGRAPHY PAGE
// ============================================================
function renderGeography(){
  if(!DATA)return;
  var geo=DATA.geographic||{};
  var chartOpts=function(label,col){return {indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return ' '+fmtNum(ctx.raw)+' '+label;}}}},scales:{x:{grid:{color:'rgba(30,45,74,.5)'},ticks:{color:'#5a7399',font:{size:10},callback:function(v){return fmtShort(v);}},border:{display:false}},y:{grid:{display:false},ticks:{color:'#8fa8cc',font:{size:10}},border:{display:false}}}};};

  // CDR.fyi supplier chart
  var cdrGeo=geo.cdrfyi||{};
  var cdrSorted=Object.keys(cdrGeo).sort(function(a,b){return cdrGeo[b].committed-cdrGeo[a].committed;}).slice(0,15);
  new Chart(document.getElementById('geoSupplierChart'),{type:'bar',
    data:{labels:cdrSorted,datasets:[{label:'Committed tCO₂',data:cdrSorted.map(function(c){return cdrGeo[c].committed;}),backgroundColor:'#00d4ff55',borderColor:'#00d4ff',borderWidth:1,borderRadius:4}]},
    options:chartOpts('tCO₂ committed','#00d4ff')});

  // Puro chart
  var puroGeo=geo.puro||{};
  var puroSorted=Object.keys(puroGeo).sort(function(a,b){return puroGeo[b].projects-puroGeo[a].projects;}).slice(0,15);
  new Chart(document.getElementById('geoPuroChart'),{type:'bar',
    data:{labels:puroSorted,datasets:[{label:'Projects',data:puroSorted.map(function(c){return puroGeo[c].projects;}),backgroundColor:'#00e5a055',borderColor:'#00e5a0',borderWidth:1,borderRadius:4}]},
    options:chartOpts('projects','#00e5a0')});

  // Rainbow chart
  var rbGeo=geo.rainbow||{};
  var rbSorted=Object.keys(rbGeo).filter(function(c){return c!=='Unknown';}).sort(function(a,b){return rbGeo[b].projects-rbGeo[a].projects;}).slice(0,12);
  new Chart(document.getElementById('geoRainbowChart'),{type:'bar',
    data:{labels:rbSorted,datasets:[{label:'Projects',data:rbSorted.map(function(c){return rbGeo[c].projects;}),backgroundColor:'#8b5cf655',borderColor:'#8b5cf6',borderWidth:1,borderRadius:4}]},
    options:chartOpts('projects','#8b5cf6')});

  // Cross-registry overlap table
  var overlapEl=document.getElementById('geo-overlap-table');
  if(overlapEl){
    var allCountries={};
    Object.keys(cdrGeo).forEach(function(c){if(!allCountries[c])allCountries[c]={cdr:0,puro:0,rainbow:0};allCountries[c].cdr=cdrGeo[c].suppliers||0;});
    Object.keys(puroGeo).forEach(function(c){if(!allCountries[c])allCountries[c]={cdr:0,puro:0,rainbow:0};allCountries[c].puro=puroGeo[c].projects||0;});
    Object.keys(rbGeo).forEach(function(c){if(c==='Unknown')return;if(!allCountries[c])allCountries[c]={cdr:0,puro:0,rainbow:0};allCountries[c].rainbow=rbGeo[c].projects||0;});
    var multiCountries=Object.keys(allCountries).filter(function(c){var d=allCountries[c];return (d.cdr>0)+(d.puro>0)+(d.rainbow>0)>=2;}).sort(function(a,b){var da=allCountries[a],db=allCountries[b];return ((db.cdr>0)+(db.puro>0)+(db.rainbow>0))-((da.cdr>0)+(da.puro>0)+(da.rainbow>0));});
    var ohtml='<div style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Countries in 2+ Registries</div>';
    multiCountries.slice(0,20).forEach(function(c){
      var d=allCountries[c];
      var badges='';
      if(d.cdr>0)badges+='<span style="font-size:9px;background:rgba(0,212,255,.15);color:var(--accent);border:1px solid rgba(0,212,255,.25);padding:1px 6px;border-radius:4px;font-weight:700;">CDR.fyi</span> ';
      if(d.puro>0)badges+='<span style="font-size:9px;background:rgba(0,229,160,.15);color:var(--green);border:1px solid rgba(0,229,160,.25);padding:1px 6px;border-radius:4px;font-weight:700;">Puro</span> ';
      if(d.rainbow>0)badges+='<span style="font-size:9px;background:rgba(139,92,246,.15);color:var(--purple);border:1px solid rgba(139,92,246,.25);padding:1px 6px;border-radius:4px;font-weight:700;">Rainbow</span>';
      ohtml+='<div class="geo-country-row"><div style="font-size:12px;font-weight:600;color:var(--text1);flex:1;">'+c+'</div><div style="display:flex;gap:4px;flex-wrap:wrap;">'+badges+'</div></div>';
    });
    overlapEl.innerHTML=ohtml;
  }

  // World bubble map (SVG-based)
  renderWorldMap();
}

function renderWorldMap(){
  if(!DATA)return;
  var geo=DATA.geographic||{};
  var cdrGeo=geo.cdrfyi||{};
  var puroGeo=geo.puro||{};
  var rbGeo=geo.rainbow||{};

  // Country centroids (lat/lon) for key CDR countries
  var coords={
    'United States':[38,-97],'Bolivia':[-16,-64],'India':[20,77],'Switzerland':[47,8],
    'Brazil':[-14,-51],'Thailand':[13,100],'United Kingdom':[55,-3],'Canada':[56,-106],
    'Germany':[51,10],'Denmark':[56,10],'Finland':[64,26],'Bulgaria':[43,25],
    'Cambodia':[12,105],'Sweden':[62,15],'Netherlands':[52,5],'France':[46,2],
    'Norway':[60,8],'Australia':[-25,133],'Spain':[40,-4],'Belgium':[50,4],
    'Portugal':[39,-8],'South Africa':[-29,25],'Italy':[42,12],'Japan':[36,138],
    'China':[35,105],'South Korea':[37,128],'Ireland':[53,-8],'Austria':[47,14],
    'Poland':[52,20],'Chile':[-30,-71],'Colombia':[4,-72],'Mexico':[23,-102]
  };

  // Score per country
  var scores={};
  Object.keys(cdrGeo).forEach(function(c){if(!scores[c])scores[c]=0;scores[c]+=cdrGeo[c].suppliers*3;});
  Object.keys(puroGeo).forEach(function(c){if(!scores[c])scores[c]=0;scores[c]+=puroGeo[c].projects*2;});
  Object.keys(rbGeo).forEach(function(c){if(c==='Unknown')return;if(!scores[c])scores[c]=0;scores[c]+=rbGeo[c].projects;});

  var maxScore=Math.max.apply(null,Object.values(scores).filter(Boolean));

  // Simple Mercator projection
  function project(lat,lon,W,H){
    var x=(lon+180)/360*W;
    var latRad=lat*Math.PI/180;
    var y=(H/2)-(W/(2*Math.PI))*Math.log(Math.tan(Math.PI/4+latRad/2));
    return [x,y];
  }

  var container=document.getElementById('geo-world-map');
  if(!container)return;
  var W=container.offsetWidth||800,H=340;

  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:'+H+'px;" xmlns="http://www.w3.org/2000/svg">';
  // Ocean background
  svg+='<rect width="'+W+'" height="'+H+'" fill="#0a0f1e"/>';
  // Grid lines
  for(var lat=-60;lat<=80;lat+=30){var py=project(lat,0,W,H)[1];svg+='<line x1="0" y1="'+py+'" x2="'+W+'" y2="'+py+'" stroke="#1e2d4a" stroke-width="1" stroke-dasharray="4,4"/>';}
  for(var lon=-150;lon<=180;lon+=60){var px=project(0,lon,W,H)[0];svg+='<line x1="'+px+'" y1="0" x2="'+px+'" y2="'+H+'" stroke="#1e2d4a" stroke-width="1" stroke-dasharray="4,4"/>';}
  // Lat/lon labels
  svg+='<text x="4" y="'+(project(60,0,W,H)[1]+4)+'" fill="#5a7399" font-size="9">60°N</text>';
  svg+='<text x="4" y="'+(project(30,0,W,H)[1]+4)+'" fill="#5a7399" font-size="9">30°N</text>';
  svg+='<text x="4" y="'+(project(0,0,W,H)[1]+4)+'" fill="#5a7399" font-size="9">EQ</text>';
  svg+='<text x="4" y="'+(project(-30,0,W,H)[1]+4)+'" fill="#5a7399" font-size="9">30°S</text>';

  // Draw bubbles
  var sortedCountries=Object.keys(scores).filter(function(c){return coords[c]&&scores[c]>0;}).sort(function(a,b){return scores[a]-scores[b];}); // draw small first
  sortedCountries.forEach(function(country){
    var score=scores[country];
    var r=Math.max(6,Math.round(Math.sqrt(score/maxScore)*36));
    var ll=coords[country];
    var pt=project(ll[0],ll[1],W,H);
    var px=pt[0],py=pt[1];
    if(px<0||px>W||py<0||py>H)return;
    // Color based on dominant registry
    var hasCDR=cdrGeo[country]&&cdrGeo[country].suppliers>0;
    var hasPuro=puroGeo[country]&&puroGeo[country].projects>0;
    var hasRb=rbGeo[country]&&rbGeo[country].projects>0&&country!=='Unknown';
    var col=hasCDR&&hasPuro?'#f59e0b':hasCDR?'#00d4ff':hasPuro?'#00e5a0':'#8b5cf6';
    svg+='<circle cx="'+px+'" cy="'+py+'" r="'+r+'" fill="'+col+'" opacity="0.35" stroke="'+col+'" stroke-width="1.5"/>';
    svg+='<text x="'+px+'" y="'+(py+3)+'" text-anchor="middle" fill="'+col+'" font-size="9" font-weight="700">'+country.slice(0,3).toUpperCase()+'</text>';
  });

  // Legend
  var lx=W-180,ly=H-80;
  svg+='<rect x="'+(lx-8)+'" y="'+(ly-16)+'" width="176" height="80" fill="#131d32" rx="6" opacity="0.9"/>';
  svg+='<circle cx="'+lx+'" cy="'+ly+'" r="6" fill="#00d4ff" opacity="0.5" stroke="#00d4ff" stroke-width="1.5"/><text x="'+(lx+12)+'" y="'+(ly+4)+'" fill="#8fa8cc" font-size="10">CDR.fyi dominant</text>';
  svg+='<circle cx="'+lx+'" cy="'+(ly+20)+'" r="6" fill="#00e5a0" opacity="0.5" stroke="#00e5a0" stroke-width="1.5"/><text x="'+(lx+12)+'" y="'+(ly+24)+'" fill="#8fa8cc" font-size="10">Puro dominant</text>';
  svg+='<circle cx="'+lx+'" cy="'+(ly+40)+'" r="6" fill="#8b5cf6" opacity="0.5" stroke="#8b5cf6" stroke-width="1.5"/><text x="'+(lx+12)+'" y="'+(ly+44)+'" fill="#8fa8cc" font-size="10">Rainbow dominant</text>';
  svg+='<circle cx="'+lx+'" cy="'+(ly+60)+'" r="6" fill="#f59e0b" opacity="0.5" stroke="#f59e0b" stroke-width="1.5"/><text x="'+(lx+12)+'" y="'+(ly+64)+'" fill="#8fa8cc" font-size="10">Multi-registry</text>';
  svg+='</svg>';
  container.innerHTML=svg;
}

// ============================================================
// CROSS-REGISTRY SUPPLIER PAGE
// ============================================================
var crFiltered=[];
function renderCrossRegistry(){
  if(!DATA||!DATA.crossRegistry)return;
  crFiltered=DATA.crossRegistry.slice();
  filterCR();
}
function filterCR(){
  if(!DATA||!DATA.crossRegistry)return;
  var search=(document.getElementById('cr-search')||{}).value||'';
  var filter=(document.getElementById('cr-filter')||{}).value||'';
  var method=(document.getElementById('cr-method')||{}).value||'';
  var sl=search.toLowerCase();
  crFiltered=DATA.crossRegistry.filter(function(s){
    if(sl&&s.name.toLowerCase().indexOf(sl)===-1)return false;
    if(filter==='multi'&&!s.puro.length&&!s.rainbow.length)return false;
    if(filter==='cdrfyi'&&(s.puro.length>0||s.rainbow.length>0))return false;
    if(method&&s.cdrfyi.canonicalMethod!==method)return false;
    return true;
  });
  var countEl=document.getElementById('cr-count');
  if(countEl)countEl.textContent=crFiltered.length+' supplier'+(crFiltered.length!==1?'s':'');
  var methodColors={'Biochar':'#00e5a0','BECCS':'#00d4ff','DACCS':'#8b5cf6','Enhanced Weathering':'#f59e0b','Mineralization':'#ec4899','Ocean Alkalinity':'#06b6d4','Ocean Removal':'#10b981','Biomass Storage':'#f97316','Other':'#94a3b8'};
  var grid=document.getElementById('cr-grid');
  if(!grid)return;
  var html='';
  crFiltered.forEach(function(s){
    var isMulti=s.puro.length>0||s.rainbow.length>0;
    var col=methodColors[s.cdrfyi.canonicalMethod]||'#94a3b8';
    var regBadges='<span class="cr-reg-badge" style="background:rgba(0,212,255,.15);color:#00d4ff;border:1px solid rgba(0,212,255,.25);">CDR.fyi</span>';
    if(s.puro.length)regBadges+=' <span class="cr-reg-badge" style="background:rgba(0,229,160,.15);color:#00e5a0;border:1px solid rgba(0,229,160,.25);">Puro.earth</span>';
    if(s.rainbow.length)regBadges+=' <span class="cr-reg-badge" style="background:rgba(139,92,246,.15);color:#8b5cf6;border:1px solid rgba(139,92,246,.25);">Rainbow</span>';
    var price=s.cdrfyi.price?'$'+s.cdrfyi.price+'/t':'—';
    var delivRate=s.cdrfyi.committed>0?((s.cdrfyi.delivered/s.cdrfyi.committed)*100).toFixed(1)+'%':'—';
    html+='<div class="cr-card'+(isMulti?' multi':'')+'">'+
      '<div class="cr-header">'+
        '<div><div class="cr-name">'+s.name+'</div><div class="cr-country">📍 '+s.cdrfyi.country+'</div></div>'+
        '<div style="text-align:right;font-size:13px;font-weight:800;color:var(--accent);">'+fmtShort(s.cdrfyi.committed)+'<div style="font-size:9px;color:var(--text3);font-weight:400;">tCO₂ committed</div></div>'+
      '</div>'+
      '<div class="cr-registries">'+regBadges+'</div>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">'+
        '<span class="badge" style="background:'+col+'22;color:'+col+';border:1px solid '+col+'44;">'+s.cdrfyi.canonicalMethod+'</span>'+
      '</div>'+
      '<div class="cr-stat-row">'+
        '<div class="cr-stat"><strong>'+fmtShort(s.cdrfyi.delivered)+'</strong> delivered</div>'+
        '<div class="cr-stat"><strong>'+delivRate+'</strong> del. rate</div>'+
        '<div class="cr-stat"><strong>'+price+'</strong> price</div>'+
        '<div class="cr-stat"><strong>'+s.cdrfyi.count+'</strong> tx</div>'+
      '</div>'+
      (s.puro.length?'<div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--border);font-size:11px;color:var(--text3);">🌱 Puro: '+s.puro.map(function(p){return p.name;}).slice(0,2).join(', ')+(s.puro.length>2?'…':'')+' ('+s.puro.length+' project'+(s.puro.length>1?'s':'')+')</div>':'')+
      (s.rainbow.length?'<div style="margin-top:6px;font-size:11px;color:var(--text3);">🌈 Rainbow: '+s.rainbow.map(function(p){return p.name;}).slice(0,2).join(', ')+(s.rainbow.length>2?'…':'')+' ('+s.rainbow.length+' project'+(s.rainbow.length>1?'s':'')+')</div>':'')+
    '</div>';
  });
  grid.innerHTML=html||'<div style="color:var(--text3);padding:40px;text-align:center;font-size:13px;">No suppliers match current filters.</div>';
}

// ============================================================
// SPARKLINES on KPI cards
// ============================================================
function renderSparklines(){
  if(!DATA||!DATA.timeline)return;
  var tl=DATA.timeline;
  var vols=tl.map(function(t){return t.vol;});
  var txs=tl.map(function(t){return t.tx;});
  function makeSpark(vals,col){
    if(!vals||vals.length<2)return'';
    var max=Math.max.apply(null,vals),min=Math.min.apply(null,vals);
    var range=max-min||1;
    var W=80,H=28;
    var pts=vals.map(function(v,i){return [Math.round(i/(vals.length-1)*(W-4)+2),Math.round(H-2-(v-min)/range*(H-4))];});
    var d='M'+pts.map(function(p){return p[0]+','+p[1];}).join(' L');
    return '<svg class="sparkline-svg" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none">'+
      '<path d="'+d+'" fill="none" stroke="'+col+'" stroke-width="1.5" stroke-linecap="round"/>'+
      '<circle cx="'+pts[pts.length-1][0]+'" cy="'+pts[pts.length-1][1]+'" r="2" fill="'+col+'"/>'+
      '</svg>';
  }
  // Inject sparklines into dashboard KPI cards — find by kpi-label text
  var cards=document.querySelectorAll('#page-dashboard .kpi-card');
  cards.forEach(function(card){
    var label=card.querySelector('.kpi-label');
    if(!label)return;
    if(label.textContent.indexOf('Committed')!==-1||label.textContent.indexOf('Volume')!==-1){
      if(!card.querySelector('.kpi-sparkline')){
        var sp=document.createElement('div');sp.className='kpi-sparkline';
        sp.innerHTML=makeSpark(vols,'#00d4ff');
        card.appendChild(sp);
      }
    }
    if(label.textContent.indexOf('Transactions')!==-1){
      if(!card.querySelector('.kpi-sparkline')){
        var sp2=document.createElement('div');sp2.className='kpi-sparkline';
        sp2.innerHTML=makeSpark(txs,'#00e5a0');
        card.appendChild(sp2);
      }
    }
  });
}

// ============================================================
// LAST UPDATED BADGES — add to topbar-right
// ============================================================
function renderLastUpdatedBadge(){
  if(!DATA||!DATA.meta)return;
  var lu=DATA.meta.lastUpdated||{};
  var tbr=document.querySelector('.topbar-right');
  if(!tbr||document.getElementById('last-updated-block'))return;
  var div=document.createElement('div');
  div.id='last-updated-block';
  div.style.cssText='display:flex;flex-direction:column;gap:3px;';
  var labels={'cdrfyi':'CDR.fyi','puro':'Puro','rainbow':'Rainbow','isometric':'Isometric'};
  var html='';
  Object.keys(labels).forEach(function(k){
    if(lu[k])html+='<div class="updated-badge"><div class="updated-dot"></div>'+labels[k]+': '+lu[k]+'</div>';
  });
  div.innerHTML=html;
  tbr.insertBefore(div,tbr.firstChild);
}

// ============================================================
// PRICE DISCOVERY injection into transactions page
// ============================================================
function injectPriceDiscovery(){
  if(!DATA||!DATA.priceDiscovery)return;
  var txPage=document.getElementById('page-transactions');
  if(!txPage)return;
  if(document.getElementById('price-discovery-section'))return;
  var section=document.createElement('div');
  section.id='price-discovery-section';
  section.style.cssText='margin-bottom:24px;';
  section.innerHTML='<div class="section-header"><div><div class="section-title">💰 Price Discovery — Market Prices by Technology</div><div class="section-sub">Price per tCO₂e from CDR.fyi supplier data</div></div></div><div id="price-discovery-content"></div>';
  txPage.insertAdjacentElement('afterbegin',section);
  renderPriceDiscovery();
}

// ============================================================
// MICROSOFT WARNING in Dashboard
// ============================================================
function injectMicrosoftWarning(){
  if(!DATA||!DATA.buyerConcentration)return;
  var dashPage=document.getElementById('page-dashboard');
  if(!dashPage||document.getElementById('ms-dash-warning'))return;
  var bc=DATA.buyerConcentration;
  var div=document.createElement('div');
  div.id='ms-dash-warning';
  div.style.cssText='background:rgba(245,158,11,.07);border:1px solid rgba(245,158,11,.25);border-radius:10px;padding:12px 16px;margin-bottom:20px;display:flex;align-items:flex-start;gap:10px;';
  div.innerHTML='<div style="font-size:18px;flex-shrink:0;">⚠️</div>'+
    '<div style="font-size:12px;color:var(--text2);line-height:1.6;">'+
      '<strong style="color:var(--amber);">Market Concentration Note</strong> — '+
      '<strong style="color:var(--text1);">Microsoft</strong> alone accounts for <strong style="color:var(--amber);">'+bc.top1pct+'%</strong> of all CDR.fyi volume. '+
      'Top 3 buyers: <strong style="color:var(--amber);">'+bc.top3pct+'%</strong>. Top 10: <strong style="color:var(--amber);">'+bc.top10pct+'%</strong>. '+
      'HHI Index: <strong style="color:var(--amber);">'+bc.hhi+'</strong> (highly concentrated). '+
      '<a href="#" onclick="event.preventDefault();showPage(&quot;deliverygap&quot;)" style="color:var(--accent);">→ View full analysis</a>'+
    '</div>'+
    '<button onclick="this.parentElement.style.display=&quot;none&quot;" style="background:transparent;border:none;color:var(--text3);cursor:pointer;font-size:16px;flex-shrink:0;padding:0 4px;">×</button>';
  // Insert after KPI grid — use appendChild as safe fallback
  var kpiGrid=dashPage.querySelector('.kpi-grid');
  if(kpiGrid){kpiGrid.insertAdjacentElement('afterend',div);}
  else{dashPage.appendChild(div);}
}

// ============================================================
// CSV UPLOAD for Rainbow
// ============================================================
function handleCSVDrop(e){
  e.preventDefault();
  document.getElementById('csv-dropzone').style.borderColor='var(--border2)';
  var file=e.dataTransfer.files[0];
  if(file)handleCSVFile(file);
}
function handleCSVFile(file){
  if(!file||!file.name.endsWith('.csv')){
    showCSVStatus('error','Please select a .csv file');return;
  }
  showCSVStatus('loading','Reading '+file.name+'…');
  var reader=new FileReader();
  reader.onload=function(e){parseRainbowCSV(e.target.result,file.name);};
  reader.readAsText(file);
}
function showCSVStatus(type,msg){
  var el=document.getElementById('csv-status');
  if(!el)return;
  var col=type==='success'?'#00e5a0':type==='error'?'#ef4444':'#f59e0b';
  var icon=type==='success'?'✅':type==='error'?'❌':'⏳';
  el.innerHTML='<div style="background:rgba('+col.replace('#','')+',.08);border:1px solid '+col+'44;border-radius:8px;padding:12px 16px;font-size:13px;color:'+col+';">'+icon+' '+msg+'</div>';
}
function parseRainbowCSV(text,filename){
  try{
    var lines=text.split(/\r?\n/).filter(function(l){return l.trim();});
    if(lines.length<2){showCSVStatus('error','File appears empty');return;}
    var headers=lines[0].split(',').map(function(h){return h.trim().replace(/^"|"$/g,'');});
    var projects=[];
    for(var i=1;i<lines.length;i++){
      var cols=lines[i].split(',');
      var row={};
      headers.forEach(function(h,j){row[h]=(cols[j]||'').trim().replace(/^"|"$/g,'');});
      if(row.Name||row.name||row['Project Name'])projects.push(row);
    }
    // Map to our format
    var mapped=projects.map(function(p,idx){
      return {
        id:p.ID||p.id||(idx+1),
        name:p.Name||p.name||p['Project Name']||'',
        developer:p.Developer||p.developer||p.Company||'',
        methodology:p.Methodology||p.methodology||p.Type||'',
        mechanism:p.Mechanism||p.mechanism||p.Category||'',
        durability:p.Durability||p.durability||'',
        country:p.Country||p.country||'',
        city:p.City||p.city||'',
        status:p.Status||p.status||'',
        issuedCredits:parseFloat(p['Issued Credits']||p.IssuedCredits||p.issued_credits||0)||0,
        availableCredits:parseFloat(p['Available Credits']||p.AvailableCredits||p.available_credits||0)||0,
        firstIssuance:p['First Issuance']||p.firstIssuance||'',
        lastIssuance:p['Last Issuance']||p.lastIssuance||''
      };
    });
    // Update DATA
    DATA.rainbow.projects=mapped;
    DATA.rainbow.kpis.totalProjects=mapped.length;
    DATA.rainbow.kpis.totalIssuedCredits=mapped.reduce(function(s,p){return s+(p.issuedCredits||0);},0);
    DATA.rainbow.kpis.totalAvailableCredits=mapped.reduce(function(s,p){return s+(p.availableCredits||0);},0);
    // Reset rendered flag so rainbow page re-renders
    chartsRendered['rainbow']=false;
    showCSVStatus('success','Successfully imported '+mapped.length+' Rainbow projects from '+filename+'. Navigate to Rainbow Standard to see updated data.');
    // Show preview
    var prev=document.getElementById('csv-preview');
    if(prev){
      var ph='<div class="table-wrap" style="margin-top:0;"><table style="width:100%;"><thead><tr><th>#</th><th>Name</th><th>Methodology</th><th>Country</th><th style="text-align:right">Issued Credits</th></tr></thead><tbody>';
      mapped.slice(0,10).forEach(function(p,i){ph+='<tr><td style="color:var(--text3);">'+(i+1)+'</td><td class="td-bold">'+p.name+'</td><td>'+p.methodology+'</td><td>'+p.country+'</td><td style="text-align:right;">'+fmtNum(p.issuedCredits)+'</td></tr>';});
      ph+='</tbody></table><div style="padding:10px 14px;font-size:11px;color:var(--text3);">Showing 10 of '+mapped.length+' projects</div></div>';
      prev.innerHTML=ph;
    }
  }catch(err){showCSVStatus('error','Parse error: '+err.message);}
}


loadData();
</script>
</body>
</html>`;
  return c.html(html);
})

export default app
