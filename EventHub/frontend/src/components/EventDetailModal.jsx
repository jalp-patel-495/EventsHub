import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Calendar, MapPin, Star, Heart, Share2, 
  Ticket, CheckCircle2, Sparkles, ExternalLink, 
  ThumbsUp, Check, Mail, Phone, IndianRupee, Users, Tag, ArrowRight
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

  const mapEmbedUrl = event.location 
    ? `https://maps.google.com/maps?q=${encodeURIComponent(event.location)}&t=&z=14&ie=UTF8&iwloc=&output=embed`
    : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md">
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
            <span className="text-xs font-black uppercase tracking-wider text-brand-primary flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-primary animate-pulse" />
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
              <span className="absolute top-4 left-4 bg-brand-primary/90 backdrop-blur-md text-white text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-lg border border-blue-400/20">
                {event.category?.name || event.category || 'Music'}
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
                    {ratingAvg ? `${ratingAvg} (${reviewsCount} ${reviewsCount === 1 ? 'Review' : 'Reviews'})` : (reviewsCount > 0 ? `${reviewsCount} ${reviewsCount === 1 ? 'Review' : 'Reviews'}` : 'New Event (No Reviews Yet)')}
                  </span>
                </span>
              </div>
            </div>

            {/* 2. Main Title, Organizer Header & Actions */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/10">
              <div className="space-y-3">
                {showHostBox && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-primary to-purple-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md uppercase flex-shrink-0">
                      {hostName[0]}
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-dark-muted uppercase tracking-wider">Event Organizer</h3>
                      <p className="text-sm font-bold text-dark-text flex items-center gap-1.5">
                        <span>{hostName}</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 inline" />
                      </p>
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
                )}

                <h1 className="text-2xl sm:text-3xl font-black text-dark-text tracking-tight">
                  {event.title}
                </h1>
              </div>

              {/* Share & Quick Action */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleToggleInterested}
                  className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                    isInterested 
                      ? 'bg-emerald-500 text-white border-transparent shadow-lg shadow-emerald-500/20' 
                      : 'bg-white/5 hover:bg-white/10 text-dark-text border-white/10'
                  }`}
                >
                  <ThumbsUp className={`w-4 h-4 ${isInterested ? 'fill-white' : ''}`} />
                  <span>{isInterested ? 'Interested ✓' : "I'm Interested"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-white/5 hover:bg-white/10 text-dark-text px-4 py-2.5 rounded-xl border border-white/10 text-xs font-bold transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{copied ? 'Link Copied! 📋' : 'Share Event'}</span>
                </button>
              </div>
            </div>

            {/* 3. Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-blue-400 mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-dark-muted">Ticket Price</span>
                  <IndianRupee className="w-4 h-4" />
                </div>
                <p className="text-xl font-black text-brand-primary">
                  {event.price === 0 ? 'Free' : `₹${event.price}`}
                  {event.price > 0 && <span className="text-xs text-dark-muted font-normal"> /person</span>}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-emerald-400 mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-dark-muted">Availability</span>
                  <Ticket className="w-4 h-4" />
                </div>
                <p className="text-xl font-black text-emerald-400">
                  {remainingTickets}
                  <span className="text-xs text-dark-muted font-normal"> remaining</span>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-amber-400 mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-dark-muted">Event Category</span>
                  <Tag className="w-4 h-4" />
                </div>
                <p className="text-sm font-bold text-dark-text truncate mt-1">
                  {event.category?.name || event.category || 'Music'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-purple-400 mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-dark-muted">Date & Time</span>
                  <Calendar className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-purple-300 mt-1 truncate">
                  {event.date} {event.time ? `• ${event.time}` : ''}
                </p>
              </div>
            </div>

            {/* Interested Audience Indicator Bar */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
              <div className="flex items-center space-x-3">
                <div className="flex -space-x-2 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-dark-bg">JP</div>
                  <div className="w-8 h-8 rounded-full bg-purple-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-dark-bg">SG</div>
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-dark-bg">AC</div>
                </div>
                <p className="text-xs font-bold text-emerald-400">
                  🔥 <span className="font-extrabold">{interestedCount}+ people</span> are Interested in this event
                </p>
              </div>
              <a
                href={googleCalendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1 bg-brand-primary/10 px-3 py-1.5 rounded-xl border border-brand-primary/20"
              >
                + Add to Calendar
              </a>
            </div>

            {/* 4. About the Event */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-dark-muted">About This Event</h3>
              <p className="text-sm text-dark-text/90 leading-relaxed font-normal bg-white/[0.01] p-5 rounded-2xl border border-white/5 whitespace-pre-wrap">
                {event.description || 'Join us for an extraordinary experience at this event in Ahmedabad! Whether you are looking to learn, network, or simply enjoy yourself, this event is designed to offer premium engagement and memorable moments.'}
              </p>

              {/* Event Highlights Checklist */}
              <div className="pt-2 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-dark-muted">Event Highlights</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2.5 text-xs text-dark-text font-semibold p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Live Band & Performances</span>
                  </div>
                  <div className="flex items-center space-x-2.5 text-xs text-dark-text font-semibold p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Networking with Enthusiasts</span>
                  </div>
                  <div className="flex items-center space-x-2.5 text-xs text-dark-text font-semibold p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Instagram-Worthy Moments</span>
                  </div>
                  <div className="flex items-center space-x-2.5 text-xs text-dark-text font-semibold p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Premium Event Experience</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Location & Interactive Google Map Preview */}
            <div className="space-y-4">
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

              {mapEmbedUrl && (
                <div className="w-full h-56 rounded-2xl overflow-hidden border border-white/10 shadow-lg relative">
                  <iframe
                    title="Event Location Map"
                    src={mapEmbedUrl}
                    className="w-full h-full border-0"
                    loading="lazy"
                    scrolling="no"
                  ></iframe>
                </div>
              )}
            </div>

          </div>

          {/* Sticky Bottom Footer Booking Bar */}
          <div className="sticky bottom-0 z-20 flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-dark-bg/95 backdrop-blur-md border-t border-white/10">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-dark-muted">Ticket Price</p>
              <p className="text-xl font-black text-brand-primary">
                {event.price === 0 ? 'Free Entry' : `₹${event.price}`}
                {event.price > 0 && <span className="text-xs text-dark-muted font-normal"> /person</span>}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                if (onBookNow) onBookNow(event);
              }}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold px-8 py-3.5 rounded-2xl shadow-xl shadow-blue-500/20 text-sm uppercase tracking-wider flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5"
            >
              <span>Book Tickets Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EventDetailModal;
