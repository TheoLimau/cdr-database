# utils/seed_demo.py
# Popola il database con dati demo realistici per testare l'applicazione
# Uso: python utils/seed_demo.py

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database import SessionLocal, init_db
from models.supplier import Supplier
from models.transaction import Transaction
from datetime import date
import random

SUPPLIERS = [
    {"name": "Climeworks AG",          "method": "DAC",                    "location_country": "Iceland",    "location_region": "Europe",   "certification": "Puro.earth",   "price_per_tonne": 1000.0},
    {"name": "Carbon Engineering",     "method": "DAC",                    "location_country": "Canada",     "location_region": "Americas", "certification": "Verra",        "price_per_tonne": 800.0},
    {"name": "Charm Industrial",       "method": "Bio-oil injection",      "location_country": "USA",        "location_region": "Americas", "certification": "Puro.earth",   "price_per_tonne": 600.0},
    {"name": "Running Tide",           "method": "Ocean biomass sinking",  "location_country": "USA",        "location_region": "Americas", "certification": "Gold Standard","price_per_tonne": 500.0},
    {"name": "Heirloom Carbon",        "method": "Enhanced Weathering",    "location_country": "USA",        "location_region": "Americas", "certification": "Verra",        "price_per_tonne": 550.0},
    {"name": "Planetary Technologies", "method": "Ocean Alkalinity",       "location_country": "Canada",     "location_region": "Americas", "certification": "Verra",        "price_per_tonne": 450.0},
    {"name": "Carbfix",                "method": "Mineral Carbonation",    "location_country": "Iceland",    "location_region": "Europe",   "certification": "Puro.earth",   "price_per_tonne": 900.0},
    {"name": "Novamont",               "method": "BECCS",                  "location_country": "Italy",      "location_region": "Europe",   "certification": "Gold Standard","price_per_tonne": 200.0},
    {"name": "Drax Group",             "method": "BECCS",                  "location_country": "UK",         "location_region": "Europe",   "certification": "Verra",        "price_per_tonne": 150.0},
    {"name": "GreenSand",              "method": "Enhanced Weathering",    "location_country": "Netherlands","location_region": "Europe",   "certification": "Puro.earth",   "price_per_tonne": 250.0},
    {"name": "Cquest Tech",            "method": "Biochar",                "location_country": "UK",         "location_region": "Europe",   "certification": "EBC",          "price_per_tonne": 180.0},
    {"name": "Pacific Biochar",        "method": "Biochar",                "location_country": "USA",        "location_region": "Americas", "certification": "Verra",        "price_per_tonne": 200.0},
    {"name": "SeaForester",            "method": "Blue Carbon / Kelp",     "location_country": "Australia",  "location_region": "Oceania",  "certification": "Gold Standard","price_per_tonne": 300.0},
    {"name": "TreeAid",                "method": "Reforestation",          "location_country": "Ghana",      "location_region": "Africa",   "certification": "Gold Standard","price_per_tonne": 15.0},
    {"name": "South Pole",             "method": "REDD+",                  "location_country": "Switzerland","location_region": "Europe",   "certification": "Verra",        "price_per_tonne": 12.0},
]

PURCHASERS = [
    ("Microsoft", "USA", "Tech"),
    ("Google", "USA", "Tech"),
    ("Stripe", "USA", "Finance"),
    ("Shopify", "Canada", "Tech"),
    ("Swiss Re", "Switzerland", "Insurance"),
    ("McKinsey & Company", "USA", "Consulting"),
    ("Workday", "USA", "Tech"),
    ("Autodesk", "USA", "Tech"),
    ("H&M Group", "Sweden", "Fashion"),
    ("Volkswagen", "Germany", "Automotive"),
    ("Total Energies", "France", "Energy"),
    ("Unilever", "UK", "Consumer Goods"),
    ("JPMorgan Chase", "USA", "Finance"),
    ("BlackRock", "USA", "Finance"),
    ("IKEA Group", "Sweden", "Retail"),
    ("Amazon", "USA", "Tech"),
    ("Apple", "USA", "Tech"),
    ("Salesforce", "USA", "Tech"),
    ("Netflix", "USA", "Entertainment"),
    ("Spotify", "Sweden", "Entertainment"),
]

STATUSES = ["delivered", "contracted", "retired", "pending"]
REGISTRIES = ["Verra", "Gold Standard", "Puro.earth", "American Carbon Registry", "Climate Action Reserve"]


def seed():
    init_db()
    db = SessionLocal()
    try:
        # Controlla se già popolato
        from sqlalchemy import func
        count = db.query(func.count(Supplier.id)).scalar()
        if count > 0:
            print(f"Database già popolato ({count} suppliers). Skipping seed.")
            return

        print("🌱 Seeding database con dati demo...")

        # Crea suppliers
        supplier_objs = []
        for s in SUPPLIERS:
            sup = Supplier(**s)
            db.add(sup)
            supplier_objs.append(sup)
        db.flush()

        # Crea transazioni
        tx_count = 0
        random.seed(42)
        for year in range(2019, 2025):
            for _ in range(random.randint(20, 50)):
                sup = random.choice(supplier_objs)
                purchaser, p_country, p_sector = random.choice(PURCHASERS)
                tonnes = round(random.uniform(100, 50000), 1)
                price  = sup.price_per_tonne * random.uniform(0.8, 1.2)
                status = random.choices(STATUSES, weights=[35,30,25,10])[0]
                registry = random.choice(REGISTRIES)
                tx_date  = date(year, random.randint(1,12), random.randint(1,28))

                tx = Transaction(
                    date=tx_date,
                    year=year,
                    tonnes=tonnes,
                    price_per_tonne=round(price, 2),
                    total_value=round(tonnes * price, 2),
                    status=status,
                    delivery_year=year + random.randint(0, 3),
                    purchaser=purchaser,
                    purchaser_country=p_country,
                    purchaser_sector=p_sector,
                    registry=registry,
                    source_file="demo_seed",
                    supplier=sup,
                )
                db.add(tx)
                tx_count += 1

        db.commit()
        print(f"✅ Seed completato: {len(supplier_objs)} suppliers | {tx_count} transazioni")
    except Exception as e:
        db.rollback()
        print(f"❌ Errore seed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
