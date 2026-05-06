# utils/auto_seed.py
# Carica automaticamente i dati all'avvio se il DB è vuoto.
# Importa prima il file Excel principale, poi il CSV del portale CDR.fyi

import os
import logging
from sqlalchemy.orm import Session
from database import SessionLocal
from models.transaction import Transaction
from models.supplier import Supplier

log = logging.getLogger("auto_seed")

def auto_seed_if_empty():
    """Importa i dati all'avvio se il database è vuoto."""
    db: Session = SessionLocal()
    try:
        tx_count = db.query(Transaction).count()
        sup_count = db.query(Supplier).count()

        if tx_count > 0:
            log.info(f"✅ Database già popolato: {tx_count} transazioni, {sup_count} supplier. Skip seed.")
            return

        log.info("📊 Database vuoto — avvio importazione automatica...")
        base_dir = os.path.dirname(os.path.dirname(__file__))

        # ── 1. Excel principale (dati storici con dettagli supplier) ─────────
        excel_path = os.path.join(base_dir, "data", "source_data.xlsx")
        if os.path.exists(excel_path):
            log.info(f"📥 Importo Excel: {excel_path}")
            from utils.ingestion import ingest_excel_file
            result = ingest_excel_file(excel_path, db)
            tx_after = db.query(Transaction).count()
            log.info(f"✅ Excel importato: {result} — {tx_after} transazioni totali")
        else:
            log.warning(f"⚠️  File Excel non trovato: {excel_path}")

        # ── 2. CSV del portale CDR.fyi (dati aggiornati 2026) ────────────────
        csv_path = os.path.join(base_dir, "data", "portal_data.csv")
        if os.path.exists(csv_path):
            log.info(f"📥 Importo CSV portale: {csv_path}")
            from utils.import_portal_csv import import_csv
            inserted, updated, skipped = import_csv(csv_path)
            tx_final = db.query(Transaction).count()
            log.info(f"✅ CSV portale importato: +{inserted} nuove, {updated} aggiornate — {tx_final} transazioni totali")
        else:
            log.warning(f"⚠️  CSV portale non trovato: {csv_path} (skip)")

    except Exception as e:
        log.error(f"❌ Errore durante auto-seed: {e}", exc_info=True)
    finally:
        db.close()
