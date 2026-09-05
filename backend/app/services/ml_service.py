import os, math, joblib, numpy as np
from pathlib import Path
from app.core.config import settings
from app.db.mongodb import collection

BUNDLE=None
try:
    path=Path(settings.model_path)
    if path.exists(): BUNDLE=joblib.load(path)
except Exception: BUNDLE=None

def distance_km(lat1, lon1, lat2, lon2):
    r=6371.0; p1=math.radians(lat1); p2=math.radians(lat2); dp=math.radians(lat2-lat1); dl=math.radians(lon2-lon1)
    a=math.sin(dp/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 2*r*math.asin(math.sqrt(a))

def lot_rating(lot_id):
    vals=[float(x.get("rating",0)) for x in collection("reviews").find({"lot_id":lot_id},{"rating":1}) if x.get("rating") is not None]
    return round(sum(vals)/len(vals),2) if vals else 0.0

def occupancy_prediction(price, rating, distance):
    if BUNDLE:
        try:
            model=BUNDLE["model"]; pred=float(model.predict(np.array([[price,rating,distance]]))[0]); return max(0,min(100,pred))
        except Exception: pass
    return 50.0

def recommendation(lots, lat, lon, weights=None, vehicle_type=None, radius_km=5):
    rows=[]
    for lot in lots:
        if lot.get("status") != "approved": continue
        if vehicle_type and lot.get("vehicle_type") not in ("all", vehicle_type): continue
        try:
            d=distance_km(lat,lon,float(lot["latitude"]),float(lot["longitude"]))
        except (TypeError, ValueError, KeyError):
            continue
        if d > radius_km: continue
        rating=lot_rating(lot["parking_lots_id"]); price=float(lot.get("price_per_hour",0) or 0); occ=occupancy_prediction(price,rating,d)
        rows.append({**lot,"distance_km":round(d,2),"avg_rating":rating,"predicted_occupancy_pct":round(occ,2),"predicted_available_pct":round(100-occ,2)})
    if not rows:return []

    def mm(k, reverse=False):
        a=[r[k] for r in rows]; lo=min(a); hi=max(a)
        for r in rows:
            score = 1 if hi==lo else ((r[k]-lo)/(hi-lo))
            r[k+"_score"] = 1-score if reverse else score

    mm("predicted_available_pct"); mm("avg_rating"); mm("distance_km",True); mm("price_per_hour",True)
    w=weights or {"availability":.40,"rating":.25,"distance":.20,"price":.15}
    for r in rows:
        rating_score = r["avg_rating"]/5 if r["avg_rating"] else 0
        r["match_breakdown"]={
            "availability": round(r["predicted_available_pct_score"]*100,1),
            "rating": round(rating_score*100,1),
            "distance": round(r["distance_km_score"]*100,1),
            "price": round(r["price_per_hour_score"]*100,1),
        }
        r["recommendation_score"]=round((w.get("availability",.40)*r["predicted_available_pct_score"]+w.get("rating",.25)*rating_score+w.get("distance",.20)*r["distance_km_score"]+w.get("price",.15)*r["price_per_hour_score"])*100,2)
    return sorted(rows,key=lambda x:x["recommendation_score"],reverse=True)