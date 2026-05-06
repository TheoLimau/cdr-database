# main.py
# Entry point principale dell'applicazione FastAPI
# Carbon Credits & CDR Transactions Database

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from database import init_db
from routers import transactions, suppliers, ingest
from utils.auto_seed import auto_seed_if_empty

# ─── App setup ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Carbon Credits DB",
    description="Banca dati interattiva per crediti di carbonio e transazioni CDR",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(transactions.router)
app.include_router(suppliers.router)
app.include_router(ingest.router)

# ─── Static files (frontend) ──────────────────────────────────────────────────
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(STATIC_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# ─── Startup ──────────────────────────────────────────────────────────────────
@app.on_event("startup")
def on_startup():
    init_db()
    auto_seed_if_empty()
    print("✅ Carbon Credits DB avviato!")
    print("   Docs: http://localhost:8000/api/docs")

# ─── Frontend catch-all (SPA) ─────────────────────────────────────────────────
@app.get("/")
def serve_index():
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Carbon Credits DB API", "docs": "/api/docs"}

@app.get("/{full_path:path}")
def spa_catch_all(full_path: str):
    """Serve l'SPA per qualsiasi route non-API."""
    if full_path.startswith("api/"):
        from fastapi import HTTPException
        raise HTTPException(status_code=404)
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Not found"}
