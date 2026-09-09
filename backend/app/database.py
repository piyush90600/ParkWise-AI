from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings

client = AsyncIOMotorClient(settings.MONGO_URL)
db = client[settings.MONGODB_DB]

users = db.users
owners = db.owners
admins = db.admins
parking_lots = db.parking_lots
slots = db.slots
bookings = db.bookings
payments = db.payments
reviews = db.reviews
occupancy = db.occupancy
