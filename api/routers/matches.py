from fastapi import APIRouter

try:
    from api.services.cricket_api import fetch_live_and_upcoming_matches
except ImportError:
    from services.cricket_api import fetch_live_and_upcoming_matches

router = APIRouter(tags=["Matches"])

@router.get("/matches")
def get_matches():
    """Returns currently live matches and upcoming fixtures."""
    return fetch_live_and_upcoming_matches()
