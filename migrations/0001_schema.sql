-- ============================================================
-- CDR Intelligence Platform — Database Schema
-- ============================================================

-- Registries
CREATE TABLE IF NOT EXISTS registries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  url TEXT,
  color TEXT,
  description TEXT
);

-- Canonical methods
CREATE TABLE IF NOT EXISTS methods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  durability TEXT,
  color TEXT
);

-- Buyers
CREATE TABLE IF NOT EXISTS buyers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  volume REAL DEFAULT 0,
  pct REAL DEFAULT 0,
  tx_count INTEGER DEFAULT 0
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  country TEXT,
  city TEXT,
  technology TEXT,
  canonical_method TEXT,
  price_per_ton REAL,
  committed REAL DEFAULT 0,
  delivered REAL DEFAULT 0,
  tx_count INTEGER DEFAULT 0,
  first_tx TEXT,
  last_tx TEXT,
  delivery_rate REAL GENERATED ALWAYS AS (
    CASE WHEN committed > 0 THEN ROUND(delivered / committed * 100, 2) ELSE 0 END
  ) STORED
);

-- Projects (Puro)
CREATE TABLE IF NOT EXISTS projects_puro (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  method TEXT,
  method_code TEXT,
  canonical_method TEXT,
  country TEXT,
  country_code TEXT,
  supplier_name TEXT,
  url TEXT,
  start_date TEXT,
  end_date TEXT,
  rules TEXT
);

-- Projects (Rainbow)
CREATE TABLE IF NOT EXISTS projects_rainbow (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  developer TEXT,
  methodology TEXT,
  mechanism TEXT,
  durability TEXT,
  country TEXT,
  country_code TEXT,
  city TEXT,
  status TEXT,
  issued_credits REAL DEFAULT 0,
  available_credits REAL DEFAULT 0,
  first_issuance TEXT,
  last_issuance TEXT
);

-- Projects (Isometric)
CREATE TABLE IF NOT EXISTS projects_isometric (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pathway TEXT,
  supplier_name TEXT,
  issued REAL DEFAULT 0,
  retired REAL DEFAULT 0,
  issued_date TEXT
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tx_date TEXT,
  volume REAL,
  technology TEXT,
  canonical_method TEXT,
  supplier_name TEXT,
  buyer_name TEXT,
  status TEXT,
  price_per_ton REAL DEFAULT 0,
  notes TEXT
);

-- Cross-registry mapping (supplier appears in multiple registries)
CREATE TABLE IF NOT EXISTS cross_registry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_name TEXT NOT NULL,
  canonical_method TEXT,
  country TEXT,
  -- CDR.fyi data
  cdr_committed REAL DEFAULT 0,
  cdr_delivered REAL DEFAULT 0,
  cdr_count INTEGER DEFAULT 0,
  cdr_price REAL DEFAULT 0,
  cdr_first_tx TEXT,
  cdr_last_tx TEXT,
  -- Registry presence flags
  has_puro INTEGER DEFAULT 0,
  has_rainbow INTEGER DEFAULT 0,
  has_isometric INTEGER DEFAULT 0,
  puro_project_count INTEGER DEFAULT 0,
  rainbow_project_count INTEGER DEFAULT 0,
  -- Computed
  registry_count INTEGER GENERATED ALWAYS AS (
    1 + has_puro + has_rainbow + has_isometric
  ) STORED
);

-- Price anomalies (pre-computed)
CREATE TABLE IF NOT EXISTS price_anomalies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_name TEXT,
  canonical_method TEXT,
  price REAL,
  method_avg REAL,
  deviation_pct REAL,
  severity TEXT, -- 'low','medium','high'
  description TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- KPI snapshots
CREATE TABLE IF NOT EXISTS kpi_snapshot (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  total_committed REAL,
  total_delivered REAL,
  delivery_rate REAL,
  total_transactions INTEGER,
  unique_suppliers INTEGER,
  unique_buyers INTEGER,
  updated_at TEXT
);

-- Timeline
CREATE TABLE IF NOT EXISTS timeline (
  year TEXT PRIMARY KEY,
  volume REAL DEFAULT 0,
  tx_count INTEGER DEFAULT 0,
  yoy_pct REAL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tx_supplier ON transactions(supplier_name);
CREATE INDEX IF NOT EXISTS idx_tx_buyer ON transactions(buyer_name);
CREATE INDEX IF NOT EXISTS idx_tx_method ON transactions(canonical_method);
CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions(tx_date);
CREATE INDEX IF NOT EXISTS idx_tx_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_sup_method ON suppliers(canonical_method);
CREATE INDEX IF NOT EXISTS idx_sup_country ON suppliers(country);
CREATE INDEX IF NOT EXISTS idx_cr_supplier ON cross_registry(supplier_name);
CREATE INDEX IF NOT EXISTS idx_proj_puro_method ON projects_puro(canonical_method);
CREATE INDEX IF NOT EXISTS idx_proj_rainbow_method ON projects_rainbow(methodology);
