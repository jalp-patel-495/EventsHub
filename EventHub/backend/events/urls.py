from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryListView,
    EventViewSet,
    BookingCreateListView,
    BookingCancelView,
    OrganizerRefundApproveView,
    WishlistToggleView,
    ReviewCreateView,
    ApplyCouponView,
    BookingVerifyPaymentView,
    BookingScanVerifyView,
    LiveEventsFeedView,
    LiveWeatherFeedView,
    ContactQueryCreateView,
    UserContactQueryListView
)

router = DefaultRouter()
router.register(r'listings', EventViewSet, basename='event')

urlpatterns = [
    path('categories/', CategoryListView.as_view(), name='category_list'),
    path('bookings/', BookingCreateListView.as_view(), name='booking_list'),
    path('bookings/verify/', BookingVerifyPaymentView.as_view(), name='booking_verify'),
    path('bookings/scan-verify/', BookingScanVerifyView.as_view(), name='booking_scan_verify'),
    path('bookings/<int:booking_id>/cancel/', BookingCancelView.as_view(), name='booking_cancel'),
    path('bookings/<int:booking_id>/approve-refund/', OrganizerRefundApproveView.as_view(), name='booking_approve_refund'),
    path('coupons/apply/', ApplyCouponView.as_view(), name='coupon_apply'),
    path('live/', LiveEventsFeedView.as_view(), name='live_events_feed'),
    path('live/weather/', LiveWeatherFeedView.as_view(), name='live_weather_feed'),
    path('wishlist/', WishlistToggleView.as_view(), name='wishlist_list'),
    path('contact/', ContactQueryCreateView.as_view(), name='contact_create'),
    path('contact/my-complaints/', UserContactQueryListView.as_view(), name='my_complaints'),
    path('<int:event_id>/book/', BookingCreateListView.as_view(), name='event_book'),
    path('<int:event_id>/wishlist/', WishlistToggleView.as_view(), name='event_wishlist'),
    path('<int:event_id>/review/', ReviewCreateView.as_view(), name='event_review'),
    path('', include(router.urls)),
]
