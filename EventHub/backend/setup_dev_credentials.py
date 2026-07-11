import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eventhub.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# List of users to ensure exist
users_to_create = [
    {
        'email': 'admin@example.com',
        'first_name': 'System',
        'last_name': 'Admin',
        'role': 'admin',
        'is_staff': True,
        'is_superuser': True,
        'is_approved': True,
        'is_active': True,
        'password': 'Password123!'
    },
    {
        'email': 'organizer@example.com',
        'first_name': 'Event',
        'last_name': 'Organizer',
        'role': 'organizer',
        'is_staff': False,
        'is_superuser': False,
        'is_approved': True,
        'is_active': True,
        'password': 'Password123!'
    },
    {
        'email': 'customer@example.com',
        'first_name': 'John',
        'last_name': 'Customer',
        'role': 'customer',
        'is_staff': False,
        'is_superuser': False,
        'is_approved': True,
        'is_active': True,
        'password': 'Password123!'
    },
    {
        'email': 'owner@example.com',
        'first_name': 'Venue',
        'last_name': 'Owner',
        'role': 'plot_owner',
        'is_staff': False,
        'is_superuser': False,
        'is_approved': True,
        'is_active': True,
        'password': 'Password123!'
    }
]

print("====================================================")
print("   Ahmedabad Event Hub - Dev Credentials Setup      ")
print("====================================================")

for u_data in users_to_create:
    email = u_data['email']
    password = u_data.pop('password')
    
    user, created = User.objects.get_or_create(email=email, defaults=u_data)
    
    # Ensure role, is_active, is_approved, is_staff, is_superuser are set properly
    user.is_active = True
    user.is_approved = True
    user.is_staff = u_data['is_staff']
    user.is_superuser = u_data['is_superuser']
    user.role = u_data['role']
    user.set_password(password)  # Reset/set password
    user.save()
    
    status = "CREATED" if created else "UPDATED/RESET"
    pwd_ok = user.check_password(password)
    print(f"[{status}] Role: {user.role.upper():10} | Email: {email:22} | Pwd: {password} | Verified: {pwd_ok}")

# Double check if other admin accounts (like admin@eventhub.com) exist and update them as well
other_admins = User.objects.filter(role='admin') | User.objects.filter(is_superuser=True)
for admin_user in other_admins:
    if admin_user.email != 'admin@example.com':
        admin_user.is_active = True
        admin_user.is_approved = True
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.set_password('Password123!')
        admin_user.save()
        pwd_ok = admin_user.check_password('Password123!')
        print(f"[RESET OTHER] Role: ADMIN      | Email: {admin_user.email:22} | Pwd: Password123! | Verified: {pwd_ok}")

print("\n====================================================")
print("   All Registered Users in Database                 ")
print("====================================================")
for u in User.objects.all():
    print(f"- Email: {u.email:25} | Role: {u.role:10} | Staff: {u.is_staff:5} | Active: {u.is_active:5} | Approved: {u.is_approved}")
print("====================================================")
