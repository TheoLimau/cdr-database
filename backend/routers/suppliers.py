# routers/suppliers.py
# Endpoints REST per i supplier di crediti CDR

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from services.supplier_service import SupplierService

router = APIRouter(prefix="/api/suppliers", tags=["Suppliers"])


@router.get("/")
def list_suppliers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = Query(None),
    method: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Lista suppliers con filtri e paginazione."""
    return SupplierService.get_all(db, skip=skip, limit=limit, search=search, method=method, region=region)


@router.get("/with-stats")
def suppliers_with_stats(db: Session = Depends(get_db)):
    """Suppliers arricchiti con statistiche aggregate (tCO2e totali, n. transazioni)."""
    return SupplierService.get_with_stats(db)


@router.get("/{supplier_id}")
def get_supplier(supplier_id: int, db: Session = Depends(get_db)):
    supplier = SupplierService.get_by_id(db, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier non trovato")
    return supplier.to_dict()


@router.delete("/{supplier_id}")
def delete_supplier(supplier_id: int, db: Session = Depends(get_db)):
    success = SupplierService.delete(db, supplier_id)
    if not success:
        raise HTTPException(status_code=404, detail="Supplier non trovato")
    return {"message": "Supplier eliminato con successo"}
