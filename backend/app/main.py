from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.mongodb import ping, create_indexes

from app.api import auth, parking, users, admin
from app.routers import bookings


app = FastAPI(
    title="ParkWise AI API",
    version="1.0.0",
    description="FastAPI + MongoDB backend"
)


app.add_middleware(
    CORSMiddleware,

    allow_origins=settings.cors_origins,

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(parking.router)
app.include_router(users.router)
app.include_router(admin.router)
app.include_router(bookings.router)


@app.on_event("startup")
def startup():
    create_indexes()


@app.get("/")
def root():
    return {
        "name": "ParkWise AI API",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
def health():

    try:

        ping()

        return {
            "status": "ok",
            "mongodb": "connected"
        }

    except Exception as e:

        return {
            "status": "error",
            "mongodb": "disconnected",
            "detail": str(e)
        }