from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.mongodb import ping, create_indexes
from app.api import auth, parking, users, admin
from app.routers import bookings
app=FastAPI(title="ParkWise AI API",version="1.0.0",description="FastAPI + MongoDB backend connected to ParkWise frontend and ML model")
app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:5501",
        "http://localhost:5501",
        "http://127.0.0.1:3000",
        "http://localhost:3000",
    ],

    allow_credentials=True,

    allow_methods=[
        "GET",
        "POST",
        "PUT",
        "DELETE",
        "PATCH",
        "OPTIONS"
    ],

    allow_headers=["*"],
)
app.include_router(auth.router) 
app.include_router(parking.router); app.include_router(users.router); app.include_router(admin.router)
app.include_router(bookings.router)
@app.on_event("startup")
def startup(): create_indexes()
@app.get("/")
def root(): return {"name":"ParkWise AI API","status":"running","docs":"/docs"}
@app.get("/health")
def health():
    try: ping(); return {"status":"ok","mongodb":"connected"}
    except Exception as e: return {"status":"error","mongodb":"disconnected","detail":str(e)}
