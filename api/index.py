import os
import sys
from pathlib import Path

# Add backend directory to python sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = BASE_DIR / "EventHub" / "backend"
sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "eventhub.settings")

from eventhub.wsgi import application

# Vercel Serverless Function WSGI entrypoint
app = application
