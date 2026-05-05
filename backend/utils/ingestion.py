# utils/ingestion.py
# Pipeline di data ingestion modulare per Excel e CSV
# Gestisce: lettura file, mapping colonne, deduplicazione, logging errori

import logging
import os
from datetime import datetime, date
from typing import Dict, Any, Optional

import pandas as pd
from sqlalchemy.orm import Session

from models.supplier import Supplier
from models.transaction import Transaction

# ─── Logger dedicato all'ingestion ────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
log = logging.getLogger("ingestion")

# ─── Mapping flessibile dei nomi colonna ──────────────────────────────────────
# Chiave = nome normalizzato interno | Valore = lista alias accettati dal file Excel
COLUMN_ALIASES: Dict[str, list] = {
    # Supplier
    "supplier_name":      ["supplier", "supplier name", "fornitore", "seller", "project name", "project"],
    "method":             ["method", "cdr method", "technology", "type", "removal type", "cdr type"],
    "certification":      ["certification", "standard", "registry standard", "carbon standard"],
    "location_country":   ["country", "supplier country", "nation", "location"],
    "location_region":    ["region", "continent", "area", "geography"],
    "location_lat":       ["lat", "latitude"],
    "location_lng":       ["lng", "lon", "longitude"],
    "price_per_tonne":    ["price", "price per tonne", "unit price", "usd/tonne", "price (usd/t)"],
    # Transaction
    "date":               ["date", "transaction date", "purchase date", "deal date"],
    "year":               ["year", "anno", "purchase year"],
    "tonnes":             ["tonnes", "volume", "quantity", "tco2e", "tco2", "mt", "amount", "volume (tco2e)"],
    "status":             ["status", "delivery status", "state", "contract status"],
    "delivery_year":      ["delivery year", "delivery", "expected delivery"],
    "purchaser":          ["purchaser", "buyer", "company", "customer", "acquirente"],
    "purchaser_country":  ["purchaser country", "buyer country", "buyer nation"],
    "purchaser_sector":   ["sector", "industry", "purchaser sector", "buyer sector"],
    "registry":           ["registry", "carbon registry", "register", "platform"],
    "total_value":        ["total value", "total", "deal value", "contract value", "value (usd)"],
    "notes":              ["notes", "comment", "comments", "description"],
}

# Mappa continente/regione da paese (fallback se la colonna region è assente)
COUNTRY_TO_REGION: Dict[str, str] = {
    "united states": "Americas", "usa": "Americas", "canada": "Americas",
    "brazil": "Americas", "chile": "Americas", "colombia": "Americas",
    "united kingdom": "Europe", "uk": "Europe", "germany": "Europe",
    "france": "Europe", "sweden": "Europe", "norway": "Europe",
    "finland": "Europe", "denmark": "Europe", "netherlands": "Europe",
    "switzerland": "Europe", "iceland": "Europe", "austria": "Europe",
    "spain": "Europe", "italy": "Europe", "portugal": "Europe",
    "kenya": "Africa", "ethiopia": "Africa", "tanzania": "Africa",
    "ghana": "Africa", "nigeria": "Africa", "south africa": "Africa",
    "india": "Asia", "china": "Asia", "japan": "Asia",
    "indonesia": "Asia", "philippines": "Asia", "thailand": "Asia",
    "australia": "Oceania", "new zealand": "Oceania",
    "global": "Global", "worldwide": "Global",
}


# ─── Funzioni di supporto ─────────────────────────────────────────────────────

def _normalize_col(name: str) -> str:
    """Normalizza nome colonna: lowercase, strip, rimuovi caratteri speciali."""
    return str(name).strip().lower().replace("\n", " ").replace("_", " ")


def _build_col_map(df_columns: list) -> Dict[str, str]:
    """
    Costruisce un dizionario {nome_interno -> colonna_df} risolvendo gli alias.
    """
    normalized = {_normalize_col(c): c for c in df_columns}
    col_map = {}
    for field, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            if alias in normalized:
                col_map[field] = normalized[alias]
                break
    return col_map


def _safe_str(val) -> Optional[str]:
    if pd.isna(val) or val is None:
        return None
    return str(val).strip() or None


def _safe_float(val) -> Optional[float]:
    if pd.isna(val) or val is None:
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


def _safe_int(val) -> Optional[int]:
    if pd.isna(val) or val is None:
        return None
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return None


def _safe_date(val) -> Optional[date]:
    if pd.isna(val) or val is None:
        return None
    if isinstance(val, (datetime, date)):
        return val.date() if isinstance(val, datetime) else val
    try:
        return pd.to_datetime(val, dayfirst=True).date()
    except Exception:
        return None


def _infer_region(country: Optional[str]) -> Optional[str]:
    if not country:
        return None
    return COUNTRY_TO_REGION.get(country.strip().lower())


def _get_or_create_supplier(db: Session, row_data: dict) -> Optional[Supplier]:
    """Recupera o crea un supplier. Aggiorna i campi se già esiste."""
    name = _safe_str(row_data.get("supplier_name"))
    if not name:
        return None

    supplier = db.query(Supplier).filter(Supplier.name == name).first()

    fields = {
        "method":           _safe_str(row_data.get("method")),
        "certification":    _safe_str(row_data.get("certification")),
        "location_country": _safe_str(row_data.get("location_country")),
        "location_lat":     _safe_float(row_data.get("location_lat")),
        "location_lng":     _safe_float(row_data.get("location_lng")),
        "price_per_tonne":  _safe_float(row_data.get("price_per_tonne")),
    }

    # Deriva regione se non presente
    region = _safe_str(row_data.get("location_region"))
    if not region:
        region = _infer_region(fields.get("location_country"))
    fields["location_region"] = region

    if supplier:
        # Aggiorna solo i campi non nulli
        for k, v in fields.items():
            if v is not None:
                setattr(supplier, k, v)
        db.flush()
        return supplier

    supplier = Supplier(name=name, **{k: v for k, v in fields.items() if v is not None})
    db.add(supplier)
    db.flush()
    return supplier


def _build_transaction(row_data: dict, supplier: Optional[Supplier], source_label: str) -> Transaction:
    """Costruisce un oggetto Transaction dai dati riga."""
    raw_date = _safe_date(row_data.get("date"))
    raw_year = _safe_int(row_data.get("year"))
    if raw_date and not raw_year:
        raw_year = raw_date.year

    tonnes = _safe_float(row_data.get("tonnes"))
    price = _safe_float(row_data.get("price_per_tonne"))
    total = _safe_float(row_data.get("total_value"))
    if tonnes and price and not total:
        total = round(tonnes * price, 2)

    return Transaction(
        date=raw_date,
        year=raw_year,
        tonnes=tonnes,
        price_per_tonne=price,
        total_value=total,
        status=_safe_str(row_data.get("status")),
        delivery_year=_safe_int(row_data.get("delivery_year")),
        purchaser=_safe_str(row_data.get("purchaser")),
        purchaser_country=_safe_str(row_data.get("purchaser_country")),
        purchaser_sector=_safe_str(row_data.get("purchaser_sector")),
        registry=_safe_str(row_data.get("registry")),
        notes=_safe_str(row_data.get("notes")),
        source_file=source_label,
        supplier=supplier,
    )


# ─── Entry point principale ───────────────────────────────────────────────────

def run_ingestion(
    file_path: str,
    db: Session,
    source_label: Optional[str] = None,
    sheet_name: int = 0,
    max_rows: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Legge un file Excel o CSV e importa i dati nel database.

    Args:
        file_path:    Percorso assoluto del file da importare.
        db:           Sessione SQLAlchemy attiva.
        source_label: Etichetta origine (nome file o URL) salvata in ogni riga.
        sheet_name:   Indice del foglio Excel da leggere (0 = primo foglio).
        max_rows:     Limite righe (None = tutte).

    Returns:
        Dict con contatori: inserted, updated, skipped, errors.
    """
    if not source_label:
        source_label = os.path.basename(file_path)

    log.info(f"▶ Avvio ingestion: {source_label}")

    # ── Lettura file ──────────────────────────────────────────────────────────
    try:
        ext = os.path.splitext(file_path)[1].lower()
        if ext in (".xlsx", ".xls"):
            df = pd.read_excel(file_path, sheet_name=sheet_name, header=0)
        elif ext == ".csv":
            df = pd.read_csv(file_path, encoding="utf-8-sig", on_bad_lines="skip")
        else:
            raise ValueError(f"Estensione non supportata: {ext}")
    except Exception as e:
        log.error(f"Errore lettura file: {e}")
        return {"inserted": 0, "updated": 0, "skipped": 0, "errors": [str(e)]}

    log.info(f"  Righe lette: {len(df)} | Colonne: {list(df.columns)}")

    # ── Pulizia header ────────────────────────────────────────────────────────
    df.columns = [str(c).strip() for c in df.columns]
    df = df.dropna(how="all")          # Rimuovi righe completamente vuote
    if max_rows:
        df = df.head(max_rows)

    # ── Mapping colonne ───────────────────────────────────────────────────────
    col_map = _build_col_map(list(df.columns))
    log.info(f"  Mapping colonne trovato: {col_map}")

    if not col_map:
        msg = "Nessuna colonna riconosciuta nel file. Verifica il formato."
        log.error(msg)
        return {"inserted": 0, "updated": 0, "skipped": 0, "errors": [msg]}

    # ── Loop righe ────────────────────────────────────────────────────────────
    inserted = updated = skipped = 0
    errors = []

    for idx, row in df.iterrows():
        try:
            # Normalizza i dati della riga usando il mapping
            row_data = {
                field: row[col_map[field]]
                for field in col_map
                if field in col_map
            }

            # Salta righe completamente vuote
            if all(
                (pd.isna(v) or str(v).strip() == "")
                for v in row_data.values()
            ):
                skipped += 1
                continue

            # Crea/aggiorna supplier
            supplier = _get_or_create_supplier(db, row_data)

            # Crea la transazione
            tx = _build_transaction(row_data, supplier, source_label)
            db.add(tx)
            inserted += 1

            # Commit ogni 500 righe per evitare lock lunghi
            if inserted % 500 == 0:
                db.commit()
                log.info(f"  ...{inserted} righe inserite")

        except Exception as e:
            error_msg = f"Riga {idx + 2}: {str(e)}"
            log.warning(error_msg)
            errors.append(error_msg)
            db.rollback()
            continue

    # Commit finale
    try:
        db.commit()
    except Exception as e:
        log.error(f"Errore commit finale: {e}")
        db.rollback()
        errors.append(f"Commit finale fallito: {str(e)}")

    log.info(
        f"✅ Ingestion completata: {inserted} inserite | "
        f"{updated} aggiornate | {skipped} saltate | {len(errors)} errori"
    )

    return {
        "inserted": inserted,
        "updated": updated,
        "skipped": skipped,
        "errors": errors,
    }


# ─── CLI helper ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    """
    Uso da riga di comando:
        python utils/ingestion.py path/to/file.xlsx
        python utils/ingestion.py path/to/file.xlsx --max-rows 100
    """
    import sys
    sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
    from database import SessionLocal, init_db

    if len(sys.argv) < 2:
        print("Uso: python utils/ingestion.py <file_path> [max_rows]")
        sys.exit(1)

    fp = sys.argv[1]
    mr = int(sys.argv[2]) if len(sys.argv) > 2 else None

    init_db()
    session = SessionLocal()
    try:
        result = run_ingestion(fp, session, max_rows=mr)
        print(f"\nRisultato: {result}")
    finally:
        session.close()
