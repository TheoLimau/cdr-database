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
  const [kpi, timeline, methods, status_dist, top_buyers] = await Promise.all([
    db.prepare('SELECT * FROM kpi_snapshot ORDER BY id DESC LIMIT 1').first(),
    db.prepare('SELECT * FROM timeline ORDER BY year').all(),
    db.prepare('SELECT canonical_method as method, COUNT(*) as suppliers, SUM(committed) as committed, SUM(delivered) as delivered, AVG(price_per_ton) as avg_price FROM suppliers GROUP BY canonical_method ORDER BY committed DESC').all(),
    db.prepare("SELECT status, COUNT(*) as count FROM transactions GROUP BY status").all(),
    db.prepare('SELECT * FROM buyers ORDER BY volume DESC LIMIT 10').all(),
  ])
  return json200(c, { kpi, timeline: timeline.results, methods: methods.results, status_dist: status_dist.results, top_buyers: top_buyers.results })
})

// ── GET /api/suppliers ────────────────────────────────────────
api.get('/suppliers', async (c) => {
  const db = c.env.DB
  const { q = '', method = '', country = '', sort = 'committed', page = '1', limit = '50' } = c.req.query()
  const offset = (num(page) - 1) * num(limit, 50)
  const params: any[] = []
  let where = 'WHERE 1=1'
  if (q) { where += ' AND (name LIKE ? OR city LIKE ?)'; params.push(`%${q}%`, `%${q}%`) }
  if (method) { where += ' AND canonical_method=?'; params.push(method) }
  if (country) { where += ' AND country=?'; params.push(country) }
  const allowed = ['committed','delivered','delivery_rate','price_per_ton','tx_count','name']
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
    db.prepare('SELECT * FROM projects_puro WHERE supplier_name=?').bind(name).all(),
    db.prepare('SELECT * FROM cross_registry WHERE supplier_name=?').bind(name).first(),
    db.prepare('SELECT * FROM price_anomalies WHERE supplier_name=?').bind(name).all(),
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
  if (year) { where += ' AND strftime(\'%Y\',tx_date)=?'; params.push(year) }
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
  const { method='', country='', multi='', q='', sort='cdr_committed', page='1', limit='50' } = c.req.query()
  const params: any[] = []
  let where = 'WHERE 1=1'
  if (q) { where += ' AND (supplier_name LIKE ? OR country LIKE ?)'; params.push(`%${q}%`,`%${q}%`) }
  if (method) { where += ' AND canonical_method=?'; params.push(method) }
  if (country) { where += ' AND country=?'; params.push(country) }
  if (multi === '1') { where += ' AND registry_count > 1' }
  const allowed = ['cdr_committed','cdr_delivered','cdr_count','cdr_price','registry_count','supplier_name']
  const ob = allowed.includes(sort) ? sort : 'cdr_committed'
  const offset = (num(page)-1)*num(limit,50)
  const [rows, total, stats] = await Promise.all([
    db.prepare(`SELECT * FROM cross_registry ${where} ORDER BY ${ob} DESC LIMIT ? OFFSET ?`).bind(...params, num(limit,50), offset).all(),
    db.prepare(`SELECT COUNT(*) as n FROM cross_registry ${where}`).bind(...params).first<{n:number}>(),
    db.prepare(`SELECT COUNT(*) as total, SUM(CASE WHEN registry_count>1 THEN 1 ELSE 0 END) as multi, SUM(cdr_committed) as total_committed, AVG(cdr_price) as avg_price FROM cross_registry`).first(),
  ])
  return json200(c, { rows: rows.results, total: total?.n??0, page: num(page), pages: Math.ceil((total?.n??0)/num(limit,50)), stats })
})

// ── GET /api/projects/puro ────────────────────────────────────
api.get('/projects/puro', async (c) => {
  const db = c.env.DB
  const { q='', method='', country='', supplier='', page='1', limit='50' } = c.req.query()
  const offset = (num(page)-1)*num(limit,50)
  const params: any[] = []
  let where = 'WHERE 1=1'
  if (q) { where += ' AND (name LIKE ? OR supplier_name LIKE ?)'; params.push(`%${q}%`,`%${q}%`) }
  if (method) { where += ' AND canonical_method=?'; params.push(method) }
  if (country) { where += ' AND country=?'; params.push(country) }
  if (supplier) { where += ' AND supplier_name=?'; params.push(supplier) }
  const [rows, total] = await Promise.all([
    db.prepare(`SELECT * FROM projects_puro ${where} ORDER BY start_date DESC LIMIT ? OFFSET ?`).bind(...params, num(limit,50), offset).all(),
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
  const db = c.env.DB
  const rows = await c.env.DB.prepare('SELECT * FROM projects_isometric ORDER BY issued DESC').all()
  return json200(c, { rows: rows.results, total: rows.results.length })
})

// ── GET /api/anomalies ────────────────────────────────────────
api.get('/anomalies', async (c) => {
  const db = c.env.DB
  const { severity='' } = c.req.query()
  let where = severity ? `WHERE severity=?` : ''
  const params = severity ? [severity] : []
  const rows = await db.prepare(`SELECT * FROM price_anomalies ${where} ORDER BY ABS(deviation_pct) DESC`).bind(...params).all()
  return json200(c, { rows: rows.results })
})

// ── GET /api/buyers ───────────────────────────────────────────
api.get('/buyers', async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM buyers ORDER BY volume DESC').all()
  return json200(c, { rows: rows.results })
})

// ── GET /api/methods ──────────────────────────────────────────
api.get('/methods', async (c) => {
  const db = c.env.DB
  const [methods, prices] = await Promise.all([
    db.prepare('SELECT s.canonical_method as method, m.color, COUNT(*) as supplier_count, SUM(s.committed) as total_committed, SUM(s.delivered) as total_delivered, AVG(s.price_per_ton) as avg_price, MIN(s.price_per_ton) as min_price, MAX(s.price_per_ton) as max_price FROM suppliers s LEFT JOIN methods m ON m.id=s.canonical_method WHERE s.canonical_method IS NOT NULL GROUP BY s.canonical_method ORDER BY total_committed DESC').all(),
    db.prepare('SELECT canonical_method as method, AVG(price_per_ton) as avg_price, COUNT(*) as tx_count FROM transactions WHERE price_per_ton > 0 GROUP BY canonical_method').all(),
  ])
  return json200(c, { methods: methods.results, prices: prices.results })
})

// ── GET /api/search ───────────────────────────────────────────
api.get('/search', async (c) => {
  const db = c.env.DB
  const { q = '' } = c.req.query()
  if (!q || q.length < 2) return json200(c, { results: [] })
  const [suppliers, buyers, puro, rainbow] = await Promise.all([
    db.prepare('SELECT name, country, canonical_method, committed FROM suppliers WHERE name LIKE ? LIMIT 5').bind(`%${q}%`).all(),
    db.prepare('SELECT name, volume FROM buyers WHERE name LIKE ? LIMIT 3').bind(`%${q}%`).all(),
    db.prepare('SELECT id, name, country, canonical_method FROM projects_puro WHERE name LIKE ? LIMIT 5').bind(`%${q}%`).all(),
    db.prepare('SELECT id, name, country, methodology FROM projects_rainbow WHERE name LIKE ? LIMIT 5').bind(`%${q}%`).all(),
  ])
  const results = [
    ...suppliers.results.map((r:any) => ({ type:'supplier', label:r.name, sub:`${r.country} · ${r.canonical_method}`, value:r.name })),
    ...buyers.results.map((r:any) => ({ type:'buyer', label:r.name, sub:`${(r.volume/1e6).toFixed(1)}M tCO₂`, value:r.name })),
    ...puro.results.map((r:any) => ({ type:'puro', label:r.name, sub:`Puro · ${r.country}`, value:r.id })),
    ...rainbow.results.map((r:any) => ({ type:'rainbow', label:r.name, sub:`Rainbow · ${r.country}`, value:r.id })),
  ]
  return json200(c, { results })
})

// ── GET /api/filters/options ──────────────────────────────────
api.get('/filters/options', async (c) => {
  const db = c.env.DB
  const [methods, countries, buyers_list, years] = await Promise.all([
    db.prepare('SELECT DISTINCT canonical_method FROM suppliers WHERE canonical_method IS NOT NULL ORDER BY canonical_method').all(),
    db.prepare('SELECT DISTINCT country FROM suppliers WHERE country IS NOT NULL ORDER BY country').all(),
    db.prepare('SELECT DISTINCT buyer_name FROM transactions WHERE buyer_name IS NOT NULL AND buyer_name != \'\' ORDER BY buyer_name LIMIT 50').all(),
    db.prepare("SELECT DISTINCT strftime('%Y', tx_date) as year FROM transactions WHERE tx_date IS NOT NULL ORDER BY year DESC").all(),
  ])
  return json200(c, {
    methods: methods.results.map((r:any) => r.canonical_method),
    countries: countries.results.map((r:any) => r.country),
    buyers: buyers_list.results.map((r:any) => r.buyer_name),
    years: years.results.map((r:any) => r.year),
  })
})

export default api
