from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VenueViewSet, VenueBookingCreateListView, VenueBookingActionView, PollPaymentView, ApprovePaymentView, VenueReviewCreateView

router = DefaultRouter()
router.register(r'listings', VenueViewSet, basename='venue')

urlpatterns = [
    path('bookings/', VenueBookingCreateListView.as_view(), name='venue_booking_list'),
    path('bookings/poll-payment/', PollPaymentView.as_view(), name='poll_payment'),
    path('bookings/approve-payment/', ApprovePaymentView.as_view(), name='approve_payment'),
    path('bookings/<int:booking_id>/<str:action>/', VenueBookingActionView.as_view(), name='venue_booking_action'),
    path('<int:venue_id>/review/', VenueReviewCreateView.as_view(), name='venue_review'),
    path('', include(router.urls)),
]
