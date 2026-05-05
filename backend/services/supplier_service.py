# services/supplier_service.py
# Business logic per i fornitori di crediti CDR

from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from typing import Optional, List, Dict, Any
from models.supplier import Supplier
from models.transaction import Transaction


class SupplierService:
    """Service layer per operazioni CRUD e query sui suppliers."""

    @staticmethod
    def get_all(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        method: Optional[str] = None,
        region: Optional[str] = None,
    ) -> Dict[str, Any]:
        query = db.query(Supplier)

        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.filter(
                Supplier.name.ilike(term)
                | Supplier.method.ilike(term)
                | Supplier.certification.ilike(term)
                | Supplier.location_country.ilike(term)
            )
        if method:
            query = query.filter(Supplier.method.ilike(f"%{method}%"))
        if region:
            query = query.filter(Supplier.location_region.ilike(f"%{region}%"))

        total = query.count()
        suppliers = query.order_by(Supplier.name).offset(skip).limit(limit).all()

        return {
            "total": total,
            "data": [s.to_dict() for s in suppliers],
        }

    @staticmethod
    def get_by_id(db: Session, supplier_id: int) -> Optional[Supplier]:
        return db.query(Supplier).filter(Supplier.id == supplier_id).first()

    @staticmethod
    def get_by_name(db: Session, name: str) -> Optional[Supplier]:
        return db.query(Supplier).filter(Supplier.name == name).first()

    @staticmethod
    def get_or_create(db: Session, name: str, **kwargs) -> Supplier:
        """
        Recupera un supplier per nome o lo crea se non esiste.
        Utile durante l'ingestion per evitare duplicati.
        """
        supplier = SupplierService.get_by_name(db, name)
        if not supplier:
            supplier = Supplier(name=name, **kwargs)
            db.add(supplier)
            db.commit()
            db.refresh(supplier)
        return supplier

    @staticmethod
    def create(db: Session, data: dict) -> Supplier:
        supplier = Supplier(**data)
        db.add(supplier)
        db.commit()
        db.refresh(supplier)
        return supplier

    @staticmethod
    def update(db: Session, supplier_id: int, data: dict) -> Optional[Supplier]:
        supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
        if not supplier:
            return None
        for key, value in data.items():
            if hasattr(supplier, key) and value is not None:
                setattr(supplier, key, value)
        db.commit()
        db.refresh(supplier)
        return supplier

    @staticmethod
    def delete(db: Session, supplier_id: int) -> bool:
        supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
        if not supplier:
            return False
        db.delete(supplier)
        db.commit()
        return True

    @staticmethod
    def get_with_stats(db: Session) -> List[Dict]:
        """Suppliers arricchiti con statistiche aggregate."""
        rows = (
            db.query(
                Supplier,
                func.count(Transaction.id).label("tx_count"),
                func.sum(Transaction.tonnes).label("total_tonnes"),
                func.sum(Transaction.total_value).label("total_value"),
            )
            .outerjoin(Supplier.transactions)
            .group_by(Supplier.id)
            .order_by(func.sum(Transaction.tonnes).desc().nullslast())
            .all()
        )
        result = []
        for supplier, tx_count, total_tonnes, total_value in rows:
            d = supplier.to_dict()
            d["tx_count"] = tx_count or 0
            d["total_tonnes"] = round(total_tonnes or 0, 2)
            d["total_value"] = round(total_value or 0, 2)
            result.append(d)
        return result
