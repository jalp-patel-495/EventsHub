"""
Test SMTP email sending locally.
Run: python test_email.py
"""
import os
import sys
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eventhub.settings')

import django
django.setup()

from django.conf import settings
from django.core.mail import send_mail

print(f"EMAIL_BACKEND  : {settings.EMAIL_BACKEND}")
print(f"EMAIL_HOST     : {settings.EMAIL_HOST}")
print(f"EMAIL_PORT     : {settings.EMAIL_PORT}")
print(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
print(f"EMAIL_USE_TLS  : {settings.EMAIL_USE_TLS}")
print(f"DEFAULT_FROM   : {settings.DEFAULT_FROM_EMAIL}")
print("-" * 50)

test_email = input("Enter your email to receive test OTP: ").strip()

try:
    send_mail(
        subject="[TEST] EventHub OTP Email Test",
        message="This is a test email from EventHub. If you received this, SMTP is working!",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[test_email],
        fail_silently=False,  # Show actual error
    )
    print(f"\n[OK] Email sent successfully to {test_email}!")
except Exception as e:
    print(f"\n[ERROR] SMTP Error: {type(e).__name__}: {e}")
    print("\nPossible fixes:")
    print("1. Check EMAIL_HOST_PASSWORD in .env (remove spaces from app password)")
    print("2. Enable 2FA and generate a new App Password at:")
    print("   https://myaccount.google.com/apppasswords")
    print("3. Make sure 'Less secure app access' or App Password is correct")
