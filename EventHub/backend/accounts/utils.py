from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from django.utils import timezone
import random
from .models import EmailOTP

def get_html_email_template(title, heading, description, content_html, button_text=None, button_url=None):
    """
    Returns a beautifully designed, responsive HTML email template for Ahmedabad Event Hub.
    Compatible with all email clients (Gmail, Outlook, Apple Mail, Mobile, Dark Mode).
    """
    button_html = ""
    if button_text and button_url:
        button_html = f'''
        <div style="margin: 30px 0; text-align: center;">
            <a href="{button_url}" target="_blank" style="background-color: #f43f5e; background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%); color: #ffffff !important; text-decoration: none; padding: 13px 32px; font-weight: 700; border-radius: 10px; display: inline-block; box-shadow: 0 4px 12px rgba(244, 63, 94, 0.35); font-size: 14px; font-family: 'Inter', Arial, sans-serif; letter-spacing: 0.3px;">{button_text}</a>
        </div>
        '''

    current_year = timezone.now().year

    html = f'''<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6; -webkit-font-smoothing: antialiased;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #0b0f19; padding: 24px 16px;">
        <!-- Header / Logo -->
        <tr>
            <td align="center" style="padding: 16px 0 24px 0;">
                <table border="0" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="vertical-align: middle; padding-right: 10px;">
                            <div style="background-color: #f43f5e; color: #ffffff; width: 38px; height: 38px; border-radius: 12px; text-align: center; line-height: 38px; font-weight: 900; font-size: 18px; font-family: sans-serif; display: inline-block;">
                                🎟
                            </div>
                        </td>
                        <td style="vertical-align: middle;">
                            <span style="font-size: 21px; font-weight: 900; color: #ffffff; font-family: 'Inter', Helvetica, Arial, sans-serif; letter-spacing: -0.3px;">
                                <span style="color: #f43f5e;">AHMEDABAD</span> EVENT HUB
                            </span>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>

        <!-- Main Card Container -->
        <tr>
            <td style="padding: 30px; background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);">
                <h2 style="margin-top: 0; margin-bottom: 12px; color: #ffffff; font-size: 22px; font-weight: 800; font-family: sans-serif; line-height: 1.3;">{heading}</h2>
                <p style="color: #9ca3af; font-size: 15px; line-height: 1.6; margin-top: 0; margin-bottom: 24px; font-family: sans-serif;">{description}</p>
                
                {content_html}
                
                {button_html}
                
                <p style="color: #6b7280; font-size: 12px; line-height: 1.5; margin-top: 28px; border-top: 1px solid #1f2937; padding-top: 20px; font-family: sans-serif; text-align: center;">
                    This is an automated notification from Ahmedabad Event Hub.<br>If you did not request this email, please ignore it or visit our <a href="{getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')}/contact" style="color: #f43f5e; text-decoration: none; font-weight: 600;">Contact Support</a> page.
                </p>
            </td>
        </tr>

        <!-- Footer -->
        <tr>
            <td align="center" style="padding: 24px 16px 12px 16px; color: #4b5563; font-size: 12px; font-family: sans-serif;">
                <p style="margin: 0; font-weight: 600; color: #6b7280;">© {current_year} Ahmedabad Event Hub. All rights reserved.</p>
                <p style="margin: 6px 0 0 0; color: #4b5563;">Ahmedabad, Gujarat, India</p>
            </td>
        </tr>
    </table>
</body>
</html>
'''
    return html

def send_registration_otp(email, code):
    subject = f"Your Verification Code: {code} - Ahmedabad Event Hub"
    heading = "Verify Your Email Address"
    description = f"Welcome to Ahmedabad Event Hub! Please use the 6-digit OTP code below to complete your registration."
    
    content_html = f'''
    <div style="background-color: #1f2937; border: 1px solid #374151; border-radius: 14px; padding: 28px 20px; text-align: center; margin: 20px 0;">
        <span style="display: block; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px; font-family: sans-serif;">Registration Verification Code</span>
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; color: #f43f5e; letter-spacing: 8px; text-shadow: 0 0 12px rgba(244, 63, 94, 0.25); display: inline-block;">{code}</span>
        <span style="display: block; font-size: 13px; color: #9ca3af; margin-top: 12px; font-family: sans-serif;">This code is valid for 10 minutes.</span>
    </div>
    '''
    
    plain_message = f"Hello,\n\nYour registration verification OTP for Ahmedabad Event Hub is: {code}\n\nThis code is valid for 10 minutes."
    
    html_message = get_html_email_template(
        subject,
        heading,
        description,
        content_html
    )
    
    email_msg = EmailMultiAlternatives(
        subject,
        plain_message,
        settings.DEFAULT_FROM_EMAIL,
        [email]
    )
    email_msg.attach_alternative(html_message, "text/html")
    email_msg.send(fail_silently=True)

def create_password_reset_otp(user):
    otp_code = str(random.randint(100000, 999999))
    EmailOTP.objects.filter(email=user.email).delete()
    EmailOTP.objects.create(email=user.email, code=otp_code)
    return otp_code

def send_password_reset_email(user, otp_code=None):
    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    reset_url = f"{frontend_url}/reset-password?uid={uid}&token={token}"
    
    if not otp_code:
        otp_code = create_password_reset_otp(user)
    
    subject = "Reset Your Password - Ahmedabad Event Hub"
    heading = "Reset Your Password"
    description = f"Hello {user.first_name or 'User'},\n\nWe received a request to reset the password for your account. You can reset your password immediately using the 6-digit recovery code below, or by clicking the button."
    
    content_html = f'''
    <div style="background-color: #1f2937; border: 1px solid #374151; border-radius: 14px; padding: 28px 20px; text-align: center; margin: 20px 0;">
        <span style="display: block; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px; font-family: sans-serif;">Password Reset Code</span>
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; color: #f43f5e; letter-spacing: 8px; text-shadow: 0 0 12px rgba(244, 63, 94, 0.25); display: inline-block;">{otp_code}</span>
        <span style="display: block; font-size: 13px; color: #9ca3af; margin-top: 12px; font-family: sans-serif;">This code is valid for 10 minutes.</span>
    </div>
    '''
    
    plain_message = f"Hello {user.first_name or 'User'},\n\nWe received a request to reset your password. Recovery code: {otp_code} or link: {reset_url}"
    
    html_message = get_html_email_template(
        subject,
        heading,
        description,
        content_html,
        button_text="Reset Password via Link",
        button_url=reset_url
    )
    
    email_msg = EmailMultiAlternatives(
        subject,
        plain_message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email]
    )
    email_msg.attach_alternative(html_message, "text/html")
    email_msg.send(fail_silently=False)

def send_booking_confirmation_email(booking):
    subject = f"Booking Confirmed: {booking.event.title} - Ahmedabad Event Hub"
    heading = "Your Ticket Booking is Confirmed!"
    description = f"Hi {booking.user.first_name or 'there'},\n\nYour ticket purchase for the upcoming event is successfully completed and confirmed. Your booking details and check-in ticket code are listed below."
    
    content_html = f'''
    <div style="background-color: #1f2937; border: 1px solid #374151; border-radius: 14px; padding: 24px; margin: 20px 0; font-family: sans-serif;">
        <h3 style="margin-top: 0; color: #ffffff; border-bottom: 1px solid #374151; padding-bottom: 12px; font-size: 16px; font-weight: 700;">Booking Summary</h3>
        <table width="100%" cellpadding="6" cellspacing="0" style="color: #d1d5db; font-size: 14px;">
            <tr>
                <td style="font-weight: 600; width: 120px; color: #9ca3af;">Event:</td>
                <td style="color: #ffffff; font-weight: 600;">{booking.event.title}</td>
            </tr>
            <tr>
                <td style="font-weight: 600; color: #9ca3af;">Date:</td>
                <td style="color: #e5e7eb;">{booking.event.date.strftime('%B %d, %Y') if hasattr(booking.event.date, 'strftime') else booking.event.date}</td>
            </tr>
            <tr>
                <td style="font-weight: 600; color: #9ca3af;">Time:</td>
                <td style="color: #e5e7eb;">{booking.event.time.strftime('%I:%M %p') if hasattr(booking.event.time, 'strftime') else booking.event.time}</td>
            </tr>
            <tr>
                <td style="font-weight: 600; color: #9ca3af;">Location:</td>
                <td style="color: #e5e7eb;">{booking.event.location}</td>
            </tr>
            <tr>
                <td style="font-weight: 600; color: #9ca3af;">Ticket Class:</td>
                <td><span style="background-color: rgba(244, 63, 94, 0.15); color: #f43f5e; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; border: 1px solid rgba(244, 63, 94, 0.2);">{booking.ticket_category}</span></td>
            </tr>
            <tr>
                <td style="font-weight: 600; color: #9ca3af;">Quantity:</td>
                <td style="color: #e5e7eb;">{booking.tickets_count} ticket(s)</td>
            </tr>
            <tr style="border-top: 1px solid #374151;">
                <td style="font-weight: 600; padding-top: 15px; color: #9ca3af;">Total Paid:</td>
                <td style="color: #34d399; font-weight: bold; font-size: 18px; padding-top: 15px;">₹{booking.total_price}</td>
            </tr>
        </table>
        
        <div style="margin-top: 24px; background-color: #111827; border: 1px dashed #374151; border-radius: 10px; padding: 16px; text-align: center;">
            <span style="display: block; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Visual Ticket Code</span>
            <span style="font-family: monospace; font-size: 18px; font-weight: 700; color: #ffffff; letter-spacing: 2px;">{booking.qr_code_hash}</span>
            <span style="display: block; font-size: 12px; color: #6b7280; margin-top: 6px;">Present this code or your in-app QR code at the entrance.</span>
        </div>
    </div>
    '''
    
    plain_message = f"Hi,\n\nYour booking for {booking.event.title} is confirmed!\n\nDetails:\nDate: {booking.event.date}\nTime: {booking.event.time}\nLocation: {booking.event.location}\nTickets: {booking.tickets_count} ({booking.ticket_category})\nTotal Paid: ₹{booking.total_price}\nTicket Code: {booking.qr_code_hash}"
    
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    dashboard_url = f"{frontend_url}/bookings"
    
    html_message = get_html_email_template(
        subject,
        heading,
        description,
        content_html,
        button_text="View Your Tickets",
        button_url=dashboard_url
    )
    
    email_msg = EmailMultiAlternatives(
        subject,
        plain_message,
        settings.DEFAULT_FROM_EMAIL,
        [booking.user.email]
    )
    email_msg.attach_alternative(html_message, "text/html")
    email_msg.send(fail_silently=True)

def send_login_notification_email(user, request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR', 'Unknown IP')

    user_agent = request.META.get('HTTP_USER_AGENT', 'Unknown Device')
    login_time = timezone.now().strftime('%B %d, %Y at %I:%M %p UTC')
    
    subject = "Security Alert: New Login Detected - Ahmedabad Event Hub"
    heading = "New Account Login Alert"
    description = f"Hi {user.first_name or 'User'},\n\nWe detected a new login to your Ahmedabad Event Hub account. Please check the details below to verify it was you."
    
    content_html = f'''
    <div style="background-color: #1f2937; border: 1px solid #374151; border-radius: 14px; padding: 24px; margin: 20px 0; font-family: sans-serif;">
        <h3 style="margin-top: 0; color: #ffffff; border-bottom: 1px solid #374151; padding-bottom: 12px; font-size: 16px; font-weight: 700;">Login Details</h3>
        <table width="100%" cellpadding="6" cellspacing="0" style="color: #d1d5db; font-size: 14px;">
            <tr>
                <td style="font-weight: 600; width: 130px; color: #9ca3af;">Account (Email):</td>
                <td style="color: #ffffff; font-weight: 600; word-break: break-all;">{user.email}</td>
            </tr>
            <tr>
                <td style="font-weight: 600; color: #9ca3af;">Time:</td>
                <td style="color: #e5e7eb;">{login_time}</td>
            </tr>
            <tr>
                <td style="font-weight: 600; color: #9ca3af;">IP Address:</td>
                <td style="color: #e5e7eb; font-family: monospace;">{ip}</td>
            </tr>
            <tr>
                <td style="font-weight: 600; color: #9ca3af; vertical-align: top;">Device / Agent:</td>
                <td style="font-size: 13px; line-height: 1.4; color: #9ca3af; word-break: break-all;">{user_agent}</td>
            </tr>
        </table>
    </div>
    
    <div style="background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 16px; margin-top: 24px; text-align: center;">
        <p style="color: #f87171; font-size: 14px; font-weight: 700; margin: 0; font-family: sans-serif;">
            If you did not authorize this login, please reset your password immediately to protect your account.
        </p>
    </div>
    '''
    
    plain_message = f"Hi,\n\nWe detected a new login to your account.\n\nDetails:\nAccount: {user.email}\nTime: {login_time}\nIP Address: {ip}\nDevice: {user_agent}\n\nIf this was not you, please reset your password immediately."
    
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    reset_url = f"{frontend_url}/forgot-password"
    
    html_message = get_html_email_template(
        subject,
        heading,
        description,
        content_html,
        button_text="Secure Your Account",
        button_url=reset_url
    )
    
    email_msg = EmailMultiAlternatives(
        subject,
        plain_message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email]
    )
    email_msg.attach_alternative(html_message, "text/html")
    email_msg.send(fail_silently=True)
