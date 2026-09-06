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

MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb://127.0.0.1:27017"
)

DATABASE_NAME = os.getenv(
    "DATABASE_NAME",
    "parkwise_ai"
)


# --------------------------------------------------
# MongoDB Client
# --------------------------------------------------

client = MongoClient(
    MONGO_URI,
    serverSelectionTimeoutMS=5000
)

db = client[DATABASE_NAME]


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