from rest_framework import serializers
from django.utils import timezone
from .models import Venue, VenueBooking
from accounts.serializers import UserSerializer


class VenueSerializer(serializers.ModelSerializer):
    owner_details = UserSerializer(source='owner', read_only=True)

    class Meta:
        model = Venue
        fields = (
            'id', 'name', 'description', 'location', 'price_per_day',
            'facilities', 'image', 'owner', 'owner_details', 'is_approved', 'created_at',
            # Catering
            'has_catering', 'catering_price_per_plate', 'catering_description',
            'catering_cuisine', 'catering_min_plates',
            # DJ
            'has_dj', 'dj_price', 'dj_equipment',
            # Decor
            'has_decor', 'decor_price', 'decor_themes',
        )
        read_only_fields = ('owner', 'is_approved')

    def validate_price_per_day(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price per day must be greater than 0.")
        if value > 500000:
            raise serializers.ValidationError("Price per day cannot exceed ₹5,00,000.")
        return value

    def validate_name(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Venue name must be at least 3 characters long.")
        return value.strip()

    def validate_description(self, value):
        if len(value.strip()) < 20:
            raise serializers.ValidationError("Description must be at least 20 characters long.")
        return value.strip()

    def validate(self, attrs):
        # Catering validations
        if attrs.get('has_catering'):
            if not attrs.get('catering_price_per_plate') or attrs['catering_price_per_plate'] <= 0:
                raise serializers.ValidationError({"catering_price_per_plate": "Catering price per plate must be positive when catering is enabled."})
        # DJ validations
        if attrs.get('has_dj'):
            if not attrs.get('dj_price') or attrs['dj_price'] <= 0:
                raise serializers.ValidationError({"dj_price": "DJ price per day must be positive when DJ service is enabled."})
        # Decor validations
        if attrs.get('has_decor'):
            if not attrs.get('decor_price') or attrs['decor_price'] <= 0:
                raise serializers.ValidationError({"decor_price": "Decoration price must be positive when decoration service is enabled."})
        return attrs


class VenueBookingSerializer(serializers.ModelSerializer):
    organizer_details = UserSerializer(source='organizer', read_only=True)
    venue_details = VenueSerializer(source='venue', read_only=True)

    class Meta:
        model = VenueBooking
        fields = (
            'id', 'venue', 'venue_details', 'organizer', 'organizer_details',
            'start_date', 'end_date', 'total_price', 'status', 'payment_status',
            'payment_id', 'created_at',
            'use_catering', 'catering_plates', 'use_dj', 'use_decor',
            'catering_cuisine', 'catering_description', 'dj_package', 'dj_equipment', 'decor_theme'
        )
        read_only_fields = ('organizer', 'total_price', 'status', 'payment_status', 'payment_id')

    def validate_start_date(self, value):
        if value < timezone.now().date():
            raise serializers.ValidationError("Booking start date cannot be in the past.")
        return value

    def validate(self, attrs):
        start = attrs.get('start_date')
        end = attrs.get('end_date')
        if start and end and start > end:
            raise serializers.ValidationError({"end_date": "End date must be on or after the start date."})

        # Catering plates validation
        if attrs.get('use_catering'):
            plates = attrs.get('catering_plates', 0)
            if plates < 1:
                raise serializers.ValidationError({"catering_plates": "Number of catering plates must be at least 1."})

        return attrs
