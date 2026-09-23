from pydantic import BaseModel
from typing import Optional

class PlayerItem(BaseModel):
    name: str
    team1: str
    team2: Optional[str] = None
    role: str
    career_avg: float
    career_sr: float
    last_5_avg: float
    last_5_sr: float
    venue_avg: float
    venue_wickets: Optional[float] = 0.0
    career_wickets: Optional[float] = 0.0
    career_eco: Optional[float] = 0.0
    last_5_wkts: Optional[float] = 0.0
