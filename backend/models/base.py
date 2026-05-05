# models/base.py
# Classe base condivisa da tutti i modelli SQLAlchemy

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class per tutti i modelli ORM."""
    pass
