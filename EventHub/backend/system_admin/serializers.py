from rest_framework import serializers
from .models import AuditLog
from django.contrib.auth import get_user_model

User = get_user_model()

class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'phone', 'role', 'avatar', 'is_active', 'is_approved', 'date_joined')

class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.SerializerMethodField()
    
    class Meta:
        model = AuditLog
        fields = ('id', 'user', 'user_email', 'action', 'resource', 'resource_id', 'ip_address', 'user_agent', 'details', 'timestamp')
        
    def get_user_email(self, obj):
        return obj.user.email if obj.user else "Anonymous"
