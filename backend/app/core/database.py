from pathlib import Path
from pymongo import MongoClient
from dotenv import load_dotenv
import os


# --------------------------------------------------
# Load .env from backend/app/.env
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parents[1]
ENV_FILE = BASE_DIR / ".env"

load_dotenv(ENV_FILE)


# --------------------------------------------------
# MongoDB Configuration
# --------------------------------------------------

MONGO_URL = os.getenv(
    "MONGO_URL",
    "mongodb://127.0.0.1:27017"
)

MONGODB_DB = os.getenv(
    "MONGODB_DB",
    "parkwise_ai"
)


# --------------------------------------------------
# MongoDB Client
# --------------------------------------------------

client = MongoClient(
    MONGO_URL,
    serverSelectionTimeoutMS=5000
)

db = client[MONGODB_DB]


# --------------------------------------------------
# Collection Helper
# --------------------------------------------------

def collection(name: str):
    return db[name]


# --------------------------------------------------
# MongoDB Connection Test
# --------------------------------------------------

try:
    client.admin.command("ping")
    print("MongoDB connected successfully!")

except Exception as e:
    print("MongoDB connection failed:", e)