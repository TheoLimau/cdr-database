# routers/ingest.py
# Endpoint per l'upload e importazione di file Excel/CSV
# Supporta automaticamente:
#   - File Excel (.xlsx/.xls) con i fogli "CDR Transactions Data" + "Summary by Supplier (2)"
#   - CSV esportato dal portale CDR.fyi (header CSS: text-gray-900, ecc.)

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from database import get_db
from utils.ingestion import run_ingestion
import tempfile, os, shutil, csv

router = APIRouter(prefix="/api/ingest", tags=["Data Ingestion"])


def _is_portal_csv(filepath: str) -> bool:
    """
    Rileva se il CSV è nel formato del portale CDR.fyi:
    header con nomi CSS (text-gray-900, font-mono, text-gray-400 …)
    """
    try:
        with open(filepath, "r", encoding="utf-8-sig", errors="replace") as f:
            reader = csv.reader(f)
            header = next(reader, [])
        # Header del portale CDR.fyi contiene classi CSS, non nomi di colonne leggibili
        css_markers = {"text-gray-900", "font-mono", "text-gray-400"}
        header_lower = {h.strip().lower() for h in header}
        return bool(css_markers & header_lower)
    except Exception:
        return False


@router.post("/upload")
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Carica un file Excel (.xlsx) o CSV e avvia l'importazione.
    Rileva automaticamente il formato:
    - Excel: foglio transazioni + foglio supplier con geolocalizzazione
    - CSV portale CDR.fyi: 11 colonne con header CSS
    Supporta file fino a 50 MB.
    """
    allowed = {".xlsx", ".xls", ".csv"}
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Formato non supportato. Usa: {', '.join(sorted(allowed))}"
        )

    # Salva temporaneamente il file
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        # ── Rilevamento automatico del formato ───────────────────────────────
        if ext == ".csv" and _is_portal_csv(tmp_path):
            # Formato portale CDR.fyi
            from utils.import_portal_csv import import_csv
            inserted, updated, skipped = import_csv(tmp_path)
            file_format = "portal_csv"
            errors_list = []
            total_errors = 0
        else:
            # Excel standard o CSV generico
            result = run_ingestion(tmp_path, db, source_label=file.filename)
            inserted      = result["inserted"]
            updated       = result["updated"]
            skipped       = result["skipped"]
            errors_list   = result["errors"][:10]
            total_errors  = len(result["errors"])
            file_format   = "excel" if ext in {".xlsx", ".xls"} else "csv"

    finally:
        os.unlink(tmp_path)

    return {
        "status":       "ok",
        "filename":     file.filename,
        "format":       file_format,
        "inserted":     inserted,
        "updated":      updated,
        "skipped":      skipped,
        "errors":       errors_list,
        "total_errors": total_errors,
    }


@router.get("/status")
def ingest_status(db: Session = Depends(get_db)):
    """Ritorna statistiche rapide sul database attuale."""
    from sqlalchemy import func
    from models.transaction import Transaction
    from models.supplier import Supplier
    tx_count  = db.query(func.count(Transaction.id)).scalar()
    sup_count = db.query(func.count(Supplier.id)).scalar()
    return {"transactions": tx_count, "suppliers": sup_count}
