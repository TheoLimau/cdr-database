# database.py
# Configurazione centrale del database SQLAlchemy
# Compatibile con SQLite (dev) e PostgreSQL (prod) — basta cambiare DATABASE_URL

import os
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from models.base import Base

# ─── Configurazione URL ────────────────────────────────────────────────────────
# SQLite per sviluppo locale; PostgreSQL per produzione
# Esempio prod: postgresql://user:password@host:5432/dbname
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/carbon_db.sqlite")

# ─── Engine setup ─────────────────────────────────────────────────────────────
connect_args = {}
kwargs = {}

if DATABASE_URL.startswith("sqlite"):
    # SQLite richiede check_same_thread=False per FastAPI (multi-thread)
    connect_args["check_same_thread"] = False
    # Per SQLite in-memory (test): usa StaticPool
    if DATABASE_URL == "sqlite:///:memory:":
        kwargs["poolclass"] = StaticPool

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False,          # True per debug SQL queries
    pool_pre_ping=True,  # Verifica connessione prima di usarla
    **kwargs
)

# Abilita foreign keys per SQLite (disabilitate di default)
if DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_conn, connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")   # Migliora le performance in lettura
        cursor.close()

# ─── Session factory ──────────────────────────────────────────────────────────
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


def init_db():
    """Crea tutte le tabelle se non esistono. Chiamato all'avvio dell'app."""
    # Assicura che la directory data/ esista
    os.makedirs("data", exist_ok=True)
    Base.metadata.create_all(bind=engine)
    print(f"[DB] Database inizializzato: {DATABASE_URL}")


def get_db():
    """
    Dependency injection per FastAPI.
    Apre una sessione e la chiude automaticamente dopo la request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
