# utils/auto_seed.py
# Carica automaticamente il file Excel all'avvio se il DB è vuoto

import os
import logging
from sqlalchemy.orm import Session
from database import SessionLocal
from models.transaction import Transaction
from models.supplier import Supplier

log = logging.getLogger("auto_seed")

def auto_seed_if_empty():
    """Importa il file Excel all'avvio se il database è vuoto."""
    db: Session = SessionLocal()
    try:
        tx_count = db.query(Transaction).count()
        sup_count = db.query(Supplier).count()
        
        if tx_count > 0:
            log.info(f"✅ Database già popolato: {tx_count} transazioni, {sup_count} supplier. Skip seed.")
            return

        log.info("📊 Database vuoto — avvio importazione automatica Excel...")

        # Cerca il file Excel nella cartella data/
        base_dir = os.path.dirname(os.path.dirname(__file__))
        excel_path = os.path.join(base_dir, "data", "source_data.xlsx")

        if not os.path.exists(excel_path):
            log.warning(f"⚠️  File Excel non trovato in: {excel_path}")
            return

        from utils.ingestion import ingest_excel_file
        result = ingest_excel_file(excel_path, db)
        log.info(f"✅ Import completato: {result}")

    except Exception as e:
        log.error(f"❌ Errore durante auto-seed: {e}")
    finally:
        db.close()
