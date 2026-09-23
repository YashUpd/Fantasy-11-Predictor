import streamlit as st
import pandas as pd
import joblib
import requests
import json
from datetime import datetime
from team_selector import load_models, predict_points, select_best_11
from eda import batsman_eda, bowler_eda, combined_analysis

# Load your trained models
bat_model, bowl_model = load_models("03_models/batsman_model_xgb.pkl", "03_models/bowler_model_xgb.pkl")

# Streamlit UI
st.set_page_config(page_title="Dream11 Team Predictor & EDA", layout="wide")
st.title("🏏 Dream11 Fantasy Cricket - Team Predictor & EDA Dashboard")

# Sidebar Navigation
section = st.sidebar.radio("Choose Section:", ["Match Updates","Team Predictor", "Batsman Analysis", "Bowler Analysis", "Combined Insights" ])

if section == "Team Predictor":
    st.write("Upload your input CSV file containing player data:")
    uploaded_file = st.file_uploader("Choose a CSV file", type="csv")

    if uploaded_file is not None:
        # Read the uploaded CSV file
        player_df = pd.read_csv(uploaded_file)
        
        # Display the uploaded data
        st.write("Uploaded Data:")
        st.dataframe(player_df)
        
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
        if st.button("Predict Best Team"):
            best_11 = select_best_11(all_players)
            
            # Save the predicted team to a CSV file
            output_file = "01_data/output/predicted_best_team.csv"
            best_11.to_csv(output_file, index=False)
            
            st.write("Predicted Best Team:")
            st.dataframe(best_11)
            
            # Provide a download link for the predicted CSV file
            st.download_button(
                label="Download Predicted Team CSV",
                data=best_11.to_csv(index=False).encode('utf-8'),
                file_name="predicted_best_team.csv",
                mime='text/csv'
            )

elif section == "Batsman Analysis":
    st.header("📊 Batsman Analysis")
    batsman_eda()

elif section == "Bowler Analysis":
    st.header("🎯 Bowler Analysis")
    bowler_eda()

elif section == "Combined Insights":
    st.header("🔁 Combined/Comparative Insights")
    combined_analysis()

elif section == "Match Updates":
    st.header("🏏 Live Match Updates & Upcoming Fixtures")
    
    # Function to fetch cricket data from CricAPI
    @st.cache_data(ttl=300)  # Cache for 5 minutes
    def fetch_cricket_data():
        try:
            # Using Cricket Data API (free tier)
            api_key = "02612d40-b143-4bbb-b68e-b6d26732a66e"  # Your API key
            
            # For demo purposes, if you want to use sample data instead
            if False:  # Changed to always use the API
                # Return sample data
                return {
                    "live_matches": [
                        {
                            "id": "sample1",
                            "name": "India vs Australia, 3rd ODI",
                            "status": "India 245/6 (42.3 ov)",
                            "venue": "Melbourne Cricket Ground",
                            "date": "2025-05-02"
                        }
                    ],
                    "upcoming_matches": [
                        {
                            "id": "upcoming1",
                            "name": "England vs New Zealand, 1st Test",
                            "venue": "Lord's, London",
                            "date": "2025-05-05"
                        },
                        {
                            "id": "upcoming2",
                            "name": "Pakistan vs South Africa, 2nd T20I",
                            "venue": "Lahore Stadium",
                            "date": "2025-05-07"
                        },
                        {
                            "id": "upcoming3",
                            "name": "India vs Sri Lanka, 1st T20I",
                            "venue": "R Premadasa Stadium, Colombo",
                            "date": "2025-05-09"
                        }
                    ]
                }
            
            # When you have a working API key, uncomment this code:
            api_key = "02612d40-b143-4bbb-b68e-b6d26732a66e"  # Your API key
            live_matches_url = f"https://api.cricapi.com/v1/currentMatches?apikey={api_key}&offset=0"
            upcoming_matches_url = f"https://api.cricapi.com/v1/matches?apikey={api_key}&offset=0"
            
            live_matches_resp = requests.get(live_matches_url)
            upcoming_matches_resp = requests.get(upcoming_matches_url)
            
            if live_matches_resp.status_code == 200 and upcoming_matches_resp.status_code == 200:
                live_data = live_matches_resp.json()
                upcoming_data = upcoming_matches_resp.json()
                
                # Process API data to match our expected format
                live_matches = []
                for match in live_data.get('data', []):
                    live_matches.append({
                        'id': match.get('id'),
                        'name': match.get('name'),
                        'status': match.get('status'),
                        'venue': match.get('venue'),
                        'date': match.get('date')
                    })
                    
                upcoming_matches = []
                for match in upcoming_data.get('data', []):
                    if match.get('matchStarted') == False:
                        upcoming_matches.append({
                            'id': match.get('id'),
                            'name': match.get('name'),
                            'venue': match.get('venue'),
                            'date': match.get('date')
                        })
                
                return {
                    "live_matches": live_matches,
                    "upcoming_matches": upcoming_matches
                }
            else:
                st.error(f"API request failed: {live_matches_resp.status_code}, {upcoming_matches_resp.status_code}")
                return {"live_matches": [], "upcoming_matches": []}
                
        except Exception as e:
            st.error(f"Error fetching cricket data: {e}")
            return {"live_matches": [], "upcoming_matches": []}

    # Fetch cricket data
    cricket_data = fetch_cricket_data()
    
    # Create tabs for live and upcoming matches
    tab1, tab2 = st.tabs(["Live Matches", "Upcoming Matches"])
    
    with tab1:
        st.subheader("Currently Live Matches")
        
        if not cricket_data["live_matches"]:
            st.info("No live matches at the moment.")
        else:
            for match in cricket_data["live_matches"]:
                with st.expander(match["name"]):
                    col1, col2 = st.columns(2)
                    with col1:
                        st.write(f"**Status:** {match['status']}")
                        st.write(f"**Date:** {match['date']}")
                    with col2:
                        st.write(f"**Venue:** {match['venue']}")
                        
                    # Add a button to view detailed scoreboard (for future implementation)
                    if st.button(f"View Detailed Scoreboard", key=f"score_{match['id']}"):
                        st.info("Detailed scoreboard functionality coming soon!")
    
    with tab2:
        st.subheader("Upcoming Cricket Matches")
        
        if not cricket_data["upcoming_matches"]:
            st.info("No upcoming matches found.")
        else:
            # Create a DataFrame for better display
            upcoming_df = pd.DataFrame(cricket_data["upcoming_matches"])
            
            # Sort matches by date
            upcoming_df['date'] = pd.to_datetime(upcoming_df['date'])
            upcoming_df = upcoming_df.sort_values('date')
            
            # Format the date back to string for display
            upcoming_df['date'] = upcoming_df['date'].dt.strftime('%Y-%m-%d')
            
            # Display as a table
            st.dataframe(
                upcoming_df[['name', 'venue', 'date']],
                column_config={
                    "name": "Match",
                    "venue": "Venue",
                    "date": "Date"
                },
                hide_index=True,
                use_container_width=True
            )
            
            # Add a reminder feature
            st.write("### Set Reminder for a Match")
            selected_match = st.selectbox("Select a match:", upcoming_df['name'].tolist())
            
            if st.button("Set Reminder"):
                st.success(f"✅ Reminder set for {selected_match}! You'll be notified before the match begins.")
                st.balloons()