import os
from dotenv import load_dotenv
from app.services.ai_service import analyze_portfolio
from app.models import PortfolioSummary, PortfolioItem

load_dotenv()

mock_item = PortfolioItem(
    symbol="RELIANCE", stockName="Reliance", quantity=10, avgPrice=2000, currentPrice=2500, profitLoss=5000, sector="Energy"
)
summary = PortfolioSummary(totalValue=25000, totalInvestment=20000, totalProfitLoss=5000, holdings=[mock_item])

try:
    print("Testing Gemini model...")
    result = analyze_portfolio(summary)
    print("SUCCESS!")
    print(result.overall_recommendation)
except Exception as e:
    print(f"FAILED: {e}")
