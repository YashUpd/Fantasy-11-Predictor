from .health import router as health_router
from .predict import router as predict_router
from .matches import router as matches_router
from .analytics import router as analytics_router

__all__ = ["health_router", "predict_router", "matches_router", "analytics_router"]
