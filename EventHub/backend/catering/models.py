from django.db import models
from django.contrib.auth import get_user_model
from venues.models import Venue, VenueBooking

User = get_user_model()

class CateringService(models.Model):
    venue = models.ForeignKey(
        Venue,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='catering_services'
    )
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='catering_services',
        limit_choices_to={'role': 'plot_owner'}
    )
    name = models.CharField(max_length=200)
    description = models.TextField()
    cuisine_type = models.CharField(max_length=255) # e.g., "Gujarati, Punjabi, Chinese"
    price_per_plate = models.DecimalField(max_digits=10, decimal_places=2)
    min_guests = models.IntegerField(default=10)
    max_guests = models.IntegerField(default=1000)
    image = models.ImageField(upload_to='catering/', blank=True, null=True)
    pdf_menu = models.FileField(upload_to='catering_menus/', blank=True, null=True)
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class CateringPackage(models.Model):
    catering_service = models.ForeignKey(
        CateringService,
        on_delete=models.CASCADE,
        related_name='packages'
    )
    name = models.CharField(max_length=200) # Gold, Silver, Basic
    description = models.TextField()
    price_per_plate = models.DecimalField(max_digits=10, decimal_places=2)
    menu_items = models.JSONField(default=list) # e.g., ["Item 1", "Item 2"]
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} for {self.catering_service.name}"

class CateringBooking(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled')
    )
    catering_service = models.ForeignKey(
        CateringService,
        on_delete=models.CASCADE,
        related_name='bookings'
    )
    catering_package = models.ForeignKey(
        CateringPackage,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='bookings'
    )
    venue_booking = models.ForeignKey(
        VenueBooking,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='catering_bookings'
    )
    organizer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='catering_bookings'
    )
    booking_date = models.DateField()
    guests_count = models.IntegerField()
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_status = models.CharField(max_length=20, default='pending') # pending, paid, failed, refunded
    payment_id = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Catering booking at {self.catering_service.name} by {self.organizer.email}"

class CateringReview(models.Model):
    catering_service = models.ForeignKey(
        CateringService,
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='catering_reviews'
    )
    rating = models.IntegerField() # 1 to 5
    comment = models.TextField()
    is_flagged = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review ({self.rating}/5) for {self.catering_service.name} by {self.user.email}"
