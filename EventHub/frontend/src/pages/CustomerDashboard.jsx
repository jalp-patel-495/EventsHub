import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../api/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Heart, Bell, Trash2, ShieldAlert, CheckCircle, Ticket, XCircle, Download, Sparkles, MapPin, Building, Star, X, Coins } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import VenuePaymentModal from '../components/VenuePaymentModal';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [bookings, setBookings] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, bookings, wishlist, notifications
  const [message, setMessage] = useState('');
  const [recommendations, setRecommendations] = useState(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

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
      alert("Please select a rating between 1 and 5.");
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
      alert(err.response?.data?.error || "Failed to submit review. You can only rate booked and approved items once.");
    } finally {
      setSubmittingReview(false);
    }
  };


  // Direct Venue Booking States
  const [venues, setVenues] = useState([]);
  const [venueBookings, setVenueBookings] = useState([]);
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
        <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #FFFFFF;">${booking.event_details.title}</h3>
        <p style="margin: 5px 0; font-size: 12px; color: #D1D5DB;"><strong>Date:</strong> ${booking.event_details.date} at ${booking.event_details.time}</p>
        <p style="margin: 5px 0; font-size: 12px; color: #D1D5DB;"><strong>Location:</strong> ${booking.event_details.location}</p>
      </div>
      <div style="margin-bottom: 25px;">
        <p style="margin: 5px 0; font-size: 12px; color: #9CA3AF;"><strong>Attendee:</strong> ${booking.user_details.first_name} ${booking.user_details.last_name}</p>
        <p style="margin: 5px 0; font-size: 12px; color: #9CA3AF;"><strong>Email:</strong> ${booking.user_details.email}</p>
        <p style="margin: 5px 0; font-size: 12px; color: #9CA3AF;"><strong>Quantity:</strong> ${booking.tickets_count} Ticket(s) (${booking.ticket_category} Pass)</p>
        <p style="margin: 5px 0; font-size: 12px; color: #9CA3AF;"><strong>Amount Paid:</strong> ₹${booking.total_price}</p>
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
      setTimeout(resolve, 1500);
    });

    try {
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
    } finally {
      document.body.removeChild(ticketDiv);
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

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, wishlistRes, notificationsRes] = await Promise.all([
        api.get('events/bookings/'),
        api.get('events/wishlist/'),
        api.get('notifications/')
      ]);
      setBookings(bookingsRes.data);
      setWishlist(wishlistRes.data);
      setNotifications(notificationsRes.data);
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
      alert(err.response?.data?.error || "Failed to cancel booking.");
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
        alert("Please fill in all card details.");
        return;
      }
      if (cardholderName.trim().length < 3) {
        alert("Cardholder Name must be at least 3 characters.");
        return;
      }
      if (!/^[a-zA-Z\s]+$/.test(cardholderName.trim())) {
        alert("Cardholder name must contain only letters and spaces.");
        return;
      }
      const cleanedCardNumber = cardNumber.replace(/\s/g, '');
      if (cleanedCardNumber.length !== 16) {
        alert("Card number must be exactly 16 digits.");
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
        alert("Expiry Date must be in MM/YY format.");
        return;
      }
      const [expMonth, expYear] = expiryDate.split('/').map(Number);
      if (expMonth < 1 || expMonth > 12) {
        alert("Expiry Month must be between 01 and 12.");
        return;
      }
      const currentYear = Number(new Date().getFullYear().toString().slice(-2));
      const currentMonth = new Date().getMonth() + 1; // 1-12
      if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
        alert("Expiry Date cannot be in the past.");
        return;
      }
      if (cvv.length !== 3) {
        alert("CVV must be exactly 3 digits.");
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
      alert(err.response?.data?.error || "Failed to process cancellation.");
    } finally {
      setBookingActionLoading(false);
    }
  };
  const handleBookVenueSubmit = (e) => {
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

    setPaymentVenue(rentModal.venue);
    setPaymentDates({ start: bookingDates.start, end: bookingDates.end });
    setRentModal({ show: false, venue: null });
    setBookingDates({ start: '', end: '' });
    setShowPaymentModal(true);
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

  const unreadNotificationsCount = notifications.filter(n => !n.is_read).length;
  const ticketRefunds = bookings.filter(b => b.payment_status === 'refunded').reduce((sum, b) => sum + (parseFloat(b.total_price) * 0.5), 0);
  const venueRefunds = venueBookings.filter(vb => vb.payment_status === 'refunded').reduce((sum, vb) => sum + (parseFloat(vb.total_price) * 0.9), 0);
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
              className="space-y-4"
            >
              {bookings.length === 0 ? (
                <div className="glass-panel text-center py-16 rounded-2xl">
                  <Ticket className="w-12 h-12 text-dark-muted mx-auto mb-4" />
                  <p className="text-dark-muted">No tickets booked yet. Explore events on the home page!</p>
                </div>
              ) : (
                bookings.map((booking) => (
                  <div key={booking.id} className="glass-card rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center space-x-4">
                      {booking.event_details.image ? (
                        <img
                          src={booking.event_details.image.startsWith('http') ? booking.event_details.image : `http://127.0.0.1:8000${booking.event_details.image}`}
                          alt={booking.event_details.title}
                          className="w-16 h-16 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center text-dark-muted">
                          <Calendar className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-lg text-dark-text">{booking.event_details.title}</h4>
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
                          <p className="font-bold text-red-400 mt-0.5 line-through">₹{booking.total_price}</p>
                        ) : (
                          <p className="font-bold text-brand-primary mt-0.5">₹{booking.total_price}</p>
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
                          booking.payment_status === 'refunded' ? 'bg-red-500/10 text-red-400' :
                          booking.refund_requested ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/10' :
                          booking.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400' : 
                          'bg-red-500/10 text-red-400'
                        }`}>
                          {booking.payment_status === 'refunded' ? 'Refunded' :
                           booking.refund_requested ? 'Refund Pending' :
                           booking.status}
                        </span>
                      </div>
                      {booking.status === 'confirmed' && (
                        <div className="flex space-x-2">
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
                            onClick={() => handleOpenReviewModal('event', booking.event_details)}
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
                            onClick={() => handleDownloadTicket(booking)}
                            className="p-2 text-brand-primary hover:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl transition-all"
                            title="Download PDF Ticket"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCancelBooking(booking);
                              setTicketsToCancel(1);
                              setCancelModalOpen(true);
                            }}
                            className="p-2 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all"
                            title="Cancel Ticket(s)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
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
                  <div key={item.id} className="glass-card rounded-2xl overflow-hidden flex flex-col">
                    {item.event_details.image && (
                      <img
                        src={item.event_details.image.startsWith('http') ? item.event_details.image : `http://127.0.0.1:8000${item.event_details.image}`}
                        alt={item.event_details.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-6 flex flex-col flex-grow">
                      <h4 className="font-bold text-lg text-dark-text">{item.event_details.title}</h4>
                      <p className="text-xs text-dark-muted mt-1">{item.event_details.date} | {item.event_details.location}</p>
                      <p className="text-sm font-bold text-brand-primary mt-3">₹{item.event_details.price}</p>
                      
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                        <button
                          onClick={() => handleRemoveWishlist(item.event)}
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
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`glass-card rounded-2xl p-5 flex items-start justify-between border-l-4 transition-all ${
                      notif.is_read ? 'border-white/5 opacity-60' : 'border-emerald-500 bg-emerald-500/5'
                    }`}
                  >
                    <div className="flex space-x-3">
                      <div className={`p-2 rounded-lg ${notif.is_read ? 'bg-white/5 text-dark-muted' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {notif.is_read ? <CheckCircle className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
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
                ))
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

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 1. Browse Venues (Col-span 2) */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center space-x-2">
                    <Building className="w-5 h-5 text-brand-primary" />
                    <h3 className="text-lg font-bold text-dark-text uppercase tracking-wider">Browse & Book Venue Plots</h3>
                  </div>

                  {loadingVenues ? (
                    <div className="py-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div></div>
                  ) : venues.length === 0 ? (
                    <div className="glass-panel text-center py-12 rounded-2xl text-dark-muted">No venues available at the moment.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {venues.map((venue) => (
                        <div key={venue.id} className="glass-card rounded-2xl overflow-hidden flex flex-col h-full border border-white/5 hover:border-brand-primary/20 transition-all bg-dark-bg/20">
                          {/* Image */}
                          {venue.image ? (
                            <img
                              src={venue.image.startsWith('http') ? venue.image : `http://127.0.0.1:8000${venue.image}`}
                              alt={venue.name}
                              className="w-full h-40 object-cover"
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
                                  <h4 className="font-bold text-dark-text text-base leading-snug">{venue.name}</h4>
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
                              onClick={() => setRentModal({ show: true, venue })}
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

                {/* 2. My Bookings (Col-span 1) */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-bold text-dark-text uppercase tracking-wider">My Venue Rentals</h3>
                  </div>

                  {loadingVenues ? (
                    <div className="py-12 flex justify-center"><div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div></div>
                  ) : venueBookings.length === 0 ? (
                    <div className="glass-panel text-center py-12 rounded-2xl text-dark-muted text-xs">You haven't requested any venue rentals yet.</div>
                  ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                      {venueBookings.map((vb) => (
                        <div key={vb.id} className="glass-card rounded-2xl p-5 border border-white/5 space-y-3.5 bg-dark-bg/25">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-bold text-dark-text text-sm">{vb.venue_details?.name}</h5>
                              <p className="text-[10px] text-dark-muted mt-1">{vb.start_date} to {vb.end_date}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-extrabold ${
                              vb.status === 'approved' ? (vb.cancel_requested ? 'bg-yellow-500/10 text-yellow-400' : 'bg-emerald-500/10 text-emerald-400') :
                              vb.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                              'bg-red-500/10 text-red-400'
                            }`}>
                              {vb.cancel_requested && vb.status === 'approved' ? 'Cancel Requested' : vb.status}
                            </span>
                          </div>

                          {/* Service Badges */}
                          {(vb.use_catering || vb.use_dj || vb.use_decor) && (
                            <div className="flex flex-wrap gap-1.5">
                              {vb.use_catering && (
                                <span className="text-[9px] font-bold bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded flex items-center gap-1" title={`Menu: ${vb.catering_description}`}>
                                  🍽 Catering ({vb.catering_cuisine}) ×{vb.catering_plates} plates
                                </span>
                              )}
                              {vb.use_dj && (
                                <span className="text-[9px] font-bold bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded flex items-center gap-1" title={`Equipment: ${vb.dj_equipment}`}>
                                  🎵 DJ ({vb.dj_package})
                                </span>
                              )}
                              {vb.use_decor && (
                                <span className="text-[9px] font-bold bg-pink-500/10 text-pink-400 px-2 py-0.5 rounded flex items-center gap-1" title={`Theme: ${vb.decor_theme}`}>
                                  🎨 Decor ({vb.decor_theme})
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2.5">
                            <span className="text-dark-muted font-medium">Total Rent:</span>
                            <span className="font-black text-dark-text font-mono">₹{parseFloat(vb.total_price).toLocaleString('en-IN')}</span>
                          </div>

                           {vb.status === 'approved' && (
                            <div className="flex flex-col gap-2 w-full">
                              <div className="flex gap-2 w-full">
                                <a
                                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(vb.venue_details?.location || vb.venue_details?.name)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 flex items-center justify-center space-x-1.5 bg-white/5 hover:bg-white/10 text-brand-primary hover:text-white py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border border-white/5"
                                >
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span>Get Directions</span>
                                </a>
                                <button
                                  onClick={() => handleOpenReviewModal('venue', vb.venue_details)}
                                  className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border flex items-center justify-center gap-1 ${
                                    vb.venue_details?.reviews?.some(r => r.user === user?.id)
                                      ? 'bg-white/5 text-dark-muted border-white/5 cursor-not-allowed'
                                      : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20'
                                  }`}
                                  disabled={vb.venue_details?.reviews?.some(r => r.user === user?.id)}
                                >
                                  <Star className={`w-3.5 h-3.5 ${vb.venue_details?.reviews?.some(r => r.user === user?.id) ? '' : 'fill-amber-400'}`} />
                                  <span>{vb.venue_details?.reviews?.some(r => r.user === user?.id) ? 'Rated' : 'Rate'}</span>
                                </button>
                              </div>
                              {!vb.cancel_requested && (
                                <button
                                  onClick={() => handleCancelVenueBooking(vb)}
                                  className="w-full flex items-center justify-center space-x-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border border-red-500/10"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Cancel Rental</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
                          <p className="text-xs font-semibold text-brand-primary mt-2">Paid amount: ₹{selectedCancelBooking.total_price}</p>
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
                        Cancelling will request a refund of 90% (₹{(parseFloat(selectedCancelBooking.total_price) * 0.9).toFixed(2)}), subject to plot owner approval.
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
                      <strong>Refund Account:</strong> Please enter your card details below. A 90% refund of ₹{(
                        parseFloat(selectedCancelBooking.total_price) * 0.9
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
                        placeholder="John Doe"
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
                        placeholder="1234 5678 1234 5678"
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
                          placeholder="123"
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
    </div>
  );
};

export default CustomerDashboard;
