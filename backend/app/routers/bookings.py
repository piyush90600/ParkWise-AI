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

@router.get("/{user_id}")
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

@router.get("/owner/{owner_id}/bookings")
async def owner_bookings(owner_id:str):
    lot_ids=[]
    async for l in parking_lots.find({"owner_id":owner_id},{"parking_lots_id":1,"_id":1}):
        lot_ids.append(l.get("parking_lots_id") or str(l["_id"]))
    out=[]
    async for b in bookings.find({"lot_id":{"$in":lot_ids}}).sort("created_at",-1):
        d=clean(b)
        u=await __import__("app.database",fromlist=["users"]).users.find_one({"users_id":d.get("user_id")})
        l=await parking_lots.find_one({"parking_lots_id":d.get("lot_id")})
        d["driver_name"]=u.get("name","Unknown") if u else "Unknown"
        d["email"]=u.get("email","") if u else ""
        d["lot_name"]=l.get("name","") if l else d.get("parking_name","")
        d["amount"]=d.get("price",0)
        out.append(d)
    return {"bookings":out}

@router.get("/owner/{owner_id}/dashboard")
async def owner_dashboard(owner_id:str):
    lots=[]
    async for l in parking_lots.find({"owner_id":owner_id}):
        d=clean(l); lid=d.get("parking_lots_id",d.get("_id"))
        d["total_spaces"]=int(d.get("total_slots",0) or 0)
        d["occupied_spaces"]=await bookings.count_documents({"lot_id":lid,"status":{"$in":["confirmed","active"]}})
        lots.append(d)
    b=(await owner_bookings(owner_id))["bookings"]
    return {"parking_lots":lots,"bookings":b,"stats":{
        "total_spaces":sum(x["total_spaces"] for x in lots),
        "occupied_spaces":sum(x["occupied_spaces"] for x in lots),
        "active_bookings":sum(1 for x in b if x.get("status") in ("confirmed","active")),
        "today_revenue":sum(float(x.get("amount",0) or 0) for x in b)
    }}
