from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    RegisterOTPView,
    VerifyEmailView,
    CustomTokenObtainPairView,
    LogoutView,
    ForgotPasswordView,
    ResetPasswordView,
    ResetPasswordOTPView,
    UserProfileView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('register-otp/', RegisterOTPView.as_view(), name='register_otp'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify_email'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset_password'),
    path('reset-password-otp/', ResetPasswordOTPView.as_view(), name='reset_password_otp'),
    path('profile/', UserProfileView.as_view(), name='profile'),
]
