"""
Importa il CSV esportato dal portale CDR.fyi nel database SQLite.
Formato atteso: 11 colonne con header CSS (text-gray-900, ecc.)
Colonne: date | method | supplier | purchaser | (ignore) | marketplace_or_status | purchased_t | delivered_t | retired_t | status_or_marketplace | (ignore)
"""
import csv
import sys
import os
import re
from datetime import datetime, date

# Aggiungi il path del backend
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database import SessionLocal, engine
from models.base import Base
from models.supplier import Supplier
from models.transaction import Transaction

STATUS_VALS = {'delivered', 'contracted', 'retired', 'partial'}

def clean_str(v):
    if not v or v.strip() in ('—', '-', ''):
        return None
    return v.strip()

def clean_float(v):
    if not v:
        return None
    v = str(v).replace(',', '').replace(' ', '').strip()
    try:
        return float(v)
    except:
        return None

def clean_date(v):
    if not v:
        return None
    v = v.strip()
    for fmt in ('%m/%d/%Y', '%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y'):
        try:
            return datetime.strptime(v, fmt).date()
        except:
            pass
    return None

def normalize_method(m):
    """Normalizza il nome del metodo CDR."""
    if not m:
        return None
    m = m.strip()
    # Mappa abbreviazioni -> nomi estesi usati nel DB
    mappings = {
        'BiCRS - Biochar Carbon Removal (BCR)': 'Biochar Carbon Removal BCR',
        'Enhanced Weathering (EW)': 'Enhanced Weathering',
        'Direct Air Carbon Capture and Sequestration (DACCS)': 'Direct Air Carbon Capture And Sequestration DACCS',
        'mCDR - Direct Ocean Removal': 'Direct Ocean Removal',
        'BiCRS - Biomass Burial': 'Biomass Geological Sequestration',
        'BiCRS - Bioenergy with CCS (BECCS)': 'Bioenergy With Carbon Capture And Sequestration BECCS',
        'mCDR - Alkalinity Enhancement': 'Alkalinity Enhancement',
        'mCDR - Marine Biomass': 'Marine Biomass Carbon Capture And Sequestration MBCCS',
        'Mineralization': 'Mineralization',
        'BiCRS - Biomass Direct Storage': 'Biomass Direct Storage',
    }
    return mappings.get(m, m)

def get_or_create_supplier(session, name, method):
    """Trova o crea un supplier per nome."""
    if not name:
        return None
    sup = session.query(Supplier).filter(Supplier.name == name).first()
    if not sup:
        sup = Supplier(
            name=name,
            technology=normalize_method(method),
        )
        session.add(sup)
        session.flush()
    return sup

def import_csv(filepath):
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()

    inserted = 0
    updated = 0
    skipped = 0
    errors = []

    with open(filepath, 'r', encoding='utf-8-sig') as f:
        reader = csv.reader(f)
        rows = list(reader)

    data_rows = rows[1:]  # salta header CSS

    print(f"📂 Righe da importare: {len(data_rows)}")

    for i, r in enumerate(data_rows):
        try:
            if len(r) < 7:
                skipped += 1
                continue

            # Leggi colonne
            raw_date   = r[0].strip() if len(r) > 0 else ''
            raw_method = r[1].strip() if len(r) > 1 else ''
            raw_sup    = r[2].strip() if len(r) > 2 else ''
            raw_buyer  = r[3].strip() if len(r) > 3 else ''
            raw_c5     = r[5].strip() if len(r) > 5 else ''
            raw_purch  = r[6].strip() if len(r) > 6 else ''
            raw_deliv  = r[7].strip() if len(r) > 7 else ''
            raw_retir  = r[8].strip() if len(r) > 8 else ''
            raw_c9     = r[9].strip() if len(r) > 9 else ''

            # Disambigua marketplace / status
            c5 = '' if raw_c5 in ('—', '-', '') else raw_c5
            c9 = '' if raw_c9 in ('—', '-', '') else raw_c9

            if c5.lower() in STATUS_VALS:
                status      = c5.capitalize()
                marketplace = ''
            else:
                marketplace = c5
                status      = ''

            if c9.lower() in STATUS_VALS:
                status = c9.capitalize()
            elif c9 and not marketplace:
                marketplace = c9
            # (se c9 è un altro marketplace, lo ignoriamo - è il marketplace del lato acquirente)

            # Conversioni
            txdate    = clean_date(raw_date)
            tonnes    = clean_float(raw_purch)
            delivered = clean_float(raw_deliv)
            retired   = clean_float(raw_retir) or 0.0
            method    = normalize_method(clean_str(raw_method))
            purchaser = clean_str(raw_buyer)
            if purchaser and purchaser.lower() in ('not disclosed', 'undisclosed', 'n/a', 'nd'):
                purchaser = 'Not Disclosed'
            mkt       = clean_str(marketplace)
            sup_name  = clean_str(raw_sup)

            if not tonnes or tonnes <= 0:
                skipped += 1
                continue

            # Supplier
            sup = get_or_create_supplier(session, sup_name, raw_method)
            sup_id = sup.id if sup else None

            # Controlla duplicato: stessa data, supplier, tonnes, purchaser
            existing = session.query(Transaction).filter(
                Transaction.announcement == txdate,
                Transaction.supplier_id == sup_id,
                Transaction.tonnes == tonnes,
                Transaction.purchaser == purchaser,
            ).first()

            if existing:
                # Aggiorna campi se mancanti
                changed = False
                if not existing.status and status:
                    existing.status = status; changed = True
                if not existing.marketplace and mkt:
                    existing.marketplace = mkt; changed = True
                if not existing.tonnes_delivered and delivered:
                    existing.tonnes_delivered = delivered; changed = True
                if changed:
                    updated += 1
                else:
                    skipped += 1
                continue

            # Nuova transazione
            tx = Transaction(
                announcement      = txdate,
                year              = txdate.year if txdate else None,
                method            = method,
                supplier_id       = sup_id,
                purchaser         = purchaser,
                marketplace       = mkt,
                tonnes            = tonnes,
                tonnes_delivered  = delivered,
                status            = status or 'Contracted',
                source_file       = 'portal_csv',
            )
            session.add(tx)
            inserted += 1

            # Commit ogni 200 righe
            if (i + 1) % 200 == 0:
                session.commit()
                print(f"  ✅ Processate {i+1}/{len(data_rows)} righe...")

        except Exception as e:
            errors.append(f"Riga {i+2}: {str(e)[:80]}")
            session.rollback()
            skipped += 1
            continue

    session.commit()

    # Aggiorna statistiche supplier
    print("🔄 Aggiornamento statistiche supplier...")
    for sup in session.query(Supplier).all():
        txs = session.query(Transaction).filter(Transaction.supplier_id == sup.id).all()
        if txs:
            sup.total_tonnes_committed = sum(t.tonnes or 0 for t in txs)
            sup.total_tonnes_delivered = sum(t.tonnes_delivered or 0 for t in txs)
            sup.transaction_count = len(txs)
    session.commit()
    session.close()

    print(f"\n{'='*50}")
    print(f"✅ Importazione completata!")
    print(f"   Inserite:   {inserted}")
    print(f"   Aggiornate: {updated}")
    print(f"   Saltate:    {skipped}")
    if errors:
        print(f"   Errori:     {len(errors)}")
        for e in errors[:5]:
            print(f"     ⚠️  {e}")
    print(f"{'='*50}")
    return inserted, updated, skipped

if __name__ == '__main__':
    csv_path = sys.argv[1] if len(sys.argv) > 1 else '/home/user/uploaded_files/portal 06:05:26.csv'
    import_csv(csv_path)
