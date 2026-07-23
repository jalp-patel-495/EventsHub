import json
from channels.generic.websocket import AsyncWebsocketConsumer

class LiveTicketsConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = "live_tickets"
        # Join live ticket sells group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave live ticket sells group
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        # We don't expect to receive messages from clients on this socket,
        # but we ignore them if we do.
        pass

    async def ticket_purchased(self, event):
        # Send live ticket purchase message to WebSocket client
        await self.send(text_data=json.dumps(event["data"]))
