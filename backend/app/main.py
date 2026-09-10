from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware

from app.db.mongodb import ping, create_indexes

from app.api import auth, parking, users, admin

from app.routers import bookings

from fastapi.responses import JSONResponse


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(

    title="ParkWise AI API",

    version="1.0.0",

    description="FastAPI + MongoDB + AI Parking Recommendation Backend"

)


# ============================================================
# CORS CONFIGURATION
# ============================================================

app.add_middleware(

    CORSMiddleware,

    allow_origins=[

        # Local Development

        "http://127.0.0.1:5500",

        "http://localhost:5500",

        "http://127.0.0.1:5501",

        "http://localhost:5501",

        "http://127.0.0.1:5173",

        "http://localhost:5173",

        "http://127.0.0.1:8080",

        "http://localhost:8080",

        "http://127.0.0.1:3000",

        "http://localhost:3000",

        # ADD YOUR DEPLOYED FRONTEND URL HERE

        # "https://your-frontend-url.onrender.com",

    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],

)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "ParkWise AI API"
    }


# @app.get("/favicon.ico", include_in_schema=False)
# async def favicon():
#     return JSONResponse(content={}, status_code=204)


# ============================================================
# ROUTERS
# ============================================================

app.include_router(auth.router)

app.include_router(parking.router)

app.include_router(users.router)

app.include_router(admin.router)

app.include_router(bookings.router)


# ============================================================
# STARTUP
# ============================================================

@app.on_event("startup")
def startup():
    try:
        create_indexes()
        print("MongoDB indexes created successfully")
    except Exception as e:
        print(f"MongoDB index creation warning: {e}")

# ============================================================
# HOME
# ============================================================

@app.get("/")
def root():

    return {

        "name": "ParkWise AI API",

        "status": "running",

        "docs": "/docs"

    }


# ============================================================
# HEALTH CHECK
# ============================================================

# @app.get("/health")
# def health():
#     return {
#         "status": "ok",
#         "service": "ParkWise AI API"
#     }


# @app.get("/health/db")
# def health_db():
#     try:
#         ping()

#         return {
#             "status": "ok",
#             "mongodb": "connected"
#         }

#     except Exception as e:
#         return {
#             "status": "error",
#             "mongodb": "disconnected",
#             "detail": str(e)
#         }