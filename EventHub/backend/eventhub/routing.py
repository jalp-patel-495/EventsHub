from django.urls import path
from notifications.consumers import NotificationConsumer
from chat.consumers import ChatConsumer

websocket_urlpatterns = [
    path("ws/notifications/", NotificationConsumer.as_asgi()),
    path("ws/chat/<str:room_name>/", ChatConsumer.as_asgi()),
]

