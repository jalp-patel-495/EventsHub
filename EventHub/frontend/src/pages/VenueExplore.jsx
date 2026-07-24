import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { BACKEND_URL } from '../api/api';
import { motion } from 'framer-motion';
import { Building, Star, MapPin, Search, ArrowRight, Filter, RefreshCw, CheckCircle2 } from 'lucide-react';

const VenueExplore = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [facility, setFacility] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [hasCatering, setHasCatering] = useState(false);
  const [hasDj, setHasDj] = useState(false);
  const [hasDecor, setHasDecor] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (facility) params.facility = facility;
      if (minPrice) params.min_price = minPrice;
      if (maxPrice) params.max_price = maxPrice;
      if (hasCatering) params.has_catering = 'true';
      if (hasDj) params.has_dj = 'true';
      if (hasDecor) params.has_decor = 'true';

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
  }, [search, facility, hasCatering, hasDj, hasDecor]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchVenues();
  };

  const handleResetFilters = () => {
    setSearch('');
    setFacility('');
    setMinPrice('');
    setMaxPrice('');
    setHasCatering(false);
    setHasDj(false);
    setHasDecor(false);
  };

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
    <div className="w-full max-w-none px-4 sm:px-6 lg:px-12 py-10 bg-dark-bg min-h-screen">
      {/* Hero Header */}
      <div className="w-full mb-8 relative text-left">
        <div className="absolute top-1/2 left-0 w-96 h-48 bg-gradient-to-tr from-brand-primary/10 to-indigo-500/10 blur-[80px] -z-10 rounded-full" />
        <h1 className="text-4xl sm:text-5xl font-extrabold font-display text-dark-text mb-3">
          Premium Event <span className="text-brand-primary">Venue Plots</span>
        </h1>
        <p className="text-sm sm:text-base text-dark-muted max-w-2xl">
          Explore and book premium event spaces, party plots, and banquet halls across Ahmedabad.
        </p>
      </div>

      <div className="w-full space-y-8">
        {/* Full-Width Search & Filter Bar (Matching Event Explore Style) */}
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          {/* Keyword Search Input */}
          <div className="lg:col-span-2 relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dark-muted">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search venue names, party plots, locations..."
              className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-sm"
            />
          </div>
          
          {/* Facility / Category Select */}
          <div>
            <select
              value={facility}
              onChange={(e) => setFacility(e.target.value)}
              className="glass-input w-full px-4 py-3 rounded-xl text-sm cursor-pointer"
            >
              <option value="">All Venues & Facilities</option>
              <option value="catering">In-house Catering Support</option>
              <option value="dj">DJ & Sound System Setup</option>
              <option value="decor">Stage Decoration Services</option>
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
              className="flex-grow bg-brand-primary hover:bg-emerald-600 text-white font-medium py-3 px-6 rounded-xl transition-colors shadow-md shadow-emerald-950/20 text-sm font-bold uppercase tracking-wider"
            >
              Search Venues
            </button>
          </div>
        </form>

        {/* Expandable Filter Panel */}
        {showFilters && (
          <div className="glass-panel rounded-2xl p-6 mb-8 border border-white/10 space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-brand-primary" />
                <h3 className="font-bold text-dark-text text-sm">Refine Venue Criteria</h3>
              </div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-brand-primary hover:underline flex items-center space-x-1 font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Min & Max Price per day */}
              <div>
                <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">Price Per Day (₹)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="Min ₹"
                    className="glass-input w-full px-3 py-2 rounded-lg text-xs"
                  />
                  <span className="text-dark-muted">-</span>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Max ₹"
                    className="glass-input w-full px-3 py-2 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Service Checkboxes */}
              <div className="lg:col-span-3 space-y-2">
                <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">Required Services & Amenities</label>
                <div className="flex flex-wrap gap-4 pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl border border-white/5 text-xs text-dark-text transition-all">
                    <input
                      type="checkbox"
                      checked={hasCatering}
                      onChange={(e) => setHasCatering(e.target.checked)}
                      className="rounded border-white/10 text-brand-primary focus:ring-0"
                    />
                    <span>In-House Catering Available</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl border border-white/5 text-xs text-dark-text transition-all">
                    <input
                      type="checkbox"
                      checked={hasDj}
                      onChange={(e) => setHasDj(e.target.checked)}
                      className="rounded border-white/10 text-brand-primary focus:ring-0"
                    />
                    <span>DJ & Sound Equipment Available</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl border border-white/5 text-xs text-dark-text transition-all">
                    <input
                      type="checkbox"
                      checked={hasDecor}
                      onChange={(e) => setHasDecor(e.target.checked)}
                      className="rounded border-white/10 text-brand-primary focus:ring-0"
                    />
                    <span>Stage Decoration Services</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={fetchVenues}
                className="bg-brand-primary text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-emerald-600 transition-colors uppercase tracking-wider"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Venues Grid */}
        {loading ? (
          <div className="py-24 flex justify-center">
            <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : venues.length === 0 ? (
          <div className="w-full text-center py-20 text-dark-muted glass-panel rounded-2xl p-12 border border-white/5">
            <Building className="w-12 h-12 mx-auto mb-3 text-dark-muted opacity-50" />
            <p className="text-base font-bold text-dark-text">No venue plots found</p>
            <p className="text-xs text-dark-muted mt-1">Try adjusting your search criteria or resetting filters.</p>
            {(search || facility || minPrice || maxPrice || hasCatering || hasDj || hasDecor) && (
              <button
                onClick={handleResetFilters}
                className="mt-4 px-4 py-2 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary rounded-xl text-xs font-bold hover:bg-brand-primary/20 transition-all"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            {venues.map((venue) => (
              <motion.div
                key={venue.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-dark-card border border-dark-border rounded-3xl overflow-hidden shadow-lg hover:shadow-xl hover:border-brand-primary/20 transition-all flex flex-col h-full"
              >
                {/* Image */}
                {venue.image ? (
                  <img
                    src={venue.image.startsWith('http') ? venue.image : `${BACKEND_URL}${venue.image}`}
                    alt={venue.name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-white/5 flex items-center justify-center text-dark-muted border-b border-dark-border">
                    <Building className="w-12 h-12" />
                  </div>
                )}

                {/* Details */}
                <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-lg font-bold text-dark-text leading-snug">{venue.name}</h3>
                      <span className="text-sm font-black text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-xl flex-shrink-0">
                        ₹{parseFloat(venue.price_per_day).toLocaleString('en-IN')}/day
                      </span>
                    </div>

                    <div className="flex items-center space-x-1 text-xs text-amber-500 font-semibold">
                      <Star className="w-4 h-4 fill-amber-500" />
                      <span>{venue.rating_avg || '0.0'} ({venue.rating_count || 0} reviews)</span>
                    </div>

                    <p className="text-xs text-dark-muted line-clamp-3 leading-relaxed">{venue.description}</p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex items-center space-x-2 text-xs text-dark-muted">
                      <MapPin className="w-4 h-4 text-brand-primary flex-shrink-0" />
                      <span className="truncate">{venue.location}</span>
                    </div>

                    <button
                      onClick={() => handleBookClick(venue)}
                      className="w-full bg-brand-primary hover:bg-emerald-600 text-white py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-colors shadow-md flex items-center justify-center space-x-2"
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
