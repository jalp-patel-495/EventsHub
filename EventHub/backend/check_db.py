import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eventhub.settings')
django.setup()

from django.contrib.auth import get_user_model
from events.models import Event, Booking

User = get_user_model()
print('USERS:', [(u.email, u.role) for u in User.objects.all()])
print('EVENTS:', [(e.id, e.title, e.organizer.email, e.is_approved) for e in Event.objects.all()])
print('BOOKINGS:', [(b.id, b.user.email, b.event.title, b.tickets_count, b.total_price, b.status, b.payment_status) for b in Booking.objects.all()])
