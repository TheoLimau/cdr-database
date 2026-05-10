import { Hono } from 'hono'

type Bindings = { DB: D1Database }
const api = new Hono<{ Bindings: Bindings }>()

// ── helpers ──────────────────────────────────────────────────
function json200(c: any, data: any) { return c.json({ ok: true, data }) }
function err(c: any, msg: string, status = 400) { return c.json({ ok: false, error: msg }, status) }
function num(v: any, def = 0) { const n = parseInt(v); return isNaN(n) ? def : n }

// ── GET /api/kpis ─────────────────────────────────────────────
api.get('/kpis', async (c) => {
  const db = c.env.DB
  const [kpiRow, timeline, methods, status_dist, top_buyers] = await Promise.all([
    db.prepare('SELECT data FROM kpi_snapshot WHERE id=1').first<{data:string}>(),
    db.prepare('SELECT year, committed, delivered, tx_count FROM timeline ORDER BY year').all(),
    db.prepare('SELECT name as method, committed, delivered, delivery_rate, tx_count FROM methods ORDER BY committed DESC').all(),
    db.prepare("SELECT status, COUNT(*) as count, SUM(volume) as volume FROM transactions GROUP BY status ORDER BY count DESC").all(),
    db.prepare('SELECT name, total_volume, tx_count FROM buyers ORDER BY total_volume DESC LIMIT 10').all(),
  ])
  const kpi = kpiRow ? JSON.parse(kpiRow.data) : {}
  return json200(c, { kpi, timeline: timeline.results, methods: methods.results, status_dist: status_dist.results, top_buyers: top_buyers.results })
})

// ── GET /api/suppliers ────────────────────────────────────────
api.get('/suppliers', async (c) => {
  const db = c.env.DB
  const { q = '', method = '', country = '', sort = 'committed', page = '1', limit = '50' } = c.req.query()
  const offset = (num(page) - 1) * num(limit, 50)
  const params: any[] = []
  let where = 'WHERE 1=1'
  if (q) { where += ' AND name LIKE ?'; params.push(`%${q}%`) }
  if (method) { where += ' AND canonical_method=?'; params.push(method) }
  if (country) { where += ' AND country=?'; params.push(country) }
  const allowed = ['committed','delivered','delivery_rate','tx_count','name']
  const orderBy = allowed.includes(sort) ? sort : 'committed'
  const [rows, total] = await Promise.all([
    db.prepare(`SELECT * FROM suppliers ${where} ORDER BY ${orderBy} DESC LIMIT ? OFFSET ?`).bind(...params, num(limit,50), offset).all(),
    db.prepare(`SELECT COUNT(*) as n FROM suppliers ${where}`).bind(...params).first<{n:number}>(),
  ])
  return json200(c, { rows: rows.results, total: total?.n ?? 0, page: num(page), pages: Math.ceil((total?.n??0)/num(limit,50)) })
})

// ── GET /api/suppliers/:name ──────────────────────────────────
api.get('/suppliers/:name', async (c) => {
  const db = c.env.DB
  const name = decodeURIComponent(c.req.param('name'))
  const [supplier, txs, puro, cross, anomalies] = await Promise.all([
    db.prepare('SELECT * FROM suppliers WHERE name=?').bind(name).first(),
    db.prepare('SELECT * FROM transactions WHERE supplier_name=? ORDER BY tx_date DESC LIMIT 100').bind(name).all(),
    db.prepare('SELECT * FROM projects_puro WHERE developer=?').bind(name).all(),
    db.prepare('SELECT * FROM cross_registry WHERE supplier_name=?').bind(name).first(),
    db.prepare('SELECT * FROM price_anomalies WHERE supplier_name=? ORDER BY deviation_pct DESC LIMIT 20').bind(name).all(),
  ])
  if (!supplier) return err(c, 'Supplier not found', 404)
  return json200(c, { supplier, txs: txs.results, puro_projects: puro.results, cross_registry: cross, anomalies: anomalies.results })
})

// ── GET /api/transactions ─────────────────────────────────────
api.get('/transactions', async (c) => {
  const db = c.env.DB
  const { q='', method='', buyer='', supplier='', status='', year='', sort='tx_date', order='desc', page='1', limit='100' } = c.req.query()
  const offset = (num(page)-1) * num(limit,100)
  const params: any[] = []
  let where = 'WHERE 1=1'
  if (q) { where += ' AND (supplier_name LIKE ? OR buyer_name LIKE ? OR technology LIKE ?)'; params.push(`%${q}%`,`%${q}%`,`%${q}%`) }
  if (method) { where += ' AND canonical_method=?'; params.push(method) }
  if (buyer) { where += ' AND buyer_name=?'; params.push(buyer) }
  if (supplier) { where += ' AND supplier_name=?'; params.push(supplier) }
  if (status) { where += ' AND status=?'; params.push(status) }
  if (year) { where += " AND strftime('%Y',tx_date)=?"; params.push(year) }
  const allowed = ['tx_date','volume','price_per_ton','supplier_name','buyer_name']
  const ob = allowed.includes(sort) ? sort : 'tx_date'
  const od = order === 'asc' ? 'ASC' : 'DESC'
  const [rows, total] = await Promise.all([
    db.prepare(`SELECT * FROM transactions ${where} ORDER BY ${ob} ${od} LIMIT ? OFFSET ?`).bind(...params, num(limit,100), offset).all(),
    db.prepare(`SELECT COUNT(*) as n FROM transactions ${where}`).bind(...params).first<{n:number}>(),
  ])
  return json200(c, { rows: rows.results, total: total?.n??0, page: num(page), pages: Math.ceil((total?.n??0)/num(limit,100)) })
})

// ── GET /api/cross-registry ───────────────────────────────────
api.get('/cross-registry', async (c) => {
  const db = c.env.DB
  const { method='', multi='', q='', sort='committed', page='1', limit='50' } = c.req.query()
  const params: any[] = []
  let where = 'WHERE 1=1'
  if (q) { where += ' AND supplier_name LIKE ?'; params.push(`%${q}%`) }
  if (method) { where += ' AND canonical_method=?'; params.push(method) }
  if (multi === '1') { where += ' AND registry_count > 1' }
  const allowed = ['committed','delivered','registry_count','supplier_name']
  const ob = allowed.includes(sort) ? sort : 'committed'
  const offset = (num(page)-1)*num(limit,50)
  const [rows, total, stats] = await Promise.all([
    db.prepare(`SELECT * FROM cross_registry ${where} ORDER BY ${ob} DESC LIMIT ? OFFSET ?`).bind(...params, num(limit,50), offset).all(),
    db.prepare(`SELECT COUNT(*) as n FROM cross_registry ${where}`).bind(...params).first<{n:number}>(),
    db.prepare(`SELECT COUNT(*) as total, SUM(CASE WHEN has_puro=1 THEN 1 ELSE 0 END) as has_puro, SUM(CASE WHEN has_rainbow=1 THEN 1 ELSE 0 END) as has_rainbow, SUM(CASE WHEN has_isometric=1 THEN 1 ELSE 0 END) as has_isometric, SUM(CASE WHEN registry_count>1 THEN 1 ELSE 0 END) as multi_registry FROM cross_registry`).first(),
  ])
  return json200(c, { rows: rows.results, total: total?.n??0, page: num(page), pages: Math.ceil((total?.n??0)/num(limit,50)), stats })
})

// ── GET /api/projects/puro ────────────────────────────────────
api.get('/projects/puro', async (c) => {
  const db = c.env.DB
  const { q='', method='', country='', developer='', page='1', limit='50' } = c.req.query()
  const offset = (num(page)-1)*num(limit,50)
  const params: any[] = []
  let where = 'WHERE 1=1'
  if (q) { where += ' AND (name LIKE ? OR developer LIKE ?)'; params.push(`%${q}%`,`%${q}%`) }
  if (method) { where += ' AND canonical_method=?'; params.push(method) }
  if (country) { where += ' AND country=?'; params.push(country) }
  if (developer) { where += ' AND developer=?'; params.push(developer) }
  const [rows, total] = await Promise.all([
    db.prepare(`SELECT * FROM projects_puro ${where} ORDER BY issued_credits DESC LIMIT ? OFFSET ?`).bind(...params, num(limit,50), offset).all(),
    db.prepare(`SELECT COUNT(*) as n FROM projects_puro ${where}`).bind(...params).first<{n:number}>(),
  ])
  return json200(c, { rows: rows.results, total: total?.n??0, page: num(page), pages: Math.ceil((total?.n??0)/num(limit,50)) })
})

// ── GET /api/projects/rainbow ─────────────────────────────────
api.get('/projects/rainbow', async (c) => {
  const db = c.env.DB
  const { q='', methodology='', country='', status='', page='1', limit='50' } = c.req.query()
  const offset = (num(page)-1)*num(limit,50)
  const params: any[] = []
  let where = 'WHERE 1=1'
  if (q) { where += ' AND (name LIKE ? OR developer LIKE ?)'; params.push(`%${q}%`,`%${q}%`) }
  if (methodology) { where += ' AND methodology=?'; params.push(methodology) }
  if (country) { where += ' AND country=?'; params.push(country) }
  if (status) { where += ' AND status=?'; params.push(status) }
  const [rows, total] = await Promise.all([
    db.prepare(`SELECT * FROM projects_rainbow ${where} ORDER BY issued_credits DESC LIMIT ? OFFSET ?`).bind(...params, num(limit,50), offset).all(),
    db.prepare(`SELECT COUNT(*) as n FROM projects_rainbow ${where}`).bind(...params).first<{n:number}>(),
  ])
  return json200(c, { rows: rows.results, total: total?.n??0, page: num(page), pages: Math.ceil((total?.n??0)/num(limit,50)) })
})

// ── GET /api/projects/isometric ───────────────────────────────
api.get('/projects/isometric', async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM projects_isometric ORDER BY issued_credits DESC').all()
  return json200(c, { rows: rows.results, total: rows.results.length })
})

// ── GET /api/anomalies ────────────────────────────────────────
api.get('/anomalies', async (c) => {
  const db = c.env.DB
  const { severity='', method='', supplier='', page='1', limit='100' } = c.req.query()
  const offset = (num(page)-1)*num(limit,100)
  const params: any[] = []
  let where = 'WHERE 1=1'
  if (severity) { where += ' AND severity=?'; params.push(severity) }
  if (method) { where += ' AND canonical_method=?'; params.push(method) }
  if (supplier) { where += ' AND supplier_name=?'; params.push(supplier) }
  const [rows, total, stats] = await Promise.all([
    db.prepare(`SELECT * FROM price_anomalies ${where} ORDER BY deviation_pct DESC LIMIT ? OFFSET ?`).bind(...params, num(limit,100), offset).all(),
    db.prepare(`SELECT COUNT(*) as n FROM price_anomalies ${where}`).bind(...params).first<{n:number}>(),
    db.prepare(`SELECT severity, COUNT(*) as cnt FROM price_anomalies GROUP BY severity ORDER BY cnt DESC`).all(),
  ])
  return json200(c, { rows: rows.results, total: total?.n??0, page: num(page), pages: Math.ceil((total?.n??0)/num(limit,100)), stats: stats.results })
})

// ── GET /api/buyers ───────────────────────────────────────────
api.get('/buyers', async (c) => {
  const db = c.env.DB
  const { q='', page='1', limit='100' } = c.req.query()
  const offset = (num(page)-1)*num(limit,100)
  const params: any[] = []
  let where = 'WHERE 1=1'
  if (q) { where += ' AND name LIKE ?'; params.push(`%${q}%`) }
  const [rows, total] = await Promise.all([
    db.prepare(`SELECT * FROM buyers ${where} ORDER BY total_volume DESC LIMIT ? OFFSET ?`).bind(...params, num(limit,100), offset).all(),
    db.prepare(`SELECT COUNT(*) as n FROM buyers ${where}`).bind(...params).first<{n:number}>(),
  ])
  return json200(c, { rows: rows.results, total: total?.n??0 })
})

// ── GET /api/methods ──────────────────────────────────────────
api.get('/methods', async (c) => {
  const db = c.env.DB
  const [methods, prices] = await Promise.all([
    db.prepare('SELECT name as method, committed, delivered, delivery_rate, tx_count FROM methods ORDER BY committed DESC').all(),
    db.prepare('SELECT canonical_method as method, AVG(price_per_ton) as avg_price, MIN(price_per_ton) as min_price, MAX(price_per_ton) as max_price, COUNT(*) as tx_count FROM transactions WHERE price_per_ton > 0 GROUP BY canonical_method ORDER BY avg_price DESC').all(),
  ])
  return json200(c, { methods: methods.results, prices: prices.results })
})

// ── GET /api/cross-analysis ───────────────────────────────────
api.get('/cross-analysis', async (c) => {
  const db = c.env.DB
  const [
    supplierBuyerFlow,
    methodByStatus,
    supplierMethodMatrix,
    buyerMethodMatrix,
    registryMethodDist,
    topSuppliersByBuyer,
    countryMethodDist,
    priceByMethodStatus
  ] = await Promise.all([
    // Top supplier→buyer flows (volume)
    db.prepare(`
      SELECT supplier_name, buyer_name, SUM(volume) as total_volume, COUNT(*) as tx_count, canonical_method
      FROM transactions
      WHERE buyer_name != '' AND buyer_name != 'Not Disclosed' AND supplier_name != '' AND supplier_name != 'Not Disclosed'
      GROUP BY supplier_name, buyer_name
      ORDER BY total_volume DESC
      LIMIT 50
    `).all(),
    // Volume by method + status
    db.prepare(`
      SELECT canonical_method, status, COUNT(*) as tx_count, SUM(volume) as total_volume
      FROM transactions
      WHERE canonical_method != ''
      GROUP BY canonical_method, status
      ORDER BY total_volume DESC
    `).all(),
    // Supplier × method matrix (top 20 suppliers)
    db.prepare(`
      SELECT supplier_name, canonical_method, COUNT(*) as tx_count, SUM(volume) as total_volume
      FROM transactions
      WHERE supplier_name != '' AND canonical_method != ''
      GROUP BY supplier_name, canonical_method
      ORDER BY total_volume DESC
      LIMIT 100
    `).all(),
    // Buyer × method matrix (top 20 buyers by volume)
    db.prepare(`
      SELECT buyer_name, canonical_method, COUNT(*) as tx_count, SUM(volume) as total_volume
      FROM transactions
      WHERE buyer_name != '' AND buyer_name != 'Not Disclosed' AND canonical_method != ''
      GROUP BY buyer_name, canonical_method
      ORDER BY total_volume DESC
      LIMIT 100
    `).all(),
    // Registry → method distribution (from cross_registry + projects)
    db.prepare(`
      SELECT canonical_method,
        SUM(has_puro) as in_puro, SUM(has_rainbow) as in_rainbow, SUM(has_isometric) as in_isometric,
        COUNT(*) as supplier_count, SUM(committed) as total_committed
      FROM cross_registry
      GROUP BY canonical_method
      ORDER BY total_committed DESC
    `).all(),
    // Top suppliers per buyer (top 10 buyers)
    db.prepare(`
      SELECT t.buyer_name, t.supplier_name, SUM(t.volume) as vol, t.canonical_method
      FROM transactions t
      WHERE t.buyer_name IN (
        SELECT name FROM buyers WHERE name != 'Not Disclosed' ORDER BY total_volume DESC LIMIT 10
      )
      AND t.supplier_name != ''
      GROUP BY t.buyer_name, t.supplier_name
      ORDER BY t.buyer_name, vol DESC
    `).all(),
    // Country × method distribution (from suppliers table)
    db.prepare(`
      SELECT s.country, t.canonical_method, SUM(t.volume) as total_volume, COUNT(DISTINCT t.supplier_name) as supplier_count
      FROM transactions t
      JOIN suppliers s ON s.name = t.supplier_name
      WHERE s.country != '' AND t.canonical_method != ''
      GROUP BY s.country, t.canonical_method
      ORDER BY total_volume DESC
      LIMIT 100
    `).all(),
    // Avg price by method + status
    db.prepare(`
      SELECT canonical_method, status, AVG(price_per_ton) as avg_price, COUNT(*) as tx_count
      FROM transactions
      WHERE price_per_ton > 0 AND canonical_method != ''
      GROUP BY canonical_method, status
      ORDER BY avg_price DESC
    `).all(),
  ])

  return json200(c, {
    supplierBuyerFlow: supplierBuyerFlow.results,
    methodByStatus: methodByStatus.results,
    supplierMethodMatrix: supplierMethodMatrix.results,
    buyerMethodMatrix: buyerMethodMatrix.results,
    registryMethodDist: registryMethodDist.results,
    topSuppliersByBuyer: topSuppliersByBuyer.results,
    countryMethodDist: countryMethodDist.results,
    priceByMethodStatus: priceByMethodStatus.results,
  })
})

// ── GET /api/search ───────────────────────────────────────────
api.get('/search', async (c) => {
  const db = c.env.DB
  const { q = '' } = c.req.query()
  if (!q || q.length < 2) return json200(c, { results: [] })
  const [suppliers, buyers, puro, rainbow] = await Promise.all([
    db.prepare('SELECT name, country, canonical_method, committed FROM suppliers WHERE name LIKE ? LIMIT 5').bind(`%${q}%`).all(),
    db.prepare('SELECT name, total_volume FROM buyers WHERE name LIKE ? LIMIT 3').bind(`%${q}%`).all(),
    db.prepare('SELECT project_id, name, country, canonical_method FROM projects_puro WHERE name LIKE ? LIMIT 5').bind(`%${q}%`).all(),
    db.prepare('SELECT project_id, name, country, methodology FROM projects_rainbow WHERE name LIKE ? LIMIT 5').bind(`%${q}%`).all(),
  ])
  const results = [
    ...suppliers.results.map((r:any) => ({ type:'supplier', label:r.name, sub:`${r.country} · ${r.canonical_method}`, value:r.name })),
    ...buyers.results.map((r:any) => ({ type:'buyer', label:r.name, sub:`${((r.total_volume||0)/1e3).toFixed(0)}k tCO₂`, value:r.name })),
    ...puro.results.map((r:any) => ({ type:'puro', label:r.name, sub:`Puro · ${r.country}`, value:r.project_id })),
    ...rainbow.results.map((r:any) => ({ type:'rainbow', label:r.name, sub:`Rainbow · ${r.country}`, value:r.project_id })),
  ]
  return json200(c, { results })
})

// ── GET /api/filters/options ──────────────────────────────────
api.get('/filters/options', async (c) => {
  const db = c.env.DB
  const [methods, countries, buyers_list, years, statuses] = await Promise.all([
    db.prepare('SELECT DISTINCT canonical_method FROM suppliers WHERE canonical_method IS NOT NULL AND canonical_method != \'\' ORDER BY canonical_method').all(),
    db.prepare('SELECT DISTINCT country FROM suppliers WHERE country IS NOT NULL AND country != \'\' ORDER BY country').all(),
    db.prepare('SELECT name FROM buyers WHERE name != \'Not Disclosed\' ORDER BY total_volume DESC LIMIT 50').all(),
    db.prepare("SELECT DISTINCT strftime('%Y', tx_date) as year FROM transactions WHERE tx_date IS NOT NULL ORDER BY year DESC").all(),
    db.prepare("SELECT DISTINCT status FROM transactions WHERE status != '' ORDER BY status").all(),
  ])
  return json200(c, {
    methods: methods.results.map((r:any) => r.canonical_method),
    countries: countries.results.map((r:any) => r.country),
    buyers: buyers_list.results.map((r:any) => r.name),
    years: years.results.map((r:any) => r.year),
    statuses: statuses.results.map((r:any) => r.status),
  })
})

export default api
