# services/transaction_service.py
# Business logic per le transazioni CDR

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func, distinct
from typing import Optional, List, Dict, Any
from models.transaction import Transaction
from models.supplier import Supplier


class TransactionService:
    """Service layer per operazioni CRUD e query avanzate sulle transazioni."""

    # ─── READ ────────────────────────────────────────────────────────────────

    @staticmethod
    def get_all(
        db: Session,
        skip: int = 0,
        limit: int = 50,
        search: Optional[str] = None,
        method: Optional[str] = None,
        status: Optional[str] = None,
        registry: Optional[str] = None,
        region: Optional[str] = None,
        year: Optional[int] = None,
        purchaser: Optional[str] = None,
        sort_by: str = "id",
        sort_dir: str = "desc",
    ) -> Dict[str, Any]:
        """
        Recupera transazioni con filtri dinamici, ricerca full-text e paginazione.
        Ritorna sia i dati che il totale per la paginazione lato client.
        """
        query = db.query(Transaction).options(joinedload(Transaction.supplier))

        # ── Full-text search ──────────────────────────────────────────────────
        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.join(Transaction.supplier, isouter=True).filter(
                or_(
                    Transaction.purchaser.ilike(term),
                    Transaction.registry.ilike(term),
                    Transaction.status.ilike(term),
                    Transaction.notes.ilike(term),
                    Supplier.name.ilike(term),
                    Supplier.method.ilike(term),
                    Supplier.certification.ilike(term),
                )
            )
        else:
            query = query.join(Transaction.supplier, isouter=True)

        # ── Filtri dinamici combinabili ───────────────────────────────────────
        if method:
            query = query.filter(Supplier.method.ilike(f"%{method}%"))
        if status:
            query = query.filter(Transaction.status.ilike(f"%{status}%"))
        if registry:
            query = query.filter(Transaction.registry.ilike(f"%{registry}%"))
        if region:
            query = query.filter(Supplier.location_region.ilike(f"%{region}%"))
        if year:
            query = query.filter(Transaction.year == year)
        if purchaser:
            query = query.filter(Transaction.purchaser.ilike(f"%{purchaser}%"))

        # ── Conteggio totale (prima del paging) ───────────────────────────────
        total = query.count()

        # ── Ordinamento dinamico ──────────────────────────────────────────────
        sort_map = {
            "id": Transaction.id,
            "date": Transaction.date,
            "year": Transaction.year,
            "tonnes": Transaction.tonnes,
            "total_value": Transaction.total_value,
            "status": Transaction.status,
            "purchaser": Transaction.purchaser,
            "registry": Transaction.registry,
        }
        col = sort_map.get(sort_by, Transaction.id)
        query = query.order_by(col.desc() if sort_dir == "desc" else col.asc())

        # ── Paginazione ───────────────────────────────────────────────────────
        transactions = query.offset(skip).limit(limit).all()

        return {
            "total": total,
            "skip": skip,
            "limit": limit,
            "data": [t.to_dict() for t in transactions],
        }

    @staticmethod
    def get_by_id(db: Session, transaction_id: int) -> Optional[Transaction]:
        return (
            db.query(Transaction)
            .options(joinedload(Transaction.supplier))
            .filter(Transaction.id == transaction_id)
            .first()
        )

    # ─── AGGREGAZIONI / STATS ────────────────────────────────────────────────

    @staticmethod
    def get_summary_stats(db: Session) -> Dict[str, Any]:
        """KPI principali per la dashboard."""
        total_transactions = db.query(func.count(Transaction.id)).scalar() or 0
        total_tonnes = db.query(func.sum(Transaction.tonnes)).scalar() or 0
        total_value = db.query(func.sum(Transaction.total_value)).scalar() or 0
        unique_purchasers = db.query(func.count(distinct(Transaction.purchaser))).scalar() or 0
        unique_suppliers = db.query(func.count(distinct(Transaction.supplier_id))).scalar() or 0

        return {
            "total_transactions": total_transactions,
            "total_tonnes": round(total_tonnes, 2),
            "total_value_usd": round(total_value, 2),
            "unique_purchasers": unique_purchasers,
            "unique_suppliers": unique_suppliers,
        }

    @staticmethod
    def get_tonnes_by_year(db: Session) -> List[Dict]:
        """Distribuzione tCO2e per anno."""
        rows = (
            db.query(Transaction.year, func.sum(Transaction.tonnes).label("tonnes"))
            .filter(Transaction.year.isnot(None))
            .group_by(Transaction.year)
            .order_by(Transaction.year)
            .all()
        )
        return [{"year": r.year, "tonnes": round(r.tonnes or 0, 2)} for r in rows]

    @staticmethod
    def get_tonnes_by_method(db: Session) -> List[Dict]:
        """Distribuzione tCO2e per metodo CDR."""
        rows = (
            db.query(Supplier.method, func.sum(Transaction.tonnes).label("tonnes"))
            .join(Transaction.supplier)
            .filter(Supplier.method.isnot(None))
            .group_by(Supplier.method)
            .order_by(func.sum(Transaction.tonnes).desc())
            .all()
        )
        return [{"method": r.method, "tonnes": round(r.tonnes or 0, 2)} for r in rows]

    @staticmethod
    def get_tonnes_by_status(db: Session) -> List[Dict]:
        """Distribuzione tCO2e per status."""
        rows = (
            db.query(Transaction.status, func.sum(Transaction.tonnes).label("tonnes"))
            .filter(Transaction.status.isnot(None))
            .group_by(Transaction.status)
            .order_by(func.sum(Transaction.tonnes).desc())
            .all()
        )
        return [{"status": r.status, "tonnes": round(r.tonnes or 0, 2)} for r in rows]

    @staticmethod
    def get_tonnes_by_region(db: Session) -> List[Dict]:
        """Distribuzione tCO2e per regione geografica del supplier."""
        rows = (
            db.query(Supplier.location_region, func.sum(Transaction.tonnes).label("tonnes"))
            .join(Transaction.supplier)
            .filter(Supplier.location_region.isnot(None))
            .group_by(Supplier.location_region)
            .order_by(func.sum(Transaction.tonnes).desc())
            .all()
        )
        return [{"region": r.location_region, "tonnes": round(r.tonnes or 0, 2)} for r in rows]

    @staticmethod
    def get_top_purchasers(db: Session, limit: int = 10) -> List[Dict]:
        """Top acquirenti per volume tCO2e."""
        rows = (
            db.query(
                Transaction.purchaser,
                func.sum(Transaction.tonnes).label("tonnes"),
                func.count(Transaction.id).label("transactions"),
            )
            .filter(Transaction.purchaser.isnot(None))
            .group_by(Transaction.purchaser)
            .order_by(func.sum(Transaction.tonnes).desc())
            .limit(limit)
            .all()
        )
        return [
            {"purchaser": r.purchaser, "tonnes": round(r.tonnes or 0, 2), "transactions": r.transactions}
            for r in rows
        ]

    @staticmethod
    def get_top_suppliers(db: Session, limit: int = 10) -> List[Dict]:
        """Top supplier per volume tCO2e vendute."""
        rows = (
            db.query(
                Supplier.name,
                Supplier.method,
                Supplier.location_region,
                func.sum(Transaction.tonnes).label("tonnes"),
                func.count(Transaction.id).label("transactions"),
            )
            .join(Supplier.transactions)
            .group_by(Supplier.id)
            .order_by(func.sum(Transaction.tonnes).desc())
            .limit(limit)
            .all()
        )
        return [
            {
                "supplier": r.name,
                "method": r.method,
                "region": r.location_region,
                "tonnes": round(r.tonnes or 0, 2),
                "transactions": r.transactions,
            }
            for r in rows
        ]

    # ─── FILTER OPTIONS ──────────────────────────────────────────────────────

    @staticmethod
    def get_filter_options(db: Session) -> Dict[str, List]:
        """
        Ritorna tutti i valori distinti usati nei filtri dinamici.
        Aggiornati automaticamente ad ogni nuova importazione.
        """
        methods = [
            r[0] for r in db.query(distinct(Supplier.method))
            .filter(Supplier.method.isnot(None)).order_by(Supplier.method).all()
        ]
        statuses = [
            r[0] for r in db.query(distinct(Transaction.status))
            .filter(Transaction.status.isnot(None)).order_by(Transaction.status).all()
        ]
        registries = [
            r[0] for r in db.query(distinct(Transaction.registry))
            .filter(Transaction.registry.isnot(None)).order_by(Transaction.registry).all()
        ]
        regions = [
            r[0] for r in db.query(distinct(Supplier.location_region))
            .filter(Supplier.location_region.isnot(None)).order_by(Supplier.location_region).all()
        ]
        years = [
            r[0] for r in db.query(distinct(Transaction.year))
            .filter(Transaction.year.isnot(None)).order_by(Transaction.year).all()
        ]
        return {
            "methods": methods,
            "statuses": statuses,
            "registries": registries,
            "regions": regions,
            "years": years,
        }

    # ─── CREATE / UPDATE / DELETE ────────────────────────────────────────────

    @staticmethod
    def create(db: Session, data: dict) -> Transaction:
        tx = Transaction(**data)
        db.add(tx)
        db.commit()
        db.refresh(tx)
        return tx

    @staticmethod
    def delete(db: Session, transaction_id: int) -> bool:
        tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if not tx:
            return False
        db.delete(tx)
        db.commit()
        return True
