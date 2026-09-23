from pydantic import BaseModel
from typing import List, Optional

class MatchItem(BaseModel):
    id: str
    name: str
    status: Optional[str] = None
    venue: str
    date: Optional[str] = ""

class MatchListResponse(BaseModel):
    live_matches: List[MatchItem]
    upcoming_matches: List[MatchItem]
