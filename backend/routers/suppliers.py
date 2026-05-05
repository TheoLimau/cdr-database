# routers/suppliers.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from services.supplier_service import SupplierService

router = APIRouter(prefix="/api/suppliers", tags=["Suppliers"])

@router.get("/")
def list_suppliers(
    skip:       int           = Query(0, ge=0),
    limit:      int           = Query(200, ge=1, le=500),
    search:     Optional[str] = Query(None),
    technology: Optional[str] = Query(None),
    continent:  Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    return SupplierService.get_all(db, skip=skip, limit=limit,
                                   search=search, technology=technology, continent=continent)

@router.get("/stats")
def supplier_stats(db: Session = Depends(get_db)):
    return SupplierService.get_stats(db)

@router.get("/{supplier_id}")
def get_supplier(supplier_id: int, db: Session = Depends(get_db)):
    s = SupplierService.get_by_id(db, supplier_id)
    if not s:
        raise HTTPException(status_code=404, detail="Supplier non trovato")
    return s.to_dict()

@router.delete("/{supplier_id}")
def delete_supplier(supplier_id: int, db: Session = Depends(get_db)):
    if not SupplierService.delete(db, supplier_id):
        raise HTTPException(status_code=404, detail="Supplier non trovato")
    return {"message": "Eliminato"}
