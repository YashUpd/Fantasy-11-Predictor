import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import (
    mean_squared_error,
    mean_absolute_error,
    r2_score,
    explained_variance_score
)
import joblib
import os

def train_and_evaluate(train_path, test_path, features, target, model_output_path):
    # Load data
    train_df = pd.read_csv(train_path)
    test_df = pd.read_csv(test_path)

    # Prepare input and output
    X_train = train_df[features]
    y_train = train_df[target]
    X_test = test_df[features]
    y_test = test_df[target]

    # Train model
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    # Predict
    y_pred = model.predict(X_test)

    # Evaluation metrics
    rmse = mean_squared_error(y_test, y_pred, squared=False)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    explained_var = explained_variance_score(y_test, y_pred)

    # Save model
    os.makedirs(os.path.dirname(model_output_path), exist_ok=True)
    joblib.dump(model, model_output_path)

    print(f"✅ Model trained. Metrics:")
    print(f"   RMSE:            {rmse:.2f}")
    print(f"   MAE:             {mae:.2f}")
    print(f"   R² Score:        {r2:.4f}")
    print(f"   Explained Var:   {explained_var:.4f}")
    print(f"📦 Model saved to:  {model_output_path}")
    
    return model, rmse


if __name__ == "__main__":
    # Batsman training
    bat_features = ['career_avg', 'career_sr', 'last_5_avg', 'last_5_sr', 'venue_avg']
    bat_model_path = "03_models/batsman_model.pkl"

    train_and_evaluate(
        train_path="01_data/processed/batsman_train.csv",
        test_path="01_data/processed/batsman_test.csv",
        features=bat_features,
        target='points',
        model_output_path=bat_model_path
    )

    # Bowler training
    bowl_features = ['career_wickets', 'career_eco', 'last_5_wkts', 'venue_wickets']
    bowl_model_path = "03_models/bowler_model.pkl"

    train_and_evaluate(
        train_path="01_data/processed/bowler_train.csv",
        test_path="01_data/processed/bowler_test.csv",
        features=bowl_features,
        target='points',
        model_output_path=bowl_model_path
    )
