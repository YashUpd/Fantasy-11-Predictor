from fastapi import APIRouter, HTTPException

try:
    from api.services.analytics_service import get_historical_analytics, get_evaluation_metrics
except ImportError:
    from services.analytics_service import get_historical_analytics, get_evaluation_metrics

router = APIRouter(tags=["Analytics"])

@router.get("/analytics")
def get_analytics():
    """Returns historical leaderboards and statistics for player intelligence."""
    try:
        return get_historical_analytics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/evaluation")
def get_evaluation():
    """Returns model benchmark harness results, comparative baselines, and efficiency gains."""
    try:
        return get_evaluation_metrics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
