import React, { useState, useEffect, useRef } from 'react';
import api from '../api/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Trash2, Edit2, Plus, Sparkles, TrendingUp, Users, IndianRupee, Star, FileText, Upload, X, ShieldAlert, MapPin, Building, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import VenuePaymentModal from '../components/VenuePaymentModal';
import { useLocation, useNavigate } from 'react-router-dom';

const OrganizerDashboard = () => {
  const { user } = useAuth();
  
  // Dashboard data states
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [venueBookings, setVenueBookings] = useState([]);
  
  const routeLocation = useLocation();
  const navigate = useNavigate();
  const activeTab = routeLocation.pathname === '/organizer/sales'
    ? 'bookings'
    : routeLocation.pathname === '/organizer/rentals'
      ? 'venue_rentals'
      : routeLocation.pathname === '/organizer/reviews'
        ? 'reviews'
        : routeLocation.pathname === '/organizer/analytics'
          ? 'analytics'
          : 'events';
  const setActiveTab = (tabId) => {
    const paths = {
      events: '/organizer/events',
      bookings: '/organizer/sales',
      venue_rentals: '/organizer/rentals',
      reviews: '/organizer/reviews',
      analytics: '/organizer/analytics'
    };
    navigate(paths[tabId] || '/organizer/events');
  };

  // Modal states (Create/Edit)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [ticketsTotal, setTicketsTotal] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiAnalytics, setAiAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Google Maps & Venue Selection States
  const [approvedVenues, setApprovedVenues] = useState([]);
  const [locationType, setLocationType] = useState('custom'); // custom or platform
  const [selectedVenueId, setSelectedVenueId] = useState('');

  // Venue checkout payment states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentVenue, setPaymentVenue] = useState(null);
  const [paymentDates, setPaymentDates] = useState({ start: '', end: '' });

  const [pendingEventData, setPendingEventData] = useState(null);

  const locationInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    const initAutocomplete = () => {
      if (!locationInputRef.current || !window.google || !window.google.maps || !window.google.maps.places) return;
      
      autocompleteRef.current = new window.google.maps.places.Autocomplete(locationInputRef.current, {
        types: ['geocode', 'establishment'],
        componentRestrictions: { country: 'in' }
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        if (place && place.formatted_address) {
          setLocation(place.formatted_address);
        } else if (place && place.name) {
          setLocation(place.name);
        }
      });
    };

    if (modalOpen) {
      if (window.google && window.google.maps && window.google.maps.places) {
        initAutocomplete();
      } else {
        let script = document.querySelector('script[src*="maps.googleapis.com"]');
        if (!script) {
          script = document.createElement('script');
          const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
          script.async = true;
          script.defer = true;
          document.body.appendChild(script);
        }
        
        const handleScriptLoad = () => {
          setTimeout(initAutocomplete, 500);
        };
        script.addEventListener('load', handleScriptLoad);
        return () => {
          script.removeEventListener('load', handleScriptLoad);
        };
      }
    }
  }, [modalOpen]);

  const handleGenerateAIDescription = async () => {
    if (!title.trim()) {
      alert("Please input an Event Title first so AI can generate details.");
      return;
    }
    setAiGenerating(true);
    try {
      const selectedCategory = categories.find(c => c.id === parseInt(category) || c.id === category);
      const categoryName = selectedCategory ? selectedCategory.name : 'General Event';
      
      const res = await api.post('ai/generate-description/', {
        title: title,
        category: categoryName,
        keywords: title
      });
      
      if (res.data.description) {
        setDescription(res.data.description);
      }
    } catch (err) {
      console.error("AI Writer generation failed:", err);
      alert("AI Writer failed to generate description. Please try again.");
    } finally {
      setAiGenerating(false);
    }
  };

  const fetchAIAnalytics = async () => {
    if (aiAnalytics) return;
    setLoadingAnalytics(true);
    try {
      const res = await api.get('ai/analytics/');
      setAiAnalytics(res.data);
    } catch (err) {
      console.error("Failed to load AI predictions:", err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAIAnalytics();
    }
  }, [activeTab]);

  const fetchApprovedVenues = async () => {
    try {
      const res = await api.get('venues/listings/');
      setApprovedVenues(res.data.results || res.data);
    } catch (err) {
      console.error("Failed to fetch approved venues:", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchApprovedVenues();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch organizer's listings, categories, booking purchases, and venue rentals
      const [eventsRes, categoriesRes, bookingsRes, venueBookingsRes] = await Promise.all([
        api.get(`events/listings/?organizer=${user.id}`),
        api.get('events/categories/'),
        api.get('events/bookings/'),
        api.get('venues/bookings/')
      ]);
      setEvents(eventsRes.data.results || eventsRes.data);
      setCategories(categoriesRes.data);
      setBookings(bookingsRes.data);
      setVenueBookings(venueBookingsRes.data);
    } catch (err) {
      console.error("Error loading organizer dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelVenueBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this venue booking? A 10% fee will be retained, and you will receive a 90% refund.")) return;
    try {
      await api.post(`venues/bookings/${bookingId}/cancel/`);
      alert("Venue booking cancelled successfully. 90% refund has been processed.");
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to cancel venue booking.");
    }
  };

  const handleOpenCreateModal = () => {
    setEditingEvent(null);
    setTitle('');
    setDescription('');
    setDate('');
    setTime('');
    setLocation('');
    setCategory(categories[0]?.id || '');
    setPrice('');
    setTicketsTotal('');
    setImageFile(null);
    setImagePreview('');
    setFormError('');
    setLocationType('custom');
    setSelectedVenueId('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (event) => {
    setEditingEvent(event);
    setTitle(event.title);
    setDescription(event.description);
    setDate(event.date);
    setTime(event.time);
    setLocation(event.location);
    setCategory(event.category);
    setPrice(event.price);
    setTicketsTotal(event.tickets_total);
    setImageFile(null);
    setImagePreview(event.image);
    setFormError('');
    if (event.venue) {
      setLocationType('platform');
      setSelectedVenueId(event.venue);
    } else {
      setLocationType('custom');
      setSelectedVenueId('');
    }
    setModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFormError('Please upload a valid image file (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError('Image file size must be under 5MB.');
      return;
    }
    setFormError('');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Detailed Form Validations
    if (!title.trim() || title.trim().length < 5) {
      setFormError('Event Title must be at least 5 characters long.');
      return;
    }

    if (!description.trim() || description.trim().length < 20) {
      setFormError('Event Description must be at least 20 characters long.');
      return;
    }

    if (!date) {
      setFormError('Event Date is required.');
      return;
    }

    const eventDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (eventDate < today) {
      setFormError('Event Date cannot be in the past.');
      return;
    }

    if (!time) {
      setFormError('Event Time is required.');
      return;
    }

    if (locationType === 'custom' && (!location.trim() || location.trim().length < 5)) {
      setFormError('Event Location must be at least 5 characters long.');
      return;
    }

    if (locationType === 'platform' && !selectedVenueId) {
      setFormError('Please select a registered venue plot.');
      return;
    }

    if (price === '' || isNaN(price) || parseFloat(price) < 0) {
      setFormError('Price must be a positive number or 0 (for free events).');
      return;
    }
    if (parseFloat(price) > 100000) {
      setFormError('Ticket price cannot exceed ₹1,00,000 per ticket.');
      return;
    }

    if (!ticketsTotal || isNaN(ticketsTotal) || parseInt(ticketsTotal) < 1) {
      setFormError('Total tickets must be at least 1.');
      return;
    }
    if (parseInt(ticketsTotal) > 100000) {
      setFormError('Total tickets cannot exceed 1,00,000.');
      return;
    }

    setFormLoading(true);

    try {
      let finalLocation = location.trim();
      let venueId = null;

      if (locationType === 'platform') {
        const venue = approvedVenues.find(v => v.id === parseInt(selectedVenueId));
        if (!venue) {
          setFormError("Please select a registered venue plot.");
          setFormLoading(false);
          return;
        }
        finalLocation = `${venue.name}, ${venue.location}`;
        venueId = venue.id;

        // If creating a new event, intercept and prompt for payment first
        if (!editingEvent) {
          setPendingEventData({
            title: title.trim(),
            description: description.trim(),
            date,
            time,
            location: finalLocation,
            category,
            price,
            tickets_total: ticketsTotal,
            venue: venueId,
            imageFile
          });
          setPaymentVenue(venue);
          setPaymentDates({ start: date, end: date });
          setModalOpen(false);
          setFormLoading(false);
          setShowPaymentModal(true);
          return;
        }
      }

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('date', date);
      formData.append('time', time);
      formData.append('location', finalLocation);
      formData.append('category', category);
      formData.append('price', price);
      formData.append('tickets_total', ticketsTotal);
      if (venueId) {
        formData.append('venue', venueId);
      }
      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (editingEvent) {
        await api.put(`events/listings/${editingEvent.id}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('events/listings/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setModalOpen(false);
      fetchDashboardData();
    } catch (err) {
      const errData = err.response?.data;
      if (errData) {
        setFormError(Object.entries(errData).map(([k, v]) => `${k}: ${v}`).join(' | '));
      } else {
        setFormError("Operation failed. Check input parameters.");
      }
    } finally {
      setFormLoading(false);
    }
  };
  const handlePendingEventCreation = async () => {
    if (!pendingEventData) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', pendingEventData.title);
      formData.append('description', pendingEventData.description);
      formData.append('date', pendingEventData.date);
      formData.append('time', pendingEventData.time);
      formData.append('location', pendingEventData.location);
      formData.append('category', pendingEventData.category);
      formData.append('price', pendingEventData.price);
      formData.append('tickets_total', pendingEventData.tickets_total);
      if (pendingEventData.venue) {
        formData.append('venue', pendingEventData.venue);
      }
      if (pendingEventData.imageFile) {
        formData.append('image', pendingEventData.imageFile);
      }

      await api.post('events/listings/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Clear pending
      setPendingEventData(null);
      
      // Reset form fields
      setTitle('');
      setDescription('');
      setDate('');
      setTime('');
      setLocation('');
      setCategory('');
      setPrice('');
      setTicketsTotal('');
      setImageFile(null);
      setImagePreview('');

      // Refresh Dashboard Data
      const [eventsRes, bookingsRes] = await Promise.all([
        api.get(`events/listings/?organizer=${user.id}`),
        api.get('events/bookings/')
      ]);
      setEvents(eventsRes.data);
      setBookings(bookingsRes.data);
    } catch (err) {
      alert("Venue booked but event listing creation failed: " + (err.response?.data?.detail || "Connection error"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event? This will remove all bookings.")) return;
    try {
      await api.delete(`events/listings/${eventId}/`);
      fetchDashboardData();
    } catch (err) {
      alert("Failed to delete event.");
    }
  };

  // Stats calculation
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  const refundedBookings = bookings.filter(b => b.status === 'cancelled');

  const totalTicketsSold = confirmedBookings.reduce((sum, b) => sum + b.tickets_count, 0);

  // Gross sales are the sum of active bookings + refunded bookings
  const grossSales = confirmedBookings.reduce((sum, b) => sum + parseFloat(b.total_price), 0) +
                     refundedBookings.reduce((sum, b) => sum + parseFloat(b.total_price), 0);

  // Admin cut: 20% on active bookings, 10% on refunded bookings
  const adminCut = confirmedBookings.reduce((sum, b) => sum + parseFloat(b.total_price) * 0.20, 0) +
                   refundedBookings.reduce((sum, b) => sum + parseFloat(b.total_price) * 0.10, 0);

  // Organizer net share: 80% on active bookings, 40% on refunded bookings
  const organizerNet = confirmedBookings.reduce((sum, b) => sum + parseFloat(b.total_price) * 0.80, 0) +
                        refundedBookings.reduce((sum, b) => sum + parseFloat(b.total_price) * 0.40, 0);
  const averageRating = events.length > 0 
    ? (events.reduce((sum, e) => sum + parseFloat(e.rating_avg || 0), 0) / events.length).toFixed(1)
    : '0.0';

  const allReviews = events.reduce((arr, e) => {
    if (e.reviews && Array.isArray(e.reviews)) {
      e.reviews.forEach(r => {
        arr.push({ ...r, eventTitle: e.title });
      });
    }
    return arr;
  }, []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Venue stats calculations for organizer
  const activeVenues = venueBookings.filter(vb => vb.status === 'approved');
  const cancelledVenues = venueBookings.filter(vb => vb.status === 'cancelled');

  const totalVenueSpent = activeVenues.reduce((sum, vb) => sum + parseFloat(vb.total_price), 0);
  const totalVenueRefunded = cancelledVenues.reduce((sum, vb) => sum + parseFloat(vb.total_price) * 0.9, 0);
  const totalVenueLoss = cancelledVenues.reduce((sum, vb) => sum + parseFloat(vb.total_price) * 0.1, 0);
  const netVenueExpenses = totalVenueSpent + totalVenueLoss;

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-dark-bg">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-dark-muted font-medium">Loading Organizer dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-dark-text">Organizer Dashboard</h1>
          <p className="text-dark-muted mt-1">Host events, review ticketing metrics, and manage customer sales</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium px-5 py-2.5 rounded-xl hover:from-emerald-600 hover:to-teal-600 shadow-md shadow-emerald-950/20 transition-all transform hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          <span>Create New Event</span>
        </button>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="glass-panel rounded-2xl p-6 flex items-start space-x-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl mt-1">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div className="flex-grow">
            <p className="text-xs font-semibold text-dark-muted uppercase tracking-wider">Total Sales (Net)</p>
            <h3 className="text-2xl font-bold mt-1 text-emerald-400">₹{organizerNet.toLocaleString('en-IN')}</h3>
            <div className="mt-3 space-y-1 text-[10px] text-dark-muted border-t border-white/5 pt-2">
              <div className="flex justify-between">
                <span>Gross Ticketing Sales:</span>
                <span className="text-dark-text font-medium">₹{grossSales.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1 mb-1">
                <span>Active Sales (80% Org / 20% Admin):</span>
                <span className="text-emerald-400 font-medium">₹{confirmedBookings.reduce((sum, b) => sum + parseFloat(b.total_price) * 0.80, 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Cancelled Tickets Count:</span>
                <span className="text-dark-text font-medium">{refundedBookings.reduce((sum, b) => sum + b.tickets_count, 0)} tickets</span>
              </div>
              <div className="flex justify-between">
                <span>Total Cancelled Sales:</span>
                <span className="text-red-400 font-medium">₹{refundedBookings.reduce((sum, b) => sum + parseFloat(b.total_price), 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Refunded to Cust. (50%):</span>
                <span className="text-blue-400 font-medium">₹{refundedBookings.reduce((sum, b) => sum + parseFloat(b.total_price) * 0.5, 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Admin Retained Cut (10%):</span>
                <span className="text-red-400 font-medium">-₹{refundedBookings.reduce((sum, b) => sum + parseFloat(b.total_price) * 0.1, 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1 mb-1">
                <span>Org Net Retained (40%):</span>
                <span className="text-emerald-400 font-medium">₹{refundedBookings.reduce((sum, b) => sum + parseFloat(b.total_price) * 0.4, 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-semibold pt-1">
                <span>Org Net Profit:</span>
                <span>₹{organizerNet.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 flex items-center space-x-4">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-dark-muted uppercase tracking-wider">Tickets Sold</p>
            <h3 className="text-2xl font-bold mt-1">{totalTicketsSold}</h3>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 flex items-center space-x-4">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-dark-muted uppercase tracking-wider">Events Hosted</p>
            <h3 className="text-2xl font-bold mt-1">{events.length}</h3>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 flex items-center space-x-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-dark-muted uppercase tracking-wider">Average Rating</p>
            <h3 className="text-2xl font-bold mt-1">{averageRating} <span className="text-xs text-dark-muted">/ 5</span></h3>
          </div>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="mt-8">
        <AnimatePresence mode="wait">
          {activeTab === 'events' && (
            <motion.div
              key="events"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {events.length === 0 ? (
                <div className="col-span-full glass-panel text-center py-16 rounded-2xl">
                  <Calendar className="w-12 h-12 text-dark-muted mx-auto mb-4" />
                  <p className="text-dark-muted">You haven't created any events yet. Click "Create New Event" to get started!</p>
                </div>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="glass-card rounded-2xl overflow-hidden flex flex-col">
                    {event.image ? (
                      <img
                        src={event.image.startsWith('http') ? event.image : `http://127.0.0.1:8000${event.image}`}
                        alt={event.title}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-white/5 flex items-center justify-center text-dark-muted">
                        <Calendar className="w-10 h-10" />
                      </div>
                    )}
                    
                    <div className="p-6 flex flex-col flex-grow">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-white/5 text-dark-muted px-2 py-0.5 rounded">
                          {event.category_details?.name || 'General'}
                        </span>
                        <span className="text-sm font-semibold text-amber-400 flex items-center space-x-0.5">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{event.rating_avg}</span>
                        </span>
                      </div>
                      <h4 className="font-bold text-lg text-dark-text">{event.title}</h4>
                      <p className="text-xs text-dark-muted mt-1">{event.date} | {event.location}</p>
                      
                      <div className="grid grid-cols-2 gap-4 mt-6 p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                        <div>
                          <span className="text-[10px] font-semibold text-dark-muted uppercase">Sold</span>
                          <p className="font-bold text-dark-text mt-0.5">{event.tickets_sold} / {event.tickets_total}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-dark-muted uppercase">Ticket Price</span>
                          <p className="font-bold text-brand-primary mt-0.5">₹{event.price}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-white/5">
                        <button
                          onClick={() => handleOpenEditModal(event)}
                          className="flex items-center space-x-1 text-xs text-brand-primary hover:text-emerald-400 font-semibold transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="flex items-center space-x-1 text-xs text-red-400 hover:text-red-300 font-semibold transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'bookings' && (
            <motion.div
              key="bookings"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="glass-panel rounded-2xl overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5 text-xs font-semibold text-dark-muted uppercase tracking-wider">
                      <th className="px-6 py-4">Attendee</th>
                      <th className="px-6 py-4">Event</th>
                      <th className="px-6 py-4">Tickets</th>
                      <th className="px-6 py-4">Revenue</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-white/5">
                    {bookings.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-12 text-dark-muted">No ticket bookings logged yet.</td>
                      </tr>
                    ) : (
                      bookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-dark-text">{booking.user_details.first_name} {booking.user_details.last_name}</p>
                            <p className="text-xs text-dark-muted mt-0.5">{booking.user_details.email}</p>
                          </td>
                          <td className="px-6 py-4 font-semibold text-dark-text">{booking.event_details.title}</td>
                          <td className="px-6 py-4 font-bold text-dark-text">
                            {booking.tickets_count} <span className="text-[9px] text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 uppercase ml-2">{booking.ticket_category}</span>
                          </td>
                          <td className="px-6 py-4 font-bold text-brand-primary">
                            {booking.status === 'cancelled' || booking.payment_status === 'refunded' ? (
                              <div className="flex flex-col">
                                <span className="text-red-400 line-through">₹{parseFloat(booking.total_price).toLocaleString('en-IN')}</span>
                                <span className="text-[10px] text-emerald-500 font-semibold mt-0.5">Org Share (40%): ₹{(parseFloat(booking.total_price) * 0.40).toLocaleString('en-IN')}</span>
                              </div>
                            ) : (
                              <div className="flex flex-col">
                                <span>₹{parseFloat(booking.total_price).toLocaleString('en-IN')}</span>
                                <span className="text-[10px] text-emerald-400 font-semibold mt-0.5">Org Share (80%): ₹{(parseFloat(booking.total_price) * 0.80).toLocaleString('en-IN')}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-extrabold ${
                              booking.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400' :
                              booking.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                              'bg-yellow-500/10 text-yellow-400'
                            }`}>
                              {booking.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-dark-muted">{new Date(booking.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'venue_rentals' && (
            <motion.div
              key="venue_rentals"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="glass-panel rounded-2xl overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5 text-xs font-semibold text-dark-muted uppercase tracking-wider">
                      <th className="px-6 py-4">Venue</th>
                      <th className="px-6 py-4">Rental Dates</th>
                      <th className="px-6 py-4">Pricing Details</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-white/5">
                    {venueBookings.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-12 text-dark-muted">You haven't requested any venue rentals yet.</td>
                      </tr>
                    ) : (
                      venueBookings.map((vb) => (
                        <tr key={vb.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-dark-text">{vb.venue_details?.name}</p>
                            <p className="text-xs text-dark-muted mt-0.5">{vb.venue_details?.location}</p>
                            {(vb.use_catering || vb.use_dj || vb.use_decor) && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {vb.use_catering && (
                                  <span className="text-[9px] font-bold bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded" title={`Menu: ${vb.catering_description}`}>
                                    🍽 Catering ({vb.catering_cuisine}) ×{vb.catering_plates}
                                  </span>
                                )}
                                {vb.use_dj && (
                                  <span className="text-[9px] font-bold bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded" title={`Equipment: ${vb.dj_equipment}`}>
                                    🎵 DJ ({vb.dj_package})
                                  </span>
                                )}
                                {vb.use_decor && (
                                  <span className="text-[9px] font-bold bg-pink-500/10 text-pink-400 px-1.5 py-0.5 rounded" title={`Theme: ${vb.decor_theme}`}>
                                    🎨 Decor ({vb.decor_theme})
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 font-semibold text-dark-text">
                            {vb.start_date} to {vb.end_date}
                          </td>
                          <td className="px-6 py-4 font-bold">
                            {vb.status === 'cancelled' ? (
                              <div className="text-xs space-y-0.5">
                                <span className="text-dark-muted block line-through">₹{vb.total_price}</span>
                                <span className="text-emerald-400 block">Refunded (90%): ₹{(parseFloat(vb.total_price) * 0.9).toFixed(2)}</span>
                                <span className="text-red-400 block font-normal">Retained (10%): ₹{(parseFloat(vb.total_price) * 0.1).toFixed(2)}</span>
                              </div>
                            ) : (
                              <span className="text-brand-primary">₹{vb.total_price}</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-extrabold ${
                              vb.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                              vb.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                              vb.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                              'bg-red-500/10 text-red-400'
                            }`}>
                              {vb.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {vb.status !== 'cancelled' && vb.status !== 'rejected' && (
                              <button
                                onClick={() => handleCancelVenueBooking(vb.id)}
                                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold transition-all border border-red-500/5 whitespace-nowrap"
                              >
                                Cancel Booking
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="space-y-8"
            >
              {/* Venue Expenses panel */}
              <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
                <div className="flex items-center space-x-2 border-b border-white/5 pb-3">
                  <Building className="w-5 h-5 text-brand-primary" />
                  <h4 className="font-bold text-base text-dark-text uppercase tracking-wider">Venue Rental Financials</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-[10px] font-semibold text-dark-muted uppercase block mb-1">Active Venue Bookings</span>
                    <p className="text-xl font-bold text-dark-text mt-1">{activeVenues.length}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-[10px] font-semibold text-dark-muted uppercase block mb-1">Total Spent (Approved)</span>
                    <p className="text-xl font-bold text-red-400 mt-1">₹{totalVenueSpent.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-[10px] font-semibold text-dark-muted uppercase block mb-1">Total Refunds (90%)</span>
                    <p className="text-xl font-bold text-emerald-400 mt-1">₹{totalVenueRefunded.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-[10px] font-semibold text-dark-muted uppercase block mb-1">Net Out-of-Pocket Expenses</span>
                    <p className="text-xl font-bold text-brand-primary mt-1">₹{netVenueExpenses.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
              {/* AI Forecast & Prediction panels */}
              {loadingAnalytics ? (
                <div className="text-center py-16 bg-white/[0.01] border border-white/5 rounded-2xl">
                  <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-dark-muted text-sm font-semibold">Running predictive AI models on your ticket sales...</p>
                </div>
              ) : aiAnalytics ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Predicted Revenue */}
                  <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between border border-emerald-500/10 shadow-lg">
                    <div>
                      <p className="text-xs font-semibold text-dark-muted uppercase tracking-wider">AI Forecasted Revenue</p>
                      <h3 className="text-3xl font-extrabold mt-2 text-emerald-400">₹{aiAnalytics.predicted_revenue.toFixed(2)}</h3>
                      <p className="text-[11px] text-dark-muted mt-2 leading-relaxed">{aiAnalytics.revenue_prediction}</p>
                    </div>
                  </div>

                  {/* Attendance Prediction */}
                  <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between border border-emerald-500/10 shadow-lg">
                    <div>
                      <p className="text-xs font-semibold text-dark-muted uppercase tracking-wider">Expected Attendance Rate</p>
                      <h3 className="text-3xl font-extrabold mt-2 text-brand-primary">{aiAnalytics.predicted_attendance_rate}%</h3>
                      
                      {/* progress gauge */}
                      <div className="w-full bg-white/5 rounded-full h-2 mt-3 overflow-hidden">
                        <div 
                          className="bg-brand-primary h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${aiAnalytics.predicted_attendance_rate}%` }}
                        ></div>
                      </div>
                      <p className="text-[11px] text-dark-muted mt-3 leading-relaxed">{aiAnalytics.attendance_prediction}</p>
                    </div>
                  </div>

                  {/* Actionable Tips */}
                  <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between border border-emerald-500/10 shadow-lg">
                    <div>
                      <p className="text-xs font-semibold text-dark-muted uppercase tracking-wider">AI Actionable Insights</p>
                      <div className="mt-3 space-y-2 text-xs leading-relaxed text-dark-text">
                        {aiAnalytics.insights && aiAnalytics.insights.map((insight, idx) => (
                          <div key={idx} className="flex items-start space-x-2 bg-white/5 p-2.5 rounded-lg border border-white/5">
                            <Sparkles className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                            <span>{insight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Historical graph */}
              <div className="glass-panel rounded-2xl p-6 border border-white/5">
                <h4 className="font-bold text-lg text-dark-text mb-2">Revenue Performance (Per Event)</h4>
                <p className="text-xs text-dark-muted mb-8">Sales revenue breakdown across listed events</p>
                
                {events.length === 0 ? (
                  <div className="text-center py-12 text-dark-muted">No data available to display chart.</div>
                ) : (
                  /* Custom Premium SVG Dashboard Chart */
                  <div className="w-full flex flex-col items-center">
                    <div className="w-full h-80 relative flex items-end">
                      {/* Y-axis Guidelines */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
                        {[0, 1, 2, 3].map(i => (
                          <div key={i} className="border-t border-dashed border-white w-full h-0"></div>
                        ))}
                      </div>
                      
                      {/* SVG Chart */}
                      <svg className="w-full h-full" viewBox="0 0 800 300">
                        <defs>
                          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        
                        {/* Calculate points */}
                        {(() => {
                          const maxRevenue = Math.max(...events.map(e => e.tickets_sold * e.price), 1000);
                          const widthStep = 800 / (events.length + 1);
                          const points = events.map((e, index) => {
                            const rev = e.tickets_sold * e.price;
                            const x = widthStep * (index + 1);
                            const y = 300 - (rev / maxRevenue * 240) - 20; // 240 max height bounds, padding 20
                            return { x, y, title: e.title, value: rev };
                          });
                          
                          if (points.length === 0) return null;
                          
                          const pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
                          const areaD = `${pathD} L ${points[points.length - 1].x} 280 L ${points[0].x} 280 Z`;
                          
                          return (
                            <>
                              {/* Area Fill */}
                              <path d={areaD} fill="url(#chartGrad)" />
                              
                              {/* Line path */}
                              <path d={pathD} fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
                              
                              {/* Interactive Data Nodes */}
                              {points.map((p, i) => (
                                <g key={i}>
                                  <circle 
                                    cx={p.x} 
                                    cy={p.y} 
                                    r="6" 
                                    fill="#10B981" 
                                    stroke="#0A0E1A" 
                                    strokeWidth="2"
                                    className="transition-all duration-200 hover:r-8 cursor-pointer"
                                  />
                                  <text 
                                    x={p.x} 
                                    y={p.y - 12} 
                                    textAnchor="middle" 
                                    fill="#10B981" 
                                    fontSize="10" 
                                    fontWeight="bold"
                                  >
                                    ₹{p.value}
                                  </text>
                                </g>
                              ))}
                            </>
                          );
                        })()}
                      </svg>
                    </div>
                    
                    {/* X-axis Labels */}
                    <div className="flex justify-between w-full mt-4 px-10 text-xs text-dark-muted font-semibold truncate">
                      {events.map((event, idx) => (
                        <span key={event.id} className="text-[10px] truncate max-w-[80px]" title={event.title}>
                          {event.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'reviews' && (
            <motion.div
              key="reviews"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="space-y-4"
            >
              {allReviews.length === 0 ? (
                <div className="glass-panel text-center py-16 rounded-2xl">
                  <Star className="w-12 h-12 text-dark-muted mx-auto mb-4" />
                  <p className="text-dark-muted">No reviews received yet for your events.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {allReviews.map((rev) => (
                    <div key={rev.id} className="glass-card rounded-2xl p-6 border border-white/5 space-y-4 bg-dark-bg/30">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-bold text-dark-text text-sm">{rev.user_details?.first_name} {rev.user_details?.last_name}</h5>
                          <span className="text-[10px] text-dark-muted block mt-0.5">{rev.user_details?.email}</span>
                        </div>
                        <div className="flex items-center space-x-0.5 text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating ? 'text-amber-400 fill-amber-400' : 'text-dark-muted opacity-30'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                        <span className="text-[9px] font-semibold text-brand-primary uppercase tracking-wider block">Event reviewed</span>
                        <p className="font-bold text-xs text-dark-text mt-0.5">{rev.eventTitle}</p>
                      </div>

                      <p className="text-xs text-dark-muted italic leading-relaxed">
                        "{rev.comment}"
                      </p>

                      <span className="block text-[9px] text-dark-muted text-right">
                        {new Date(rev.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CRUD Event Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto py-10">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            ></motion.div>
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-panel w-full max-w-2xl rounded-2xl shadow-glass z-10 overflow-hidden relative flex flex-col my-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <h3 className="text-xl font-bold text-dark-text flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-brand-primary animate-pulse" />
                  <span>{editingEvent ? 'Edit Event Details' : 'Create New Event'}</span>
                </h3>
                <button onClick={() => setModalOpen(false)} className="text-dark-muted hover:text-dark-text">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="m-6 mb-0 flex items-start space-x-2 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
                  <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-5 flex-grow">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">Event Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Navratri Dandiya Night"
                      className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-2">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider">Description</label>
                      <button
                        type="button"
                        onClick={handleGenerateAIDescription}
                        disabled={aiGenerating}
                        className="flex items-center space-x-1.5 text-xs text-brand-primary hover:text-emerald-400 font-bold disabled:opacity-50 transition-all bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/15 focus:outline-none"
                      >
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        <span>{aiGenerating ? 'Writing Draft...' : 'Write with AI Writer'}</span>
                      </button>
                    </div>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Write detailed event highlights..."
                      rows="4"
                      className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
                      required
                    ></textarea>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="glass-input w-full px-4 py-2.5 rounded-xl text-sm bg-dark-bg cursor-pointer"
                      required
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Location Type Option */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">Location Option</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setLocationType('custom')}
                        disabled={!!editingEvent && !!editingEvent.venue}
                        className={`py-2 px-4 rounded-xl border text-xs font-bold transition-all text-center ${
                          locationType === 'custom'
                            ? 'border-brand-primary bg-emerald-500/10 text-emerald-400'
                            : 'border-white/5 bg-white/5 text-dark-muted hover:border-white/10 hover:text-dark-text'
                        } disabled:opacity-50`}
                      >
                        Type Custom Location
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocationType('platform')}
                        disabled={!!editingEvent && !!editingEvent.venue}
                        className={`py-2 px-4 rounded-xl border text-xs font-bold transition-all text-center ${
                          locationType === 'platform'
                            ? 'border-brand-primary bg-emerald-500/10 text-emerald-400'
                            : 'border-white/5 bg-white/5 text-dark-muted hover:border-white/10 hover:text-dark-text'
                        } disabled:opacity-50`}
                      >
                        Book Registered Venue Plot
                      </button>
                    </div>
                  </div>

                  {locationType === 'platform' ? (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">Select Registered Venue Plot</label>
                      <select
                        value={selectedVenueId}
                        onChange={(e) => setSelectedVenueId(e.target.value)}
                        disabled={!!editingEvent && !!editingEvent.venue}
                        className="glass-input w-full px-4 py-2.5 rounded-xl text-sm bg-dark-bg cursor-pointer disabled:opacity-50"
                        required
                      >
                        <option value="">-- Choose Venue Plot --</option>
                        {approvedVenues.map(venue => (
                          <option key={venue.id} value={venue.id}>
                            {venue.name} (₹{venue.price_per_day}/day) - {venue.location}
                          </option>
                        ))}
                      </select>
                      {editingEvent && editingEvent.venue && (
                        <p className="text-[10px] text-amber-400 mt-1.5 font-medium">Note: Date and Venue details cannot be modified for confirmed/requested bookings.</p>
                      )}
                    </div>
                  ) : (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">Location Address</label>
                      <input
                        ref={locationInputRef}
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Club O7, Ahmedabad"
                        className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
                        required
                      />
                    </div>
                  )}

                  {/* Map Preview */}
                  {((locationType === 'custom' && location && location.trim().length > 5) ||
                    (locationType === 'platform' && approvedVenues.find(v => v.id === parseInt(selectedVenueId)))) && (
                    <div className="sm:col-span-2 mt-1">
                      <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">Map Location Preview</label>
                      <div className="w-full h-44 rounded-xl overflow-hidden border border-white/5 shadow-md">
                        <iframe
                          title="Event Map Preview"
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          style={{ border: 0 }}
                          src={`https://maps.google.com/maps?q=${encodeURIComponent(
                            locationType === 'custom' 
                              ? location 
                              : (() => {
                                  const v = approvedVenues.find(v => v.id === parseInt(selectedVenueId));
                                  return v ? `${v.name}, ${v.location}` : '';
                                })()
                          )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                          allowFullScreen
                        ></iframe>
                      </div>
                    </div>
                  )}

                  {/* Date */}
                  <div>
                    <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      disabled={!!editingEvent && !!editingEvent.venue}
                      className="glass-input w-full px-4 py-2.5 rounded-xl text-sm bg-dark-bg disabled:opacity-50"
                      required
                    />
                  </div>

                  {/* Time */}
                  <div>
                    <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">Time</label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="glass-input w-full px-4 py-2.5 rounded-xl text-sm bg-dark-bg"
                      required
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">Ticket Price (₹)</label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
                      required
                    />
                  </div>

                  {/* Total Tickets */}
                  <div>
                    <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">Tickets Available</label>
                    <input
                      type="number"
                      value={ticketsTotal}
                      onChange={(e) => setTicketsTotal(e.target.value)}
                      placeholder="100"
                      min="1"
                      className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
                      required
                    />
                  </div>

                  {/* Image Upload */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">Event Image Banner</label>
                    <div className="flex items-center space-x-4">
                      {imagePreview && (
                        <img 
                          src={imagePreview.startsWith('blob:') ? imagePreview : `http://127.0.0.1:8000${imagePreview}`} 
                          alt="Preview" 
                          className="w-16 h-16 rounded-xl object-cover border border-white/5" 
                        />
                      )}
                      <label className="flex items-center justify-center space-x-2 border border-dashed border-white/10 hover:border-brand-primary p-4 rounded-xl cursor-pointer transition-all bg-white/5 hover:bg-emerald-500/5 flex-grow">
                        <Upload className="w-5 h-5 text-brand-primary" />
                        <span className="text-xs text-dark-muted">Click to upload photo banner</span>
                        <input type="file" onChange={handleImageChange} accept="image/*" className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Save controls */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="border border-white/10 text-dark-text hover:bg-white/5 px-6 py-2.5 rounded-xl text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium px-6 py-2.5 rounded-xl hover:from-emerald-600 hover:to-teal-600 shadow-md shadow-emerald-950/20 transition-all disabled:opacity-50"
                  >
                    {formLoading ? 'Saving...' : 'Save Event'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {showPaymentModal && paymentVenue && (
        <VenuePaymentModal
          venue={paymentVenue}
          startDate={paymentDates.start}
          endDate={paymentDates.end}
          onClose={() => { setShowPaymentModal(false); setPaymentVenue(null); setPendingEventData(null); }}
          onPaymentSuccess={() => {
            setShowPaymentModal(false);
            setPaymentVenue(null);
            handlePendingEventCreation();
          }}
        />
      )}
    </div>
  );
};

export default OrganizerDashboard;
