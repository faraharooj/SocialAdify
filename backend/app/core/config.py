import os
from dotenv import load_dotenv
from pathlib import Path

# --- Project Directory Setup ---
PROJECT_DIR = Path(__file__).resolve().parent.parent.parent 
ENV_PATH = PROJECT_DIR / ".env"

# --- Load Environment Variables ---
if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH)
    print(f"Loaded .env file from: {ENV_PATH}")
else:
    print(f"WARNING: .env file not found at {ENV_PATH}. Relying on system environment variables.")

# --- Core Application Settings ---
DATABASE_URL = os.getenv("DATABASE_URL")
SECRET_KEY = os.getenv("SECRET_KEY", "your_default_fallback_secret_key_if_not_in_env_but_please_set_it")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES_STR = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")

try:
    ACCESS_TOKEN_EXPIRE_MINUTES = int(ACCESS_TOKEN_EXPIRE_MINUTES_STR)
except ValueError:
    print(f"WARNING: Invalid ACCESS_TOKEN_EXPIRE_MINUTES value '{ACCESS_TOKEN_EXPIRE_MINUTES_STR}'. Using default 60.")
    ACCESS_TOKEN_EXPIRE_MINUTES = 60

# --- Host URLs for Redirects and Links ---
CLIENT_HOST = os.getenv("CLIENT_HOST", "http://localhost:3000") 
SERVER_HOST = os.getenv("SERVER_HOST", "http://localhost:8000")

# --- Google OAuth Credentials ---
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

# --- *** THE FIX: Add Meta OAuth Credentials *** ---
# These lines load the variables from your .env file so the meta_auth_router can use them.
META_APP_ID = os.getenv("META_APP_ID")
META_APP_SECRET = os.getenv("META_APP_SECRET")

# --- Meta System User Token for Automation ---
META_SYSTEM_USER_ACCESS_TOKEN = os.getenv("META_SYSTEM_USER_ACCESS_TOKEN")


# --- Basic Checks & Warnings ---
if not DATABASE_URL:
    print("⚠️ CRITICAL WARNING: DATABASE_URL not found.")
if not SECRET_KEY or SECRET_KEY == "your_default_fallback_secret_key_if_not_in_env_but_please_set_it":
    print("⚠️ CRITICAL WARNING: SECRET_KEY is not set or is using a default.")
if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
    print("⚠️ WARNING: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not found.")
# --- NEW WARNINGS ---
if not META_APP_ID or not META_APP_SECRET:
    print("⚠️ WARNING: META_APP_ID or META_APP_SECRET not found. Meta OAuth flow will fail.")



# --- Confirmation Logging ---
print(f"Config loaded: DATABASE_URL (first 15 chars): {DATABASE_URL[:15] if DATABASE_URL else 'Not Set'}")
print(f"Config loaded: Client Host URL for links: {CLIENT_HOST}")
print(f"Config loaded: Server Host URL for links: {SERVER_HOST}")
print(f"Config loaded: Google Client ID is {'Set' if GOOGLE_CLIENT_ID else 'Not Set'}")
# --- NEW LOGGING ---
print(f"Config loaded: Meta App ID is {'Set' if META_APP_ID else 'Not Set'}")
print(f"Config loaded: Meta System User Token is {'Set' if META_SYSTEM_USER_ACCESS_TOKEN else 'Not Set'}")
