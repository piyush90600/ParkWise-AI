import asyncio, csv, os, sys
from pathlib import Path
from datetime import datetime
sys.path.append(str(Path(__file__).resolve().parents[1]))
from app.database import db

# Dataset folder is located at:
# ParkWise-AI/ml/dataset
BASE = Path(__file__).resolve().parents[2] / "ml" / "dataset"
MAP={"users.csv":"users","owners.csv":"owners","admins.csv":"admins","parking_lots.csv":"parking_lots",
     "slots.csv":"slots","bookings.csv":"bookings","payments.csv":"payments","reviews.csv":"reviews","lot_occupancy_hourly.csv":"occupancy"}

async def run():
    if not BASE.exists():
        print(f"Dataset folder not found: {BASE}")
        return
    for fn,col in MAP.items():
        p=BASE/fn
        if not p.exists(): continue
        with p.open(encoding="utf-8-sig") as f:
            rows=list(csv.DictReader(f))
        if rows:
            await db[col].delete_many({})
            await db[col].insert_many(rows)
            print(col,len(rows))
    print("Import complete.")
asyncio.run(run())
