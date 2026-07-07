from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import ChatMessage

User = get_user_model()

class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'role', 'avatar')

class ChatMessageSerializer(serializers.ModelSerializer):
    sender = UserMiniSerializer(read_only=True)

    class Meta:
        model = ChatMessage
        fields = ('id', 'sender', 'sender_name', 'room_name', 'message', 'created_at')
