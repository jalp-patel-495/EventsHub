import React, { useState, useEffect, useRef } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, MapPin, Filter, Star, Heart, X, Ticket, ChevronLeft, ChevronRight, CheckCircle2, ArrowLeft, Smartphone, CreditCard, Lock, ShieldCheck, Download, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BookingModal from '../components/BookingModal';

const EventExplore = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // API Data states
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [wishlistedIds, setWishlistedIds] = useState(new Set());
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filter/Search states
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false); // filters hidden by default

  // Booking Modal State
  const [bookingEvent, setBookingEvent] = useState(null);

  useEffect(() => {
    fetchCategories();
    if (isAuthenticated) {
      fetchWishlist();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchEvents();
  }, [category, minPrice, maxPrice, startDate, endDate, page]);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const bookEventId = queryParams.get('book');
    if (bookEventId) {
      const fetchAndOpenBooking = async () => {
        try {
          const res = await api.get(`events/listings/${bookEventId}/`);
          setBookingEvent(res.data);
        } catch (err) {
          console.error("Failed to load live feed checkout event:", err);
        }
      };
      fetchAndOpenBooking();
    }
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('events/categories/');
      setCategories(response.data);
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  };

  const fetchWishlist = async () => {
    try {
      const response = await api.get('events/wishlist/');
      const ids = new Set(response.data.map(item => item.event));
      setWishlistedIds(ids);
    } catch (err) {
      console.error("Error loading wishlist IDs:", err);
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      let url = `events/listings/?page=${page}`;
      if (search) url += `&search=${search}`;
      if (category) url += `&category=${category}`;
      if (minPrice) url += `&min_price=${minPrice}`;
      if (maxPrice) url += `&max_price=${maxPrice}`;
      if (startDate) url += `&start_date=${startDate}`;
      if (endDate) url += `&end_date=${endDate}`;

      const response = await api.get(url);
      setEvents(response.data.results || response.data);
      setTotalCount(response.data.count || response.data.length);
    } catch (err) {
      console.error("Error loading events list:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchEvents();
  };

  const handleWishlistToggle = async (eventId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      const response = await api.post(`events/${eventId}/wishlist/`);
      const newWishlisted = new Set(wishlistedIds);
      if (response.data.is_wishlisted) {
        newWishlisted.add(eventId);
      } else {
        newWishlisted.delete(eventId);
      }
      setWishlistedIds(newWishlisted);
    } catch (err) {
      console.error("Failed to toggle wishlist:", err);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleOpenBookingModal = (event) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setBookingEvent(event);
  };

  // Pagination bounds
  const totalPages = Math.ceil(totalCount / 6) || 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Search & Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-10">
        {/* Keyword Search */}
        <div className="lg:col-span-2 relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dark-muted">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events by title, description, location..."
            className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-sm"
          />
        </div>
        
        {/* Category Select */}
        <div>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="glass-input w-full px-4 py-3 rounded-xl text-sm cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Search & Filter Actions */}
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border transition-all text-sm font-semibold focus:outline-none ${
              showFilters 
                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                : 'bg-white/5 hover:bg-white/10 text-dark-text border-white/5'
            }`}
            title="Toggle Filters"
          >
            <Filter className="w-4 h-4 text-emerald-400" />
            <span>Filters</span>
          </button>
          <button
            type="submit"
            className="flex-grow bg-brand-primary hover:bg-emerald-600 text-white font-medium py-3 px-6 rounded-xl transition-colors shadow-md shadow-emerald-950/20"
          >
            Search Events
          </button>
        </div>
      </form>

      {/* Main Grid: Filters Sidebar + Event Grid */}
      <div className={showFilters ? "grid grid-cols-1 lg:grid-cols-4 gap-8" : "grid grid-cols-1 gap-8"}>
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="glass-panel rounded-2xl p-6 h-fit space-y-6">
            <div className="flex items-center space-x-2 border-b border-white/5 pb-4">
              <Filter className="w-4 h-4 text-brand-primary" />
              <h3 className="font-bold text-dark-text">Refine Search</h3>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">Price (₹)</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                  placeholder="Min"
                  className="glass-input w-full px-3 py-2 rounded-lg text-xs"
                />
                <span className="text-dark-muted">-</span>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                  placeholder="Max"
                  className="glass-input w-full px-3 py-2 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Date range */}
            <div>
              <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">Date Range</label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                  className="glass-input w-full px-3 py-2 rounded-lg text-xs"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                  className="glass-input w-full px-3 py-2 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Clear Filters */}
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCategory('');
                setMinPrice('');
                setMaxPrice('');
                setStartDate('');
                setEndDate('');
                setPage(1);
              }}
              className="w-full text-center py-2 text-xs font-semibold border border-white/5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-dark-muted hover:text-dark-text"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Events Grid */}
        <div className={showFilters ? "lg:col-span-3" : "w-full"}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-dark-muted">Searching event listings...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="glass-panel text-center py-20 rounded-2xl">
              <Calendar className="w-12 h-12 text-dark-muted mx-auto mb-4" />
              <p className="text-dark-muted">No events match your search criteria. Try removing filters!</p>
            </div>
          ) : (
            <>
              <div className={`grid grid-cols-1 md:grid-cols-2 ${showFilters ? '' : 'lg:grid-cols-3'} gap-6`}>
                {events.map((event) => {
                  const isWishlisted = wishlistedIds.has(event.id);
                  const remainingTickets = event.tickets_total - event.tickets_sold;
                  return (
                    <div key={event.id} className="glass-card rounded-2xl overflow-hidden flex flex-col relative group">
                      {/* Image Banner */}
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

                      {/* Wishlist Heart */}
                      <button
                        type="button"
                        onClick={() => handleWishlistToggle(event.id)}
                        className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-md border border-white/10 transition-all ${
                          isWishlisted ? 'bg-red-500 text-white border-transparent' : 'bg-black/30 text-white hover:bg-black/50'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-white' : ''}`} />
                      </button>

                      {/* Content */}
                      <div className="p-6 flex flex-col flex-grow">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-white/5 text-dark-muted px-2 py-0.5 rounded">
                            {event.category_details?.name || 'General'}
                          </span>
                          <span className="text-xs font-semibold text-amber-400 flex items-center space-x-0.5">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            <span>{event.rating_avg}</span>
                          </span>
                        </div>
                        <h4 className="font-bold text-lg text-dark-text leading-tight group-hover:text-brand-primary transition-colors">{event.title}</h4>
                        <p className="text-xs text-dark-muted mt-1 flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-brand-primary" />
                          <span>{event.date} at {event.time}</span>
                        </p>
                        <p className="text-xs text-dark-muted mt-0.5 flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-brand-primary" />
                          <span>{event.location}</span>
                        </p>

                        <div className="w-full border-t border-white/5 my-4"></div>

                        {/* Price & Booking CTA */}
                        <div className="flex items-center justify-between mt-auto">
                          <div>
                            <span className="text-[10px] font-semibold text-dark-muted uppercase">Ticket Price</span>
                            <p className="font-extrabold text-brand-primary text-lg mt-0.5">₹{event.price}</p>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.location)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 bg-white/5 hover:bg-white/10 text-dark-text border border-white/5 rounded-xl transition-all flex items-center space-x-1 text-[11px] font-semibold"
                              title="View Directions on Google Maps"
                            >
                              <MapPin className="w-3.5 h-3.5 text-brand-primary" />
                              <span>View Direction</span>
                            </a>
                            {remainingTickets <= 0 ? (
                              <span className="text-xs font-bold text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/10">
                                Sold Out
                              </span>
                            ) : (
                              <button
                                onClick={() => handleOpenBookingModal(event)}
                                className="bg-brand-primary hover:bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all transform hover:-translate-y-0.5"
                              >
                                Book Now
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <span className="block text-[10px] text-dark-muted text-right mt-2 font-medium">
                          {remainingTickets} tickets remaining
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-4 mt-12">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 border border-white/5 bg-white/5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="w-5 h-5 text-dark-text" />
                  </button>
                  <span className="text-sm font-semibold text-dark-muted">Page {page} of {totalPages}</span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 border border-white/5 bg-white/5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronRight className="w-5 h-5 text-dark-text" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Booking Ticket Modal */}
      <AnimatePresence>
        {bookingEvent && (
          <BookingModal 
            event={bookingEvent} 
            onClose={() => setBookingEvent(null)} 
            onBookingSuccess={fetchEvents} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventExplore;
