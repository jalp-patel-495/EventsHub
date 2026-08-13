"""
ASGI config for eventhub project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application

# Ensure DJANGO_SETTINGS_MODULE is set and Django is initialized BEFORE importing middleware/models
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "eventhub.settings")
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from eventhub.middleware import JWTAuthMiddleware
import eventhub.routing

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTAuthMiddleware(
        URLRouter(
            eventhub.routing.websocket_urlpatterns
        )
    ),
})
