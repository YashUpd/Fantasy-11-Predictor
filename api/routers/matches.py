from fastapi import APIRouter, HTTPException

try:
    from api.services.cricket_api import (
        fetch_live_and_upcoming_matches,
        fetch_match_squad
    )
except ImportError:
    from services.cricket_api import (
        fetch_live_and_upcoming_matches,
        fetch_match_squad
    )

router = APIRouter(tags=["Matches"])

@router.get("/matches")
def get_matches():
    """Returns currently live matches and upcoming fixtures."""
    return fetch_live_and_upcoming_matches()

@router.get("/matches/{match_id}/squad")
def get_match_squad(match_id: str):
    """Fetches real live playing squads & players for a specific match with career stats for fact-checking."""
    try:
        squad_data = fetch_match_squad(match_id)
        if not squad_data or not squad_data.get("players"):
            raise HTTPException(status_code=404, detail="No squad available for this match.")
        return squad_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
