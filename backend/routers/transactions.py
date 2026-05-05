# routers/transactions.py
# Endpoints REST per le transazioni CDR

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from services.transaction_service import TransactionService

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])


@router.get("/")
def list_transactions(
    skip: int = Query(0, ge=0, description="Offset per paginazione"),
    limit: int = Query(50, ge=1, le=500, description="Numero massimo di risultati"),
    search: Optional[str] = Query(None, description="Full-text search su purchaser, supplier, method"),
    method: Optional[str] = Query(None, description="Filtra per metodo CDR"),
    status: Optional[str] = Query(None, description="Filtra per status transazione"),
    registry: Optional[str] = Query(None, description="Filtra per registro (Verra, Gold Standard...)"),
    region: Optional[str] = Query(None, description="Filtra per regione geografica supplier"),
    year: Optional[int] = Query(None, description="Filtra per anno transazione"),
    purchaser: Optional[str] = Query(None, description="Filtra per acquirente"),
    sort_by: str = Query("id", description="Campo di ordinamento"),
    sort_dir: str = Query("desc", pattern="^(asc|desc)$", description="Direzione ordinamento"),
    db: Session = Depends(get_db),
):
    """
    Lista transazioni con ricerca full-text, filtri combinabili e paginazione.
    """
    return TransactionService.get_all(
        db,
        skip=skip,
        limit=limit,
        search=search,
        method=method,
        status=status,
        registry=registry,
        region=region,
        year=year,
        purchaser=purchaser,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )


@router.get("/stats/summary")
def summary_stats(db: Session = Depends(get_db)):
    """KPI generali: totale transazioni, tonnellate, valore, acquirenti unici."""
    return TransactionService.get_summary_stats(db)


@router.get("/stats/by-year")
def stats_by_year(db: Session = Depends(get_db)):
    """Distribuzione tCO2e per anno."""
    return TransactionService.get_tonnes_by_year(db)


@router.get("/stats/by-method")
def stats_by_method(db: Session = Depends(get_db)):
    """Distribuzione tCO2e per metodo CDR."""
    return TransactionService.get_tonnes_by_method(db)


@router.get("/stats/by-status")
def stats_by_status(db: Session = Depends(get_db)):
    """Distribuzione tCO2e per status."""
    return TransactionService.get_tonnes_by_status(db)


@router.get("/stats/by-region")
def stats_by_region(db: Session = Depends(get_db)):
    """Distribuzione tCO2e per regione geografica."""
    return TransactionService.get_tonnes_by_region(db)


@router.get("/stats/top-purchasers")
def top_purchasers(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """Top acquirenti per volume tCO2e."""
    return TransactionService.get_top_purchasers(db, limit=limit)


@router.get("/stats/top-suppliers")
def top_suppliers(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """Top supplier per volume tCO2e vendute."""
    return TransactionService.get_top_suppliers(db, limit=limit)


@router.get("/filters")
def filter_options(db: Session = Depends(get_db)):
    """
    Valori distinti per tutti i filtri dinamici.
    Il frontend chiama questo endpoint per popolare i menu a tendina.
    """
    return TransactionService.get_filter_options(db)


@router.get("/{transaction_id}")
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """Dettaglio singola transazione per ID."""
    tx = TransactionService.get_by_id(db, transaction_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transazione non trovata")
    return tx.to_dict()


@router.delete("/{transaction_id}")
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """Elimina una transazione per ID."""
    success = TransactionService.delete(db, transaction_id)
    if not success:
        raise HTTPException(status_code=404, detail="Transazione non trovata")
    return {"message": "Transazione eliminata con successo"}
