import os
import sys
import traceback
from pathlib import Path

# Add backend directory to sys.path
CURRENT_DIR = Path(__file__).resolve().parent
ROOT_DIR = CURRENT_DIR.parent

possible_paths = [
    ROOT_DIR / "EventHub" / "backend",
    ROOT_DIR / "backend",
    ROOT_DIR,
    CURRENT_DIR,
]

for p in possible_paths:
    if p.exists() and str(p) not in sys.path:
        sys.path.insert(0, str(p))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "eventhub.settings")

django_wsgi_app = None
init_error = None

try:
    from eventhub.wsgi import application
    django_wsgi_app = application
except Exception as e:
    init_error = f"DJANGO INIT ERROR: {type(e).__name__}: {str(e)}\n\n{traceback.format_exc()}"

def handler(environ, start_response):
    if init_error:
        status = '500 Internal Server Error'
        headers = [('Content-Type', 'text/plain; charset=utf-8')]
        start_response(status, headers)
        return [init_error.encode('utf-8')]
    
    try:
        return django_wsgi_app(environ, start_response)
    except Exception as e:
        status = '500 Internal Server Error'
        headers = [('Content-Type', 'text/plain; charset=utf-8')]
        start_response(status, headers)
        return [f"DJANGO RUNTIME ERROR:\n{traceback.format_exc()}".encode('utf-8')]

# Vercel WSGI entrypoint callable
app = handler
