"""
init_db_from_dump.py
Carica il database da seed_data.sql se il DB è vuoto.
Eseguito automaticamente al primo avvio su Railway.
"""
import os
import sqlite3
import logging

log = logging.getLogger("init_db_from_dump")

def load_seed_if_empty():
    db_path = os.path.join(os.path.dirname(__file__), "data", "carbon_db.sqlite")
    sql_path = os.path.join(os.path.dirname(__file__), "data", "seed_data.sql")

    os.makedirs(os.path.dirname(db_path), exist_ok=True)

    # Controlla se il DB è già popolato
    if os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path)
            c = conn.cursor()
            c.execute("SELECT COUNT(*) FROM transactions")
            count = c.fetchone()[0]
            conn.close()
            if count > 0:
                print(f"✅ Database già popolato: {count} transazioni — skip seed")
                return
        except Exception:
            pass

    # Carica il seed
    if not os.path.exists(sql_path):
        print("⚠️  seed_data.sql non trovato — skip")
        return

    print("🌱 Caricamento seed_data.sql nel database...")
    try:
        conn = sqlite3.connect(db_path)
        with open(sql_path, "r", encoding="utf-8") as f:
            sql = f.read()
        conn.executescript(sql)
        conn.close()

        # Verifica
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        c.execute("SELECT COUNT(*) FROM transactions")
        tx = c.fetchone()[0]
        c.execute("SELECT COUNT(*) FROM suppliers")
        sup = c.fetchone()[0]
        conn.close()
        print(f"✅ Seed completato: {tx} transazioni, {sup} suppliers")
    except Exception as e:
        print(f"❌ Errore seed: {e}")


if __name__ == "__main__":
    load_seed_if_empty()
