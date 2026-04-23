from fastapi import APIRouter, HTTPException
from app.models import AnalysisRequest, AIRiskAnalysis
from app.services.ai_service import analyze_portfolio

router = APIRouter()

@router.post("/analyze", response_model=AIRiskAnalysis)
def perform_ai_analysis(payload: AnalysisRequest):
    """Run Gemini API analysis on the provided portfolio and intent"""
    try:
        analysis = analyze_portfolio(payload.portfolio, payload.intent)
        return analysis
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"AI ERROR FATAL: {e}")
        raise HTTPException(status_code=500, detail=f"AI Error: {str(e)}")
