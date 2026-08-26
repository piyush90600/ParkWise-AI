from pathlib import Path
from datetime import datetime
import joblib
import pandas as pd
import sqlite3

from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware


DB_NAME = "parkwise.db"


# ==========================================
# DATABASE
# ==========================================

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    # Bookings table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            spot_name TEXT NOT NULL,
            booking_time TEXT NOT NULL,
            status TEXT NOT NULL
        )
    """)

    # Users / Owners table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            vehicle_type TEXT,
            parking_name TEXT,
            parking_location TEXT,
            capacity INTEGER,
            parking_type TEXT,
            password TEXT NOT NULL,
            role TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()


init_db()


# ==========================================
# FASTAPI
# ==========================================

app = FastAPI(title="ParkWise AI Backend")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# LOAD ML MODEL
# ==========================================

MODEL_PATH = (
    Path(__file__).resolve().parent.parent
    / "ML"
    / "occupancy_model.joblib"
)

model = joblib.load(MODEL_PATH)


# ==========================================
# PREDICTION REQUEST
# ==========================================

class PredictionRequest(BaseModel):
    price: float
    avg_rating: float
    distance_km: float


# ==========================================
# HOME
# ==========================================

@app.get("/")
def home():
    return {
        "message": "ParkWise AI Backend is running!"
    }


# ==========================================
# HEALTH
# ==========================================

@app.get("/health")
def health():
    return {
        "status": "OK"
    }


# ==========================================
# OCCUPANCY PREDICTION
# ==========================================

@app.post("/predict")
def predict_occupancy(data: PredictionRequest):

    input_data = pd.DataFrame([
        {
            "price": data.price,
            "avg_rating": data.avg_rating,
            "distance_km": data.distance_km
        }
    ])

    print("MODEL TYPE:", type(model))

    print(
        "MODEL KEYS:",
        model.keys() if isinstance(model, dict)
        else "Not a dictionary"
    )

    prediction = model["model"].predict(input_data)[0]

    return {
        "predicted_occupancy": round(float(prediction), 2)
    }


# ==========================================
# PARKING DATA
# ==========================================

parking_data = {
    "Metro Hub Express Lot": {
        "total_slots": 100,
        "available_slots": 25
    },

    "Central Station Plaza": {
        "total_slots": 80,
        "available_slots": 30
    },

    "Grand Vista Parking Deck": {
        "total_slots": 120,
        "available_slots": 45
    },

    "City Mall Underpark": {
        "total_slots": 150,
        "available_slots": 60
    },

    "Sector 18 Commercial Lot": {
        "total_slots": 100,
        "available_slots": 35
    }
}


# ==========================================
# GET PARKING
# ==========================================

@app.get("/parking")
def get_parking():
    return parking_data


# ==========================================
# BOOKING REQUEST
# ==========================================

class BookingRequest(BaseModel):
    spot_name: str


# ==========================================
# BOOK PARKING
# ==========================================

@app.post("/book")
def book_parking(data: BookingRequest):

    spot = data.spot_name

    # Check parking location
    if spot not in parking_data:
        return {
            "status": "error",
            "message": "Parking location not found"
        }

    # Check availability
    if parking_data[spot]["available_slots"] <= 0:
        return {
            "status": "error",
            "message": "No parking slots available"
        }

    # Reduce available slots
    parking_data[spot]["available_slots"] -= 1

    booking_time = datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )

    # Save booking in database
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO bookings
        (spot_name, booking_time, status)
        VALUES (?, ?, ?)
    """, (
        spot,
        booking_time,
        "Confirmed"
    ))

    conn.commit()

    booking_id = cursor.lastrowid

    conn.close()

    print(
        f"UPDATED {spot}: "
        f"{parking_data[spot]['available_slots']} slots left"
    )

    return {
        "status": "success",
        "booking_id": booking_id,
        "spot_name": spot,
        "booking_time": booking_time,
        "message": f"Parking spot reserved successfully at {spot}",
        "remaining_slots": parking_data[spot]["available_slots"]
    }


# ==========================================
# REAL-TIME PARKING AVAILABILITY
# ==========================================

@app.get("/parking-spots")
def get_parking_spots():

    return {
        "status": "success",
        "spots": parking_data
    }


# ==========================================
# REGISTER API
# ==========================================

@app.post("/register")
def register(data: dict):

    # --------------------------------------
    # Get data
    # --------------------------------------

    name = data.get("name")

    # Supports both frontend formats
    owner_name = data.get("owner_name") or data.get("name")

    email = data.get("email")
    phone = data.get("phone")

    vehicle_type = data.get("vehicle_type")

    parking_name = data.get("parking_name")
    parking_location = data.get("parking_location")

    capacity = data.get("capacity")
    parking_type = data.get("parking_type")

    password = data.get("password")

    role = data.get("role", "user")


    # --------------------------------------
    # Required fields
    # --------------------------------------

    if not email or not password:
        return {
            "status": "error",
            "message": "Email and password are required"
        }


    # --------------------------------------
    # User / Owner name
    # --------------------------------------

    if role == "park_owner":

        if not owner_name:
            return {
                "status": "error",
                "message": "Owner name is required"
            }

        name = owner_name

    else:

        if not name:
            return {
                "status": "error",
                "message": "Name is required"
            }


    # --------------------------------------
    # Password validation
    # --------------------------------------

    if len(password) < 6:
        return {
            "status": "error",
            "message": "Password must be at least 6 characters"
        }


    # --------------------------------------
    # Database connection
    # --------------------------------------

    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()


    # --------------------------------------
    # Check duplicate email
    # --------------------------------------

    cursor.execute(
        "SELECT id FROM users WHERE email = ?",
        (email,)
    )

    existing_user = cursor.fetchone()


    if existing_user:

        conn.close()

        return {
            "status": "error",
            "message": "Email already registered"
        }


    # --------------------------------------
    # Insert user
    # --------------------------------------

    cursor.execute("""
    INSERT INTO users (
        name,
        email,
        phone,
        vehicle_type,
        parking_name,
        parking_location,
        capacity,
        parking_type,
        password,
        role,
        created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
""", (
    name,
    email,
    phone,
    vehicle_type,
    parking_name,
    parking_location,
    capacity,
    parking_type,
    password,
    role
))


    conn.commit()

    user_id = cursor.lastrowid

    conn.close()


    print(
        f"REGISTERED: {email} | Role: {role}"
    )


    return {
        "status": "success",
        "message": "Registration successful",
        "user_id": user_id,
        "name": name,
        "email": email,
        "role": role
    }


# ==========================================
# LOGIN API
# ==========================================

@app.post("/login")
def login(data: dict):

    email = data.get("email")
    password = data.get("password")


    # --------------------------------------
    # Required fields
    # --------------------------------------

    if not email or not password:
        return {
            "status": "error",
            "message": "Email and password are required"
        }


    # --------------------------------------
    # Database connection
    # --------------------------------------

    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()


    # --------------------------------------
    # Find user
    # --------------------------------------

    cursor.execute("""
        SELECT
            id,
            name,
            email,
            password,
            role
        FROM users
        WHERE email = ?
    """, (email,))


    user = cursor.fetchone()

    conn.close()


    # --------------------------------------
    # Email not found
    # --------------------------------------

    if not user:
        return {
            "status": "error",
            "message": "Email is not registered"
        }


    user_id = user[0]
    name = user[1]
    db_email = user[2]
    db_password = user[3]
    role = user[4]


    # --------------------------------------
    # Password check
    # --------------------------------------

    if password != db_password:
        return {
            "status": "error",
            "message": "Incorrect password"
        }


    # --------------------------------------
    # Login success
    # --------------------------------------

    print(
        f"LOGIN SUCCESS: {db_email} | Role: {role}"
    )


    return {
        "status": "success",
        "message": "Login successful",
        "user_id": user_id,
        "name": name,
        "email": db_email,
        "role": role
    }