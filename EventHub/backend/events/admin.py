from django.contrib import admin
from .models import ContactQuery, Category, Event, Coupon, Booking, Review, Wishlist

@admin.register(ContactQuery)
class ContactQueryAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'role', 'subject', 'created_at')
    list_filter = ('role', 'created_at')
    search_fields = ('name', 'email', 'subject', 'message')

admin.site.register(Category)
admin.site.register(Event)
admin.site.register(Coupon)
admin.site.register(Booking)
admin.site.register(Review)
admin.site.register(Wishlist)
