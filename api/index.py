import os
import sys
import traceback
from pathlib import Path

# Add backend directory to python sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = BASE_DIR / "EventHub" / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "eventhub.settings")

app = None
init_error = None

try:
    from eventhub.wsgi import application
    app = application
except Exception as e:
    init_error = traceback.format_exc()

def handler(environ, start_response):
    if init_error:
        status = '500 Internal Server Error'
        headers = [('Content-Type', 'text/plain; charset=utf-8')]
        start_response(status, headers)
        return [f"DJANGO INIT ERROR:\n{init_error}".encode('utf-8')]
    
    try:
        return app(environ, start_response)
    except Exception as e:
        status = '500 Internal Server Error'
        headers = [('Content-Type', 'text/plain; charset=utf-8')]
        start_response(status, headers)
        return [f"DJANGO RUNTIME ERROR:\n{traceback.format_exc()}".encode('utf-8')]

# Export handler as WSGI callable for Vercel
app = handler
