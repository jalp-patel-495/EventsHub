import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import AICateringPlanner from '../components/AICateringPlanner';
import AICateringChatbot from '../components/AICateringChatbot';

const CateringExplore = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [guestsLimit, setGuestsLimit] = useState('');
  const [ordering, setOrdering] = useState('');
  
  // Compare state
  const [compareList, setCompareList] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const fetchCatering = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (cuisine) params.cuisine_type = cuisine;
      if (priceMax) params.price_max = priceMax;
      if (guestsLimit) {
        params.min_guests = guestsLimit;
        params.max_guests = guestsLimit;
      }
      if (ordering) params.ordering = ordering;

      const res = await api.get('/api/catering/catering-services/', { params });
      setServices(res.data);
    } catch (err) {
      console.error('Error fetching catering services:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatering();
  }, [search, cuisine, priceMax, guestsLimit, ordering]);

  const handleCompareSelect = (service) => {
    if (compareList.find(item => item.id === service.id)) {
      setCompareList(prev => prev.filter(item => item.id !== service.id));
    } else {
      if (compareList.length >= 3) {
        alert("You can compare a maximum of 3 catering providers.");
        return;
      }
      setCompareList(prev => [...prev, service]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d0f14] py-12 px-4 sm:px-6 lg:px-8">
      {/* Hero Header */}
      <div className="max-w-7xl mx-auto text-center mb-12 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-48 bg-gradient-to-tr from-brand-primary/10 to-indigo-500/10 blur-[80px] -z-10 rounded-full" />
        <h1 className="text-4xl sm:text-5xl font-extrabold font-display text-slate-900 dark:text-white mb-4">
          Premium Event <span className="text-brand-primary">Catering Services</span>
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Browse top-tier caterers, design custom menus with AI helpers, and bundle catering with party plots for a complete event bundle.
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Filters & AI Tools Column (Left) */}
        <div className="lg:col-span-4 space-y-8">
          {/* Quick Filters */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Filter Caterers</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Search name/cuisine</label>
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="e.g. Punjabi, Gujarati"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm rounded-xl px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Cuisine Type</label>
                <select 
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm rounded-xl px-3 py-2 text-slate-800 dark:text-white focus:outline-none"
                >
                  <option value="">All Cuisines</option>
                  <option value="Gujarati">Gujarati</option>
                  <option value="Punjabi">Punjabi</option>
                  <option value="South Indian">South Indian</option>
                  <option value="Italian">Italian</option>
                  <option value="Chinese">Chinese</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Max price per plate (₹)</label>
                <input 
                  type="number"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm rounded-xl px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Expected Guests</label>
                <input 
                  type="number"
                  value={guestsLimit}
                  onChange={(e) => setGuestsLimit(e.target.value)}
                  placeholder="e.g. 200"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm rounded-xl px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Sort By</label>
                <select 
                  value={ordering}
                  onChange={(e) => setOrdering(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm rounded-xl px-3 py-2 text-slate-800 dark:text-white focus:outline-none"
                >
                  <option value="">Default (Newest)</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* AI Helper Widget */}
          <AICateringPlanner />

          {/* AI Assistant Chatbot */}
          <AICateringChatbot />
        </div>

        {/* Listings column (Right) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Compare Toolbar */}
          {compareList.length > 0 && (
            <div className="bg-brand-primary/10 border border-brand-primary/30 p-4 rounded-2xl flex items-center justify-between animate-fade-in">
              <span className="text-sm font-semibold text-brand-primary">
                Selected {compareList.length}/3 providers to compare.
              </span>
              <button 
                onClick={() => setShowCompareModal(true)}
                className="bg-brand-primary hover:bg-rose-600 text-white font-semibold py-2 px-4 rounded-xl text-xs transition-all shadow"
              >
                Compare Packages
              </button>
            </div>
          )}

          {/* Grid Listings */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-slate-500 dark:text-slate-400">Loading catering services...</p>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
              <p className="text-slate-500 dark:text-slate-400 mb-2">No catering providers matched your search.</p>
              <button onClick={() => { setSearch(''); setCuisine(''); setPriceMax(''); setGuestsLimit(''); }} className="text-brand-primary text-sm font-bold underline">Reset Filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {services.map((item) => (
                <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-md hover:shadow-lg transition-all flex flex-col justify-between">
                  <div>
                    {/* Cover image */}
                    <div className="h-44 bg-slate-100 dark:bg-slate-800 relative">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl">
                          🍽️
                        </div>
                      )}
                      <span className="absolute top-3 right-3 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-bold text-xs px-2.5 py-1 rounded-lg">
                        ₹{item.price_per_plate}/plate
                      </span>
                    </div>

                    <div className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider bg-brand-primary/10 px-2 py-0.5 rounded">
                          {item.cuisine_type}
                        </span>
                        <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                          ⭐ {item.average_rating || 'N/A'}
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 leading-tight">
                        {item.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                        {item.description}
                      </p>
                      
                      {item.venue_name && (
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1 mb-2">
                          📍 Offered with: <span className="font-semibold text-brand-primary">{item.venue_name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                    <button 
                      onClick={() => handleCompareSelect(item)}
                      className={`flex-1 border text-xs font-semibold py-2.5 rounded-xl transition-all ${
                        compareList.find(x => x.id === item.id)
                          ? 'bg-slate-100 dark:bg-slate-800 text-brand-primary border-brand-primary/50'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
                      }`}
                    >
                      {compareList.find(x => x.id === item.id) ? 'Selected' : 'Compare'}
                    </button>
                    <Link 
                      to={`/catering/${item.id}`}
                      className="flex-1 bg-brand-primary hover:bg-rose-600 text-white text-center text-xs font-semibold py-2.5 rounded-xl transition-all shadow-sm"
                    >
                      View Packages
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Compare Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full p-6 shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-850 pb-4 mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white font-display">Compare Packages</h3>
              <button 
                onClick={() => setShowCompareModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {compareList.map(item => (
                <div key={item.id} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                  <h4 className="font-bold text-slate-800 dark:text-white text-base mb-1">{item.name}</h4>
                  <span className="text-xs text-brand-primary font-bold block mb-3">Cuisine: {item.cuisine_type}</span>
                  <div className="border-b border-slate-200 dark:border-slate-700 pb-3 mb-3">
                    <span className="text-[10px] text-slate-500 block uppercase">Base Price</span>
                    <span className="text-xl font-extrabold text-slate-800 dark:text-white">₹{item.price_per_plate}</span>
                    <span className="text-[10px] text-slate-500"> / plate</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Capacity limits:</span>
                      <span className="font-semibold text-slate-800 dark:text-white">{item.min_guests} - {item.max_guests} guests</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Avg Rating:</span>
                      <span className="font-semibold text-amber-500">⭐ {item.average_rating || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-350 block mb-2">Available Packages:</span>
                    {item.packages && item.packages.length > 0 ? (
                      <div className="space-y-1">
                        {item.packages.map(pkg => (
                          <div key={pkg.id} className="flex justify-between text-[11px] bg-white dark:bg-slate-800 p-1.5 rounded">
                            <span className="text-slate-600 dark:text-slate-300 font-medium">{pkg.name}</span>
                            <span className="font-bold text-brand-primary">₹{pkg.price_per_plate}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] italic text-slate-400">No specific packages configured.</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button 
                onClick={() => setShowCompareModal(false)}
                className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold py-2 px-6 rounded-xl text-xs transition-all"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CateringExplore;
