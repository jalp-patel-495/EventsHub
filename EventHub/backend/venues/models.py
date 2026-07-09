from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator

User = get_user_model()

class Venue(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField()
    location = models.CharField(max_length=255)
    price_per_day = models.DecimalField(
        max_digits=10, decimal_places=2,
        validators=[MinValueValidator(1)]
    )
    facilities = models.JSONField(default=list)  # e.g., ["Parking", "Stage", "Restrooms"]
    image = models.ImageField(upload_to='venues/', blank=True, null=True)
    owner = models.ForeignKey(
        User, on_delete=models.CASCADE,
        limit_choices_to={'role': 'plot_owner'},
        related_name='venues'
    )
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    # ── Catering Sub-Facility ──
    has_catering = models.BooleanField(default=False)
    catering_price_per_plate = models.DecimalField(
        max_digits=10, decimal_places=2, default=0.00,
        validators=[MinValueValidator(0)]
    )
    catering_description = models.TextField(blank=True, default='')
    catering_cuisine = models.CharField(max_length=100, blank=True, default='')
    catering_min_plates = models.PositiveIntegerField(default=10)

    # ── DJ Sub-Facility ──
    has_dj = models.BooleanField(default=False)
    dj_price = models.DecimalField(
        max_digits=10, decimal_places=2, default=0.00,
        validators=[MinValueValidator(0)]
    )
    dj_equipment = models.TextField(blank=True, default='')

    # ── Decoration Sub-Facility ──
    has_decor = models.BooleanField(default=False)
    decor_price = models.DecimalField(
        max_digits=10, decimal_places=2, default=0.00,
        validators=[MinValueValidator(0)]
    )
    decor_themes = models.TextField(blank=True, default='')

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['-created_at']


class VenueBooking(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled')
    )
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name='bookings')
    organizer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='venue_bookings')
    start_date = models.DateField()
    end_date = models.DateField()
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_status = models.CharField(max_length=20, default='pending')  # pending, paid, failed, refunded
    payment_id = models.CharField(max_length=100, blank=True, null=True)
    cancel_requested = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    # ── Sub-facilities chosen by Booker ──
    use_catering = models.BooleanField(default=False)
    catering_plates = models.PositiveIntegerField(default=0)
    catering_cuisine = models.CharField(max_length=100, blank=True, default='')
    catering_description = models.TextField(blank=True, default='')
    use_dj = models.BooleanField(default=False)
    dj_package = models.CharField(max_length=100, blank=True, default='')
    dj_equipment = models.CharField(max_length=255, blank=True, default='')
    use_decor = models.BooleanField(default=False)
    decor_theme = models.CharField(max_length=100, blank=True, default='')

    def __str__(self):
        return f"{self.venue.name} booked by {self.organizer.email} ({self.start_date} to {self.end_date})"

    class Meta:
        ordering = ['-created_at']


class VenueReview(models.Model):
    venue = models.ForeignKey(
        Venue,
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='venue_reviews'
    )
    rating = models.IntegerField()  # 1 to 5
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'venue')

    def __str__(self):
        return f"Review ({self.rating}/5) for {self.venue.name} by {self.user.email}"

