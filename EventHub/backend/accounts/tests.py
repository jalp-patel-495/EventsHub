from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from rest_framework import status
from rest_framework.test import APITestCase
from .models import EmailOTP

User = get_user_model()

class AuthenticationTests(APITestCase):
    def setUp(self):
        self.register_url = reverse('register')
        self.register_otp_url = reverse('register_otp')
        self.login_url = reverse('login')
        self.logout_url = reverse('logout')
        self.profile_url = reverse('profile')
        self.verify_email_url = reverse('verify_email')
        self.forgot_password_url = reverse('forgot_password')
        self.reset_password_url = reverse('reset_password')
        
        self.user_data = {
            'email': 'customer@example.com',
            'first_name': 'John',
            'last_name': 'Doe',
            'password': 'StrongPassword123!',
            'password_confirm': 'StrongPassword123!',
            'phone': '1234567890',
            'role': 'customer'
        }

    def test_registration_flow(self):
        # 1. Request OTP
        response = self.client.post(self.register_otp_url, {'email': self.user_data['email']})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 2. Get OTP from DB
        otp_record = EmailOTP.objects.get(email=self.user_data['email'])
        self.assertIsNotNone(otp_record.code)

        # 3. Try registering with invalid OTP (should fail)
        invalid_register_data = {**self.user_data, 'otp': '000000'}
        response = self.client.post(self.register_url, invalid_register_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # 4. Register user with correct OTP
        valid_register_data = {**self.user_data, 'otp': otp_record.code}
        response = self.client.post(self.register_url, valid_register_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify user is created and immediately active
        user = User.objects.get(email=self.user_data['email'])
        self.assertTrue(user.is_active)
        self.assertEqual(user.role, 'customer')

        # 5. Login after registration (should succeed)
        login_data = {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        }
        response = self.client.post(self.login_url, login_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['role'], 'customer')

        # 5. Access profile (protected)
        access_token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'John')

        # Update profile
        update_data = {'first_name': 'Jonathan', 'phone': '9876543210'}
        response = self.client.put(self.profile_url, update_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'Jonathan')
        self.assertEqual(response.data['phone'], '9876543210')

        # 6. Logout
        refresh_token = response.wsgi_request.META.get('HTTP_AUTHORIZATION') # client mock doesn't retain tokens, let's pass refresh manually from login
        # We need to get the refresh token from step 4
        # Let's clean headers to simulate logout
        self.client.credentials() # clear headers
        
        # Login again to get refresh token
        login_res = self.client.post(self.login_url, login_data)
        refresh = login_res.data['refresh']
        access = login_res.data['access']
        
        # Authenticate logout request
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        response = self.client.post(self.logout_url, {'refresh_token': refresh})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_registration_password_mismatch(self):
        self.user_data['password_confirm'] = 'DifferentPassword123!'
        response = self.client.post(self.register_url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_password_reset_flow(self):
        # Register and verify user
        user = User.objects.create_user(
            email='reset@example.com',
            password='OldPassword123!',
            first_name='Reset',
            last_name='User',
            role='customer'
        )
        user.is_active = True
        user.save()

        # 1. Forgot password request
        response = self.client.post(self.forgot_password_url, {'email': 'reset@example.com'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 2. Reset password using generated token
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        reset_data = {
            'uid': uid,
            'token': token,
            'password': 'NewSecurePassword123!',
            'password_confirm': 'NewSecurePassword123!'
        }
        response = self.client.post(self.reset_password_url, reset_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 3. Verify login works with new password
        login_data = {'email': 'reset@example.com', 'password': 'NewSecurePassword123!'}
        response = self.client.post(self.login_url, login_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
