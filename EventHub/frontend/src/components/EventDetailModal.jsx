import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Calendar, MapPin, Star, Heart, Share2, 
  Ticket, CheckCircle2, Sparkles, ExternalLink, 
  ThumbsUp, Check, Mail, Phone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BACKEND_URL } from '../api/api';

const EventDetailModal = ({ event, onClose, onBookNow, isWishlisted, onToggleWishlist, showHostBox = true }) => {
  const { isAuthenticated } = useAuth();
  const [isInterested, setIsInterested] = useState(false);
  const [interestedCount, setInterestedCount] = useState(() => Math.floor(100 + Math.random() * 85));
  const [copied, setCopied] = useState(false);

  if (!event) return null;

  const remainingTickets = event.tickets_total !== undefined 
    ? event.tickets_total - (event.tickets_sold || 0)
    : (event.remaining_tickets || 100);

  const eventImage = event.image 
    ? (event.image.startsWith('http') ? event.image : `${BACKEND_URL}${event.image}`)
    : 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80';

  const hostName = event.organizer_details?.first_name 
    ? `${event.organizer_details.first_name} ${event.organizer_details.last_name || ''}`
    : (event.organizer_name || event.host_name || 'MoonAffair.Amd');
  const hostEmail = event.organizer_details?.email || event.organizer_email || (typeof event.organizer === 'string' ? event.organizer : 'jalppatel1580@gmail.com');
  const hostPhone = event.organizer_details?.phone || event.organizer_phone || event.host_phone || '+91 98765 43210';

  const reviewsCount = event.reviews && Array.isArray(event.reviews) ? event.reviews.length : (event.rating_count !== undefined ? event.rating_count : 0);
  const ratingAvg = (event.rating_avg !== undefined && event.rating_avg !== null && parseFloat(event.rating_avg) > 0) 
    ? parseFloat(event.rating_avg).toFixed(1) 
    : (reviewsCount > 0 && event.reviews 
        ? (event.reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviewsCount).toFixed(1)
        : null);

  const handleToggleInterested = () => {
    if (!isInterested) {
      setIsInterested(true);
      setInterestedCount(prev => prev + 1);
    } else {
      setIsInterested(false);
      setInterestedCount(prev => prev - 1);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&details=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent(event.location || '')}&dates=${event.date?.replace(/-/g, '')}T180000Z/${event.date?.replace(/-/g, '')}T210000Z`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/75 backdrop-blur-md">
        {/* Backdrop click to close */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0"
        />

        {/* Main Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="glass-panel w-full max-w-4xl rounded-3xl shadow-2xl z-10 overflow-hidden relative flex flex-col my-auto max-h-[92vh] border border-white/10 bg-dark-bg/95 text-dark-text"
        >
          {/* Header Bar */}
          <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-dark-bg/90 backdrop-blur-md border-b border-white/5">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
              Event Overview & Details
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-dark-muted hover:text-dark-text transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="overflow-y-auto p-4 sm:p-8 space-y-8 no-scrollbar">
            
            {/* 1. Hero Image Banner */}
            <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden shadow-xl group border border-white/5">
              <img
                src={eventImage}
                alt={event.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-transparent to-black/30" />

              {/* Category Tag */}
              <span className="absolute top-4 left-4 bg-brand-primary/80 backdrop-blur-md text-white text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                {event.category_details?.name || event.source || 'Music & Culture'}
              </span>

              {/* Wishlist Heart Button */}
              <button
                type="button"
                onClick={() => onToggleWishlist && onToggleWishlist(event.id)}
                className={`absolute top-4 right-4 p-3 rounded-full backdrop-blur-md border transition-all shadow-lg ${
                  isWishlisted 
                    ? 'bg-rose-500 text-white border-transparent shadow-rose-500/30' 
                    : 'bg-black/50 text-white hover:bg-black/70 border-white/10'
                }`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-white' : ''}`} />
              </button>

              {/* Rating badge */}
              <div className="absolute bottom-4 left-4 flex justify-between items-end">
                <span className="text-amber-400 text-xs font-bold flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-amber-400/20 shadow-md">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span>
                    {ratingAvg ? `${ratingAvg} / 5.0 (${reviewsCount} ${reviewsCount === 1 ? 'Review' : 'Reviews'})` : (reviewsCount > 0 ? `${reviewsCount} ${reviewsCount === 1 ? 'Review' : 'Reviews'}` : 'New Event (No Reviews Yet)')}
                  </span>
                </span>
              </div>
            </div>

            {/* 2. Content Grid (Main Details + Sidebar Booking) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Details (2 Cols) */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Event Title & Host Header */}
                <div>
                  <h1 className="text-2xl sm:text-4xl font-extrabold text-dark-text tracking-tight leading-tight">
                    {event.title}
                  </h1>

                  {/* Host Box - Only shown on Explore Events page */}
                  {showHostBox && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-brand-primary to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-md flex-shrink-0">
                          {hostName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-dark-text flex items-center gap-1.5">
                            <span>{hostName}</span>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-dark-muted mt-1">
                            <span className="flex items-center gap-1.5 text-slate-200 font-medium bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                              <Mail className="w-3.5 h-3.5 text-brand-primary" />
                              <span>{hostEmail}</span>
                            </span>
                            <span className="flex items-center gap-1.5 text-slate-200 font-medium bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                              <Phone className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{hostPhone}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Interactive Action Bar */}
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/5">
                  <button
                    onClick={handleToggleInterested}
                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all border ${
                      isInterested 
                        ? 'bg-emerald-500 text-white border-transparent shadow-lg shadow-emerald-500/20' 
                        : 'bg-white/5 hover:bg-white/10 text-dark-text border-white/10'
                    }`}
                  >
                    <ThumbsUp className={`w-4 h-4 ${isInterested ? 'fill-white' : ''}`} />
                    <span>{isInterested ? 'Interested ✓' : "I'm Interested"}</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-extrabold bg-white/5 hover:bg-white/10 text-dark-text border border-white/10 transition-all"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-brand-primary" />}
                    <span>{copied ? 'Link Copied!' : 'Share Event'}</span>
                  </button>

                  <a
                    href={googleCalendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-extrabold bg-white/5 hover:bg-white/10 text-dark-text border border-white/10 transition-all"
                  >
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <span>+ Add to Calendar</span>
                  </a>
                </div>

                {/* Date & Location Section */}
                <div className="space-y-4 p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-dark-muted">Date & Location</h3>

                  <div className="flex items-start space-x-3.5">
                    <div className="p-2.5 rounded-xl bg-brand-primary/10 text-brand-primary flex-shrink-0 mt-0.5">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-dark-text">
                        {event.date} {event.time ? `• ${event.time}` : '• 8:00 PM to 11:30 PM (IST)'}
                      </p>
                      <a
                        href={googleCalendarUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-brand-primary hover:underline inline-flex items-center gap-1 mt-0.5"
                      >
                        Add to Calendar →
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3.5 pt-3 border-t border-white/5">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 flex-shrink-0 mt-0.5">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-sm text-dark-text">{event.location}</p>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-emerald-400 hover:underline inline-flex items-center gap-1"
                      >
                        View on map 🗺️
                      </a>
                    </div>
                  </div>
                </div>

                {/* Interested Audience Bar */}
                <div className="flex items-center space-x-3 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                  <div className="flex -space-x-2 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-dark-bg">JP</div>
                    <div className="w-8 h-8 rounded-full bg-purple-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-dark-bg">SG</div>
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-dark-bg">AC</div>
                  </div>
                  <p className="text-xs font-bold text-emerald-400">
                    🔥 <span className="font-extrabold">{interestedCount}+ people</span> are Interested in this event
                  </p>
                </div>

                {/* About the Event Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-black text-dark-text">About the event</h3>
                  <p className="text-sm text-dark-muted leading-relaxed whitespace-pre-line">
                    {event.description || 'Join us for an unforgettable live event featuring top performances, energetic crowds, and amazing networking opportunities in Ahmedabad!'}
                  </p>

                  {/* Highlights Checklist */}
                  <div className="pt-4 space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-dark-muted">Event Highlights</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center space-x-2.5 text-xs text-dark-text font-semibold p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>Live Band Performances</span>
                      </div>
                      <div className="flex items-center space-x-2.5 text-xs text-dark-text font-semibold p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>Networking with Enthusiasts</span>
                      </div>
                      <div className="flex items-center space-x-2.5 text-xs text-dark-text font-semibold p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>Instagram-Worthy Moments</span>
                      </div>
                      <div className="flex items-center space-x-2.5 text-xs text-dark-text font-semibold p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>Premium Event Experience</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location & Interactive Google Map Preview */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-dark-muted">Location & Address</h3>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.location || '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-emerald-400 hover:underline inline-flex items-center gap-1 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20"
                    >
                      Open in Maps <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-dark-text">{event.title}</p>
                      <p className="text-xs text-dark-muted mt-0.5">{event.location}</p>
                    </div>
                  </div>

                  {event.location && (
                    <div className="w-full h-56 rounded-2xl overflow-hidden border border-white/10 shadow-lg relative">
                      <iframe
                        title="Event Location Map"
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(event.location)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                        className="w-full h-full border-0"
                        loading="lazy"
                        scrolling="no"
                      ></iframe>
                    </div>
                  )}
                </div>

              </div>

              {/* Right Column: Floating Booking Box (1 Col) */}
              <div className="lg:col-span-1">
                <div className="sticky top-20 glass-card p-6 rounded-3xl border border-white/10 space-y-6 shadow-2xl bg-white/[0.02]">
                  
                  {/* Price Header */}
                  <div>
                    <span className="text-xs font-bold text-dark-muted uppercase tracking-wider">Register for</span>
                    <div className="flex items-baseline space-x-2 mt-1">
                      <span className="text-3xl font-black text-brand-primary">
                        {event.price === 0 ? 'Free' : `₹${event.price}`}
                      </span>
                      {event.price > 0 && <span className="text-xs text-dark-muted font-medium">/ person</span>}
                    </div>
                  </div>

                  {/* Remaining Tickets Indicator */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-dark-muted">Availability</span>
                      <span className="text-emerald-400">{remainingTickets} tickets remaining</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (remainingTickets / (event.tickets_total || 100)) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Book Tickets CTA Button */}
                  {remainingTickets <= 0 ? (
                    <button
                      disabled
                      className="w-full py-4 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-400 font-extrabold text-sm opacity-80 cursor-not-allowed text-center"
                    >
                      Sold Out
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onClose();
                        if (onBookNow) onBookNow(event);
                      }}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-primary via-blue-600 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-extrabold text-sm shadow-xl shadow-blue-500/20 hover:scale-[1.02] transition-all flex items-center justify-center space-x-2"
                    >
                      <Ticket className="w-5 h-5 animate-pulse" />
                      <span>Book Tickets Now</span>
                    </button>
                  )}

                  {/* E-Ticket Scan Feature Note */}
                  <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-start space-x-3 text-xs text-blue-300">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="leading-relaxed font-medium">
                      E-tickets make event day easier — just show up and scan your QR ticket at entry.
                    </p>
                  </div>

                </div>
              </div>

            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EventDetailModal;
