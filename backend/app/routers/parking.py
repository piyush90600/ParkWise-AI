from fastapi import APIRouter, Query, HTTPException
from ..database import parking_lots, slots, reviews, bookings
from ..services.serializers import clean
from ..services.ml_service import predict_occupancy
import math, httpx

router=APIRouter(tags=["parking"])

def distance_km(lat1,lon1,lat2,lon2):
    p=math.pi/180
    a=0.5-math.cos((lat2-lat1)*p)/2+math.cos(lat1*p)*math.cos(lat2*p)*(1-math.cos((lon2-lon1)*p))/2
    return 12742*math.asin(math.sqrt(max(0,a)))

async def avg_rating(lot_id):
    vals=[]
    async for r in reviews.find({"lot_id":lot_id},{"rating":1}):
        vals.append(float(r.get("rating",0)))
    return sum(vals)/len(vals) if vals else 0

async def enrich(lot, lat=None, lon=None):
    d=clean(lot)
    d["id"]=d.get("parking_lots_id",d.get("_id"))
    d["total_slots"]=int(d.get("total_slots",0) or 0)
    occupied=await bookings.count_documents({"lot_id":d["id"],"status":{"$in":["confirmed","active"]}})
    d["occupied_slots"]=min(occupied,d["total_slots"])
    d["available_slots"]=max(d["total_slots"]-d["occupied_slots"],0)
    d["distance_km"]=round(distance_km(lat,lon,float(d.get("latitude",0)),float(d.get("longitude",0))),2) if lat is not None else 0
    d["avg_rating"]=round(await avg_rating(d["id"]),2)
    d["price"]=float(d.get("price_per_hour",0) or 0)
    d["predicted_occupancy"]=predict_occupancy(d["price"],d["avg_rating"],d["distance_km"])
    d["predicted_availability"]=round(100-d["predicted_occupancy"],2)
    return d

@router.get("/parking-spots")
async def parking_spots():
    result={}
    async for lot in parking_lots.find({"status":{"$in":["active","verified","approved"]}}):
        d=await enrich(lot)
        result[d["id"]]=d
    return {"spots":result}

@router.get("/nearby-parking")
async def nearby_parking(latitude:float, longitude:float, radius_km:float=5):
    out=[]
    async for lot in parking_lots.find({"status":{"$in":["active","verified","approved"]}}):
        lat,lon=float(lot.get("latitude",0) or 0),float(lot.get("longitude",0) or 0)
        if not lat and not lon: continue
        d=await enrich(lot,latitude,longitude)
        if d["distance_km"] <= radius_km:
            out.append(d)
    out.sort(key=lambda x:x["distance_km"])
    return {"parking":out}

@router.post("/recommendations")
async def recommendations(payload:dict):
    lat=float(payload["latitude"]); lon=float(payload["longitude"])
    radius=float(payload.get("radius_km",5))
    pw=float(payload.get("price_weight",.2)); dw=float(payload.get("distance_weight",.25))
    rw=float(payload.get("rating_weight",.2)); aw=float(payload.get("availability_weight",.35))
    rows=await nearby_parking(lat,lon,radius)
    items=rows["parking"]
    if not items: return {"recommendations":[]}
    max_price=max((x["price"] for x in items),default=1) or 1
    for x in items:
        price_score=max(0,1-x["price"]/max_price)
        dist_score=max(0,1-x["distance_km"]/max(radius,0.1))
        rating_score=x["avg_rating"]/5 if x["avg_rating"] else .5
        avail_score=x["predicted_availability"]/100
        score=(price_score*pw+dist_score*dw+rating_score*rw+avail_score*aw)*100
        x["recommendation_score"]=round(score,2)
        x["calculatedScore"]=round(score)
    items.sort(key=lambda x:x["recommendation_score"],reverse=True)
    return {"recommendations":items[:10]}

@router.get("/location-search")
async def location_search(q:str=Query(min_length=2)):
    try:
        async with httpx.AsyncClient(timeout=8,headers={"User-Agent":"ParkWise-AI/1.0"}) as client:
            r=await client.get("https://nominatim.openstreetmap.org/search",params={"q":q,"format":"json","limit":5,"addressdetails":1})
            r.raise_for_status()
            data=r.json()
        return {"locations":[{"display_name":x.get("display_name"),"latitude":float(x["lat"]),"longitude":float(x["lon"])} for x in data]}
    except Exception:
        return {"locations":[]}
