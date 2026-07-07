from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CateringServiceViewSet,
    CateringPackageViewSet,
    CateringBookingViewSet,
    CateringDashboardView
)

router = DefaultRouter()
router.register(r'catering-services', CateringServiceViewSet, basename='catering-service')
router.register(r'catering-packages', CateringPackageViewSet, basename='catering-package')
router.register(r'catering-bookings', CateringBookingViewSet, basename='catering-booking')

urlpatterns = [
    path('catering/dashboard/', CateringDashboardView.as_view(), name='catering-dashboard'),
    path('', include(router.urls)),
]
