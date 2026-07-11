"""
Compare SQLite vs Neon PostgreSQL data.
Run: python compare_db.py
"""
import os
import sys

# Step 1: Show SQLite data
os.environ['DJANGO_SETTINGS_MODULE'] = 'eventhub.settings'
import django
django.setup()

from django.db import connections
from accounts.models import User
from events.models import Event

print("=" * 50)
print("  LOCAL SQLite Database")
print("=" * 50)
print(f"Users  : {User.objects.count()}")
for u in User.objects.all().values('email', 'role', 'is_active'):
    print(f"  - {u['email']} ({u['role']}) active={u['is_active']}")
print(f"Events : {Event.objects.count()}")
for e in list(Event.objects.all().values('title', 'is_approved'))[:5]:
    print(f"  - {e['title']} approved={e['is_approved']}")

# Step 2: Try to connect to Neon if DATABASE_URL is set
neon_url = os.environ.get('DATABASE_URL', '').strip()
if not neon_url:
    print("\n" + "=" * 50)
    print("  Neon PostgreSQL: NOT CONFIGURED")
    print("  Add DATABASE_URL to .env first!")
    print("=" * 50)
    sys.exit(0)

print("\n" + "=" * 50)
print("  Neon PostgreSQL Database")
print("=" * 50)

# Temporarily switch to Neon
import urllib.parse
parsed = urllib.parse.urlparse(neon_url)
from django.conf import settings
settings.DATABASES['neon'] = {
    'ENGINE': 'django.db.backends.postgresql',
    'NAME': parsed.path.lstrip('/'),
    'USER': parsed.username or '',
    'PASSWORD': parsed.password or '',
    'HOST': parsed.hostname or 'localhost',
    'PORT': str(parsed.port) if parsed.port else '5432',
    'OPTIONS': {'sslmode': 'require'},
}

try:
    neon_users = list(User.objects.using('neon').values('email', 'role', 'is_active'))
    neon_events = list(Event.objects.using('neon').values('title', 'status'))
    print(f"Users  : {len(neon_users)}")
    for u in neon_users:
        print(f"  - {u['email']} ({u['role']}) active={u['is_active']}")
    print(f"Events : {len(neon_events)}")
    for e in neon_events[:5]:
        print(f"  - {e['title']} [{e['status']}]")

    print("\n" + "=" * 50)
    sqlite_u = User.objects.count()
    neon_u = len(neon_users)
    sqlite_e = Event.objects.count()
    neon_e = len(neon_events)
    if sqlite_u == neon_u and sqlite_e == neon_e:
        print("  [MATCH] Both databases have the same data!")
    else:
        print(f"  [MISMATCH] SQLite: {sqlite_u} users, {sqlite_e} events")
        print(f"             Neon  : {neon_u} users, {neon_e} events")
        print("  Run: python import_to_neon.py to sync data")
    print("=" * 50)

except Exception as e:
    print(f"[ERROR] Cannot connect to Neon: {e}")
    print("Check your DATABASE_URL in .env")
