import os
import urllib.parse
import time
from dotenv import load_dotenv, set_key
from kiteconnect import KiteConnect
from playwright.sync_api import sync_playwright

load_dotenv()

API_KEY = os.getenv("ZERODHA_API_KEY")
API_SECRET = os.getenv("ZERODHA_API_SECRET")

if not API_KEY or not API_SECRET:
    print("Please set ZERODHA_API_KEY and ZERODHA_API_SECRET in your backend/.env file first!")
    exit(1)

kite = KiteConnect(api_key=API_KEY)
login_url = kite.login_url()

def run_secure_login():
    print("="*50)
    print("1. Opening a secure browser window for you to log in...")
    print("="*50)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()
        
        found_token = None
        
        # Absolute foolproof way: Listen to every single network request url
        def on_request(request):
            nonlocal found_token
            if "request_token" in request.url:
                found_token = request.url
                
        page.on("request", on_request)
        
        page.goto(login_url)
        
        print("\n\xE2\x8F\xB3 Please enter your User ID, Password, and TOTP in the browser window.")
        print("Note: Your password is NOT being recorded. This is the official Zerodha website.")
        
        # Poll every second to see if we found the token
        for _ in range(300): # 5 minutes max
            if found_token:
                break
            time.sleep(1)
            
        try: browser.close()
        except: pass
        
        if found_token:
            parsed_url = urllib.parse.urlparse(found_token)
            params = urllib.parse.parse_qs(parsed_url.query)
            
            request_token = params['request_token'][0]
            
            try:
                data = kite.generate_session(request_token, api_secret=API_SECRET)
                access_token = data["access_token"]
                
                env_path = os.path.join(os.path.dirname(__file__), ".env")
                set_key(env_path, "ZERODHA_ACCESS_TOKEN", access_token)
                
                print(f"\n\xE2\x9C\x85 SUCCESS! Access token successfully grabbed and saved to .env!")
                print("You can now start your backend server.")
            except Exception as e:
                print(f"\n\xE2\x9D\x8C Error exchanging token: {e}")
        else:
            print("\n\xE2\x9D\x8C Login process timed out or no token was generated.")

if __name__ == '__main__':
    run_secure_login()


