import os
import pandas as pd
import io
import logging
from app.models import PortfolioItem, PortfolioSummary
from app.services.market_data_service import get_current_price
from app.services.zerodha_auth import get_kite_instance

logger = logging.getLogger(__name__)

def get_mock_zerodha_portfolio() -> PortfolioSummary:
    """Mock an API fetch from Zerodha Kite"""
    holdings = [
        {"symbol": "RELIANCE", "stockName": "Reliance Industries", "quantity": 10, "avgPrice": 2500.0, "sector": "Energy"},
        {"symbol": "TCS", "stockName": "Tata Consultancy Services", "quantity": 15, "avgPrice": 3500.0, "sector": "Technology"},
        {"symbol": "HDFCBANK", "stockName": "HDFC Bank", "quantity": 50, "avgPrice": 1600.0, "sector": "Financials"},
        {"symbol": "ITC", "stockName": "ITC Limited", "quantity": 100, "avgPrice": 400.0, "sector": "Consumer Goods"}
    ]
    
    return _process_holdings(holdings)

def get_zerodha_portfolio() -> PortfolioSummary:
    """Fetch real holdings from Zerodha Kite API."""
    # First try: use credentials provided via frontend setup
    try:
        from app.routes.zerodha import get_stored_credentials
        from kiteconnect import KiteConnect

        creds = get_stored_credentials()
        if creds["api_key"] and creds["access_token"]:
            kite = KiteConnect(api_key=creds["api_key"])
            kite.set_access_token(creds["access_token"])
            try:
                kite_holdings = kite.holdings()
                return _build_portfolio_from_kite(kite_holdings)
            except Exception as e:
                logger.error(f"Frontend credentials failed: {e}")
    except ImportError:
        pass

    # Fallback: use .env-based credentials
    kite = get_kite_instance()

    if not kite:
        logger.warning("Kite API credentials not found. Falling back to mock portfolio.")
        return get_mock_zerodha_portfolio()

    try:
        kite_holdings = kite.holdings()
        return _build_portfolio_from_kite(kite_holdings)
    except Exception as e:
        logger.error(f"Error fetching from Kite. Your token might be expired. Falling back to mock portfolio. Error: {str(e)}")
        return get_mock_zerodha_portfolio()


def _build_portfolio_from_kite(kite_holdings: list) -> PortfolioSummary:
    """Build PortfolioSummary from raw Kite holdings data."""
    processed_holdings = []
    total_val = 0.0
    total_inv = 0.0

    for h in kite_holdings:
        if h['quantity'] > 0:
            sym = h['tradingsymbol']
            current_price = h.get('last_price', h['average_price'])
            inv = h['quantity'] * h['average_price']
            val = h['quantity'] * current_price
            pl = val - inv

            pi = PortfolioItem(
                symbol=sym,
                stockName=sym,
                quantity=h['quantity'],
                avgPrice=h['average_price'],
                currentPrice=current_price,
                profitLoss=round(pl, 2),
                sector="Unknown"
            )
            processed_holdings.append(pi)
            total_inv += inv
            total_val += val

    if not processed_holdings:
        logger.info("No active holdings found in Zerodha account.")
        return _process_holdings([])

    return PortfolioSummary(
        totalValue=round(total_val, 2),
        totalInvestment=round(total_inv, 2),
        totalProfitLoss=round(total_val - total_inv, 2),
        holdings=processed_holdings
    )

def parse_groww_csv(file_contents: bytes, filename: str = "portfolio.csv") -> PortfolioSummary:

    """Parse a CSV or Excel exported from Groww"""
    # Assuming basic Groww format: 
    # Symbol, Stock Name, Quantity, Average Price
    
    if filename.lower().endswith('.xlsx'):
        df = pd.read_excel(io.BytesIO(file_contents), header=None)
    else:
        df = pd.read_csv(io.BytesIO(file_contents), header=None)
        
    # Dynamically find the header row (the row that contains 'Stock Name' or 'Symbol')
    header_idx = 0
    for i, row in df.iterrows():
        # Convert row to string and check if 'Stock Name' or 'Symbol' is in it
        row_str = " ".join([str(x).lower() for x in row.values])
        if 'stock name' in row_str or 'symbol' in row_str:
            header_idx = i
            break
            
    # Promote that row to be the actual header and drop everything above it
    df.columns = df.iloc[header_idx].astype(str).str.strip()
    df = df.iloc[header_idx + 1:].reset_index(drop=True)
    
    # Drop rows that have NaN in the Stock Name / Symbol column
    df = df.dropna(subset=[df.columns[0]])
    
    # Try to map common column names just in case
    col_mapping = {
        'Symbol': 'symbol', 'Ticker': 'symbol', 'ISIN': 'symbol',
        'Stock Name': 'stockName', 'Name': 'stockName', 'Company': 'stockName',
        'Quantity': 'quantity', 'Qty': 'quantity', 'Shares': 'quantity',
        'Average buy price': 'avgPrice', 'Average Price': 'avgPrice', 'Avg Price': 'avgPrice', 'Avg. Cost': 'avgPrice'
    }
    df = df.rename(columns=lambda x: col_mapping.get(str(x).strip(), str(x).strip()))
    
    # If symbol is still missing but we have stockName, use stockName as symbol
    if 'symbol' not in df.columns and 'stockName' in df.columns:
        df['symbol'] = df['stockName']
    
    required_cols = ['symbol', 'stockName', 'quantity', 'avgPrice']
    for col in required_cols:
        if col not in df.columns:
            logger.warning(f"Missing required col: {col}. Returning mock data.")
            return get_mock_zerodha_portfolio()

    holdings = []
    for _, row in df.iterrows():
        # Only parse valid quantities
        try:
            qty = float(row['quantity'])
            if qty <= 0: continue
            
            holdings.append({
                "symbol": str(row['symbol']),
                "stockName": str(row['stockName']),
                "quantity": qty,
                "avgPrice": float(row['avgPrice']),
                "sector": "Unknown" 
            })
        except Exception:
            pass

    return _process_holdings(holdings)


def _process_holdings(raw_holdings: list) -> PortfolioSummary:
    processed = []
    total_val = 0.0
    total_inv = 0.0
    
    for h in raw_holdings:
        current_price = get_current_price(h['symbol'])
        # if current price could not be fetched, fallback to avg price to prevent massive losses logic
        if current_price == 0.0:
            current_price = h['avgPrice']
            
        inv = h['quantity'] * h['avgPrice']
        val = h['quantity'] * current_price
        pl = val - inv
        
        pi = PortfolioItem(
            symbol=h['symbol'],
            stockName=h['stockName'],
            quantity=h['quantity'],
            avgPrice=h['avgPrice'],
            currentPrice=current_price,
            profitLoss=round(pl, 2),
            sector=h.get('sector', 'Unknown')
        )
        processed.append(pi)
        
        total_inv += inv
        total_val += val
        
    return PortfolioSummary(
        totalValue=round(total_val, 2),
        totalInvestment=round(total_inv, 2),
        totalProfitLoss=round(total_val - total_inv, 2),
        holdings=processed
    )
