from django.contrib.auth import get_user_model
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from django.contrib.auth.tokens import default_token_generator
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
import random

from .serializers import (
    UserSerializer,
    UserRegisterSerializer,
    CustomTokenObtainPairSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer
)
from .utils import send_registration_otp, send_password_reset_email
from django.conf import settings
from .models import EmailOTP
from django.utils import timezone
import re

User = get_user_model()

class RegisterOTPView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get('email', '').strip()
        if not email:
            return Response({"error": "Email address is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Verify email is not registered
        if User.objects.filter(email=email).exists():
            return Response({"error": "A user with this email address already exists."}, status=status.HTTP_400_BAD_REQUEST)

        otp_code = str(random.randint(100000, 999999))
        EmailOTP.objects.filter(email=email).delete()  # clear old
        EmailOTP.objects.create(email=email, code=otp_code)

        try:
            send_registration_otp(email, otp_code)
            return Response({"message": "OTP verification code has been sent to your Gmail inbox successfully!"}, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"SMTP error: {e}")
            if settings.DEBUG:
                print("\n" + "="*60)
                print(f"📧  [LOCAL DEV FALLBACK] SMTP failed. OTP code is: {otp_code}")
                print(f"To register: {email}")
                print("="*60 + "\n")
                return Response({
                    "message": "Failed to send email via SMTP, but OTP code has been printed to the server terminal console! (Local Dev Fallback)",
                    "debug_otp": otp_code
                }, status=status.HTTP_200_OK)
            return Response({"error": "Failed to send email. Please check your SMTP settings in .env file."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserRegisterSerializer

    def create(self, request, *args, **kwargs):
        otp_code = request.data.get('otp', '').strip()
        email = request.data.get('email', '').strip()

        if not otp_code or not email:
            return Response({"error": "Email and OTP verification code are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Verify OTP
        otp_record = EmailOTP.objects.filter(email=email, code=otp_code).order_by('-created_at').first()
        if not otp_record or not otp_record.is_valid():
            return Response({"error": "Invalid or expired OTP code."}, status=status.HTTP_400_BAD_REQUEST)

        # Process registration
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Mark user as active since email is verified
        user.is_active = True
        user.save()

        # Consume OTP code
        otp_record.delete()

        role = user.role
        if role == 'customer':
            message = "Registration successful! You can now log in immediately."
        else:
            message = "Registration successful! Your email is verified. Once your account is approved by an administrator, you will be able to log in."

        headers = self.get_success_headers(serializer.data)
        return Response({
            "message": message,
            "user": {
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role
            }
        }, status=status.HTTP_201_CREATED, headers=headers)

class VerifyEmailView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        uidb64 = request.GET.get('uid')
        token = request.GET.get('token')

        if not uidb64 or not token:
            return Response({"error": "Missing uid or token parameters."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            if not user.is_active:
                user.is_active = True
                user.save()
                return Response({"message": "Email verified successfully! You can now log in."}, status=status.HTTP_200_OK)
            else:
                return Response({"message": "Email is already verified."}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid verification link or token expired."}, status=status.HTTP_400_BAD_REQUEST)

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            try:
                serializer = self.get_serializer(data=request.data)
                serializer.is_valid()
                user = serializer.user
                
                from .utils import send_login_notification_email
                send_login_notification_email(user, request)
            except Exception as e:
                print(f"Error triggering login notification email: {e}")
        return response

class LogoutView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh_token")
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Logout successful."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": "Invalid token or logout request failed."}, status=status.HTTP_400_BAD_REQUEST)

class ForgotPasswordView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        
        try:
            user = User.objects.get(email=email)
            send_password_reset_email(user)
        except User.DoesNotExist:
            # Return 200 for security to prevent email enumeration
            pass
        except Exception as e:
            print(f"Error sending password reset email: {e}")
            return Response({"error": "Failed to send email. Please try again later."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"message": "If this email exists in our records, a password reset link has been sent."}, status=status.HTTP_200_OK)

class ResetPasswordView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        uidb64 = request.data.get('uid')
        token = request.data.get('token')
        
        if not uidb64 or not token:
            return Response({"error": "Missing uid or token."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            user.set_password(serializer.validated_data['password'])
            user.save()
            return Response({"message": "Password has been reset successfully! You can now log in."}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid reset link or token expired."}, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user

class ResetPasswordOTPView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get('email', '').strip()
        otp_code = request.data.get('otp', '').strip()
        password = request.data.get('password')
        password_confirm = request.data.get('password_confirm')

        if not email or not otp_code or not password or not password_confirm:
            return Response({"error": "Email, OTP verification code, and passwords are required."}, status=status.HTTP_400_BAD_REQUEST)

        if password != password_confirm:
            return Response({"error": "Passwords do not match."}, status=status.HTTP_400_BAD_REQUEST)

        if len(password) < 8:
            return Response({"error": "Password must be at least 8 characters long."}, status=status.HTTP_400_BAD_REQUEST)
        if not re.search(r'[A-Z]', password):
            return Response({"error": "Password must contain at least one uppercase letter."}, status=status.HTTP_400_BAD_REQUEST)
        if not re.search(r'[a-z]', password):
            return Response({"error": "Password must contain at least one lowercase letter."}, status=status.HTTP_400_BAD_REQUEST)
        if not re.search(r'[0-9]', password):
            return Response({"error": "Password must contain at least one number."}, status=status.HTTP_400_BAD_REQUEST)
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            return Response({"error": "Password must contain at least one special character."}, status=status.HTTP_400_BAD_REQUEST)

        # Verify OTP
        otp_record = EmailOTP.objects.filter(email=email, code=otp_code).order_by('-created_at').first()
        if not otp_record or not otp_record.is_valid():
            return Response({"error": "Invalid or expired OTP code."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            user.set_password(password)
            user.save()
            
            # Consume OTP
            otp_record.delete()
            return Response({"message": "Password has been reset successfully! You can now log in."}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User with this email address does not exist."}, status=status.HTTP_404_NOT_FOUND)
