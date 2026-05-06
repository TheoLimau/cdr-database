# utils/auto_seed.py
# Carica automaticamente i dati all'avvio se il DB è vuoto.
# Importa prima il file Excel principale, poi il CSV del portale CDR.fyi

import os
import logging
from database import SessionLocal
from models.transaction import Transaction
from models.supplier import Supplier

log = logging.getLogger("auto_seed")

BASE_DIR = os.path.dirname(os.path.dirname(__file__))


def auto_seed_if_empty():
    """Importa i dati all'avvio se il database è vuoto."""
    db = SessionLocal()
    try:
        tx_count = db.query(Transaction).count()
        if tx_count > 0:
            log.info(f"✅ Database già popolato: {tx_count} transazioni. Skip seed.")
            db.close()
            return

        log.info("📊 Database vuoto — avvio importazione automatica...")
        db.close()  # chiudi prima di passare al seed (ogni funzione apre la propria)

        run_full_seed()

    except Exception as e:
        log.error(f"❌ Errore durante auto-seed: {e}", exc_info=True)
        try:
            db.close()
        except Exception:
            pass


def run_full_seed():
    """
    Esegue il seed completo:
    1. Excel (supplier + transazioni storiche)
    2. CSV portale CDR.fyi (transazioni 2026 aggiornate)
    Ritorna un dict con i totali.
    """
    totals = {"excel_inserted": 0, "csv_inserted": 0, "csv_updated": 0, "errors": []}

    # ── 1. Excel principale ───────────────────────────────────────────────────
    excel_path = os.path.join(BASE_DIR, "data", "source_data.xlsx")
    if os.path.exists(excel_path):
        log.info(f"📥 Importo Excel: {excel_path}")
        try:
            from utils.ingestion import run_ingestion
            db = SessionLocal()
            result = run_ingestion(excel_path, db, source_label="source_data.xlsx")
            db.close()
            totals["excel_inserted"] = result.get("inserted", 0)
            log.info(f"✅ Excel importato: {result['inserted']} inserite, "
                     f"{result['updated']} aggiornate, {result['skipped']} saltate")
        except Exception as e:
            log.error(f"❌ Errore import Excel: {e}", exc_info=True)
            totals["errors"].append(f"Excel: {e}")
    else:
        log.warning(f"⚠️  File Excel non trovato: {excel_path}")

    # ── 2. CSV portale CDR.fyi ────────────────────────────────────────────────
    csv_path = os.path.join(BASE_DIR, "data", "portal_data.csv")
    if os.path.exists(csv_path):
        log.info(f"📥 Importo CSV portale: {csv_path}")
        try:
            from utils.import_portal_csv import import_csv
            inserted, updated, skipped = import_csv(csv_path)
            totals["csv_inserted"] = inserted
            totals["csv_updated"] = updated
            log.info(f"✅ CSV portale importato: +{inserted} nuove, {updated} aggiornate, {skipped} saltate")
        except Exception as e:
            log.error(f"❌ Errore import CSV portale: {e}", exc_info=True)
            totals["errors"].append(f"CSV: {e}")
    else:
        log.warning(f"⚠️  CSV portale non trovato: {csv_path}")

    # ── Riepilogo finale ──────────────────────────────────────────────────────
    db = SessionLocal()
    try:
        tx_final  = db.query(Transaction).count()
        sup_final = db.query(Supplier).count()
        log.info(f"🎉 Seed completato: {tx_final} transazioni, {sup_final} supplier nel DB")
        totals["tx_total"]  = tx_final
        totals["sup_total"] = sup_final
    finally:
        db.close()

    return totals
