from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class ChatMessage(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_messages', null=True, blank=True)
    sender_name = models.CharField(max_length=150, default="Guest")
    room_name = models.CharField(max_length=100, db_index=True)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        sender_label = self.sender.email if self.sender else self.sender_name
        return f"[{self.room_name}] {sender_label}: {self.message[:30]}"
