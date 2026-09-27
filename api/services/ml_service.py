import json
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple

try:
    from api.config import (
        BAT_MODEL_JSON_PATH,
        BOWL_MODEL_JSON_PATH,
        BAT_MODEL_PKL_PATH,
        BOWL_MODEL_PKL_PATH,
        BAT_FEATURES,
        BOWL_FEATURES,
    )
except ImportError:
    from config import (
        BAT_MODEL_JSON_PATH,
        BOWL_MODEL_JSON_PATH,
        BAT_MODEL_PKL_PATH,
        BOWL_MODEL_PKL_PATH,
        BAT_FEATURES,
        BOWL_FEATURES,
    )

class LightweightXGBPredictor:
    """Fast, dependency-free tree ensemble evaluator for XGBoost JSON models."""
    def __init__(self, json_path):
        with open(json_path, 'r', encoding='utf-8') as f:
            d = json.load(f)
        raw_base = d['learner']['learner_model_param'].get('base_score', '0.5')
        self.base_score = float(str(raw_base).strip('[]'))
        self.trees = d['learner']['gradient_booster']['model']['trees']

    def predict(self, X):
        if hasattr(X, 'values'):
            X = X.values
        X = np.asarray(X, dtype=np.float32)
        
        preds = []
        for row in X:
            score = self.base_score
            for tree in self.trees:
                left = tree['left_children']
                right = tree['right_children']
                feats = tree['split_indices']
                threshs = tree['split_conditions']
                weights = tree['base_weights']
                defaults = tree['default_left']
                
                node = 0
                while left[node] != -1:
                    val = row[feats[node]]
                    if np.isnan(val):
                        node = left[node] if defaults[node] else right[node]
                    elif val < threshs[node]:
                        node = left[node]
                    else:
                        node = right[node]
                score += weights[node]
            preds.append(score)
        return np.array(preds, dtype=np.float32)

_bat_model = None
_bowl_model = None

def get_models() -> Tuple[Any, Any]:
    """Loads lightweight JSON predictors, or falls back to pkl if needed."""
    global _bat_model, _bowl_model
    if _bat_model is None or _bowl_model is None:
        if BAT_MODEL_JSON_PATH.exists() and BOWL_MODEL_JSON_PATH.exists():
            _bat_model = LightweightXGBPredictor(str(BAT_MODEL_JSON_PATH))
            _bowl_model = LightweightXGBPredictor(str(BOWL_MODEL_JSON_PATH))
        else:
            import joblib
            _bat_model = joblib.load(str(BAT_MODEL_PKL_PATH))
            _bowl_model = joblib.load(str(BOWL_MODEL_PKL_PATH))
    return _bat_model, _bowl_model

def select_best_11_logic(
    player_df: pd.DataFrame,
    locked_players: list = None,
    excluded_players: list = None,
    preferred_captain: str = None,
    preferred_vice_captain: str = None
) -> pd.DataFrame:
    """Enforces official Dream11 fantasy rules while integrating human-in-the-loop fact checking."""
    locked_set = {str(p).strip().lower() for p in (locked_players or [])}
    excluded_set = {str(p).strip().lower() for p in (excluded_players or [])}

    players = player_df.sort_values(by='predicted_points', ascending=False).copy()
    final_team = []
    team_count = {}
    role_count = {'batsman': 0, 'bowler': 0, 'allrounder': 0, 'wicketkeeper': 0}
    picked_names = set()

    # Step 1: Force add locked players first (Human-in-the-loop priority)
    for _, row in players.iterrows():
        pname = str(row.get('name', '')).strip().lower()
        if pname in locked_set:
            team = row.get('team1') or row.get('team') or 'Unknown'
            role = str(row.get('role', '')).lower()
            role_key = role if role in role_count else 'batsman'

            p_dict = row.to_dict()
            p_dict['is_locked'] = True
            final_team.append(p_dict)
            picked_names.add(pname)
            team_count[team] = team_count.get(team, 0) + 1
            role_count[role_key] = role_count.get(role_key, 0) + 1

    # Step 2: Fill remaining slots with optimal candidates respecting constraints
    for _, row in players.iterrows():
        if len(final_team) >= 11:
            break

        pname = str(row.get('name', '')).strip().lower()
        if pname in picked_names or (pname in excluded_set and pname not in locked_set):
            continue

        team = row.get('team1') or row.get('team') or 'Unknown'
        role = str(row.get('role', '')).lower()
        role_key = role if role in role_count else 'batsman'

        # Dream11 official bounds
        if team_count.get(team, 0) >= 7:
            continue
        if role_key == 'batsman' and role_count['batsman'] >= 6:
            continue
        if role_key == 'bowler' and role_count['bowler'] >= 6:
            continue
        if role_key == 'allrounder' and role_count['allrounder'] >= 4:
            continue
        if role_key == 'wicketkeeper' and role_count['wicketkeeper'] >= 4:
            continue

        p_dict = row.to_dict()
        p_dict['is_locked'] = False
        final_team.append(p_dict)
        picked_names.add(pname)
        team_count[team] = team_count.get(team, 0) + 1
        role_count[role_key] = role_count.get(role_key, 0) + 1

    # Ensure minimum 1 Wicket-Keeper if none selected yet and candidates exist
    if role_count['wicketkeeper'] == 0:
        wk_candidates = players[
            (players['role'].str.lower() == 'wicketkeeper') & 
            (~players['name'].str.lower().isin(picked_names)) &
            (~players['name'].str.lower().isin(excluded_set))
        ]
        if not wk_candidates.empty and len(final_team) == 11:
            for idx in reversed(range(len(final_team))):
                if not final_team[idx].get('is_locked', False) and final_team[idx].get('role') != 'wicketkeeper':
                    wk_pick = wk_candidates.iloc[0].to_dict()
                    wk_pick['is_locked'] = False
                    final_team[idx] = wk_pick
                    break

    # If still under 11, backfill from non-excluded pool
    if len(final_team) < 11:
        for _, row in players.iterrows():
            pname = str(row.get('name', '')).strip().lower()
            if pname not in picked_names and pname not in excluded_set:
                p_dict = row.to_dict()
                p_dict['is_locked'] = False
                final_team.append(p_dict)
                picked_names.add(pname)
                if len(final_team) == 11:
                    break

    res_df = pd.DataFrame(final_team)
    if not res_df.empty:
        res_df = res_df.sort_values(by='predicted_points', ascending=False).reset_index(drop=True)
        res_df['is_captain'] = False
        res_df['is_vice_captain'] = False

        # Captain assignment
        c_idx = 0
        if preferred_captain:
            c_name_lower = preferred_captain.strip().lower()
            matches = res_df.index[res_df['name'].str.lower() == c_name_lower].tolist()
            if matches:
                c_idx = matches[0]

        res_df.loc[c_idx, 'is_captain'] = True

        # Vice-captain assignment
        vc_idx = 1 if len(res_df) > 1 and c_idx != 1 else (0 if len(res_df) == 1 else 1)
        if preferred_vice_captain:
            vc_name_lower = preferred_vice_captain.strip().lower()
            matches = res_df.index[(res_df['name'].str.lower() == vc_name_lower) & (res_df.index != c_idx)].tolist()
            if matches:
                vc_idx = matches[0]
        elif len(res_df) > 1:
            for idx in res_df.index:
                if idx != c_idx:
                    vc_idx = idx
                    break

        if len(res_df) > 1 and vc_idx != c_idx:
            res_df.loc[vc_idx, 'is_vice_captain'] = True

    return res_df

def clean_records_for_json(records: list) -> list:
    """Replaces NaNs, Infinities, and numpy datatypes with standard JSON-compliant primitives."""
    cleaned = []
    for r in records:
        clean_row = {}
        for k, v in r.items():
            if v is None or pd.isna(v):
                clean_row[k] = None
            elif isinstance(v, (np.integer, np.int64)):
                clean_row[k] = int(v)
            elif isinstance(v, (np.floating, np.float64, np.float32)):
                clean_row[k] = 0.0 if np.isnan(v) or np.isinf(v) else round(float(v), 2)
            else:
                clean_row[k] = v
        cleaned.append(clean_row)
    return cleaned

def predict_team_pipeline(
    df: pd.DataFrame,
    locked_players: list = None,
    excluded_players: list = None,
    preferred_captain: str = None,
    preferred_vice_captain: str = None
) -> Dict[str, Any]:

    """Runs regression models, selects 11 with human constraints, computes multipliers and metrics."""
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

    # Select best 11 with Dream11 constraints & human preferences
    best_11 = select_best_11_logic(
        all_players,
        locked_players=locked_players,
        excluded_players=excluded_players,
        preferred_captain=preferred_captain,
        preferred_vice_captain=preferred_vice_captain
    )

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

    c_name = next((p['name'] for p in best_11_list if p.get('is_captain')), None) or (best_11_list[0]['name'] if best_11_list else None)
    vc_name = next((p['name'] for p in best_11_list if p.get('is_vice_captain')), None) or (best_11_list[1]['name'] if len(best_11_list) > 1 else None)

    return {
        "success": True,
        "total_players": len(all_players),
        "best_11": clean_records_for_json(best_11_list),
        "all_players": clean_records_for_json(all_players.sort_values(by='predicted_points', ascending=False).to_dict(orient="records")),
        "stats": {
            "total_points": round(total_dream11_points, 2),
            "role_breakdown": role_counts,
            "team_breakdown": team_counts,
            "captain": c_name,
            "vice_captain": vc_name,
            "locked_count": sum(1 for p in best_11_list if p.get('is_locked'))
        }
    }



