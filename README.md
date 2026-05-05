# 🌿 Carbon Credits DB

Banca dati interattiva per il monitoraggio di **crediti di carbonio** e **transazioni CDR (Carbon Dioxide Removal)**.

---

## 🎯 Panoramica

| | |
|---|---|
| **Stack** | FastAPI + SQLAlchemy + SQLite → PostgreSQL-ready |
| **Frontend** | HTML5 + Tailwind CSS + Chart.js (vanilla JS) |
| **DB** | SQLite locale (file `backend/data/carbon_db.sqlite`) |
| **Porta** | `http://localhost:8000` |
| **API Docs** | `http://localhost:8000/api/docs` |

---

## ✅ Funzionalità Implementate

- **Dashboard KPI**: totale transazioni, tCO₂e, valore USD, acquirenti unici, suppliers
- **5 grafici interattivi**: tCO₂e per anno, distribuzione metodi CDR, status, regioni geografiche, top 10 acquirenti
- **Tabella transazioni**: ordinabile, filtrabile, paginata (50 righe/pagina)
- **Ricerca full-text**: su purchaser, supplier, method, registry (debounce 350ms)
- **Filtri combinabili**: Metodo · Status · Registro · Regione · Anno
- **Modal dettaglio**: click su qualsiasi riga per vedere tutti i campi
- **Scheda Suppliers**: card per ogni fornitore con statistiche aggregate
- **Import Excel/CSV**: drag & drop con mapping automatico colonne tramite alias flessibili
- **Pipeline ingestion modulare**: gestione errori, deduplicazione, logging
- **Scheduler 24/7**: monitoraggio cartella inbox ogni 15 minuti (script separato)

---

## 🗂️ Struttura Progetto

```
webapp/
└── backend/
    ├── main.py                    # Entry point FastAPI
    ├── database.py                # Engine SQLAlchemy (SQLite/PostgreSQL)
    ├── requirements.txt           # Dipendenze Python
    ├── ecosystem.config.cjs       # Config PM2
    ├── models/
    │   ├── supplier.py            # Modello Supplier (1:N con Transaction)
    │   └── transaction.py         # Modello Transaction
    ├── routers/
    │   ├── transactions.py        # GET /api/transactions/* (search, stats, filters)
    │   ├── suppliers.py           # GET /api/suppliers/*
    │   └── ingest.py              # POST /api/ingest/upload
    ├── services/
    │   ├── transaction_service.py # Business logic + aggregazioni + full-text search
    │   └── supplier_service.py    # CRUD + get_or_create
    ├── utils/
    │   ├── ingestion.py           # Pipeline import Excel/CSV
    │   ├── scheduler.py           # Cron job 24/7 (inbox watcher)
    │   └── seed_demo.py           # 15 supplier + 222 transazioni demo
    ├── static/
    │   └── index.html             # SPA frontend (dashboard + tabelle + upload)
    └── data/
        ├── carbon_db.sqlite       # Database SQLite locale
        ├── inbox/                 # Cartella per nuovi file (scheduler)
        └── processed/             # File già importati
```

---

## 🗄️ Schema Database

### `suppliers`
| Campo | Tipo | Note |
|-------|------|-------|
| id | INTEGER PK | Auto-increment |
| name | VARCHAR(255) | Unique, indexed |
| method | VARCHAR(150) | DAC, BECCS, Biochar, ... — indexed |
| certification | VARCHAR(150) | Puro.earth, Verra, Gold Standard... |
| location_country | VARCHAR(100) | |
| location_region | VARCHAR(100) | Europe, Americas, Africa, ... |
| location_lat/lng | FLOAT | Coordinate geografiche |
| price_per_tonne | FLOAT | USD/tCO₂e |

### `transactions`
| Campo | Tipo | Note |
|-------|------|-------|
| id | INTEGER PK | Auto-increment |
| date | DATE | Data transazione |
| year | INTEGER | Indexed |
| tonnes | FLOAT | tCO₂e acquistate |
| price_per_tonne | FLOAT | USD/t al momento acquisto |
| total_value | FLOAT | Calcolato: tonnes × price |
| status | VARCHAR(50) | delivered/contracted/retired/pending |
| purchaser | VARCHAR(255) | Acquirente, indexed |
| registry | VARCHAR(150) | Registro carbonio |
| supplier_id | FK → suppliers | Many-to-one |

**Indici composti**: `(status, year)`, `(purchaser, year)`, `(supplier_id, status)`, `(method, location_region)`

---

## 🚀 Avvio Rapido

```bash
# 1. Installa dipendenze
cd backend
pip install -r requirements.txt

# 2. Popola con dati demo (opzionale)
python utils/seed_demo.py

# 3. Avvia il server
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Apri il browser su **http://localhost:8000**

---

## 📡 API Reference

### Transazioni
| Method | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/transactions/` | Lista con search, filtri, paginazione |
| GET | `/api/transactions/filters` | Valori per menu a tendina |
| GET | `/api/transactions/stats/summary` | KPI aggregati |
| GET | `/api/transactions/stats/by-year` | tCO₂e per anno |
| GET | `/api/transactions/stats/by-method` | tCO₂e per metodo CDR |
| GET | `/api/transactions/stats/by-status` | tCO₂e per status |
| GET | `/api/transactions/stats/by-region` | tCO₂e per regione |
| GET | `/api/transactions/stats/top-purchasers` | Top acquirenti |
| GET | `/api/transactions/stats/top-suppliers` | Top supplier |
| GET | `/api/transactions/{id}` | Dettaglio transazione |

### Suppliers
| Method | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/suppliers/` | Lista con filtri |
| GET | `/api/suppliers/with-stats` | Suppliers + metriche aggregate |
| GET | `/api/suppliers/{id}` | Dettaglio supplier |

### Ingestion
| Method | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | `/api/ingest/upload` | Upload file Excel/CSV |
| GET | `/api/ingest/status` | Contatori DB correnti |

**Documentazione interattiva**: `/api/docs` (Swagger UI) · `/api/redoc`

---

## 📥 Importazione Dati (Excel/CSV)

### Upload manuale (dalla UI)
1. Vai nella sezione **Importa Dati**
2. Trascina il file `.xlsx` o `.csv`
3. Click **Importa nel Database**

### Upload via API
```bash
curl -X POST http://localhost:8000/api/ingest/upload \
  -F "file=@mio_file.xlsx"
```

### Automazione 24/7 (Scheduler)
```bash
# Avvia in background
python utils/scheduler.py &

# Poi copia i file nuovi in:
backend/data/inbox/
# → Vengono importati automaticamente ogni 15 minuti
```

### Colonne Excel riconosciute (alias flessibili)
Il sistema riconosce automaticamente colonne con nomi diversi:
- **Supplier**: `supplier`, `supplier name`, `project name`, `seller`
- **Metodo**: `method`, `cdr method`, `technology`, `type`, `removal type`
- **Acquirente**: `purchaser`, `buyer`, `company`, `customer`
- **Tonnellate**: `tonnes`, `volume`, `tco2e`, `amount`, `volume (tco2e)`
- **Data**: `date`, `transaction date`, `purchase date`
- **Status**: `status`, `delivery status`, `state`
- **Prezzo**: `price`, `price per tonne`, `usd/tonne`, `price (usd/t)`
- **Registro**: `registry`, `carbon registry`, `register`

---

## 🌍 Deployment (Free/Low-Cost)

### Opzione 1: Render.com (consigliata)
```
1. Push su GitHub
2. Nuovo Web Service su render.com
3. Build Command: pip install -r backend/requirements.txt
4. Start Command: cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
5. Free tier disponibile
```

### Opzione 2: Railway.app
```
1. railway init → collega GitHub repo
2. Imposta RAILWAY_DOCKERFILE o usa Nixpacks
3. Aggiungi variabile DATABASE_URL (Railway PostgreSQL)
4. Deploy automatico ad ogni push
```

### Opzione 3: PythonAnywhere
```
1. Upload cartella backend/
2. Configura WSGI con FastAPI/uvicorn
3. Free tier: 512MB storage, 100 sec/day CPU
```

### Migrazione a PostgreSQL
Basta cambiare la variabile d'ambiente:
```bash
DATABASE_URL=postgresql://user:password@host:5432/carbon_db uvicorn main:app
```
*Nessuna modifica al codice richiesta — SQLAlchemy gestisce la differenza.*

---

## 🔄 Aggiornamento Automatico 24/7

```
┌─────────────────────────────────────────┐
│           WORKFLOW AUTOMATICO           │
│                                         │
│  Nuovo file Excel  →  data/inbox/       │
│         ↓                               │
│  scheduler.py (ogni 15 min)             │
│         ↓                               │
│  ingestion.py (mapping + import)        │
│         ↓                               │
│  carbon_db.sqlite aggiornato            │
│         ↓                               │
│  file → data/processed/                 │
└─────────────────────────────────────────┘
```

Strategie avanzate per team non tecnici:
- **Google Drive Sync**: sincronizza `inbox/` con Google Drive (rclone)
- **Email parsing**: estendi `scheduler.py` per leggere allegati email
- **Webhook**: aggiungi un endpoint `/api/ingest/webhook` per trigger esterni
- **Cron su server**: `*/15 * * * * python3 /path/to/scheduler.py` in crontab

---

## 📊 Stato Deployment

- **Piattaforma**: Locale / Sandbox
- **Status**: ✅ Attivo su porta 8000
- **Database**: SQLite con 222 transazioni demo, 15 suppliers
- **Ultimo aggiornamento**: Maggio 2025
