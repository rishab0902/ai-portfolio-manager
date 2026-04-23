import yfinance as yf
import re

def get_current_price(symbol: str) -> float:
    """Fetch current price using yfinance. Support Indian NSE/BSE symbols."""
    # Ensure symbol has .NS suffix for Indian stocks if not provided
    if not symbol.endswith('.NS') and not symbol.endswith('.BO'):
        symbol = f"{symbol}.NS"
        
    try:
        ticker = yf.Ticker(symbol)
        data = ticker.history(period="1d")
        if not data.empty:
            return round(data['Close'].iloc[-1], 2)
        return 0.0
    except Exception as e:
        print(f"Error fetching price for {symbol}: {e}")
        return 0.0

def get_latest_news(symbol: str) -> list:
    """Mock news to bypass broken yfinance API that causes 50-second timeouts."""
    return []
