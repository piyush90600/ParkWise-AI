from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Any

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    name: str = Field(min_length=2)
    email: EmailStr
    password: str = Field(min_length=8)
    phone: Optional[str] = ""
    vehicle_type: Optional[str] = ""
    preferred_price: Optional[float] = 0
    role: str = "user"
    parking_name: Optional[str] = None
    parking_location: Optional[str] = None
    capacity: Optional[int] = None
    parking_type: Optional[str] = None

class BookingRequest(BaseModel):
    user_id: str
    lot_id: Optional[str] = None
    spot_name: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None

class RecommendationRequest(BaseModel):
    latitude: float
    longitude: float
    radius_km: float = 5
    price_weight: float = .20
    distance_weight: float = .25
    rating_weight: float = .20
    availability_weight: float = .35

class LocationQuery(BaseModel):
    q: str

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    vehicle_type: Optional[str] = None
