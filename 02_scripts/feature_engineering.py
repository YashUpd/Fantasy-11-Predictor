import os
import pandas as pd
from tqdm import tqdm
import ast
import json

# ✅ Improved wicket column processing
def fix_wicket_column(df):
    def is_wicket(x):
        # Handle NaN/None cases first
        if pd.isna(x):
            return 0
        
        # Handle string representations
        if isinstance(x, str):
            x = x.strip()
            if x == '0' or x == '':
                return 0
            try:
                # Try to parse as dict (both JSON and Python literal formats)
                try:
                    parsed = json.loads(x)
                except json.JSONDecodeError:
                    parsed = ast.literal_eval(x)
                if isinstance(parsed, dict):
                    return 1
                return 0
            except:
                return 0
        
        # Handle dictionary cases
        if isinstance(x, dict):
            return 1
        
        # Handle numeric cases
        try:
            return 1 if float(x) != 0 else 0
        except:
            return 0
    
    if 'wicket' not in df.columns:
        df['wicket'] = 0
    else:
        df['wicket'] = df['wicket_dict'].apply(is_wicket)
    return df

# ✅ Batting stats (unchanged)
def extract_batting_stats(df):
    batting = df.groupby(['batsman', 'team1', 'team2', 'venue', 'date']).agg({
        'runs': 'sum',
        'delivery': 'count',
        '4s': 'sum',
        '6s': 'sum',
        'ducks': 'sum',
    }).reset_index()

    batting['strike_rate'] = (batting['runs'] / batting['delivery']) * 100
    batting['50s'] = batting['runs'].apply(lambda x: 1 if 50 <= x < 100 else 0)
    batting['100s'] = batting['runs'].apply(lambda x: 1 if x >= 100 else 0)

    return batting

# ✅ Bowling stats (unchanged)
def extract_bowling_stats(df):
    for col in ['noballs', 'byes', 'legbyes', 'wicket']:
        if col not in df.columns:
            df[col] = 0

    df_bowl = df[df['noballs'] == 0].copy()

    df_bowl['over_ball'] = df_bowl['delivery'].apply(
        lambda x: float(str(x).split('.')[0]) + float(str(x).split('.')[1])/6
        if isinstance(x, (int, float, str)) and '.' in str(x)
        else 0.0
    )

    bowling = df_bowl.groupby(['bowler', 'team1', 'team2', 'venue', 'date']).agg({
        'delivery': 'count',
        'runs': 'sum',
        'wicket': 'sum',
        'byes': 'sum',
        'legbyes': 'sum'
    }).reset_index()

    bowling['overs'] = bowling['delivery'] // 6 + (bowling['delivery'] % 6) / 10
    bowling['economy'] = bowling['runs'] / bowling['overs'].replace(0, 0.1)
    bowling['4w'] = bowling['wicket'].apply(lambda x: 1 if x == 4 else 0)
    bowling['5w'] = bowling['wicket'].apply(lambda x: 1 if x >= 5 else 0)

    return bowling

# ✅ Preprocess all matches with better error handling
def preprocess_all_matches(csv_folder, output_folder="01_data/processed"):
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    batsman_df_list = []
    bowler_df_list = []

    for file in tqdm(os.listdir(csv_folder)):
        if not file.endswith(".csv"):
            continue

        match_path = os.path.join(csv_folder, file)
        try:
            # Read CSV with proper handling of quoted fields
            df = pd.read_csv(match_path, keep_default_na=False)
            
            # Ensure all required columns exist
            for col in ['runs', 'delivery', 'noballs', 'byes', 'legbyes', 'wicket']:
                if col not in df.columns:
                    df[col] = 0

            # Pre-process wicket column
            df = fix_wicket_column(df)

            # Calculate derived fields
            df['4s'] = df['runs'].apply(lambda x: 1 if x == 4 else 0)
            df['6s'] = df['runs'].apply(lambda x: 1 if x == 6 else 0)
            df['ducks'] = df.apply(lambda row: 1 if row['runs'] == 0 and row['wicket'] == 1 else 0, axis=1)

            # Extract stats
            bats_df = extract_batting_stats(df)
            bowl_df = extract_bowling_stats(df)

            batsman_df_list.append(bats_df)
            bowler_df_list.append(bowl_df)

        except Exception as e:
            print(f"❌ Error processing {file}: {str(e)}")
            continue

    # Save results
    if batsman_df_list:
        final_batsman_df = pd.concat(batsman_df_list, ignore_index=True)
        final_batsman_df.to_csv(os.path.join(output_folder, "batsman_data.csv"), index=False)
        print("✅ Batsman data saved.")
    else:
        print("⚠️ No valid batsman data to save.")

    if bowler_df_list:
        final_bowler_df = pd.concat(bowler_df_list, ignore_index=True)
        final_bowler_df.to_csv(os.path.join(output_folder, "bowler_data.csv"), index=False)
        print("✅ Bowler data saved.")
    else:
        print("⚠️ No valid bowler data to save.")

if __name__ == "__main__":
    csv_input_folder = "01_data/csv_matches"
    preprocess_all_matches(csv_input_folder)