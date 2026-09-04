from fastapi import APIRouter, HTTPException
from app.db.mongodb import collection
from app.core.security import verify_password, hash_password, token
from app.schemas.api import RegisterIn, LoginIn
router=APIRouter()

def find_email(email):
    for role,c in [("user","users"),("park_owner","owners"),("admin","admins")]:
        d=collection(c).find_one({"email":email})
        if d:return d,role,c
    return None,None,None

@router.post("/register")
def register(x: RegisterIn):

    # Only user and park owner can register
    if x.role not in ("user", "park_owner", "owner"):
        raise HTTPException(
            status_code=400,
            detail="Only user or park owner registration is allowed"
        )

    # Owner role normalize karo
    role = "park_owner" if x.role == "owner" else x.role

    # Check email in both collections
    existing_user = collection("users").find_one({
        "email": x.email.lower()
    })

    existing_owner = collection("owners").find_one({
        "email": x.email.lower()
    })

    if existing_user or existing_owner:
        raise HTTPException(
            status_code=409,
            detail="Email already registered"
        )

    # -----------------------------
    # USER REGISTRATION
    # -----------------------------

    if role == "user":

        last_user = collection("users").find_one(
            {"users_id": {"$regex": "^U[0-9]+$"}},
            sort=[("users_id", -1)]
        )

        if last_user and last_user.get("users_id"):
            last_number = int(
                last_user["users_id"].replace("U", "")
            )
            new_number = last_number + 1
        else:
            new_number = 101

        user_id = f"U{new_number}"

        user_doc = {
            "users_id": user_id,
            "name": x.name.strip(),
            "email": x.email.lower(),
            "phone": x.phone or "",
            "vehicle_type": x.vehicle_type or "",
            "password": hash_password(x.password)
        }

        collection("users").insert_one(user_doc)

        return {
            "status": "success",
            "message": "User account created successfully",
            "user_id": user_id,
            "role": "user"
        }

    # -----------------------------
    # PARK OWNER REGISTRATION
    # -----------------------------

    last_owner = collection("owners").find_one(
        {"owners_id": {"$regex": "^O[0-9]+$"}},
        sort=[("owners_id", -1)]
    )

    if last_owner and last_owner.get("owners_id"):
        last_number = int(
            last_owner["owners_id"].replace("O", "")
        )
        new_number = last_number + 1
    else:
        new_number = 101

    owner_id = f"O{new_number}"

    owner_doc = {
        "owners_id": owner_id,
        "name": x.name.strip(),
        "email": x.email.lower(),
        "phone": x.phone or "",
        "parking_name": x.parking_name or "",
        "parking_location": x.parking_location or "",
        "capacity": x.capacity or 0,
        "parking_type": x.parking_type or "",
        "password": hash_password(x.password),
        "status": "pending"
    }

    collection("owners").insert_one(owner_doc)

    return {
        "status": "success",
        "message": "Park owner account created successfully",
        "owner_id": owner_id,
        "role": "park_owner"
    }



@router.post("/login")
def login(x:LoginIn):
    d,role,c=find_email(x.email)
    if not d or not verify_password(x.password,d.get("password","")): raise HTTPException(401,"Invalid email or password")
    if role=="park_owner" and d.get("status")=="rejected": raise HTTPException(403,"Owner account rejected")
    uid=d.get("users_id") or d.get("owners_id") or d.get("admins_id")
    return {"status":"success","access_token":token({"sub":uid,"role":role,"name":d.get("name"),"email":d.get("email")}),"user_id":uid,"name":d.get("name"),"email":d.get("email"),"role":role}

@router.post("/admin/login")
def admin_login(x:LoginIn):
    d=collection("admins").find_one({"email":x.email})
    if not d or not verify_password(x.password,d.get("password","")): raise HTTPException(401,"Invalid admin credentials")
    uid=d.get("admins_id")
    return {"status":"success","access_token":token({"sub":uid,"role":"admin","name":d.get("name"),"email":d.get("email")}),"user_id":uid,"name":d.get("name"),"email":d.get("email"),"role":"admin"}
