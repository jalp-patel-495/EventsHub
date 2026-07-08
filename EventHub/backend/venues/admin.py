from django.contrib import admin
from .models import Venue, VenueBooking, VenueReview

admin.site.register(Venue)
admin.site.register(VenueBooking)
admin.site.register(VenueReview)

