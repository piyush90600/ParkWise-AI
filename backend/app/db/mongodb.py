from pymongo import MongoClient
from app.core.config import settings

client = MongoClient(settings.mongodb_url, serverSelectionTimeoutMS=5000)
db = client[settings.mongodb_db]

def collection(name: str): return db[name]

def ping(): return client.admin.command("ping")

def create_indexes():
    for c in ["users", "owners", "admins"]: collection(c).create_index("email", unique=True)
    collection("parking_lots").create_index("parking_lots_id", unique=True)
    collection("slots").create_index("id", unique=True)
    collection("bookings").create_index("bookings_id", unique=True)
    collection("bookings").create_index([("user_id", 1), ("start_time", -1)])
    collection("bookings").create_index([("lot_id", 1), ("status", 1)])
    collection("payments").create_index("payments_id", unique=True)
    collection("reviews").create_index("reviews_id", unique=True)
    collection("lot_occupancy_hourly").create_index([("lot_id", 1), ("date", 1), ("hour", 1)])
