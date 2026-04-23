from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import portfolio, analysis
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="AI Portfolio Manager")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # SonarQube Security Fix: No wildcards
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"], # SonarQube Security Fix: Explicit methods
    allow_headers=["*"],
)

app.include_router(portfolio.router, prefix="/api")
app.include_router(analysis.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "AI Portfolio Manager API is running"}
