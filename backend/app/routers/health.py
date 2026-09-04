from fastapi import APIRouter
from ..database import db
router=APIRouter(tags=["system"])

@router.get("/health")
async def health():
    try:
        await db.command("ping")
        return {"status":"ok","mongodb":"connected"}
    except Exception as e:
        return {"status":"degraded","mongodb":"disconnected","detail":str(e)}

@router.get("/heatmap")
async def heatmap():
    from ..database import parking_lots, bookings
    from ..services.ml_service import predict_occupancy
    locations=[]
    async for lot in parking_lots.find({"status":{"$in":["active","verified","approved"]}}):
        total=int(lot.get("total_slots",0) or 0)
        lid=lot.get("parking_lots_id") or str(lot["_id"])
        occ=await bookings.count_documents({"lot_id":lid,"status":{"$in":["confirmed","active"]}})
        current=round((occ/total)*100,2) if total else 0
        pred=predict_occupancy(float(lot.get("price_per_hour",0) or 0),0,0)
        locations.append({"lot_id":lid,"name":lot.get("name",""),"lat":float(lot.get("latitude",0) or 0),
                          "lng":float(lot.get("longitude",0) or 0),"current_occupancy":current,
                          "predicted_occupancy":pred})
    return {"locations":locations}
