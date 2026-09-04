from fastapi import APIRouter, Depends, HTTPException
from app.db.mongodb import collection
from app.core.deps import current_user
from app.schemas.api import ProfileUpdate

def dashboard_data(user_id: str):

    user = collection("users").find_one({
        "users_id": user_id
    })

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    total_bookings = collection("bookings").count_documents({
        "user_id": user_id
    })

    active_bookings = collection("bookings").count_documents({
        "user_id": user_id,
        "status": {
            "$in": ["active", "confirmed", "booked"]
        }
    })

    completed_bookings = collection("bookings").count_documents({
        "user_id": user_id,
        "status": "completed"
    })

    parking_lots = collection("parking_lots").count_documents({})

    return {
        "user": clean(user),

        "stats": {
            "total_bookings": total_bookings,
            "active_bookings": active_bookings,
            "completed_bookings": completed_bookings,
            "parking_lots": parking_lots
        }
    }


router=APIRouter()
def clean(d): d.pop("_id",None); d.pop("password",None); return d
@router.get("/profile/{user_id}")
def profile(user_id:str, p=Depends(current_user)):
    if p.get("sub")!=user_id and p.get("role")!="admin": raise HTTPException(403,"Forbidden")
    for c,f in [("users","users_id"),("owners","owners_id")]:
        d=collection(c).find_one({f:user_id})
        if d:return clean(d)
    raise HTTPException(404,"Profile not found")
@router.put("/profile/{user_id}")
def update_profile(user_id:str,x:ProfileUpdate,p=Depends(current_user)):
    if p.get("sub")!=user_id: raise HTTPException(403,"Forbidden")
    data={k:v for k,v in x.model_dump().items() if v is not None}; c="users" if p.get("role")=="user" else "owners"; f="users_id" if c=="users" else "owners_id"
    collection(c).update_one({f:user_id},{"$set":data}); return profile(user_id,p)


@router.get("/users/{user_id}/dashboard")
def user_dashboard(
    user_id: str,
    p=Depends(current_user)
):

    if p.get("sub") != user_id and p.get("role") != "admin":

        raise HTTPException(
            status_code=403,
            detail="Forbidden"
        )

    return dashboard_data(user_id)