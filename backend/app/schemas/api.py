from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)

    phone: Optional[str] = None
    vehicle_type: Optional[str] = "car"

    role: str = "user"

    # Owner registration fields
    parking_name: Optional[str] = None
    parking_location: Optional[str] = None
    capacity: Optional[int] = None
    parking_type: Optional[str] = None

class LoginIn(BaseModel): 
    email:EmailStr; 
    password:str
class BookingIn(BaseModel): spot_name:Optional[str]=None; user_id:Optional[str]=None; slot_id:Optional[str]=None; lot_id:Optional[str]=None; start_time:Optional[datetime]=None; end_time:Optional[datetime]=None
class BookingRequest(BaseModel):
    user_id: str
    lot_id: Optional[str] = None
    spot_name: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
class RecommendationIn(BaseModel): latitude:float; longitude:float; radius_km:float=5; price_weight:float=.15; distance_weight:float=.20; rating_weight:float=.25; availability_weight:float=.40; vehicle_type:Optional[str]=None
class ParkingLotIn(BaseModel): name:str; address:str; latitude:float; longitude:float; price_per_hour:float; total_slots:int; vehicle_type:str="all"; timing_start:str="06:00"; timing_end:str="23:00"
class ProfileUpdate(BaseModel): name:Optional[str]=None; phone:Optional[str]=None; vehicle_type:Optional[str]=None; preferred_price:Optional[float]=None
