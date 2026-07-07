import uuid
from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum, Count, Q
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import views, generics, status, permissions
from rest_framework.response import Response

from .models import AuditLog
from .serializers import AdminUserSerializer, AuditLogSerializer
from .utils import log_audit
from events.models import Event, Booking, ContactQuery
from events.serializers import EventSerializer, BookingSerializer, ContactQuerySerializer
from venues.models import Venue
from venues.serializers import VenueSerializer
from notifications.models import Notification

User = get_user_model()

class IsPlatformAdmin(permissions.BasePermission):
    """
    Custom permission to only allow platform administrators.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'

class AdminSummaryView(views.APIView):
    permission_classes = (IsPlatformAdmin,)

    def get(self, request):
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        
        # User Stats
        total_customers = User.objects.filter(role='customer').count()
        total_organizers = User.objects.filter(role='organizer').count()
        total_owners = User.objects.filter(role='plot_owner').count()
        
        # Booking & Revenue Stats
        total_bookings = Booking.objects.filter(status='confirmed').count()
        
        # Event bookings: status is confirmed
        completed_event_bookings = Booking.objects.filter(
            status='confirmed'
        )
        completed_events_revenue = completed_event_bookings.aggregate(total=Sum('total_price'))['total'] or 0.0
        
        # Refunded/Cancelled event bookings: status is cancelled
        refunded_event_bookings = Booking.objects.filter(
            status='cancelled'
        )
        refunded_events_revenue = refunded_event_bookings.aggregate(total=Sum('total_price'))['total'] or 0.0
        
        # Total Event Revenue generated (retained portion for active + cancelled)
        total_revenue = float(completed_events_revenue) + (float(refunded_events_revenue) * 0.5)

        # Detailed event ticket sales splits
        event_gross_sales = float(completed_events_revenue) + float(refunded_events_revenue)
        event_cancelled_count = refunded_event_bookings.count()
        admin_active_commission = float(completed_events_revenue) * 0.20
        admin_cancelled_commission = float(refunded_events_revenue) * 0.10
        admin_cut_refund_impact = float(refunded_events_revenue) * 0.10
        customer_refunds = float(refunded_events_revenue) * 0.50
        organizer_active_sales = float(completed_events_revenue) * 0.80
        organizer_cancelled_retained = float(refunded_events_revenue) * 0.40
        organizer_refund_impact = float(refunded_events_revenue) * 0.40

        # Commission calculations
        # Admin gets 20% on active bookings, 10% on refunded bookings
        admin_organizer_commission = (float(completed_events_revenue) * 0.20) + (float(refunded_events_revenue) * 0.10)

        # Venue bookings: status is approved
        from venues.models import VenueBooking
        completed_venue_bookings = VenueBooking.objects.filter(
            status='approved'
        )
        completed_venues_revenue = completed_venue_bookings.aggregate(total=Sum('total_price'))['total'] or 0.0
        admin_venue_commission = float(completed_venues_revenue) * 0.20

        admin_total_commission = admin_organizer_commission + admin_venue_commission

        # Pending Actions Counts
        pending_organizers = User.objects.filter(role='organizer', is_approved=False).count()
        pending_owners = User.objects.filter(role='plot_owner', is_approved=False).count()
        pending_events = Event.objects.filter(is_approved=False).count()
        pending_venues = Venue.objects.filter(is_approved=False).count()
        
        # Analytics - Signups in past 30 days (grouped by week/date, here we do a simple daily count)
        signups_past_30_days = []
        for i in range(30):
            day = now - timedelta(days=i)
            count = User.objects.filter(date_joined__date=day.date()).count()
            signups_past_30_days.append({
                "date": day.strftime('%Y-%m-%d'),
                "count": count
            })
        signups_past_30_days.reverse()
        
        # Analytics - Booking Sales in past 30 days
        sales_past_30_days = []
        for i in range(30):
            day = now - timedelta(days=i)
            revenue = Booking.objects.filter(created_at__date=day.date(), payment_status='paid').aggregate(total=Sum('total_price'))['total'] or 0
            sales_past_30_days.append({
                "date": day.strftime('%Y-%m-%d'),
                "revenue": float(revenue)
            })
        sales_past_30_days.reverse()

        return Response({
            "users": {
                "customers": total_customers,
                "organizers": total_organizers,
                "plot_owners": total_owners
            },
            "finance": {
                "bookings_count": total_bookings,
                "revenue": float(total_revenue),
                "admin_total_commission": admin_total_commission,
                "admin_organizer_commission": admin_organizer_commission,
                "admin_venue_commission": admin_venue_commission,
                "completed_events_revenue": float(completed_events_revenue),
                "completed_venues_revenue": float(completed_venues_revenue),
                
                # New detailed stats
                "event_gross_sales": event_gross_sales,
                "event_active_sales": float(completed_events_revenue),
                "event_cancelled_sales": float(refunded_events_revenue),
                "event_cancelled_count": event_cancelled_count,
                "admin_active_commission": admin_active_commission,
                "admin_cancelled_commission": admin_cancelled_commission,
                "admin_cut_refund_impact": admin_cut_refund_impact,
                "customer_refunds": customer_refunds,
                "organizer_active_sales": organizer_active_sales,
                "organizer_cancelled_retained": organizer_cancelled_retained,
                "organizer_refund_impact": organizer_refund_impact
            },
            "pending": {
                "organizers": pending_organizers,
                "plot_owners": pending_owners,
                "events": pending_events,
                "venues": pending_venues
            },
            "charts": {
                "signups": signups_past_30_days,
                "sales": sales_past_30_days
            }
        })

class UserManagementView(generics.ListAPIView):
    permission_classes = (IsPlatformAdmin,)
    serializer_class = AdminUserSerializer

    def get_queryset(self):
        queryset = User.objects.exclude(id=self.request.user.id).order_by('-date_joined')
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
            
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
            
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            val = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=val)
            
        is_approved = self.request.query_params.get('is_approved')
        if is_approved is not None:
            val = is_approved.lower() == 'true'
            queryset = queryset.filter(is_approved=val)
            
        return queryset

class ToggleUserActiveView(views.APIView):
    permission_classes = (IsPlatformAdmin,)

    def post(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        user.is_active = not user.is_active
        user.save()
        
        action = "USER_ACTIVATED" if user.is_active else "USER_BLOCKED"
        log_audit(
            user=request.user,
            action=action,
            resource="User",
            resource_id=user.id,
            request=request,
            details={"target_email": user.email}
        )
        
        return Response({
            "message": f"User account has been successfully {'activated' if user.is_active else 'blocked'}.",
            "is_active": user.is_active
        })

class ApproveUserView(views.APIView):
    permission_classes = (IsPlatformAdmin,)

    def post(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        if user.role not in ['organizer', 'plot_owner']:
            return Response({"error": "Only organizers or plot owners require approval."}, status=status.HTTP_400_BAD_REQUEST)
            
        user.is_approved = True
        # Ensure they are active too upon admin approval
        user.is_active = True
        user.save()
        
        log_audit(
            user=request.user,
            action="USER_APPROVED",
            resource="User",
            resource_id=user.id,
            request=request,
            details={"approved_email": user.email, "role": user.role}
        )
        
        # Notify the user
        Notification.objects.create(
            user=user,
            title="Account Approved",
            message="Your account has been approved by the platform administrator. You can now access your dashboard."
        )
        
        return Response({"message": f"User {user.email} approved successfully.", "is_approved": user.is_approved})

class EventApprovalListView(views.APIView):
    permission_classes = (IsPlatformAdmin,)

    def get(self, request):
        pending_events = Event.objects.filter(is_approved=False).order_by('-created_at')
        serializer = EventSerializer(pending_events, many=True)
        return Response(serializer.data)

class ApproveRejectEventView(views.APIView):
    permission_classes = (IsPlatformAdmin,)

    def post(self, request, pk):
        event = get_object_or_404(Event, pk=pk)
        decision = request.data.get('decision') # approve, reject
        
        if decision == 'approve':
            event.is_approved = True
            event.save()
            
            log_audit(
                user=request.user,
                action="EVENT_APPROVED",
                resource="Event",
                resource_id=event.id,
                request=request,
                details={"event_title": event.title, "organizer": event.organizer.email}
            )
            
            # Notify Organizer
            Notification.objects.create(
                user=event.organizer,
                title="Event Approved",
                message=f"Your event '{event.title}' has been approved and is now live on the platform."
            )
            return Response({"message": f"Event '{event.title}' approved successfully."})
            
        elif decision == 'reject':
            event_id = event.id
            event_title = event.title
            organizer = event.organizer
            event.delete() # Or set a status. Since we only have Boolean, deleting or reject is fine.
            
            log_audit(
                user=request.user,
                action="EVENT_REJECTED",
                resource="Event",
                resource_id=event_id,
                request=request,
                details={"event_title": event_title, "organizer": organizer.email}
            )
            
            # Notify Organizer
            Notification.objects.create(
                user=organizer,
                title="Event Rejected",
                message=f"Your event listing request for '{event_title}' was rejected by the administrator."
            )
            return Response({"message": f"Event '{event_title}' listing was rejected and deleted."})
            
        return Response({"error": "Invalid decision parameter."}, status=status.HTTP_400_BAD_REQUEST)

class VenueApprovalListView(views.APIView):
    permission_classes = (IsPlatformAdmin,)

    def get(self, request):
        pending_venues = Venue.objects.filter(is_approved=False).order_by('-created_at')
        serializer = VenueSerializer(pending_venues, many=True)
        return Response(serializer.data)

class ApproveRejectVenueView(views.APIView):
    permission_classes = (IsPlatformAdmin,)

    def post(self, request, pk):
        venue = get_object_or_404(Venue, pk=pk)
        decision = request.data.get('decision') # approve, reject
        
        if decision == 'approve':
            venue.is_approved = True
            venue.save()
            
            log_audit(
                user=request.user,
                action="VENUE_APPROVED",
                resource="Venue",
                resource_id=venue.id,
                request=request,
                details={"venue_name": venue.name, "owner": venue.owner.email}
            )
            
            # Notify Plot Owner
            Notification.objects.create(
                user=venue.owner,
                title="Venue Listing Approved",
                message=f"Your venue '{venue.name}' has been approved and is now available for organizers to book."
            )
            return Response({"message": f"Venue '{venue.name}' approved successfully."})
            
        elif decision == 'reject':
            venue_id = venue.id
            venue_name = venue.name
            owner = venue.owner
            venue.delete()
            
            log_audit(
                user=request.user,
                action="VENUE_REJECTED",
                resource="Venue",
                resource_id=venue_id,
                request=request,
                details={"venue_name": venue_name, "owner": owner.email}
            )
            
            # Notify Plot Owner
            Notification.objects.create(
                user=owner,
                title="Venue Listing Rejected",
                message=f"Your venue listing request for '{venue_name}' was rejected by the administrator."
            )
            return Response({"message": f"Venue '{venue_name}' listing was rejected and deleted."})
            
        return Response({"error": "Invalid decision parameter."}, status=status.HTTP_400_BAD_REQUEST)

class BookingTransactionsListView(generics.ListAPIView):
    permission_classes = (IsPlatformAdmin,)
    serializer_class = BookingSerializer

    def get_queryset(self):
        queryset = Booking.objects.all().order_by('-created_at')
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(user__email__icontains=search) |
                Q(event__title__icontains=search) |
                Q(payment_id__icontains=search)
            )
            
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
            
        payment_status = self.request.query_params.get('payment_status')
        if payment_status:
            queryset = queryset.filter(payment_status=payment_status)
            
        return queryset

class IssueBookingRefundView(views.APIView):
    permission_classes = (IsPlatformAdmin,)

    def post(self, request, pk):
        import os
        import razorpay
        booking = get_object_or_404(Booking, pk=pk)
        
        if booking.payment_status != 'paid':
            return Response({"error": "Only paid bookings can be refunded."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Refund policy: 50% refund to customer, 10% retained by admin, 40% retained by organizer
        refund_amount = float(booking.total_price) * 0.50
        amount_in_paise = int(refund_amount * 100)

        # Process Real Razorpay Refund if keys are configured
        key_id = os.getenv("RAZORPAY_KEY_ID", "MOCK_KEY_ID")
        key_secret = os.getenv("RAZORPAY_KEY_SECRET", "MOCK_KEY_SECRET")
        
        if booking.razorpay_payment_id and not key_id.startswith("MOCK"):
            try:
                client = razorpay.Client(auth=(key_id, key_secret))
                refund_data = {
                    "payment_id": booking.razorpay_payment_id,
                    "amount": amount_in_paise,
                    "notes": {
                        "booking_id": booking.id,
                        "reason": "50% refund policy applied for customer cancellation."
                    }
                }
                client.refund.create(data=refund_data)
            except Exception as e:
                return Response({"error": f"Razorpay refund failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Process local DB changes
        booking.payment_status = 'refunded'
        booking.status = 'cancelled'
        booking.refund_requested = False
        booking.save()

        # Deduct sold count from event
        event = booking.event
        event.tickets_sold = max(0, event.tickets_sold - booking.tickets_count)
        event.save()
        
        # Log Audit
        log_audit(
            user=request.user,
            action="REFUND_ISSUED",
            resource="Booking",
            resource_id=booking.id,
            request=request,
            details={
                "refunded_user": booking.user.email,
                "amount": refund_amount,
                "event": booking.event.title,
                "policy": "50% refund applied"
            }
        )
        
        # Notify Customer
        Notification.objects.create(
            user=booking.user,
            title="Refund Issued",
            message=f"Your ticket purchase for '{booking.event.title}' has been cancelled and a 50% refund of ₹{refund_amount:.2f} was issued."
        )
        
        return Response({
            "message": f"Refund of 50% (₹{refund_amount:.2f}) for booking #{booking.id} was issued successfully.",
            "payment_status": booking.payment_status,
            "status": booking.status
        })

class AuditLogListView(generics.ListAPIView):
    permission_classes = (IsPlatformAdmin,)
    serializer_class = AuditLogSerializer

    def get_queryset(self):
        queryset = AuditLog.objects.all().order_by('-timestamp')
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(user__email__icontains=search) |
                Q(action__icontains=search) |
                Q(resource__icontains=search)
            )
            
        action = self.request.query_params.get('action')
        if action:
            queryset = queryset.filter(action=action)
            
        return queryset

class BroadcastNotificationView(views.APIView):
    permission_classes = (IsPlatformAdmin,)

    def post(self, request):
        title = request.data.get('title')
        message = request.data.get('message')
        
        if not title or not message:
            return Response({"error": "Title and message fields are required."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Broadcast to all active users by writing to the database.
        # This triggers signals.py which pushes WebSockets to each active connection group.
        active_users = User.objects.filter(is_active=True)
        count = 0
        
        for user in active_users:
            Notification.objects.create(
                user=user,
                title=title,
                message=message
            )
            count += 1
            
        log_audit(
            user=request.user,
            action="BROADCAST_SENT",
            resource="Notification",
            request=request,
            details={"title": title, "broadcast_count": count}
        )
        
        return Response({
            "message": f"Broadcast notification sent successfully to {count} active users.",
            "recipient_count": count
        })


class AdminContactQueryListView(generics.ListAPIView):
    permission_classes = (IsPlatformAdmin,)
    serializer_class = ContactQuerySerializer

    def get_queryset(self):
        queryset = ContactQuery.objects.all().order_by('-created_at')
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(email__icontains=search) |
                Q(subject__icontains=search) |
                Q(message__icontains=search)
            )
            
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
            
        return queryset


class AdminContactQueryDetailView(generics.DestroyAPIView):
    permission_classes = (IsPlatformAdmin,)
    serializer_class = ContactQuerySerializer
    queryset = ContactQuery.objects.all()

    def perform_destroy(self, instance):
        log_audit(
            user=self.request.user,
            action="COMPLAINT_DELETED",
            resource="ContactQuery",
            resource_id=instance.id,
            request=self.request,
            details={"email": instance.email, "subject": instance.subject}
        )
        instance.delete()


class AdminContactQueryReplyView(views.APIView):
    permission_classes = (IsPlatformAdmin,)

    def post(self, request, pk):
        query = get_object_or_404(ContactQuery, pk=pk)
        reply_message = request.data.get('message')
        
        if not reply_message:
            return Response({"error": "Reply message is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        from django.core.mail import send_mail
        try:
            send_mail(
                subject=f"RE: {query.subject or 'Your Inquiry to Ahmedabad Event Hub'}",
                message=reply_message,
                from_email=None,
                recipient_list=[query.email],
                fail_silently=False,
            )
        except Exception as e:
            return Response({"error": f"Failed to send email: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        from django.utils import timezone
        query.reply = reply_message
        query.replied_at = timezone.now()
        query.save()

        # Create user notification if user is associated
        if query.user:
            from notifications.models import Notification
            Notification.objects.create(
                user=query.user,
                title="Support Inquiry Replied",
                message=f"Admin replied to your inquiry: '{reply_message}'"
            )

        log_audit(
            user=request.user,
            action="COMPLAINT_REPLIED",
            resource="ContactQuery",
            resource_id=query.id,
            request=request,
            details={"recipient": query.email, "subject": query.subject, "reply": reply_message}
        )
        
        return Response({"message": f"Reply successfully sent to {query.email}."})
