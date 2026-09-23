from pathlib import Path

# Base directories
API_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = API_DIR.parent

# Feature definitions for ML models
BAT_FEATURES = ['career_avg', 'career_sr', 'last_5_avg', 'last_5_sr', 'venue_avg']
BOWL_FEATURES = ['career_wickets', 'career_eco', 'last_5_wkts', 'venue_wickets']

# Model file paths
BAT_MODEL_PATH = PROJECT_ROOT / "03_models" / "batsman_model_xgb.pkl"
BOWL_MODEL_PATH = PROJECT_ROOT / "03_models" / "bowler_model_xgb.pkl"

# Data file paths
SAMPLE_MATCH_PLAYERS_PATH = PROJECT_ROOT / "01_data" / "match_input" / "sample_match_players.csv"
BATSMAN_D11_CSV = PROJECT_ROOT / "01_data" / "processed" / "batsman_d11.csv"
BOWLER_D11_CSV = PROJECT_ROOT / "01_data" / "processed" / "bowler_d11.csv"

# External API configuration
CRIC_API_KEY = "02612d40-b143-4bbb-b68e-b6d26732a66e"
MATCH_CACHE_TTL_SECONDS = 300  # 5 minutes
