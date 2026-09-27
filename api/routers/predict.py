import io
import pandas as pd
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Request

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
async def predict_team(request: Request, file: Optional[UploadFile] = File(None)):
    """Receives a match player CSV or JSON (or uses default sample) and returns optimal Dream11 team."""
    try:
        df = None

        # 1. Check for file upload
        if file is not None and getattr(file, 'filename', None):
            contents = await file.read()
            if contents:
                try:
                    decoded = contents.decode('utf-8-sig')
                except UnicodeDecodeError:
                    decoded = contents.decode('latin-1')
                df = pd.read_csv(io.StringIO(decoded))

        # 2. Check for JSON body
        if df is None:
            content_type = request.headers.get("content-type", "")
            if "application/json" in content_type:
                try:
                    body = await request.json()
                    if isinstance(body, list):
                        df = pd.DataFrame(body)
                    elif isinstance(body, dict) and "players" in body:
                        df = pd.DataFrame(body["players"])
                except Exception:
                    pass

        # 3. Fallback to sample players dataset
        if df is None or df.empty:
            if not SAMPLE_MATCH_PLAYERS_PATH.exists():
                raise HTTPException(status_code=404, detail="sample_match_players.csv not found.")
            df = pd.read_csv(SAMPLE_MATCH_PLAYERS_PATH)

        return predict_team_pipeline(df)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

