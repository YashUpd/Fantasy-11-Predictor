# Cricket Fantasy Team Predictor - Dream11

![Cricket](https://img.shields.io/badge/Cricket-Fantasy-blue)
![Python](https://img.shields.io/badge/Python-3.8+-green)
![XGBoost](https://img.shields.io/badge/Model-XGBoost-red)
![Streamlit](https://img.shields.io/badge/UI-Streamlit-orange)

A comprehensive cricket fantasy team prediction system powered by machine learning. This project applies data engineering, feature extraction, and XGBoost modeling to predict the optimal Dream11 fantasy cricket team for upcoming matches.

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Detailed Methodology](#detailed-methodology)
  - [1. Data Collection & Conversion](#1-data-collection--conversion)
  - [2. Feature Engineering: Match Data Processing](#2-feature-engineering-match-data-processing)
  - [3. Feature Engineering: Player Statistics](#3-feature-engineering-player-statistics)
  - [4. Model Training with XGBoost](#4-model-training-with-xgboost)
  - [5. Team Selection Logic](#5-team-selection-logic)
  - [6. Performance Evaluation](#6-performance-evaluation)
  - [7. Interactive UI with Streamlit](#7-interactive-ui-with-streamlit)
- [Installation & Setup](#installation--setup)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Overview

This project aims to optimize Dream11 fantasy cricket team selection using machine learning. By analyzing historical player performance data, the system predicts player point scores and automatically selects an optimal 11-player team configuration that follows official Dream11 rules and constraints.

## Project Structure

cricket-fantasy-predictor/
│
├── 01_data/
│ ├── raw_yamls/ # Original YAML match data
│ ├── csv_matches/ # Converted CSV match data
│ ├── processed/ # Feature-engineered data
│ │ ├── batsman_data.csv
│ │ ├── bowler_data.csv
│ │ ├── batsman_features.csv
│ │ ├── bowler_features.csv
│ │ ├── batsman_train.csv
│ │ └── bowler_train.csv
│ └── output/ # Prediction results
│
├── 03_models/ # Trained model files
│ ├── batsman_model_xgb.pkl
│ └── bowler_model_xgb.pkl
│
├── extract_csv.py # YAML to CSV conversion
├── feature_engineering.py # Initial feature extraction
├── feature_engineering_and_split.py # Extended feature engineering
├── train_xgboost.py # Model training and evaluation
├── team_selector.py # Logic for team selection
├── eda.py # Exploratory data analysis
├── app.py # Streamlit web application
├── requirements.txt # Project dependencies
└── README.md # Project documentation



## Detailed Methodology

### 1. Data Collection & Conversion

The project begins by converting YAML cricket match data to structured CSV format for further processing.

#### YAML Data Structure

The raw data consists of YAML files containing ball-by-ball data for T20 cricket matches. Each YAML file represents a complete match with details such as:
- Teams playing
- Venue information
- Match date
- Ball-by-ball information:
  - Batsman and bowler names
  - Runs scored per ball
  - Wickets and dismissal types
  - Extras (wides, no-balls, byes, etc.)

#### YAML to CSV Conversion

The `extract_csv.py` script handles the conversion process:

1. **Setup and Configuration**:
   - The script identifies YAML files in the source directory
   - Creates the output directory if it doesn't exist

2. **Conversion Process**:
   - Iterates through each YAML file
   - Uses `yorkpy.analytics.convertYaml2PandasDataframeT20` to convert the data
   - Flattens the YAML into CSV format

3. **Error Handling**:
   - Includes robust error handling for YAML formatting issues
   - Logs detailed messages during processing

4. **Output**:
   - CSV files with columns: batsman, bowler, runs, delivery number, extras, wicket info

### 2. Feature Engineering: Match Data Processing

Script: `feature_engineering.py`

- Extracts and processes match-wise player stats
- Normalizes wicket data
- Aggregates:
  - Batsman stats: runs, strike rate, boundaries, ducks, 50s/100s
  - Bowler stats: wickets, economy, extras, 4W/5W hauls
- Compiles player-level datasets

### 3. Feature Engineering: Player Statistics

Script: `feature_engineering_and_split.py`

#### For Batsmen:
- Career averages
- Venue-specific stats
- Last 5-match trends

#### For Bowlers:
- Wickets and economy across career
- Venue-specific performance
- Last 5-match form

- Implements a time-based train-test split (train: 2008–2022, test: 2023–2025)

### 4. Model Training with XGBoost

Script: `train_xgboost.py`

- Trains separate XGBoost models for batsmen and bowlers
- Uses:
  - For batsmen: `career_avg`, `career_sr`, `venue_avg`, `last_5_avg`, `last_5_sr`
  - For bowlers: `career_wickets`, `career_eco`, `last_5_wkts`, `venue_wickets`
- Predicts fantasy points for unseen matches
- Saves models as `.pkl` files

### 5. Team Selection Logic

Script: `team_selector.py`

- Follows official Dream11 rules:
  - Max 7 players per team
  - Role limits (e.g., 5 batsmen, 5 bowlers, etc.)
- Sorts by predicted points and selects best 11 respecting all constraints

### 6. Performance Evaluation

(Evaluation methodology continued in actual project)

- Compares predicted teams with actual top-performing players
- Measures overlap and hypothetical points scored

### 7. Interactive UI with Streamlit

Script: `app.py`

- Launches a user-friendly web UI
- Allows input of team names and venue
- Outputs predicted best 11 players
- Provides visual analytics (via EDA module)

## Installation & Setup

```bash
git clone https://github.com/your-username/cricket-fantasy-predictor.git
cd cricket-fantasy-predictor
pip install -r requirements.txt
streamlit run app.py
