from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    action = models.CharField(max_length=100, db_index=True) # e.g. LOGIN_SUCCESS, LOGIN_FAILED, EVENT_APPROVED, REFUND_ISSUED
    resource = models.CharField(max_length=100, db_index=True) # e.g. User, Event, Venue, Booking
    resource_id = models.CharField(max_length=100, blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    details = models.JSONField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    def __str__(self):
        email = self.user.email if self.user else "Anonymous"
        return f"{self.timestamp} - {email} - {self.action} on {self.resource}"
