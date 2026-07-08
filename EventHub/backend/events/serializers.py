from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Category, Event, Booking, Review, Wishlist, Coupon, ContactQuery
from accounts.serializers import UserSerializer
from venues.serializers import VenueSerializer

User = get_user_model()

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ReviewSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = Review
        fields = ('id', 'user', 'user_details', 'event', 'rating', 'comment', 'created_at')
        read_only_fields = ('user', 'event')

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

class EventSerializer(serializers.ModelSerializer):
    organizer_details = UserSerializer(source='organizer', read_only=True)
    category_details = CategorySerializer(source='category', read_only=True)
    venue_details = VenueSerializer(source='venue', read_only=True)
    rating_avg = serializers.SerializerMethodField()
    rating_count = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = (
            'id', 'title', 'description', 'date', 'time', 'location', 
            'category', 'category_details', 'price', 'tickets_total', 
            'tickets_sold', 'image', 'organizer', 'organizer_details', 
            'rating_avg', 'rating_count', 'is_approved', 'created_at',
            'venue', 'venue_details'
        )
        read_only_fields = ('organizer', 'tickets_sold', 'is_approved')

    def get_rating_avg(self, obj):
        reviews = obj.reviews.all()
        if not reviews:
            return 0.0
        return round(sum(r.rating for r in reviews) / len(reviews), 1)

    def get_rating_count(self, obj):
        return obj.reviews.count()

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if instance.image and (instance.image.name.startswith('http://') or instance.image.name.startswith('https://')):
            ret['image'] = instance.image.name
        return ret

class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = ('id', 'code', 'discount_percent', 'active', 'valid_until')

class BookingSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    event_details = EventSerializer(source='event', read_only=True)
    coupon_details = CouponSerializer(source='coupon', read_only=True)

    class Meta:
        model = Booking
        fields = (
            'id', 'user', 'user_details', 'event', 'event_details', 'tickets_count', 
            'total_price', 'status', 'payment_status', 'payment_id', 'coupon', 'coupon_details', 
            'razorpay_order_id', 'razorpay_payment_id', 'qr_code_hash', 'is_checked_in', 'ticket_category', 'refund_requested', 'created_at'
        )
        read_only_fields = (
            'user', 'event', 'total_price', 'status', 'payment_status', 'payment_id', 
            'razorpay_order_id', 'razorpay_payment_id', 'qr_code_hash', 'is_checked_in', 'refund_requested'
        )

    def validate_tickets_count(self, value):
        if value <= 0:
            raise serializers.ValidationError("Tickets count must be greater than zero.")
        return value

class WishlistSerializer(serializers.ModelSerializer):
    event_details = EventSerializer(source='event', read_only=True)

    class Meta:
        model = Wishlist
        fields = ('id', 'user', 'event', 'event_details', 'created_at')
        read_only_fields = ('user',)

class ContactQuerySerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactQuery
        fields = '__all__'
