from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class Best11Stats(BaseModel):
    total_points: float
    role_breakdown: Dict[str, int]
    team_breakdown: Dict[str, int]
    captain: Optional[str] = None
    vice_captain: Optional[str] = None

class PredictionResponse(BaseModel):
    success: bool
    total_players: int
    best_11: List[Dict[str, Any]]
    all_players: List[Dict[str, Any]]
    stats: Best11Stats
