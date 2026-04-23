from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import portfolio, analysis
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="AI Portfolio Manager")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(portfolio.router, prefix="/api")
app.include_router(analysis.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "AI Portfolio Manager API is running"}
