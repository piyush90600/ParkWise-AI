from fastapi import APIRouter, HTTPException
from bson import ObjectId
from ..database import users, bookings
from ..schemas import ProfileUpdate
from ..services.serializers import clean

router = APIRouter(tags=["users"])

def oid(v):
    try: return ObjectId(v)
    except: return None

@router.get("/profile/{user_id}")
async def profile(user_id: str):
    doc = await users.find_one({"$or":[{"users_id":user_id},{"_id":oid(user_id)}]})
    if not doc: raise HTTPException(404,"User not found")
    d = clean(doc); d.pop("password",None)
    return {**d, "profile": d}

@router.patch("/profile/{user_id}")
async def update_profile(user_id: str, data: ProfileUpdate):
    updates = {k:v for k,v in data.model_dump().items() if v is not None}
    r = await users.update_one({"$or":[{"users_id":user_id},{"_id":oid(user_id)}]}, {"$set":updates})
    if not r.matched_count: raise HTTPException(404,"User not found")
    return {"status":"success"}

@router.get("/bookings/{user_id}")
async def user_bookings(user_id: str):
    rows=[]
    async for b in bookings.find({"user_id":user_id}).sort("created_at",-1):
        rows.append(clean(b))
    return {"bookings": rows}
