import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import { motion } from 'framer-motion';
import { Building, Star, MapPin, Search, ArrowRight } from 'lucide-react';

const VenueExplore = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      const res = await api.get('venues/listings/', { params });
      setVenues(res.data);
    } catch (err) {
      console.error('Error fetching venues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, [search]);

  const handleBookClick = (venue) => {
    if (isAuthenticated) {
      navigate(`/bookings?tab=venues&book=${venue.id}`);
    } else {
      navigate('/login', {
        state: {
          from: {
            pathname: '/bookings',
            search: `?tab=venues&book=${venue.id}`
          }
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d0f14] py-12 px-4 sm:px-6 lg:px-8">
      {/* Hero Header */}
      <div className="max-w-7xl mx-auto text-center mb-12 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-48 bg-gradient-to-tr from-brand-primary/10 to-indigo-500/10 blur-[80px] -z-10 rounded-full" />
        <h1 className="text-4xl sm:text-5xl font-extrabold font-display text-slate-900 dark:text-white mb-4">
          Premium Event <span className="text-brand-primary">Venue Plots</span>
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Explore and book premium event spaces, party plots, and banquet halls across Ahmedabad.
        </p>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Search Filter */}
        <div className="max-w-md mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-md flex items-center space-x-3">
          <Search className="w-5 h-5 text-dark-muted flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search venue names or locations..."
            className="w-full bg-transparent text-sm text-slate-800 dark:text-white focus:outline-none"
          />
        </div>

        {/* Venues Grid */}
        {loading ? (
          <div className="py-24 flex justify-center">
            <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : venues.length === 0 ? (
          <div className="text-center py-24 text-slate-600 dark:text-slate-400">
            No approved venue plots found matching your criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {venues.map((venue) => (
              <motion.div
                key={venue.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-lg hover:shadow-xl dark:shadow-none hover:border-brand-primary/20 transition-all flex flex-col h-full"
              >
                {/* Image */}
                {venue.image ? (
                  <img
                    src={venue.image.startsWith('http') ? venue.image : `http://127.0.0.1:8000${venue.image}`}
                    alt={venue.name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-600 border-b border-slate-200 dark:border-slate-800">
                    <Building className="w-12 h-12" />
                  </div>
                )}

                {/* Details */}
                <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">{venue.name}</h3>
                      <span className="text-sm font-black text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-xl flex-shrink-0">
                        ₹{parseFloat(venue.price_per_day).toLocaleString('en-IN')}/day
                      </span>
                    </div>

                    <div className="flex items-center space-x-1 text-xs text-amber-500 font-semibold">
                      <Star className="w-4 h-4 fill-amber-500" />
                      <span>{venue.rating_avg || '0.0'} ({venue.rating_count || 0} reviews)</span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">{venue.description}</p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                      <MapPin className="w-4 h-4 text-brand-primary flex-shrink-0" />
                      <span className="truncate">{venue.location}</span>
                    </div>

                    <button
                      onClick={() => handleBookClick(venue)}
                      className="w-full bg-brand-primary hover:bg-[#0ea5e9] text-white py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-colors shadow-md flex items-center justify-center space-x-2"
                    >
                      <span>Book Venue Plot</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VenueExplore;
