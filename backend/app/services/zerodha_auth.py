import os
from dotenv import load_dotenv

try:
    from kiteconnect import KiteConnect
except ImportError:
    pass

load_dotenv()

def update_env_file(key: str, value: str):
    """Safely update .env without adding phantom single quotes."""
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
    if not os.path.exists(env_path):
        return
        
    with open(env_path, "r") as f:
        lines = f.readlines()
        
    key_found = False
    with open(env_path, "w") as f:
        for line in lines:
            if line.startswith(f"{key}="):
                f.write(f"{key}={value}\n")
                key_found = True
            else:
                f.write(line)
        if not key_found:
            f.write(f"{key}={value}\n")

def get_kite_instance():
    """Returns an authenticated KiteConnect instance using manually set keys."""
    # Force reload dotenv in case the file was changed on the fly
    load_dotenv(override=True)
    
    API_KEY = os.getenv("ZERODHA_API_KEY")
    API_SECRET = os.getenv("ZERODHA_API_SECRET")
    ACCESS_TOKEN = os.getenv("ZERODHA_ACCESS_TOKEN")
    REQUEST_TOKEN = os.getenv("ZERODHA_REQUEST_TOKEN")
    
    if not API_KEY:
        return None
        
    kite = KiteConnect(api_key=API_KEY)
    
    # Auto-exchange mechanics if a user pastes a temporary request token
    if REQUEST_TOKEN and len(REQUEST_TOKEN) > 10:
        try:
            print(f"Intercepted new Request Token! Attempting native exchange...")
            data = kite.generate_session(REQUEST_TOKEN, api_secret=API_SECRET)
            ACCESS_TOKEN = data["access_token"]
            
            # Save new valid access token automatically without quotes
            update_env_file("ZERODHA_ACCESS_TOKEN", ACCESS_TOKEN)
            # Nuke the request token so it isn't exchanged again
            update_env_file("ZERODHA_REQUEST_TOKEN", "")
            
            print("Successfully exchanged and saved the real Access Token.")
        except Exception as e:
            print(f"Failed to automatically exchange request token: {e}")
            update_env_file("ZERODHA_REQUEST_TOKEN", "") # wipe it anyway to avoid crash loop
            
    if ACCESS_TOKEN:
        kite.set_access_token(ACCESS_TOKEN)
        
    return kite
