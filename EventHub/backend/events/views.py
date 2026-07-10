import os
import uuid
import random
import razorpay
from rest_framework import viewsets, generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone
from decimal import Decimal

from .models import Category, Event, Booking, Review, Wishlist, Coupon, ContactQuery
from .serializers import CategorySerializer, EventSerializer, BookingSerializer, ReviewSerializer, WishlistSerializer, CouponSerializer, ContactQuerySerializer
from notifications.models import Notification
from events.live_events import get_live_weather, get_live_ahmedabad_events

class CustomPagination(PageNumberPagination):
    page_size = 6
    page_size_query_param = 'page_size'
    max_page_size = 1000

class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = (permissions.AllowAny,)

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all().order_by('-created_at')
    serializer_class = EventSerializer
    pagination_class = CustomPagination

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = Event.objects.all().order_by('-created_at')
        
        # Enforce administrative approval visibility rules
        user = self.request.user
        if user.is_anonymous:
            # Guests only see approved events
            queryset = queryset.filter(is_approved=True)
        elif user.role != 'admin':
            # Non-admins: organizers can see all of their own events plus other approved events; customers/plot-owners see approved events
            if user.role == 'organizer':
                queryset = queryset.filter(Q(organizer=user) | Q(is_approved=True))
            else:
                queryset = queryset.filter(is_approved=True)
        # Admins see all events

        # Exclude dynamic live feed events from the main search list results
        if self.action == 'list':
            queryset = queryset.exclude(category__name="Live Feed Events")
        
        # Searching
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(description__icontains=search) |
                Q(location__icontains=search)
            )

        # Filtering by Category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category_id=category)

        # Filtering by Organizer
        organizer = self.request.query_params.get('organizer')
        if organizer:
            queryset = queryset.filter(organizer_id=organizer)

        # Filtering by Min Price
        min_price = self.request.query_params.get('min_price')
        if min_price:
            queryset = queryset.filter(price__gte=Decimal(min_price))

        # Filtering by Max Price
        max_price = self.request.query_params.get('max_price')
        if max_price:
            queryset = queryset.filter(price__lte=Decimal(max_price))

        # Filtering by Date Range
        start_date = self.request.query_params.get('start_date')
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
            
        end_date = self.request.query_params.get('end_date')
        if end_date:
            queryset = queryset.filter(date__lte=end_date)

        return queryset

    def perform_create(self, serializer):
        # Enforce organizer role
        if self.request.user.role != 'organizer':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only organizers can host events.")
        serializer.save(organizer=self.request.user)

    def update(self, request, *args, **kwargs):
        event = self.get_object()
        if event.organizer != request.user:
            return Response({"error": "You do not own this event."}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        event = self.get_object()
        if event.organizer != request.user:
            return Response({"error": "You do not own this event."}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

class BookingCreateListView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        if request.user.role == 'organizer':
            # Organizers see bookings on their events
            bookings = Booking.objects.filter(event__organizer=request.user).order_by('-created_at')
        else:
            # Customers see their own bookings
            bookings = Booking.objects.filter(user=request.user).order_by('-created_at')
            
        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data)

    def post(self, request, event_id):
        event = get_object_or_404(Event, pk=event_id)
        serializer = BookingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        tickets_count = serializer.validated_data['tickets_count']
        
        # Check stock
        remaining_tickets = event.tickets_total - event.tickets_sold
        if tickets_count > remaining_tickets:
            return Response({"error": f"Only {remaining_tickets} tickets remaining."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check coupon code
        coupon_code = request.data.get('coupon_code')
        coupon = None
        discount_percent = 0
        if coupon_code:
            try:
                coupon_obj = Coupon.objects.get(code__iexact=coupon_code, active=True, valid_until__gte=timezone.now().date())
                coupon = coupon_obj
                discount_percent = coupon_obj.discount_percent
            except Coupon.DoesNotExist:
                return Response({"error": "Invalid or expired coupon code."}, status=status.HTTP_400_BAD_REQUEST)

        # Calculate price (allowing coupon discounts and ticket category tiers)
        ticket_category = request.data.get('ticket_category', 'Silver')
        category_multiplier = Decimal('1.0')
        if ticket_category == 'Gold':
            category_multiplier = Decimal('1.5')
        elif ticket_category == 'Diamond':
            category_multiplier = Decimal('2.5')
        elif ticket_category == 'Fanpit':
            category_multiplier = Decimal('4.0')

        base_price = event.price * tickets_count * category_multiplier
        discount_amount = base_price * (Decimal(discount_percent) / Decimal(100))
        total_price = max(Decimal('0.00'), base_price - discount_amount)

        # Deduct stock
        event.tickets_sold += tickets_count
        event.save()

        if total_price > 0:
            # Setup Razorpay Client order creation
            key_id = os.getenv("RAZORPAY_KEY_ID", "MOCK_KEY_ID")
            key_secret = os.getenv("RAZORPAY_KEY_SECRET", "MOCK_KEY_SECRET")
            
            razorpay_order_id = f"order_{uuid.uuid4().hex[:14]}"
            
            if not key_id.startswith("MOCK"):
                try:
                    client = razorpay.Client(auth=(key_id, key_secret))
                    order_data = {
                        "amount": int(total_price * 100), # in paise
                        "currency": "INR",
                        "payment_capture": 1
                    }
                    order = client.order.create(data=order_data)
                    razorpay_order_id = order['id']
                except Exception as e:
                    # Rollback stock
                    event.tickets_sold -= tickets_count
                    event.save()
                    return Response({"error": "Razorpay order creation failed."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Save pending Booking details
            booking = serializer.save(
                user=request.user,
                event=event,
                total_price=total_price,
                status='pending',
                payment_status='pending',
                coupon=coupon,
                ticket_category=ticket_category,
                razorpay_order_id=razorpay_order_id
            )

            return Response({
                "booking": BookingSerializer(booking).data,
                "razorpay_order_id": razorpay_order_id,
                "key_id": key_id,
                "amount": int(total_price * 100),
                "currency": "INR"
            }, status=status.HTTP_201_CREATED)
        else:
            # Free tickets, auto-confirm
            qr_hash = f"EH-{uuid.uuid4().hex[:8].upper()}-{random.randint(1000, 9999)}"
            booking = serializer.save(
                user=request.user,
                event=event,
                total_price=total_price,
                status='confirmed',
                payment_status='paid',
                coupon=coupon,
                ticket_category=ticket_category,
                qr_code_hash=qr_hash,
                payment_id="FREE_BOOKING"
            )

            # Notification alerts
            Notification.objects.create(
                user=request.user,
                title="Booking Confirmed!",
                message=f"You successfully booked {tickets_count} tickets for {event.title}."
            )
            Notification.objects.create(
                user=event.organizer,
                title="New Ticket Booking",
                message=f"{request.user.first_name} booked {tickets_count} tickets for {event.title}."
            )

            return Response({
                "booking": BookingSerializer(booking).data,
                "free": True
            }, status=status.HTTP_201_CREATED)

class BookingCancelView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, booking_id):
        booking = get_object_or_404(Booking, pk=booking_id)
        
        # Verify ownership
        if booking.user != request.user:
            return Response({"error": "Access denied."}, status=status.HTTP_403_FORBIDDEN)
            
        if booking.status == 'cancelled':
            return Response({"error": "Booking is already cancelled."}, status=status.HTTP_400_BAD_REQUEST)

        # Require card details if the booking is paid
        if booking.payment_status == 'paid':
            card_number = request.data.get('card_number')
            cardholder_name = request.data.get('cardholder_name')
            expiry_date = request.data.get('expiry_date')
            cvv = request.data.get('cvv')
            if not all([card_number, cardholder_name, expiry_date, cvv]):
                return Response({"error": "Card details are required to process the refund."}, status=status.HTTP_400_BAD_REQUEST)

        cancel_count = request.data.get('cancel_count')
        event = booking.event
        
        # Parse cancel_count if provided
        try:
            if cancel_count is not None:
                cancel_count = int(cancel_count)
                if cancel_count < 1 or cancel_count > booking.tickets_count:
                    return Response({"error": "Invalid ticket cancel count."}, status=status.HTTP_400_BAD_REQUEST)
            else:
                cancel_count = booking.tickets_count
        except ValueError:
            return Response({"error": "Cancel count must be an integer."}, status=status.HTTP_400_BAD_REQUEST)

        is_partial = cancel_count < booking.tickets_count

        if is_partial:
            # Calculate price per ticket
            price_per_ticket = float(booking.total_price) / booking.tickets_count
            cancelled_amount = Decimal(f"{price_per_ticket * cancel_count:.2f}")
            
            # Deduct from original booking
            booking.tickets_count -= cancel_count
            booking.total_price -= cancelled_amount
            booking.save()
            
            # Create a separate cancelled booking for the refund request and financial tracking
            refund_req = booking.payment_status == 'paid'
            cancelled_booking = Booking.objects.create(
                user=booking.user,
                event=booking.event,
                tickets_count=cancel_count,
                total_price=cancelled_amount,
                status='cancelled',
                payment_status='paid' if refund_req else 'pending',
                coupon=booking.coupon,
                ticket_category=booking.ticket_category,
                razorpay_order_id=booking.razorpay_order_id,
                razorpay_payment_id=booking.razorpay_payment_id,
                payment_id=booking.payment_id,
                refund_requested=refund_req
            )
            
            # Adjust tickets sold count
            event.tickets_sold = max(0, event.tickets_sold - cancel_count)
            event.save()
            
            # Notify
            refund_amt = float(cancelled_amount) * 0.5
            Notification.objects.create(
                user=request.user,
                title="Partial Booking Cancellation",
                message=f"You cancelled {cancel_count} ticket(s) from {event.title}. A 50% refund of ₹{refund_amt:.2f} will be processed."
            )
            Notification.objects.create(
                user=event.organizer,
                title="Partial Booking Cancelled by Attendee",
                message=f"{request.user.first_name} cancelled {cancel_count} tickets from event {event.title}."
            )
            
            return Response({
                "message": f"Successfully cancelled {cancel_count} ticket(s). A 50% refund of ₹{refund_amt:.2f} has been requested.",
                "booking_id": booking.id,
                "remaining_tickets": booking.tickets_count,
                "new_total_price": float(booking.total_price)
            }, status=status.HTTP_200_OK)
            
        else:
            # Full cancellation
            booking.status = 'cancelled'
            if booking.payment_status == 'paid':
                booking.refund_requested = True
            booking.save()
            
            event.tickets_sold = max(0, event.tickets_sold - booking.tickets_count)
            event.save()
            
            # Notify
            refund_amt = float(booking.total_price) * 0.5
            Notification.objects.create(
                user=request.user,
                title="Booking Cancelled",
                message=f"Your booking for {event.title} has been cancelled. A 50% refund of ₹{refund_amt:.2f} will be processed."
            )
            Notification.objects.create(
                user=event.organizer,
                title="Booking Cancelled by Attendee",
                message=f"Booking for {booking.tickets_count} tickets on {event.title} was cancelled by {request.user.first_name}."
            )
            
            return Response({"message": "Booking cancelled successfully."}, status=status.HTTP_200_OK)

class OrganizerRefundApproveView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, booking_id):
        from .models import Booking
        from notifications.models import Notification
        booking = get_object_or_404(Booking, pk=booking_id)
        
        # Verify that the event organizer is the requesting user
        if booking.event.organizer != request.user:
            return Response({"error": "Access denied. Only the event organizer can approve refunds."}, status=status.HTTP_403_FORBIDDEN)
            
        if booking.payment_status != 'paid' and not booking.refund_requested:
            return Response({"error": "No refund request exists for this booking."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Refund policy: 50% refund to customer
        refund_amount = float(booking.total_price) * 0.50
        
        # Process database changes
        booking.payment_status = 'refunded'
        booking.status = 'cancelled'
        booking.refund_requested = False
        booking.save()
        
        # Notify customer
        Notification.objects.create(
            user=booking.user,
            title="Ticket Refund Approved",
            message=f"Your refund request for {booking.event.title} has been approved by the organizer. A 50% refund of ₹{refund_amount:.2f} is processed."
        )
        
        return Response({"message": "Refund approved successfully.", "refund_amount": refund_amount}, status=status.HTTP_200_OK)

class WishlistToggleView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        wishlists = Wishlist.objects.filter(user=request.user).order_by('-created_at')
        serializer = WishlistSerializer(wishlists, many=True)
        return Response(serializer.data)

    def post(self, request, event_id):
        event = get_object_or_404(Event, pk=event_id)
        wishlist_item = Wishlist.objects.filter(user=request.user, event=event)
        
        if wishlist_item.exists():
            wishlist_item.delete()
            return Response({"message": "Removed from wishlist.", "is_wishlisted": False}, status=status.HTTP_200_OK)
        else:
            Wishlist.objects.create(user=request.user, event=event)
            return Response({"message": "Added to wishlist.", "is_wishlisted": True}, status=status.HTTP_201_CREATED)

class ReviewCreateView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, event_id):
        event = get_object_or_404(Event, pk=event_id)
        
        # 1. Enforce that customer has booked and confirmed tickets to this event
        has_booked = Booking.objects.filter(user=request.user, event=event, status='confirmed').exists()
        if not has_booked:
            return Response({"error": "You can only review events you have booked tickets for."}, status=status.HTTP_400_BAD_REQUEST)
            
        # 2. Check duplicate review
        already_reviewed = Review.objects.filter(user=request.user, event=event).exists()
        if already_reviewed:
            return Response({"error": "You have already reviewed this event."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = ReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        review = serializer.save(user=request.user, event=event)
        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)

class ApplyCouponView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        code = request.data.get('code', '').strip()
        if not code:
            return Response({"error": "Coupon code is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            coupon = Coupon.objects.get(code__iexact=code, active=True, valid_until__gte=timezone.now().date())
            return Response(CouponSerializer(coupon).data, status=status.HTTP_200_OK)
        except Coupon.DoesNotExist:
            return Response({"error": "Invalid or expired coupon code."}, status=status.HTTP_400_BAD_REQUEST)

class BookingVerifyPaymentView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        order_id = request.data.get('razorpay_order_id')
        payment_id = request.data.get('razorpay_payment_id')
        signature = request.data.get('razorpay_signature')

        booking = get_object_or_404(Booking, razorpay_order_id=order_id)
        if booking.user != request.user:
            return Response({"error": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        # Signature verification check
        key_id = os.getenv("RAZORPAY_KEY_ID", "MOCK_KEY_ID")
        key_secret = os.getenv("RAZORPAY_KEY_SECRET", "MOCK_KEY_SECRET")

        if not key_id.startswith("MOCK"):
            try:
                client = razorpay.Client(auth=(key_id, key_secret))
                client.utility.verify_payment_signature({
                    'razorpay_order_id': order_id,
                    'razorpay_payment_id': payment_id,
                    'razorpay_signature': signature
                })
            except Exception as e:
                return Response({"error": "Payment signature verification failed."}, status=status.HTTP_400_BAD_REQUEST)

        # Confirm booking
        booking.status = 'confirmed'
        booking.payment_status = 'paid'
        booking.payment_id = payment_id
        booking.razorpay_payment_id = payment_id
        booking.qr_code_hash = f"EH-{uuid.uuid4().hex[:8].upper()}-{random.randint(1000, 9999)}"
        booking.save()

        # Send email confirmation
        try:
            from accounts.utils import send_booking_confirmation_email
            send_booking_confirmation_email(booking)
        except Exception as e:
            print(f"Error sending booking confirmation email: {e}")

        # Create notifications
        Notification.objects.create(
            user=booking.user,
            title="Ticket Paid & Confirmed!",
            message=f"Your payment of ₹{booking.total_price} for {booking.event.title} was successful."
        )
        Notification.objects.create(
            user=booking.event.organizer,
            title="Ticket Purchase Confirmed",
            message=f"{booking.user.first_name} completed payment for {booking.tickets_count} tickets to {booking.event.title}."
        )

        return Response(BookingSerializer(booking).data, status=status.HTTP_200_OK)

class LiveEventsFeedView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        events = get_live_ahmedabad_events()
        return Response(events, status=status.HTTP_200_OK)

    def post(self, request):
        title = request.data.get('title')
        description = request.data.get('description', '')
        date_str = request.data.get('date')
        time_str = request.data.get('time')
        location = request.data.get('location')
        price_val = request.data.get('price')
        
        if not title:
            return Response({"error": "Title is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        from django.contrib.auth import get_user_model
        from events.models import Category, Event
        from decimal import Decimal
        from django.utils import timezone
        
        User = get_user_model()
        category, _ = Category.objects.get_or_create(
            name="Live Feed Events",
            defaults={"slug": "live-feed-events"}
        )
        
        # Locate a system staff organizer to attach as host
        organizer = User.objects.filter(role='organizer').first()
        if not organizer:
            organizer = User.objects.filter(role='admin').first()
        if not organizer:
            # Fallback to current authenticated user
            organizer = request.user
            
        event, created = Event.objects.get_or_create(
            title=title,
            defaults={
                "description": description or "Live local event feed listing.",
                "date": date_str or timezone.now().date(),
                "time": time_str or "19:00:00",
                "location": location or "Ahmedabad",
                "price": Decimal(str(price_val or 0.0)),
                "tickets_total": 500,
                "organizer": organizer,
                "category": category,
                "is_approved": True, # Automatically approved
            }
        )
        
        return Response({"id": event.id}, status=status.HTTP_200_OK)


class BookingScanVerifyView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        if request.user.role != 'organizer':
            return Response({"error": "Only organizers can scan and verify tickets."}, status=status.HTTP_403_FORBIDDEN)

        qr_code_hash = request.data.get('qr_code_hash', '').strip()
        if not qr_code_hash:
            return Response({"error": "QR code hash is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            booking = Booking.objects.select_related('event', 'user').get(qr_code_hash=qr_code_hash)
        except Booking.DoesNotExist:
            return Response({"error": "Invalid ticket QR code."}, status=status.HTTP_404_NOT_FOUND)

        if booking.event.organizer != request.user:
            return Response({"error": "This ticket is not for an event hosted by you."}, status=status.HTTP_403_FORBIDDEN)

        if booking.status != 'confirmed' or booking.payment_status != 'paid':
            return Response({"error": f"Ticket status is '{booking.status}' (payment: '{booking.payment_status}'). Ticket is not valid."}, status=status.HTTP_400_BAD_REQUEST)

        # Date validation - ticket scanner only works on the date of the event
        today = timezone.localdate()
        event_date = booking.event.date
        if event_date != today:
            if event_date > today:
                return Response({
                    "error": f"Access Denied: The event is scheduled for {event_date.strftime('%Y-%m-%d')}. You cannot scan this ticket before the event date.",
                    "event_date": str(event_date),
                    "code": "EVENT_BEFORE"
                }, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({
                    "error": f"Access Denied: The event was scheduled for {event_date.strftime('%Y-%m-%d')} and has already ended.",
                    "event_date": str(event_date),
                    "code": "EVENT_AFTER"
                }, status=status.HTTP_400_BAD_REQUEST)

        if booking.is_checked_in:
            return Response({
                "error": "This ticket has already been checked in.",
                "attendee_name": f"{booking.user.first_name} {booking.user.last_name}".strip() or booking.user.email,
                "event_title": booking.event.title,
                "tickets_count": booking.tickets_count,
                "already_checked_in": True
            }, status=status.HTTP_400_BAD_REQUEST)

        booking.is_checked_in = True
        booking.save()

        Notification.objects.create(
            user=booking.user,
            title="Ticket Scanned & Verified",
            message=f"Your ticket for {booking.event.title} was scanned at the entrance. Enjoy the event!"
        )

        return Response({
            "message": "Ticket successfully verified and checked in!",
            "attendee_name": f"{booking.user.first_name} {booking.user.last_name}".strip() or booking.user.email,
            "event_title": booking.event.title,
            "tickets_count": booking.tickets_count,
            "is_checked_in": True
        }, status=status.HTTP_200_OK)


class LiveEventsFeedView(APIView):
    """
    GET  → Return real-time events from OpenWebNinja (primary) / Ticketmaster / fallback.
    POST → Register a live-feed event into the DB so it becomes bookable (used by the frontend Buy Tickets flow).
    """
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        events = get_live_ahmedabad_events()
        return Response(events, status=status.HTTP_200_OK)

    def post(self, request):
        """Register a live-feed event card as a real Event in the database."""
        if not request.user.is_authenticated:
            return Response({"error": "Authentication required to book live events."}, status=status.HTTP_401_UNAUTHORIZED)

        title       = request.data.get("title", "Live Event")
        description = request.data.get("description", "A live feed event.")
        date        = request.data.get("date", str(timezone.now().date()))
        time        = request.data.get("time", "18:00:00")
        location    = request.data.get("location", "Ahmedabad")
        price       = request.data.get("price", 0)

        # Fetch or create the 'Live Feed Events' category
        live_category, _ = Category.objects.get_or_create(
            name="Live Feed Events",
            defaults={"slug": "live-feed-events"}
        )

        # Find an approved organizer to own live events (use any existing organizer)
        from django.contrib.auth import get_user_model
        User = get_user_model()
        organizer = User.objects.filter(role='organizer', is_approved=True).first()
        if not organizer:
            organizer = request.user  # Fallback: attach to the requesting user

        # Check if this live event title is already registered (avoid duplicates)
        existing = Event.objects.filter(title=title, category=live_category).first()
        if existing:
            return Response({"id": existing.id, "already_exists": True}, status=status.HTTP_200_OK)

        # Create a new Event record for this live feed event
        event = Event.objects.create(
            title=title,
            description=description,
            date=date,
            time=time,
            location=location,
            price=price,
            total_tickets=500,
            tickets_sold=0,
            category=live_category,
            organizer=organizer,
            is_approved=True,
        )

        return Response({"id": event.id, "created": True}, status=status.HTTP_201_CREATED)


class LiveWeatherFeedView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        weather = get_live_weather()
        return Response(weather, status=status.HTTP_200_OK)


class ContactQueryCreateView(generics.CreateAPIView):
    queryset = ContactQuery.objects.all()
    serializer_class = ContactQuerySerializer
    permission_classes = (permissions.AllowAny,)

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            serializer.save()

class UserContactQueryListView(generics.ListAPIView):
    serializer_class = ContactQuerySerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return ContactQuery.objects.filter(user=self.request.user).order_by('-created_at')
