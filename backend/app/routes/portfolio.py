from fastapi import APIRouter, UploadFile, File, HTTPException
from app.models import PortfolioSummary
from app.services.portfolio_service import get_zerodha_portfolio, parse_groww_csv

router = APIRouter()

@router.get("/portfolio", response_model=PortfolioSummary)
def get_portfolio():
    """Fetch Zerodha holdings via Kite API with auto-login fallback"""
    return get_zerodha_portfolio()

@router.post("/upload-groww", response_model=PortfolioSummary)
async def upload_groww(file: UploadFile = File(...)):
    """Upload Groww CSV or Excel and process it"""
    if not (file.filename.endswith('.csv') or file.filename.endswith('.xlsx')):
        raise HTTPException(status_code=400, detail="Only CSV or XLSX files are allowed.")
        
    content = await file.read()
    try:
        portfolio = parse_groww_csv(content, file.filename)
        return portfolio
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
