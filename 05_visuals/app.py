import streamlit as st
from eda import batsman_eda, bowler_eda, combined_analysis

st.set_page_config(page_title="Dream11 Advanced EDA", layout="wide")
st.title("🏏 Dream11 Fantasy Cricket - Advanced EDA Dashboard")

# Sidebar Navigation
section = st.sidebar.radio("Choose EDA Section:", ["Batsman Analysis", "Bowler Analysis", "Combined Insights"])

if section == "Batsman Analysis":
    st.header("📊 Batsman Analysis")
    batsman_eda()

elif section == "Bowler Analysis":
    st.header("🎯 Bowler Analysis")
    bowler_eda()

elif section == "Combined Insights":
    st.header("🔁 Combined/Comparative Insights")
    combined_analysis()
