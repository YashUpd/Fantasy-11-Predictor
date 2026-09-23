import pandas as pd
import joblib

def load_models(bat_model_path, bowl_model_path):
    bat_model = joblib.load(bat_model_path)
    bowl_model = joblib.load(bowl_model_path)
    return bat_model, bowl_model

def predict_points(model, df, features):
    df['predicted_points'] = model.predict(df[features])
    return df

def select_best_11(player_df):
    players = player_df.sort_values(by='predicted_points', ascending=False)

    final_team = []
    team_count = {}
    batsmen, bowlers, allrounders, wicketkeepers = 0, 0, 0, 0

    for _, row in players.iterrows():
        team = row['team1'] if row['team1'] == row['team2'] else row['team1']
        team_count.setdefault(team, 0)

        if team_count[team] >= 7:
            continue
        if row['role'] == 'batsman' and batsmen >= 5:
            continue
        if row['role'] == 'bowler' and bowlers >= 5:
            continue
        if row['role'] == 'wicketkeeper' and wicketkeepers >= 1:
            continue
        if row['role'] == 'allrounder' and allrounders >= 3:
            continue

        # Count role
        if row['role'] == 'batsman':
            batsmen += 1
        elif row['role'] == 'bowler':
            bowlers += 1
        elif row['role'] == 'allrounder':
            allrounders += 1
        elif row['role'] == 'wicketkeeper':
            wicketkeepers += 1

        final_team.append(row)
        team_count[team] += 1

        if len(final_team) == 11:
            break

    return pd.DataFrame(final_team)

if __name__ == "__main__":
    # Load models
    bat_model, bowl_model = load_models("03_models/batsman_model_xgb.pkl", "03_models/bowler_model.pkl")

    # Load unified match player data with role info
    player_df = pd.read_csv("01_data/match_input/match_players.csv")

    # Define features
    bat_features = ['career_avg', 'career_sr', 'last_5_avg', 'last_5_sr', 'venue_avg']
    bowl_features = ['career_wickets', 'career_eco', 'last_5_wkts', 'venue_wickets']

    # Predict points using appropriate model per role
    batsmen_df = player_df[player_df['role'] == 'batsman'].copy()
    bowlers_df = player_df[player_df['role'] == 'bowler'].copy()
    allrounders_df = player_df[player_df['role'] == 'allrounder'].copy()
    wicketkeepers_df = player_df[player_df['role'] == 'wicketkeeper'].copy()

    batsmen_df = predict_points(bat_model, batsmen_df, bat_features)
    bowlers_df = predict_points(bowl_model, bowlers_df, bowl_features)
    allrounders_df = predict_points(bat_model, allrounders_df, bat_features)  # same features for batting-focused allrounders
    wicketkeepers_df = predict_points(bat_model, wicketkeepers_df, bat_features)

    # Combine all players
    all_players = pd.concat([batsmen_df, bowlers_df, allrounders_df, wicketkeepers_df])

    # Select best 11
    best_11 = select_best_11(all_players)
    best_11.to_csv("01_data/output/best_fantasy_11.csv", index=False)
    print("✅ Best Fantasy 11 saved to: output/best_fantasy_11.csv")
