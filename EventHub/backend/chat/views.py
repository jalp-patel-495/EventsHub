from rest_framework import generics, permissions
from .models import ChatMessage
from .serializers import ChatMessageSerializer

class ChatHistoryView(generics.ListAPIView):
    serializer_class = ChatMessageSerializer
    permission_classes = (permissions.AllowAny,)  # Allow anyone (including guests) to load history

    def get_queryset(self):
        room_name = self.kwargs.get('room_name')
        # Fetch last 50 messages, order them chronologically
        qs = list(ChatMessage.objects.filter(room_name=room_name).order_by('-created_at')[:50])
        qs.reverse()
        return qs
