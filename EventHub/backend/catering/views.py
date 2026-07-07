from django.db.models import Avg, Sum, Count, Q
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import CateringService, CateringPackage, CateringBooking, CateringReview
from .serializers import (
    CateringServiceSerializer,
    CateringPackageSerializer,
    CateringBookingSerializer,
    CateringReviewSerializer
)

class IsPlotOwner(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'plot_owner'

class IsPlotOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, obj, view):
        if request.user.is_staff or request.user.role == 'admin':
            return True
        return obj.owner == request.user

class CateringServiceViewSet(viewsets.ModelViewSet):
    queryset = CateringService.objects.all().order_by('-created_at')
    serializer_class = CateringServiceSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            queryset = CateringService.objects.filter(is_approved=True)
        elif user.role == 'admin' or user.is_staff:
            queryset = CateringService.objects.all()
        elif user.role == 'plot_owner':
            queryset = CateringService.objects.filter(owner=user) | CateringService.objects.filter(is_approved=True)
        else:
            queryset = CateringService.objects.filter(is_approved=True)

        queryset = queryset.order_by('-created_at')

        # Manual filters
        cuisine_type = self.request.query_params.get('cuisine_type')
        if cuisine_type:
            queryset = queryset.filter(cuisine_type__icontains=cuisine_type)

        venue = self.request.query_params.get('venue')
        if venue:
            queryset = queryset.filter(venue_id=venue)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(cuisine_type__icontains=search)
            )

        min_guests = self.request.query_params.get('min_guests')
        if min_guests:
            queryset = queryset.filter(min_guests__lte=int(min_guests))

        max_guests = self.request.query_params.get('max_guests')
        if max_guests:
            queryset = queryset.filter(max_guests__gte=int(max_guests))

        price_max = self.request.query_params.get('price_max')
        if price_max:
            queryset = queryset.filter(price_per_plate__lte=float(price_max))

        ordering = self.request.query_params.get('ordering')
        if ordering:
            if ordering == 'price_asc':
                queryset = queryset.order_by('price_per_plate')
            elif ordering == 'price_desc':
                queryset = queryset.order_by('-price_per_plate')

        return queryset

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def get_permissions(self):
        if self.action in ['create']:
            permission_classes = [permissions.IsAuthenticated, IsPlotOwner]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, IsPlotOwnerOrAdmin]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def submit_review(self, request, pk=None):
        service = self.get_object()
        rating = request.data.get('rating')
        comment = request.data.get('comment', '')

        if not rating or int(rating) < 1 or int(rating) > 5:
            return Response(
                {"error": "Please provide a rating between 1 and 5."},
                status=status.HTTP_400_BAD_REQUEST
            )

        review = CateringReview.objects.create(
            catering_service=service,
            user=request.user,
            rating=rating,
            comment=comment
        )
        serializer = CateringReviewSerializer(review)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def approve(self, request, pk=None):
        if request.user.role != 'admin' and not request.user.is_staff:
            return Response(
                {"error": "Only admins can approve/reject catering services."},
                status=status.HTTP_403_FORBIDDEN
            )
        service = self.get_object()
        approve = request.data.get('approve', True)
        service.is_approved = approve
        service.save()
        return Response(
            {"status": f"Catering service approved: {service.is_approved}"},
            status=status.HTTP_200_OK
        )

class CateringPackageViewSet(viewsets.ModelViewSet):
    queryset = CateringPackage.objects.all()
    serializer_class = CateringPackageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        service_id = self.request.data.get('catering_service')
        service = CateringService.objects.get(id=service_id)
        if service.owner != self.request.user:
            raise permissions.exceptions.PermissionDenied("You are not the owner of this service.")
        serializer.save()

class CateringBookingViewSet(viewsets.ModelViewSet):
    queryset = CateringBooking.objects.all()
    serializer_class = CateringBookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin' or user.is_staff:
            return CateringBooking.objects.all()
        if user.role == 'plot_owner':
            return CateringBooking.objects.filter(catering_service__owner=user)
        return CateringBooking.objects.filter(organizer=user)

    def perform_create(self, serializer):
        package_id = self.request.data.get('catering_package')
        guests_count = int(self.request.data.get('guests_count', 0))
        package = CateringPackage.objects.get(id=package_id)
        
        total_price = package.price_per_plate * guests_count
        serializer.save(
            organizer=self.request.user,
            total_price=total_price,
            status='pending'
        )

    @action(detail=True, methods=['post'])
    def respond(self, request, pk=None):
        booking = self.get_object()
        user = request.user
        if booking.catering_service.owner != user:
            return Response(
                {"error": "You do not own the catering service for this booking."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        action_val = request.data.get('action')
        if action_val == 'approve':
            booking.status = 'approved'
        elif action_val == 'reject':
            booking.status = 'rejected'
        else:
            return Response(
                {"error": "Invalid action. Use 'approve' or 'reject'."},
                status=status.HTTP_400_BAD_REQUEST
            )
        booking.save()
        return Response(
            {"status": f"Booking {booking.status}"},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def pay(self, request, pk=None):
        booking = self.get_object()
        payment_id = request.data.get('payment_id', 'MOCK-PAY-CAT-1002')
        booking.payment_status = 'paid'
        booking.payment_id = payment_id
        booking.status = 'approved'
        booking.save()
        return Response(
            {"status": "Payment received successfully. Booking confirmed."},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        booking = self.get_object()
        if booking.organizer != request.user and booking.catering_service.owner != request.user:
            return Response(
                {"error": "Permission denied."},
                status=status.HTTP_403_FORBIDDEN
            )
        booking.status = 'cancelled'
        booking.save()
        return Response({"status": "Booking cancelled"}, status=status.HTTP_200_OK)

class CateringDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsPlotOwner]

    def get(self, request):
        user = request.user
        services = CateringService.objects.filter(owner=user)
        bookings = CateringBooking.objects.filter(catering_service__owner=user)

        total_revenue = bookings.filter(payment_status='paid').aggregate(Sum('total_price'))['total_price__sum'] or 0
        total_bookings = bookings.count()
        pending_bookings = bookings.filter(status='pending').count()
        average_rating = CateringReview.objects.filter(catering_service__owner=user).aggregate(Avg('rating'))['rating__avg'] or 0

        recent_reviews = CateringReview.objects.filter(catering_service__owner=user).order_by('-created_at')[:5]
        reviews_data = [{
            'id': r.id,
            'rating': r.rating,
            'comment': r.comment,
            'user': r.user.email,
            'service': r.catering_service.name,
            'created_at': r.created_at
        } for r in recent_reviews]

        return Response({
            'total_revenue': float(total_revenue),
            'total_bookings': total_bookings,
            'pending_bookings': pending_bookings,
            'average_rating': round(average_rating, 1),
            'recent_reviews': reviews_data
        })
