import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

print(f"URL: {url}")
print(f"Key length: {len(key) if key else 0}")
print(f"Key starts with: {key[:10] if key else 'None'}")

if not url or not key:
    print("Missing environment variables.")
    exit(1)

try:
    print("Attempting to connect...")
    supabase = create_client(url, key)
    print("Connection object created.")
    # Try a simple fetch
    res = supabase.table("portfolio_documents").select("count").execute()
    print("Successfully queried database!")
except Exception as e:
    print(f"Error: {e}")
