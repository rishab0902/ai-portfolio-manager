from pydantic import BaseModel
from typing import List, Optional

class PortfolioItem(BaseModel):
    symbol: str
    stockName: str
    quantity: float
    avgPrice: float
    currentPrice: float
    profitLoss: float
    sector: Optional[str] = None

class PortfolioSummary(BaseModel):
    totalValue: float
    totalInvestment: float
    totalProfitLoss: float
    holdings: List[PortfolioItem]

class UserIntent(BaseModel):
    goal: str
    riskAppetite: str
    timeHorizon: str
    strategy: List[str]
    emotion: str

class AnalysisRequest(BaseModel):
    portfolio: PortfolioSummary
    intent: UserIntent

class AIRiskAnalysis(BaseModel):
    summary: str
    buy: List[dict]
    hold: List[dict]
    sell: List[dict]
    risks: List[str]
    rebalancing: str
    confidence: str
