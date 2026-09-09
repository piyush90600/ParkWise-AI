from fastapi import APIRouter, HTTPException
from bson import ObjectId
from datetime import datetime, timezone
from ..database import bookings, parking_lots, slots, payments
from ..schemas import BookingRequest
from ..services.serializers import clean

router=APIRouter(tags=["bookings"])

async def find_lot(data):
    if data.lot_id:
        return await parking_lots.find_one({"$or":[{"parking_lots_id":data.lot_id},{"_id":ObjectId(data.lot_id) if ObjectId.is_valid(data.lot_id) else None}]})
    if data.spot_name:
        return await parking_lots.find_one({"name":data.spot_name})
    return await parking_lots.find_one({"status":{"$in":["active","verified","approved"]}})

@router.post("/book")
async def create_booking(data:BookingRequest):
    lot=await find_lot(data)
    if not lot: raise HTTPException(404,"Parking lot not found")
    lot_id=lot.get("parking_lots_id") or str(lot["_id"])
    total=int(lot.get("total_slots",0) or 0)
    occupied=await bookings.count_documents({"lot_id":lot_id,"status":{"$in":["confirmed","active"]}})
    if occupied>=total: raise HTTPException(409,"No parking slot is available")
    now=datetime.now(timezone.utc)
    booking={"bookings_id":None,"user_id":data.user_id,"slot_id":None,"lot_id":lot_id,
             "parking_name":lot.get("name",""),"start_time":data.start_time or now.isoformat(),
             "end_time":data.end_time or None,"booking_time":now,"price":float(lot.get("price_per_hour",0) or 0),
             "status":"confirmed","created_at":now}
    r=await bookings.insert_one(booking)
    bid=str(r.inserted_id)
    await bookings.update_one({"_id":r.inserted_id},{"$set":{"bookings_id":bid,"id":bid}})
    return {"status":"success","message":"Parking booked successfully!","booking_id":bid,"lot_id":lot_id,"price":booking["price"]}

@router.get("/user/{user_id}")
async def user_bookings(user_id: str):
    """
    Return only bookings created by the logged-in user.
    """

    out = []

    async for booking in bookings.find(
        {"user_id": user_id}
    ).sort("created_at", -1):

        d = clean(booking)

        # -----------------------------------------
        # GET PARKING LOT DETAILS
        # -----------------------------------------

        lot_id = d.get("lot_id")

        lot = None

        if lot_id:
            lot = await parking_lots.find_one({
                "parking_lots_id": lot_id
            })

        # -----------------------------------------
        # PARKING NAME
        # -----------------------------------------

        d["parking_name"] = (
            lot.get("name")
            if lot
            else d.get("parking_name", "Parking Area")
        )

        # -----------------------------------------
        # BOOKING ID
        # -----------------------------------------

        d["id"] = (
            d.get("bookings_id")
            or d.get("id")
            or d.get("_id")
        )

        # -----------------------------------------
        # START / END TIME
        # -----------------------------------------

        start_time = d.get("start_time")
        end_time = d.get("end_time")

        d["start_time"] = start_time
        d["end_time"] = end_time

        # -----------------------------------------
        # DURATION
        # -----------------------------------------

        duration_minutes = 0

        try:

            if start_time and end_time:

                start = datetime.fromisoformat(
                    str(start_time).replace("Z", "+00:00")
                )

                end = datetime.fromisoformat(
                    str(end_time).replace("Z", "+00:00")
                )

                duration_minutes = max(
                    0,
                    int(
                        (end - start).total_seconds() / 60
                    )
                )

        except Exception:

            duration_minutes = 0

        d["duration_minutes"] = duration_minutes

        # -----------------------------------------
        # TOTAL COST
        # -----------------------------------------

        price = float(
            d.get("price", 0) or 0
        )

        if duration_minutes > 0:

            hours = duration_minutes / 60

            d["total_cost"] = round(
                price * hours,
                2
            )

        else:

            d["total_cost"] = price

        # -----------------------------------------
        # STATUS
        # -----------------------------------------

        d["status"] = (
            d.get("status")
            or "confirmed"
        )

        out.append(d)

    return {
        "status": "success",
        "user_id": user_id,
        "bookings": out,
        "total_bookings": len(out)
    }

