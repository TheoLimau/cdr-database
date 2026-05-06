# routers/sync.py
# Endpoint per la sincronizzazione automatica con CDR.fyi API
# e gestione dello stato di aggiornamento

from fastapi import APIRouter, BackgroundTasks, HTTPException
from utils.cdr_api_fetcher import load_sync_state, save_sync_state, run_api_sync
import os
import logging
from datetime import datetime

log = logging.getLogger("sync_router")

router = APIRouter(prefix="/api/sync", tags=["Sync"])


@router.get("/status")
def sync_status():
    """
    Ritorna lo stato attuale della sincronizzazione:
    - ultimo aggiornamento
    - prossima sync pianificata
    - token configurato (sì/no)
    - statistiche ultimo sync
    """
    state = load_sync_state()
    token_configured = bool(os.getenv("CDR_API_TOKEN", "").strip())
    state["token_configured"] = token_configured

    # Aggiungi statistiche DB live
    try:
        from database import SessionLocal
        from models.transaction import Transaction
        from models.supplier import Supplier
        from sqlalchemy import func
        db = SessionLocal()
        state["total_transactions"] = db.query(func.count(Transaction.id)).scalar()
        state["total_suppliers"] = db.query(func.count(Supplier.id)).scalar()
        db.close()
    except Exception as e:
        log.error(f"Errore lettura stats DB: {e}")

    return state


@router.post("/run")
def trigger_sync(background_tasks: BackgroundTasks, full: bool = False):
    """
    Avvia manualmente la sincronizzazione con CDR.fyi API.
    - full=false (default): scarica solo ultimi 30 giorni
    - full=true: scarica tutto dall'inizio (lento)
    """
    token = os.getenv("CDR_API_TOKEN", "").strip()
    if not token:
        raise HTTPException(
            status_code=400,
            detail="CDR_API_TOKEN non configurato. Imposta il token nelle variabili d'ambiente del server."
        )

    # Aggiorna stato a "in_progress"
    state = load_sync_state()
    state["last_sync_result"] = "running"
    state["sync_started_at"] = datetime.now().isoformat()
    save_sync_state(state)

    background_tasks.add_task(run_api_sync, full_sync=full)

    return {
        "status": "started",
        "mode": "full" if full else "incremental",
        "message": f"Sync {'completa' if full else 'incrementale'} avviata in background. "
                   f"Controlla /api/sync/status tra 30-60 secondi.",
    }


@router.post("/configure-token")
def configure_token(token: str):
    """
    Salva il token CDR.fyi nelle variabili d'ambiente del processo corrente.
    NOTA: per persistenza tra riavvii, aggiungere CDR_API_TOKEN nel file .env
    """
    if not token or len(token) < 10:
        raise HTTPException(status_code=400, detail="Token non valido (troppo corto)")

    # Imposta nel processo corrente
    os.environ["CDR_API_TOKEN"] = token.strip()

    # Salva in .env per persistenza
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
    lines = []
    found = False
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            lines = f.readlines()
        for i, line in enumerate(lines):
            if line.startswith("CDR_API_TOKEN="):
                lines[i] = f"CDR_API_TOKEN={token.strip()}\n"
                found = True
                break
    if not found:
        lines.append(f"CDR_API_TOKEN={token.strip()}\n")

    with open(env_path, "w") as f:
        f.writelines(lines)

    # Verifica token
    from utils.cdr_api_fetcher import CDRApiClient
    client = CDRApiClient(token.strip())
    valid = client.test_connection()

    return {
        "status": "saved",
        "token_valid": valid,
        "message": "Token salvato" + (" e verificato ✅" if valid else " ma non valido ❌ — controlla il token"),
    }


@router.delete("/token")
def remove_token():
    """Rimuove il token CDR.fyi dalla configurazione."""
    os.environ.pop("CDR_API_TOKEN", None)

    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            lines = f.readlines()
        lines = [l for l in lines if not l.startswith("CDR_API_TOKEN=")]
        with open(env_path, "w") as f:
            f.writelines(lines)

    state = load_sync_state()
    state["token_configured"] = False
    save_sync_state(state)

    return {"status": "removed", "message": "Token rimosso."}
