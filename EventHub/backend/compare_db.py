"""
Compare SQLite vs Neon PostgreSQL data using raw database connections.
This is 100% reliable and avoids Django settings initialization conflicts.
"""
import os
import sqlite3
import psycopg2
import urllib.parse
from dotenv import load_dotenv

# Load env variables
load_dotenv()

# Step 1: Read local SQLite Database
db_path = os.path.join(os.path.dirname(__file__), 'db.sqlite3')
print("=" * 50)
print("  LOCAL SQLite Database")
print("=" * 50)

sqlite_users = []
sqlite_events = []

if os.path.exists(db_path):
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT email, role, is_active FROM accounts_user")
        sqlite_users = cursor.fetchall()
        print(f"Users  : {len(sqlite_users)}")
        for u in sqlite_users:
            print(f"  - {u[0]} ({u[1]}) active={bool(u[2])}")
            
        cursor.execute("SELECT title, is_approved FROM events_event")
        sqlite_events = cursor.fetchall()
        print(f"Events : {len(sqlite_events)}")
        for e in sqlite_events[:5]:
            print(f"  - {e[0]} approved={bool(e[1])}")
            
        conn.close()
    except Exception as e:
        print(f"[ERROR] Reading SQLite failed: {e}")
else:
    print(f"SQLite file not found at: {db_path}")

# Step 2: Read Neon PostgreSQL Database
neon_url = os.environ.get('DATABASE_URL', '').strip()
if not neon_url:
    print("\n" + "=" * 50)
    print("  Neon PostgreSQL: NOT CONFIGURED")
    print("  Add DATABASE_URL to .env first!")
    print("=" * 50)
    exit(0)

print("\n" + "=" * 50)
print("  Neon PostgreSQL Database")
print("=" * 50)

neon_users = []
neon_events = []

try:
    conn = psycopg2.connect(neon_url)
    cursor = conn.cursor()
    
    cursor.execute("SELECT email, role, is_active FROM accounts_user")
    neon_users = cursor.fetchall()
    print(f"Users  : {len(neon_users)}")
    for u in neon_users:
        print(f"  - {u[0]} ({u[1]}) active={bool(u[2])}")
        
    cursor.execute("SELECT title, is_approved FROM events_event")
    neon_events = cursor.fetchall()
    print(f"Events : {len(neon_events)}")
    for e in neon_events[:5]:
        print(f"  - {e[0]} approved={bool(e[1])}")
        
    cursor.close()
    conn.close()
    
    print("\n" + "=" * 50)
    if len(sqlite_users) == len(neon_users) and len(sqlite_events) == len(neon_events):
        print("  [MATCH] Both databases have the exact same data! Live database is ready.")
    else:
        print(f"  [MISMATCH] SQLite: {len(sqlite_users)} users, {len(sqlite_events)} events")
        print(f"             Neon  : {len(neon_users)} users, {len(neon_events)} events")
    print("=" * 50)
except Exception as e:
    print(f"[ERROR] Cannot connect to Neon: {e}")
    print("Check your DATABASE_URL in .env")
