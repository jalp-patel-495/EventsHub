import urllib.parse
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()

@database_sync_to_async
def get_user_from_token(token_string):
    try:
        # Decode the access token
        access_token = AccessToken(token_string)
        user_id = access_token["user_id"]
        # Fetch user
        return User.objects.get(id=user_id)
    except Exception:
        return AnonymousUser()

class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # Close connection or assign AnonymousUser if there's an issue
        scope["user"] = AnonymousUser()
        
        # Get query parameters
        query_string = scope.get("query_string", b"").decode("utf-8")
        query_params = urllib.parse.parse_qs(query_string)
        
        # Extract token
        token_list = query_params.get("token")
        if token_list:
            token = token_list[0]
            # Authenticate user asynchronously
            user = await get_user_from_token(token)
            scope["user"] = user
            
        return await super().__call__(scope, receive, send)
