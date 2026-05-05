# models/transaction.py
# Modello SQLAlchemy per la tabella transactions
# Basato sul foglio "CDR Transactions Data" del file Excel reale
# Colonne reali: Announcement, Tonnes (t), Method, Supplier, Purchaser,
#                Status, Marketplace, Registry Name, Tonnes Delivered

from sqlalchemy import Column, Integer, String, Float, Date, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from .base import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # ── Colonne dirette dal foglio CDR Transactions Data ─────────────────────
    announcement      = Column(Date,    nullable=True, index=True)   # data annuncio
    year              = Column(Integer, nullable=True, index=True)   # estratto da announcement
    tonnes            = Column(Float,   nullable=True)               # Tonnes (t) — volume totale
    tonnes_delivered  = Column(Float,   nullable=True)               # Tonnes Delivered
    method            = Column(String(255), nullable=True, index=True)  # metodo CDR
    status            = Column(String(50),  nullable=True, index=True)  # Delivered/Contracted/Retired/Partial
    marketplace       = Column(String(150), nullable=True, index=True)  # Patch, Carbonfuture, Watershed...
    registry_name     = Column(String(100), nullable=True, index=True)  # Puro, Isometric, Verra...
    purchaser         = Column(String(255), nullable=True, index=True)
    notes             = Column(Text,    nullable=True)
    source_file       = Column(String(255), nullable=True)

    # ── FK → Supplier ────────────────────────────────────────────────────────
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True, index=True)
    supplier    = relationship("Supplier", back_populates="transactions")

    # ── Indici composti per le query più frequenti ───────────────────────────
    __table_args__ = (
        Index("ix_tx_status_year",      "status",      "year"),
        Index("ix_tx_method_year",      "method",      "year"),
        Index("ix_tx_supplier_status",  "supplier_id", "status"),
        Index("ix_tx_marketplace",      "marketplace"),
    )

    def __repr__(self):
        return (f"<Transaction id={self.id} purchaser='{self.purchaser}' "
                f"tonnes={self.tonnes} status='{self.status}'>")

    def to_dict(self):
        return {
            "id":               self.id,
            "announcement":     self.announcement.isoformat() if self.announcement else None,
            "year":             self.year,
            "tonnes":           self.tonnes,
            "tonnes_delivered": self.tonnes_delivered,
            "method":           self.method,
            "status":           self.status,
            "marketplace":      self.marketplace,
            "registry_name":    self.registry_name,
            "purchaser":        self.purchaser,
            "notes":            self.notes,
            "source_file":      self.source_file,
            "supplier_id":      self.supplier_id,
            # campi denormalizzati per comodità del frontend
            "supplier_name":      self.supplier.name      if self.supplier else None,
            "supplier_technology":self.supplier.technology if self.supplier else None,
            "supplier_continent": self.supplier.continent  if self.supplier else None,
            "supplier_country":   self.supplier.country    if self.supplier else None,
            "supplier_price":     self.supplier.price_per_tonne if self.supplier else None,
        }
