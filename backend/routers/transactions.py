# routers/transactions.py
# Endpoints REST per le transazioni CDR — adattato ai dati reali

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from services.transaction_service import TransactionService

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])


@router.get("/")
def list_transactions(
    skip:        int            = Query(0, ge=0),
    limit:       int            = Query(50, ge=1, le=500),
    search:      Optional[str]  = Query(None, description="Full-text search su purchaser, supplier, method, marketplace"),
    method:      Optional[str]  = Query(None),
    status:      Optional[str]  = Query(None),
    marketplace: Optional[str]  = Query(None),
    registry:    Optional[str]  = Query(None),
    continent:   Optional[str]  = Query(None),
    year:        Optional[int]  = Query(None),
    sort_by:     str            = Query("id"),
    sort_dir:    str            = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
):
    return TransactionService.get_all(
        db, skip=skip, limit=limit, search=search,
        method=method, status=status, marketplace=marketplace,
        registry=registry, continent=continent, year=year,
        sort_by=sort_by, sort_dir=sort_dir,
    )


@router.get("/stats/summary")
def summary_stats(db: Session = Depends(get_db)):
    return TransactionService.get_summary_stats(db)

@router.get("/stats/by-year")
def stats_by_year(db: Session = Depends(get_db)):
    return TransactionService.get_by_year(db)

@router.get("/stats/by-method")
def stats_by_method(db: Session = Depends(get_db)):
    return TransactionService.get_by_method(db)

@router.get("/stats/by-status")
def stats_by_status(db: Session = Depends(get_db)):
    return TransactionService.get_by_status(db)

@router.get("/stats/by-continent")
def stats_by_continent(db: Session = Depends(get_db)):
    return TransactionService.get_by_continent(db)

@router.get("/stats/by-marketplace")
def stats_by_marketplace(db: Session = Depends(get_db)):
    return TransactionService.get_by_marketplace(db)

@router.get("/stats/top-purchasers")
def top_purchasers(limit: int = Query(10, ge=1, le=200), db: Session = Depends(get_db)):
    return TransactionService.get_top_purchasers(db, limit=limit)

@router.get("/stats/top-suppliers")
def top_suppliers(limit: int = Query(10, ge=1, le=200), db: Session = Depends(get_db)):
    return TransactionService.get_top_suppliers(db, limit=limit)

@router.get("/stats/timeline")
def timeline(db: Session = Depends(get_db)):
    return TransactionService.get_timeline(db)

@router.get("/stats/recent")
def recent(limit: int = Query(30, ge=1, le=100), db: Session = Depends(get_db)):
    return TransactionService.get_recent(db, limit=limit)

@router.get("/stats/year-snapshot")
def year_snapshot(year: int = Query(2026), db: Session = Depends(get_db)):
    return TransactionService.get_year_snapshot(db, year=year)

@router.get("/filters")
def filter_options(db: Session = Depends(get_db)):
    return TransactionService.get_filter_options(db)

@router.get("/{transaction_id}")
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    tx = TransactionService.get_by_id(db, transaction_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transazione non trovata")
    return tx.to_dict()

@router.delete("/{transaction_id}")
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    if not TransactionService.delete(db, transaction_id):
        raise HTTPException(status_code=404, detail="Transazione non trovata")
    return {"message": "Eliminata"}
