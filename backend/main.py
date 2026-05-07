# main.py
# Entry point principale dell'applicazione FastAPI
# Carbon Credits & CDR Transactions Database

import os
import logging
import threading
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from database import init_db
from routers import transactions, suppliers, ingest
from routers import sync as sync_router
from utils.auto_seed import auto_seed_if_empty, run_full_seed

log = logging.getLogger("main")

# ─── App setup ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Carbon Credits DB",
    description="Banca dati interattiva per crediti di carbonio e transazioni CDR",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(transactions.router)
app.include_router(suppliers.router)
app.include_router(ingest.router)
app.include_router(sync_router.router)

# ─── Static files (frontend) ──────────────────────────────────────────────────
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(STATIC_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


# ─── Weekly Scheduler ─────────────────────────────────────────────────────────
def _start_weekly_scheduler():
    """
    Avvia lo scheduler settimanale in un thread separato (daemon).
    Esegue la sync CDR.fyi ogni lunedì alle 04:00.
    Non blocca il server FastAPI.
    """
    import schedule
    import time
    from utils.cdr_api_fetcher import run_api_sync

    def weekly_sync_job():
        log.info("⏰ Scheduler settimanale: avvio sync CDR.fyi API...")
        try:
            result = run_api_sync(full_sync=False)
            log.info(f"✅ Sync settimanale completata: {result}")
        except Exception as e:
            log.error(f"❌ Errore sync settimanale: {e}")

    # Pianifica ogni lunedì alle 04:00
    schedule.every().monday.at("04:00").do(weekly_sync_job)

    # Pianifica anche un check giornaliero delle statistiche
    def daily_stats():
        from database import SessionLocal
        from models.transaction import Transaction
        from models.supplier import Supplier
        from sqlalchemy import func
        db = SessionLocal()
        try:
            tx = db.query(func.count(Transaction.id)).scalar()
            sup = db.query(func.count(Supplier.id)).scalar()
            log.info(f"📊 Stats giornaliere — Transazioni: {tx} | Supplier: {sup}")
        finally:
            db.close()

    schedule.every().day.at("08:00").do(daily_stats)

    log.info("🕐 Scheduler settimanale avviato (sync ogni lunedì ore 04:00)")

    while True:
        schedule.run_pending()
        time.sleep(60)


# ─── Startup ──────────────────────────────────────────────────────────────────
@app.on_event("startup")
def on_startup():
    # 1. Carica variabili .env se presenti
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        try:
            from dotenv import load_dotenv
            load_dotenv(env_path)
            log.info("✅ Variabili .env caricate")
        except ImportError:
            # Parsing manuale fallback
            with open(env_path) as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        os.environ.setdefault(k.strip(), v.strip())

    # 2. Inizializza DB
    init_db()

    # 3. Carica seed dal dump SQL se DB vuoto (Railway deploy)
    from init_db_from_dump import load_seed_if_empty
    load_seed_if_empty()

    # 4. Seed automatico se ancora vuoto
    auto_seed_if_empty()

    # 4. Avvia scheduler settimanale in background thread
    scheduler_thread = threading.Thread(
        target=_start_weekly_scheduler,
        daemon=True,
        name="WeeklyScheduler"
    )
    scheduler_thread.start()

    token = os.getenv("CDR_API_TOKEN", "")
    print("✅ Carbon Credits DB v2.0 avviato!")
    print(f"   CDR API Token: {'✅ configurato' if token else '⚠️  non configurato (sync manuale)'}")
    print("   Docs: http://localhost:8000/api/docs")
    print("   Sync: http://localhost:8000/api/sync/status")


# ─── Admin: forza re-seed (utile dopo deploy su Render) ───────────────────────
@app.post("/api/admin/reseed")
def admin_reseed(background_tasks: BackgroundTasks):
    """
    Forza il caricamento completo dei dati da Excel + CSV portale.
    Usato per popolare il DB su Render dopo un deploy a freddo.
    """
    background_tasks.add_task(run_full_seed)
    return {
        "status": "started",
        "message": "Seed avviato in background. Controlla /api/ingest/status tra 60-90 secondi."
    }


# ─── Admin: reset completo DB + ricarica da seed_data.sql ─────────────────────
@app.post("/api/admin/reset-db")
def admin_reset_db():
    """
    Svuota completamente il DB e ricarica da seed_data.sql.
    Usato per correggere dati duplicati dopo un reseed errato.
    """
    import sqlite3 as _sqlite3
    db_path = os.path.join(os.path.dirname(__file__), "data", "carbon_db.sqlite")
    sql_path = os.path.join(os.path.dirname(__file__), "data", "seed_data.sql")

    if not os.path.exists(sql_path):
        return {"status": "error", "message": "seed_data.sql non trovato"}

    try:
        conn = _sqlite3.connect(db_path)
        # Svuota le tabelle
        conn.execute("DELETE FROM transactions")
        conn.execute("DELETE FROM suppliers")
        conn.commit()

        # Ricarica dal seed SQL
        with open(sql_path, "r", encoding="utf-8") as f:
            sql = f.read()

        # Esegui solo gli INSERT (salta CREATE TABLE che già esistono)
        for stmt in sql.split(";\n"):
            stmt = stmt.strip()
            if stmt.upper().startswith("INSERT INTO"):
                try:
                    conn.execute(stmt)
                except Exception:
                    pass
        conn.commit()

        # Verifica finale
        c = conn.cursor()
        c.execute("SELECT COUNT(*) FROM transactions")
        tx = c.fetchone()[0]
        c.execute("SELECT COUNT(*) FROM suppliers")
        sup = c.fetchone()[0]
        conn.close()

        return {
            "status": "ok",
            "transactions": tx,
            "suppliers": sup,
            "message": f"Reset completato: {tx} transazioni, {sup} suppliers"
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/api/admin/reseed")
def admin_reseed_status():
    """Ritorna lo stato attuale del DB (utile per monitorare il seed)."""
    from database import SessionLocal
    from models.transaction import Transaction
    from models.supplier import Supplier
    from sqlalchemy import func
    db = SessionLocal()
    try:
        tx  = db.query(func.count(Transaction.id)).scalar()
        sup = db.query(func.count(Supplier.id)).scalar()
        return {
            "transactions": tx,
            "suppliers": sup,
            "seeded": tx > 0
        }
    finally:
        db.close()


# ─── Frontend catch-all (SPA) ─────────────────────────────────────────────────
@app.get("/")
def serve_index():
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Carbon Credits DB API", "docs": "/api/docs"}


@app.get("/{full_path:path}")
def spa_catch_all(full_path: str):
    """Serve l'SPA per qualsiasi route non-API."""
    if full_path.startswith("api/"):
        from fastapi import HTTPException
        raise HTTPException(status_code=404)
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Not found"}
