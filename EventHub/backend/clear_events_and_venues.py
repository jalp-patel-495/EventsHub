import os
import django

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eventhub.settings')
django.setup()

from events.models import Event, Category, Booking
from venues.models import Venue, VenueBooking, VenueReview

def clear_all_events_and_venues():
    print("Deleting all venue bookings and reviews...")
    VenueBooking.objects.all().delete()
    VenueReview.objects.all().delete()

    print("Deleting all event bookings...")
    Booking.objects.all().delete()

    print("Deleting all events...")
    events_count, _ = Event.objects.all().delete()

    print("Deleting all venue plots...")
    venues_count, _ = Venue.objects.all().delete()

    print(f"Successfully deleted {events_count} events and {venues_count} venue plots!")
    print("Database is now clean of all events and venues.")

if __name__ == "__main__":
    clear_all_events_and_venues()
