from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import CateringService, CateringPackage, CateringBooking, CateringReview

User = get_user_model()

class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'first_name', 'last_name', 'email', 'role')

class CateringPackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = CateringPackage
        fields = '__all__'

class CateringReviewSerializer(serializers.ModelSerializer):
    user_details = UserMiniSerializer(source='user', read_only=True)

    class Meta:
        model = CateringReview
        fields = '__all__'

class CateringServiceSerializer(serializers.ModelSerializer):
    packages = CateringPackageSerializer(many=True, read_only=True)
    reviews = CateringReviewSerializer(many=True, read_only=True)
    owner_details = UserMiniSerializer(source='owner', read_only=True)
    average_rating = serializers.SerializerMethodField()
    venue_name = serializers.CharField(source='venue.name', read_only=True)

    class Meta:
        model = CateringService
        fields = '__all__'

    def get_average_rating(self, obj):
        reviews = obj.reviews.all()
        if not reviews:
            return 0
        return round(sum(r.rating for r in reviews) / len(reviews), 1)

class CateringBookingSerializer(serializers.ModelSerializer):
    catering_service_details = CateringServiceSerializer(source='catering_service', read_only=True)
    catering_package_details = CateringPackageSerializer(source='catering_package', read_only=True)
    organizer_details = UserMiniSerializer(source='organizer', read_only=True)

    class Meta:
        model = CateringBooking
        fields = '__all__'

    def validate(self, attrs):
        service = attrs.get('catering_service')
        guests = attrs.get('guests_count')
        if service:
            if guests < service.min_guests:
                raise serializers.ValidationError(
                    f"Guest count must be at least {service.min_guests}."
                )
            if guests > service.max_guests:
                raise serializers.ValidationError(
                    f"Guest count cannot exceed {service.max_guests}."
                )
        return attrs
