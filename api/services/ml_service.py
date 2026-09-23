import pandas as pd
import joblib
from typing import Dict, Any, Tuple

try:
    from api.config import BAT_MODEL_PATH, BOWL_MODEL_PATH, BAT_FEATURES, BOWL_FEATURES
except ImportError:
    from config import BAT_MODEL_PATH, BOWL_MODEL_PATH, BAT_FEATURES, BOWL_FEATURES

_bat_model = None
_bowl_model = None

def get_models() -> Tuple[Any, Any]:
    global _bat_model, _bowl_model
    if _bat_model is None or _bowl_model is None:
        if not BAT_MODEL_PATH.exists() or not BOWL_MODEL_PATH.exists():
            raise RuntimeError("Model files not found in 03_models directory.")
        _bat_model = joblib.load(str(BAT_MODEL_PATH))
        _bowl_model = joblib.load(str(BOWL_MODEL_PATH))
    return _bat_model, _bowl_model

def select_best_11_logic(player_df: pd.DataFrame) -> pd.DataFrame:
    """Enforces official Dream11 fantasy rules and selects optimal 11."""
    players = player_df.sort_values(by='predicted_points', ascending=False)
    
    final_team = []
    team_count = {}
    batsmen, bowlers, allrounders, wicketkeepers = 0, 0, 0, 0

    for _, row in players.iterrows():
        team = row.get('team1') or row.get('team') or 'Unknown'
        team_count.setdefault(team, 0)

        role = str(row.get('role', '')).lower()
        if team_count[team] >= 7:
            continue
        if role == 'batsman' and batsmen >= 5:
            continue
        if role == 'bowler' and bowlers >= 5:
            continue
        if role == 'wicketkeeper' and wicketkeepers >= 1:
            continue
        if role == 'allrounder' and allrounders >= 3:
            continue

        if role == 'batsman':
            batsmen += 1
        elif role == 'bowler':
            bowlers += 1
        elif role == 'allrounder':
            allrounders += 1
        elif role == 'wicketkeeper':
            wicketkeepers += 1

        final_team.append(row.to_dict())
        team_count[team] += 1

        if len(final_team) == 11:
            break

    # If strict constraints didn't fill 11, backfill with top remaining players
    if len(final_team) < 11:
        picked_names = {p.get('name') for p in final_team}
        for _, row in players.iterrows():
            if row.get('name') not in picked_names:
                final_team.append(row.to_dict())
                picked_names.add(row.get('name'))
                if len(final_team) == 11:
                    break

    res_df = pd.DataFrame(final_team)
    if not res_df.empty:
        # Assign Captain (highest points) and Vice-Captain (2nd highest points)
        res_df = res_df.sort_values(by='predicted_points', ascending=False).reset_index(drop=True)
        res_df['is_captain'] = False
        res_df['is_vice_captain'] = False
        if len(res_df) > 0:
            res_df.loc[0, 'is_captain'] = True
        if len(res_df) > 1:
            res_df.loc[1, 'is_vice_captain'] = True
    return res_df

def predict_team_pipeline(df: pd.DataFrame) -> Dict[str, Any]:
    """Runs regression models, selects 11, computes multipliers and metrics."""
    bat_model, bowl_model = get_models()

    # Standardize column names
    df.columns = [c.strip().lower() for c in df.columns]
    
    # Verify required feature columns exist or fill defaults
    for col in BAT_FEATURES + BOWL_FEATURES:
        if col not in df.columns:
            df[col] = 0.0

    if 'role' not in df.columns:
        df['role'] = 'batsman'

    df['role'] = df['role'].astype(str).str.lower().str.strip()

    # Split and predict by role
    batsmen_df = df[df['role'] == 'batsman'].copy()
    bowlers_df = df[df['role'] == 'bowler'].copy()
    allrounders_df = df[df['role'] == 'allrounder'].copy()
    wicketkeepers_df = df[df['role'] == 'wicketkeeper'].copy()

    if not batsmen_df.empty:
        batsmen_df['predicted_points'] = bat_model.predict(batsmen_df[BAT_FEATURES])
    if not bowlers_df.empty:
        bowlers_df['predicted_points'] = bowl_model.predict(bowlers_df[BOWL_FEATURES])
    if not allrounders_df.empty:
        allrounders_df['predicted_points'] = bat_model.predict(allrounders_df[BAT_FEATURES])
    if not wicketkeepers_df.empty:
        wicketkeepers_df['predicted_points'] = bat_model.predict(wicketkeepers_df[BAT_FEATURES])

    all_players = pd.concat([batsmen_df, bowlers_df, allrounders_df, wicketkeepers_df], ignore_index=True)
    all_players['predicted_points'] = all_players['predicted_points'].round(2)

    # Select best 11 with Dream11 constraints
    best_11 = select_best_11_logic(all_players)

    total_dream11_points = 0.0
    role_counts = {"batsman": 0, "bowler": 0, "allrounder": 0, "wicketkeeper": 0}
    team_counts = {}

    best_11_list = []
    for _, row in best_11.iterrows():
        p_dict = row.to_dict()
        pts = float(p_dict.get('predicted_points', 0))
        is_c = bool(p_dict.get('is_captain', False))
        is_vc = bool(p_dict.get('is_vice_captain', False))
        
        mult = 2.0 if is_c else (1.5 if is_vc else 1.0)
        fantasy_pts = round(pts * mult, 2)
        p_dict['fantasy_points'] = fantasy_pts
        total_dream11_points += fantasy_pts

        r = str(p_dict.get('role', '')).lower()
        role_counts[r] = role_counts.get(r, 0) + 1

        tm = p_dict.get('team1') or p_dict.get('team') or 'Other'
        team_counts[tm] = team_counts.get(tm, 0) + 1

        best_11_list.append(p_dict)

    return {
        "success": True,
        "total_players": len(all_players),
        "best_11": best_11_list,
        "all_players": all_players.sort_values(by='predicted_points', ascending=False).to_dict(orient="records"),
        "stats": {
            "total_points": round(total_dream11_points, 2),
            "role_breakdown": role_counts,
            "team_breakdown": team_counts,
            "captain": best_11_list[0]['name'] if best_11_list else None,
            "vice_captain": best_11_list[1]['name'] if len(best_11_list) > 1 else None
        }
    }
