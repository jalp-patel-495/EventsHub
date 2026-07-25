import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, MapPin, Star, Heart, Share2, 
  Building, CheckCircle2, Sparkles, Utensils, Music, Palette, Car, IndianRupee, Users, ArrowRight, Mail, Phone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BACKEND_URL } from '../api/api';

const VenueDetailModal = ({ venue, onClose, onBookNow, isWishlisted, onToggleWishlist }) => {
  const { isAuthenticated } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!venue) return null;

  const venueImage = venue.image 
    ? (venue.image.startsWith('http') ? venue.image : `${BACKEND_URL}${venue.image}`)
    : 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&auto=format&fit=crop&q=80';

  const ownerName = venue.owner_details?.first_name 
    ? `${venue.owner_details.first_name} ${venue.owner_details.last_name || ''}`
    : (venue.owner_details?.email || (typeof venue.owner === 'string' ? venue.owner : 'Sumit Gohel'));
  const ownerEmail = venue.owner_details?.email || venue.owner_email || (typeof venue.owner === 'string' ? venue.owner : 'jalppatel4950@gmail.com');
  const ownerPhone = venue.owner_details?.phone || venue.owner_phone || '+91 99887 76655';

  const reviewsCount = venue.reviews && Array.isArray(venue.reviews) ? venue.reviews.length : (venue.rating_count !== undefined ? venue.rating_count : 0);
  const ratingAvg = (venue.rating_avg !== undefined && venue.rating_avg !== null && parseFloat(venue.rating_avg) > 0) 
    ? parseFloat(venue.rating_avg).toFixed(1) 
    : (reviewsCount > 0 && venue.reviews 
        ? (venue.reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviewsCount).toFixed(1)
        : null);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const mapEmbedUrl = venue.location 
    ? `https://maps.google.com/maps?q=${encodeURIComponent(venue.location)}&t=&z=14&ie=UTF8&iwloc=&output=embed`
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
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
              Venue Plot Overview & Details
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
                src={venueImage}
                alt={venue.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-transparent to-black/30" />

              {/* Category Tag */}
              <span className="absolute top-4 left-4 bg-emerald-600/90 backdrop-blur-md text-white text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-lg border border-emerald-400/20">
                {venue.category || 'Party Plot / Lawn'}
              </span>

              {/* Wishlist Heart Button */}
              <button
                type="button"
                onClick={() => onToggleWishlist && onToggleWishlist(venue.id)}
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
                    {ratingAvg ? `${ratingAvg} (${reviewsCount} ${reviewsCount === 1 ? 'Review' : 'Reviews'})` : (reviewsCount > 0 ? `${reviewsCount} ${reviewsCount === 1 ? 'Review' : 'Reviews'}` : 'New Listing (No Reviews Yet)')}
                  </span>
                </span>
              </div>
            </div>

            {/* 2. Main Title, Owner Header & Actions */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/10">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 text-white font-extrabold flex items-center justify-center text-sm shadow-md uppercase flex-shrink-0">
                    {ownerName[0]}
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-dark-muted uppercase tracking-wider">Property Owner</h3>
                    <p className="text-sm font-bold text-dark-text flex items-center gap-1.5">
                      <span>{ownerName}</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 inline" />
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-dark-muted mt-1">
                      <span className="flex items-center gap-1.5 text-slate-200 font-medium bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                        <Mail className="w-3.5 h-3.5 text-brand-primary" />
                        <span>{ownerEmail}</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-200 font-medium bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{ownerPhone}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-dark-text tracking-tight">
                  {venue.name}
                </h1>
              </div>

              {/* Share & Quick Action */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-white/5 hover:bg-white/10 text-dark-text px-4 py-2.5 rounded-xl border border-white/10 text-xs font-bold transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{copied ? 'Link Copied! 📋' : 'Share Venue'}</span>
                </button>
              </div>
            </div>

            {/* 3. Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-emerald-400 mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-dark-muted">Daily Rent</span>
                  <IndianRupee className="w-4 h-4" />
                </div>
                <p className="text-xl font-black text-emerald-400">
                  ₹{parseFloat(venue.price_per_day || 0).toLocaleString('en-IN')}
                  <span className="text-xs text-dark-muted font-normal"> /day</span>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-blue-400 mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-dark-muted">Guest Capacity</span>
                  <Users className="w-4 h-4" />
                </div>
                <p className="text-xl font-black text-blue-400">
                  {venue.capacity || '1,000+'}
                  <span className="text-xs text-dark-muted font-normal"> guests</span>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-amber-400 mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-dark-muted">Property Category</span>
                  <Building className="w-4 h-4" />
                </div>
                <p className="text-sm font-bold text-dark-text truncate mt-1">
                  {venue.category || 'Party Plot'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-purple-400 mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-dark-muted">Location City</span>
                  <MapPin className="w-4 h-4" />
                </div>
                <p className="text-sm font-bold text-purple-300 mt-1">
                  Ahmedabad, GJ
                </p>
              </div>
            </div>

            {/* 4. Amenities & Services Badges */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-dark-muted">Available Venue Amenities & Services</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className={`p-3.5 rounded-2xl border flex items-center space-x-3 transition-all ${
                  venue.has_catering ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/[0.01] border-white/5 text-dark-muted opacity-50'
                }`}>
                  <Utensils className="w-5 h-5 flex-shrink-0" />
                  <span className="text-xs font-bold">{venue.has_catering ? 'Catering Included' : 'No Catering'}</span>
                </div>

                <div className={`p-3.5 rounded-2xl border flex items-center space-x-3 transition-all ${
                  venue.has_dj ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-white/[0.01] border-white/5 text-dark-muted opacity-50'
                }`}>
                  <Music className="w-5 h-5 flex-shrink-0" />
                  <span className="text-xs font-bold">{venue.has_dj ? 'DJ & Sound System' : 'No DJ System'}</span>
                </div>

                <div className={`p-3.5 rounded-2xl border flex items-center space-x-3 transition-all ${
                  venue.has_decoration ? 'bg-pink-500/10 border-pink-500/20 text-pink-400' : 'bg-white/[0.01] border-white/5 text-dark-muted opacity-50'
                }`}>
                  <Sparkles className="w-5 h-5 flex-shrink-0" />
                  <span className="text-xs font-bold">{venue.has_decoration ? 'Theme Decoration' : 'Standard Decor'}</span>
                </div>

                <div className={`p-3.5 rounded-2xl border flex items-center space-x-3 transition-all ${
                  venue.has_parking ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-white/[0.01] border-white/5 text-dark-muted opacity-50'
                }`}>
                  <Car className="w-5 h-5 flex-shrink-0" />
                  <span className="text-xs font-bold">{venue.has_parking ? 'Valet & Parking' : 'Limited Parking'}</span>
                </div>
              </div>
            </div>

            {/* 5. Venue Description */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-dark-muted">About This Venue Plot</h3>
              <p className="text-sm text-dark-text/90 leading-relaxed font-normal bg-white/[0.01] p-5 rounded-2xl border border-white/5 whitespace-pre-wrap">
                {venue.description || 'Experience high quality event management and lawn spaces perfect for weddings, corporate galas, musical nights, and grand celebrations.'}
              </p>
            </div>

            {/* 6. Location & Map Preview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-dark-muted">Location & Address</h3>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-dark-text">{venue.name}</p>
                  <p className="text-xs text-dark-muted mt-0.5">{venue.location}</p>
                </div>
              </div>

              {mapEmbedUrl && (
                <div className="w-full h-56 rounded-2xl overflow-hidden border border-white/10 shadow-lg relative">
                  <iframe
                    title="Venue Location Map"
                    src={mapEmbedUrl}
                    className="w-full h-full border-0 pointer-events-none"
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
              <p className="text-[10px] font-bold uppercase tracking-wider text-dark-muted">Total Rental Rate</p>
              <p className="text-xl font-black text-emerald-400">
                ₹{parseFloat(venue.price_per_day || 0).toLocaleString('en-IN')}
                <span className="text-xs text-dark-muted font-normal"> /day</span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                if (onBookNow) onBookNow(venue);
              }}
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold px-8 py-3.5 rounded-2xl shadow-xl shadow-emerald-500/20 text-sm uppercase tracking-wider flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5"
            >
              <span>Book Venue Plot Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default VenueDetailModal;
