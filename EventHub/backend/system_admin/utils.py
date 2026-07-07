from .models import AuditLog

def log_audit(user=None, action="", resource="", resource_id=None, request=None, details=None):
    """
    Log an operation to the AuditLog database table.
    """
    ip_address = None
    user_agent = None
    
    if request:
        # Resolve IP Address
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0].strip()
        else:
            ip_address = request.META.get('REMOTE_ADDR')
            
        # Resolve User Agent
        user_agent = request.META.get('HTTP_USER_AGENT')
        
        # Fallback to request user if user is not explicitly supplied
        if not user and request.user and request.user.is_authenticated:
            user = request.user
            
    AuditLog.objects.create(
        user=user if (user and user.is_authenticated) else None,
        action=action,
        resource=resource,
        resource_id=str(resource_id) if resource_id is not None else None,
        ip_address=ip_address,
        user_agent=user_agent,
        details=details
    )
