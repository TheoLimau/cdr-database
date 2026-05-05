# services/transaction_service.py
# Business logic per le transazioni CDR — adattato ai dati reali del file Excel

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func, distinct
from typing import Optional, List, Dict, Any
from models.transaction import Transaction
from models.supplier import Supplier


class TransactionService:

    # ─── READ con filtri ─────────────────────────────────────────────────────

    @staticmethod
    def get_all(
        db: Session,
        skip: int = 0,
        limit: int = 50,
        search: Optional[str] = None,
        method: Optional[str] = None,
        status: Optional[str] = None,
        marketplace: Optional[str] = None,
        registry: Optional[str] = None,
        continent: Optional[str] = None,
        year: Optional[int] = None,
        sort_by: str = "id",
        sort_dir: str = "desc",
    ) -> Dict[str, Any]:

        query = db.query(Transaction).options(joinedload(Transaction.supplier))
        query = query.join(Transaction.supplier, isouter=True)

        # Full-text search su campi chiave
        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Transaction.purchaser.ilike(term),
                    Transaction.method.ilike(term),
                    Transaction.status.ilike(term),
                    Transaction.marketplace.ilike(term),
                    Transaction.registry_name.ilike(term),
                    Supplier.name.ilike(term),
                    Supplier.technology.ilike(term),
                    Supplier.country.ilike(term),
                    Supplier.certification.ilike(term),
                )
            )

        # Filtri dinamici combinabili
        if method:
            query = query.filter(Transaction.method.ilike(f"%{method}%"))
        if status:
            query = query.filter(Transaction.status.ilike(f"%{status}%"))
        if marketplace:
            query = query.filter(Transaction.marketplace.ilike(f"%{marketplace}%"))
        if registry:
            query = query.filter(Transaction.registry_name.ilike(f"%{registry}%"))
        if continent:
            query = query.filter(Supplier.continent.ilike(f"%{continent}%"))
        if year:
            query = query.filter(Transaction.year == year)

        total = query.count()

        # Ordinamento dinamico
        sort_map = {
            "id":               Transaction.id,
            "announcement":     Transaction.announcement,
            "year":             Transaction.year,
            "tonnes":           Transaction.tonnes,
            "tonnes_delivered": Transaction.tonnes_delivered,
            "status":           Transaction.status,
            "purchaser":        Transaction.purchaser,
            "method":           Transaction.method,
            "marketplace":      Transaction.marketplace,
        }
        col = sort_map.get(sort_by, Transaction.id)
        query = query.order_by(col.desc() if sort_dir == "desc" else col.asc())

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

    # ─── KPI AGGREGATI ───────────────────────────────────────────────────────

    @staticmethod
    def get_summary_stats(db: Session) -> Dict[str, Any]:
        total_tx        = db.query(func.count(Transaction.id)).scalar() or 0
        total_committed = db.query(func.sum(Transaction.tonnes)).scalar() or 0
        total_delivered = db.query(func.sum(Transaction.tonnes_delivered)).scalar() or 0
        unique_purchasers = db.query(func.count(distinct(Transaction.purchaser))).scalar() or 0
        unique_suppliers  = db.query(func.count(distinct(Transaction.supplier_id))).scalar() or 0
        delivery_rate = (total_delivered / total_committed * 100) if total_committed > 0 else 0

        return {
            "total_transactions":   total_tx,
            "total_tonnes_committed": round(total_committed, 2),
            "total_tonnes_delivered": round(total_delivered, 2),
            "delivery_rate_pct":      round(delivery_rate, 2),
            "unique_purchasers":      unique_purchasers,
            "unique_suppliers":       unique_suppliers,
        }

    @staticmethod
    def get_by_year(db: Session) -> List[Dict]:
        rows = (
            db.query(
                Transaction.year,
                func.count(Transaction.id).label("count"),
                func.sum(Transaction.tonnes).label("committed"),
                func.sum(Transaction.tonnes_delivered).label("delivered"),
            )
            .filter(Transaction.year.isnot(None))
            .group_by(Transaction.year)
            .order_by(Transaction.year)
            .all()
        )
        return [
            {
                "year":      r.year,
                "count":     r.count,
                "committed": round(r.committed or 0, 2),
                "delivered": round(r.delivered or 0, 2),
            }
            for r in rows
        ]

    @staticmethod
    def get_by_method(db: Session) -> List[Dict]:
        rows = (
            db.query(
                Transaction.method,
                func.count(Transaction.id).label("count"),
                func.sum(Transaction.tonnes).label("committed"),
                func.sum(Transaction.tonnes_delivered).label("delivered"),
            )
            .filter(Transaction.method.isnot(None))
            .group_by(Transaction.method)
            .order_by(func.sum(Transaction.tonnes).desc())
            .all()
        )
        return [
            {
                "method":    r.method,
                "count":     r.count,
                "committed": round(r.committed or 0, 2),
                "delivered": round(r.delivered or 0, 2),
            }
            for r in rows
        ]

    @staticmethod
    def get_by_status(db: Session) -> List[Dict]:
        rows = (
            db.query(
                Transaction.status,
                func.count(Transaction.id).label("count"),
                func.sum(Transaction.tonnes).label("committed"),
            )
            .filter(Transaction.status.isnot(None))
            .group_by(Transaction.status)
            .order_by(func.sum(Transaction.tonnes).desc())
            .all()
        )
        return [
            {"status": r.status, "count": r.count, "committed": round(r.committed or 0, 2)}
            for r in rows
        ]

    @staticmethod
    def get_by_continent(db: Session) -> List[Dict]:
        rows = (
            db.query(
                Supplier.continent,
                func.count(Transaction.id).label("count"),
                func.sum(Transaction.tonnes).label("committed"),
                func.sum(Transaction.tonnes_delivered).label("delivered"),
            )
            .join(Transaction.supplier)
            .filter(Supplier.continent.isnot(None))
            .group_by(Supplier.continent)
            .order_by(func.sum(Transaction.tonnes).desc())
            .all()
        )
        return [
            {
                "continent": r.continent,
                "count":     r.count,
                "committed": round(r.committed or 0, 2),
                "delivered": round(r.delivered or 0, 2),
            }
            for r in rows
        ]

    @staticmethod
    def get_by_marketplace(db: Session) -> List[Dict]:
        rows = (
            db.query(
                Transaction.marketplace,
                func.count(Transaction.id).label("count"),
                func.sum(Transaction.tonnes).label("committed"),
            )
            .filter(Transaction.marketplace.isnot(None))
            .group_by(Transaction.marketplace)
            .order_by(func.count(Transaction.id).desc())
            .limit(15)
            .all()
        )
        return [
            {"marketplace": r.marketplace, "count": r.count, "committed": round(r.committed or 0, 2)}
            for r in rows
        ]

    @staticmethod
    def get_top_purchasers(db: Session, limit: int = 10) -> List[Dict]:
        rows = (
            db.query(
                Transaction.purchaser,
                func.count(Transaction.id).label("count"),
                func.sum(Transaction.tonnes).label("committed"),
                func.sum(Transaction.tonnes_delivered).label("delivered"),
            )
            .filter(Transaction.purchaser.isnot(None))
            .filter(Transaction.purchaser != "Not Disclosed")
            .group_by(Transaction.purchaser)
            .order_by(func.sum(Transaction.tonnes).desc())
            .limit(limit)
            .all()
        )
        return [
            {
                "purchaser": r.purchaser,
                "count":     r.count,
                "committed": round(r.committed or 0, 2),
                "delivered": round(r.delivered or 0, 2),
            }
            for r in rows
        ]

    @staticmethod
    def get_timeline(db: Session) -> List[Dict]:
        """Crescita cumulativa tCO₂e per anno."""
        rows = (
            db.query(
                Transaction.year,
                func.sum(Transaction.tonnes).label("committed"),
            )
            .filter(Transaction.year.isnot(None))
            .group_by(Transaction.year)
            .order_by(Transaction.year)
            .all()
        )
        cumulative = 0
        result = []
        for r in rows:
            cumulative += r.committed or 0
            result.append({
                "year": r.year,
                "annual": round(r.committed or 0, 2),
                "cumulative": round(cumulative, 2),
            })
        return result

    # ─── FILTER OPTIONS ──────────────────────────────────────────────────────

    @staticmethod
    def get_filter_options(db: Session) -> Dict[str, List]:
        methods = [
            r[0] for r in db.query(distinct(Transaction.method))
            .filter(Transaction.method.isnot(None)).order_by(Transaction.method).all()
        ]
        statuses = [
            r[0] for r in db.query(distinct(Transaction.status))
            .filter(Transaction.status.isnot(None)).order_by(Transaction.status).all()
        ]
        marketplaces = [
            r[0] for r in db.query(distinct(Transaction.marketplace))
            .filter(Transaction.marketplace.isnot(None)).order_by(Transaction.marketplace).all()
        ]
        registries = [
            r[0] for r in db.query(distinct(Transaction.registry_name))
            .filter(Transaction.registry_name.isnot(None)).order_by(Transaction.registry_name).all()
        ]
        continents = [
            r[0] for r in db.query(distinct(Supplier.continent))
            .filter(Supplier.continent.isnot(None)).order_by(Supplier.continent).all()
        ]
        years = [
            r[0] for r in db.query(distinct(Transaction.year))
            .filter(Transaction.year.isnot(None)).order_by(Transaction.year).all()
        ]
        return {
            "methods":      methods,
            "statuses":     statuses,
            "marketplaces": marketplaces,
            "registries":   registries,
            "continents":   continents,
            "years":        years,
        }

    # ─── CRUD base ───────────────────────────────────────────────────────────

    @staticmethod
    def delete(db: Session, transaction_id: int) -> bool:
        tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if not tx:
            return False
        db.delete(tx)
        db.commit()
        return True
