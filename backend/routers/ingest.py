# routers/ingest.py
# Endpoint per l'upload e importazione di file Excel/CSV

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from database import get_db
from utils.ingestion import run_ingestion
import tempfile, os, shutil

router = APIRouter(prefix="/api/ingest", tags=["Data Ingestion"])


@router.post("/upload")
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Carica un file Excel (.xlsx) o CSV e avvia l'importazione.
    Supporta file fino a 50MB.
    """
    allowed = {".xlsx", ".xls", ".csv"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Formato non supportato. Usa: {', '.join(allowed)}"
        )

    # Salva temporaneamente il file
    suffix = ext
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        result = run_ingestion(tmp_path, db, source_label=file.filename)
    finally:
        os.unlink(tmp_path)

    return {
        "status": "ok",
        "filename": file.filename,
        "inserted": result["inserted"],
        "updated": result["updated"],
        "skipped": result["skipped"],
        "errors": result["errors"][:10],  # max 10 errori in risposta
        "total_errors": len(result["errors"]),
    }


@router.get("/status")
def ingest_status(db: Session = Depends(get_db)):
    """Ritorna statistiche rapide sul database attuale."""
    from sqlalchemy import func
    from models.transaction import Transaction
    from models.supplier import Supplier
    tx_count = db.query(func.count(Transaction.id)).scalar()
    sup_count = db.query(func.count(Supplier.id)).scalar()
    return {"transactions": tx_count, "suppliers": sup_count}
