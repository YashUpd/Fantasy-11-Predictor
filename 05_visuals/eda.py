import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

# Load datasets
batsman_df = pd.read_csv("01_data/processed/batsman_d11.csv", parse_dates=['date'])
bowler_df = pd.read_csv("01_data/processed/bowler_d11.csv", parse_dates=['date'])
batsman_feat = pd.read_csv("01_data/processed/batsman_features.csv", parse_dates=['date'])
bowler_feat = pd.read_csv("01_data/processed/bowler_features.csv", parse_dates=['date'])

sns.set(style="whitegrid")
plt.rcParams["figure.figsize"] = (12, 6)

# ---- Batsman Plots ----

def batsman_eda():
    st.subheader("Top 15 Run Scorers")
    top_runs = batsman_df.groupby('batsman')['runs'].sum().nlargest(15).reset_index()
    st.plotly_chart(px.bar(top_runs, x='batsman', y='runs'))

    st.subheader("Most Fours")
    top_4s = batsman_df.groupby('batsman')['4s'].sum().nlargest(15).reset_index()
    st.plotly_chart(px.bar(top_4s, x='batsman', y='4s'))

    st.subheader("Most Sixes")
    top_6s = batsman_df.groupby('batsman')['6s'].sum().nlargest(15).reset_index()
    st.plotly_chart(px.bar(top_6s, x='batsman', y='6s'))

    st.subheader("Top Strike Rates (min 10 innings)")
    temp = batsman_df.groupby('batsman').agg({'strike_rate': 'mean', 'runs': 'count'}).reset_index()
    temp = temp[temp['runs'] >= 10].sort_values('strike_rate', ascending=False).head(15)
    st.plotly_chart(px.bar(temp, x='batsman', y='strike_rate'))

    st.subheader("Most Ducks")
    ducks = batsman_df.groupby('batsman')['ducks'].sum().nlargest(15).reset_index()
    st.plotly_chart(px.bar(ducks, x='batsman', y='ducks'))

    st.subheader("Most 50s")
    top_50s = batsman_df.groupby('batsman')['50s'].sum().nlargest(15).reset_index()
    st.plotly_chart(px.bar(top_50s, x='batsman', y='50s'))

    st.subheader("Most 100s")
    top_100s = batsman_df.groupby('batsman')['100s'].sum().nlargest(15).reset_index()
    st.plotly_chart(px.bar(top_100s, x='batsman', y='100s'))



    st.subheader("Batsman Feature Correlation")
    fig, ax = plt.subplots()
    sns.heatmap(batsman_feat.select_dtypes(include='number').corr(), annot=True, fmt=".2f", ax=ax)
    st.pyplot(fig)

    st.subheader("Runs by Venue")
    top_venue = batsman_df.groupby('venue')['runs'].sum().nlargest(10).reset_index()
    st.plotly_chart(px.bar(top_venue, x='venue', y='runs'))

    st.subheader("Run Consistency of Top 10 Batsmen")
    top_batsmen = batsman_df.groupby('batsman')['runs'].sum().nlargest(10).index
    fig, ax = plt.subplots()
    sns.boxplot(data=batsman_df[batsman_df['batsman'].isin(top_batsmen)], x='batsman', y='runs', ax=ax)
    ax.set_title("Run Consistency")
    ax.tick_params(axis='x', rotation=45)
    st.pyplot(fig)

# ---- Bowler Plots ----

def bowler_eda():
    st.subheader("Top Wicket Takers")
    top_wkts = bowler_df.groupby('bowler')['wicket'].sum().nlargest(15).reset_index()
    st.plotly_chart(px.bar(top_wkts, x='bowler', y='wicket'))

    st.subheader("Best Economy Rates")
    eco = bowler_df.groupby('bowler').agg({'economy': 'mean', 'overs': 'sum'})
    eco = eco[eco['overs'] >= 20].sort_values('economy').head(15).reset_index()
    st.plotly_chart(px.bar(eco, x='bowler', y='economy'))

    st.subheader("Most Overs Bowled")
    overs = bowler_df.groupby('bowler')['overs'].sum().nlargest(15).reset_index()
    st.plotly_chart(px.bar(overs, x='bowler', y='overs'))

    st.subheader("Most 4-Wicket Hauls")
    f4 = bowler_df.groupby('bowler')['4w'].sum().nlargest(15).reset_index()
    st.plotly_chart(px.bar(f4, x='bowler', y='4w'))

    st.subheader("Most 5-Wicket Hauls")
    f5 = bowler_df.groupby('bowler')['5w'].sum().nlargest(15).reset_index()
    st.plotly_chart(px.bar(f5, x='bowler', y='5w'))


    st.subheader("Bowler Feature Correlation")
    fig, ax = plt.subplots()
    sns.heatmap(bowler_feat.select_dtypes(include='number').corr(), annot=True, fmt=".2f", ax=ax)
    st.pyplot(fig)

    st.subheader("Most Dot Balls Bowled")
    bowler_df['dot_balls'] = bowler_df['delivery'] - (bowler_df['runs'] + bowler_df['byes'] + bowler_df['legbyes'])
    dots = bowler_df.groupby('bowler')['dot_balls'].sum().nlargest(15).reset_index()
    st.plotly_chart(px.bar(dots, x='bowler', y='dot_balls'))

    st.subheader("Most Wickets per Venue")
    top = bowler_df.groupby(['venue', 'bowler'])['wicket'].sum().reset_index()
    top = top.groupby('venue').apply(lambda x: x.nlargest(1, 'wicket')).reset_index(drop=True)
    st.plotly_chart(px.bar(top, x='venue', y='wicket', color='bowler'))

# ---- Combined/Advanced ----

def combined_analysis():

    st.subheader("Average Batsman Fantasy Points Per Year")
    batsman_df['year'] = batsman_df['date'].dt.year
    yearly = batsman_df.groupby('year')['points'].mean().reset_index()
    st.plotly_chart(px.line(yearly, x='year', y='points'))


    st.subheader("Top High-Scoring Matches (Total Points)")
    match_scores = batsman_df.groupby(['team1', 'team2', 'venue', 'date'])['points'].sum().reset_index()
    top_matches = match_scores.nlargest(15, 'points')
    st.plotly_chart(px.bar(top_matches, x='venue', y='points', hover_data=['team1', 'team2', 'date']))

    st.subheader("Team-wise Batting Points")
    team_points = batsman_df.groupby('team1')['points'].sum().nlargest(10).reset_index()
    st.plotly_chart(px.pie(team_points, names='team1', values='points', title='Total Batting Points by Team'))

    st.subheader("Team-wise Bowling Points")
    team_bowl_points = bowler_df.groupby('team1')['points'].sum().nlargest(10).reset_index()
    st.plotly_chart(px.pie(team_bowl_points, names='team1', values='points', title='Total Bowling Points by Team'))



