from fastapi import APIRouter

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Cricket Fantasy 11 Predictor API",
        "models_ready": True
    }
