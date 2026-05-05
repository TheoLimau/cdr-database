# models/transaction.py
# Modello SQLAlchemy per la tabella transactions (acquisti di crediti CDR)

from sqlalchemy import (
    Column, Integer, String, Float, Date, Text,
    ForeignKey, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship
from .base import Base


class Transaction(Base):
    """
    Rappresenta una singola transazione di acquisto crediti di carbonio.
    Relazione N:1 con Supplier.
    """
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # --- Dati temporali ---
    date = Column(Date, nullable=True, index=True)
    year = Column(Integer, nullable=True, index=True)

    # --- Volume e valore ---
    tonnes = Column(Float, nullable=True)                   # tCO2e acquistate
    price_per_tonne = Column(Float, nullable=True)          # USD/tonne al momento dell'acquisto
    total_value = Column(Float, nullable=True)              # tonnes * price_per_tonne

    # --- Stato e classificazione ---
    status = Column(String(50), nullable=True, index=True)  # Es: delivered, contracted, retired
    delivery_year = Column(Integer, nullable=True, index=True)

    # --- Acquirente ---
    purchaser = Column(String(255), nullable=True, index=True)
    purchaser_country = Column(String(100), nullable=True)
    purchaser_sector = Column(String(150), nullable=True)   # Es: Tech, Finance, Energy

    # --- Registro ---
    registry = Column(String(150), nullable=True, index=True)  # Es: Verra, Gold Standard, Puro

    # --- Riferimento al fornitore ---
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True, index=True)

    # --- Note / dati extra ---
    notes = Column(Text, nullable=True)
    source_file = Column(String(255), nullable=True)        # Traccia il file di origine

    # Relazione N:1 con Supplier
    supplier = relationship("Supplier", back_populates="transactions")

    # Indici composti per le query più frequenti
    __table_args__ = (
        Index("ix_transaction_status_year", "status", "year"),
        Index("ix_transaction_purchaser_year", "purchaser", "year"),
        Index("ix_transaction_supplier_status", "supplier_id", "status"),
    )

    def __repr__(self):
        return (
            f"<Transaction id={self.id} purchaser='{self.purchaser}' "
            f"tonnes={self.tonnes} status='{self.status}'>"
        )

    def to_dict(self):
        return {
            "id": self.id,
            "date": self.date.isoformat() if self.date else None,
            "year": self.year,
            "tonnes": self.tonnes,
            "price_per_tonne": self.price_per_tonne,
            "total_value": self.total_value,
            "status": self.status,
            "delivery_year": self.delivery_year,
            "purchaser": self.purchaser,
            "purchaser_country": self.purchaser_country,
            "purchaser_sector": self.purchaser_sector,
            "registry": self.registry,
            "supplier_id": self.supplier_id,
            "supplier_name": self.supplier.name if self.supplier else None,
            "supplier_method": self.supplier.method if self.supplier else None,
            "supplier_region": self.supplier.location_region if self.supplier else None,
            "notes": self.notes,
            "source_file": self.source_file,
        }
