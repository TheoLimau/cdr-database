# utils/scheduler.py
# Scheduler per aggiornamento automatico del database 24/7
# Usa il modulo 'schedule' (pip install schedule)
# Avvialo come processo separato: python utils/scheduler.py

import schedule
import time
import logging
import os
import sys

# Aggiunge il parent directory al path per importare i moduli locali
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database import SessionLocal, init_db
from utils.ingestion import run_ingestion

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] scheduler - %(message)s",
)
log = logging.getLogger("scheduler")

# ─── Cartella da monitorare per nuovi file ─────────────────────────────────────
WATCH_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "inbox")
PROCESSED_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "processed")


def process_inbox():
    """
    Controlla la cartella data/inbox/ e importa tutti i file nuovi.
    I file elaborati vengono spostati in data/processed/.
    
    WORKFLOW:
      1. Metti il file Excel/CSV nella cartella backend/data/inbox/
      2. Lo scheduler lo rileva entro 15 minuti (configurabile)
      3. Lo importa nel database
      4. Lo sposta in backend/data/processed/
    """
    os.makedirs(WATCH_DIR, exist_ok=True)
    os.makedirs(PROCESSED_DIR, exist_ok=True)

    files = [
        f for f in os.listdir(WATCH_DIR)
        if f.lower().endswith((".xlsx", ".xls", ".csv"))
    ]

    if not files:
        log.debug("Nessun file nuovo in inbox.")
        return

    log.info(f"📂 Trovati {len(files)} file da processare.")

    db = SessionLocal()
    try:
        for filename in files:
            filepath = os.path.join(WATCH_DIR, filename)
            log.info(f"▶ Processo: {filename}")
            try:
                result = run_ingestion(filepath, db, source_label=filename)
                log.info(
                    f"✅ {filename}: {result['inserted']} inserite, "
                    f"{result['skipped']} saltate, {len(result['errors'])} errori"
                )
                # Sposta in processed con timestamp
                import shutil
                from datetime import datetime
                ts = datetime.now().strftime("%Y%m%d_%H%M%S")
                dest = os.path.join(PROCESSED_DIR, f"{ts}_{filename}")
                shutil.move(filepath, dest)
                log.info(f"  Spostato in: {dest}")
            except Exception as e:
                log.error(f"❌ Errore su {filename}: {e}")
    finally:
        db.close()


def daily_report():
    """
    Genera un report giornaliero con statistiche del database.
    Estendibile per inviare email/Slack.
    """
    from sqlalchemy import func
    from models.transaction import Transaction
    from models.supplier import Supplier

    db = SessionLocal()
    try:
        tx_count = db.query(func.count(Transaction.id)).scalar()
        sup_count = db.query(func.count(Supplier.id)).scalar()
        total_tonnes = db.query(func.sum(Transaction.tonnes)).scalar() or 0
        log.info(
            f"📊 Report giornaliero — "
            f"Transazioni: {tx_count} | Suppliers: {sup_count} | "
            f"Totale tCO2e: {total_tonnes:,.0f}"
        )
    finally:
        db.close()


# ─── Pianificazione jobs ──────────────────────────────────────────────────────

# Controlla nuovi file ogni 15 minuti
schedule.every(15).minutes.do(process_inbox)

# Report giornaliero alle 08:00
schedule.every().day.at("08:00").do(daily_report)

# ─── Loop principale ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    log.info("🚀 Scheduler avviato. Premi Ctrl+C per uscire.")
    log.info(f"  Inbox: {WATCH_DIR}")
    log.info(f"  Processed: {PROCESSED_DIR}")

    init_db()
    os.makedirs(WATCH_DIR, exist_ok=True)
    os.makedirs(PROCESSED_DIR, exist_ok=True)

    # Esecuzione immediata al primo avvio
    process_inbox()
    daily_report()

    while True:
        schedule.run_pending()
        time.sleep(60)  # controlla ogni minuto
