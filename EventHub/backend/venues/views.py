from rest_framework import viewsets, permissions, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from datetime import datetime

from .models import Venue, VenueBooking, VenueReview
from .serializers import VenueSerializer, VenueBookingSerializer, VenueReviewSerializer
from notifications.models import Notification

class VenueViewSet(viewsets.ModelViewSet):
    queryset = Venue.objects.all().order_by('-created_at')
    serializer_class = VenueSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = Venue.objects.all().order_by('-created_at')
        
        # Enforce administrative approval visibility rules
        user = self.request.user
        if user.is_anonymous:
            # Guests only see approved venues
            queryset = queryset.filter(is_approved=True)
        elif user.role != 'admin':
            # Non-admins: plot owners can see all of their own venues plus other approved venues; customers/organizers see approved venues
            if user.role == 'plot_owner':
                queryset = queryset.filter(Q(owner=user) | Q(is_approved=True))
            else:
                queryset = queryset.filter(is_approved=True)
        # Admins see all venues

        
        # Search by name/location
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(location__icontains=search) |
                Q(description__icontains=search)
            )

        # Filter by owner
        owner = self.request.query_params.get('owner')
        if owner:
            queryset = queryset.filter(owner_id=owner)

        return queryset

    def perform_create(self, serializer):
        if self.request.user.role != 'plot_owner':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only venue owners can list venues.")
        serializer.save(owner=self.request.user)

    def update(self, request, *args, **kwargs):
        venue = self.get_object()
        if venue.owner != request.user:
            return Response({"error": "You do not own this venue listing."}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        venue = self.get_object()
        if venue.owner != request.user:
            return Response({"error": "You do not own this venue listing."}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

class VenueBookingCreateListView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        if request.user.role == 'plot_owner':
            # Venue owners see requests for their venues
            bookings = VenueBooking.objects.filter(venue__owner=request.user).order_by('-created_at')
        else:
            # Organizers see their requests
            bookings = VenueBooking.objects.filter(organizer=request.user).order_by('-created_at')
            
        serializer = VenueBookingSerializer(bookings, many=True)
        return Response(serializer.data)

    def post(self, request):
        if request.user.role not in ['organizer', 'customer']:
            return Response({"error": "Only organizers and customers can request venue bookings."}, status=status.HTTP_403_FORBIDDEN)
            
        venue_id = request.data.get('venue')
        venue = get_object_or_404(Venue, pk=venue_id)
        
        serializer = VenueBookingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        start_date = serializer.validated_data['start_date']
        end_date = serializer.validated_data['end_date']
        
        # Check date overlap with already approved bookings
        overlap = VenueBooking.objects.filter(
            venue=venue,
            status='approved',
            start_date__lte=end_date,
            end_date__gte=start_date
        ).exists()
        
        if overlap:
            return Response({"error": "This venue is already booked for the selected dates."}, status=status.HTTP_400_BAD_REQUEST)
            
        use_catering = serializer.validated_data.get('use_catering', False)
        catering_plates = serializer.validated_data.get('catering_plates', 0)
        use_dj = serializer.validated_data.get('use_dj', False)
        use_decor = serializer.validated_data.get('use_decor', False)

        # Validate that requested services are actually offered by this venue
        if use_catering and not venue.has_catering:
            return Response({"error": "This venue does not offer catering services."}, status=status.HTTP_400_BAD_REQUEST)
        if use_dj and not venue.has_dj:
            return Response({"error": "This venue does not offer DJ services."}, status=status.HTTP_400_BAD_REQUEST)
        if use_decor and not venue.has_decor:
            return Response({"error": "This venue does not offer decoration services."}, status=status.HTTP_400_BAD_REQUEST)

        # Validate minimum catering plate order
        if use_catering and catering_plates < max(1, venue.catering_min_plates or 1):
            return Response(
                {"error": f"Minimum plate order for catering is {venue.catering_min_plates or 1} plates."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Calculate total price
        days = (end_date - start_date).days + 1
        total_price = venue.price_per_day * days

        if use_catering and venue.has_catering:
            total_price += venue.catering_price_per_plate * catering_plates
        if use_dj and venue.has_dj:
            total_price += venue.dj_price * days
        if use_decor and venue.has_decor:
            total_price += venue.decor_price
            
        payment_status = request.data.get('payment_status', 'pending')
        payment_id = request.data.get('payment_id')

        booking = serializer.save(
            organizer=request.user,
            venue=venue,
            total_price=total_price,
            status='pending',
            payment_status=payment_status,
            payment_id=payment_id
        )
        
        # Notify Venue Owner
        Notification.objects.create(
            user=venue.owner,
            title="New Venue Booking Request",
            message=f"{request.user.first_name} requested to book {venue.name} from {start_date} to {end_date}."
        )

        return Response(VenueBookingSerializer(booking).data, status=status.HTTP_201_CREATED)

class VenueBookingActionView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, booking_id, action):
        booking = get_object_or_404(VenueBooking, pk=booking_id)
        
        if action == 'cancel':
            if booking.organizer != request.user and booking.venue.owner != request.user:
                return Response({"error": "Access denied."}, status=status.HTTP_403_FORBIDDEN)
                
            if booking.status == 'cancelled':
                return Response({"error": "Booking is already cancelled."}, status=status.HTTP_400_BAD_REQUEST)
                
            # If the booking is approved, flag it as cancel requested
            if booking.status == 'approved':
                booking.cancel_requested = True
                booking.save()
                
                # Notify venue owner about the request
                Notification.objects.create(
                    user=booking.venue.owner,
                    title="Venue Cancellation Request Received",
                    message=f"{request.user.first_name} requested to cancel the booking for {booking.venue.name}."
                )
            else:
                # If it wasn't approved yet (e.g. pending), cancel it immediately
                booking.status = 'cancelled'
                booking.save()
                
                Notification.objects.create(
                    user=booking.venue.owner,
                    title="Venue Booking Request Cancelled",
                    message=f"The pending venue booking request for {booking.venue.name} was cancelled by the customer."
                )
                
            return Response(VenueBookingSerializer(booking).data, status=status.HTTP_200_OK)

        if action == 'approve_cancel':
            if booking.venue.owner != request.user:
                return Response({"error": "Access denied."}, status=status.HTTP_403_FORBIDDEN)
                
            if not booking.cancel_requested:
                return Response({"error": "No cancellation request exists for this booking."}, status=status.HTTP_400_BAD_REQUEST)
                
            booking.status = 'cancelled'
            if booking.payment_status == 'paid':
                booking.payment_status = 'refunded'
            booking.cancel_requested = False
            booking.save()
            
            # Notify owner & organizer
            refund_amount = float(booking.total_price) * 0.90
            owner_retained = float(booking.total_price) * 0.05
            admin_retained = float(booking.total_price) * 0.05
            Notification.objects.create(
                user=booking.venue.owner,
                title="Venue Booking Cancellation Approved",
                message=f"The cancellation request for {booking.venue.name} was approved. 5% (₹{owner_retained:.2f}) retained as owner profit."
            )
            Notification.objects.create(
                user=booking.organizer,
                title="Venue Booking Cancellation Approved",
                message=f"Your booking cancellation for {booking.venue.name} has been approved. A 90% refund of ₹{refund_amount:.2f} has been processed."
            )
            
            return Response(VenueBookingSerializer(booking).data, status=status.HTTP_200_OK)

        if booking.venue.owner != request.user:
            return Response({"error": "Access denied."}, status=status.HTTP_403_FORBIDDEN)
            
        if action not in ['approve', 'reject']:
            return Response({"error": "Invalid action."}, status=status.HTTP_400_BAD_REQUEST)

        if action == 'approve':
            # Double check overlap before approving
            overlap = VenueBooking.objects.filter(
                venue=booking.venue,
                status='approved',
                start_date__lte=booking.end_date,
                end_date__gte=booking.start_date
            ).exclude(pk=booking.pk).exists()
            
            if overlap:
                return Response({"error": "Cannot approve. Another booking conflicts with these dates."}, status=status.HTTP_400_BAD_REQUEST)
                
            booking.status = 'approved'
            booking.save()
            
            # Auto-approve the associated Event if exists
            from events.models import Event
            Event.objects.filter(
                organizer=booking.organizer,
                venue=booking.venue,
                date=booking.start_date
            ).update(is_approved=True)
            
            # Reject other overlapping pending bookings automatically
            VenueBooking.objects.filter(
                venue=booking.venue,
                status='pending',
                start_date__lte=booking.end_date,
                end_date__gte=booking.start_date
            ).exclude(pk=booking.pk).update(status='rejected')

            # Notify organizer
            Notification.objects.create(
                user=booking.organizer,
                title="Venue Booking Approved!",
                message=f"Your request to book {booking.venue.name} from {booking.start_date} to {booking.end_date} has been approved."
            )
        else:
            booking.status = 'rejected'
            booking.save()
            
            # Notify organizer
            Notification.objects.create(
                user=booking.organizer,
                title="Venue Booking Rejected",
                message=f"Your request to book {booking.venue.name} from {booking.start_date} to {booking.end_date} has been rejected."
            )

        return Response(VenueBookingSerializer(booking).data, status=status.HTTP_200_OK)


# Mock Payment Storage for cross-device QR code flow
MOCK_PAYMENTS = {}

class PollPaymentView(APIView):
    permission_classes = ()
    def get(self, request):
        token = request.query_params.get('token')
        if not token:
            return Response({"error": "Token required"}, status=status.HTTP_400_BAD_REQUEST)
        status_val = MOCK_PAYMENTS.get(token, "pending")
        return Response({"status": status_val})

class ApprovePaymentView(APIView):
    permission_classes = ()
    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({"error": "Token required"}, status=status.HTTP_400_BAD_REQUEST)
        MOCK_PAYMENTS[token] = "approved"
        return Response({"status": "success", "message": "Payment approved"})


class VenueReviewCreateView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, venue_id):
        venue = get_object_or_404(Venue, pk=venue_id)
        
        # 1. Enforce that customer has booked this venue (status='approved')
        has_booked = VenueBooking.objects.filter(organizer=request.user, venue=venue, status='approved').exists()
        if not has_booked:
            return Response({"error": "You can only review venues you have booked and rented."}, status=status.HTTP_400_BAD_REQUEST)
            
        # 2. Check duplicate review
        already_reviewed = VenueReview.objects.filter(user=request.user, venue=venue).exists()
        if already_reviewed:
            return Response({"error": "You have already reviewed this venue."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = VenueReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        review = serializer.save(user=request.user, venue=venue)
        return Response(VenueReviewSerializer(review).data, status=status.HTTP_201_CREATED)


