import React, { useState, useEffect, useRef } from 'react';
import api from '../api/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Trash2, Edit2, Plus, Sparkles, Building, CheckCircle, XCircle, IndianRupee, Calendar, Upload, X, ShieldAlert, BadgeCheck, MapPin, UtensilsCrossed, Music2, Palette, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

const CUISINE_TEMPLATES = {
  'Gujarati Thali': '2 Sabzis (Paneer & Potato/Green), Dal/Kadhi, Rice/Khichdi, Roti/Puri, 2 Farsan, 1 Sweet, Butter Milk, Papad, Salad',
  'Punjabi': 'Paneer Tikka Masala, Veg Jaipuri, Dal Makhani, Jeera Rice, Butter Naan/Tandoori Roti, 1 Starter, Sweet, Raita, Salad',
  'South Indian': 'Idli, Medu Vada, Masala Dosa, Uttapam, Sambar, Coconut Chutney, Tomato Chutney, Lemon Rice, Payasam',
  'Continental': 'Garlic Bread, Garden Salad, Pasta Alfredo, Veg Lasagna, Baked Vegetables, Potato Wedges, Caramel Custard',
  'Multi-Cuisine Buffet': '2 Starters, 1 Soup, Paneer Curry, Mix Veg, Dal Fry, Veg Biryani, Assorted Breads, 2 Desserts, Ice Cream, Salad Bar',
  'Chinese': 'Veg Manchurian Dry, Spring Rolls, Hakka Noodles, Schezwan Fried Rice, Veg Ball in Garlic Sauce, Hot & Sour Soup',
  'Rajasthani': 'Dal Baati Churma, Gatte ki Sabzi, Ker Sangri, Lehsun ki Chutney, Missi Roti, Steamed Rice, Sweet Lassi',
  'Custom / Mixed': 'Custom customized menu containing choice of Punjabi, Chinese, and Indian desserts according to event preferences.'
};

const DJ_TEMPLATES = {
  'Standard DJ': {
    price: '5000',
    equipment: '2x 15-inch Speakers, Basic DJ Mixer, Wired Mic, 2x RGB LED Lights'
  },
  'Premium Club DJ': {
    price: '10000',
    equipment: '4x JBL Subwoofers & Speakers, Pioneer DJ Controller, Wireless Mics, 4x Moving Heads, Fog Machine'
  },
  'Grand Punjabi Dhol + DJ': {
    price: '18000',
    equipment: 'JBL Line Array Sound System, Professional DJ setup, LED screen backdrop, Truss lighting, 2x Live Dhol players'
  },
  'Custom DJ Setup': {
    price: '',
    equipment: ''
  }
};

const DECOR_TEMPLATES = {
  'Classic Floral Decor': {
    price: '15000',
    description: 'Entrance gate marigold/rose arches, stage flower decoration, pathway lights'
  },
  'Royal Palace Theme': {
    price: '25000',
    description: 'Palace entrance gates, chandelier lighting, royal sofa seating, velvet drapes'
  },
  'Minimalist Lights & Backdrop': {
    price: '8000',
    description: 'Fairy lights canopy, simple print backdrop, clean white chair covers'
  },
  'Bollywood Glamour Theme': {
    price: '30000',
    description: 'Red carpet entry, film roll frames, LED wash lights, glitter stage backdrop'
  },
  'Custom Decoration Setup': {
    price: '',
    description: ''
  }
};

const PlotOwnerDashboard = () => {
  const { user } = useAuth();
  
  // States
  const [venues, setVenues] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const routeLocation = useLocation();
  const navigate = useNavigate();
  const activeTab = routeLocation.pathname === '/venues/requests'
    ? 'requests'
    : routeLocation.pathname === '/venues/reviews'
      ? 'reviews'
      : routeLocation.pathname === '/venues/calendar'
        ? 'calendar'
        : 'venues';
  const setActiveTab = (tabId) => {
    const paths = {
      venues: '/venues/manage',
      requests: '/venues/requests',
      reviews: '/venues/reviews',
      calendar: '/venues/calendar'
    };
    navigate(paths[tabId] || '/venues/manage');
  };
 
  // Sub-facilities configure states
  const [hasCatering, setHasCatering] = useState(false);
  const [cateringPricePerPlate, setCateringPricePerPlate] = useState('');
  const [cateringDescription, setCateringDescription] = useState('');
  const [cateringCuisine, setCateringCuisine] = useState('');
  const [cateringMinPlates, setCateringMinPlates] = useState('');
 
  const [hasDj, setHasDj] = useState(false);
  const [djPrice, setDjPrice] = useState('');
  const [djEquipment, setDjEquipment] = useState('');
  const [djPackage, setDjPackage] = useState('');

  const [hasDecor, setHasDecor] = useState(false);
  const [decorPrice, setDecorPrice] = useState('');
  const [decorThemes, setDecorThemes] = useState('');

  const [cateringOptions, setCateringOptions] = useState([
    { name: 'Standard Gujarati Menu', price: '350', description: '2 Sabzis, Dal/Kadhi, Rice, Roti, 2 Farsan, 1 Sweet' }
  ]);
  const [djOptions, setDjOptions] = useState([
    { name: 'Standard DJ Setup', price: '8000', equipment: '2x 15-inch Speakers, Basic Mixer, Wired Mic' }
  ]);
  const [decorOptions, setDecorOptions] = useState([
    { name: 'Classic Floral Decor', price: '15000', description: 'Entrance gate flowers, stage background, pathway lights' }
  ]);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [pricePerDay, setPricePerDay] = useState('');
  const [capacity, setCapacity] = useState('');
  const [facilities, setFacilities] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // These are the badge-only facilities (non-service ones)
  const facilityBadgeOptions = [
    "Parking Space",
    "Stage Setup",
    "Central AC",
    "Restrooms",
    "Sound & Lighting",
    "Generator Backup",
    "CCTV Security",
    "WiFi",
    "Changing Rooms",
  ];

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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [venuesRes, bookingsRes] = await Promise.all([
        api.get(`venues/listings/?owner=${user.id}`),
        api.get('venues/bookings/')
      ]);
      setVenues(venuesRes.data.results || venuesRes.data);
      setBookings(bookingsRes.data);
    } catch (err) {
      console.error("Error loading plot owner dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setLocation('');
    setPricePerDay('');
    setCapacity('');
    setFacilities([]);
    setImageFile(null);
    setImagePreview('');
    setFormError('');
    setHasCatering(false);
    setCateringPricePerPlate('');
    setCateringDescription('');
    setCateringCuisine('');
    setCateringMinPlates('');
    setCateringOptions([
      { name: 'Standard Gujarati Menu', price: '350', description: '2 Sabzis, Dal/Kadhi, Rice, Roti, 2 Farsan, 1 Sweet' }
    ]);
    setHasDj(false);
    setDjPrice('');
    setDjEquipment('');
    setDjPackage('');
    setDjOptions([
      { name: 'Standard DJ Setup', price: '8000', equipment: '2x 15-inch Speakers, Basic Mixer, Wired Mic' }
    ]);
    setHasDecor(false);
    setDecorPrice('');
    setDecorThemes('');
    setDecorOptions([
      { name: 'Classic Floral Decor', price: '15000', description: 'Entrance gate flowers, stage background, pathway lights' }
    ]);
  };

  const handleOpenCreateModal = () => {
    setEditingVenue(null);
    resetForm();
    setModalOpen(true);
  };

  const handleOpenEditModal = (venue) => {
    setEditingVenue(venue);
    setName(venue.name);
    setDescription(venue.description);
    setLocation(venue.location);
    setPricePerDay(venue.price_per_day);
    setCapacity(venue.capacity || '');
    setFacilities(venue.facilities || []);
    setImageFile(null);
    setImagePreview(venue.image || '');
    setFormError('');

    setHasCatering(venue.has_catering || false);
    setCateringPricePerPlate(venue.catering_price_per_plate || '');
    setCateringDescription(venue.catering_description || '');
    setCateringCuisine(venue.catering_cuisine || '');
    setCateringMinPlates(venue.catering_min_plates || '');
    setHasDj(venue.has_dj || false);
    setDjPrice(venue.dj_price || '');
    setDjEquipment(venue.dj_equipment || '');
    setDjPackage(venue.dj_package || '');
    setHasDecor(venue.has_decor || false);
    setDecorPrice(venue.decor_price || '');
    setDecorThemes(venue.decor_themes || '');

    const parseJSON = (str, fallback) => {
      try {
        if (!str) return fallback;
        const parsed = JSON.parse(str);
        if (Array.isArray(parsed)) return parsed;
        return fallback;
      } catch (e) {
        if (typeof str === 'string' && str.trim()) {
          return [{ name: 'Standard Option', price: String(venue.catering_price_per_plate || '350'), description: str }];
        }
        return fallback;
      }
    };

    const cateringParsed = parseJSON(venue.catering_description, [
      { name: 'Standard Gujarati Menu', price: String(venue.catering_price_per_plate || '350'), description: '2 Sabzis, Dal/Kadhi, Rice, Roti, 2 Farsan, 1 Sweet' }
    ]);
    setCateringOptions(cateringParsed);

    const djParsed = parseJSON(venue.dj_equipment, [
      { name: 'Standard DJ Setup', price: String(venue.dj_price || '8000'), equipment: '2x 15-inch Speakers, Basic Mixer, Wired Mic' }
    ]);
    setDjOptions(djParsed);

    const decorParsed = parseJSON(venue.decor_themes, [
      { name: 'Classic Floral Decor', price: String(venue.decor_price || '15000'), description: 'Entrance gate flowers, stage background, pathway lights' }
    ]);
    setDecorOptions(decorParsed);

    setModalOpen(true);
  };

  const handleAddCateringOption = () => {
    setCateringOptions([...cateringOptions, { name: '', price: '', description: '' }]);
  };
  const handleRemoveCateringOption = (idx) => {
    setCateringOptions(cateringOptions.filter((_, i) => i !== idx));
  };
  const handleCateringOptionChange = (idx, field, val) => {
    const updated = [...cateringOptions];
    updated[idx][field] = val;
    setCateringOptions(updated);
  };

  const handleAddDjOption = () => {
    setDjOptions([...djOptions, { name: '', price: '', equipment: '' }]);
  };
  const handleRemoveDjOption = (idx) => {
    setDjOptions(djOptions.filter((_, i) => i !== idx));
  };
  const handleDjOptionChange = (idx, field, val) => {
    const updated = [...djOptions];
    updated[idx][field] = val;
    setDjOptions(updated);
  };

  const handleAddDecorOption = () => {
    setDecorOptions([...decorOptions, { name: '', price: '', description: '' }]);
  };
  const handleRemoveDecorOption = (idx) => {
    setDecorOptions(decorOptions.filter((_, i) => i !== idx));
  };
  const handleDecorOptionChange = (idx, field, val) => {
    const updated = [...decorOptions];
    updated[idx][field] = val;
    setDecorOptions(updated);
  };

  const handleCateringOptionSelect = (idx, selectedName) => {
    const updated = [...cateringOptions];
    updated[idx].name = selectedName;
    if (CUISINE_TEMPLATES[selectedName]) {
      updated[idx].description = CUISINE_TEMPLATES[selectedName];
      if (selectedName === 'Gujarati Thali') updated[idx].price = '350';
      else if (selectedName === 'Punjabi') updated[idx].price = '400';
      else if (selectedName === 'South Indian') updated[idx].price = '300';
      else if (selectedName === 'Continental') updated[idx].price = '450';
      else if (selectedName === 'Multi-Cuisine Buffet') updated[idx].price = '500';
      else if (selectedName === 'Chinese') updated[idx].price = '320';
      else if (selectedName === 'Rajasthani') updated[idx].price = '380';
      else if (selectedName === 'Custom / Mixed') updated[idx].price = '350';
    }
    setCateringOptions(updated);
  };

  const handleDjOptionSelect = (idx, selectedName) => {
    const updated = [...djOptions];
    updated[idx].name = selectedName;
    if (DJ_TEMPLATES[selectedName]) {
      updated[idx].equipment = DJ_TEMPLATES[selectedName].equipment;
      updated[idx].price = DJ_TEMPLATES[selectedName].price;
    }
    setDjOptions(updated);
  };

  const handleDecorOptionSelect = (idx, selectedName) => {
    const updated = [...decorOptions];
    updated[idx].name = selectedName;
    if (DECOR_TEMPLATES[selectedName]) {
      updated[idx].description = DECOR_TEMPLATES[selectedName].description;
      updated[idx].price = DECOR_TEMPLATES[selectedName].price;
    }
    setDecorOptions(updated);
  };

  const handleFacilityToggle = (fac) => {
    if (facilities.includes(fac)) {
      setFacilities(facilities.filter(f => f !== fac));
    } else {
      setFacilities([...facilities, fac]);
    }
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
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setFormError('');
  };

  const validateForm = () => {
    if (!name.trim() || name.trim().length < 3) {
      return 'Venue name must be at least 3 characters long.';
    }
    if (!description.trim() || description.trim().length < 20) {
      return 'Description must be at least 20 characters long.';
    }
    if (!location.trim() || location.trim().length < 5) {
      return 'Please provide a valid location address.';
    }
    const price = parseFloat(pricePerDay);
    if (!pricePerDay || isNaN(price) || price <= 0) {
      return 'Price per day must be a positive number.';
    }
    if (price > 500000) {
      return 'Price per day cannot exceed ₹5,00,000.';
    }
    if (hasCatering) {
      const minPlates = parseInt(cateringMinPlates);
      if (cateringMinPlates && (isNaN(minPlates) || minPlates < 10)) {
        return 'Minimum plate order must be at least 10.';
      }
      if (!cateringOptions || cateringOptions.length === 0) {
        return 'Please add at least one catering cuisine/menu option.';
      }
      for (let i = 0; i < cateringOptions.length; i++) {
        const opt = cateringOptions[i];
        if (!opt.name.trim()) return `Catering option #${i+1} must have a name.`;
        const p = parseFloat(opt.price);
        if (isNaN(p) || p <= 0) return `Catering option #${i+1} price must be a positive number.`;
      }
    }
    if (hasDj) {
      if (!djOptions || djOptions.length === 0) {
        return 'Please add at least one DJ package option.';
      }
      for (let i = 0; i < djOptions.length; i++) {
        const opt = djOptions[i];
        if (!opt.name.trim()) return `DJ package #${i+1} must have a name.`;
        const p = parseFloat(opt.price);
        if (isNaN(p) || p <= 0) return `DJ package #${i+1} price must be a positive number.`;
      }
    }
    if (hasDecor) {
      if (!decorOptions || decorOptions.length === 0) {
        return 'Please add at least one decoration theme option.';
      }
      for (let i = 0; i < decorOptions.length; i++) {
        const opt = decorOptions[i];
        if (!opt.name.trim()) return `Decoration theme #${i+1} must have a name.`;
        const p = parseFloat(opt.price);
        if (isNaN(p) || p <= 0) return `Decoration theme #${i+1} price must be a positive number.`;
      }
    }
    return null;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormLoading(true);

    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('description', description.trim());
    formData.append('location', location.trim());
    formData.append('price_per_day', pricePerDay);
    formData.append('facilities', JSON.stringify(facilities));
    if (imageFile) {
      formData.append('image', imageFile);
    }

    formData.append('has_catering', hasCatering);
    formData.append('catering_price_per_plate', hasCatering && cateringOptions.length > 0 ? parseFloat(cateringOptions[0].price) : 0);
    formData.append('catering_min_plates', hasCatering ? (cateringMinPlates || 10) : 10);
    formData.append('catering_description', hasCatering ? JSON.stringify(cateringOptions) : '[]');
    formData.append('catering_cuisine', hasCatering && cateringOptions.length > 0 ? cateringOptions[0].name : '');

    formData.append('has_dj', hasDj);
    formData.append('dj_price', hasDj && djOptions.length > 0 ? parseFloat(djOptions[0].price) : 0);
    formData.append('dj_equipment', hasDj ? JSON.stringify(djOptions) : '[]');
    
    formData.append('has_decor', hasDecor);
    formData.append('decor_price', hasDecor && decorOptions.length > 0 ? parseFloat(decorOptions[0].price) : 0);
    formData.append('decor_themes', hasDecor ? JSON.stringify(decorOptions) : '[]');

    try {
      if (editingVenue) {
        await api.put(`venues/listings/${editingVenue.id}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('venues/listings/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setModalOpen(false);
      resetForm();
      fetchDashboardData();
    } catch (err) {
      const errData = err.response?.data;
      if (errData && typeof errData === 'object') {
        const messages = Object.entries(errData).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ');
        setFormError(messages);
      } else {
        setFormError("Operation failed. Please verify your input details and try again.");
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteVenue = async (venueId) => {
    if (!window.confirm("Are you sure you want to permanently delete this venue plot? This cannot be undone.")) return;
    try {
      await api.delete(`venues/listings/${venueId}/`);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete venue. You may not own it.");
    }
  };

  const handleBookingAction = async (bookingId, action) => {
    try {
      await api.post(`venues/bookings/${bookingId}/${action}/`);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to process action.");
    }
  };

  const activeRequestsCount = bookings.filter(b => b.status === 'pending').length;
  const approvedBookings = bookings.filter(b => b.status === 'approved');
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled');

  const grossRentalIncome = approvedBookings.reduce((sum, b) => sum + parseFloat(b.total_price), 0);
  const plotOwnerNet = approvedBookings.reduce((sum, b) => sum + parseFloat(b.total_price) * 0.8, 0) +
                       cancelledBookings.reduce((sum, b) => sum + parseFloat(b.total_price) * 0.05, 0);
  const adminVenueCut = approvedBookings.reduce((sum, b) => sum + parseFloat(b.total_price) * 0.2, 0) +
                        cancelledBookings.reduce((sum, b) => sum + parseFloat(b.total_price) * 0.05, 0);
  const totalRefundedToOrg = cancelledBookings.reduce((sum, b) => sum + parseFloat(b.total_price) * 0.9, 0);
  const cancellationRetainedProfit = cancelledBookings.reduce((sum, b) => sum + parseFloat(b.total_price) * 0.05, 0);

  const allReviews = venues.reduce((arr, v) => {
    if (v.reviews && Array.isArray(v.reviews)) {
      v.reviews.forEach(r => {
        arr.push({ ...r, venueName: v.name });
      });
    }
    return arr;
  }, []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const averageRating = venues.length > 0
    ? (venues.reduce((sum, v) => sum + parseFloat(v.rating_avg || 0), 0) / venues.length).toFixed(1)
    : '0.0';


  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-dark-bg">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-dark-muted font-medium">Loading Plot Owner panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-dark-text">Plot Owner Dashboard</h1>
          <p className="text-dark-muted mt-1">List venue halls, manage rental requests, and view booking calendars</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium px-5 py-2.5 rounded-xl hover:from-emerald-600 hover:to-teal-600 shadow-md shadow-emerald-950/20 transition-all transform hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Venue</span>
        </button>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {/* Total Income */}
        <div className="glass-panel rounded-2xl p-6 flex items-start space-x-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl mt-1">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div className="flex-grow">
            <p className="text-xs font-semibold text-dark-muted uppercase tracking-wider">Rental Income (Net)</p>
            <h3 className="text-2xl font-bold mt-1 text-emerald-400">₹{plotOwnerNet.toLocaleString('en-IN')}</h3>
            <div className="mt-3 space-y-1 text-[10px] text-dark-muted border-t border-white/5 pt-2">
              <div className="flex justify-between">
                <span>Gross Approved:</span>
                <span className="text-dark-text font-medium">₹{grossRentalIncome.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Admin Cut (20%):</span>
                <span className="text-red-400 font-medium">-₹{adminVenueCut.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Refunded (90%):</span>
                <span className="text-blue-400 font-medium">₹{totalRefundedToOrg.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Retained Profit (10%):</span>
                <span className="text-emerald-400 font-medium">₹{cancellationRetainedProfit.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-semibold border-t border-white/5 pt-1 mt-1">
                <span>Owner Net Earnings:</span>
                <span>₹{plotOwnerNet.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pending requests */}
        <div className="glass-panel rounded-2xl p-6 flex items-center space-x-4">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-dark-muted uppercase tracking-wider">Booking Requests</p>
            <h3 className="text-2xl font-bold mt-1">{activeRequestsCount} <span className="text-xs text-dark-muted font-normal">pending</span></h3>
          </div>
        </div>

        {/* Venues Count */}
        <div className="glass-panel rounded-2xl p-6 flex items-center space-x-4">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-dark-muted uppercase tracking-wider">Venues Registered</p>
            <h3 className="text-2xl font-bold mt-1">{venues.length}</h3>
          </div>
        </div>

        {/* Average Rating */}
        <div className="glass-panel rounded-2xl p-6 flex items-center space-x-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <Star className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-semibold text-dark-muted uppercase tracking-wider">Average Rating</p>
            <h3 className="text-2xl font-bold mt-1">{averageRating} <span className="text-xs text-dark-muted">/ 5</span></h3>
          </div>
        </div>
      </div>



      {/* Panels */}
      <div className="mt-8">
        <AnimatePresence mode="wait">
          {activeTab === 'venues' && (
            <motion.div
              key="venues"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {venues.length === 0 ? (
                <div className="col-span-full glass-panel text-center py-16 rounded-2xl">
                  <Building className="w-12 h-12 text-dark-muted mx-auto mb-4" />
                  <p className="text-dark-muted">No plots registered. Register a lawn/hall space to receive organizer requests!</p>
                </div>
              ) : (
                venues.map((venue) => (
                  <div key={venue.id} className="glass-card rounded-2xl overflow-hidden flex flex-col">
                    {venue.image ? (
                      <img
                        src={venue.image.startsWith('http') ? venue.image : `http://127.0.0.1:8000${venue.image}`}
                        alt={venue.name}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-white/5 flex items-center justify-center text-dark-muted">
                        <Building className="w-10 h-10" />
                      </div>
                    )}
                    
                    <div className="p-6 flex flex-col flex-grow">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-lg text-dark-text">{venue.name}</h4>
                          <div className="flex items-center space-x-1 mt-1 text-xs text-amber-400">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            <span>{venue.rating_avg || '0.0'} ({venue.rating_count || 0})</span>
                          </div>
                        </div>
                        {venue.is_approved ? (
                          <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded uppercase flex-shrink-0">Approved</span>
                        ) : (
                          <span className="text-[9px] font-bold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded uppercase flex-shrink-0">Pending</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1.5 text-xs text-dark-muted mt-1">
                        <MapPin className="w-3.5 h-3.5 text-brand-primary flex-shrink-0" />
                        <span className="truncate">{venue.location}</span>
                      </div>
                      
                      {/* Service Badges */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {(venue.facilities || []).map((f, i) => (
                          <span key={i} className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                            {f}
                          </span>
                        ))}
                        {venue.has_catering && (
                          <span className="text-[10px] font-semibold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                            <UtensilsCrossed className="w-2.5 h-2.5" /> Catering
                          </span>
                        )}
                        {venue.has_dj && (
                          <span className="text-[10px] font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                            <Music2 className="w-2.5 h-2.5" /> DJ
                          </span>
                        )}
                        {venue.has_decor && (
                          <span className="text-[10px] font-semibold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                            <Palette className="w-2.5 h-2.5" /> Décor
                          </span>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm font-bold text-brand-primary">₹{parseFloat(venue.price_per_day).toLocaleString('en-IN')}/day</span>
                      </div>
                      
                      <div className="mt-4 flex space-x-2 pt-4 border-t border-white/5">
                        <button
                          onClick={() => handleOpenEditModal(venue)}
                          className="flex-1 flex items-center justify-center space-x-1.5 bg-white/5 hover:bg-white/10 border border-white/5 text-dark-text py-2 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" /><span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteVenue(venue.id)}
                          className="flex-1 flex items-center justify-center space-x-1.5 bg-red-500/5 hover:bg-red-500/15 border border-red-500/10 text-red-400 py-2 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /><span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'requests' && (
            <motion.div
              key="requests"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="glass-panel rounded-2xl p-6"
            >
              <h4 className="font-bold text-base text-dark-text mb-4 uppercase tracking-wider">Rental Booking Requests</h4>
              {bookings.length === 0 ? (
                <div className="text-center py-12 text-dark-muted">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>No booking requests received yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] text-dark-muted uppercase tracking-wider border-b border-white/5">
                        <th className="px-4 py-3 text-left">Venue</th>
                        <th className="px-4 py-3 text-left">Organizer</th>
                        <th className="px-4 py-3 text-left">Dates</th>
                        <th className="px-4 py-3 text-left">Services</th>
                        <th className="px-4 py-3 text-left">Amount</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                      {bookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="px-4 py-4 font-semibold text-dark-text text-xs">{booking.venue_details?.name}</td>
                          <td className="px-4 py-4 text-xs text-dark-muted">
                            {booking.organizer_details?.first_name} {booking.organizer_details?.last_name}
                            <span className="block text-[10px] opacity-60">{booking.organizer_details?.email}</span>
                          </td>
                          <td className="px-4 py-4 text-xs text-dark-muted">
                            <span className="block">{booking.start_date}</span>
                            <span className="block text-[10px] opacity-60">to {booking.end_date}</span>
                          </td>
                          <td className="px-4 py-4 text-xs">
                            <div className="flex flex-wrap gap-1">
                              {booking.use_catering && (
                                <span className="text-[9px] bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded" title={`Menu: ${booking.catering_description}`}>
                                  Catering ({booking.catering_cuisine}) ×{booking.catering_plates}
                                </span>
                              )}
                              {booking.use_dj && (
                                <span className="text-[9px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded" title={`Equipment: ${booking.dj_equipment}`}>
                                  DJ ({booking.dj_package})
                                </span>
                              )}
                              {booking.use_decor && (
                                <span className="text-[9px] bg-pink-500/10 text-pink-400 px-1.5 py-0.5 rounded" title={`Theme: ${booking.decor_theme}`}>
                                  Décor ({booking.decor_theme})
                                </span>
                              )}
                              {!booking.use_catering && !booking.use_dj && !booking.use_decor && <span className="text-[9px] text-dark-muted">Venue only</span>}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-xs">
                            {booking.status === 'cancelled' ? (
                              <div className="text-xs space-y-0.5">
                                <span className="text-dark-muted block line-through">₹{booking.total_price}</span>
                                <span className="text-blue-400 block font-normal">Refunded: ₹{(parseFloat(booking.total_price) * 0.9).toFixed(2)}</span>
                                <span className="text-emerald-400 block">Owner Profit (5%): ₹{(parseFloat(booking.total_price) * 0.05).toFixed(2)}</span>
                                <span className="text-blue-400 block font-normal">Admin Commission (5%): ₹{(parseFloat(booking.total_price) * 0.05).toFixed(2)}</span>
                              </div>
                            ) : (
                              <span className="text-brand-primary">₹{booking.total_price}</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            {booking.cancel_requested && booking.status === 'approved' ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-yellow-500/10 text-yellow-400">
                                Cancel Requested
                              </span>
                            ) : (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                booking.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                                booking.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                                booking.status === 'rejected' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                              }`}>
                                {booking.status}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right">
                            {booking.status === 'pending' && (
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => handleBookingAction(booking.id, 'approve')}
                                  className="p-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-all"
                                  title="Approve"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleBookingAction(booking.id, 'reject')}
                                  className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                                  title="Reject"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                            {booking.cancel_requested && booking.status === 'approved' && (
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => handleBookingAction(booking.id, 'approve_cancel')}
                                  className="px-2.5 py-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-all flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider border border-red-500/10"
                                  title="Approve Cancellation Request"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Approve Cancel</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
                  <p className="text-dark-muted">No reviews received yet for your venues.</p>
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
                        <span className="text-[9px] font-semibold text-brand-primary uppercase tracking-wider block">Venue reviewed</span>
                        <p className="font-bold text-xs text-dark-text mt-0.5">{rev.venueName}</p>
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

          {activeTab === 'calendar' && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="glass-panel rounded-2xl p-6"
            >
              <h4 className="font-bold text-lg text-dark-text mb-2">Upcoming Occupancy Timeline</h4>
              <p className="text-xs text-dark-muted mb-6">Confirmed rentals mapping for listed plots</p>
              
              {bookings.filter(b => b.status === 'approved').length === 0 ? (
                <div className="text-center py-12 text-dark-muted">No confirmed rental dates found. Your plots are fully available.</div>
              ) : (
                <div className="space-y-4">
                  {bookings.filter(b => b.status === 'approved').map(booking => (
                    <div key={booking.id} className="glass-card p-4 rounded-xl border border-emerald-500/15 bg-emerald-500/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <h5 className="font-bold text-sm text-dark-text">{booking.venue_details.name}</h5>
                        <p className="text-xs text-emerald-400 mt-0.5">Reserved by {booking.organizer_details.first_name} {booking.organizer_details.last_name}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {booking.use_catering && (
                            <span className="text-[9px] bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded" title={`Menu: ${booking.catering_description}`}>
                              Catering ({booking.catering_cuisine}) ×{booking.catering_plates}
                            </span>
                          )}
                          {booking.use_dj && (
                            <span className="text-[9px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded" title={`Equipment: ${booking.dj_equipment}`}>
                              DJ ({booking.dj_package})
                            </span>
                          )}
                          {booking.use_decor && (
                            <span className="text-[9px] bg-pink-500/10 text-pink-400 px-1.5 py-0.5 rounded" title={`Theme: ${booking.decor_theme}`}>
                              Decor ({booking.decor_theme})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-xs font-semibold text-dark-text bg-white/5 border border-white/5 px-3 py-1.5 rounded-lg">
                        <Calendar className="w-4 h-4 text-brand-primary" />
                        <span>{booking.start_date} to {booking.end_date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add/Edit Modal */}
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

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-panel w-full max-w-2xl rounded-2xl shadow-glass z-10 overflow-hidden relative flex flex-col my-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <h3 className="text-xl font-bold text-dark-text flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-brand-primary animate-pulse" />
                  <span>{editingVenue ? 'Edit Venue Listing' : 'Register Venue Plot'}</span>
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
                  {/* Venue Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">Venue / Plot Name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Royal Palace Lawns"
                      className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
                      required
                      minLength={3}
                    />
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">Description *</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe venue dimensions, capacity, type, amenities (min. 20 characters)..."
                      rows="3"
                      className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
                      required
                      minLength={20}
                    ></textarea>
                    <p className="text-[10px] text-dark-muted mt-1">{description.length}/20 minimum characters</p>
                  </div>

                  {/* Location */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">Location Address *</label>
                    <input
                      ref={locationInputRef}
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Science City, Ahmedabad"
                      className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
                      required
                    />
                  </div>

                  {location && location.trim().length > 5 && (
                    <div className="sm:col-span-2 mt-1">
                      <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">Map Location Preview</label>
                      <div className="w-full h-44 rounded-xl overflow-hidden border border-white/5 shadow-md">
                        <iframe
                          title="Venue Map Preview"
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          style={{ border: 0 }}
                          src={`https://maps.google.com/maps?q=${encodeURIComponent(location)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                          allowFullScreen
                        ></iframe>
                      </div>
                    </div>
                  )}

                  {/* Price */}
                  <div>
                    <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">Price Per Day (₹) *</label>
                    <input
                      type="number"
                      value={pricePerDay}
                      onChange={(e) => setPricePerDay(e.target.value)}
                      placeholder="5000"
                      min="1"
                      max="500000"
                      className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
                      required
                    />
                  </div>

                  {/* Facilities Checklist */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-3">Available Facilities</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {facilityBadgeOptions.map((fac, idx) => {
                        const isChecked = facilities.includes(fac);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleFacilityToggle(fac)}
                            className={`px-3 py-2 text-xs font-semibold rounded-lg border text-left flex items-center justify-between transition-all ${
                              isChecked 
                                ? 'border-brand-primary bg-emerald-500/10 text-emerald-400' 
                                : 'border-white/5 bg-white/5 text-dark-muted hover:border-white/10 hover:text-dark-text'
                            }`}
                          >
                            <span>{fac}</span>
                            {isChecked && <BadgeCheck className="w-3.5 h-3.5 ml-1 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ─── CATERING SERVICE ─── */}
                  <div className="sm:col-span-2 border border-white/5 rounded-xl p-4 space-y-4 bg-white/[0.01]">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className={`w-10 h-6 rounded-full transition-colors relative ${hasCatering ? 'bg-orange-500' : 'bg-white/10'}`} onClick={() => setHasCatering(!hasCatering)}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${hasCatering ? 'translate-x-5' : 'translate-x-1'}`} />
                      </div>
                      <div className="flex items-center gap-2">
                        <UtensilsCrossed className={`w-4 h-4 ${hasCatering ? 'text-orange-400' : 'text-dark-muted'}`} />
                        <span className={`text-sm font-bold uppercase tracking-wider ${hasCatering ? 'text-orange-400' : 'text-dark-muted'}`}>Offer Catering Service</span>
                      </div>
                    </label>

                    {hasCatering && (
                      <div className="space-y-4 pl-4 border-l-2 border-orange-500/30">
                        <div>
                          <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">Min. Plate Order</label>
                          <input
                            type="number"
                            value={cateringMinPlates}
                            onChange={(e) => setCateringMinPlates(e.target.value)}
                            placeholder="50"
                            min="10"
                            className="glass-input w-full max-w-xs px-4 py-2.5 rounded-xl text-sm"
                          />
                          <p className="text-[10px] text-dark-muted mt-1">Minimum 10 plates required</p>
                        </div>
                        
                        <div className="space-y-3">
                          <label className="block text-xs font-bold text-orange-400 uppercase tracking-wider">Cuisine Options & Pricing</label>
                          {cateringOptions.map((opt, idx) => (
                            <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 bg-white/5 rounded-xl border border-white/5 relative">
                              <div className="sm:col-span-4">
                                <label className="block text-[10px] font-semibold text-dark-muted uppercase mb-1">Cuisine / Option Name *</label>
                                {(() => {
                                  const selectedCuisines = cateringOptions.map(o => o.name).filter(Boolean);
                                  const cuisineKeys = Object.keys(CUISINE_TEMPLATES).filter(k => {
                                    if (k === 'Custom / Mixed') return true;
                                    return k === opt.name || !selectedCuisines.includes(k);
                                  });
                                  const isCustom = opt.name && !Object.keys(CUISINE_TEMPLATES).includes(opt.name);
                                  return (
                                    <div className="space-y-1.5">
                                      <select
                                        value={isCustom ? 'Custom / Mixed' : opt.name}
                                        onChange={(e) => handleCateringOptionSelect(idx, e.target.value)}
                                        className="glass-input w-full px-3 py-1.5 rounded-lg text-xs cursor-pointer bg-[#121a2e] text-slate-100"
                                        required
                                      >
                                        <option value="" className="bg-[#121a2e] text-slate-400">Select Cuisine...</option>
                                        {cuisineKeys.map(k => (
                                          <option key={k} value={k} className="bg-[#121a2e] text-slate-100">{k}</option>
                                        ))}
                                      </select>
                                      {(opt.name === 'Custom / Mixed' || isCustom) && (
                                        <input
                                          type="text"
                                          value={opt.name === 'Custom / Mixed' ? '' : opt.name}
                                          onChange={(e) => handleCateringOptionChange(idx, 'name', e.target.value || 'Custom / Mixed')}
                                          placeholder="Type custom name..."
                                          className="glass-input w-full px-3 py-1.5 rounded-lg text-xs animate-fadeIn"
                                          required
                                        />
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                              <div className="sm:col-span-3">
                                <label className="block text-[10px] font-semibold text-dark-muted uppercase mb-1">Price per Plate (₹) *</label>
                                <input
                                  type="number"
                                  value={opt.price}
                                  onChange={(e) => handleCateringOptionChange(idx, 'price', e.target.value)}
                                  placeholder="350"
                                  min="1"
                                  className="glass-input w-full px-3 py-1.5 rounded-lg text-xs"
                                  required
                                />
                              </div>
                              <div className="sm:col-span-4">
                                <label className="block text-[10px] font-semibold text-dark-muted uppercase mb-1">Menu Details *</label>
                                <input
                                  type="text"
                                  value={opt.description}
                                  onChange={(e) => handleCateringOptionChange(idx, 'description', e.target.value)}
                                  placeholder="2 Sabzis, Roti, Sweets..."
                                  className="glass-input w-full px-3 py-1.5 rounded-lg text-xs"
                                  required
                                />
                              </div>
                              <div className="sm:col-span-1 flex items-end justify-center pb-1">
                                {cateringOptions.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCateringOption(idx)}
                                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Delete Option"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={handleAddCateringOption}
                            className="flex items-center gap-1 text-[11px] font-bold text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer w-fit"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Cuisine Option
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ─── DJ SERVICE ─── */}
                  <div className="sm:col-span-2 border border-white/5 rounded-xl p-4 space-y-4 bg-white/[0.01]">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className={`w-10 h-6 rounded-full transition-colors relative ${hasDj ? 'bg-purple-500' : 'bg-white/10'}`} onClick={() => setHasDj(!hasDj)}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${hasDj ? 'translate-x-5' : 'translate-x-1'}`} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Music2 className={`w-4 h-4 ${hasDj ? 'text-purple-400' : 'text-dark-muted'}`} />
                        <span className={`text-sm font-bold uppercase tracking-wider ${hasDj ? 'text-purple-400' : 'text-dark-muted'}`}>Offer DJ Service</span>
                      </div>
                    </label>

                    {hasDj && (
                      <div className="space-y-4 pl-4 border-l-2 border-purple-500/30">
                        <div className="space-y-3">
                          <label className="block text-xs font-bold text-purple-400 uppercase tracking-wider">DJ Setup Packages & Pricing</label>
                          {djOptions.map((opt, idx) => (
                            <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 bg-white/5 rounded-xl border border-white/5 relative">
                              <div className="sm:col-span-4">
                                <label className="block text-[10px] font-semibold text-dark-muted uppercase mb-1">Package Name *</label>
                                {(() => {
                                  const selectedDjs = djOptions.map(o => o.name).filter(Boolean);
                                  const djKeys = Object.keys(DJ_TEMPLATES).filter(k => {
                                    if (k === 'Custom DJ Setup') return true;
                                    return k === opt.name || !selectedDjs.includes(k);
                                  });
                                  const isCustom = opt.name && !Object.keys(DJ_TEMPLATES).includes(opt.name);
                                  return (
                                    <div className="space-y-1.5">
                                      <select
                                        value={isCustom ? 'Custom DJ Setup' : opt.name}
                                        onChange={(e) => handleDjOptionSelect(idx, e.target.value)}
                                        className="glass-input w-full px-3 py-1.5 rounded-lg text-xs cursor-pointer bg-[#121a2e] text-slate-100"
                                        required
                                      >
                                        <option value="" className="bg-[#121a2e] text-slate-400">Select Setup...</option>
                                        {djKeys.map(k => (
                                          <option key={k} value={k} className="bg-[#121a2e] text-slate-100">{k}</option>
                                        ))}
                                      </select>
                                      {(opt.name === 'Custom DJ Setup' || isCustom) && (
                                        <input
                                          type="text"
                                          value={opt.name === 'Custom DJ Setup' ? '' : opt.name}
                                          onChange={(e) => handleDjOptionChange(idx, 'name', e.target.value || 'Custom DJ Setup')}
                                          placeholder="Type custom package name..."
                                          className="glass-input w-full px-3 py-1.5 rounded-lg text-xs animate-fadeIn"
                                          required
                                        />
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                              <div className="sm:col-span-3">
                                <label className="block text-[10px] font-semibold text-dark-muted uppercase mb-1">Price Per Day (₹) *</label>
                                <input
                                  type="number"
                                  value={opt.price}
                                  onChange={(e) => handleDjOptionChange(idx, 'price', e.target.value)}
                                  placeholder="8000"
                                  min="1"
                                  className="glass-input w-full px-3 py-1.5 rounded-lg text-xs"
                                  required
                                />
                              </div>
                              <div className="sm:col-span-4">
                                <label className="block text-[10px] font-semibold text-dark-muted uppercase mb-1">Equipment Details *</label>
                                <input
                                  type="text"
                                  value={opt.equipment}
                                  onChange={(e) => handleDjOptionChange(idx, 'equipment', e.target.value)}
                                  placeholder="4 Speakers, Lights, Mic..."
                                  className="glass-input w-full px-3 py-1.5 rounded-lg text-xs"
                                  required
                                />
                              </div>
                              <div className="sm:col-span-1 flex items-end justify-center pb-1">
                                {djOptions.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveDjOption(idx)}
                                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Delete Package"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={handleAddDjOption}
                            className="flex items-center gap-1 text-[11px] font-bold text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer w-fit"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add DJ Package Option
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ─── DECORATION SERVICE ─── */}
                  <div className="sm:col-span-2 border border-white/5 rounded-xl p-4 space-y-4 bg-white/[0.01]">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className={`w-10 h-6 rounded-full transition-colors relative ${hasDecor ? 'bg-pink-500' : 'bg-white/10'}`} onClick={() => setHasDecor(!hasDecor)}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${hasDecor ? 'translate-x-5' : 'translate-x-1'}`} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Palette className={`w-4 h-4 ${hasDecor ? 'text-pink-400' : 'text-dark-muted'}`} />
                        <span className={`text-sm font-bold uppercase tracking-wider ${hasDecor ? 'text-pink-400' : 'text-dark-muted'}`}>Offer Decoration Service</span>
                      </div>
                    </label>

                    {hasDecor && (
                      <div className="space-y-4 pl-4 border-l-2 border-pink-500/30">
                        <div className="space-y-3">
                          <label className="block text-xs font-bold text-pink-400 uppercase tracking-wider">Decor Theme Packages & Pricing</label>
                          {decorOptions.map((opt, idx) => (
                            <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 bg-white/5 rounded-xl border border-white/5 relative">
                              <div className="sm:col-span-4">
                                <label className="block text-[10px] font-semibold text-dark-muted uppercase mb-1">Theme Name *</label>
                                {(() => {
                                  const selectedDecors = decorOptions.map(o => o.name).filter(Boolean);
                                  const decorKeys = Object.keys(DECOR_TEMPLATES).filter(k => {
                                    if (k === 'Custom Decoration Setup') return true;
                                    return k === opt.name || !selectedDecors.includes(k);
                                  });
                                  const isCustom = opt.name && !Object.keys(DECOR_TEMPLATES).includes(opt.name);
                                  return (
                                    <div className="space-y-1.5">
                                      <select
                                        value={isCustom ? 'Custom Decoration Setup' : opt.name}
                                        onChange={(e) => handleDecorOptionSelect(idx, e.target.value)}
                                        className="glass-input w-full px-3 py-1.5 rounded-lg text-xs cursor-pointer bg-[#121a2e] text-slate-100"
                                        required
                                      >
                                        <option value="" className="bg-[#121a2e] text-slate-400">Select Theme...</option>
                                        {decorKeys.map(k => (
                                          <option key={k} value={k} className="bg-[#121a2e] text-slate-100">{k}</option>
                                        ))}
                                      </select>
                                      {(opt.name === 'Custom Decoration Setup' || isCustom) && (
                                        <input
                                          type="text"
                                          value={opt.name === 'Custom Decoration Setup' ? '' : opt.name}
                                          onChange={(e) => handleDecorOptionChange(idx, 'name', e.target.value || 'Custom Decoration Setup')}
                                          placeholder="Type custom theme name..."
                                          className="glass-input w-full px-3 py-1.5 rounded-lg text-xs animate-fadeIn"
                                          required
                                        />
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                              <div className="sm:col-span-3">
                                <label className="block text-[10px] font-semibold text-dark-muted uppercase mb-1">Theme Price (₹) *</label>
                                <input
                                  type="number"
                                  value={opt.price}
                                  onChange={(e) => handleDecorOptionChange(idx, 'price', e.target.value)}
                                  placeholder="15000"
                                  min="1"
                                  className="glass-input w-full px-3 py-1.5 rounded-lg text-xs"
                                  required
                                />
                              </div>
                              <div className="sm:col-span-4">
                                <label className="block text-[10px] font-semibold text-dark-muted uppercase mb-1">Inclusions / Description *</label>
                                <input
                                  type="text"
                                  value={opt.description}
                                  onChange={(e) => handleDecorOptionChange(idx, 'description', e.target.value)}
                                  placeholder="Entrance gate arch, Stage, Pathway lights..."
                                  className="glass-input w-full px-3 py-1.5 rounded-lg text-xs"
                                  required
                                />
                              </div>
                              <div className="sm:col-span-1 flex items-end justify-center pb-1">
                                {decorOptions.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveDecorOption(idx)}
                                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Delete Theme"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={handleAddDecorOption}
                            className="flex items-center gap-1 text-[11px] font-bold text-pink-400 hover:text-pink-300 bg-pink-500/10 hover:bg-pink-500/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer w-fit"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Decoration Option
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Image Upload */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">Venue Image Banner</label>
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
                        <span className="text-xs text-dark-muted">Upload landscape venue photo (max 5MB)</span>
                        <input type="file" onChange={handleImageChange} accept="image/*" className="hidden" />
                      </label>
                    </div>
                  </div>


                </div>

                {/* Submit Controls */}
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
                    {formLoading ? 'Saving...' : 'Save Venue'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlotOwnerDashboard;
