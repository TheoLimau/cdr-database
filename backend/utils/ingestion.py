# utils/ingestion.py
# Pipeline di data ingestion per il file Excel CDR reale
# Gestisce 2 fogli:
#   1. "CDR Transactions Data"  → tabella transactions
#   2. "Summary by Supplier (2)" → tabella suppliers (con geolocation, prezzi, certificazioni)

import logging
import os
import re
from datetime import datetime, date
from typing import Dict, Any, Optional, Tuple

import pandas as pd
from sqlalchemy.orm import Session

from models.supplier import Supplier
from models.transaction import Transaction

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
log = logging.getLogger("ingestion")


# ─── Helper: parsing tipi base ────────────────────────────────────────────────

def _str(val) -> Optional[str]:
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    s = str(val).strip()
    return s if s and s.lower() not in ("nan", "none", "n/a", "-") else None

def _float(val) -> Optional[float]:
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None

def _int(val) -> Optional[int]:
    f = _float(val)
    return int(f) if f is not None else None

def _date(val) -> Optional[date]:
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    if isinstance(val, (datetime, date)):
        return val.date() if isinstance(val, datetime) else val
    try:
        return pd.to_datetime(val, dayfirst=True).date()
    except Exception:
        return None


# ─── Helper: parsing geolocation "17.8145° S, 63.1703° W" ───────────────────

def _parse_latlon(geo_str: str) -> Tuple[Optional[float], Optional[float]]:
    """
    Converte stringa tipo '17.8145° S, 63.1703° W' in (lat, lng) numerici.
    Ritorna (None, None) se il parsing fallisce.
    """
    if not geo_str or not isinstance(geo_str, str):
        return None, None
    try:
        matches = re.findall(r'([\d.]+)°?\s*([NSEWnsew])', geo_str)
        if len(matches) < 2:
            return None, None
        lat_val, lat_dir = matches[0]
        lng_val, lng_dir = matches[1]
        lat = float(lat_val) * (-1 if lat_dir.upper() == 'S' else 1)
        lng = float(lng_val) * (-1 if lng_dir.upper() == 'W' else 1)
        return round(lat, 6), round(lng, 6)
    except Exception:
        return None, None


# ─── FOGLIO 1: Summary by Supplier (2) ───────────────────────────────────────

def _ingest_suppliers(filepath: str, db: Session) -> Dict[str, int]:
    """
    Importa il foglio 'Summary by Supplier (2)'.
    Header reale alla riga 2 (index 2 con header=None).
    """
    log.info("  → Lettura foglio 'Summary by Supplier (2)'")

    df = pd.read_excel(filepath, sheet_name="Summary by Supplier (2)", header=2)
    df = df.dropna(how="all")

    # Rinomina colonne per semplicità
    df.columns = [str(c).strip() for c in df.columns]
    col_rename = {
        "Supplier":                 "name",
        "Total Tonnes Committed":   "total_tonnes_committed",
        "Total Tonnes Delivered":   "total_tonnes_delivered",
        "Transaction Count":        "transaction_count",
        "Geolocation":              "geolocation_raw",
        "Continent":                "continent",
        "Country":                  "country",
        "City/Region":              "city_region",
        "Additional Locations":     "additional_locations",
        "Industrial Units":         "industrial_units",
        "Technology":               "technology",
        "Certification":            "certification",
        "Price (USD/tonne)":        "price_per_tonne",
        "Biomass Source":           "biomass_source",
        "First Transaction":        "first_transaction",
        "Last Transaction":         "last_transaction",
    }
    df = df.rename(columns=col_rename)

    inserted = updated = skipped = 0
    supplier_map: Dict[str, Supplier] = {}  # name → Supplier object

    for _, row in df.iterrows():
        name = _str(row.get("name"))
        if not name:
            skipped += 1
            continue

        geo_raw = _str(row.get("geolocation_raw"))
        lat, lng = _parse_latlon(geo_raw) if geo_raw else (None, None)

        fields = {
            "total_tonnes_committed": _float(row.get("total_tonnes_committed")),
            "total_tonnes_delivered": _float(row.get("total_tonnes_delivered")),
            "transaction_count":      _int(row.get("transaction_count")),
            "geolocation_raw":        geo_raw,
            "location_lat":           lat,
            "location_lng":           lng,
            "continent":              _str(row.get("continent")),
            "country":                _str(row.get("country")),
            "city_region":            _str(row.get("city_region")),
            "additional_locations":   _str(row.get("additional_locations")),
            "industrial_units":       _int(row.get("industrial_units")),
            "technology":             _str(row.get("technology")),
            "certification":          _str(row.get("certification")),
            "price_per_tonne":        _float(row.get("price_per_tonne")),
            "biomass_source":         _str(row.get("biomass_source")),
            "first_transaction":      _str(row.get("first_transaction")),
            "last_transaction":       _str(row.get("last_transaction")),
        }

        existing = db.query(Supplier).filter(Supplier.name == name).first()
        if existing:
            for k, v in fields.items():
                if v is not None:
                    setattr(existing, k, v)
            supplier_map[name] = existing
            updated += 1
        else:
            sup = Supplier(name=name, **{k: v for k, v in fields.items() if v is not None})
            db.add(sup)
            db.flush()
            supplier_map[name] = sup
            inserted += 1

    db.commit()
    log.info(f"  Suppliers: {inserted} inseriti | {updated} aggiornati | {skipped} saltati")
    return {"inserted": inserted, "updated": updated, "skipped": skipped, "supplier_map": supplier_map}


# ─── FOGLIO 2: CDR Transactions Data ─────────────────────────────────────────

def _ingest_transactions(
    filepath: str,
    db: Session,
    supplier_map: Dict[str, Any],
    source_label: str,
    max_rows: Optional[int] = None,
) -> Dict[str, int]:
    """
    Importa il foglio 'CDR Transactions Data'.
    Colonne reali: Announcement, Tonnes (t), Method, Supplier, Purchaser,
                   Status, Marketplace, Registry Name, Tonnes Delivered
    """
    log.info("  → Lettura foglio 'CDR Transactions Data'")

    df = pd.read_excel(filepath, sheet_name="CDR Transactions Data", header=0)
    df = df.dropna(how="all")
    if max_rows:
        df = df.head(max_rows)

    log.info(f"  Righe da processare: {len(df)}")

    inserted = skipped = 0
    errors = []

    for idx, row in df.iterrows():
        try:
            # Tonnellate: skip righe con 0 o null
            tonnes_raw = _float(row.get("Tonnes (t)"))
            if tonnes_raw is None or tonnes_raw == 0:
                skipped += 1
                continue

            ann_date = _date(row.get("Announcement"))
            year = ann_date.year if ann_date else None

            supplier_name = _str(row.get("Supplier"))
            supplier_obj  = supplier_map.get(supplier_name) if supplier_name else None

            # Se supplier non è nel map (raro), crealo minimal
            if supplier_name and not supplier_obj:
                existing = db.query(Supplier).filter(Supplier.name == supplier_name).first()
                if existing:
                    supplier_obj = existing
                else:
                    supplier_obj = Supplier(name=supplier_name)
                    db.add(supplier_obj)
                    db.flush()
                    supplier_map[supplier_name] = supplier_obj

            tx = Transaction(
                announcement     = ann_date,
                year             = year,
                tonnes           = tonnes_raw,
                tonnes_delivered = _float(row.get("Tonnes Delivered")) or 0.0,
                method           = _str(row.get("Method")),
                status           = _str(row.get("Status")),
                marketplace      = _str(row.get("Marketplace")),
                registry_name    = _str(row.get("Registry Name")),
                purchaser        = _str(row.get("Purchaser")),
                source_file      = source_label,
                supplier         = supplier_obj,
            )
            db.add(tx)
            inserted += 1

            # Commit ogni 1000 righe
            if inserted % 1000 == 0:
                db.commit()
                log.info(f"  ...{inserted} transazioni inserite")

        except Exception as e:
            err = f"Riga {idx + 2}: {e}"
            log.warning(err)
            errors.append(err)
            db.rollback()
            continue

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        errors.append(f"Commit finale fallito: {e}")

    log.info(f"  Transazioni: {inserted} inserite | {skipped} saltate | {len(errors)} errori")
    return {"inserted": inserted, "skipped": skipped, "errors": errors}


# ─── ENTRY POINT PRINCIPALE ──────────────────────────────────────────────────

def run_ingestion(
    file_path: str,
    db: Session,
    source_label: Optional[str] = None,
    max_rows: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Importa l'intero file Excel CDR nel database.
    Prima importa i supplier (con dati ricchi), poi le transazioni (con FK verso i supplier).

    Args:
        file_path:    Percorso assoluto del file .xlsx
        db:           Sessione SQLAlchemy
        source_label: Etichetta origine (nome file)
        max_rows:     Limite transazioni (None = tutte)
    """
    if not source_label:
        source_label = os.path.basename(file_path)

    log.info(f"▶ Avvio ingestion: {source_label}")

    ext = os.path.splitext(file_path)[1].lower()
    result = {"inserted": 0, "updated": 0, "skipped": 0, "errors": []}

    try:
        xl = pd.ExcelFile(file_path)
        sheets = xl.sheet_names
    except Exception as e:
        return {**result, "errors": [f"Impossibile aprire il file: {e}"]}

    # ── Step 1: importa supplier dal foglio dedicato (se esiste) ─────────────
    supplier_map: Dict[str, Any] = {}
    if "Summary by Supplier (2)" in sheets:
        try:
            sup_result = _ingest_suppliers(file_path, db)
            result["inserted"] += sup_result["inserted"]
            result["updated"]  += sup_result["updated"]
            result["skipped"]  += sup_result["skipped"]
            supplier_map = sup_result["supplier_map"]
        except Exception as e:
            log.error(f"Errore ingestion suppliers: {e}")
            result["errors"].append(f"Foglio supplier: {e}")
    else:
        # Carica supplier già presenti nel DB nella map
        for s in db.query(Supplier).all():
            supplier_map[s.name] = s

    # ── Step 2: importa transazioni ───────────────────────────────────────────
    if "CDR Transactions Data" in sheets:
        try:
            tx_result = _ingest_transactions(file_path, db, supplier_map, source_label, max_rows)
            result["inserted"] += tx_result["inserted"]
            result["skipped"]  += tx_result["skipped"]
            result["errors"]   += tx_result["errors"]
        except Exception as e:
            log.error(f"Errore ingestion transactions: {e}")
            result["errors"].append(f"Foglio transazioni: {e}")
    else:
        # Fallback: prova a leggere il file come CSV generico o primo foglio
        log.warning("Foglio 'CDR Transactions Data' non trovato — tentativo lettura generica")
        try:
            if ext in (".xlsx", ".xls"):
                df_generic = pd.read_excel(file_path, sheet_name=0, header=0)
            else:
                df_generic = pd.read_csv(file_path, encoding="utf-8-sig", on_bad_lines="skip")
            log.info(f"  Foglio generico: {len(df_generic)} righe, colonne: {list(df_generic.columns)}")
            result["errors"].append(
                "Formato non standard. Usa un file con foglio 'CDR Transactions Data'."
            )
        except Exception as e:
            result["errors"].append(str(e))

    log.info(
        f"✅ Ingestion completata: {result['inserted']} inseriti | "
        f"{result['updated']} aggiornati | {result['skipped']} saltati | "
        f"{len(result['errors'])} errori"
    )
    return result


# ─── CLI ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
    from database import SessionLocal, init_db

    if len(sys.argv) < 2:
        print("Uso: python utils/ingestion.py <file.xlsx> [max_rows]")
        sys.exit(1)

    fp = sys.argv[1]
    mr = int(sys.argv[2]) if len(sys.argv) > 2 else None

    init_db()
    session = SessionLocal()
    try:
        res = run_ingestion(fp, session, max_rows=mr)
        print(f"\n{'='*50}")
        print(f"Risultato ingestion:")
        print(f"  Inseriti:  {res['inserted']}")
        print(f"  Aggiornati: {res['updated']}")
        print(f"  Saltati:   {res['skipped']}")
        print(f"  Errori:    {len(res['errors'])}")
        if res["errors"]:
            print("\nPrimi 5 errori:")
            for e in res["errors"][:5]:
                print(f"  - {e}")
    finally:
        session.close()
