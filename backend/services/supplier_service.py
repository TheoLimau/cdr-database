# services/supplier_service.py
# Business logic per i supplier CDR — adattato ai dati reali

from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from typing import Optional, List, Dict, Any
from models.supplier import Supplier
from models.transaction import Transaction


class SupplierService:

    @staticmethod
    def get_all(
        db: Session,
        skip: int = 0,
        limit: int = 200,
        search: Optional[str] = None,
        technology: Optional[str] = None,
        continent: Optional[str] = None,
    ) -> Dict[str, Any]:
        query = db.query(Supplier)
        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.filter(
                Supplier.name.ilike(term)
                | Supplier.technology.ilike(term)
                | Supplier.certification.ilike(term)
                | Supplier.country.ilike(term)
                | Supplier.continent.ilike(term)
            )
        if technology:
            query = query.filter(Supplier.technology.ilike(f"%{technology}%"))
        if continent:
            query = query.filter(Supplier.continent.ilike(f"%{continent}%"))

        total = query.count()
        suppliers = query.order_by(Supplier.total_tonnes_committed.desc().nullslast()).offset(skip).limit(limit).all()
        return {"total": total, "data": [s.to_dict() for s in suppliers]}

    @staticmethod
    def get_by_id(db: Session, supplier_id: int) -> Optional[Supplier]:
        return db.query(Supplier).filter(Supplier.id == supplier_id).first()

    @staticmethod
    def get_by_name(db: Session, name: str) -> Optional[Supplier]:
        return db.query(Supplier).filter(Supplier.name == name).first()

    @staticmethod
    def get_or_create(db: Session, name: str, **kwargs) -> Supplier:
        supplier = SupplierService.get_by_name(db, name)
        if not supplier:
            supplier = Supplier(name=name, **kwargs)
            db.add(supplier)
            db.flush()
        else:
            # Aggiorna campi se arrivano dati più ricchi
            for k, v in kwargs.items():
                if v is not None and hasattr(supplier, k):
                    setattr(supplier, k, v)
            db.flush()
        return supplier

    @staticmethod
    def get_stats(db: Session) -> Dict[str, Any]:
        total = db.query(func.count(Supplier.id)).scalar() or 0
        by_continent = (
            db.query(Supplier.continent, func.count(Supplier.id).label("count"))
            .filter(Supplier.continent.isnot(None))
            .group_by(Supplier.continent)
            .order_by(func.count(Supplier.id).desc())
            .all()
        )
        by_technology = (
            db.query(Supplier.technology, func.count(Supplier.id).label("count"))
            .filter(Supplier.technology.isnot(None))
            .group_by(Supplier.technology)
            .order_by(func.count(Supplier.id).desc())
            .all()
        )
        return {
            "total": total,
            "by_continent":  [{"continent": r.continent, "count": r.count} for r in by_continent],
            "by_technology": [{"technology": r.technology, "count": r.count} for r in by_technology],
        }

    @staticmethod
    def delete(db: Session, supplier_id: int) -> bool:
        supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
        if not supplier:
            return False
        db.delete(supplier)
        db.commit()
        return True
