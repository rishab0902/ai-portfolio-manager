import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter()

# In-memory credential store (per-server session, NOT persisted)
_zerodha_credentials = {
    "api_key": None,
    "api_secret": None,
    "access_token": None,
}


class ZerodhaKeysRequest(BaseModel):
    api_key: str
    api_secret: str


class ZerodhaSessionRequest(BaseModel):
    api_key: str
    api_secret: str
    request_token: str


def get_stored_credentials():
    """Return the in-memory credentials for use by other services."""
    return _zerodha_credentials


@router.post("/zerodha/login-url")
def get_login_url(payload: ZerodhaKeysRequest):
    """
    Accept Zerodha API Key + Secret from the frontend,
    store them in memory, and return the Kite login URL.
    """
    try:
        from kiteconnect import KiteConnect
    except ImportError:
        raise HTTPException(status_code=500, detail="kiteconnect library is not installed.")

    _zerodha_credentials["api_key"] = payload.api_key
    _zerodha_credentials["api_secret"] = payload.api_secret
    _zerodha_credentials["access_token"] = None  # reset on new setup

    kite = KiteConnect(api_key=payload.api_key)
    login_url = kite.login_url()

    logger.info("Generated Kite login URL for user.")
    return {"login_url": login_url}


@router.post("/zerodha/generate-session")
def generate_session(payload: ZerodhaSessionRequest):
    """
    Accept request_token from the frontend,
    exchange it for access_token, and store in memory.
    """
    try:
        from kiteconnect import KiteConnect
    except ImportError:
        raise HTTPException(status_code=500, detail="kiteconnect library is not installed.")

    kite = KiteConnect(api_key=payload.api_key)

    try:
        data = kite.generate_session(payload.request_token, api_secret=payload.api_secret)
        access_token = data["access_token"]

        # Store everything in memory
        _zerodha_credentials["api_key"] = payload.api_key
        _zerodha_credentials["api_secret"] = payload.api_secret
        _zerodha_credentials["access_token"] = access_token

        logger.info("Successfully exchanged request_token for access_token.")
        return {"status": "success", "access_token": access_token}

    except Exception as e:
        logger.error(f"Failed to generate session: {e}")
        raise HTTPException(status_code=400, detail=f"Token exchange failed: {str(e)}")


@router.get("/zerodha/env-keys")
def get_env_keys():
    """Retrieve keys from .env to auto-populate the frontend for testing."""
    import os
    from dotenv import load_dotenv
    load_dotenv()
    return {
        "api_key": os.getenv("ZERODHA_API_KEY", ""),
        "api_secret": os.getenv("ZERODHA_API_SECRET", "")
    }

@router.get("/zerodha/status")
def zerodha_status():
    """Check if Zerodha credentials are configured and active."""
    is_configured = bool(
        _zerodha_credentials["api_key"]
        and _zerodha_credentials["api_secret"]
        and _zerodha_credentials["access_token"]
    )
    return {"configured": is_configured}
