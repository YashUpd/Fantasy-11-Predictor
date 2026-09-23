import pandas as pd
import os

def engineer_batsman_features(csv_path: str, output_path: str):
    df = pd.read_csv(csv_path)
    df['date'] = pd.to_datetime(df['date'])

    # Career average and strike rate
    career_stats = df.groupby('batsman').agg({
        'runs': 'mean',
        'strike_rate': 'mean'
    }).rename(columns={'runs': 'career_avg', 'strike_rate': 'career_sr'}).reset_index()

    # Venue average
    venue_avg = df.groupby(['batsman', 'venue'])['runs'].mean().reset_index()
    venue_avg = venue_avg.rename(columns={'runs': 'venue_avg'})

    # Last 5 match rolling stats
    df = df.sort_values(by=['batsman', 'date'])
    df['last_5_avg'] = df.groupby('batsman')['runs'].transform(lambda x: x.rolling(5, min_periods=1).mean())
    df['last_5_sr'] = df.groupby('batsman')['strike_rate'].transform(lambda x: x.rolling(5, min_periods=1).mean())

    # Merge in features
    df = df.merge(career_stats, on='batsman', how='left')
    df = df.merge(venue_avg, on=['batsman', 'venue'], how='left')

    # Save engineered dataset
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)

    print(f"✅ Batsman features saved to {output_path}")
    return df


def engineer_bowler_features(csv_path: str, output_path: str):
    df = pd.read_csv(csv_path)
    df['date'] = pd.to_datetime(df['date'])

    # Career avg wickets & economy
    career_stats = df.groupby('bowler').agg({
        'wicket': 'mean',
        'economy': 'mean'
    }).rename(columns={'wicket': 'career_wickets', 'economy': 'career_eco'}).reset_index()

    # Venue avg wickets
    venue_stats = df.groupby(['bowler', 'venue'])['wicket'].mean().reset_index()
    venue_stats = venue_stats.rename(columns={'wicket': 'venue_wickets'})

    # Last 5 match rolling wickets
    df = df.sort_values(by=['bowler', 'date'])
    df['last_5_wkts'] = df.groupby('bowler')['wicket'].transform(lambda x: x.rolling(5, min_periods=1).mean())

    # Merge in features
    df = df.merge(career_stats, on='bowler', how='left')
    df = df.merge(venue_stats, on=['bowler', 'venue'], how='left')

    # Save engineered dataset
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)

    print(f"✅ Bowler features saved to {output_path}")
    return df


def split_by_year(df: pd.DataFrame, year: int):
    train_df = df[df['date'].dt.year < year]
    test_df = df[df['date'].dt.year >= year]
    return train_df, test_df


if __name__ == "__main__":
    # File paths
    batsman_csv = "01_data/processed/batsman_d11.csv"
    bowler_csv = "01_data/processed/bowler_d11.csv"
    batsman_out = "01_data/processed/batsman_features.csv"
    bowler_out = "01_data/processed/bowler_features.csv"

    # Feature engineering
    batsman_df = engineer_batsman_features(batsman_csv, batsman_out)
    bowler_df = engineer_bowler_features(bowler_csv, bowler_out)

    # Train-test split by year (2008–2022 training, 2023–2025 testing)
    bat_train, bat_test = split_by_year(batsman_df, 2023)
    bowl_train, bowl_test = split_by_year(bowler_df, 2023)

    # Save splits
    bat_train.to_csv("01_data/processed/batsman_train.csv", index=False)
    bat_test.to_csv("01_data/processed/batsman_test.csv", index=False)
    bowl_train.to_csv("01_data/processed/bowler_train.csv", index=False)
    bowl_test.to_csv("01_data/processed/bowler_test.csv", index=False)

    print("✅ Data split into training and testing sets by year.")
