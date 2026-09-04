from fastapi import APIRouter, HTTPException
from ..database import owners, parking_lots, bookings, users, reviews
from ..services.serializers import clean

router=APIRouter(prefix="/admin",tags=["admin"])

@router.get("/dashboard")
async def dashboard():
    return {
      "pending_owners": await owners.count_documents({"status":"pending"}),
      "verified_owners": await owners.count_documents({"status":{"$in":["verified","approved","active"]}}),
      "active_lots": await parking_lots.count_documents({"status":{"$in":["active","verified","approved"]}}),
      "open_reports": 0
    }

@router.get("/owners")
async def owner_list():
    arr=[]
    async for x in owners.find().sort("created_at",-1):
        d=clean(x); d.pop("password",None); arr.append(d)
    return {"owners":arr}

@router.patch("/owners/{owner_id}/status")
async def owner_status(owner_id:str,status:str):
    if status not in {"pending","verified","approved","rejected","active"}: raise HTTPException(400,"Invalid status")
    r=await owners.update_one({"owners_id":owner_id},{"$set":{"status":status}})
    if not r.matched_count: raise HTTPException(404,"Owner not found")
    if status in {"verified","approved","active"}:
        await parking_lots.update_many({"owner_id":owner_id},{"$set":{"status":"active"}})
    return {"status":"success"}
