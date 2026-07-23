import os
import sys
import traceback
from pathlib import Path

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

app = None
init_error = None

try:
    from eventhub.wsgi import application
    app = application
except Exception as e:
    dir_contents = []
    try:
        dir_contents = os.listdir(ROOT_DIR)
    except Exception:
        pass
    init_error = f"EXCEPTION: {type(e).__name__}: {str(e)}\n\nSYS.PATH:\n{sys.path}\n\nROOT_DIR ({ROOT_DIR}) CONTENTS:\n{dir_contents}\n\nFULL TRACEBACK:\n{traceback.format_exc()}"

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
