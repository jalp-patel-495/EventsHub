import re
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

EMAIL_REGEX = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
NAME_REGEX = r'^[A-Za-z]+(?: [A-Za-z]+)*$'
PHONE_REGEX = r'^[6-9]\d{9}$'
DUMMY_PHONE_SEQUENCES = {'1234567890', '0123456789', '9876543210', '0987654321', '2345678901'}

def validate_name_field(value, field_name="Name"):
    if not value or not str(value).strip():
        raise serializers.ValidationError(f"{field_name} is required.")
    val = str(value).strip()
    if len(val) < 2:
        raise serializers.ValidationError(f"{field_name} must be at least 2 characters long.")
    if len(val) > 50:
        raise serializers.ValidationError(f"{field_name} cannot exceed 50 characters.")
    if not re.match(NAME_REGEX, val):
        raise serializers.ValidationError(f"{field_name} must only contain alphabetical characters.")
    if re.match(r'^(.)\1+$', val, re.IGNORECASE):
        raise serializers.ValidationError(f"Please enter a valid {field_name.lower()}.")
    return val

def validate_phone_field(value):
    if not value or not str(value).strip():
        raise serializers.ValidationError("Phone number is required.")
    val = str(value).strip()
    if not val.isdigit():
        raise serializers.ValidationError("Phone number must contain digits only.")
    if len(val) != 10:
        raise serializers.ValidationError("Phone number must be exactly 10 digits.")
    if re.match(r'^(\d)\1{9}$', val):
        raise serializers.ValidationError("Please enter a valid 10-digit mobile number (repeating digits like 0000000000 are not allowed).")
    if val in DUMMY_PHONE_SEQUENCES:
        raise serializers.ValidationError("Please enter a valid, non-dummy 10-digit mobile number.")
    if not re.match(PHONE_REGEX, val):
        raise serializers.ValidationError("Phone number must be a valid 10-digit mobile number starting with 6, 7, 8, or 9.")
    return val

def validate_email_field(value):
    if not value or not str(value).strip():
        raise serializers.ValidationError("Email address is required.")
    val = str(value).strip()
    if len(val) > 100 or '..' in val or ' ' in val:
        raise serializers.ValidationError("Please enter a valid email address.")
    if not re.match(EMAIL_REGEX, val):
        raise serializers.ValidationError("Please enter a valid email address (e.g. user@example.com).")
    return val

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'phone', 'role', 'avatar', 'is_active', 'is_approved', 'date_joined')
        read_only_fields = ('id', 'email', 'role', 'is_active', 'is_approved', 'date_joined')

    def validate_first_name(self, value):
        if value:
            return validate_name_field(value, "First Name")
        return value

    def validate_last_name(self, value):
        if value:
            return validate_name_field(value, "Last Name")
        return value

    def validate_phone(self, value):
        if value:
            return validate_phone_field(value)
        return value

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'password', 'password_confirm', 'phone', 'role')

    def validate_first_name(self, value):
        return validate_name_field(value, "First Name")

    def validate_last_name(self, value):
        return validate_name_field(value, "Last Name")

    def validate_phone(self, value):
        return validate_phone_field(value)

    def validate_email(self, value):
        return validate_email_field(value)

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        
        role = attrs.get('role', 'customer')
        if role not in ['customer', 'organizer', 'plot_owner']:
            raise serializers.ValidationError({"role": "Invalid role selected."})
            
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        role = validated_data.get('role', 'customer')
        
        # Organizers and plot owners need verification/approval; customers need email verification
        is_active = False
        is_approved = True if role == 'customer' else False
        
        user = User.objects.create_user(
            email=validated_data['email'],
            password=password,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone=validated_data.get('phone', ''),
            role=role,
            is_active=is_active,
            is_approved=is_approved
        )
        user.save()
        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims to the JWT token payload
        token['email'] = user.email
        token['role'] = user.role
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Verify active status
        if not self.user.is_active:
            raise serializers.ValidationError("This account is not verified. Please verify your email first.")
        
        # Verify approval status for Organizers and Plot Owners
        if self.user.role in ['organizer', 'plot_owner'] and not self.user.is_approved:
            raise serializers.ValidationError("Your account has not been approved by an administrator yet.")
        
        # Add user info in the response payload
        data['user'] = UserSerializer(self.user).data
        return data

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

class ResetPasswordSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({"new_password_confirm": "New passwords do not match."})
        return attrs

