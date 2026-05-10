-- ============================================================
-- CDR Intelligence Platform — Database Schema v2
-- Allineato con struttura cdr_data.json
-- ============================================================

-- Registries
CREATE TABLE IF NOT EXISTS registries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

-- Canonical methods
CREATE TABLE IF NOT EXISTS methods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  committed REAL DEFAULT 0,
  delivered REAL DEFAULT 0,
  delivery_rate REAL DEFAULT 0,
  tx_count INTEGER DEFAULT 0
);

-- Buyers
CREATE TABLE IF NOT EXISTS buyers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  total_volume REAL DEFAULT 0,
  tx_count INTEGER DEFAULT 0
);

-- Suppliers (CDR.fyi top 50)
CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  committed REAL DEFAULT 0,
  delivered REAL DEFAULT 0,
  delivery_rate REAL DEFAULT 0,
  tx_count INTEGER DEFAULT 0,
  country TEXT,
  canonical_method TEXT
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tx_date TEXT,
  volume REAL DEFAULT 0,
  technology TEXT,
  canonical_method TEXT,
  supplier_name TEXT,
  buyer_name TEXT,
  status TEXT,
  price_per_ton REAL DEFAULT 0,
  notes TEXT
);

-- Projects (Puro.earth)
CREATE TABLE IF NOT EXISTS projects_puro (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT UNIQUE,
  name TEXT NOT NULL,
  developer TEXT,
  methodology TEXT,
  country TEXT,
  status TEXT,
  issued_credits REAL DEFAULT 0,
  retired_credits REAL DEFAULT 0,
  canonical_method TEXT
);

-- Projects (Rainbow)
CREATE TABLE IF NOT EXISTS projects_rainbow (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT UNIQUE,
  name TEXT NOT NULL,
  developer TEXT,
  methodology TEXT,
  country TEXT,
  status TEXT,
  available_credits REAL DEFAULT 0,
  issued_credits REAL DEFAULT 0,
  durability TEXT,
  canonical_method TEXT
);

-- Projects (Isometric)
CREATE TABLE IF NOT EXISTS projects_isometric (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT UNIQUE,
  name TEXT NOT NULL,
  developer TEXT,
  pathway TEXT,
  country TEXT,
  status TEXT,
  issued_credits REAL DEFAULT 0,
  canonical_method TEXT
);

-- Cross-registry mapping
CREATE TABLE IF NOT EXISTS cross_registry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_name TEXT NOT NULL UNIQUE,
  committed REAL DEFAULT 0,
  delivered REAL DEFAULT 0,
  has_puro INTEGER DEFAULT 0,
  has_rainbow INTEGER DEFAULT 0,
  has_isometric INTEGER DEFAULT 0,
  puro_volume REAL DEFAULT 0,
  rainbow_volume REAL DEFAULT 0,
  isometric_volume REAL DEFAULT 0,
  canonical_method TEXT,
  registry_count INTEGER GENERATED ALWAYS AS (
    1 + has_puro + has_rainbow + has_isometric
  ) STORED
);

-- Price anomalies (pre-computed)
CREATE TABLE IF NOT EXISTS price_anomalies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_name TEXT,
  canonical_method TEXT,
  price_per_ton REAL,
  avg_price REAL,
  deviation_pct REAL,
  severity TEXT,
  description TEXT
);

-- KPI snapshot (JSON blob per flessibilità)
CREATE TABLE IF NOT EXISTS kpi_snapshot (
  id INTEGER PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Timeline
CREATE TABLE IF NOT EXISTS timeline (
  year TEXT PRIMARY KEY,
  committed REAL DEFAULT 0,
  delivered REAL DEFAULT 0,
  tx_count INTEGER DEFAULT 0
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
CREATE INDEX IF NOT EXISTS idx_proj_rainbow_status ON projects_rainbow(status);
CREATE INDEX IF NOT EXISTS idx_tx_price ON transactions(price_per_ton);
CREATE INDEX IF NOT EXISTS idx_anomaly_supplier ON price_anomalies(supplier_name);
CREATE INDEX IF NOT EXISTS idx_anomaly_severity ON price_anomalies(severity);
