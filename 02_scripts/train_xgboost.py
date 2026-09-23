import pandas as pd
from xgboost import XGBRegressor
import joblib
import os


def train_xgb_model(train_df, features, target):
    model = XGBRegressor(n_estimators=100, max_depth=4, learning_rate=0.1, random_state=42)
    model.fit(train_df[features], train_df[target])
    return model


def predict_points(model, df, features):
    df = df.copy()
    df['predicted_points'] = model.predict(df[features])
    return df


def evaluate_combined_matches(bat_df, bowl_df):
    bat_df['player'] = bat_df['batsman']
    bowl_df['player'] = bowl_df['bowler']
    bat_df['role'] = 'batsman'
    bowl_df['role'] = 'bowler'

    all_players = pd.concat([bat_df, bowl_df], ignore_index=True)
    all_players['date'] = pd.to_datetime(all_players['date'])

    grouped = all_players.groupby(['team1', 'team2', 'venue', 'date'])

    match_results = []

    for (team1, team2, venue, date), match_df in grouped:
        match_id = f"{team1}_vs_{team2}_{date.strftime('%Y-%m-%d')}"

        match_df = match_df.dropna(subset=['points', 'predicted_points'])

        actual_best = match_df.sort_values(by='points', ascending=False).head(11)['player'].tolist()
        predicted_best = match_df.sort_values(by='predicted_points', ascending=False).head(11)['player'].tolist()

        overlap = len(set(actual_best).intersection(set(predicted_best)))

        print(f"📅 {match_id} | ✅ Overlap: {overlap}/11")

        match_results.append({
            'match_id': match_id,
            'date': date.date(),
            'venue': venue,
            'actual_best_11': actual_best,
            'predicted_best_11': predicted_best,
            'overlap_count': overlap
        })

    result_df = pd.DataFrame(match_results)

    # 🔍 Accuracy Calculation
    if not result_df.empty:
        overall_accuracy = result_df["overlap_count"].mean() / 11 * 100
        print(f"\n🎯 Overall Model Accuracy (avg overlap): {overall_accuracy:.2f}%")
    else:
        print("\n⚠️ No matches evaluated. Empty result set.")

    os.makedirs("01_data/output", exist_ok=True)
    result_df.to_csv("01_data/output/match_evaluation_combined.csv", index=False)
    print("\n📁 Saved combined match evaluation to: 01_data/output/match_evaluation_combined.csv")


if __name__ == "__main__":
    # Paths
    bat_train_path = "01_data/processed/batsman_train.csv"
    bat_test_path = "01_data/processed/batsman_test.csv"
    bowl_train_path = "01_data/processed/bowler_train.csv"
    bowl_test_path = "01_data/processed/bowler_test.csv"

    # Features
    bat_features = ['career_avg', 'career_sr', 'last_5_avg', 'last_5_sr', 'venue_avg']
    bowl_features = ['career_wickets', 'career_eco', 'last_5_wkts', 'venue_wickets']

    # Load Data
    bat_train = pd.read_csv(bat_train_path)
    bat_test = pd.read_csv(bat_test_path)
    bowl_train = pd.read_csv(bowl_train_path)
    bowl_test = pd.read_csv(bowl_test_path)

    # Train Models
    bat_model = train_xgb_model(bat_train, bat_features, 'points')
    bowl_model = train_xgb_model(bowl_train, bowl_features, 'points')

    # Save Models
    joblib.dump(bat_model, "03_models/batsman_model_xgb.pkl")
    joblib.dump(bowl_model, "03_models/bowler_model_xgb.pkl")
    print("✅ Models saved to 03_models/")

    # Predict
    bat_test = predict_points(bat_model, bat_test, bat_features)
    bowl_test = predict_points(bowl_model, bowl_test, bowl_features)

    # Evaluate combined matches
    evaluate_combined_matches(bat_test, bowl_test)
