from django.urls import path
from . import views

urlpatterns = [
    path('summary/', views.AdminSummaryView.as_view(), name='admin-summary'),
    path('users/', views.UserManagementView.as_view(), name='admin-users'),
    path('users/<int:pk>/toggle-active/', views.ToggleUserActiveView.as_view(), name='admin-users-toggle-active'),
    path('users/<int:pk>/approve/', views.ApproveUserView.as_view(), name='admin-users-approve'),
    path('events/', views.EventApprovalListView.as_view(), name='admin-events'),
    path('events/<int:pk>/decision/', views.ApproveRejectEventView.as_view(), name='admin-events-decision'),
    path('venues/', views.VenueApprovalListView.as_view(), name='admin-venues'),
    path('venues/<int:pk>/decision/', views.ApproveRejectVenueView.as_view(), name='admin-venues-decision'),
    path('bookings/', views.BookingTransactionsListView.as_view(), name='admin-bookings'),
    path('bookings/<int:pk>/refund/', views.IssueBookingRefundView.as_view(), name='admin-bookings-refund'),
    path('audit-logs/', views.AuditLogListView.as_view(), name='admin-audit-logs'),
    path('broadcast/', views.BroadcastNotificationView.as_view(), name='admin-broadcast'),
    path('complaints/', views.AdminContactQueryListView.as_view(), name='admin-complaints'),
    path('complaints/<int:pk>/', views.AdminContactQueryDetailView.as_view(), name='admin-complaints-detail'),
    path('complaints/<int:pk>/reply/', views.AdminContactQueryReplyView.as_view(), name='admin-complaints-reply'),
]
