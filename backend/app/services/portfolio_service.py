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
        logger.info(f"[PORTFOLIO] Checking in-memory credentials: api_key={'SET' if creds['api_key'] else 'EMPTY'}, access_token={'SET' if creds['access_token'] else 'EMPTY'}")

        if creds["api_key"] and creds["access_token"]:
            logger.info("[PORTFOLIO] Using frontend-provided credentials to fetch holdings...")
            kite = KiteConnect(api_key=creds["api_key"])
            kite.set_access_token(creds["access_token"])
            try:
                kite_holdings = kite.holdings()
                logger.info(f"[PORTFOLIO] SUCCESS! Fetched {len(kite_holdings)} holdings from Zerodha via frontend credentials.")
                return _build_portfolio_from_kite(kite_holdings)
            except Exception as e:
                logger.error(f"[PORTFOLIO] Frontend credentials failed to fetch holdings: {e}")
        else:
            logger.info("[PORTFOLIO] In-memory credentials incomplete, trying .env fallback...")
    except ImportError:
        logger.warning("[PORTFOLIO] Could not import zerodha route module.")

    # Fallback: use .env-based credentials
    logger.info("[PORTFOLIO] Attempting .env-based credential fallback...")
    kite = get_kite_instance()

    if not kite:
        logger.warning("[PORTFOLIO] No Kite credentials found at all. Returning MOCK portfolio.")
        return get_mock_zerodha_portfolio()

    try:
        kite_holdings = kite.holdings()
        logger.info(f"[PORTFOLIO] SUCCESS! Fetched {len(kite_holdings)} holdings from Zerodha via .env credentials.")
        return _build_portfolio_from_kite(kite_holdings)
    except Exception as e:
        logger.error(f"[PORTFOLIO] .env credentials also failed. Token likely expired. Error: {str(e)}")
        logger.warning("[PORTFOLIO] Returning MOCK portfolio as last resort.")
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

    if filename.lower().endswith('.xlsx'):
        df = pd.read_excel(io.BytesIO(file_contents), header=None)
    else:
        df = pd.read_csv(io.BytesIO(file_contents), header=None)
        
    # Dynamically find the header row (the row that contains 'Stock Name' or 'Symbol')
    header_idx = 0
    for i, row in df.iterrows():
        row_str = " ".join([str(x).lower() for x in row.values])
        if 'stock name' in row_str or 'symbol' in row_str:
            header_idx = i
            break
            
    # Promote that row to be the actual header and drop everything above it
    df.columns = df.iloc[header_idx].astype(str).str.strip()
    df = df.iloc[header_idx + 1:].reset_index(drop=True)
    
    # Drop rows that have NaN in the first column
    df = df.dropna(subset=[df.columns[0]])
    
    # Map column names — NOTE: ISIN is NOT mapped to symbol (it's not a trading symbol)
    col_mapping = {
        # Symbol / name columns
        'Symbol':           'symbol',
        'Ticker':           'symbol',
        'Stock Name':       'stockName',
        'Name':             'stockName',
        'Company':          'stockName',
        # Quantity
        'Quantity':         'quantity',
        'Qty':              'quantity',
        'Shares':           'quantity',
        # Buy / avg price
        'Average buy price':'avgPrice',
        'Average Price':    'avgPrice',
        'Avg Price':        'avgPrice',
        'Avg. Cost':        'avgPrice',
        # Current / closing price — use sheet value directly
        'Closing price':    'currentPrice',
        'Closing Price':    'currentPrice',
        'Current Price':    'currentPrice',
        'LTP':              'currentPrice',
        # P&L — use sheet value directly if available
        'Unrealised P&L':   'profitLoss',
        'Unrealized P&L':   'profitLoss',
        'P&L':              'profitLoss',
    }
    df = df.rename(columns=lambda x: col_mapping.get(str(x).strip(), str(x).strip()))

    # If no symbol column but we have stockName, derive symbol from stockName
    if 'symbol' not in df.columns and 'stockName' in df.columns:
        df['symbol'] = df['stockName']
    
    required_cols = ['stockName', 'quantity', 'avgPrice']
    for col in required_cols:
        if col not in df.columns:
            logger.warning(f"Missing required col: {col}. Returning mock data.")
            return get_mock_zerodha_portfolio()

    # Ensure symbol exists
    if 'symbol' not in df.columns:
        df['symbol'] = df['stockName']

    holdings = []
    for _, row in df.iterrows():
        try:
            qty = float(row['quantity'])
            if qty <= 0:
                continue

            avg_price = float(row['avgPrice'])

            # Use closing price from sheet if available; fall back to market fetch
            if 'currentPrice' in df.columns:
                try:
                    current_price = float(row['currentPrice'])
                except (ValueError, TypeError):
                    current_price = None
            else:
                current_price = None

            # Use P&L from sheet if available
            sheet_pl = None
            if 'profitLoss' in df.columns:
                try:
                    sheet_pl = float(row['profitLoss'])
                except (ValueError, TypeError):
                    sheet_pl = None

            holdings.append({
                "symbol":       str(row['symbol']),
                "stockName":    str(row['stockName']),
                "quantity":     qty,
                "avgPrice":     avg_price,
                "currentPrice": current_price,   # None → will fetch from market
                "profitLoss":   sheet_pl,         # None → will calculate
                "sector":       "Unknown"
            })
        except Exception as ex:
            logger.warning(f"Skipped row due to error: {ex}")

    return _process_holdings(holdings)


def _process_holdings(raw_holdings: list) -> PortfolioSummary:
    processed = []
    total_val = 0.0
    total_inv = 0.0
    
    for h in raw_holdings:
        avg_price = h['avgPrice']
        qty = h['quantity']

        # Use current price from sheet if provided; otherwise try market fetch
        current_price = h.get('currentPrice')
        if current_price is None or current_price == 0.0:
            current_price = get_current_price(h['symbol'])
        # If market fetch also failed, fall back to avg price
        if current_price == 0.0:
            current_price = avg_price

        inv = qty * avg_price
        val = qty * current_price

        # Use P&L from sheet if provided; otherwise calculate
        pl = h.get('profitLoss')
        if pl is None:
            pl = val - inv

        pi = PortfolioItem(
            symbol=h['symbol'],
            stockName=h['stockName'],
            quantity=qty,
            avgPrice=avg_price,
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
