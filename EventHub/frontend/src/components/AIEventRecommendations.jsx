/**
 * ================================================================================
 * AI EVENT RECOMMENDATIONS COMPONENT
 * ================================================================================
 * File: frontend/src/components/AIEventRecommendations.jsx
 * 
 * Description:
 * React component that fetches personalized AI event recommendations generated
 * by Scikit-Learn Content-Based Filtering on the Django backend.
 * 
 * Features:
 * - Fetches GET /api/events/recommendations/ using Axios (`api.get`).
 * - Renders dynamic event cards displaying image, title, category, location, date, price, & rating.
 * - Displays badge indicating whether recommendations are Personalized AI Matches or Trending Fallbacks.
 * - Includes interactive "Book Tickets Now" and "Quick View" options.
 * - Production-ready, fully responsive glassmorphism design with Framer Motion animations.
 */

import React, { useState, useEffect } from 'react';
import api, { BACKEND_URL } from '../api/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Calendar, MapPin, Star, Ticket, ArrowRight, Flame, Compass, RefreshCw } from 'lucide-react';
import BookingModal from './BookingModal';
import EventDetailModal from './EventDetailModal';

const AIEventRecommendations = ({ title = "Recommended for You", subtitle = "AI-curated events tailored to your preferences & interests" }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationType, setRecommendationType] = useState('trending'); // 'personalized' or 'trending'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal States
  const [selectedEventForDetail, setSelectedEventForDetail] = useState(null);
  const [selectedEventForBooking, setSelectedEventForBooking] = useState(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('events/recommendations/?limit=6');
      if (response.data && response.data.recommendations) {
        setRecommendations(response.data.recommendations);
        setRecommendationType(response.data.recommendation_type || 'trending');
      } else if (Array.isArray(response.data)) {
        setRecommendations(response.data);
      }
    } catch (err) {
      console.error("Failed to load AI event recommendations:", err);
      setError("Unable to load recommendations at the moment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  return (
    <section className="w-full py-10 my-4 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 text-blue-400 px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin-slow" />
              <span>AI Content Engine</span>
              {recommendationType === 'personalized' ? (
                <span className="ml-1 bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-black border border-emerald-500/30 uppercase">
                  Personalized Match
                </span>
              ) : (
                <span className="ml-1 bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-[10px] font-black border border-amber-500/30 uppercase flex items-center gap-1">
                  <Flame className="w-3 h-3 fill-amber-400" /> Trending Picks
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-dark-text tracking-tight flex items-center gap-2">
              <span>{title}</span>
            </h2>
            <p className="text-xs sm:text-sm text-dark-muted mt-1 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchRecommendations}
            disabled={loading}
            className="self-start md:self-auto px-4 py-2 bg-white/5 hover:bg-white/10 text-dark-muted hover:text-dark-text border border-white/10 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Refresh Recommendations"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Content Body */}
        {loading ? (
          /* Skeleton Loader Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="glass-panel rounded-3xl p-5 space-y-4 animate-pulse border border-white/5">
                <div className="w-full h-48 bg-white/5 rounded-2xl" />
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
                <div className="flex justify-between pt-4 border-t border-white/5">
                  <div className="h-4 bg-white/10 rounded w-1/3" />
                  <div className="h-8 bg-blue-500/20 rounded-xl w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          /* Empty State */
          <div className="glass-panel text-center py-12 rounded-3xl border border-white/5 space-y-3">
            <Compass className="w-10 h-10 text-dark-muted mx-auto opacity-60" />
            <p className="text-sm font-bold text-dark-text">No recommendations available right now</p>
            <p className="text-xs text-dark-muted">Explore our live event directory to get custom recommendations!</p>
          </div>
        ) : (
          /* Recommendations Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((event, idx) => {
              const eventImage = event.image
                ? (event.image.startsWith('http') ? event.image : `${BACKEND_URL}${event.image}`)
                : 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80';

              const categoryName = event.category_details?.name || (typeof event.category === 'string' ? event.category : 'Event');
              const priceText = parseFloat(event.price) === 0 ? 'Free Entry' : `₹${parseFloat(event.price).toLocaleString('en-IN')}`;

              return (
                <motion.div
                  key={event.id || idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="glass-card rounded-3xl overflow-hidden flex flex-col justify-between group border border-white/10 hover:border-blue-500/40 transition-all duration-300 shadow-xl"
                >
                  {/* Event Image & Badges */}
                  <div className="relative h-48 overflow-hidden cursor-pointer" onClick={() => setSelectedEventForDetail(event)}>
                    <img
                      src={eventImage}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-transparent to-black/30" />
                    
                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-black/70 backdrop-blur-md text-blue-400 px-3 py-1 rounded-full border border-blue-500/30">
                        {categoryName}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 px-2.5 py-1 rounded-full shadow-lg">
                        {priceText}
                      </span>
                    </div>

                    {/* AI Score Pill */}
                    <div className="absolute bottom-3 left-3 flex items-center space-x-1.5 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 text-amber-400 text-xs font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{event.rating_avg ? parseFloat(event.rating_avg).toFixed(1) : '4.8'}</span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex flex-col flex-grow justify-between space-y-4">
                    <div className="space-y-2 cursor-pointer" onClick={() => setSelectedEventForDetail(event)}>
                      <h3 className="font-extrabold text-base text-dark-text group-hover:text-blue-400 transition-colors line-clamp-1">
                        {event.title}
                      </h3>
                      
                      <div className="space-y-1 text-xs text-dark-muted">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span>{event.date} {event.time ? `at ${event.time}` : ''}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      </div>

                      <p className="text-xs text-dark-muted/80 line-clamp-2 pt-1 font-normal leading-relaxed">
                        {event.description}
                      </p>
                    </div>

                    {/* Action Footer */}
                    <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                      <button
                        onClick={() => setSelectedEventForDetail(event)}
                        className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-dark-text rounded-xl text-xs font-bold transition-all border border-white/10 flex-1 cursor-pointer"
                      >
                        Quick View
                      </button>
                      <button
                        onClick={() => setSelectedEventForBooking(event)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-blue-950/40 flex items-center justify-center space-x-1.5 flex-1 cursor-pointer"
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        <span>Book Now</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

      </div>

      {/* Modals Integration */}
      {selectedEventForDetail && (
        <EventDetailModal
          event={selectedEventForDetail}
          onClose={() => setSelectedEventForDetail(null)}
          onBookNow={(eventToBook) => {
            setSelectedEventForDetail(null);
            setSelectedEventForBooking(eventToBook);
          }}
          showHostBox={true}
        />
      )}

      {selectedEventForBooking && (
        <BookingModal
          event={selectedEventForBooking}
          isOpen={!!selectedEventForBooking}
          onClose={() => setSelectedEventForBooking(null)}
        />
      )}
    </section>
  );
};

export default AIEventRecommendations;
