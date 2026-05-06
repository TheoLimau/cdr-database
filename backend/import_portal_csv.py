#!/usr/bin/env python3
"""
Script di importazione CSV portale CDR.fyi
Colonne (header CSS):
  0  = data annuncio (M/D/YYYY)
  1  = metodo CDR
  2  = supplier
  3  = purchaser
  4  = (prezzo / note — spesso "—")
  5  = marketplace / status (ambiguo)
  6  = tonnes committed
  7  = tonnes delivered
  8  = registry_name
  9  = status (Delivered/Contracted/Partial/Retired)
  10 = note extra
"""

import sys, os, csv, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, date
from typing import Optional
from database import SessionLocal, init_db
from models.supplier import Supplier
from models.transaction import Transaction

# ── helpers ──────────────────────────────────────────────────────────────────

def _clean(v: str) -> Optional[str]:
    v = v.strip().strip('"')
    if not v or v in ("—", "-", "N/A", "n/a", "nan", "None"):
        return None
    return v

def _parse_date(s: str) -> Optional[date]:
    s = s.strip()
    for fmt in ("%m/%d/%Y", "%d/%m/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            pass
    return None

def _parse_float(s: str) -> Optional[float]:
    s = s.strip().replace(",", "").replace(" ", "")
    try:
        return float(s)
    except (ValueError, TypeError):
        return None

VALID_STATUSES = {"Delivered", "Contracted", "Partial", "Retired"}
VALID_MARKETPLACES = {
    "Patch", "Carbonfuture", "Supercritical", "Watershed", "Cnaught",
    "Klimate", "CEEZER", "Climate Impact Partners", "Pachama", "Isometric",
    "South Pole", "Gold Standard", "Puro.earth", "Xpansiv", "BeZero",
    "Sylvera", "ClimateTrade", "Atmosfair", "Climeworks Solutions",
    "Rubicon", "Anew", "Verra", "ACR",
}

def _split_status_marketplace(col5: str, col9: str):
    """
    Nel CSV del portale le colonne 5 e 9 sono ambigue:
    a volte col5 = marketplace e col9 = status,
    a volte col5 = status e col9 = marketplace/vuoto.
    Restituisce (status, marketplace).
    """
    c5 = _clean(col5) or ""
    c9 = _clean(col9) or ""

    # col9 è quasi sempre lo status quando valorizzato
    if c9 in VALID_STATUSES:
        status = c9
        marketplace = c5 if c5 not in VALID_STATUSES else None
    elif c5 in VALID_STATUSES:
        status = c5
        marketplace = c9 if c9 and c9 not in VALID_STATUSES else None
    else:
        # fallback: considera col9 come status se ha senso
        status = c9 if c9 else c5 if c5 else None
        marketplace = c5 if c5 != status else None

    # pulizia marketplace: non accettiamo valori che sembrano status
    if marketplace in VALID_STATUSES:
        marketplace = None
    # se marketplace è uguale al status ignoralo
    if marketplace == status:
        marketplace = None

    return status or None, marketplace or None


# ── main import ───────────────────────────────────────────────────────────────

def import_portal_csv(filepath: str, source_label: str = "portal_csv") -> dict:
    init_db()
    db = SessionLocal()

    # Cache supplier esistenti
    supplier_cache: dict = {}
    for s in db.query(Supplier).all():
        supplier_cache[s.name.strip().lower()] = s

    inserted = 0
    skipped  = 0
    dupes    = 0
    errors   = []

    try:
        with open(filepath, newline="", encoding="utf-8-sig", errors="replace") as f:
            reader = csv.reader(f)
            rows = list(reader)

        # Salta la riga di header (CSS class names)
        data_rows = rows[1:]
        total = len(data_rows)
        print(f"Righe da elaborare: {total}")

        for idx, row in enumerate(data_rows):
            if len(row) < 7:
                skipped += 1
                continue

            # ── Parsing campi ────────────────────────────────────────────────
            raw_date      = _clean(row[0]) or ""
            raw_method    = _clean(row[1])
            raw_supplier  = _clean(row[2])
            raw_purchaser = _clean(row[3])
            # row[4] = prezzo/note (ignoriamo)
            raw_col5      = row[5] if len(row) > 5 else ""
            raw_tonnes    = _clean(row[6]) or "0"
            raw_delivered = _clean(row[7]) if len(row) > 7 else "0"
            raw_col8      = _clean(row[8]) if len(row) > 8 else None  # registry / terza colonna numerica
            raw_col9      = row[9] if len(row) > 9 else ""
            # row[10] = note extra

            ann_date = _parse_date(raw_date)
            if not ann_date:
                skipped += 1
                continue

            year = ann_date.year

            tonnes    = _parse_float(raw_tonnes) or 0.0
            delivered = _parse_float(raw_delivered) or 0.0

            # Terza colonna numerica (col8) — a volte è registry, a volte un numero
            registry = None
            if raw_col8:
                if _parse_float(raw_col8) is None:
                    registry = raw_col8  # è una stringa → registry name

            status, marketplace = _split_status_marketplace(raw_col5, raw_col9)

            # ── Supplier: cerca o crea ────────────────────────────────────────
            supplier_obj = None
            if raw_supplier:
                key = raw_supplier.strip().lower()
                supplier_obj = supplier_cache.get(key)
                if not supplier_obj:
                    supplier_obj = db.query(Supplier).filter(
                        Supplier.name.ilike(raw_supplier.strip())
                    ).first()
                    if not supplier_obj:
                        supplier_obj = Supplier(
                            name=raw_supplier.strip(),
                            technology=raw_method,
                        )
                        db.add(supplier_obj)
                        db.flush()
                    supplier_cache[key] = supplier_obj

            # ── Deduplicazione: stessa data+supplier+tonnes+status ────────────
            existing = db.query(Transaction).filter(
                Transaction.announcement == ann_date,
                Transaction.tonnes == tonnes,
                Transaction.purchaser == (raw_purchaser or "Not Disclosed"),
                Transaction.supplier_id == (supplier_obj.id if supplier_obj else None),
            ).first()
            if existing:
                dupes += 1
                continue

            # ── Inserimento transazione ───────────────────────────────────────
            tx = Transaction(
                announcement    = ann_date,
                year            = year,
                tonnes          = tonnes,
                tonnes_delivered= delivered,
                method          = raw_method,
                status          = status,
                marketplace     = marketplace,
                registry_name   = registry,
                purchaser       = raw_purchaser or "Not Disclosed",
                source_file     = source_label,
                supplier        = supplier_obj,
            )
            db.add(tx)
            inserted += 1

            # Commit ogni 500 righe
            if inserted % 500 == 0:
                db.commit()
                print(f"  ...{inserted} inserite ({idx+1}/{total})")

        db.commit()

        # ── Aggiorna statistiche aggregate dei supplier ───────────────────────
        print("Aggiornamento statistiche supplier…")
        from sqlalchemy import func
        for sup in db.query(Supplier).all():
            stats = db.query(
                func.count(Transaction.id).label("cnt"),
                func.sum(Transaction.tonnes).label("com"),
                func.sum(Transaction.tonnes_delivered).label("del"),
                func.min(Transaction.announcement).label("first"),
                func.max(Transaction.announcement).label("last"),
            ).filter(Transaction.supplier_id == sup.id).one()

            if stats.cnt:
                sup.transaction_count      = stats.cnt
                sup.total_tonnes_committed = float(stats.com or 0)
                sup.total_tonnes_delivered = float(stats.del_ if hasattr(stats,'del_') else 0)
                if stats.first:
                    sup.first_transaction = stats.first.strftime("%d/%m/%Y")
                if stats.last:
                    sup.last_transaction  = stats.last.strftime("%d/%m/%Y")

        db.commit()
        print("Statistiche aggiornate.")

    except Exception as e:
        db.rollback()
        errors.append(str(e))
        print(f"ERRORE: {e}")
        import traceback; traceback.print_exc()
    finally:
        db.close()

    return {"inserted": inserted, "skipped": skipped, "duplicates": dupes, "errors": errors}


if __name__ == "__main__":
    fp = sys.argv[1] if len(sys.argv) > 1 else "/home/user/uploaded_files/portal 06:05:26.csv"
    label = sys.argv[2] if len(sys.argv) > 2 else "portal_06_05_26"
    res = import_portal_csv(fp, label)
    print(f"\n{'='*50}")
    print(f"✅ Inserite:   {res['inserted']}")
    print(f"⏭  Saltate:   {res['skipped']}")
    print(f"🔁 Duplicate: {res['duplicates']}")
    print(f"❌ Errori:    {len(res['errors'])}")
    if res["errors"]:
        for e in res["errors"][:5]:
            print(f"   - {e}")
