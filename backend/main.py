from pathlib import Path
from datetime import datetime
from typing import Optional

import sqlite3
import joblib
import pandas as pd

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr


# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
DB_NAME = BASE_DIR / "parkwise.db"

MODEL_PATH = (
    BASE_DIR.parent
    / "ML"
    / "occupancy_model.joblib"
)


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="ParkWise AI Backend",
    description=(
        "AI-driven smart parking recommendation system "
        "with occupancy prediction, dynamic pricing "
        "and predictive heatmaps."
    ),
    version="2.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# DATABASE
# ============================================================

def get_connection():
    conn = sqlite3.connect(
        DB_NAME,
        check_same_thread=False
    )

    conn.row_factory = sqlite3.Row

    return conn


def init_db():

    conn = get_connection()
    cursor = conn.cursor()

    # --------------------------------------------------------
    # USERS
    # --------------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            name TEXT NOT NULL,

            email TEXT UNIQUE NOT NULL,

            phone TEXT,

            vehicle_type TEXT,

            password TEXT NOT NULL,

            role TEXT NOT NULL DEFAULT 'user',

            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # --------------------------------------------------------
    # PARKING LOTS
    # --------------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS parking_lots (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            name TEXT UNIQUE NOT NULL,

            address TEXT,

            latitude REAL,

            longitude REAL,

            total_slots INTEGER NOT NULL,

            available_slots INTEGER NOT NULL,

            base_price REAL NOT NULL DEFAULT 20,

            rating REAL DEFAULT 4.0,

            parking_type TEXT,

            owner_id INTEGER,

            created_at TEXT DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY(owner_id)
            REFERENCES users(id)
        )
    """)

    # --------------------------------------------------------
    # BOOKINGS
    # --------------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS bookings (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            user_id INTEGER,

            parking_id INTEGER NOT NULL,

            booking_time TEXT NOT NULL,

            start_time TEXT,

            end_time TEXT,

            price REAL,

            status TEXT DEFAULT 'Confirmed',

            FOREIGN KEY(user_id)
            REFERENCES users(id),

            FOREIGN KEY(parking_id)
            REFERENCES parking_lots(id)
        )
    """)

    # --------------------------------------------------------
    # OCCUPANCY HISTORY
    # --------------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS occupancy_history (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            parking_id INTEGER NOT NULL,

            occupancy REAL NOT NULL,

            recorded_at TEXT DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY(parking_id)
            REFERENCES parking_lots(id)
        )
    """)

    conn.commit()

    # --------------------------------------------------------
    # SEED PARKING DATA
    # --------------------------------------------------------

    cursor.execute(
        "SELECT COUNT(*) AS count FROM parking_lots"
    )

    count = cursor.fetchone()["count"]

    if count == 0:

        parking_lots = [

            (
                "Metro Hub Express Lot",
                "Metro Hub",
                28.6692,
                77.4538,
                100,
                25,
                15,
                4.6,
                "Open"
            ),

            (
                "Central Station Plaza",
                "Central Station",
                28.6720,
                77.4480,
                80,
                30,
                20,
                4.5,
                "Open"
            ),

            (
                "Grand Vista Parking Deck",
                "Grand Vista",
                28.6620,
                77.4500,
                120,
                45,
                25,
                4.0,
                "Covered"
            ),

            (
                "City Mall Underpark",
                "City Mall",
                28.6750,
                77.4600,
                150,
                60,
                30,
                4.8,
                "Covered"
            ),

            (
                "Sector 18 Commercial Lot",
                "Sector 18",
                28.6650,
                77.4580,
                100,
                35,
                40,
                4.2,
                "Open"
            )
        ]

        cursor.executemany("""
            INSERT INTO parking_lots
            (
                name,
                address,
                latitude,
                longitude,
                total_slots,
                available_slots,
                base_price,
                rating,
                parking_type
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, parking_lots)

        conn.commit()

    conn.close()


init_db()


# ============================================================
# ML MODEL
# ============================================================

model = None

try:

    if MODEL_PATH.exists():

        model = joblib.load(MODEL_PATH)

        print(
            "Occupancy ML model loaded successfully."
        )

    else:

        print(
            f"WARNING: ML model not found at {MODEL_PATH}"
        )

except Exception as error:

    print(
        "WARNING: Could not load ML model:",
        error
    )


# ============================================================
# REQUEST MODELS
# ============================================================

class PredictionRequest(BaseModel):

    price: float
    avg_rating: float
    distance_km: float


class BookingRequest(BaseModel):

    spot_name: str
    user_id: Optional[int] = None


class RegisterRequest(BaseModel):

    name: str
    email: EmailStr

    phone: Optional[str] = None

    vehicle_type: Optional[str] = None

    parking_name: Optional[str] = None

    parking_location: Optional[str] = None

    capacity: Optional[int] = None

    parking_type: Optional[str] = None

    password: str

    role: str = "user"


class LoginRequest(BaseModel):

    email: EmailStr

    password: str


class RecommendationRequest(BaseModel):

    price_weight: float = 0.25

    distance_weight: float = 0.25

    rating_weight: float = 0.20

    availability_weight: float = 0.30


# ============================================================
# PASSWORD HELPERS
# ============================================================

from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


def hash_password(password: str):

    return pwd_context.hash(password)


def verify_password(
    password: str,
    hashed_password: str
):

    return pwd_context.verify(
        password,
        hashed_password
    )


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():

    return {
        "status": "success",
        "message": "ParkWise AI Backend is running!",
        "version": "2.0.0"
    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
def health():

    return {
        "status": "OK",
        "database": "SQLite",
        "ml_model": model is not None
    }


# ============================================================
# OCCUPANCY PREDICTION
# ============================================================

@app.post("/predict")
def predict_occupancy(
    data: PredictionRequest
):

    if model is None:

        raise HTTPException(
            status_code=503,
            detail="Occupancy ML model is unavailable."
        )

    input_data = pd.DataFrame([
        {
            "price": data.price,
            "avg_rating": data.avg_rating,
            "distance_km": data.distance_km
        }
    ])

    try:

        # Your current joblib file contains
        # the actual sklearn model under "model".

        if isinstance(model, dict):

            trained_model = model["model"]

        else:

            trained_model = model

        prediction = trained_model.predict(
            input_data
        )[0]

        prediction = max(
            0,
            min(100, float(prediction))
        )

        return {
            "status": "success",
            "predicted_occupancy": round(
                prediction,
                2
            )
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(error)}"
        )


# ============================================================
# GET ALL PARKING
# ============================================================

@app.get("/parking")
def get_parking():

    conn = get_connection()

    rows = conn.execute("""
        SELECT *
        FROM parking_lots
        ORDER BY name
    """).fetchall()

    conn.close()

    return {
        row["name"]: {

            "id": row["id"],

            "total_slots":
                row["total_slots"],

            "available_slots":
                row["available_slots"],

            "price":
                row["base_price"],

            "rating":
                row["rating"],

            "latitude":
                row["latitude"],

            "longitude":
                row["longitude"]

        }

        for row in rows
    }


# ============================================================
# REAL-TIME PARKING SPOTS
# ============================================================

@app.get("/parking-spots")
def get_parking_spots():

    conn = get_connection()

    rows = conn.execute("""
        SELECT *
        FROM parking_lots
        ORDER BY id
    """).fetchall()

    conn.close()

    spots = {}

    for row in rows:

        total = row["total_slots"]

        available = row["available_slots"]

        occupancy = (
            ((total - available) / total) * 100
            if total > 0
            else 0
        )

        spots[row["name"]] = {

            "id": row["id"],

            "total_slots": total,

            "available_slots": available,

            "occupancy": round(
                occupancy,
                2
            ),

            "price": row["base_price"],

            "rating": row["rating"],

            "latitude": row["latitude"],

            "longitude": row["longitude"]
        }

    return {
        "status": "success",
        "spots": spots
    }


# ============================================================
# DYNAMIC PRICING
# ============================================================

def calculate_dynamic_price(
    base_price,
    occupancy
):

    if occupancy >= 90:

        multiplier = 1.50

    elif occupancy >= 75:

        multiplier = 1.30

    elif occupancy >= 50:

        multiplier = 1.15

    elif occupancy <= 20:

        multiplier = 0.80

    else:

        multiplier = 1.00

    price = base_price * multiplier

    return round(price, 2)


@app.get("/dynamic-pricing/{parking_id}")
def dynamic_pricing(
    parking_id: int
):

    conn = get_connection()

    parking = conn.execute(
        """
        SELECT *
        FROM parking_lots
        WHERE id = ?
        """,
        (parking_id,)
    ).fetchone()

    conn.close()

    if not parking:

        raise HTTPException(
            status_code=404,
            detail="Parking lot not found."
        )

    occupancy = (
        (
            parking["total_slots"]
            - parking["available_slots"]
        )
        / parking["total_slots"]
    ) * 100

    price = calculate_dynamic_price(
        parking["base_price"],
        occupancy
    )

    return {

        "parking_id": parking_id,

        "parking_name":
            parking["name"],

        "occupancy":
            round(occupancy, 2),

        "base_price":
            parking["base_price"],

        "dynamic_price":
            price,

        "price_multiplier":
            round(
                price / parking["base_price"],
                2
            )
    }


# ============================================================
# AI PARKING RECOMMENDATION
# ============================================================

@app.post("/recommendations")
def recommendations(
    weights: RecommendationRequest
):

    conn = get_connection()

    rows = conn.execute("""
        SELECT *
        FROM parking_lots
    """).fetchall()

    conn.close()

    if not rows:

        return {
            "status": "success",
            "recommendations": []
        }

    results = []

    prices = [
        row["base_price"]
        for row in rows
    ]

    distances = []

    # Demo distances.
    # Replace with Google Maps/OSRM routing later.

    default_distances = {
        "Metro Hub Express Lot": 1.8,
        "Central Station Plaza": 1.1,
        "Grand Vista Parking Deck": 2.4,
        "City Mall Underpark": 0.6,
        "Sector 18 Commercial Lot": 1.5
    }

    for row in rows:

        distance = default_distances.get(
            row["name"],
            2.0
        )

        distances.append(distance)

    max_price = max(prices) or 1

    max_distance = max(distances) or 1

    for index, row in enumerate(rows):

        price_score = (
            1 -
            row["base_price"] / max_price
        ) * 100

        distance_score = (
            1 -
            distances[index] / max_distance
        ) * 100

        rating_score = (
            row["rating"] / 5
        ) * 100

        availability_score = (
            row["available_slots"]
            / row["total_slots"]
        ) * 100

        score = (

            price_score *
            weights.price_weight

            +

            distance_score *
            weights.distance_weight

            +

            rating_score *
            weights.rating_weight

            +

            availability_score *
            weights.availability_weight
        )

        results.append({

            "id": row["id"],

            "name": row["name"],

            "price": row["base_price"],

            "distance_km":
                distances[index],

            "rating":
                row["rating"],

            "available_slots":
                row["available_slots"],

            "total_slots":
                row["total_slots"],

            "availability_percent":
                round(
                    availability_score,
                    2
                ),

            "ai_match_score":
                round(score, 2)
        })

    results.sort(
        key=lambda x:
        x["ai_match_score"],
        reverse=True
    )

    return {

        "status": "success",

        "recommendations":
            results
    }


# ============================================================
# BOOK PARKING
# ============================================================

@app.post("/book")
def book_parking(
    data: BookingRequest
):

    conn = get_connection()

    parking = conn.execute(
        """
        SELECT *
        FROM parking_lots
        WHERE name = ?
        """,
        (data.spot_name,)
    ).fetchone()

    if not parking:

        conn.close()

        raise HTTPException(
            status_code=404,
            detail="Parking location not found."
        )

    if parking["available_slots"] <= 0:

        conn.close()

        raise HTTPException(
            status_code=409,
            detail="No parking slots available."
        )

    # --------------------------------------------------------
    # OCCUPANCY
    # --------------------------------------------------------

    occupancy = (
        (
            parking["total_slots"]
            - parking["available_slots"]
        )
        / parking["total_slots"]
    ) * 100

    price = calculate_dynamic_price(
        parking["base_price"],
        occupancy
    )

    booking_time = datetime.now().isoformat()

    # --------------------------------------------------------
    # UPDATE AVAILABILITY
    # --------------------------------------------------------

    cursor = conn.execute(
        """
        UPDATE parking_lots

        SET available_slots =
            available_slots - 1

        WHERE id = ?

        AND available_slots > 0
        """,
        (parking["id"],)
    )

    if cursor.rowcount == 0:

        conn.rollback()
        conn.close()

        raise HTTPException(
            status_code=409,
            detail="Parking slot was just booked by another user."
        )

    # --------------------------------------------------------
    # INSERT BOOKING
    # --------------------------------------------------------

    cursor = conn.execute(
        """
        INSERT INTO bookings
        (
            user_id,
            parking_id,
            booking_time,
            price,
            status
        )

        VALUES (?, ?, ?, ?, ?)
        """,

        (
            data.user_id,
            parking["id"],
            booking_time,
            price,
            "Confirmed"
        )
    )

    booking_id = cursor.lastrowid

    # --------------------------------------------------------
    # OCCUPANCY HISTORY
    # --------------------------------------------------------

    new_available = (
        parking["available_slots"] - 1
    )

    new_occupancy = (
        (
            parking["total_slots"]
            - new_available
        )
        / parking["total_slots"]
    ) * 100

    conn.execute(
        """
        INSERT INTO occupancy_history
        (
            parking_id,
            occupancy
        )

        VALUES (?, ?)
        """,
        (
            parking["id"],
            new_occupancy
        )
    )

    conn.commit()
    conn.close()

    return {

        "status": "success",

        "booking_id":
            booking_id,

        "spot_name":
            data.spot_name,

        "booking_time":
            booking_time,

        "price":
            price,

        "remaining_slots":
            new_available,

        "message":
            f"Parking spot reserved successfully at "
            f"{data.spot_name}"
    }


# ============================================================
# USER REGISTRATION
# ============================================================

@app.post("/register")
def register(
    data: RegisterRequest
):

    if len(data.password) < 8:

        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 8 characters."
        )

    conn = get_connection()

    existing = conn.execute(
        """
        SELECT id
        FROM users
        WHERE email = ?
        """,
        (data.email,)
    ).fetchone()

    if existing:

        conn.close()

        raise HTTPException(
            status_code=409,
            detail="Email already registered."
        )

    hashed_password = hash_password(
        data.password
    )

    cursor = conn.execute(
        """
        INSERT INTO users
        (
            name,
            email,
            phone,
            vehicle_type,
            password,
            role
        )

        VALUES (?, ?, ?, ?, ?, ?)
        """,

        (
            data.name,
            data.email,
            data.phone,
            data.vehicle_type,
            hashed_password,
            data.role
        )
    )

    user_id = cursor.lastrowid

    # --------------------------------------------------------
    # OWNER PARKING LOT
    # --------------------------------------------------------

    if (
        data.role == "park_owner"
        and data.parking_name
        and data.capacity
    ):

        conn.execute(
            """
            INSERT INTO parking_lots
            (
                name,
                address,
                total_slots,
                available_slots,
                base_price,
                parking_type,
                owner_id
            )

            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,

            (
                data.parking_name,
                data.parking_location,
                data.capacity,
                data.capacity,
                20,
                data.parking_type,
                user_id
            )
        )

    conn.commit()
    conn.close()

    return {

        "status": "success",

        "message":
            "Registration successful",

        "user_id":
            user_id,

        "name":
            data.name,

        "email":
            data.email,

        "role":
            data.role
    }


# ============================================================
# LOGIN
# ============================================================

@app.post("/login")
def login(
    data: LoginRequest
):

    conn = get_connection()

    user = conn.execute(
        """
        SELECT *
        FROM users
        WHERE email = ?
        """,
        (data.email,)
    ).fetchone()

    conn.close()

    if not user:

        raise HTTPException(
            status_code=404,
            detail="Email is not registered."
        )

    if not verify_password(
        data.password,
        user["password"]
    ):

        raise HTTPException(
            status_code=401,
            detail="Incorrect password."
        )

    return {

        "status": "success",

        "message":
            "Login successful",

        "user_id":
            user["id"],

        "name":
            user["name"],

        "email":
            user["email"],

        "role":
            user["role"]
    }


# ============================================================
# PREDICTIVE HEATMAP DATA
# ============================================================

@app.get("/heatmap")
def get_heatmap():

    conn = get_connection()

    rows = conn.execute(
        """
        SELECT *
        FROM parking_lots
        """
    ).fetchall()

    conn.close()

    heatmap = []

    for row in rows:

        current_occupancy = (
            (
                row["total_slots"]
                - row["available_slots"]
            )
            / row["total_slots"]
        ) * 100

        predicted = current_occupancy

        # Use ML model when available.

        if model is not None:

            try:

                input_data = pd.DataFrame([
                    {
                        "price":
                            row["base_price"],

                        "avg_rating":
                            row["rating"],

                        "distance_km":
                            1.5
                    }
                ])

                trained_model = (
                    model["model"]
                    if isinstance(model, dict)
                    else model
                )

                predicted = float(
                    trained_model.predict(
                        input_data
                    )[0]
                )

            except Exception:

                predicted = current_occupancy

        predicted = max(
            0,
            min(100, predicted)
        )

        heatmap.append({

            "id":
                row["id"],

            "name":
                row["name"],

            "lat":
                row["latitude"],

            "lng":
                row["longitude"],

            "current_occupancy":
                round(
                    current_occupancy,
                    2
                ),

            "predicted_occupancy":
                round(
                    predicted,
                    2
                ),

            "price":
                row["base_price"],

            "rating":
                row["rating"]
        })

    return {

        "status": "success",

        "locations":
            heatmap
    }


# ============================================================
# BOOKING HISTORY
# ============================================================

@app.get("/bookings/{user_id}")
def booking_history(
    user_id: int
):

    conn = get_connection()

    rows = conn.execute(
        """
        SELECT

            bookings.id,

            parking_lots.name
                AS parking_name,

            bookings.booking_time,

            bookings.price,

            bookings.status

        FROM bookings

        JOIN parking_lots
            ON bookings.parking_id =
               parking_lots.id

        WHERE bookings.user_id = ?

        ORDER BY bookings.id DESC
        """,
        (user_id,)
    ).fetchall()

    conn.close()

    return {

        "status": "success",

        "bookings": [
            dict(row)
            for row in rows
        ]
    }


# ============================================================
# OWNER PARKING DATA
# ============================================================

@app.get("/owner/{owner_id}/parking")
def owner_parking(
    owner_id: int
):

    conn = get_connection()

    rows = conn.execute(
        """
        SELECT *
        FROM parking_lots
        WHERE owner_id = ?
        """,
        (owner_id,)
    ).fetchall()

    conn.close()

    return {

        "status": "success",

        "parking": [
            dict(row)
            for row in rows
        ]
    }


# ============================================================
# STARTUP
# ============================================================

@app.on_event("startup")
def startup():

    print("=" * 60)
    print(" PARKWISE AI BACKEND")
    print("=" * 60)
    print(" API: http://127.0.0.1:8000")
    print(" DOCS: http://127.0.0.1:8000/docs")
    print(
        " ML MODEL:",
        "Loaded" if model else "Unavailable"
    )
    print("=" * 60)