import pandas as pd
from typing import Dict, Any

try:
    from api.config import BATSMAN_D11_CSV, BOWLER_D11_CSV
except ImportError:
    from config import BATSMAN_D11_CSV, BOWLER_D11_CSV

_analytics_cache = None

def get_historical_analytics() -> Dict[str, Any]:
    """Computes and caches historical batting and bowling leaderboards."""
    global _analytics_cache
    if _analytics_cache is not None:
        return _analytics_cache

    try:
        b_df = pd.read_csv(BATSMAN_D11_CSV)
        bowl_df = pd.read_csv(BOWLER_D11_CSV)

        # Top 10 run scorers
        top_runs = b_df.groupby('batsman')['runs'].sum().nlargest(10).reset_index().to_dict(orient="records")
        # Top 10 boundaries (4s & 6s)
        top_4s = b_df.groupby('batsman')['4s'].sum().nlargest(10).reset_index().to_dict(orient="records")
        top_6s = b_df.groupby('batsman')['6s'].sum().nlargest(10).reset_index().to_dict(orient="records")
        # Top Strike Rates (min 15 matches)
        sr_agg = b_df.groupby('batsman').agg({'strike_rate': 'mean', 'runs': 'count'}).reset_index()
        top_sr = sr_agg[sr_agg['runs'] >= 15].sort_values('strike_rate', ascending=False).head(10).to_dict(orient="records")

        # Top 10 wicket takers
        top_wkts = bowl_df.groupby('bowler')['wicket'].sum().nlargest(10).reset_index().to_dict(orient="records")
        # Best economy (min 20 overs)
        eco_agg = bowl_df.groupby('bowler').agg({'economy': 'mean', 'overs': 'sum'}).reset_index()
        best_eco = eco_agg[eco_agg['overs'] >= 20].sort_values('economy').head(10).to_dict(orient="records")
        # Most 4w hauls
        top_4w = bowl_df.groupby('bowler')['4w'].sum().nlargest(10).reset_index().to_dict(orient="records")

        _analytics_cache = {
            "top_runs": top_runs,
            "top_4s": top_4s,
            "top_6s": top_6s,
            "top_strike_rate": top_sr,
            "top_wickets": top_wkts,
            "best_economy": best_eco,
            "top_4w": top_4w
        }
        return _analytics_cache
    except Exception as e:
        raise RuntimeError(f"Failed to calculate analytics: {str(e)}")
