from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings
import os

MONGO_URL = os.getenv("MONGO_URL")

if not MONGO_URL:
    raise RuntimeError("MONGO_URL environment variable is not set")

client = AsyncIOMotorClient(MONGO_URL)
db = client[os.getenv("MONGODB_DB", "parkwise_ai")]

users = db.users
owners = db.owners
admins = db.admins
parking_lots = db.parking_lots
slots = db.slots
bookings = db.bookings
payments = db.payments
reviews = db.reviews
occupancy = db.occupancy
