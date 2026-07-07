import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import ChatMessage
from .serializers import ChatMessageSerializer

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f"chat_{self.room_name}"

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
        except json.JSONDecodeError:
            return
            
        message = text_data_json.get('message', '').strip()
        sender_name = text_data_json.get('sender_name', 'Guest').strip()

        if not message:
            return

        user = self.scope.get('user')
        
        # Save message to database
        db_message = await self.save_message(user, sender_name, self.room_name, message)
        
        # Serialize the saved message to broadcast full profile details
        serialized_msg = await self.serialize_message(db_message)

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': serialized_msg
            }
        )

    # Receive message from room group
    async def chat_message(self, event):
        message = event['message']

        # Send message to WebSocket
        await self.send(text_data=json.dumps(message))

    @database_sync_to_async
    def save_message(self, user, sender_name, room_name, message):
        auth_user = user if user and user.is_authenticated else None
        name = sender_name
        if user and user.is_authenticated:
            name = f"{user.first_name} {user.last_name}".strip() or user.email.split('@')[0]
            
        return ChatMessage.objects.create(
            sender=auth_user,
            sender_name=name,
            room_name=room_name,
            message=message
        )

    @database_sync_to_async
    def serialize_message(self, message_obj):
        return ChatMessageSerializer(message_obj).data
