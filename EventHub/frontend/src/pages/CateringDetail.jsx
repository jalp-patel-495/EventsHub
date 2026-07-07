import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';

const CateringDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Booking state
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [guestsCount, setGuestsCount] = useState(100);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Review states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  // Mock checkout state
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/catering/catering-services/${id}/`);
      setService(res.data);
      if (res.data.packages && res.data.packages.length > 0) {
        setSelectedPkg(res.data.packages[0]);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load catering service details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedPkg) {
      alert("Please select a catering package.");
      return;
    }
    if (guestsCount < service.min_guests || guestsCount > service.max_guests) {
      alert(`Guests count must be between ${service.min_guests} and ${service.max_guests}.`);
      return;
    }

    setBookingLoading(true);
    try {
      const res = await api.post('/api/catering/catering-bookings/', {
        catering_service: service.id,
        catering_package: selectedPkg.id,
        booking_date: bookingDate,
        guests_count: guestsCount
      });
      setBookingSuccess(res.data);
      setShowCheckout(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Booking creation failed. Please check inputs.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handlePayment = async () => {
    setPaymentLoading(true);
    try {
      await api.post(`/api/catering/catering-bookings/${bookingSuccess.id}/pay/`, {
        payment_id: `MOCK-PAY-CAT-${Date.now()}`
      });
      alert("Payment successful! Catering booking has been confirmed.");
      setShowCheckout(false);
      navigate('/bookings'); // go to customer dashboard to view bookings
    } catch (err) {
      alert("Payment processing failed.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    setReviewLoading(true);
    try {
      const res = await api.post(`/api/catering/catering-services/${id}/submit_review/`, {
        rating,
        comment
      });
      alert("Review submitted successfully!");
      setComment('');
      fetchDetail(); // reload reviews
    } catch (err) {
      alert("Failed to submit review.");
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0d0f14]">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4" />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0d0f14] text-red-500 text-lg">
        {error || 'Catering service not found.'}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d0f14] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column - Details & Packages (col-span-8) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Header Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-md">
            <div className="h-64 bg-slate-200 dark:bg-slate-800 relative">
              {service.image ? (
                <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">🍲</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="bg-brand-primary text-xs font-bold px-2.5 py-1 rounded">
                    {service.cuisine_type}
                  </span>
                  <div className="text-amber-400 font-bold text-sm">
                    ⭐ {service.average_rating || 'N/A'} ({service.reviews?.length || 0} reviews)
                  </div>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold font-display leading-tight">{service.name}</h1>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">About the Provider</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {service.description}
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block uppercase">Base Price</span>
                  <span className="text-base font-bold text-slate-800 dark:text-white">₹{service.price_per_plate} / plate</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase">Capacity Range</span>
                  <span className="text-base font-bold text-slate-800 dark:text-white">{service.min_guests} - {service.max_guests} guests</span>
                </div>
                {service.pdf_menu && (
                  <div>
                    <span className="text-slate-400 block uppercase">Menu File</span>
                    <a 
                      href={service.pdf_menu} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-base font-bold text-brand-primary underline"
                    >
                      Download PDF Menu 📄
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Packages Selector */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Available Packages</h3>
            
            {service.packages && service.packages.length > 0 ? (
              <div className="space-y-4">
                {service.packages.map((pkg) => (
                  <div 
                    key={pkg.id}
                    onClick={() => setSelectedPkg(pkg)}
                    className={`border p-5 rounded-2xl cursor-pointer transition-all ${
                      selectedPkg?.id === pkg.id 
                        ? 'border-brand-primary bg-brand-primary/5' 
                        : 'border-slate-200 dark:border-slate-850 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-850'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-bold text-slate-800 dark:text-white text-base">{pkg.name}</h4>
                      <span className="text-brand-primary font-bold text-lg">₹{pkg.price_per_plate} / plate</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{pkg.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {pkg.menu_items?.map((item, idx) => (
                        <span key={idx} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-350 text-[10px] px-2 py-0.5 rounded-full font-medium">
                          ✔ {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm italic text-slate-500">No package options configured for this provider.</p>
            )}
          </div>

          {/* Customer Reviews */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Customer Reviews</h3>
            
            {/* Post Review Form */}
            <form onSubmit={handleReview} className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Leave a Review</h4>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Rating:</span>
                <select 
                  value={rating} 
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded px-2.5 py-1 text-slate-800 dark:text-white"
                >
                  <option value={5}>5 ⭐</option>
                  <option value={4}>4 ⭐</option>
                  <option value={3}>3 ⭐</option>
                  <option value={2}>2 ⭐</option>
                  <option value={1}>1 ⭐</option>
                </select>
              </div>
              <textarea 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your catering experience (e.g. food taste, service quality)..."
                className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                rows={3}
                required
              />
              <button 
                type="submit" 
                disabled={reviewLoading}
                className="bg-brand-primary text-white text-xs font-bold py-2 px-6 rounded-xl hover:bg-rose-600 transition-all"
              >
                {reviewLoading ? 'Submitting...' : 'Post Review'}
              </button>
            </form>

            <div className="space-y-4">
              {service.reviews && service.reviews.length > 0 ? (
                service.reviews.map((r) => (
                  <div key={r.id} className="border-b border-slate-100 dark:border-slate-800 pb-4 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {r.user_details?.email || 'Anonymous Customer'}
                      </span>
                      <span className="text-amber-500 font-bold">{'⭐'.repeat(r.rating)}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">{r.comment}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Posted on: {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs italic text-slate-500">No reviews posted yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Booking Panel (col-span-4) */}
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md sticky top-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 font-display">Book Catering</h3>
            
            <form onSubmit={handleBook} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-500 mb-1 uppercase tracking-wider">Selected Package</label>
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-750 flex justify-between font-bold text-slate-800 dark:text-white">
                  <span>{selectedPkg ? selectedPkg.name : 'None'}</span>
                  <span className="text-brand-primary">₹{selectedPkg ? selectedPkg.price_per_plate : 0}/plate</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1 uppercase tracking-wider">Booking Date</label>
                <input 
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 uppercase tracking-wider">Guests Count</label>
                <input 
                  type="number"
                  value={guestsCount}
                  onChange={(e) => setGuestsCount(Number(e.target.value))}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  min={service.min_guests}
                  max={service.max_guests}
                  required
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Allowed limit: {service.min_guests} to {service.max_guests} guests.
                </span>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
                <div className="flex justify-between font-bold text-slate-800 dark:text-white">
                  <span>Plate Charge:</span>
                  <span>₹{selectedPkg ? selectedPkg.price_per_plate : 0}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-800 dark:text-white">
                  <span>Total Guests:</span>
                  <span>{guestsCount}</span>
                </div>
                <div className="flex justify-between font-extrabold text-base text-slate-900 dark:text-white border-t border-slate-100 dark:border-slate-800 pt-2">
                  <span>Total Price:</span>
                  <span className="text-brand-primary">₹{(selectedPkg ? selectedPkg.price_per_plate : 0) * guestsCount}</span>
                </div>
              </div>

              <button 
                type="submit"
                disabled={bookingLoading || !selectedPkg}
                className="w-full bg-brand-primary hover:bg-rose-600 text-white font-bold py-3 rounded-2xl transition-all shadow-md mt-4"
              >
                {bookingLoading ? 'Creating Booking...' : 'Proceed to Checkout'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Mock Checkout payment dialog modal */}
      {showCheckout && bookingSuccess && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white font-display mb-4">Complete Payment</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Complete the payment of <span className="font-bold text-brand-primary">₹{bookingSuccess.total_price}</span> to confirm your booking for <span className="font-bold">{service.name}</span> on <span className="font-bold">{bookingSuccess.booking_date}</span>.
            </p>

            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl mb-6 text-xs space-y-2 border border-slate-200 dark:border-slate-750">
              <div className="flex justify-between">
                <span className="text-slate-500">Service:</span>
                <span className="font-bold text-slate-800 dark:text-white">{service.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Package:</span>
                <span className="font-bold text-slate-800 dark:text-white">{selectedPkg?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Plate Price:</span>
                <span className="font-bold text-slate-800 dark:text-white">₹{selectedPkg?.price_per_plate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Guests:</span>
                <span className="font-bold text-slate-800 dark:text-white">{bookingSuccess.guests_count}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowCheckout(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold py-3 rounded-2xl text-xs transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handlePayment}
                disabled={paymentLoading}
                className="flex-1 bg-brand-primary hover:bg-rose-600 text-white font-bold py-3 rounded-2xl text-xs transition-all shadow-md"
              >
                {paymentLoading ? 'Paying...' : 'Pay with MockGateway'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CateringDetail;
