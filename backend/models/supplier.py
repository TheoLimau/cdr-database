# models/supplier.py
# Modello SQLAlchemy per la tabella suppliers (fornitori di crediti CDR)

from sqlalchemy import Column, Integer, String, Float, Text, Index
from sqlalchemy.orm import relationship
from .base import Base


class Supplier(Base):
    """
    Rappresenta un fornitore di crediti di carbonio (CDR supplier).
    Relazione 1:N con Transaction.
    """
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    location_country = Column(String(100), nullable=True)
    location_region = Column(String(100), nullable=True)   # Es: Europe, Africa, Americas
    location_lat = Column(Float, nullable=True)
    location_lng = Column(Float, nullable=True)
    method = Column(String(150), nullable=True, index=True)  # Es: BECCS, DAC, Enhanced Weathering
    certification = Column(String(150), nullable=True)        # Es: Puro.earth, Gold Standard
    price_per_tonne = Column(Float, nullable=True)            # USD per tonne
    website = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)

    # Relazione 1:N → un supplier ha molte transactions
    transactions = relationship(
        "Transaction",
        back_populates="supplier",
        cascade="all, delete-orphan",
        lazy="select"
    )

    # Indici composti per query frequenti
    __table_args__ = (
        Index("ix_supplier_method_region", "method", "location_region"),
    )

    def __repr__(self):
        return f"<Supplier id={self.id} name='{self.name}' method='{self.method}'>"

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "location_country": self.location_country,
            "location_region": self.location_region,
            "location_lat": self.location_lat,
            "location_lng": self.location_lng,
            "method": self.method,
            "certification": self.certification,
            "price_per_tonne": self.price_per_tonne,
            "website": self.website,
            "notes": self.notes,
        }
