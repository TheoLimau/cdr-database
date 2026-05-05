# models/supplier.py
# Modello SQLAlchemy per la tabella suppliers
# Basato sul foglio "Summary by Supplier (2)" del file Excel reale

from sqlalchemy import Column, Integer, String, Float, Text, Index
from sqlalchemy.orm import relationship
from .base import Base


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # Identità
    name = Column(String(255), nullable=False, unique=True, index=True)

    # Aggregati (dal foglio Summary by Supplier)
    total_tonnes_committed = Column(Float, nullable=True)
    total_tonnes_delivered = Column(Float, nullable=True)
    transaction_count      = Column(Integer, nullable=True)

    # Geolocalizzazione
    geolocation_raw   = Column(String(100), nullable=True)   # es. "23.0225° N, 72.5714° E"
    location_lat      = Column(Float, nullable=True)
    location_lng      = Column(Float, nullable=True)
    continent         = Column(String(100), nullable=True, index=True)
    country           = Column(String(150), nullable=True)
    city_region       = Column(String(255), nullable=True)
    additional_locations = Column(Text, nullable=True)

    # Tecnologia e produzione
    technology        = Column(String(255), nullable=True, index=True)  # = method CDR
    certification     = Column(String(255), nullable=True)
    price_per_tonne   = Column(Float, nullable=True)
    biomass_source    = Column(Text, nullable=True)
    industrial_units  = Column(Integer, nullable=True)

    # Date attività
    first_transaction = Column(String(20), nullable=True)
    last_transaction  = Column(String(20), nullable=True)

    # Relazione 1:N
    transactions = relationship(
        "Transaction",
        back_populates="supplier",
        cascade="all, delete-orphan",
        lazy="select"
    )

    __table_args__ = (
        Index("ix_supplier_tech_continent", "technology", "continent"),
    )

    def __repr__(self):
        return f"<Supplier id={self.id} name='{self.name}' tech='{self.technology}'>"

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "total_tonnes_committed": self.total_tonnes_committed,
            "total_tonnes_delivered": self.total_tonnes_delivered,
            "transaction_count": self.transaction_count,
            "geolocation_raw": self.geolocation_raw,
            "location_lat": self.location_lat,
            "location_lng": self.location_lng,
            "continent": self.continent,
            "country": self.country,
            "city_region": self.city_region,
            "additional_locations": self.additional_locations,
            "technology": self.technology,
            "certification": self.certification,
            "price_per_tonne": self.price_per_tonne,
            "biomass_source": self.biomass_source,
            "industrial_units": self.industrial_units,
            "first_transaction": self.first_transaction,
            "last_transaction": self.last_transaction,
        }
