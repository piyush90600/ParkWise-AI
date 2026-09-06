import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()


# MongoDB URI
MONGO_URI = os.getenv("MONGO_URI")

# Database name
DATABASE_NAME = os.getenv(
    "DATABASE_NAME",
    "parkwise_ai"
)


# MongoDB connection
client = MongoClient(
    MONGO_URI,
    serverSelectionTimeoutMS=5000
)

db = client[DATABASE_NAME]


def collection(name: str):
    """
    Return MongoDB collection.
    Example:
        collection("parking_lots")
        collection("slots")
        collection("owners")
    """
    return db[name]


# Test MongoDB connection
try:
    client.admin.command("ping")
    print("MongoDB connected successfully!")
except Exception as e:
    print("MongoDB connection failed:", e)