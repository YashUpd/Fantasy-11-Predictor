from fastapi import APIRouter, HTTPException

try:
    from api.services.analytics_service import get_historical_analytics
except ImportError:
    from services.analytics_service import get_historical_analytics

router = APIRouter(tags=["Analytics"])

@router.get("/analytics")
def get_analytics():
    """Returns historical leaderboards and statistics for EDA visualizations."""
    try:
        return get_historical_analytics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
