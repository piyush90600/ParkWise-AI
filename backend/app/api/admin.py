from fastapi import APIRouter, Depends, HTTPException
from app.core.deps import require_admin
from app.db.mongodb import collection

router = APIRouter()


def clean(d):
    d = dict(d)

    d.pop("_id", None)
    d.pop("password", None)

    return d


# ==========================================
# ADMIN DASHBOARD
# ==========================================

@router.get("/admin/dashboard")
def dashboard(p=Depends(require_admin)):

    owners_collection = collection("owners")
    parking_collection = collection("parking_lots")

    # --------------------------------------
    # FETCH ALL DATA
    # --------------------------------------

    owners = list(
        owners_collection.find({})
    )

    # --------------------------------------
    # OWNER COUNTS
    # --------------------------------------

    pending_owners = 0
    verified_owners = 0
    rejected_owners = 0

    for owner in owners:

        status = str(
            owner.get("status", "pending")
        ).lower().strip()

        if status == "pending":
            pending_owners += 1

        elif status in (
            "approved",
            "verified",
            "active"
        ):
            verified_owners += 1

        elif status == "rejected":
            rejected_owners += 1

    # --------------------------------------
    # ACTIVE PARKING LOTS
    # --------------------------------------

    active_lots = parking_collection.count_documents({
        "status": {
            "$in": [
                "active",
                "approved",
                "verified"
            ]
        }
    })

    # --------------------------------------
    # RECENT PENDING VERIFICATIONS
    # --------------------------------------

    pending_queue = []

    for owner in owners_collection.find(
        {
            "status": "pending"
        }
    ).sort(
        "created_at",
        -1
    ).limit(5):

        data = clean(owner)

        owner_id = (
            data.get("owners_id")
            or data.get("owner_id")
            or data.get("id")
            or ""
        )

        owner_name = (
            data.get("name")
            or data.get("full_name")
            or data.get("owner_name")
            or "Unknown Owner"
        )

        business_name = (
            data.get("businessName")
            or data.get("business_name")
            or data.get("company_name")
            or data.get("parking_name")
            or owner_name
        )

        created_at = (
            data.get("created_at")
            or data.get("submitted")
            or data.get("registered_at")
            or ""
        )

        pending_queue.append({
            "id": owner_id,
            "owner_id": owner_id,
            "owner": owner_name,
            "businessName": business_name,
            "email": data.get("email", ""),
            "submitted": str(created_at),
            "status": "pending"
        })

    # --------------------------------------
    # RECENTLY APPROVED OWNERS
    # --------------------------------------

    recently_approved = []

    for owner in owners_collection.find(
        {
            "status": {
                "$in": [
                    "approved",
                    "verified",
                    "active"
                ]
            }
        }
    ).sort(
        "updated_at",
        -1
    ).limit(5):

        data = clean(owner)

        owner_id = (
            data.get("owners_id")
            or data.get("owner_id")
            or data.get("id")
            or ""
        )

        owner_name = (
            data.get("name")
            or data.get("full_name")
            or data.get("owner_name")
            or "Unknown Owner"
        )

        business_name = (
            data.get("businessName")
            or data.get("business_name")
            or data.get("company_name")
            or data.get("parking_name")
            or owner_name
        )

        recently_approved.append({
            "id": owner_id,
            "owner_id": owner_id,
            "owner": owner_name,
            "businessName": business_name,
            "email": data.get("email", ""),
            "status": "approved"
        })

    # --------------------------------------
    # RESPONSE
    # IMPORTANT:
    # NO admin_id FILTER
    #
    # Isliye ALL ADMINS ko same DB data milega
    # --------------------------------------

    return {
        "status": "success",

        "stats": {
            "pending_owners": pending_owners,
            "verified_owners": verified_owners,
            "active_lots": active_lots,
            "rejected_owners": rejected_owners,
            "open_reports": 0
        },

        "verification_queue": pending_queue,

        "recently_approved": recently_approved
    }

# ==========================================
# GET ALL OWNER VERIFICATIONS
# ==========================================

@router.get("/admin/owners")
def get_all_owner_verifications(
    p=Depends(require_admin)
):

    owners_collection = collection("owners")

    owners = list(
        owners_collection.find({}).sort(
            "created_at",
            -1
        )
    )

    result = []

    for owner in owners:

        data = clean(owner)

        # --------------------------------------
        # OWNER ID
        # --------------------------------------

        owner_id = (
            data.get("owners_id")
            or data.get("owner_id")
            or data.get("id")
            or ""
        )

        # --------------------------------------
        # OWNER NAME
        # --------------------------------------

        owner_name = (
            data.get("name")
            or data.get("full_name")
            or data.get("owner_name")
            or "Unknown Owner"
        )

        # --------------------------------------
        # BUSINESS NAME
        # --------------------------------------

        business_name = (
            data.get("businessName")
            or data.get("business_name")
            or data.get("company_name")
            or data.get("parking_name")
            or owner_name
        )

        # --------------------------------------
        # PARKING LOT
        # --------------------------------------

        parking_lot = (
            data.get("parkingLot")
            or data.get("parking_lot")
            or data.get("parking_name")
            or "—"
        )

        # --------------------------------------
        # EMAIL
        # --------------------------------------

        email = data.get("email", "")

        # --------------------------------------
        # PHONE
        # --------------------------------------

        phone = (
            data.get("phone")
            or data.get("mobile")
            or ""
        )

        # --------------------------------------
        # STATUS
        # --------------------------------------

        raw_status = str(
            data.get("status", "pending")
        ).lower().strip()

        # Normalize all accepted DB statuses
        if raw_status in (
            "approved",
            "verified",
            "active"
        ):
            status = "approved"

        elif raw_status == "rejected":
            status = "rejected"

        else:
            status = "pending"

        # --------------------------------------
        # SUBMITTED DATE
        # --------------------------------------

        submitted = (
            data.get("submitted")
            or data.get("created_at")
            or data.get("registered_at")
            or ""
        )

        if submitted:

            try:
                submitted = str(submitted)

                if "T" in submitted:
                    submitted = submitted.split("T")[0]

            except Exception:
                submitted = str(submitted)

        else:
            submitted = "—"

        # --------------------------------------
        # FINAL RESPONSE
        # --------------------------------------

        result.append({

            "id": owner_id,

            "owner_id": owner_id,

            "owner": owner_name,

            "businessName": business_name,

            "email": email,

            "phone": phone,

            "parkingLot": parking_lot,

            "submitted": submitted,

            "status": status,

            # Original DB data bhi bhej rahe hain
            # taaki verification-detail page use kar sake
            "address": data.get("address", ""),

            "businessRegistration": (
                data.get("businessRegistration")
                or data.get("business_registration")
                or ""
            ),

            "spaces": (
                data.get("spaces")
                or data.get("total_spaces")
                or ""
            ),

            "documents": (
                data.get("documents")
                if isinstance(
                    data.get("documents"),
                    list
                )
                else []
            ),

            "latitude": data.get("latitude"),
            "longitude": data.get("longitude"),

            "price_per_hour": data.get(
                "price_per_hour",
                0
            ),

            "total_slots": data.get(
                "total_slots",
                data.get("spaces", 0)
            ),

            "spaces": data.get(
                "spaces",
                data.get("total_slots", 0)
            ),

            "vehicle_type": data.get(
                "vehicle_type",
                "all"
            ),

            "timing_start": data.get(
                "timing_start",
                ""
            ),

            "timing_end": data.get(
                "timing_end",
                ""
            ),

            "created_at": data.get(
                "created_at",
                ""
            ),

            "updated_at": data.get(
                "updated_at",
                ""
            ),
        })

    # IMPORTANT:
    # Yahan admin_id ka koi filter nahi hai.
    # Isliye har admin ko SAME owners milenge.

    return {
        "status": "success",
        "total": len(result),
        "owners": result
    }


# ==========================================
# GET SINGLE OWNER VERIFICATION
# ==========================================

@router.get("/admin/owners/{owner_id}")
def get_owner_verification(
    owner_id: str,
    p=Depends(require_admin)
):
    owners_collection = collection("owners")
    parking_collection = collection("parking_lots")

    # ==========================================
    # FIND EXACT OWNER
    # ==========================================

    owner = owners_collection.find_one({
        "$or": [
            {"owners_id": owner_id},
            {"owner_id": owner_id},
            {"id": owner_id}
        ]
    })

    if not owner:
        raise HTTPException(
            status_code=404,
            detail="Owner verification not found."
        )

    owner_data = clean(owner)

    # ==========================================
    # OWNER ID
    # ==========================================

    actual_owner_id = (
        owner_data.get("owners_id")
        or owner_data.get("owner_id")
        or owner_data.get("id")
        or owner_id
    )

    # ==========================================
    # OWNER STATUS
    # ==========================================

    raw_status = str(
        owner_data.get("status", "pending")
    ).lower().strip()

    if raw_status in (
        "approved",
        "verified",
        "active"
    ):
        status = "approved"

    elif raw_status == "rejected":
        status = "rejected"

    else:
        status = "pending"

    # ==========================================
    # FIND ALL PARKING LOTS OF THIS OWNER
    # ==========================================

    parking_lots = list(
        parking_collection.find({
            "owner_id": actual_owner_id
        })
    )

    parking_details = []

    for lot in parking_lots:

        lot_data = clean(lot)

        parking_details.append({
            "parking_lots_id": lot_data.get(
                "parking_lots_id",
                ""
            ),

            "owner_id": lot_data.get(
                "owner_id",
                actual_owner_id
            ),

            "name": lot_data.get(
                "name",
                ""
            ),

            "address": lot_data.get(
                "address",
                ""
            ),

            "latitude": lot_data.get(
                "latitude"
            ),

            "longitude": lot_data.get(
                "longitude"
            ),

            "price_per_hour": lot_data.get(
                "price_per_hour",
                0
            ),

            "total_slots": lot_data.get(
                "total_slots",
                0
            ),

            "vehicle_type": lot_data.get(
                "vehicle_type",
                "all"
            ),

            "timing_start": lot_data.get(
                "timing_start",
                ""
            ),

            "timing_end": lot_data.get(
                "timing_end",
                ""
            ),

            "status": lot_data.get(
                "status",
                ""
            ),

            "created_at": str(
                lot_data.get(
                    "created_at",
                    ""
                )
            )
        })

    # ==========================================
    # RETURN COMPLETE VERIFICATION
    # ==========================================

    return {
        "status": "success",

        "owner": {
            # Owner information
            "id": actual_owner_id,
            "owner_id": actual_owner_id,

            "owner": (
                owner_data.get("name")
                or owner_data.get("full_name")
                or owner_data.get("owner_name")
                or "Unknown Owner"
            ),

            "name": owner_data.get(
                "name",
                ""
            ),

            "email": owner_data.get(
                "email",
                ""
            ),

            "phone": (
                owner_data.get("phone")
                or owner_data.get("mobile")
                or ""
            ),

            "status": status,

            "created_at": str(
                owner_data.get(
                    "created_at",
                    ""
                )
            ),

            # Optional owner-side fields
            "address": owner_data.get(
                "address",
                ""
            ),

            "documents": (
                owner_data.get("documents")
                if isinstance(
                    owner_data.get("documents"),
                    list
                )
                else []
            ),

            "submitted": str(
                owner_data.get(
                    "submitted",
                    owner_data.get(
                        "created_at",
                        ""
                    )
                )
            ),

            "updated_at": str(
                owner_data.get(
                    "updated_at",
                    ""
                )
            ),

            # Parking information
            "parking_lots": parking_details,

            # First parking lot for backward compatibility
            "parkingLot": (
                parking_details[0]["name"]
                if parking_details
                else ""
            ),

            "businessName": (
                parking_details[0]["name"]
                if parking_details
                else ""
            )
        }
    }

# ==========================================
# UPDATE OWNER STATUS
# ==========================================

@router.patch("/admin/owners/{owner_id}/status")
def owner_status(
    owner_id: str,
    status: str,
    p=Depends(require_admin)
):

    status = status.lower().strip()

    if status not in (
        "approved",
        "rejected",
        "pending"
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid status"
        )

    owners_collection = collection("owners")

    # ==========================================
    # APPROVED OWNER CANNOT BE REJECTED
    # ==========================================

    existing_owner = owners_collection.find_one({
        "$or": [
            {"owners_id": owner_id},
            {"owner_id": owner_id},
            {"id": owner_id}
        ]
    })

    if not existing_owner:

        raise HTTPException(
            status_code=404,
            detail="Owner not found"
        )


    current_status = str(
        existing_owner.get(
            "status",
            "pending"
        )
    ).lower().strip()


    if (
        current_status in (
            "approved",
            "verified",
            "active"
        )
        and status == "rejected"
    ):

        raise HTTPException(
            status_code=400,
            detail="Approved owner cannot be rejected."
        )
    result = owners_collection.update_one(
        {
            "$or": [
                {"owners_id": owner_id},
                {"owner_id": owner_id},
                {"id": owner_id}
            ]
        },
        {
            "$set": {
                "status": status,
                "updated_at": __import__("datetime").datetime.utcnow()
            }
        }
    )

    if not result.matched_count:
        raise HTTPException(
            status_code=404,
            detail="Owner not found"
        )

    # --------------------------------------
    # APPROVED OWNER
    # => PARKING LOTS ACTIVE
    # --------------------------------------

    if status == "approved":

        collection(
            "parking_lots"
        ).update_many(
            {
                "owner_id": owner_id
            },
            {
                "$set": {
                    "status": "active",
                    "updated_at":
                        __import__("datetime").datetime.utcnow()
                }
            }
        )

    # --------------------------------------
    # REJECTED OWNER
    # => LOTS SHOULD NOT REMAIN ACTIVE
    # --------------------------------------

    elif status == "rejected":

        collection(
            "parking_lots"
        ).update_many(
            {
                "owner_id": owner_id
            },
            {
                "$set": {
                    "status": "rejected",
                    "updated_at":
                        __import__("datetime").datetime.utcnow()
                }
            }
        )

    return {
        "status": "success",
        "owner_id": owner_id,
        "new_status": status
    }


# ==========================================
# PARKING LOT STATUS
# ==========================================

@router.patch("/admin/parking-lots/{lot_id}/status")
def lot_status(
    lot_id: str,
    status: str,
    p=Depends(require_admin)
):

    if status not in (
        "approved",
        "rejected",
        "pending"
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid status"
        )

    result = collection(
        "parking_lots"
    ).update_one(
        {
            "parking_lots_id": lot_id
        },
        {
            "$set": {
                "status": status
            }
        }
    )

    if not result.matched_count:

        raise HTTPException(
            status_code=404,
            detail="Parking lot not found"
        )

    return {
        "status": "success"
    }


# ==========================================
# GET ALL PARKING LOTS FOR ADMIN
# ==========================================

@router.get("/admin/parking-lots")
def get_all_parking_lots(
    p=Depends(require_admin)
):

    parking_collection = collection("parking_lots")
    owners_collection = collection("owners")
    slots_collection = collection("slots")
    bookings_collection = collection("bookings")

    # --------------------------------------
    # FETCH ALL PARKING LOTS
    # IMPORTANT:
    # No admin_id / owner_id filter
    # ALL ADMINS GET SAME DATABASE DATA
    # --------------------------------------

    lots = list(
        parking_collection.find({}).sort(
            "created_at",
            -1
        )
    )

    result = []

    for lot in lots:

        data = clean(lot)

        # ----------------------------------
        # PARKING LOT ID
        # ----------------------------------

        lot_id = (
            data.get("parking_lots_id")
            or data.get("parking_lot_id")
            or data.get("id")
            or ""
        )

        # ----------------------------------
        # OWNER
        # ----------------------------------

        owner_id = (
            data.get("owner_id")
            or ""
        )

        owner = owners_collection.find_one({
            "owners_id": owner_id
        }) or {}

        owner_name = (
            owner.get("name")
            or owner.get("full_name")
            or owner.get("owner_name")
            or "Unknown Owner"
        )

        owner_email = owner.get(
            "email",
            ""
        )

        # ----------------------------------
        # TOTAL SLOTS
        # ----------------------------------

        database_slot_count = slots_collection.count_documents({
            "lot_id": lot_id
        })

        total_slots = database_slot_count



        # ----------------------------------
        # CURRENT OCCUPIED SLOTS
        # ----------------------------------
        # First try slots collection

        occupied_slots = slots_collection.count_documents({
            "lot_id": lot_id,
            "status": {
                "$in": [
                    "occupied",
                    "booked"
                ]
            }
        })

        # ----------------------------------
        # FALLBACK: ACTIVE BOOKINGS
        # ----------------------------------

        if occupied_slots == 0:

            occupied_slots = bookings_collection.count_documents({
                "lot_id": lot_id,
                "status": {
                    "$in": [
                        "confirmed",
                        "active"
                    ]
                }
            })

        occupied_slots = min(
            occupied_slots,
            total_slots
        )

        available_slots = max(
            total_slots - occupied_slots,
            0
        )

        # ----------------------------------
        # OCCUPANCY %
        # ----------------------------------

        occupancy_percentage = (
            round(
                (
                    occupied_slots /
                    total_slots
                ) * 100,
                2
            )
            if total_slots > 0
            else 0
        )

        # ----------------------------------
        # FINAL RESPONSE
        # ----------------------------------

        result.append({

            "parking_lots_id":
                lot_id,

            "owner_id":
                owner_id,

            "owner_name":
                owner_name,

            "owner_email":
                owner_email,

            "name":
                data.get(
                    "name",
                    "Unnamed Parking"
                ),

            "address":
                data.get(
                    "address",
                    "Address not available"
                ),

            "latitude":
                data.get(
                    "latitude"
                ),

            "longitude":
                data.get(
                    "longitude"
                ),

            "price_per_hour":
                float(
                    data.get(
                        "price_per_hour",
                        0
                    ) or 0
                ),

            "total_slots":
                total_slots,

            "occupied_slots":
                occupied_slots,

            "available_slots":
                available_slots,

            "occupancy_percentage":
                occupancy_percentage,

            "vehicle_type":
                data.get(
                    "vehicle_type",
                    "all"
                ),

            "timing_start":
                data.get(
                    "timing_start",
                    ""
                ),

            "timing_end":
                data.get(
                    "timing_end",
                    ""
                ),

            "status":
                str(
                    data.get(
                        "status",
                        "unknown"
                    )
                ).lower(),

            "created_at":
                data.get(
                    "created_at",
                    ""
                )

        })

    # --------------------------------------
    # RESPONSE
    # --------------------------------------

    return {

        "status": "success",

        "total":
            len(result),

        "parking_lots":
            result

    }

# ==========================================
# GET SLOTS FOR ADMIN PARKING LOT
# ==========================================

@router.get("/admin/parking-lots/{lot_id}/slots")
def get_parking_lot_slots(
    lot_id: str,
    p=Depends(require_admin)
):

    slots_collection = collection("slots")

    slots = list(
        slots_collection.find(
            {
                "lot_id": lot_id
            }
        ).sort(
            "slot_number",
            1
        )
    )

    result = []

    for slot in slots:

        data = clean(slot)

        result.append({

            "id":
                data.get(
                    "id",
                    ""
                ),

            "lot_id":
                data.get(
                    "lot_id",
                    lot_id
                ),

            "slot_number":
                data.get(
                    "slot_number",
                    ""
                ),

            "vehicle_type":
                data.get(
                    "vehicle_type",
                    "all"
                ),

            "status":
                str(
                    data.get(
                        "status",
                        "available"
                    )
                ).lower().strip()

        })

    return {

        "status": "success",

        "lot_id":
            lot_id,

        "total":
            len(result),

        "slots":
            result

    }