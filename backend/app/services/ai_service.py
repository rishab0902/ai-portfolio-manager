import os
import json
import google.generativeai as genai
from app.models import PortfolioSummary, AIRiskAnalysis, UserIntent
from app.services.market_data_service import get_latest_news

def analyze_portfolio(portfolio: PortfolioSummary, intent: UserIntent) -> AIRiskAnalysis:
    """Uses Gemini to analyze the portfolio and return a structured JSON response."""
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set in the environment variables.")
        
    genai.configure(api_key=api_key)
    
    # We will use the Pro or Flash model depending on what is available
    # Using experimental or pro model for best reasoning
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    # Fetch news for top 5 holdings to prevent API timeouts on large portfolios
    news_context = []
    top_holdings = sorted(portfolio.holdings, key=lambda x: x.quantity * x.currentPrice, reverse=True)[:5]
    for h in top_holdings:
        news_items = get_latest_news(h.symbol)
        if news_items:
            news_context.append(f"Recent news for {h.symbol}: " + ", ".join([n['title'] for n in news_items]))
            
    news_text = "\n".join(news_context) if news_context else "No significant recent news."
    
    prompt = f"""
You are an elite financial advisor AI and high-level portfolio manager (similar to a hedge fund advisor).
You are NOT a basic rule-based system. Before generating any portfolio recommendation, you MUST thoroughly consider the user's intent, goals, and emotional mindset.

USER INTENT & MINDSET:
- Investment Goal: {intent.goal}
- Risk Appetite: {intent.riskAppetite}
- Time Horizon: {intent.timeHorizon}
- Strategy Preference: {", ".join(intent.strategy)}
- Emotional Bias: {intent.emotion}

Your goals:
1. Analyze the portfolio based on sector diversification, overexposure, entry vs current price, and risk-adjusted return potential.
2. Generate recommendations in 3 buckets (BUY, HOLD, SELL).
3. Suggest portfolio rebalancing strategy and actionable insights.

IMPORTANT RULES:
* DO NOT recommend selling just because a stock is in loss.
* DO NOT recommend holding just because a stock is in profit.
* Justify each decision with solid reasoning aligned with the user's goal, strategy, and risk appetite.
* Be confident, logical, and data-driven in your tone.

The output MUST be STRICT JSON adhering exactly to this structure:
{{
   "summary": "High-level Strategy Summary explaining what changes are being made, why it improves the portfolio, and expected outcome...",
   "buy": [{{ "stock": "SYMBOL", "reason": "Justification based on goal/strategy..." }}],
   "hold": [{{ "stock": "SYMBOL", "reason": "Justification..." }}],
   "sell": [{{ "stock": "SYMBOL", "reason": "Justification..." }}],
   "risks": ["Risk point 1", "Risk point 2"],
   "rebalancing": "Actionable rebalancing strategy...",
   "confidence": "low|medium|high"
}}

PORTFOLIO DATA:
{portfolio.model_dump_json(indent=2)}

LATEST FINANCIAL NEWS RELEVANT TO HOLDINGS:
{news_text}

OUTPUT JSON ONLY. Do not use markdown blocks like ```json.
"""

    response = model.generate_content(prompt)
    text = response.text.strip()
    
    # Clean up standard markdown wrapping if the model ignored the instruction
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
        
    text = text.strip()
    
    try:
        data = json.loads(text)
        return AIRiskAnalysis(**data)
    except json.JSONDecodeError as e:
        print(f"Failed to parse JSON from Gemini: {text}")
        raise ValueError("Failed to parse AI response into strict JSON format.")
