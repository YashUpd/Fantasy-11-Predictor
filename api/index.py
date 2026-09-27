import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure both project root and api directory are in sys.path
API_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = API_DIR.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))

try:
    from api.routers.health import router as health_router
    from api.routers.predict import router as predict_router
    from api.routers.matches import router as matches_router
    from api.routers.analytics import router as analytics_router
except ImportError:
    from routers.health import router as health_router
    from routers.predict import router as predict_router
    from routers.matches import router as matches_router
    from routers.analytics import router as analytics_router

app = FastAPI(
    title="Fantasy 11 Cricket Analytics API",
    description="Production-grade API for fantasy cricket team optimization and analytics",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers with /api prefix and without prefix
# Ensures full compatibility with both direct calls and Vercel serverless rewrites
app.include_router(health_router, prefix="/api")
app.include_router(predict_router, prefix="/api")
app.include_router(matches_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")

app.include_router(health_router)
app.include_router(predict_router)
app.include_router(matches_router)
app.include_router(analytics_router)

@app.get("/")
def root_endpoint():
    return {
        "status": "online",
        "service": "Cricket Fantasy 11 Predictor API",
        "version": "2.0.0",
        "endpoints": [
            "/api/health",
            "/api/predict",
            "/api/matches",
            "/api/analytics",
            "/api/evaluation",
            "/api/sample-players"
        ]
    }

