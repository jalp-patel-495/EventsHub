from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Notification
from .serializers import NotificationSerializer

@receiver(post_save, sender=Notification)
def broadcast_notification(sender, instance, created, **kwargs):
    if created:
        channel_layer = get_channel_layer()
        if channel_layer:
            group_name = f"user_{instance.user.id}"
            serialized_data = NotificationSerializer(instance).data
            
            # Broadcast the notification to the user's socket connection group
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    "type": "send_notification",
                    "notification": serialized_data
                }
            )
