# utils/cdr_api_fetcher.py
# Scarica automaticamente i dati dall'API ufficiale CDR.fyi
# API docs: https://www.cdr.fyi/resources/api-docs
#
# CONFIGURAZIONE:
#   Imposta la variabile d'ambiente CDR_API_TOKEN con il tuo Bearer Token
#   ottenuto da: CDR.fyi → Settings → API Access → Generate New Token
#
#   Opzione 1 (file .env):
#     CDR_API_TOKEN=your_token_here
#
#   Opzione 2 (variabile d'ambiente):
#     export CDR_API_TOKEN=your_token_here
#
#   Senza token: il fetcher opera in modalità "CSV upload only" (aggiornamento manuale)

import os
import logging
import json
from datetime import datetime, date
from typing import Optional
import httpx
from sqlalchemy.orm import Session

from database import SessionLocal
from models.transaction import Transaction
from models.supplier import Supplier

log = logging.getLogger("cdr_api_fetcher")

CDR_API_BASE = "https://api.cdr.fyi/v1"
SYNC_STATE_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "sync_state.json")


# ─────────────────────────────────────────────────────────────────────────────
# Sync State — persiste ultimo aggiornamento su disco
# ─────────────────────────────────────────────────────────────────────────────

def load_sync_state() -> dict:
    """Carica lo stato di sincronizzazione dal file JSON."""
    if os.path.exists(SYNC_STATE_FILE):
        try:
            with open(SYNC_STATE_FILE, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "last_sync": None,
        "last_sync_result": None,
        "last_inserted": 0,
        "last_skipped": 0,
        "last_errors": 0,
        "next_sync": None,
        "mode": "manual",
        "token_configured": False,
        "total_transactions": 0,
        "total_suppliers": 0,
    }


def save_sync_state(state: dict):
    """Salva lo stato di sincronizzazione su disco."""
    os.makedirs(os.path.dirname(SYNC_STATE_FILE), exist_ok=True)
    with open(SYNC_STATE_FILE, "w") as f:
        json.dump(state, f, indent=2, default=str)


# ─────────────────────────────────────────────────────────────────────────────
# CDR.fyi API Client
# ─────────────────────────────────────────────────────────────────────────────

class CDRApiClient:
    """Client per l'API ufficiale CDR.fyi v1."""

    def __init__(self, token: str):
        self.token = token
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        self.base_url = CDR_API_BASE

    def _get(self, endpoint: str, params: dict = None) -> dict:
        url = f"{self.base_url}{endpoint}"
        with httpx.Client(timeout=30) as client:
            resp = client.get(url, headers=self.headers, params=params)
            resp.raise_for_status()
            return resp.json()

    def test_connection(self) -> bool:
        """Verifica che il token sia valido."""
        try:
            self._get("/orders", params={"x-limit": 1})
            return True
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                log.error("❌ Token CDR.fyi non valido (401 Unauthorized)")
            else:
                log.error(f"❌ Errore connessione CDR.fyi: {e}")
            return False
        except Exception as e:
            log.error(f"❌ Errore connessione CDR.fyi: {e}")
            return False

    def fetch_all_orders(self, since_date: Optional[date] = None) -> list[dict]:
        """
        Scarica tutti gli ordini dall'API CDR.fyi.
        Se since_date è specificato, recupera solo gli ordini dopo quella data.
        """
        all_orders = []
        page = 1

        log.info("📥 Inizio download ordini da CDR.fyi API...")

        while True:
            try:
                params = {
                    "x-page": page,
                    "x-limit": 100,
                }
                data = self._get("/orders", params=params)

                # L'API restituisce una lista o un oggetto con 'data'/'items'
                if isinstance(data, list):
                    orders = data
                elif isinstance(data, dict):
                    orders = data.get("data", data.get("items", data.get("orders", [])))
                else:
                    orders = []

                if not orders:
                    break

                # Filtra per data se richiesto
                if since_date:
                    filtered = []
                    for o in orders:
                        ann = o.get("announcement_date") or o.get("date") or o.get("announcement")
                        if ann:
                            try:
                                if isinstance(ann, str):
                                    ann_date = datetime.strptime(ann[:10], "%Y-%m-%d").date()
                                else:
                                    ann_date = ann
                                if ann_date >= since_date:
                                    filtered.append(o)
                            except Exception:
                                filtered.append(o)
                        else:
                            filtered.append(o)
                    all_orders.extend(filtered)

                    # Se tutti filtrati via data, possiamo fermarci (dati ordinati desc)
                    if len(filtered) < len(orders):
                        log.info(f"  Pagina {page}: {len(filtered)}/{len(orders)} ordini dopo {since_date}")
                        break
                else:
                    all_orders.extend(orders)

                log.info(f"  Pagina {page}: +{len(orders)} ordini (totale: {len(all_orders)})")

                # Se meno di 100, siamo all'ultima pagina
                if len(orders) < 100:
                    break

                page += 1

            except httpx.HTTPStatusError as e:
                log.error(f"❌ Errore API pagina {page}: {e}")
                break
            except Exception as e:
                log.error(f"❌ Errore imprevisto pagina {page}: {e}")
                break

        log.info(f"✅ Download completato: {len(all_orders)} ordini totali")
        return all_orders

    def fetch_all_suppliers(self) -> list[dict]:
        """Scarica tutti i supplier dall'API CDR.fyi."""
        all_suppliers = []
        page = 1

        log.info("📥 Download supplier da CDR.fyi API...")

        while True:
            try:
                params = {"x-page": page, "x-limit": 100}
                data = self._get("/suppliers", params=params)

                if isinstance(data, list):
                    suppliers = data
                elif isinstance(data, dict):
                    suppliers = data.get("data", data.get("items", data.get("suppliers", [])))
                else:
                    suppliers = []

                if not suppliers:
                    break

                all_suppliers.extend(suppliers)
                log.info(f"  Pagina {page}: +{len(suppliers)} supplier")

                if len(suppliers) < 100:
                    break
                page += 1

            except Exception as e:
                log.error(f"❌ Errore supplier pagina {page}: {e}")
                break

        log.info(f"✅ Supplier scaricati: {len(all_suppliers)}")
        return all_suppliers


# ─────────────────────────────────────────────────────────────────────────────
# Mapping API → DB Model
# ─────────────────────────────────────────────────────────────────────────────

def _parse_api_date(val) -> Optional[date]:
    """Converte una stringa data API in oggetto date."""
    if not val:
        return None
    if isinstance(val, date):
        return val
    if isinstance(val, datetime):
        return val.date()
    for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%SZ", "%d/%m/%Y", "%m/%d/%Y"):
        try:
            return datetime.strptime(str(val)[:10], fmt[:len(str(val)[:10])]).date()
        except Exception:
            pass
    return None


def _map_order_to_transaction(order: dict, db: Session) -> Optional[Transaction]:
    """
    Mappa un ordine CDR.fyi API a un oggetto Transaction del DB locale.
    Ritorna None se l'ordine è già presente nel DB (duplicato).
    """
    # Campi data
    ann_raw = (order.get("announcement_date") or order.get("date") or
               order.get("announcement") or order.get("created_at"))
    ann_date = _parse_api_date(ann_raw)

    # Supplier lookup — cerca per nome
    supplier_name = (order.get("supplier_name") or order.get("supplier") or
                     order.get("project_name") or "Unknown")
    supplier = db.query(Supplier).filter(Supplier.name == supplier_name).first()
    if not supplier:
        # Crea supplier minimale se non esiste
        supplier = Supplier(
            name=supplier_name,
            technology=order.get("method") or order.get("technology") or "",
            country=order.get("supplier_country") or order.get("country") or "",
        )
        db.add(supplier)
        db.flush()

    # Tonnellate
    tonnes_raw = (order.get("tonnes_purchased") or order.get("tonnes") or
                  order.get("quantity") or order.get("volume") or 0)
    try:
        tonnes = float(str(tonnes_raw).replace(",", ""))
    except Exception:
        tonnes = 0.0

    tonnes_del_raw = (order.get("tonnes_delivered") or order.get("delivered") or 0)
    try:
        tonnes_delivered = float(str(tonnes_del_raw).replace(",", ""))
    except Exception:
        tonnes_delivered = 0.0

    # Metodo
    method = (order.get("method") or order.get("removal_method") or
              order.get("technology") or order.get("type") or "")

    # Status
    status = (order.get("status") or order.get("order_status") or "Contracted")

    # Purchaser
    purchaser = (order.get("purchaser_name") or order.get("purchaser") or
                 order.get("buyer") or "Not Disclosed")

    # Marketplace
    marketplace = (order.get("marketplace") or order.get("platform") or
                   order.get("registry") or "")

    # Check duplicato: stessa data + supplier + tonnes + purchaser
    existing = db.query(Transaction).filter(
        Transaction.announcement == ann_date,
        Transaction.supplier_id == supplier.id,
        Transaction.tonnes == tonnes,
        Transaction.purchaser == purchaser,
    ).first()

    if existing:
        return None

    tx = Transaction(
        announcement=ann_date,
        year=ann_date.year if ann_date else None,
        tonnes=tonnes,
        tonnes_delivered=tonnes_delivered,
        method=method,
        status=status,
        purchaser=purchaser,
        marketplace=marketplace,
        registry_name=order.get("registry_name") or order.get("registry") or "",
        notes=order.get("notes") or order.get("description") or "",
        source_file="cdr_api_auto_sync",
        supplier_id=supplier.id,
    )
    return tx


# ─────────────────────────────────────────────────────────────────────────────
# Funzione principale di sync
# ─────────────────────────────────────────────────────────────────────────────

def run_api_sync(full_sync: bool = False) -> dict:
    """
    Esegue la sincronizzazione con l'API CDR.fyi.

    Args:
        full_sync: Se True, scarica tutti i dati dall'inizio.
                   Se False (default), scarica solo i dati degli ultimi 30 giorni.

    Returns:
        dict con inserted, skipped, errors, mode
    """
    from datetime import timedelta

    token = os.getenv("CDR_API_TOKEN", "").strip()
    state = load_sync_state()

    if not token:
        log.warning("⚠️  CDR_API_TOKEN non configurato — sync API non disponibile.")
        result = {
            "inserted": 0,
            "skipped": 0,
            "errors": 0,
            "mode": "no_token",
            "message": "CDR_API_TOKEN non configurato. Configura il token nelle impostazioni.",
            "success": False,
        }
        state.update({
            "last_sync": datetime.now().isoformat(),
            "last_sync_result": "no_token",
            "token_configured": False,
        })
        save_sync_state(state)
        return result

    client = CDRApiClient(token)

    # Test connessione
    log.info("🔗 Verifica connessione CDR.fyi API...")
    if not client.test_connection():
        result = {
            "inserted": 0,
            "skipped": 0,
            "errors": 1,
            "mode": "api_error",
            "message": "Impossibile connettersi all'API CDR.fyi. Verifica il token.",
            "success": False,
        }
        state.update({
            "last_sync": datetime.now().isoformat(),
            "last_sync_result": "api_error",
            "token_configured": True,
        })
        save_sync_state(state)
        return result

    # Determina data di inizio
    if full_sync:
        since_date = None
        log.info("🔄 Sync completo da inizio dataset...")
    else:
        # Ultimi 30 giorni (overlapping per sicurezza)
        since_date = (datetime.now() - timedelta(days=30)).date()
        log.info(f"🔄 Sync incrementale dal {since_date}...")

    # Scarica ordini
    orders = client.fetch_all_orders(since_date=since_date)

    inserted = 0
    skipped = 0
    errors = 0

    db = SessionLocal()
    try:
        for order in orders:
            try:
                tx = _map_order_to_transaction(order, db)
                if tx:
                    db.add(tx)
                    inserted += 1
                else:
                    skipped += 1

                # Commit ogni 500 righe
                if (inserted + skipped) % 500 == 0:
                    db.commit()
                    log.info(f"  Commit intermedio: {inserted} inserite, {skipped} skip")

            except Exception as e:
                log.error(f"  ❌ Errore riga: {e}")
                errors += 1
                db.rollback()

        db.commit()

        # Aggiorna statistiche supplier
        _update_supplier_stats(db)
        db.commit()

        # Conta totali aggiornati
        from sqlalchemy import func
        from models.transaction import Transaction as TxModel
        from models.supplier import Supplier as SupModel
        total_tx = db.query(func.count(TxModel.id)).scalar()
        total_sup = db.query(func.count(SupModel.id)).scalar()

    finally:
        db.close()

    # Calcola prossima sync (7 giorni)
    from datetime import timedelta
    next_sync = (datetime.now() + timedelta(days=7)).isoformat()

    result = {
        "inserted": inserted,
        "skipped": skipped,
        "errors": errors,
        "mode": "api",
        "message": f"Sync completata: {inserted} nuove, {skipped} duplicate, {errors} errori",
        "success": True,
    }

    state.update({
        "last_sync": datetime.now().isoformat(),
        "last_sync_result": "success" if errors == 0 else "partial",
        "last_inserted": inserted,
        "last_skipped": skipped,
        "last_errors": errors,
        "next_sync": next_sync,
        "mode": "api",
        "token_configured": True,
        "total_transactions": total_tx,
        "total_suppliers": total_sup,
    })
    save_sync_state(state)

    log.info(f"✅ Sync completata: {inserted} inserite, {skipped} duplicate, {errors} errori")
    return result


def _update_supplier_stats(db: Session):
    """Ricalcola le statistiche aggregate per tutti i supplier."""
    from sqlalchemy import func
    suppliers = db.query(Supplier).all()
    for sup in suppliers:
        stats = db.query(
            func.count(Transaction.id),
            func.sum(Transaction.tonnes),
            func.sum(Transaction.tonnes_delivered),
        ).filter(Transaction.supplier_id == sup.id).first()

        sup.transaction_count = stats[0] or 0
        sup.total_tonnes_committed = stats[1] or 0.0
        sup.total_tonnes_delivered = stats[2] or 0.0


# ─────────────────────────────────────────────────────────────────────────────
# CLI standalone
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

    full = "--full" in sys.argv
    print(f"🚀 CDR.fyi API Fetcher — {'FULL SYNC' if full else 'INCREMENTAL SYNC'}")
    result = run_api_sync(full_sync=full)
    print(f"\n📊 Risultato: {result}")
