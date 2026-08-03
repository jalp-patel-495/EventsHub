import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api, { BACKEND_URL } from '../api/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Heart, Bell, Trash2, ShieldAlert, CheckCircle, Ticket, XCircle, Download, Sparkles, MapPin, Building, Star, X, Coins, Search, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import VenuePaymentModal from '../components/VenuePaymentModal';
import VenueDetailModal from '../components/VenueDetailModal';
import EventDetailModal from '../components/EventDetailModal';
import VenueBookingChatModal from '../components/VenueBookingChatModal';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [bookings, setBookings] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, bookings, wishlist, notifications
  const [message, setMessage] = useState('');
  const [recommendations, setRecommendations] = useState(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Detail Modal States
  const [selectedDetailEvent, setSelectedDetailEvent] = useState(null);
  const [chatModalBooking, setChatModalBooking] = useState(null);
  const [chatModalType, setChatModalType] = useState('venue');

  // Review & Rating Modal States
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewType, setReviewType] = useState('event'); // 'event' or 'venue'
  const [reviewTarget, setReviewTarget] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const handleOpenReviewModal = (type, target) => {
    setReviewType(type);
    setReviewTarget(target);
    setRating(5);
    setComment('');
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      setErrorPopupMessage("Please select a rating between 1 and 5.");
      return;
    }
    setSubmittingReview(true);
    try {
      if (reviewType === 'event') {
        await api.post(`events/${reviewTarget.id}/review/`, { rating, comment });
      } else {
        await api.post(`venues/${reviewTarget.id}/review/`, { rating, comment });
      }
      setMessage(`${reviewType === 'event' ? 'Event' : 'Venue'} review submitted successfully.`);
      setShowReviewModal(false);
      // Refresh dashboard data
      fetchDashboardData();
      if (reviewType === 'venue' || activeTab === 'venues') {
        fetchVenuesData();
      }
    } catch (err) {
      setErrorPopupMessage(err.response?.data?.error || "Failed to submit review. You can only rate booked and approved items once.");
    } finally {
      setSubmittingReview(false);
    }
  };


  // Direct Venue Booking States
  const [venues, setVenues] = useState([]);
  const [venueBookings, setVenueBookings] = useState([]);
  const [venueSearch, setVenueSearch] = useState('');
  const [venueCategoryFilter, setVenueCategoryFilter] = useState('');
  const [selectedDetailVenue, setSelectedDetailVenue] = useState(null);
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [rentModal, setRentModal] = useState({ show: false, venue: null });
  const [bookingDates, setBookingDates] = useState({ start: '', end: '' });
  const [bookingActionLoading, setBookingActionLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentVenue, setPaymentVenue] = useState(null);
  const [paymentDates, setPaymentDates] = useState({ start: '', end: '' });

  // Ticket Cancellation States
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedCancelBooking, setSelectedCancelBooking] = useState(null);
  const [cancelType, setCancelType] = useState('event'); // 'event' or 'venue'
  const [successPopupMessage, setSuccessPopupMessage] = useState('');
  const [ticketsToCancel, setTicketsToCancel] = useState(1);
  const [cancelStep, setCancelStep] = useState('confirm'); // 'confirm' or 'card'
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [errorPopupMessage, setErrorPopupMessage] = useState('');

  const fetchVenuesData = async () => {
    setLoadingVenues(true);
    try {
      const [listingsRes, bookingsRes] = await Promise.all([
        api.get('venues/listings/'),
        api.get('venues/bookings/')
      ]);
      setVenues(listingsRes.data);
      setVenueBookings(bookingsRes.data);
    } catch (err) {
      console.error("Failed to load venues data:", err);
    } finally {
      setLoadingVenues(false);
    }
  };

  const fetchRecommendations = async () => {
    if (recommendations) return; // Only fetch once
    setLoadingRecommendations(true);
    try {
      const res = await api.get('ai/recommendations/');
      setRecommendations(res.data);
    } catch (err) {
      console.error("Failed to load AI recommendations:", err);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleCancelVenueBooking = (booking) => {
    setSelectedCancelBooking(booking);
    setCancelType('venue');
    setCancelModalOpen(true);
    setCancelStep('confirm');
    setTicketsToCancel(1);
  };

  useEffect(() => {
    if (activeTab === 'recommendations') {
      fetchRecommendations();
    } else if (activeTab === 'venues') {
      fetchVenuesData();
    }
  }, [activeTab]);

  const handleDownloadTicket = async (booking) => {
    if (!booking) return;

    const eventTitle = booking.event_details?.title || booking.event_name || booking.title || "Event Pass";
    const eventDate = booking.event_details?.date || booking.date || "N/A";
    const eventTime = booking.event_details?.time || booking.time || "";
    const eventLocation = booking.event_details?.location || booking.location || "Ahmedabad, Gujarat";
    const attendeeFirstName = booking.user_details?.first_name || user?.first_name || "Valued";
    const attendeeLastName = booking.user_details?.last_name || user?.last_name || "Guest";
    const attendeeEmail = booking.user_details?.email || user?.email || "";
    const ticketsCount = booking.tickets_count || 1;
    const ticketCategory = booking.ticket_category || "General";
    const totalPrice = parseFloat(booking.total_price || 0) + (parseFloat(booking.event_details?.price || 0) > 0 ? ticketsCount * 15 : 0);

    const ticketDiv = document.createElement('div');
    ticketDiv.style.position = 'absolute';
    ticketDiv.style.left = '-9999px';
    ticketDiv.style.width = '450px';
    ticketDiv.style.padding = '40px';
    ticketDiv.style.background = '#0A0E1A';
    ticketDiv.style.color = '#F3F4F6';
    ticketDiv.style.fontFamily = 'sans-serif';
    ticketDiv.style.border = '2px solid rgba(16, 185, 129, 0.2)';
    ticketDiv.style.borderRadius = '24px';
    
    ticketDiv.innerHTML = `
      <div style="text-align: center; margin-bottom: 25px;">
        <h2 style="margin: 0; font-size: 20px; font-weight: 800; color: #10B981; letter-spacing: 1px;">AHMEDABAD EVENT HUB</h2>
        <p style="margin: 5px 0 0 0; font-size: 10px; text-transform: uppercase; color: #9CA3AF; letter-spacing: 2px;">Official Entry Pass</p>
      </div>
      <div style="border-top: 1px dashed rgba(255,255,255,0.1); border-bottom: 1px dashed rgba(255,255,255,0.1); padding: 20px 0; margin-bottom: 25px;">
        <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #FFFFFF;">${eventTitle}</h3>
        <p style="margin: 5px 0; font-size: 12px; color: #D1D5DB;"><strong>Date:</strong> ${eventDate} ${eventTime ? 'at ' + eventTime : ''}</p>
        <p style="margin: 5px 0; font-size: 12px; color: #D1D5DB;"><strong>Location:</strong> ${eventLocation}</p>
      </div>
      <div style="margin-bottom: 25px;">
        <p style="margin: 5px 0; font-size: 12px; color: #9CA3AF;"><strong>Attendee:</strong> ${attendeeFirstName} ${attendeeLastName}</p>
        <p style="margin: 5px 0; font-size: 12px; color: #9CA3AF;"><strong>Email:</strong> ${attendeeEmail}</p>
        <p style="margin: 5px 0; font-size: 12px; color: #9CA3AF;"><strong>Quantity:</strong> ${ticketsCount} Ticket(s) (${ticketCategory} Pass)</p>
        <p style="margin: 5px 0; font-size: 12px; color: #9CA3AF;"><strong>Amount Paid:</strong> ₹${totalPrice.toFixed(2)}</p>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin-top: 10px;">
        <div id="ticket-qr-container" style="background: white; padding: 10px; border-radius: 12px; margin-bottom: 10px; display: inline-block;"></div>
        <p style="margin: 0; font-size: 12px; font-weight: bold; color: #10B981;">${booking.qr_code_hash || "FREE_PASS"}</p>
        <p style="margin: 5px 0 0 0; font-size: 8px; color: #9CA3AF; text-align: center;">Scan QR Code at the event entrance for verification.</p>
      </div>
    `;

    document.body.appendChild(ticketDiv);
    
    const qrContainer = ticketDiv.querySelector('#ticket-qr-container');
    const qrImg = document.createElement('img');
    const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(booking.qr_code_hash || "EH-FREE-PASS")}`;
    qrImg.src = qrDataUrl;
    qrImg.style.width = '120px';
    qrImg.style.height = '120px';
    qrImg.crossOrigin = 'anonymous';

    qrContainer.appendChild(qrImg);

    await new Promise((resolve) => {
      qrImg.onload = resolve;
      setTimeout(resolve, 1200);
    });

    try {
      const { default: html2canvas } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(ticketDiv, {
        backgroundColor: '#0A0E1A',
        scale: 2,
        useCORS: true
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [450, 480]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, 450, 480);
      pdf.save(`Ticket-${booking.qr_code_hash || "FREE"}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to download PDF ticket. Please try again.");
    } finally {
      if (document.body.contains(ticketDiv)) {
        document.body.removeChild(ticketDiv);
      }
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['dashboard', 'bookings', 'wishlist', 'notifications', 'venues', 'recommendations'].includes(tabParam)) {
      setActiveTab(tabParam);
    } else if (!tabParam) {
      setActiveTab('dashboard');
    }
  }, [location.search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const bookVenueId = params.get('book');
    if (bookVenueId && venues.length > 0) {
      const venueToBook = venues.find(v => String(v.id) === String(bookVenueId));
      if (venueToBook) {
        setRentModal({ show: true, venue: venueToBook });
        // Clear parameters to avoid reopening on reload
        window.history.replaceState({}, document.title, '/bookings?tab=venues');
      }
    }
  }, [location.search, venues]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, wishlistRes, notificationsRes, venueBookingsRes] = await Promise.all([
        api.get('events/bookings/'),
        api.get('events/wishlist/'),
        api.get('notifications/'),
        api.get('venues/bookings/').catch(() => ({ data: [] }))
      ]);
      setBookings(bookingsRes.data);
      setWishlist(wishlistRes.data);
      setNotifications(notificationsRes.data);
      setVenueBookings(venueBookingsRes.data || []);
    } catch (err) {
      console.error("Error fetching customer dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    // Falls back to full cancel if triggered programmatically
    try {
      await api.post(`events/bookings/${bookingId}/cancel/`);
      setMessage("Booking cancelled successfully.");
      fetchDashboardData();
    } catch (err) {
      setErrorPopupMessage(err.response?.data?.error || "Failed to cancel booking.");
    }
  };

  const handleConfirmCancel = async () => {
    if (!selectedCancelBooking) return;

    if (selectedCancelBooking.payment_status === 'paid' && cancelStep === 'confirm') {
      setCancelStep('card');
      return;
    }

    if (selectedCancelBooking.payment_status === 'paid' && cancelStep === 'card') {
      if (!cardNumber || !cardholderName || !expiryDate || !cvv) {
        setErrorPopupMessage("Please fill in all card details.");
        return;
      }
      if (cardholderName.trim().length < 3) {
        setErrorPopupMessage("Cardholder Name must be at least 3 characters.");
        return;
      }
      if (!/^[a-zA-Z\s]+$/.test(cardholderName.trim())) {
        setErrorPopupMessage("Cardholder name must contain only letters and spaces.");
        return;
      }
      const cleanedCardNumber = cardNumber.replace(/\s/g, '');
      if (cleanedCardNumber.length !== 16) {
        setErrorPopupMessage("Card number must be exactly 16 digits.");
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
        setErrorPopupMessage("Expiry Date must be in MM/YY format.");
        return;
      }
      const [expMonth, expYear] = expiryDate.split('/').map(Number);
      if (expMonth < 1 || expMonth > 12) {
        setErrorPopupMessage("Expiry Month must be between 01 and 12.");
        return;
      }
      const currentYear = Number(new Date().getFullYear().toString().slice(-2));
      const currentMonth = new Date().getMonth() + 1; // 1-12
      if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
        setErrorPopupMessage("Expiry Date cannot be in the past.");
        return;
      }
      if (cvv.length !== 3) {
        setErrorPopupMessage("CVV must be exactly 3 digits.");
        return;
      }
    }

    setBookingActionLoading(true);
    try {
      if (cancelType === 'venue') {
        await api.post(`venues/bookings/${selectedCancelBooking.id}/cancel/`, {
          card_number: cardNumber,
          cardholder_name: cardholderName,
          expiry_date: expiryDate,
          cvv: cvv
        });
        
        if (selectedCancelBooking.payment_status === 'paid') {
          setSuccessPopupMessage("your amount will be refund in provided card detais in 5-7 details");
        } else {
          setSuccessPopupMessage("Cancellation request sent successfully.");
        }
      } else {
        await api.post(`events/bookings/${selectedCancelBooking.id}/cancel/`, {
          cancel_count: ticketsToCancel,
          card_number: cardNumber,
          cardholder_name: cardholderName,
          expiry_date: expiryDate,
          cvv: cvv
        });
        
        const pricePerTicket = parseFloat(selectedCancelBooking.total_price) / selectedCancelBooking.tickets_count;
        const cancelledAmount = pricePerTicket * ticketsToCancel;
        const refundAmt = cancelledAmount * 0.5;
        
        if (selectedCancelBooking.payment_status === 'paid') {
          setSuccessPopupMessage("your amount will be refund in provided card detais in 5-7 details");
        } else {
          setSuccessPopupMessage(`Successfully cancelled ${ticketsToCancel} ticket(s).`);
        }
      }
      
      setCancelModalOpen(false);
      setSelectedCancelBooking(null);
      setCancelStep('confirm');
      setCardNumber('');
      setCardholderName('');
      setExpiryDate('');
      setCvv('');
      fetchDashboardData();
    } catch (err) {
      setErrorPopupMessage(err.response?.data?.error || "Failed to process cancellation.");
    } finally {
      setBookingActionLoading(false);
    }
  };
  const handleBookVenueSubmit = async (e) => {
    e.preventDefault();
    setBookingError('');
    
    if (!bookingDates.start || !bookingDates.end) {
      setBookingError("Please select both start and end dates.");
      return;
    }

    if (new Date(bookingDates.start) > new Date(bookingDates.end)) {
      setBookingError("Start date cannot be after end date.");
      return;
    }

    setBookingActionLoading(true);
    try {
      const selectedVenueId = rentModal.venue.id;
      const reqStart = bookingDates.start;
      const reqEnd = bookingDates.end;

      // Real-time backend query for all active/pending bookings of this venue plot
      const checkRes = await api.get(`venues/bookings/?venue=${selectedVenueId}`);
      const activeBookings = checkRes.data || [];

      const isOverlap = activeBookings.some(vb => {
        const status = (vb.status || '').toLowerCase();
        if (status !== 'approved' && status !== 'pending') return false;
        return (vb.start_date <= reqEnd && vb.end_date >= reqStart);
      });

      if (isOverlap) {
        setBookingError("This venue is already booked on this date. Please select another date.");
        setBookingActionLoading(false);
        return;
      }

      setPaymentVenue(rentModal.venue);
      setPaymentDates({ start: bookingDates.start, end: bookingDates.end });
      setRentModal({ show: false, venue: null });
      setBookingDates({ start: '', end: '' });
      setShowPaymentModal(true);
    } catch (err) {
      console.error("Error checking date availability:", err);
      setBookingError(err.response?.data?.error || "This venue is already booked on this date. Please select another date.");
    } finally {
      setBookingActionLoading(false);
    }
  };

  const handleRemoveWishlist = async (eventId) => {
    try {
      await api.post(`events/${eventId}/wishlist/`);
      // Update local state directly
      setWishlist(wishlist.filter(item => item.event !== eventId));
    } catch (err) {
      console.error("Failed to remove from wishlist:", err);
    }
  };

  const handleMarkNotificationRead = async (id) => {
    try {
      await api.post(`notifications/${id}/read/`);
      // Update local state
      if (id === 'all') {
        setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      } else {
        setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
      }
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  };

  const handleReplyToNotification = async (notif) => {
    const match = notif.message?.match(/booking #(\d+)/i);
    const bookingId = match ? parseInt(match[1]) : null;

    if (bookingId) {
      let foundBooking = venueBookings.find(b => b.id === bookingId);
      if (!foundBooking) {
        try {
          const res = await api.get(`venues/bookings/`);
          const list = res.data?.results || res.data || [];
          foundBooking = list.find(b => b.id === bookingId);
        } catch (err) {
          console.error("Failed to fetch booking for notification reply:", err);
        }
      }

      if (foundBooking) {
        setChatModalBooking(foundBooking);
        return;
      }
    }

    setActiveTab('venues');
  };

  const unreadNotificationsCount = notifications.filter(n => !n.is_read).length;
  const ticketRefunds = bookings.filter(b => b.payment_status === 'refunded').reduce((sum, b) => sum + (parseFloat(b.total_price) * 0.5), 0);
  const venueRefunds = venueBookings.filter(vb => vb.payment_status === 'refunded').reduce((sum, vb) => sum + parseFloat(vb.total_price || 0), 0);
  const totalRefundedAmount = ticketRefunds + venueRefunds;
  const totalVenuesBooked = venueBookings.filter(vb => vb.status === 'approved').length;

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-dark-bg">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-dark-muted font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-12 py-10">
      {(activeTab === 'dashboard' || activeTab === 'recommendations') && (
        <>
          {/* Dashboard Welcome */}
          <div className="mb-10">
            <h1 className="text-3xl font-black tracking-tight text-dark-text">Attendee Dashboard</h1>
            <p className="text-dark-muted mt-1">Manage your event registrations, wishlists, and notifications</p>
          </div>

          {/* Grid Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
            {/* Bookings Stat */}
            <div className="glass-panel rounded-2xl p-6 flex items-center space-x-4">
              <div className="p-3 bg-blue-500/15 text-blue-400 rounded-xl">
                <Ticket className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-dark-muted uppercase tracking-wider">Tickets Booked</p>
                <h3 className="text-2xl font-bold mt-1">{bookings.filter(b => b.status === 'confirmed').length}</h3>
              </div>
            </div>

            {/* Venues Booked Stat */}
            <div className="glass-panel rounded-2xl p-6 flex items-center space-x-4">
              <div className="p-3 bg-teal-500/15 text-teal-400 rounded-xl">
                <Building className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-dark-muted uppercase tracking-wider">Venues Booked</p>
                <h3 className="text-2xl font-bold mt-1">{totalVenuesBooked}</h3>
              </div>
            </div>

            {/* Refunds Approved Stat */}
            <div className="glass-panel rounded-2xl p-6 flex items-center space-x-4">
              <div className="p-3 bg-emerald-500/15 text-emerald-400 rounded-xl">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-dark-muted uppercase tracking-wider">Refunds Approved</p>
                <h3 className="text-xl font-bold mt-1">₹{totalRefundedAmount.toFixed(2)}</h3>
              </div>
            </div>

            {/* Wishlist Stat */}
            <div className="glass-panel rounded-2xl p-6 flex items-center space-x-4">
              <div className="p-3 bg-rose-500/15 text-rose-400 rounded-xl">
                <Heart className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-dark-muted uppercase tracking-wider">Wishlisted Events</p>
                <h3 className="text-2xl font-bold mt-1">{wishlist.length}</h3>
              </div>
            </div>

            {/* Notifications Stat */}
            <div className="glass-panel rounded-2xl p-6 flex items-center space-x-4">
              <div className="p-3 bg-amber-500/15 text-amber-400 rounded-xl">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-dark-muted uppercase tracking-wider">Unread Alerts</p>
                <h3 className="text-2xl font-bold mt-1">{unreadNotificationsCount}</h3>
              </div>
            </div>
          </div>
        </>
      )}

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm flex items-center justify-between"
        >
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-xs font-bold uppercase tracking-wider">Dismiss</button>
        </motion.div>
      )}

      {/* Tab Selectors - Only show when on Dashboard/Overview or recommendations tab */}
      {(activeTab === 'dashboard' || activeTab === 'recommendations') && (
        <div className="flex border-b border-white/5 space-x-6 mb-8 overflow-x-auto scrollbar-none whitespace-nowrap pb-1">
          {['dashboard', 'recommendations'].map((tab) => {
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-sm font-semibold capitalize relative transition-colors ${
                  activeTab === tab ? 'text-brand-primary' : 'text-dark-muted hover:text-dark-text'
                }`}
              >
                <span>{tab === 'recommendations' ? 'AI Suggestions' : 'Overview'}</span>
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Tabs Content */}
      <div>
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {/* Welcome Banner */}
              <div className="glass-panel rounded-2xl p-8 flex flex-col justify-between space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-dark-text">Welcome back, {user?.first_name || 'Attendee'}! 👋</h3>
                  <p className="text-sm text-dark-muted mt-2 leading-relaxed">
                    Manage your event registrations, explore curated local recommendations, check your wishlist, and track your rentals directly from your personal portal.
                  </p>
                </div>
                <div className="flex gap-4">
                  <Link to="/explore" className="bg-brand-primary text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-600 transition-all">
                    Explore New Events
                  </Link>
                </div>
              </div>
              
              {/* Quick Stats Summary / Info */}
              <div className="glass-panel rounded-2xl p-8 flex flex-col space-y-6 justify-between">
                <div>
                  <h3 className="text-xl font-bold text-dark-text font-sans">Quick Summary</h3>
                  <div className="mt-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-muted">Total Tickets Booked:</span>
                      <span className="font-semibold text-dark-text">{bookings.filter(b => b.status === 'confirmed').length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-muted">Items in Wishlist:</span>
                      <span className="font-semibold text-dark-text">{wishlist.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-muted">Active Venue Bookings:</span>
                      <span className="font-semibold text-dark-text">{venueBookings.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'bookings' && (
            <motion.div
              key="bookings"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="space-y-8"
            >
              {/* 🎟️ 1. EVENT TICKET BOOKINGS */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 pb-2 border-b border-white/5">
                  <Ticket className="w-5 h-5 text-brand-primary" />
                  <h3 className="text-lg font-bold text-dark-text uppercase tracking-wider">My Event Tickets ({bookings.length})</h3>
                </div>

                {bookings.length === 0 ? (
                  <div className="glass-panel text-center py-10 rounded-2xl">
                    <Ticket className="w-10 h-10 text-dark-muted mx-auto mb-3" />
                    <p className="text-xs text-dark-muted">No tickets booked yet. Explore events on the home page!</p>
                  </div>
                ) : (
                  bookings.map((booking) => (
                    <div key={booking.id} className="glass-card rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                      <div 
                        onClick={() => setSelectedDetailEvent(booking.event_details)}
                        className="flex items-center space-x-4 cursor-pointer group flex-grow"
                      >
                        {booking.event_details.image ? (
                          <img
                            src={booking.event_details.image.startsWith('http') ? booking.event_details.image : `${BACKEND_URL}${booking.event_details.image}`}
                            alt={booking.event_details.title}
                            className="w-16 h-16 rounded-xl object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center text-dark-muted group-hover:scale-105 transition-transform">
                            <Calendar className="w-6 h-6" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-lg text-dark-text group-hover:text-brand-primary transition-colors flex items-center gap-2">
                            <span>{booking.event_details.title}</span>
                            <span className="text-[10px] text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded uppercase">View Details ↗</span>
                          </h4>
                          <p className="text-xs text-dark-muted mt-1">{booking.event_details.date} at {booking.event_details.time}</p>
                          <p className="text-xs text-dark-muted">{booking.event_details.location}</p>
                          <div className="flex items-center space-x-1.5 mt-1 text-[11px] text-amber-400 font-semibold">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            <span>{booking.event_details.rating_avg || '0.0'} ({booking.event_details.rating_count || 0} reviews)</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-8 w-full md:w-auto justify-between border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                        <div>
                          <span className="text-xs font-semibold text-dark-muted uppercase">Tickets</span>
                          <p className="font-bold text-dark-text mt-0.5">
                            {booking.tickets_count} <span className="text-[10px] text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 uppercase ml-1.5">{booking.ticket_category}</span>
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-dark-muted uppercase">Paid</span>
                          {booking.payment_status === 'refunded' ? (
                            <p className="font-bold text-red-400 mt-0.5 line-through">
                              ₹{(parseFloat(booking.total_price) + (parseFloat(booking.event_details?.price) > 0 ? booking.tickets_count * 15 : 0)).toFixed(2)}
                            </p>
                          ) : (
                            <p className="font-bold text-brand-primary mt-0.5">
                              ₹{(parseFloat(booking.total_price) + (parseFloat(booking.event_details?.price) > 0 ? booking.tickets_count * 15 : 0)).toFixed(2)}
                            </p>
                          )}
                        </div>
                        {booking.payment_status === 'refunded' ? (
                          <div>
                            <span className="text-xs font-semibold text-dark-muted uppercase">Refunded</span>
                            <p className="font-bold text-emerald-400 mt-0.5">₹{(parseFloat(booking.total_price) * 0.5).toFixed(2)}</p>
                          </div>
                        ) : booking.refund_requested ? (
                          <div>
                            <span className="text-xs font-semibold text-dark-muted uppercase">Refund Pending</span>
                            <p className="font-bold text-yellow-400 mt-0.5 font-sans">₹{(parseFloat(booking.total_price) * 0.5).toFixed(2)}</p>
                          </div>
                        ) : null}
                        <div>
                          <span className="text-xs font-semibold text-dark-muted uppercase">Status</span>
                          <span className={`block text-xs font-bold px-2 py-0.5 rounded mt-0.5 uppercase ${
                            booking.is_checked_in ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                            booking.payment_status === 'refunded' ? 'bg-red-500/10 text-red-400' :
                            booking.refund_requested ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/10' :
                            booking.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400' : 
                            'bg-red-500/10 text-red-400'
                          }`}>
                            {booking.is_checked_in ? 'Checked In' :
                             booking.payment_status === 'refunded' ? 'Refunded' :
                             booking.refund_requested ? 'Refund Pending' :
                             booking.status}
                          </span>
                        </div>
                        {booking.status === 'confirmed' && (
                          <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setChatModalType('event');
                                setChatModalBooking(booking);
                              }}
                              className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                              title="Direct Message Event Organizer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Message Organizer</span>
                            </button>

                            {booking.event_details?.venue_details?.owner && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setChatModalType('venue');
                                  setChatModalBooking({
                                    id: booking.id,
                                    venue_details: booking.event_details.venue_details,
                                    organizer_details: user
                                  });
                                }}
                                className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                title="Direct Message Venue Owner"
                              >
                                <Building className="w-3.5 h-3.5" />
                                <span>Message Venue Owner</span>
                              </button>
                            )}

                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(booking.event_details.location)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl transition-all flex items-center justify-center"
                              title="View Directions on Google Maps"
                            >
                              <MapPin className="w-4 h-4" />
                            </a>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleOpenReviewModal('event', booking.event_details); }}
                              className={`p-2 rounded-xl transition-all ${
                                booking.event_details.reviews?.some(r => r.user === user?.id)
                                  ? 'text-dark-muted bg-white/5 cursor-not-allowed border border-white/5'
                                  : 'text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20'
                              }`}
                              title={booking.event_details.reviews?.some(r => r.user === user?.id) ? "You already reviewed this event" : "Rate & Review Event"}
                              disabled={booking.event_details.reviews?.some(r => r.user === user?.id)}
                            >
                              <Star className={`w-4 h-4 ${booking.event_details.reviews?.some(r => r.user === user?.id) ? '' : 'fill-amber-400'}`} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDownloadTicket(booking); }}
                              className="p-2 text-brand-primary hover:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl transition-all"
                              title="Download PDF Ticket"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            {!booking.is_checked_in && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCancelBooking(booking);
                                  setTicketsToCancel(1);
                                  setCancelModalOpen(true);
                                }}
                                className="p-2 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all"
                                title="Cancel Ticket(s)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 🏛️ 2. VENUE RENTAL BOOKINGS */}
              <div className="space-y-4 pt-6 border-t border-white/10">
                <div className="flex items-center space-x-2 pb-2 border-b border-white/5">
                  <Building className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-bold text-dark-text uppercase tracking-wider">My Venue Rentals ({venueBookings.length})</h3>
                </div>

                {venueBookings.length === 0 ? (
                  <div className="glass-panel text-center py-10 rounded-2xl">
                    <Building className="w-10 h-10 text-dark-muted mx-auto mb-3 opacity-50" />
                    <p className="text-xs text-dark-muted">You haven't requested any venue rentals yet. Browse venue plots on the Venues page!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {venueBookings.map((vb) => (
                      <div key={vb.id} className="glass-card rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-white/5 bg-dark-bg/25">
                        <div 
                          onClick={() => setSelectedDetailVenue(vb.venue_details)}
                          className="flex items-center space-x-4 cursor-pointer group flex-grow"
                        >
                          {vb.venue_details?.image ? (
                            <img
                              src={vb.venue_details.image.startsWith('http') ? vb.venue_details.image : `${BACKEND_URL}${vb.venue_details.image}`}
                              alt={vb.venue_details.name}
                              className="w-16 h-16 rounded-xl object-cover border border-white/10 group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center text-dark-muted group-hover:scale-105 transition-transform">
                              <Building className="w-6 h-6" />
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-lg text-dark-text group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                              <span>{vb.venue_details?.name}</span>
                              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded uppercase">View Details ↗</span>
                            </h4>
                            <p className="text-xs text-emerald-400 font-semibold mt-0.5">{vb.start_date} to {vb.end_date}</p>
                            <p className="text-xs text-dark-muted">{vb.venue_details?.location}</p>

                            {/* Service Badges */}
                            {(vb.use_catering || vb.use_dj || vb.use_decor) && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {vb.use_catering && (
                                  <span className="text-[9px] font-bold bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded flex items-center gap-1">
                                    🍽 Catering ({vb.catering_cuisine}) ×{vb.catering_plates}
                                  </span>
                                )}
                                {vb.use_dj && (
                                  <span className="text-[9px] font-bold bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded flex items-center gap-1">
                                    🎵 DJ ({vb.dj_package})
                                  </span>
                                )}
                                {vb.use_decor && (
                                  <span className="text-[9px] font-bold bg-pink-500/10 text-pink-400 px-2 py-0.5 rounded flex items-center gap-1">
                                    🎨 Decor ({vb.decor_theme})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-6 w-full md:w-auto justify-between border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                          <div>
                            <span className="text-xs font-semibold text-dark-muted uppercase">Total Price</span>
                            <p className={`font-extrabold mt-0.5 font-mono ${vb.payment_status === 'refunded' ? 'text-red-400 line-through' : 'text-emerald-400'}`}>
                              ₹{parseFloat(vb.total_price || 0).toLocaleString('en-IN')}
                            </p>
                          </div>

                          {vb.payment_status === 'refunded' && (
                            <div>
                              <span className="text-xs font-semibold text-emerald-400 uppercase">100% Refunded</span>
                              <p className="font-extrabold text-emerald-400 mt-0.5 font-mono">
                                ₹{parseFloat(vb.total_price || 0).toLocaleString('en-IN')}
                              </p>
                            </div>
                          )}

                          <div>
                            <span className="text-xs font-semibold text-dark-muted uppercase">Status</span>
                            <span className={`block text-xs font-bold px-2 py-0.5 rounded mt-0.5 uppercase ${
                              vb.payment_status === 'refunded' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              vb.status === 'approved' ? (vb.cancel_requested ? 'bg-yellow-500/10 text-yellow-400' : 'bg-emerald-500/10 text-emerald-400') :
                              vb.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                              'bg-red-500/10 text-red-400'
                            }`}>
                              {vb.payment_status === 'refunded' ? 'Rejected (100% Refunded)' :
                               vb.cancel_requested && vb.status === 'approved' ? 'Cancel Requested' : vb.status}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                            {vb.status === 'pending' && vb.payment_status !== 'paid' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPaymentVenue(vb.venue_details);
                                  setPaymentDates({ start: vb.start_date, end: vb.end_date });
                                  setShowPaymentModal(true);
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-xs shadow-md uppercase tracking-wider"
                              >
                                Pay Now
                              </button>
                            )}

                            {vb.venue_details && (
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(vb.venue_details?.location || vb.venue_details?.name)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl transition-all"
                                title="View Location Directions"
                              >
                                <MapPin className="w-4 h-4" />
                              </a>
                            )}

                            {(vb.status === 'approved' || vb.status === 'pending') && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setChatModalType('venue');
                                  setChatModalBooking(vb);
                                }}
                                className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                title="Direct Message Venue Owner"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Message Owner</span>
                              </button>
                            )}

                            {vb.status === 'approved' && !vb.cancel_requested && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleOpenReviewModal('venue', vb.venue_details); }}
                                className="p-2 text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl transition-all border border-amber-500/20"
                                title="Rate & Review Venue Plot"
                              >
                                <Star className="w-4 h-4 fill-amber-400" />
                              </button>
                            )}

                            {!vb.cancel_requested && vb.status !== 'rejected' && vb.status !== 'cancelled' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCancelBooking(vb);
                                  setCancelType('venue');
                                  setCancelModalOpen(true);
                                }}
                                className="p-2 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all"
                                title="Cancel Venue Rental"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
          {activeTab === 'wishlist' && (
            <motion.div
              key="wishlist"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {wishlist.length === 0 ? (
                <div className="col-span-full glass-panel text-center py-16 rounded-2xl">
                  <Heart className="w-12 h-12 text-dark-muted mx-auto mb-4" />
                  <p className="text-dark-muted">Your wishlist is empty. Add events you are interested in!</p>
                </div>
              ) : (
                wishlist.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => setSelectedDetailEvent(item.event_details)}
                    className="glass-card rounded-2xl overflow-hidden flex flex-col cursor-pointer group hover:border-brand-primary/40 transition-all"
                  >
                    {item.event_details.image && (
                      <img
                        src={item.event_details.image.startsWith('http') ? item.event_details.image : `${BACKEND_URL}${item.event_details.image}`}
                        alt={item.event_details.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                      />
                    )}
                    <div className="p-6 flex flex-col flex-grow">
                      <h4 className="font-bold text-lg text-dark-text group-hover:text-brand-primary transition-colors flex items-center justify-between">
                        <span>{item.event_details.title}</span>
                        <span className="text-[10px] text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded uppercase">Details ↗</span>
                      </h4>
                      <p className="text-xs text-dark-muted mt-1">{item.event_details.date} | {item.event_details.location}</p>
                      <p className="text-sm font-bold text-brand-primary mt-3">₹{item.event_details.price}</p>
                      
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemoveWishlist(item.event); }}
                          className="flex items-center space-x-1.5 text-xs text-red-400 hover:text-red-300 font-semibold"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="space-y-3"
            >
              {notifications.length > 0 && unreadNotificationsCount > 0 && (
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => handleMarkNotificationRead('all')}
                    className="text-xs font-bold text-brand-primary hover:text-emerald-400 transition-colors uppercase tracking-wider"
                  >
                    Mark all as read
                  </button>
                </div>
              )}

              {notifications.length === 0 ? (
                <div className="glass-panel text-center py-16 rounded-2xl">
                  <Bell className="w-12 h-12 text-dark-muted mx-auto mb-4" />
                  <p className="text-dark-muted">No notifications received.</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const isMessageNotif = (notif.title && notif.title.toLowerCase().includes('message')) || (notif.message && notif.message.toLowerCase().includes('sent a message'));

                  return (
                    <div
                      key={notif.id}
                      className={`glass-card rounded-2xl p-5 border-l-4 transition-all space-y-3 ${
                        notif.is_read ? 'border-white/5 opacity-80' : 'border-emerald-500 bg-emerald-500/5'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex space-x-3">
                          <div className={`p-2 rounded-lg ${isMessageNotif ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : notif.is_read ? 'bg-white/5 text-dark-muted' : 'bg-emerald-500/10 text-emerald-400'}`}>
                            {isMessageNotif ? <MessageSquare className="w-4 h-4" /> : notif.is_read ? <CheckCircle className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                          </div>
                          <div>
                            <h5 className="font-bold text-sm text-dark-text">{notif.title}</h5>
                            <p className="text-xs text-dark-muted mt-1 leading-relaxed">{notif.message}</p>
                            <span className="block text-[10px] text-dark-muted mt-2">{new Date(notif.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                        {!notif.is_read && (
                          <button
                            onClick={() => handleMarkNotificationRead(notif.id)}
                            className="text-[10px] font-bold text-brand-primary hover:text-emerald-400 uppercase tracking-wider"
                          >
                            Mark read
                          </button>
                        )}
                      </div>

                      {isMessageNotif && (
                        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Direct Chat Notification</span>
                          </span>
                          <button
                            onClick={() => handleReplyToNotification(notif)}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-blue-950/40 cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Reply / Send Answer</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </motion.div>
          )}

          {activeTab === 'venues' && (
            <motion.div
              key="venues"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="space-y-8"
            >
              {message && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-xs font-semibold flex justify-between items-center">
                  <span>{message}</span>
                  <button onClick={() => setMessage('')} className="text-dark-muted hover:text-dark-text uppercase text-[10px] font-bold">Dismiss</button>
                </div>
              )}

              {/* Hero Header & Search Bar matching Image 1 */}
              <div className="w-full mb-6 relative text-left">
                <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-dark-text mb-1">
                  Discover <span className="text-brand-primary">Upcoming Venue Plots</span>
                </h1>
                <p className="text-xs sm:text-sm text-dark-muted">
                  Explore banquet halls, party lawns, open grounds, and luxury resorts for your events across Ahmedabad.
                </p>
              </div>

              {/* Full-width Search Bar */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
                <div className="md:col-span-2 relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dark-muted">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={venueSearch || ''}
                    onChange={(e) => setVenueSearch(e.target.value)}
                    placeholder="Search venues by title, description, location..."
                    className="glass-input w-full pl-9 pr-3 py-2.5 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <select
                    value={venueCategoryFilter || ''}
                    onChange={(e) => setVenueCategoryFilter(e.target.value)}
                    className="glass-input w-full px-3 py-2.5 rounded-xl text-xs cursor-pointer bg-dark-bg text-dark-text border border-white/10"
                  >
                    <option value="">All Categories</option>
                    <option value="party_lawn">Party Plot / Lawn</option>
                    <option value="banquet">Banquet Hall</option>
                    <option value="resort">Resort & Farmhouse</option>
                    <option value="open_ground">Open Ground / Stadium</option>
                    <option value="villa">Luxury Villa / Poolside</option>
                    <option value="conference">Conference & Convention Hall</option>
                    <option value="auditorium">Auditorium & Theatre</option>
                    <option value="beach">Beachside Lawn & Club</option>
                    <option value="heritage">Heritage Haveli & Palace</option>
                    <option value="community">Community & Marriage Hall</option>
                    <option value="exhibition">Exhibition & Trade Center</option>
                  </select>
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    className="flex-grow bg-brand-primary hover:bg-emerald-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-md flex items-center justify-center space-x-1"
                  >
                    <span>Search Venues</span>
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Building className="w-5 h-5 text-brand-primary" />
                  <h3 className="text-lg font-bold text-dark-text uppercase tracking-wider">BROWSE & BOOK VENUE PLOTS</h3>
                </div>

                {loadingVenues ? (
                  <div className="py-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div></div>
                ) : venues.filter((venue) => {
                    const matchesSearch = !venueSearch || 
                      venue.name?.toLowerCase().includes(venueSearch.toLowerCase()) ||
                      venue.description?.toLowerCase().includes(venueSearch.toLowerCase()) ||
                      venue.location?.toLowerCase().includes(venueSearch.toLowerCase()) ||
                      venue.category?.toLowerCase().includes(venueSearch.toLowerCase());

                    const cat = (venue.category || '').toLowerCase();
                    const filter = (venueCategoryFilter || '').toLowerCase();

                    let matchesCategory = true;
                    if (filter) {
                      if (filter === 'party_lawn') {
                        matchesCategory = cat.includes('party') || cat.includes('lawn') || cat.includes('plot');
                      } else if (filter === 'banquet') {
                        matchesCategory = cat.includes('banquet') || cat.includes('hall');
                      } else if (filter === 'resort') {
                        matchesCategory = cat.includes('resort') || cat.includes('farm');
                      } else if (filter === 'open_ground') {
                        matchesCategory = cat.includes('open') || cat.includes('ground') || cat.includes('stadium');
                      } else if (filter === 'villa') {
                        matchesCategory = cat.includes('villa') || cat.includes('pool');
                      } else if (filter === 'conference') {
                        matchesCategory = cat.includes('conference') || cat.includes('convention');
                      } else if (filter === 'rooftop') {
                        matchesCategory = cat.includes('rooftop') || cat.includes('terrace');
                      } else if (filter === 'auditorium') {
                        matchesCategory = cat.includes('auditorium') || cat.includes('theatre');
                      } else if (filter === 'beach') {
                        matchesCategory = cat.includes('beach');
                      } else if (filter === 'heritage') {
                        matchesCategory = cat.includes('heritage') || cat.includes('haveli') || cat.includes('palace');
                      } else if (filter === 'community') {
                        matchesCategory = cat.includes('community') || cat.includes('marriage');
                      } else if (filter === 'exhibition') {
                        matchesCategory = cat.includes('exhibition') || cat.includes('trade');
                      } else {
                        matchesCategory = cat.includes(filter);
                      }
                    }

                    return matchesSearch && matchesCategory;
                  }).length === 0 ? (
                  <div className="glass-panel text-center py-12 rounded-2xl text-dark-muted">No venues found matching your criteria.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {venues.filter((venue) => {
                      const matchesSearch = !venueSearch || 
                        venue.name?.toLowerCase().includes(venueSearch.toLowerCase()) ||
                        venue.description?.toLowerCase().includes(venueSearch.toLowerCase()) ||
                        venue.location?.toLowerCase().includes(venueSearch.toLowerCase()) ||
                        venue.category?.toLowerCase().includes(venueSearch.toLowerCase());

                      const cat = (venue.category || '').toLowerCase();
                      const filter = (venueCategoryFilter || '').toLowerCase();

                      let matchesCategory = true;
                      if (filter) {
                        if (filter === 'party_lawn') {
                          matchesCategory = cat.includes('party') || cat.includes('lawn') || cat.includes('plot');
                        } else if (filter === 'banquet') {
                          matchesCategory = cat.includes('banquet') || cat.includes('hall');
                        } else if (filter === 'resort') {
                          matchesCategory = cat.includes('resort') || cat.includes('farm');
                        } else if (filter === 'open_ground') {
                          matchesCategory = cat.includes('open') || cat.includes('ground') || cat.includes('stadium');
                        } else if (filter === 'villa') {
                          matchesCategory = cat.includes('villa') || cat.includes('pool');
                        } else if (filter === 'conference') {
                          matchesCategory = cat.includes('conference') || cat.includes('convention');
                        } else if (filter === 'rooftop') {
                          matchesCategory = cat.includes('rooftop') || cat.includes('terrace');
                        } else if (filter === 'auditorium') {
                          matchesCategory = cat.includes('auditorium') || cat.includes('theatre');
                        } else if (filter === 'beach') {
                          matchesCategory = cat.includes('beach');
                        } else if (filter === 'heritage') {
                          matchesCategory = cat.includes('heritage') || cat.includes('haveli') || cat.includes('palace');
                        } else if (filter === 'community') {
                          matchesCategory = cat.includes('community') || cat.includes('marriage');
                        } else if (filter === 'exhibition') {
                          matchesCategory = cat.includes('exhibition') || cat.includes('trade');
                        } else {
                          matchesCategory = cat.includes(filter);
                        }
                      }

                      return matchesSearch && matchesCategory;
                    }).map((venue) => (
                      <div 
                        key={venue.id} 
                        onClick={() => setSelectedDetailVenue(venue)}
                        className="glass-card rounded-2xl overflow-hidden flex flex-col h-full border border-white/5 hover:border-brand-primary/20 transition-all bg-dark-bg/20 cursor-pointer group"
                      >
                        {/* Image */}
                        {venue.image ? (
                          <img
                            src={venue.image.startsWith('http') ? venue.image : `${BACKEND_URL}${venue.image}`}
                            alt={venue.name}
                            className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-40 bg-white/5 flex items-center justify-center text-dark-muted border-b border-white/5">
                            <Building className="w-10 h-10" />
                          </div>
                        )}
                        
                        {/* Body */}
                        <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <h4 className="font-bold text-dark-text text-base leading-snug group-hover:text-brand-primary transition-colors">{venue.name}</h4>
                                <div className="flex items-center space-x-1 mt-1 text-[11px] text-amber-400 font-semibold">
                                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                                  <span>{venue.rating_avg || '0.0'} ({venue.rating_count || 0} reviews)</span>
                                </div>
                              </div>
                              <span className="text-xs font-black text-brand-primary bg-brand-primary/10 px-2 py-1 rounded-lg flex-shrink-0">
                                ₹{parseFloat(venue.price_per_day).toLocaleString('en-IN')}/day
                              </span>
                            </div>
                            <p className="text-xs text-dark-muted mt-2 line-clamp-2 leading-relaxed">{venue.description}</p>
                            
                            <div className="flex items-center space-x-1.5 text-[10px] text-dark-muted mt-3">
                              <MapPin className="w-3.5 h-3.5 text-brand-primary" />
                              <span className="truncate">{venue.location}</span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRentModal({ show: true, venue });
                            }}
                            className="w-full bg-brand-primary hover:bg-[#0ea5e9] text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-md mt-4"
                          >
                            Book Venue Plot
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'recommendations' && (
            <motion.div
              key="recommendations"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="space-y-8"
            >
              {loadingRecommendations ? (
                <div className="text-center py-20 bg-white/[0.01] border border-white/5 rounded-2xl">
                  <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-dark-muted text-sm font-semibold">AI is compiling personalized suggestions...</p>
                </div>
              ) : !recommendations ? (
                <div className="glass-panel text-center py-16 rounded-2xl">
                  <Sparkles className="w-12 h-12 text-dark-muted mx-auto mb-4" />
                  <p className="text-dark-muted">No recommendations available.</p>
                </div>
              ) : (
                <>
                  {/* Reasoning Banner */}
                  <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/15 rounded-2xl p-6 flex items-start space-x-4 shadow-lg shadow-emerald-950/5">
                    <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl flex-shrink-0 animate-pulse border border-emerald-400/20">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-emerald-400 uppercase tracking-wider">AI Insights & Preferences</h4>
                      <p className="text-sm text-dark-text mt-2 leading-relaxed">{recommendations.reasoning}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Suggested Events */}
                    <div>
                      <h3 className="text-lg font-bold text-dark-text mb-4 flex items-center space-x-2 uppercase tracking-wide text-xs">
                        <Ticket className="w-4 h-4 text-emerald-400" />
                        <span>Suggested Events</span>
                      </h3>
                      <div className="space-y-4">
                        {recommendations.events.length === 0 ? (
                          <div className="p-6 text-center text-xs text-dark-muted bg-white/[0.01] border border-white/5 rounded-2xl">No matching events currently recommended.</div>
                        ) : (
                          recommendations.events.map((event) => (
                            <div key={event.id} className="glass-card rounded-2xl p-5 flex items-center justify-between gap-4">
                              <div className="min-w-0">
                                <h4 className="font-bold text-sm text-dark-text truncate">{event.title}</h4>
                                <p className="text-[11px] text-dark-muted mt-1 truncate">{event.date} | {event.location}</p>
                                <p className="text-xs font-bold text-brand-primary mt-2">₹{event.price}</p>
                              </div>
                              <Link
                                to="/explore"
                                className="bg-white/5 hover:bg-emerald-500 hover:text-white px-4 py-2 rounded-xl border border-white/10 text-xs font-bold transition-all whitespace-nowrap shadow-md"
                              >
                                Book
                              </Link>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Suggested Venues */}
                    <div>
                      <h3 className="text-lg font-bold text-dark-text mb-4 flex items-center space-x-2 uppercase tracking-wide text-xs">
                        <Building className="w-4 h-4 text-emerald-400" />
                        <span>Suggested Plots & Venues</span>
                      </h3>
                      <div className="space-y-4">
                        {recommendations.venues.length === 0 ? (
                          <div className="p-6 text-center text-xs text-dark-muted bg-white/[0.01] border border-white/5 rounded-2xl">No plots currently suggested.</div>
                        ) : (
                          recommendations.venues.map((venue) => (
                            <div key={venue.id} className="glass-card rounded-2xl p-5 space-y-3">
                              <div className="flex justify-between items-start">
                                <div className="min-w-0">
                                  <h4 className="font-bold text-sm text-dark-text truncate">{venue.name}</h4>
                                  <div className="flex items-center space-x-1 text-[10px] text-dark-muted mt-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-brand-primary flex-shrink-0" />
                                    <span className="truncate">{venue.location}</span>
                                  </div>
                                </div>
                                <span className="text-xs font-extrabold text-brand-primary bg-white/5 border border-white/5 px-2.5 py-1.5 rounded-lg flex-shrink-0">
                                  ₹{venue.price_per_day}/day
                                </span>
                              </div>
                              {venue.facilities && (
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {venue.facilities.slice(0, 3).map((f, i) => (
                                    <span key={i} className="text-[9px] bg-white/5 border border-white/5 px-2 py-0.5 rounded text-dark-muted">
                                      {f}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Rent Venue Modal Popup */}
      {rentModal.show && rentModal.venue && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl relative border border-white/10 space-y-6"
          >
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="text-base font-bold text-dark-text uppercase tracking-wider">Book Venue Plot</h3>
              <button
                onClick={() => { setRentModal({ show: false, venue: null }); setBookingError(''); }}
                className="text-dark-muted hover:text-dark-text"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-dark-muted uppercase tracking-wider">Selected Venue:</span>
              <div className="bg-white/5 border border-white/5 p-4 rounded-xl flex items-center space-x-3">
                <Building className="w-6 h-6 text-brand-primary" />
                <div>
                  <h4 className="font-bold text-sm text-dark-text">{rentModal.venue.name}</h4>
                  <p className="text-[10px] text-dark-muted mt-0.5">{rentModal.venue.location}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleBookVenueSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-dark-muted uppercase tracking-wider mb-1.5">Start Date</label>
                  <input
                    type="date"
                    required
                    value={bookingDates.start}
                    onChange={(e) => setBookingDates({ ...bookingDates, start: e.target.value })}
                    className="glass-input w-full px-3 py-2 rounded-xl text-xs bg-dark-bg text-dark-text"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-dark-muted uppercase tracking-wider mb-1.5">End Date</label>
                  <input
                    type="date"
                    required
                    value={bookingDates.end}
                    onChange={(e) => setBookingDates({ ...bookingDates, end: e.target.value })}
                    className="glass-input w-full px-3 py-2 rounded-xl text-xs bg-dark-bg text-dark-text"
                  />
                </div>
              </div>

              {bookingDates.start && bookingDates.end && new Date(bookingDates.start) <= new Date(bookingDates.end) && (
                <div className="bg-white/5 p-3 rounded-xl flex justify-between items-center text-xs">
                  <span className="text-dark-muted">Estimated Total Cost:</span>
                  <span className="font-bold text-brand-primary">
                    ₹{((Math.max(1, (new Date(bookingDates.end) - new Date(bookingDates.start)) / (1000 * 60 * 60 * 24) + 1)) * rentModal.venue.price_per_day).toLocaleString('en-IN')}
                    <span className="text-[9px] text-dark-muted font-normal ml-1">
                      ({Math.max(1, (new Date(bookingDates.end) - new Date(bookingDates.start)) / (1000 * 60 * 60 * 24) + 1)} days)
                    </span>
                  </span>
                </div>
              )}

              {bookingError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-semibold">
                  {bookingError}
                </div>
              )}

              <div className="flex space-x-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => { setRentModal({ show: false, venue: null }); setBookingError(''); }}
                  className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-dark-text py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingActionLoading}
                  className="flex-1 bg-brand-primary hover:bg-[#0ea5e9] text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center space-x-1.5"
                >
                  {bookingActionLoading ? 'Booking...' : 'Book Venue'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {showPaymentModal && paymentVenue && (
        <VenuePaymentModal
          venue={paymentVenue}
          startDate={paymentDates.start}
          endDate={paymentDates.end}
          onClose={() => { setShowPaymentModal(false); setPaymentVenue(null); }}
          onPaymentSuccess={() => {
            setShowPaymentModal(false);
            setPaymentVenue(null);
            setMessage("Venue booked and paid successfully! Pending Owner approval.");
            fetchVenuesData();
          }}
        />
      )}


      {/* Cancellation Modal Popup */}
      <AnimatePresence>
        {cancelModalOpen && selectedCancelBooking && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl relative border border-white/10 space-y-6 text-left my-8"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h3 className="text-base font-bold text-dark-text uppercase tracking-wider">
                  {cancelType === 'venue' ? 'Cancel Rental' : 'Cancel Tickets'}
                </h3>
                <button
                  onClick={() => {
                    setCancelModalOpen(false);
                    setSelectedCancelBooking(null);
                    setCancelStep('confirm');
                    setCardNumber('');
                    setCardholderName('');
                    setExpiryDate('');
                    setCvv('');
                  }}
                  className="text-dark-muted hover:text-red-400"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {cancelStep === 'confirm' ? (
                <>
                  <div className="space-y-3">
                    {cancelType === 'venue' ? (
                      <>
                        <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                          <h4 className="font-bold text-sm text-dark-text">{selectedCancelBooking.venue_details?.name}</h4>
                          <p className="text-[10px] text-dark-muted mt-1">Rental Ground: {selectedCancelBooking.venue_details?.location}</p>
                          <p className="text-[10px] text-dark-muted mt-0.5">Dates: {selectedCancelBooking.start_date} to {selectedCancelBooking.end_date}</p>
                          <p className="text-xs font-semibold text-brand-primary mt-2">Paid amount: ₹{parseFloat(selectedCancelBooking.total_price).toLocaleString('en-IN')}</p>
                        </div>
                        
                        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-xl text-[10px] leading-relaxed">
                          <strong>Refund Policy:</strong> Cancellation requests receive a <strong>90% refund</strong> of the booking's value upon owner approval. The remaining 10% is non-refundable.
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                          <h4 className="font-bold text-sm text-dark-text">{selectedCancelBooking.event_details?.title}</h4>
                          <p className="text-[10px] text-dark-muted mt-1">Booked: {selectedCancelBooking.tickets_count} ticket(s) ({selectedCancelBooking.ticket_category})</p>
                          <p className="text-xs font-semibold text-brand-primary mt-2">
                             Paid amount: ₹{(parseFloat(selectedCancelBooking.total_price) + (parseFloat(selectedCancelBooking.event_details?.price) > 0 ? selectedCancelBooking.tickets_count * 15 : 0)).toFixed(2)}
                           </p>
                        </div>
                        
                        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-xl text-[10px] leading-relaxed">
                          <strong>Refund Policy:</strong> Cancellation requests receive a <strong>50% refund</strong> of the cancelled tickets' value. The remaining 50% is non-refundable.
                        </div>
                      </>
                    )}
                  </div>

                  {cancelType === 'venue' ? (
                    <div className="space-y-4">
                      <p className="text-xs text-dark-muted leading-relaxed">
                        Cancelling will request a 100% full refund of ₹{(parseFloat(selectedCancelBooking.total_price)).toFixed(2)}, subject to plot owner approval.
                      </p>
                    </div>
                  ) : selectedCancelBooking.tickets_count > 1 ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">Number of Tickets to Cancel</label>
                        <select
                          value={ticketsToCancel}
                          onChange={(e) => setTicketsToCancel(parseInt(e.target.value))}
                          className="glass-input w-full px-4 py-2.5 rounded-xl text-sm bg-dark-bg cursor-pointer"
                        >
                          {Array.from({ length: selectedCancelBooking.tickets_count }, (_, i) => i + 1).map((val) => (
                            <option key={val} value={val}>{val} ticket(s)</option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Deduction estimate */}
                      <div className="bg-white/5 p-3.5 rounded-xl space-y-2 text-xs text-dark-muted border border-white/5">
                        <div className="flex justify-between">
                          <span>Refunding tickets:</span>
                          <span className="text-dark-text font-semibold">{ticketsToCancel}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Value of cancelled tickets:</span>
                          <span className="text-dark-text font-semibold">
                            ₹{((parseFloat(selectedCancelBooking.total_price) / selectedCancelBooking.tickets_count) * ticketsToCancel).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-emerald-400 font-semibold border-t border-white/5 pt-2 mt-1">
                          <span>Estimated 50% Refund:</span>
                          <span>
                            ₹{(((parseFloat(selectedCancelBooking.total_price) / selectedCancelBooking.tickets_count) * ticketsToCancel) * 0.5).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-xs text-dark-muted leading-relaxed">
                        You have 1 ticket booked. Cancelling will request a full refund of 50% (₹{(parseFloat(selectedCancelBooking.total_price) * 0.5).toFixed(2)}).
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCancelModalOpen(false);
                        setSelectedCancelBooking(null);
                        setCancelStep('confirm');
                        setCardNumber('');
                        setCardholderName('');
                        setExpiryDate('');
                        setCvv('');
                      }}
                      className="flex-1 bg-white/5 border border-white/10 text-dark-text py-2.5 rounded-xl text-xs font-semibold transition-colors hover:bg-white/10"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleConfirmCancel}
                      disabled={bookingActionLoading}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-md disabled:opacity-50"
                    >
                      {bookingActionLoading ? 'Processing...' : 'Confirm Cancellation'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  {cancelType === 'venue' ? (
                    <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-3 rounded-xl text-[10px] leading-relaxed">
                      <strong>Refund Account:</strong> Please enter your card details below. A 100% full refund of ₹{(
                        parseFloat(selectedCancelBooking.total_price)
                      ).toFixed(2)} will be credited to this card within 5-7 days after owner approval.
                    </div>
                  ) : (
                    <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-3 rounded-xl text-[10px] leading-relaxed">
                      <strong>Refund Account:</strong> Please enter your card details below. A 50% refund of ₹{(
                        (parseFloat(selectedCancelBooking.total_price) / selectedCancelBooking.tickets_count) * ticketsToCancel * 0.5
                      ).toFixed(2)} will be credited to this card within 5-7 days.
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-dark-muted uppercase tracking-wider mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        value={cardholderName}
                        onChange={(e) => setCardholderName(e.target.value)}
                        placeholder="Enter Cardholder Name"
                        className="glass-input w-full px-4 py-2 rounded-xl text-sm bg-dark-bg border border-white/10"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-dark-muted uppercase tracking-wider mb-1">Card Number (16 Digits)</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim();
                          setCardNumber(val.slice(0, 19));
                        }}
                        maxLength="19"
                        placeholder="Enter Card Number"
                        className="glass-input w-full px-4 py-2 rounded-xl text-sm bg-dark-bg border border-white/10"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-dark-muted uppercase tracking-wider mb-1">Expiry Date</label>
                        <input
                          type="text"
                          value={expiryDate}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, '');
                            if (val.length > 2) {
                              val = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
                            }
                            setExpiryDate(val.slice(0, 5));
                          }}
                          placeholder="MM/YY"
                          className="glass-input w-full px-4 py-2 rounded-xl text-sm bg-dark-bg border border-white/10"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-dark-muted uppercase tracking-wider mb-1">CVV</label>
                        <input
                          type="text"
                          value={cvv}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                            setCvv(val);
                          }}
                          placeholder="Enter CVV"
                          maxLength="3"
                          className="glass-input w-full px-4 py-2 rounded-xl text-sm bg-dark-bg border border-white/10"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setCancelStep('confirm')}
                      className="flex-1 bg-white/5 border border-white/10 text-dark-text py-2.5 rounded-xl text-xs font-semibold transition-colors hover:bg-white/10"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleConfirmCancel}
                      disabled={bookingActionLoading}
                      className="flex-1 bg-brand-primary hover:bg-[#0ea5e9] text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-md disabled:opacity-50"
                    >
                      {bookingActionLoading ? 'Processing...' : 'Submit Refund Details'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Review & Rating Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-md rounded-3xl p-6 border border-white/10 space-y-6 shadow-2xl bg-dark-bg/95"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-dark-text">
                  Rate & Review {reviewType === 'event' ? 'Event' : 'Venue'}
                </h3>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="text-dark-muted hover:text-dark-text p-1.5 rounded-lg hover:bg-white/5 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-center py-2 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-xs font-semibold text-dark-muted uppercase tracking-wider">Reviewing</span>
                <p className="font-bold text-brand-primary mt-1">{reviewTarget?.title || reviewTarget?.name}</p>
              </div>

              <form onSubmit={handleReviewSubmit} className="space-y-6">
                {/* Star Rating Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider text-center">
                    Your Rating
                  </label>
                  <div className="flex justify-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="transition-transform active:scale-90 p-1"
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            star <= rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-dark-muted hover:text-amber-400'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment Box */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider">
                    Comments / Feedback
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us about your experience..."
                    required
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-dark-text focus:outline-none focus:border-brand-primary placeholder-dark-muted transition-colors resize-none"
                  />
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-dark-text py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all border border-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="flex-1 bg-brand-primary hover:bg-[#0ea5e9] text-white py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-md"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Message Popup */}
      <AnimatePresence>
        {successPopupMessage && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-panel w-full max-w-sm rounded-2xl p-6 shadow-2xl relative border border-white/10 text-center space-y-5 bg-dark-bg/95"
            >
              <div className="flex flex-col items-center space-y-3">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center border border-emerald-500/20">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-dark-text uppercase tracking-wider">Request Processed</h3>
                <p className="text-xs text-dark-muted leading-relaxed px-2">
                  {successPopupMessage}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSuccessPopupMessage('')}
                className="w-full bg-brand-primary hover:bg-[#0ea5e9] text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-md"
              >
                OK
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Error Message Popup */}
      <AnimatePresence>
        {errorPopupMessage && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-panel w-full max-w-sm rounded-2xl p-6 shadow-2xl relative border border-white/10 text-center space-y-5 bg-dark-bg/95"
            >
              <div className="flex flex-col items-center space-y-3">
                <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center border border-red-500/20">
                  <XCircle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-dark-text uppercase tracking-wider">Validation Error</h3>
                <p className="text-xs text-dark-muted leading-relaxed px-2">
                  {errorPopupMessage}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setErrorPopupMessage('')}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-md"
              >
                OK
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Event Detail Modal */}
      {selectedDetailEvent && (
        <EventDetailModal
          event={selectedDetailEvent}
          onClose={() => setSelectedDetailEvent(null)}
          showHostBox={true}
        />
      )}

      {/* Venue Detail Modal */}
      {selectedDetailVenue && (
        <VenueDetailModal
          venue={selectedDetailVenue}
          onClose={() => setSelectedDetailVenue(null)}
          onBookNow={(venue) => {
            setSelectedDetailVenue(null);
            setRentModal({ show: true, venue });
          }}
        />
      )}

      <VenueBookingChatModal
        booking={chatModalBooking}
        type={chatModalType}
        isOpen={!!chatModalBooking}
        onClose={() => setChatModalBooking(null)}
        currentUser={user}
      />
    </div>
  );
};

export default CustomerDashboard;
