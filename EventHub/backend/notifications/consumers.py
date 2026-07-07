import json
from channels.generic.websocket import AsyncWebsocketConsumer

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")
        
        # Check if the user is authenticated (not anonymous)
        if self.user and self.user.is_authenticated:
            self.group_name = f"user_{self.user.id}"
            
            # Join user's personal notification group
            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )
            await self.accept()
        else:
            # Reject connection for unauthenticated users
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            # Leave notification group
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    async def send_notification(self, event):
        # Send notification to WebSocket client
        notification_data = event.get("notification")
        await self.send(text_data=json.dumps(notification_data))
