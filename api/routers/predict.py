import io
import pandas as pd
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException

try:
    from api.config import SAMPLE_MATCH_PLAYERS_PATH
    from api.services.ml_service import predict_team_pipeline
except ImportError:
    from config import SAMPLE_MATCH_PLAYERS_PATH
    from services.ml_service import predict_team_pipeline

router = APIRouter(tags=["Prediction"])

@router.get("/sample-players")
def get_sample_players():
    """Returns sample match player profiles for quick 1-click preview and testing."""
    if not SAMPLE_MATCH_PLAYERS_PATH.exists():
        raise HTTPException(status_code=404, detail="sample_match_players.csv not found.")
    df = pd.read_csv(SAMPLE_MATCH_PLAYERS_PATH)
    return df.to_dict(orient="records")

@router.post("/predict")
async def predict_team(file: Optional[UploadFile] = File(None)):
    """Receives a match player CSV (or uses default sample) and returns optimal Dream11 team."""
    try:
        if file is not None:
            contents = await file.read()
            df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        else:
            if not SAMPLE_MATCH_PLAYERS_PATH.exists():
                raise HTTPException(status_code=404, detail="sample_match_players.csv not found.")
            df = pd.read_csv(SAMPLE_MATCH_PLAYERS_PATH)

        return predict_team_pipeline(df)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
