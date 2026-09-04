from fastapi import APIRouter, HTTPException
from ..database import users, owners, admins, parking_lots
from ..schemas import LoginRequest, RegisterRequest
from ..services.auth import hash_password, verify_password, create_token
from ..services.serializers import clean
from datetime import datetime, timezone

router = APIRouter(tags=["authentication"])

@router.post("/register")
async def register(data: RegisterRequest):
    role = data.role if data.role in {"user","park_owner"} else "user"
    collection = owners if role == "park_owner" else users
    if await collection.find_one({"email": data.email.lower()}):
        raise HTTPException(409, "Email already registered")
    now = datetime.now(timezone.utc)
    if role == "park_owner":
        owner = {
            "owners_id": None, "name": data.name, "email": data.email.lower(),
            "password": hash_password(data.password), "phone": data.phone or "",
            "status": "pending", "created_at": now
        }
        r = await owners.insert_one(owner)
        owner["owners_id"] = str(r.inserted_id)
        await owners.update_one({"_id": r.inserted_id}, {"$set":{"owners_id": owner["owners_id"]}})
        if data.parking_name:
            lot = {
                "parking_lots_id": None, "owner_id": owner["owners_id"],
                "name": data.parking_name, "address": data.parking_location or "",
                "latitude": 0.0, "longitude": 0.0,
                "price_per_hour": 0.0, "total_slots": data.capacity or 0,
                "vehicle_type": data.parking_type or "car",
                "timing_start": "00:00", "timing_end": "23:59",
                "status": "pending", "created_at": now
            }
            lr = await parking_lots.insert_one(lot)
            await parking_lots.update_one({"_id":lr.inserted_id},{"$set":{"parking_lots_id":str(lr.inserted_id)}})
    else:
        user = {
            "users_id": None, "name": data.name, "email": data.email.lower(),
            "password": hash_password(data.password), "phone": data.phone or "",
            "vehicle_type": data.vehicle_type or "", "preferred_price": data.preferred_price or 0,
            "created_at": now
        }
        r = await users.insert_one(user)
        await users.update_one({"_id":r.inserted_id},{"$set":{"users_id":str(r.inserted_id)}})
    return {"status":"success","message":"Account created successfully"}

@router.post("/login")
async def login(data: LoginRequest):
    email = data.email.lower()
    for role, collection, id_field in [("user", users, "users_id"), ("park_owner", owners, "owners_id")]:
        doc = await collection.find_one({"email": email})
        if doc and verify_password(data.password, doc.get("password","")):
            if role == "park_owner" and doc.get("status") == "rejected":
                raise HTTPException(403, "Owner account has been rejected")
            uid = doc.get(id_field) or str(doc["_id"])
            return {"status":"success","access_token":create_token(uid,role),
                    "user_id":uid,"name":doc.get("name",""),"email":email,"role":role}
    raise HTTPException(401, "Invalid email or password")

@router.post("/admin/login")
async def admin_login(data: LoginRequest):
    doc = await admins.find_one({"email": data.email.lower()})
    if not doc or not verify_password(data.password, doc.get("password","")):
        raise HTTPException(401, "Invalid admin credentials")
    aid = doc.get("admins_id") or str(doc["_id"])
    return {"status":"success","access_token":create_token(aid,"admin"),
            "admin_id":aid,"name":doc.get("name",""),"email":data.email.lower(),"role":"admin"}
