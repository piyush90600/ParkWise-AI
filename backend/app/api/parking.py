import os
import shutil
from datetime import datetime, timezone, timedelta

import httpx

from fastapi import (
    APIRouter,
    Query,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form,
)

from app.services.ml_service import distance_km, recommendation
from app.core.deps import current_user, require_owner
from app.schemas.api import RecommendationIn, BookingIn, ParkingLotIn

# IMPORTANT:
# Change this import only if your project uses a different database file.
from app.core.database import collection


router = APIRouter()


# ============================================================
# COMMON HELPERS
# ============================================================

def serialize(data):
    """
    Convert MongoDB document into JSON-safe dictionary.
    """
    if not data:
        return {}

    data = dict(data)
    data.pop("_id", None)

    # Convert datetime values into ISO strings.
    for key, value in list(data.items()):
        if isinstance(value, datetime):
            data[key] = value.isoformat()

    return data


def availability(lot_id):
    """
    Return total and available slots for a parking lot.
    """

    total = collection("slots").count_documents({
        "lot_id": lot_id
    })

    occupied = collection("slots").count_documents({
        "lot_id": lot_id,
        "status": {
            "$in": ["occupied", "booked"]
        }
    })

    total = total or 0
    occupied = min(occupied or 0, total)

    available = max(total - occupied, 0)

    return total, available


# ============================================================
# PARKING SPOTS
# ============================================================

@router.get("/parking-spots")
def parking_spots():

    out = {}

    lots = collection("parking_lots").find({
        "status": "approved"
    })

    for lot in lots:

        lot_id = lot.get("parking_lots_id")

        if not lot_id:
            continue

        total, available = availability(lot_id)

        lot = serialize(lot)

        lot.update({
            "id": lot_id,
            "total_slots": total or lot.get("total_slots", 0),
            "available_slots": available
        })

        out[lot_id] = lot

    return {
        "spots": out
    }


# ============================================================
# NEARBY PARKING
# ============================================================

@router.get("/nearby-parking")
def nearby_parking(
    latitude: float,
    longitude: float,
    radius_km: float = 5
):

    parking = []

    lots = collection("parking_lots").find({
        "status": "approved"
    })

    for lot in lots:

        try:
            lot_latitude = float(lot.get("latitude"))
            lot_longitude = float(lot.get("longitude"))

            distance = distance_km(
                latitude,
                longitude,
                lot_latitude,
                lot_longitude
            )

        except (TypeError, ValueError):
            continue

        if distance <= radius_km:

            lot_id = lot.get("parking_lots_id")

            if not lot_id:
                continue

            total, available = availability(lot_id)

            lot = serialize(lot)

            lot.update({
                "id": lot_id,
                "distance_km": round(distance, 2),
                "total_slots": total or lot.get("total_slots", 0),
                "available_slots": available
            })

            parking.append(lot)

    parking.sort(
        key=lambda x: x.get("distance_km", float("inf"))
    )

    return {
        "parking": parking
    }


# ============================================================
# RECOMMENDATIONS
# ============================================================

@router.post("/recommendations")
def recommendations(data: RecommendationIn):

    lots = list(
        collection("parking_lots").find({
            "status": "approved"
        })
    )

    weights = {
        "availability": data.availability_weight,
        "rating": data.rating_weight,
        "distance": data.distance_weight,
        "price": data.price_weight
    }

    rows = recommendation(
        lots,
        data.latitude,
        data.longitude,
        weights,
        data.vehicle_type
    )

    result = []

    fields = [
        "parking_lots_id",
        "name",
        "address",
        "latitude",
        "longitude",
        "price_per_hour",
        "total_slots",
        "vehicle_type",
        "distance_km",
        "avg_rating",
        "predicted_occupancy_pct",
        "predicted_available_pct",
        "recommendation_score"
    ]

    for row in rows[:5]:

        item = {}

        for field in fields:
            item[field] = row.get(field)

        result.append(item)

    return {
        "recommendations": result
    }


# ============================================================
# LOCATION SEARCH
# ============================================================

@router.get("/location-search")
async def location_search(
    q: str = Query(..., min_length=2)
):

    local = []

    lots = (
        collection("parking_lots")
        .find({
            "$or": [
                {
                    "name": {
                        "$regex": q,
                        "$options": "i"
                    }
                },
                {
                    "address": {
                        "$regex": q,
                        "$options": "i"
                    }
                }
            ]
        })
        .limit(10)
    )

    for lot in lots:

        local.append({
            "display_name": (
                f"{lot.get('name', '')}, "
                f"{lot.get('address', '')}"
            ),
            "latitude": lot.get("latitude"),
            "longitude": lot.get("longitude")
        })

    if local:
        return {
            "locations": local
        }

    # External location search
    try:

        async with httpx.AsyncClient(
            timeout=6,
            headers={
                "User-Agent": "ParkWise-AI/1.0"
            }
        ) as client:

            response = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={
                    "q": q,
                    "format": "json",
                    "limit": 5
                }
            )

            response.raise_for_status()

            data = response.json()

        return {
            "locations": [
                {
                    "display_name": item.get(
                        "display_name",
                        ""
                    ),
                    "latitude": float(item["lat"]),
                    "longitude": float(item["lon"])
                }
                for item in data
            ]
        }

    except Exception:
        return {
            "locations": []
        }


# ============================================================
# BOOK PARKING
# ============================================================

@router.post("/book")
def book(
    data: BookingIn,
    user=Depends(current_user)
):

    user_id = data.user_id or user.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="User authentication required"
        )

    # --------------------------------------------------------
    # FIND PARKING LOT
    # --------------------------------------------------------

    lot = None

    if data.lot_id:

        lot = collection("parking_lots").find_one({
            "parking_lots_id": data.lot_id
        })

    elif data.spot_name:

        lot = collection("parking_lots").find_one({
            "name": data.spot_name
        })

    if not lot:

        raise HTTPException(
            status_code=404,
            detail="Parking lot not found"
        )

    lot_id = lot.get("parking_lots_id")

    if not lot_id:

        raise HTTPException(
            status_code=500,
            detail="Parking lot ID is missing"
        )

    # --------------------------------------------------------
    # FIND AVAILABLE SLOT
    # --------------------------------------------------------

    slot = None

    if data.slot_id:

        slot = collection("slots").find_one({
            "slots_id": data.slot_id,
            "lot_id": lot_id,
            "status": "available"
        })

    else:

        slot = collection("slots").find_one({
            "lot_id": lot_id,
            "status": "available"
        })

    if not slot:

        raise HTTPException(
            status_code=409,
            detail="No available slot"
        )

    # --------------------------------------------------------
    # TIME
    # --------------------------------------------------------

    start = data.start_time or datetime.now(timezone.utc)

    end = (
        data.end_time
        or start + timedelta(hours=1)
    )

    if end <= start:

        raise HTTPException(
            status_code=400,
            detail="End time must be after start time"
        )

    # --------------------------------------------------------
    # PRICE
    # --------------------------------------------------------

    try:
        price_per_hour = float(
            lot.get("price_per_hour", 0) or 0
        )
    except (TypeError, ValueError):
        price_per_hour = 0.0

    duration_hours = (
        end - start
    ).total_seconds() / 3600

    amount = round(
        price_per_hour * duration_hours,
        2
    )

    # --------------------------------------------------------
    # GENERATE BOOKING ID
    # --------------------------------------------------------

    last_booking = (
        collection("bookings")
        .find({})
        .sort("bookings_id", -1)
        .limit(1)
    )

    booking_number = 101

    last_booking_list = list(last_booking)

    if last_booking_list:

        last_id = last_booking_list[0].get(
            "bookings_id",
            ""
        )

        try:
            if str(last_id).startswith("B"):
                booking_number = (
                    int(str(last_id)[1:]) + 1
                )
        except (ValueError, TypeError):
            booking_number = (
                collection("bookings")
                .count_documents({})
                + 101
            )

    booking_id = f"B{booking_number}"

    # --------------------------------------------------------
    # BOOKING DOCUMENT
    # --------------------------------------------------------

    booking_document = {
        "bookings_id": booking_id,
        "user_id": user_id,

        "slot_id": slot.get("slots_id"),
        "lot_id": lot_id,

        "start_time": start,
        "end_time": end,

        "day_of_week": start.strftime("%A"),
        "is_weekend": start.weekday() >= 5,
        "is_festival": False,

        "weather_condition": "clear",

        "price_at_booking": amount,
        "price": amount,
        "amount": amount,

        "status": "confirmed",

        "created_at": datetime.now(timezone.utc)
    }

    # --------------------------------------------------------
    # INSERT BOOKING
    # --------------------------------------------------------

    collection("bookings").insert_one(
        booking_document
    )

    # --------------------------------------------------------
    # UPDATE SLOT
    # --------------------------------------------------------

    collection("slots").update_one(
        {
            "slots_id": slot.get("slots_id")
        },
        {
            "$set": {
                "status": "booked",
                "booking_id": booking_id,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )

    return {
        "status": "success",
        "message": "Parking booked successfully!",
        "booking": serialize(booking_document)
    }


# ============================================================
# USER BOOKINGS
# ============================================================

@router.get("/bookings/{user_id}")
def user_bookings(
    user_id: str,
    user=Depends(current_user)
):

    # User can see only own bookings.
    # Admin can see any user's bookings.

    if (
        user.get("sub") != user_id
        and user.get("role") != "admin"
    ):

        raise HTTPException(
            status_code=403,
            detail="Forbidden"
        )

    bookings = (
        collection("bookings")
        .find({
            "user_id": user_id
        })
        .sort("start_time", -1)
    )

    result = []

    for booking in bookings:

        lot = (
            collection("parking_lots")
            .find_one({
                "parking_lots_id": booking.get("lot_id")
            })
            or {}
        )

        booking_data = serialize(booking)

        start_time = booking.get("start_time")
        end_time = booking.get("end_time")

        booking_data.update({

            "lot_name":
                lot.get("name", "Parking Area"),

            "parking_name":
                lot.get("name", "Parking Area"),

            "parking_lot":
                lot.get("name", "Parking Area"),

            "address":
                lot.get("address", ""),

            "booking_time":
                start_time,

            "price":
                booking.get(
                    "price_at_booking",
                    booking.get("price", 0)
                ),

            "amount":
                booking.get(
                    "price_at_booking",
                    booking.get("amount", 0)
                )
        })

        result.append(booking_data)

    return {
        "bookings": result
    }


# ============================================================
# OWNER BOOKINGS
# ============================================================

@router.get("/owner/{owner_id}/bookings")
def owner_bookings(
    owner_id: str,
    owner=Depends(require_owner)
):

    # --------------------------------------------------------
    # SECURITY
    # --------------------------------------------------------

    if owner.get("sub") != owner_id:

        raise HTTPException(
            status_code=403,
            detail="Forbidden"
        )

    # --------------------------------------------------------
    # OWNER PARKING LOTS
    # --------------------------------------------------------

    owner_lots = list(
        collection("parking_lots").find(
            {
                "owner_id": owner_id
            },
            {
                "parking_lots_id": 1
            }
        )
    )

    lot_ids = [
        lot.get("parking_lots_id")
        for lot in owner_lots
        if lot.get("parking_lots_id")
    ]

    if not lot_ids:

        return {
            "owner_id": owner_id,
            "total_bookings": 0,
            "bookings": []
        }

    # --------------------------------------------------------
    # BOOKINGS
    # --------------------------------------------------------

    bookings = list(
        collection("bookings")
        .find({
            "lot_id": {
                "$in": lot_ids
            }
        })
        .sort(
            "start_time",
            -1
        )
    )

    result = []

    for booking in bookings:

        booking_data = serialize(
            booking
        )

        # ----------------------------------------------------
        # DRIVER
        # ----------------------------------------------------

        user = (
            collection("users")
            .find_one({
                "users_id": booking.get("user_id")
            })
            or {}
        )

        # ----------------------------------------------------
        # PARKING LOT
        # ----------------------------------------------------

        lot = (
            collection("parking_lots")
            .find_one({
                "parking_lots_id":
                    booking.get("lot_id")
            })
            or {}
        )

        # ----------------------------------------------------
        # DATE / TIME
        # ----------------------------------------------------

        start_time = booking.get(
            "start_time"
        )

        date_value = "—"
        time_value = "—"

        if start_time:

            if isinstance(
                start_time,
                datetime
            ):

                date_value = start_time.strftime(
                    "%d %b %Y"
                )

                time_value = start_time.strftime(
                    "%I:%M %p"
                )

            else:

                try:

                    parsed_time = datetime.fromisoformat(
                        str(start_time)
                        .replace(
                            "Z",
                            "+00:00"
                        )
                    )

                    date_value = parsed_time.strftime(
                        "%d %b %Y"
                    )

                    time_value = parsed_time.strftime(
                        "%I:%M %p"
                    )

                except Exception:

                    date_value = str(
                        start_time
                    )

        # ----------------------------------------------------
        # AMOUNT
        # ----------------------------------------------------

        amount = (
            booking.get("price_at_booking")
            or booking.get("price")
            or booking.get("amount")
            or 0
        )

        try:
            amount = float(amount)
        except (
            TypeError,
            ValueError
        ):
            amount = 0.0

        # ----------------------------------------------------
        # FINAL BOOKING OBJECT
        # ----------------------------------------------------

        booking_data.update({

            "booking_id": booking.get(
                "bookings_id",
                ""
            ),

            "driver_name": user.get(
                "name",
                "Unknown"
            ),

            "email": user.get(
                "email",
                ""
            ),

            "user_id": booking.get(
                "user_id",
                ""
            ),

            "lot_name": lot.get(
                "name",
                booking.get(
                    "parking_name",
                    "Unknown"
                )
            ),

            "parking_lot": lot.get(
                "name",
                booking.get(
                    "parking_name",
                    "Unknown"
                )
            ),

            "address": lot.get(
                "address",
                ""
            ),

            "date": date_value,
            "time": time_value,

            "amount": amount,
            "price": amount,

            "status": booking.get(
                "status",
                "Pending"
            )
        })

        result.append(
            booking_data
        )

    return {
        "owner_id": owner_id,
        "total_bookings": len(result),
        "bookings": result
    }


# ============================================================
# OWNER DASHBOARD
# ============================================================

@router.get("/owner/{owner_id}/dashboard")
def owner_dashboard(
    owner_id: str,
    owner=Depends(require_owner)
):

    # --------------------------------------------------------
    # SECURITY
    # --------------------------------------------------------

    if owner.get("sub") != owner_id:

        raise HTTPException(
            status_code=403,
            detail="Forbidden"
        )

    # --------------------------------------------------------
    # OWNER PARKING LOTS
    # --------------------------------------------------------

    lots = list(
        collection("parking_lots").find({
            "owner_id": owner_id
        })
    )

    lot_ids = [
        lot.get("parking_lots_id")
        for lot in lots
        if lot.get("parking_lots_id")
    ]

    # --------------------------------------------------------
    # TOTAL SPACES
    # --------------------------------------------------------

    total_spaces = 0

    for lot_id in lot_ids:

        total_spaces += (
            collection("slots")
            .count_documents({
                "lot_id": lot_id
            })
        )

    # --------------------------------------------------------
    # OCCUPIED SPACES
    # --------------------------------------------------------

    occupied_spaces = 0

    for lot_id in lot_ids:

        occupied_spaces += (
            collection("slots")
            .count_documents({
                "lot_id": lot_id,
                "status": {
                    "$in": [
                        "occupied",
                        "booked"
                    ]
                }
            })
        )

    occupied_spaces = min(
        occupied_spaces,
        total_spaces
    )

    available_spaces = max(
        total_spaces - occupied_spaces,
        0
    )

    # --------------------------------------------------------
    # ALL BOOKINGS
    # --------------------------------------------------------

    all_bookings = []

    if lot_ids:

        all_bookings = list(
            collection("bookings")
            .find({
                "lot_id": {
                    "$in": lot_ids
                }
            })
            .sort(
                "start_time",
                -1
            )
        )

    # --------------------------------------------------------
    # ACTIVE BOOKINGS
    # --------------------------------------------------------

    active_statuses = {
        "confirmed",
        "active"
    }

    active_bookings = sum(
        1
        for booking in all_bookings
        if str(
            booking.get(
                "status",
                ""
            )
        ).lower()
        in active_statuses
    )

    # --------------------------------------------------------
    # TOTAL REVENUE
    # --------------------------------------------------------

    total_revenue = 0.0

    revenue_statuses = {
        "confirmed",
        "active",
        "completed"
    }

    for booking in all_bookings:

        status = str(
            booking.get(
                "status",
                ""
            )
        ).lower()

        if status not in revenue_statuses:
            continue

        amount = (
            booking.get("price_at_booking")
            or booking.get("price")
            or booking.get("amount")
            or 0
        )

        try:
            total_revenue += float(
                amount
            )
        except (
            TypeError,
            ValueError
        ):
            continue

    # --------------------------------------------------------
    # RECENT BOOKINGS
    # --------------------------------------------------------

    recent_bookings = all_bookings[:20]

    recent = []

    for booking in recent_bookings:

        user = (
            collection("users")
            .find_one({
                "users_id":
                    booking.get("user_id")
            })
            or {}
        )

        lot = (
            collection("parking_lots")
            .find_one({
                "parking_lots_id":
                    booking.get("lot_id")
            })
            or {}
        )

        booking_data = serialize(
            booking
        )

        amount = (
            booking.get("price_at_booking")
            or booking.get("price")
            or booking.get("amount")
            or 0
        )

        try:
            amount = float(amount)
        except (
            TypeError,
            ValueError
        ):
            amount = 0.0

        booking_data.update({

            "driver_name": user.get(
                "name",
                "Unknown"
            ),

            "email": user.get(
                "email",
                ""
            ),

            "lot_name": lot.get(
                "name",
                "Unknown"
            ),

            "parking_lot": lot.get(
                "name",
                "Unknown"
            ),

            "amount": amount,

            "price": amount,

            "status": booking.get(
                "status",
                "Pending"
            )
        })

        recent.append(
            booking_data
        )

    # --------------------------------------------------------
    # PARKING LOT RESPONSE
    # --------------------------------------------------------

    parking_lots = []

    for lot in lots:

        lot_data = serialize(
            lot
        )

        lot_id = lot_data.get(
            "parking_lots_id"
        )

        # Get actual slot count from database
        lot_total = (
            collection("slots")
            .count_documents({
                "lot_id": lot_id
            })
        )

        # Fallback to parking lot stored value
        if lot_total == 0:

            try:
                lot_total = int(
                    lot_data.get(
                        "total_slots",
                        0
                    )
                    or 0
                )
            except (
                TypeError,
                ValueError
            ):
                lot_total = 0

        lot_occupied = (
            collection("slots")
            .count_documents({
                "lot_id": lot_id,
                "status": {
                    "$in": [
                        "occupied",
                        "booked"
                    ]
                }
            })
        )

        lot_occupied = min(
            lot_occupied,
            lot_total
        )

        lot_available = max(
            lot_total - lot_occupied,
            0
        )

        lot_data.update({

            "id": lot_id,

            "total_slots": lot_total,

            "total_spaces": lot_total,

            "occupied_spaces": lot_occupied,

            "available_spaces": lot_available,

            "available_slots": lot_available
        })

        parking_lots.append(
            lot_data
        )

    # --------------------------------------------------------
    # FINAL RESPONSE
    # --------------------------------------------------------

    return {

        "owner_id": owner_id,

        "parking_lots":
            parking_lots,

        "bookings":
            recent,

        "stats": {

            "total_spaces":
                total_spaces,

            "occupied_spaces":
                occupied_spaces,

            "available_spaces":
                available_spaces,

            "active_bookings":
                active_bookings,

            "total_bookings":
                len(all_bookings),

            "total_revenue":
                round(
                    total_revenue,
                    2
                )
        }
    }


# ============================================================
# OWNER PARKING LOTS
# ============================================================

@router.get("/owner/{owner_id}/parking-lots")
def owner_lots(
    owner_id: str,
    owner=Depends(require_owner)
):

    # Security
    if owner.get("sub") != owner_id:

        raise HTTPException(
            status_code=403,
            detail="Forbidden"
        )

    lots = collection(
        "parking_lots"
    ).find({
        "owner_id": owner_id
    })

    return {
        "parking_lots": [
            serialize(lot)
            for lot in lots
        ]
    }


# ============================================================
# CREATE PARKING LOT
# ============================================================

@router.post("/owner/{owner_id}/parking-lots")
def create_lot(
    owner_id: str,
    data: ParkingLotIn,
    owner=Depends(require_owner)
):

    # --------------------------------------------------------
    # SECURITY
    # --------------------------------------------------------

    if owner.get("sub") != owner_id:

        raise HTTPException(
            status_code=403,
            detail="Forbidden"
        )

    # --------------------------------------------------------
    # VALIDATION
    # --------------------------------------------------------

    if data.total_slots <= 0:

        raise HTTPException(
            status_code=400,
            detail="Total slots must be greater than 0"
        )

    # --------------------------------------------------------
    # GENERATE PARKING LOT ID
    # --------------------------------------------------------

    last_lot = list(
        collection("parking_lots")
        .find({})
        .sort(
            "parking_lots_id",
            -1
        )
        .limit(1)
    )

    parking_number = 101

    if last_lot:

        last_id = last_lot[0].get(
            "parking_lots_id",
            ""
        )

        try:

            if str(last_id).startswith("P"):

                parking_number = (
                    int(str(last_id)[1:])
                    + 1
                )

        except (
            ValueError,
            TypeError
        ):

            parking_number = (
                collection(
                    "parking_lots"
                ).count_documents({})
                + 101
            )

    parking_id = f"P{parking_number}"

    # --------------------------------------------------------
    # CREATE PARKING LOT
    # --------------------------------------------------------

    lot_data = data.model_dump()

    lot_data.update({

        "parking_lots_id":
            parking_id,

        "owner_id":
            owner_id,

        # New lots wait for admin approval.
        "status":
            "pending",

        "created_at":
            datetime.now(timezone.utc)
    })

    collection(
        "parking_lots"
    ).insert_one(
        lot_data
    )

    # --------------------------------------------------------
    # CREATE SLOTS
    # --------------------------------------------------------

    slots = []

    for index in range(
        1,
        data.total_slots + 1
    ):

        slots.append({

            "slots_id":
                f"{parking_id}-S{index:03d}",

            "lot_id":
                parking_id,

            "slot_number":
                f"A{index:02d}",

            "vehicle_type":
                data.vehicle_type,

            "status":
                "available",

            "created_at":
                datetime.now(timezone.utc)
        })

    if slots:

        collection(
            "slots"
        ).insert_many(
            slots
        )

    return {
        "status": "success",
        "message": "Parking lot created successfully. Waiting for admin approval.",
        "parking_lot": serialize(
            lot_data
        )
    }


# =========================================================
# OWNER PARKING LOT VERIFICATION
# =========================================================

@router.post("/owner/{owner_id}/verification")
async def submit_owner_verification(
    owner_id: str,

    name: str = Form(...),
    owner_name: str = Form(...),
    business_registration: str = Form(""),
    address: str = Form(...),

    latitude: float = Form(...),
    longitude: float = Form(...),

    price_per_hour: float = Form(...),
    total_slots: int = Form(...),

    vehicle_type: str = Form("all"),

    timing_start: str = Form("06:00"),
    timing_end: str = Form("23:00"),

    identity: UploadFile = File(...),
    businessDoc: UploadFile = File(...),
    lotProof: UploadFile = File(...),

    owner=Depends(require_owner)
):

    # =====================================================
    # SECURITY
    # =====================================================

    if owner.get("sub") != owner_id:

        raise HTTPException(
            status_code=403,
            detail="Forbidden"
        )


    # =====================================================
    # BASIC VALIDATION
    # =====================================================

    if total_slots < 1:

        raise HTTPException(
            status_code=400,
            detail="Total slots must be at least 1."
        )


    if price_per_hour < 0:

        raise HTTPException(
            status_code=400,
            detail="Price cannot be negative."
        )


    allowed_extensions = {
        ".pdf",
        ".jpg",
        ".jpeg",
        ".png"
    }


    max_size = 5 * 1024 * 1024


    documents = [
        ("identity", identity),
        ("business_registration", businessDoc),
        ("parking_ownership", lotProof)
    ]


    # =====================================================
    # GENERATE PARKING LOT ID AUTOMATICALLY
    # =====================================================

    last_lot = collection(
        "parking_lots"
    ).find_one(
        {
            "parking_lots_id": {
                "$regex": "^P[0-9]+$"
            }
        },
        sort=[
            ("parking_lots_id", -1)
        ]
    )


    if (
        last_lot and
        last_lot.get("parking_lots_id")
    ):

        last_number = int(
            last_lot[
                "parking_lots_id"
            ][1:]
        )

        new_number = (
            last_number + 1
        )

    else:

        new_number = 101


    parking_lot_id = (
        f"P{new_number}"
    )


    # =====================================================
    # DOCUMENT STORAGE
    # =====================================================

    upload_dir = os.path.join(
        "uploads",
        "owner_verifications",
        owner_id,
        parking_lot_id
    )


    os.makedirs(
        upload_dir,
        exist_ok=True
    )


    saved_documents = []


    try:

        for doc_type, upload in documents:

            extension = os.path.splitext(
                upload.filename or ""
            )[1].lower()


            if extension not in allowed_extensions:

                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Invalid file type for "
                        f"{doc_type}."
                    )
                )


            content = await upload.read()


            if len(content) > max_size:

                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"{upload.filename} "
                        f"exceeds 5MB."
                    )
                )


            safe_name = (
                f"{doc_type}{extension}"
            )


            file_path = os.path.join(
                upload_dir,
                safe_name
            )


            with open(
                file_path,
                "wb"
            ) as file:

                file.write(content)


            saved_documents.append({

                "type": doc_type,

                "filename":
                    upload.filename,

                "path":
                    file_path,

                "uploaded_at":
                    datetime.now(
                        timezone.utc
                    ).isoformat()

            })


    except Exception:

        shutil.rmtree(
            upload_dir,
            ignore_errors=True
        )

        raise


    # =====================================================
    # CREATE PARKING LOT
    # =====================================================

    parking_lot = {

        "parking_lots_id":
            parking_lot_id,

        "owner_id":
            owner_id,

        "name":
            name.strip(),

        "address":
            address.strip(),

        "latitude":
            latitude,

        "longitude":
            longitude,

        "price_per_hour":
            price_per_hour,

        "total_slots":
            total_slots,

        "vehicle_type":
            vehicle_type,

        "timing_start":
            timing_start,

        "timing_end":
            timing_end,

        "status":
            "pending",

        "created_at":
            datetime.now(
                timezone.utc
            )

    }


    collection(
        "parking_lots"
    ).insert_one(
        parking_lot
    )


    # =====================================================
    # AUTOMATIC SLOT CREATION
    # =====================================================

    for i in range(
        1,
        total_slots + 1
    ):

        collection(
            "slots"
        ).insert_one({

            "slots_id":
                f"{parking_lot_id}-S{i:03d}",

            "lot_id":
                parking_lot_id,

            "slot_number":
                f"A{i:02d}",

            "vehicle_type":
                vehicle_type,

            "status":
                "available"

        })


    # =====================================================
    # UPDATE OWNER VERIFICATION DATA
    # =====================================================

    collection(
        "owners"
    ).update_one(
        {
            "owners_id":
                owner_id
        },
        {
            "$set": {

                "name":
                    owner_name.strip(),

                "businessRegistration":
                     business_registration.strip(),
                     
                "businessName":
                    name.strip(),

                "parking_name":
                    name.strip(),

                "parkingLot":
                    name.strip(),

                "address":
                    address.strip(),

                "latitude":
                    latitude,

                "longitude":
                    longitude,

                "price_per_hour":
                    price_per_hour,

                "total_slots":
                    total_slots,

                "spaces":
                    total_slots,

                "vehicle_type":
                    vehicle_type,

                "timing_start":
                    timing_start,

                "timing_end":
                    timing_end,

                "documents":
                    saved_documents,

                "status":
                    "pending",

                "submitted":
                    datetime.now(
                        timezone.utc
                    ),

                "updated_at":
                    datetime.now(
                        timezone.utc
                    )

            }
        }
    )


    # =====================================================
    # RESPONSE
    # =====================================================

    return {

        "status":
            "success",

        "message":
            "Owner verification submitted successfully.",

        "parking_lot_id":
            parking_lot_id,

        "owner_id":
            owner_id,

        "total_slots":
            total_slots,

        "status":
            "pending"

    }
