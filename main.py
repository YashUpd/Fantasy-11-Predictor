"""
Main application entry point for the Fantasy 11 Cricket Predictor.
Allows running:
    uvicorn main:app --reload --port 8000
or:
    python main.py
"""
import sys
from pathlib import Path

# Add project root and api directory to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent
API_DIR = PROJECT_ROOT / "api"

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))

# Import the FastAPI app instance from api/index.py
from api.index import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
