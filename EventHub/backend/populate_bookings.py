import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eventhub.settings')
django.setup()

from django.contrib.auth import get_user_model
from events.models import Event, Booking

User = get_user_model()

def populate():
    # Retrieve customer and organizer users
    try:
        customer = User.objects.get(email='customer@example.com')
    except User.DoesNotExist:
        print("Customer user does not exist. Please run setup_dev_credentials.py first.")
        return

    # Clear existing bookings
    Booking.objects.all().delete()
    print("Cleared existing bookings.")

    # Get some approved events
    events = Event.objects.filter(is_approved=True)[:5]
    if not events.exists():
        print("No approved events found. Please run populate_events.py first.")
        return

    print(f"Found {len(events)} approved events to generate bookings for.")

    mock_bookings = [
        {
            'event': events[0],
            'tickets_count': 3,
            'total_price': Decimal(events[0].price * 3),
            'status': 'confirmed',
            'payment_status': 'paid',
            'razorpay_payment_id': 'pay_mock_11111111111111'
        },
        {
            'event': events[1],
            'tickets_count': 5,
            'total_price': Decimal(events[1].price * 5),
            'status': 'confirmed',
            'payment_status': 'paid',
            'razorpay_payment_id': 'pay_mock_22222222222222'
        },
        {
            'event': events[2],
            'tickets_count': 2,
            'total_price': Decimal(events[2].price * 2),
            'status': 'confirmed',
            'payment_status': 'paid',
            'razorpay_payment_id': 'pay_mock_33333333333333'
        },
        {
            'event': events[3],
            'tickets_count': 4,
            'total_price': Decimal(events[3].price * 4),
            'status': 'cancelled',
            'payment_status': 'refunded',
            'razorpay_payment_id': 'pay_mock_44444444444444'
        },
        {
            'event': events[4],
            'tickets_count': 1,
            'total_price': Decimal(events[4].price * 1),
            'status': 'confirmed',
            'payment_status': 'paid',
            'razorpay_payment_id': 'pay_mock_55555555555555'
        }
    ]

    for idx, mb in enumerate(mock_bookings):
        booking = Booking.objects.create(
            user=customer,
            event=mb['event'],
            tickets_count=mb['tickets_count'],
            total_price=mb['total_price'],
            status=mb['status'],
            payment_status=mb['payment_status'],
            razorpay_payment_id=mb['razorpay_payment_id'],
            razorpay_order_id=f"order_mock_{idx}"
        )
        print(f"Created Booking {booking.id} for Event '{mb['event'].title}' - Paid Amount: Rs. {mb['total_price']}")

    # Let's also create some VenueBookings to populate Venue Revenue splits!
    from venues.models import VenueBooking, Venue
    VenueBooking.objects.all().delete()
    print("Cleared existing venue bookings.")

    venues = Venue.objects.filter(is_approved=True)
    organizer = User.objects.filter(role='organizer').first()
    if venues.exists() and organizer:
        venue = venues.first()
        v_booking = VenueBooking.objects.create(
            venue=venue,
            organizer=organizer,
            start_date="2026-08-15",
            end_date="2026-08-17",
            total_price=Decimal(venue.price_per_day * 2),
            status='approved',
            payment_status='paid',
            payment_id='pay_venue_mock_9999'
        )
        print(f"Created Venue Booking {v_booking.id} for Venue '{venue.name}' - Paid Amount: Rs. {v_booking.total_price}")

    print("Database population completed successfully!")

if __name__ == '__main__':
    populate()
