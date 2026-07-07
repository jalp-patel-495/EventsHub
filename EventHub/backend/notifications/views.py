from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Notification
from .serializers import NotificationSerializer

class NotificationListView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        notifications = Notification.objects.filter(user=request.user)
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)

class NotificationMarkReadView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, notification_id):
        if notification_id == 'all':
            Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
            return Response({"message": "All notifications marked as read."}, status=status.HTTP_200_OK)
            
        notification = get_object_or_404(Notification, pk=notification_id)
        if notification.user != request.user:
            return Response({"error": "Access denied."}, status=status.HTTP_403_FORBIDDEN)
            
        notification.is_read = True
        notification.save()
        return Response(NotificationSerializer(notification).data, status=status.HTTP_200_OK)
