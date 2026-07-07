from django.contrib import admin
from .models import CateringService, CateringPackage, CateringBooking, CateringReview

@admin.register(CateringService)
class CateringServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'cuisine_type', 'owner', 'price_per_plate', 'is_approved')
    list_filter = ('is_approved', 'cuisine_type')
    search_fields = ('name', 'cuisine_type')

@admin.register(CateringPackage)
class CateringPackageAdmin(admin.ModelAdmin):
    list_display = ('name', 'catering_service', 'price_per_plate')
    search_fields = ('name',)

@admin.register(CateringBooking)
class CateringBookingAdmin(admin.ModelAdmin):
    list_display = ('catering_service', 'organizer', 'booking_date', 'status', 'payment_status')
    list_filter = ('status', 'payment_status', 'booking_date')

@admin.register(CateringReview)
class CateringReviewAdmin(admin.ModelAdmin):
    list_display = ('catering_service', 'user', 'rating', 'is_flagged')
    list_filter = ('rating', 'is_flagged')
