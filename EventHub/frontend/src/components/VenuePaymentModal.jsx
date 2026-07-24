import React, { useState } from 'react';
import api from '../api/api';
import { motion } from 'framer-motion';
import { 
  XCircle, Lock, Smartphone, CreditCard, Landmark, 
  ChevronRight, ShieldCheck, CheckCircle2, UtensilsCrossed,
  Music2, Palette, Info, AlertCircle, Users
} from 'lucide-react';

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
    equipment: '2x 15-inch Speakers, Basic DJ Mixer, Wired Mic, 2x RGB LED Lights'
  },
  'Premium Club DJ': {
    equipment: '4x JBL Subwoofers & Speakers, Pioneer DJ Controller, Wireless Mics, 4x Moving Heads, Fog Machine'
  },
  'Grand Punjabi Dhol + DJ': {
    equipment: 'JBL Line Array Sound System, Professional DJ setup, LED screen backdrop, Truss lighting, 2x Live Dhol players'
  },
  'Custom DJ Setup': {
    equipment: ''
  }
};

const VenuePaymentModal = ({ venue, startDate, endDate, onClose, onPaymentSuccess }) => {
  const [paymentStep, setPaymentStep] = useState('options');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [processingMsg, setProcessingMsg] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [cardError, setCardError] = useState('');
  const [facilityError, setFacilityError] = useState('');
  const [qrTimer, setQrTimer] = useState(180);
  const [paymentToken, setPaymentToken] = useState('');

  // UPI QR Code countdown timer
  React.useEffect(() => {
    let interval = null;
    if (paymentStep === 'upi' && qrTimer > 0) {
      interval = setInterval(() => {
        setQrTimer(prev => prev - 1);
      }, 1000);
    } else if (qrTimer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [paymentStep, qrTimer]);

  // Poll payment token status from backend
  React.useEffect(() => {
    let pollInterval = null;
    if (paymentStep === 'upi' && paymentToken && qrTimer > 0) {
      pollInterval = setInterval(async () => {
        try {
          const res = await api.get(`venues/bookings/poll-payment/?token=${paymentToken}`);
          if (res.data && res.data.status === 'approved') {
            clearInterval(pollInterval);
            handleQrPaymentConfirm();
          }
        } catch (err) {
          console.error("Error polling payment status:", err);
        }
      }, 1500);
    }
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [paymentStep, paymentToken, qrTimer]);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Sub-facility selections
  const [bundleCatering, setBundleCatering] = useState(false);
  const [guestsCount, setGuestsCount] = useState(Math.max(50, parseInt(venue.catering_min_plates) || 10));
  const [cateringCuisine, setCateringCuisine] = useState('');
  const [cateringDescription, setCateringDescription] = useState('');
  const [bundleDj, setBundleDj] = useState(false);
  const [djPackage, setDjPackage] = useState('');
  const [djEquipment, setDjEquipment] = useState('');
  const [bundleDecor, setBundleDecor] = useState(false);
  const [decorTheme, setDecorTheme] = useState('');

  const uuid = () => Math.random().toString(36).substring(2, 15);

  // Math calculations
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
  const baseRent = days * parseFloat(venue.price_per_day);
  const serviceTax = baseRent * 0.18;
  const securityDeposit = 500.00;

  const parsedCateringOptions = (() => {
    try {
      const parsed = JSON.parse(venue.catering_description);
      if (Array.isArray(parsed)) return parsed;
    } catch(e) {}
    if (venue.has_catering) {
      return [{ name: venue.catering_cuisine || 'Standard Option', price: String(venue.catering_price_per_plate || 350), description: venue.catering_description || 'Standard catering service menu.' }];
    }
    return [];
  })();
  const selectedCateringObj = parsedCateringOptions.find(o => o.name === cateringCuisine);
  const currentCateringPrice = selectedCateringObj ? parseFloat(selectedCateringObj.price) : 0;
  const cateringCost = bundleCatering ? currentCateringPrice * guestsCount : 0;

  const parsedDjOptions = (() => {
    try {
      const parsed = JSON.parse(venue.dj_equipment);
      if (Array.isArray(parsed)) return parsed;
    } catch(e) {}
    if (venue.has_dj) {
      return [{ name: venue.dj_package || 'Standard DJ Setup', price: String(venue.dj_price || 8000), equipment: venue.dj_equipment || 'DJ Equipment Setup' }];
    }
    return [];
  })();
  const selectedDjObj = parsedDjOptions.find(o => o.name === djPackage);
  const currentDjPrice = selectedDjObj ? parseFloat(selectedDjObj.price) : 0;
  const djCost = bundleDj ? currentDjPrice * days : 0;

  const parsedDecorOptions = (() => {
    try {
      const parsed = JSON.parse(venue.decor_themes);
      if (Array.isArray(parsed)) return parsed;
    } catch(e) {}
    if (venue.has_decor) {
      return [{ name: venue.decor_theme || 'Standard Decor Theme', price: String(venue.decor_price || 15000), description: venue.decor_themes || 'Decoration setup theme.' }];
    }
    return [];
  })();
  const selectedDecorObj = parsedDecorOptions.find(o => o.name === decorTheme);
  const currentDecorPrice = selectedDecorObj ? parseFloat(selectedDecorObj.price) : 0;
  const decorCost = bundleDecor ? currentDecorPrice : 0;

  const cateringDisplayPrice = parsedCateringOptions.length > 0 ? (parseFloat(parsedCateringOptions[0].price) || 0) : (parseFloat(venue.catering_price_per_plate) || 350);
  const djDisplayPrice = parsedDjOptions.length > 0 ? (parseFloat(parsedDjOptions[0].price) || 0) : (parseFloat(venue.dj_price) || 8000);
  const decorDisplayPrice = parsedDecorOptions.length > 0 ? (parseFloat(parsedDecorOptions[0].price) || 0) : (parseFloat(venue.decor_price) || 15000);

  const grandTotal = baseRent + serviceTax + securityDeposit + cateringCost + djCost + decorCost;

  const minPlates = parseInt(venue.catering_min_plates) || 10;

  const validateFacilities = () => {
    if (bundleCatering) {
      if (!guestsCount || guestsCount < minPlates) {
        setFacilityError(`Minimum plate order for catering is ${minPlates} plates.`);
        return false;
      }
      if (guestsCount > 10000) {
        setFacilityError('Maximum catering capacity is 10,000 plates per booking.');
        return false;
      }
      if (!cateringCuisine) {
        setFacilityError('Please select a Cuisine Type.');
        return false;
      }
      if (!cateringDescription.trim()) {
        setFacilityError('Please enter Menu Details.');
        return false;
      }
    }
    if (bundleDj) {
      if (!djPackage) {
        setFacilityError('Please select a DJ Package.');
        return false;
      }
      if (!djEquipment.trim()) {
        setFacilityError('Please provide DJ Equipment details.');
        return false;
      }
    }
    if (bundleDecor) {
      if (!decorTheme.trim()) {
        setFacilityError('Please specify a Decoration Theme.');
        return false;
      }
    }
    setFacilityError('');
    return true;
  };

  const handleProceedToPayment = (method) => {
    if (!validateFacilities()) return;
    setSelectedMethod(method);
    setPaymentStep(method);
    if (method === 'upi') {
      setQrTimer(180);
      setPaymentToken(`pay_tok_${uuid()}`);
    }
  };

  const handleSecurePaymentSubmit = async (e) => {
    e.preventDefault();
    setBookingError('');
    setCardError('');

    if (selectedMethod === 'upi') {
      const cleanUpi = upiId.trim();
      if (!cleanUpi) {
        setCardError('Please enter your UPI VPA ID.');
        return;
      }
      if (!cleanUpi.includes('@')) {
        setCardError("Invalid UPI ID. UPI ID must include '@' followed by your bank name (e.g. amit@okhdfcbank, user@paytm).");
        return;
      }
      const parts = cleanUpi.split('@');
      if (!parts[0] || !parts[1]) {
        setCardError("Invalid UPI ID format. Please specify username and bank name after '@' (e.g. amit@okhdfcbank).");
        return;
      }
      const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z0-9]{2,64}$/;
      if (!upiRegex.test(cleanUpi)) {
        setCardError("Invalid UPI ID format. Must be 'username@bankname' (e.g. amit@okhdfcbank, 9876543210@paytm, user@okaxis).");
        return;
      }
    }

    if (selectedMethod === 'card') {
      const cleanedCardNumber = cardNumber.replace(/\s/g, '');
      if (cleanedCardNumber.length !== 16) {
        setCardError('Card Number must be exactly 16 digits.');
        return;
      }
      if (!/^\d+$/.test(cleanedCardNumber)) {
        setCardError('Card Number must contain only digits.');
        return;
      }
      if (cardHolder.trim().length < 3) {
        setCardError('Cardholder Name must be at least 3 characters.');
        return;
      }
      if (!/^[a-zA-Z\s]+$/.test(cardHolder.trim())) {
        setCardError('Cardholder name must contain only letters and spaces.');
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        setCardError('Expiry Date must be in MM/YY format.');
        return;
      }
      const [expMonth, expYear] = cardExpiry.split('/').map(Number);
      if (expMonth < 1 || expMonth > 12) {
        setCardError('Expiry Month must be between 01 and 12.');
        return;
      }
      const currentYear = Number(new Date().getFullYear().toString().slice(-2));
      const currentMonth = new Date().getMonth() + 1;
      if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
        setCardError('Expiry Date cannot be in the past.');
        return;
      }
      if (cardCvv.length !== 3) {
        setCardError('CVV must be exactly 3 digits.');
        return;
      }
    }

    if (selectedMethod === 'netbanking' && !selectedBank) {
      setCardError('Please select a bank to proceed.');
      return;
    }

    setPaymentStep('processing');
    
    const messages = [
      "Connecting with EventHub rental payment engine...",
      "Securing escrow contract with venue owner...",
      "Authorizing lease hold on selected dates...",
      "Finalizing booking reservation receipts..."
    ];
    
    let msgIdx = 0;
    setProcessingMsg(messages[0]);
    const logInterval = setInterval(() => {
      msgIdx++;
      if (msgIdx < messages.length) {
        setProcessingMsg(messages[msgIdx]);
      }
    }, 700);

    try {
      await new Promise(resolve => setTimeout(resolve, 2200));
      clearInterval(logInterval);

      setBookingLoading(true);
      await api.post('venues/bookings/', {
        venue: venue.id,
        start_date: startDate,
        end_date: endDate,
        payment_status: 'paid',
        payment_id: `pay_mock_rental_${uuid()}`,
        use_catering: bundleCatering,
        catering_plates: bundleCatering ? guestsCount : 0,
        catering_cuisine: bundleCatering ? cateringCuisine : '',
        catering_description: bundleCatering ? cateringDescription : '',
        use_dj: bundleDj,
        dj_package: bundleDj ? djPackage : '',
        dj_equipment: bundleDj ? djEquipment : '',
        use_decor: bundleDecor,
        decor_theme: bundleDecor ? decorTheme : ''
      });

      setPaymentStep('success');
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
    } catch (err) {
      clearInterval(logInterval);
      setBookingError(err.response?.data?.error || "Transaction failed. Dates might be unavailable.");
      setPaymentStep('options');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleQrPaymentConfirm = async () => {
    setBookingError('');
    setPaymentStep('processing');
    
    const messages = [
      "Verifying QR Code transaction status...",
      "Connecting with EventHub rental payment engine...",
      "Securing escrow contract with venue owner...",
      "Authorizing lease hold on selected dates...",
      "Finalizing booking reservation receipts..."
    ];
    
    let msgIdx = 0;
    setProcessingMsg(messages[0]);
    const logInterval = setInterval(() => {
      msgIdx++;
      if (msgIdx < messages.length) {
        setProcessingMsg(messages[msgIdx]);
      }
    }, 700);

    try {
      await new Promise(resolve => setTimeout(resolve, 2200));
      clearInterval(logInterval);

      setBookingLoading(true);
      await api.post('venues/bookings/', {
        venue: venue.id,
        start_date: startDate,
        end_date: endDate,
        payment_status: 'paid',
        payment_id: `pay_mock_qr_${uuid()}`,
        use_catering: bundleCatering,
        catering_plates: bundleCatering ? guestsCount : 0,
        catering_cuisine: bundleCatering ? cateringCuisine : '',
        catering_description: bundleCatering ? cateringDescription : '',
        use_dj: bundleDj,
        dj_package: bundleDj ? djPackage : '',
        dj_equipment: bundleDj ? djEquipment : '',
        use_decor: bundleDecor,
        decor_theme: bundleDecor ? decorTheme : ''
      });

      setPaymentStep('success');
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
    } catch (err) {
      clearInterval(logInterval);
      setBookingError(err.response?.data?.error || "Transaction failed. Dates might be unavailable.");
      setPaymentStep('options');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* 3D Flip Card CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        .flip-card { perspective: 1000px; }
        .flip-card-inner {
          position: relative; width: 100%; height: 100%;
          transition: transform 0.6s; transform-style: preserve-3d;
        }
        .flip-card.flipped .flip-card-inner { transform: rotateY(180deg); }
        .flip-card-front, .flip-card-back {
          position: absolute; width: 100%; height: 100%;
          backface-visibility: hidden; border-radius: 0.75rem;
        }
        .flip-card-back { transform: rotateY(180deg); }
      `}} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl relative border border-white/10 text-center space-y-5 max-h-[92vh] overflow-y-auto"
      >
        {/* Close Button */}
        {paymentStep !== 'processing' && paymentStep !== 'success' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-dark-muted hover:text-red-400 transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        )}

        {/* ─── OPTIONS STEP ─── */}
        {paymentStep === 'options' && (
          <>
            <div className="w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto border border-brand-primary/20">
              <Lock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-dark-text uppercase tracking-wider">Secured Rental Checkout</h3>
              <p className="text-xs text-dark-muted mt-1">Book <strong>{venue.name}</strong> for {days} day{days !== 1 ? 's' : ''}</p>
            </div>

            {/* Optional Sub-facilities selection */}
            {(venue.has_catering || venue.has_dj || venue.has_decor) && (
              <div className="text-left space-y-3">
                <p className="text-[10px] font-bold text-dark-muted uppercase tracking-wider">Optional Add-On Services:</p>

                {/* Catering */}
                {venue.has_catering && (
                  <div className={`border rounded-xl p-3 space-y-3 transition-all ${bundleCatering ? 'border-orange-500/40 bg-orange-500/5' : 'border-white/10 bg-white/[0.01]'}`}>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={bundleCatering}
                        onChange={(e) => { setBundleCatering(e.target.checked); setFacilityError(''); }}
                        className="mt-0.5 accent-orange-500 w-4 h-4 flex-shrink-0"
                      />
                      <div className="flex-grow">
                        <div className="flex items-center gap-2">
                          <UtensilsCrossed className="w-4 h-4 text-orange-400" />
                          <span className="text-sm font-bold text-dark-text">Catering Service</span>
                          <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded">₹{cateringDisplayPrice.toLocaleString('en-IN')}/plate</span>
                        </div>
                        {minPlates > 0 && (
                          <p className="text-[10px] text-dark-muted mt-1">Min. order: <span className="text-orange-400 font-medium">{minPlates} plates</span></p>
                        )}
                      </div>
                    </label>
                    {bundleCatering && (
                      <div className="pl-7 space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-dark-muted uppercase tracking-wider mb-1">Number of Guests / Plates *</label>
                          <div className="flex items-center gap-3">
                            <button 
                              type="button"
                              onClick={() => setGuestsCount(prev => Math.max(minPlates, prev - 10))}
                              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-dark-text font-bold text-sm transition-colors"
                            >−</button>
                            <input 
                              type="number"
                              value={guestsCount}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setGuestsCount(val);
                                setFacilityError('');
                              }}
                              min={minPlates}
                              max="10000"
                              className="w-24 bg-slate-900 border border-white/10 text-xs rounded-lg px-3 py-1.5 text-dark-text text-center focus:outline-none focus:border-orange-500/50"
                            />
                            <button 
                              type="button"
                              onClick={() => setGuestsCount(prev => Math.min(10000, prev + 10))}
                              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-dark-text font-bold text-sm transition-colors"
                            >+</button>
                            <span className="text-xs text-dark-muted">plates</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-dark-muted uppercase tracking-wider mb-1">Cuisine / Menu Option *</label>
                          <select
                            value={cateringCuisine}
                            onChange={(e) => {
                              const selectedName = e.target.value;
                              setCateringCuisine(selectedName);
                              const match = parsedCateringOptions.find(o => o.name === selectedName);
                              setCateringDescription(match ? match.description : '');
                              setFacilityError('');
                            }}
                            className="w-full bg-slate-900 border border-white/10 text-xs rounded-lg px-3 py-2 text-dark-text focus:outline-none focus:border-orange-500/50 bg-dark-bg cursor-pointer"
                          >
                            <option value="" className="bg-[#0A0E1A] text-slate-400">Select menu option...</option>
                            {parsedCateringOptions.map((opt, oidx) => (
                              <option key={oidx} value={opt.name} className="bg-[#0A0E1A] text-slate-100">
                                {opt.name} (₹{parseFloat(opt.price || 0).toLocaleString('en-IN')}/plate)
                              </option>
                            ))}
                          </select>
                        </div>

                        {cateringDescription && (
                          <div className="bg-white/5 border border-white/5 rounded-lg p-2.5 mt-1 text-[10px] text-dark-muted text-left">
                            <span className="font-bold text-[9px] uppercase text-orange-400 block mb-0.5">Menu / Inclusions</span>
                            {cateringDescription}
                          </div>
                        )}

                        <p className="text-xs font-semibold text-orange-400">
                          Catering Cost: ₹{cateringCost.toLocaleString('en-IN')}
                        </p>
                        {guestsCount < minPlates && (
                          <p className="text-[10px] text-red-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Minimum {minPlates} plates required
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* DJ */}
                {venue.has_dj && (
                  <div className={`border rounded-xl p-3 space-y-3 transition-all ${bundleDj ? 'border-purple-500/40 bg-purple-500/5' : 'border-white/10 bg-white/[0.01]'}`}>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={bundleDj}
                        onChange={(e) => { setBundleDj(e.target.checked); setFacilityError(''); }}
                        className="mt-0.5 accent-purple-500 w-4 h-4 flex-shrink-0"
                      />
                      <div className="flex-grow">
                        <div className="flex items-center gap-2">
                          <Music2 className="w-4 h-4 text-purple-400" />
                          <span className="text-sm font-bold text-dark-text">DJ Service</span>
                          <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">₹{djDisplayPrice.toLocaleString('en-IN')}/day</span>
                        </div>
                        <p className="text-[10px] text-dark-muted mt-0.5">
                          Professional DJ setup for {days} day{days !== 1 ? 's' : ''} · Total: <span className="text-purple-400 font-semibold">₹{djCost.toLocaleString('en-IN')}</span>
                        </p>
                      </div>
                    </label>

                    {bundleDj && (
                      <div className="pl-7 space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-dark-muted uppercase tracking-wider mb-1">DJ Package Option *</label>
                          <select
                            value={djPackage}
                            onChange={(e) => {
                              const selectedName = e.target.value;
                              setDjPackage(selectedName);
                              const match = parsedDjOptions.find(o => o.name === selectedName);
                              setDjEquipment(match ? match.equipment : '');
                              setFacilityError('');
                            }}
                            className="w-full bg-slate-900 border border-white/10 text-xs rounded-lg px-3 py-2 text-dark-text focus:outline-none focus:border-purple-500/50 bg-dark-bg cursor-pointer"
                          >
                            <option value="" className="bg-[#0A0E1A] text-slate-400">Select package option...</option>
                            {parsedDjOptions.map((opt, oidx) => (
                              <option key={oidx} value={opt.name} className="bg-[#0A0E1A] text-slate-100">
                                {opt.name} (₹{parseFloat(opt.price || 0).toLocaleString('en-IN')}/day)
                              </option>
                            ))}
                          </select>
                        </div>

                        {djEquipment && (
                          <div className="bg-white/5 border border-white/5 rounded-lg p-2.5 mt-1 text-[10px] text-dark-muted text-left">
                            <span className="font-bold text-[9px] uppercase text-purple-400 block mb-0.5">Included Equipment</span>
                            {djEquipment}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Decoration */}
                {venue.has_decor && (
                  <div className={`border rounded-xl p-3 space-y-3 transition-all ${bundleDecor ? 'border-pink-500/40 bg-pink-500/5' : 'border-white/10 bg-white/[0.01]'}`}>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={bundleDecor}
                        onChange={(e) => { setBundleDecor(e.target.checked); setFacilityError(''); }}
                        className="mt-0.5 accent-pink-500 w-4 h-4 flex-shrink-0"
                      />
                      <div className="flex-grow">
                        <div className="flex items-center gap-2">
                          <Palette className="w-4 h-4 text-pink-400" />
                          <span className="text-sm font-bold text-dark-text">Decoration Service</span>
                          <span className="text-[10px] font-bold text-pink-400 bg-pink-500/10 px-1.5 py-0.5 rounded">₹{decorDisplayPrice.toLocaleString('en-IN')} flat</span>
                        </div>
                        <p className="text-[10px] text-dark-muted mt-0.5">
                          Full venue decoration setup included.
                        </p>
                      </div>
                    </label>

                    {bundleDecor && (
                      <div className="pl-7 space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-dark-muted uppercase tracking-wider mb-1">Decoration Theme Option *</label>
                          <select
                            value={decorTheme}
                            onChange={(e) => {
                              setDecorTheme(e.target.value);
                              setFacilityError('');
                            }}
                            className="w-full bg-slate-900 border border-white/10 text-xs rounded-lg px-3 py-2 text-dark-text focus:outline-none focus:border-pink-500/50 bg-dark-bg cursor-pointer"
                          >
                            <option value="" className="bg-[#0A0E1A] text-slate-400">Select decoration theme...</option>
                            {parsedDecorOptions.map((opt, oidx) => (
                              <option key={oidx} value={opt.name} className="bg-[#0A0E1A] text-slate-100">
                                {opt.name} (₹{parseFloat(opt.price || 0).toLocaleString('en-IN')})
                              </option>
                            ))}
                          </select>
                        </div>

                        {(() => {
                          const chosenObj = parsedDecorOptions.find(o => o.name === decorTheme);
                          return chosenObj && chosenObj.description ? (
                            <div className="bg-white/5 border border-white/5 rounded-lg p-2.5 mt-1 text-[10px] text-dark-muted text-left">
                              <span className="font-bold text-[9px] uppercase text-pink-400 block mb-0.5">Theme Description</span>
                              {chosenObj.description}
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {facilityError && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 p-2.5 rounded-lg text-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{facilityError}</span>
                  </div>
                )}
              </div>
            )}

            {/* Price breakdown summary */}
            <div className="bg-white/[0.01] border border-white/5 p-4 rounded-xl text-xs text-left space-y-2">
              <div className="flex justify-between text-dark-muted">
                <span>Rent Amount ({days} day{days !== 1 ? 's' : ''})</span>
                <span>₹{baseRent.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-dark-muted">
                <span>GST (18% Service Tax)</span>
                <span>₹{serviceTax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-dark-muted">
                <span>Escrow Security Deposit (Refundable)</span>
                <span>₹{securityDeposit.toLocaleString('en-IN')}</span>
              </div>
              {bundleCatering && (
                <div className="flex justify-between text-orange-400">
                  <span className="flex items-center gap-1"><UtensilsCrossed className="w-3 h-3" /> Catering ({guestsCount} plates)</span>
                  <span>₹{cateringCost.toLocaleString('en-IN')}</span>
                </div>
              )}
              {bundleDj && (
                <div className="flex justify-between text-purple-400">
                  <span className="flex items-center gap-1"><Music2 className="w-3 h-3" /> DJ ({days} days)</span>
                  <span>₹{djCost.toLocaleString('en-IN')}</span>
                </div>
              )}
              {bundleDecor && (
                <div className="flex justify-between text-pink-400">
                  <span className="flex items-center gap-1"><Palette className="w-3 h-3" /> Decoration (Flat)</span>
                  <span>₹{decorCost.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm font-bold border-t border-white/5 pt-2.5 mt-2">
                <span className="text-dark-text">Grand Total</span>
                <span className="text-brand-primary text-base">₹{grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            {bookingError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-semibold text-left flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            <div className="space-y-3">
              {/* UPI */}
              <button
                onClick={() => handleProceedToPayment('upi')}
                className="w-full p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-brand-primary/30 flex items-center justify-between text-left group transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-dark-text group-hover:text-brand-primary transition-colors">Instant UPI Transfer</p>
                    <p className="text-[9px] text-dark-muted mt-0.5">Pay using GPay, PhonePe, or BHIM</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-dark-muted group-hover:text-dark-text" />
              </button>

              {/* Cards */}
              <button
                onClick={() => handleProceedToPayment('card')}
                className="w-full p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-brand-primary/30 flex items-center justify-between text-left group transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-dark-text group-hover:text-brand-primary transition-colors">Credit / Debit Card</p>
                    <p className="text-[9px] text-dark-muted mt-0.5">Supports Visa, MasterCard, RuPay</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-dark-muted group-hover:text-dark-text" />
              </button>

              {/* NetBanking */}
              <button
                onClick={() => handleProceedToPayment('netbanking')}
                className="w-full p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-brand-primary/30 flex items-center justify-between text-left group transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-dark-text group-hover:text-brand-primary transition-colors">Net Banking</p>
                    <p className="text-[9px] text-dark-muted mt-0.5">Direct login transfer from top Indian banks</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-dark-muted group-hover:text-dark-text" />
              </button>
            </div>
          </>
        )}

        {/* ─── UPI CHECKOUT ─── */}
        {paymentStep === 'upi' && (() => {
          const qrUrl = `${window.location.protocol}//${window.location.host}/pay-simulate?token=${paymentToken}&amount=${grandTotal}&label=${encodeURIComponent('Venue booking for ' + venue.name)}`;
          return (
            <div className="w-full text-left space-y-4">
              <h3 className="text-sm font-bold text-dark-text border-b border-white/5 pb-2">Scan QR Code or Enter UPI ID</h3>
              
              <div className="w-full flex flex-col items-center mb-4 bg-white/[0.01] border border-white/5 py-5 px-4 rounded-xl relative overflow-hidden">
                {/* Pulsing Active / Expired Badge */}
                <div className="flex items-center gap-1.5 mb-3 relative">
                  {qrTimer > 0 ? (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 absolute left-0.5 top-0.5"></span>
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider ml-1">QR Code Active</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider">QR Code Expired</span>
                    </>
                  )}
                </div>

                {/* QR Image Container */}
                <div className="relative w-36 h-36 border border-white/10 rounded-xl p-2 bg-white/5 flex items-center justify-center overflow-hidden transition-all duration-300">
                  {qrTimer > 0 ? (
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(qrUrl)}`}
                      alt="UPI Payment QR Code" 
                      className="w-28 h-28 rounded-lg"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-2 absolute inset-0 bg-black/80 backdrop-blur-sm">
                      <AlertCircle className="w-8 h-8 text-red-400 mb-1" />
                      <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Session Timeout</span>
                      <span className="text-[9px] text-dark-muted mt-0.5">Please regenerate code</span>
                    </div>
                  )}
                </div>
                
                {/* Timer Display */}
                {qrTimer > 0 ? (
                  <div className="text-center mt-3 space-y-1">
                    <p className="text-[11px] font-mono text-dark-text bg-white/5 px-3 py-1 rounded-full border border-white/5">
                      Time Remaining: <span className="font-bold text-brand-primary">{formatTime(qrTimer)}</span>
                    </p>
                    <p className="text-[8px] text-dark-muted">Amount: ₹{grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                    <div className="pt-1">
                      <a
                        href={qrUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-brand-primary hover:underline font-bold"
                      >
                        Testing locally? Open Simulator
                      </a>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setQrTimer(180); setPaymentToken(`pay_tok_${uuid()}`); }}
                    className="mt-3 px-4 py-1.5 bg-brand-primary/10 border border-brand-primary/20 hover:bg-brand-primary/20 text-brand-primary rounded-full text-[10px] font-bold uppercase tracking-wider transition-all"
                  >
                    Regenerate QR Code
                  </button>
                )}
              </div>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink mx-4 text-[9px] text-dark-muted uppercase font-bold">Or Enter UPI ID</span>
                <div className="flex-grow border-t border-white/5"></div>
              </div>

              <form onSubmit={handleSecurePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-dark-muted uppercase font-bold mb-1">UPI VPA ID *</label>
                  <input
                    type="text"
                    required
                    value={upiId}
                    disabled={qrTimer === 0}
                    onChange={(e) => { setUpiId(e.target.value); setCardError(''); }}
                    placeholder="Enter UPI ID"
                    className="glass-input w-full px-3 py-2.5 text-xs disabled:opacity-50"
                  />
                  <p className="text-[10px] text-dark-muted mt-1">Format: username@bankname (e.g. user@okhdfcbank, user@paytm)</p>
                </div>

                {cardError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-2.5 rounded-lg text-xs flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{cardError}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setPaymentStep('options')}
                    className="flex-1 bg-white/5 border border-white/10 text-dark-text py-2.5 rounded-xl text-xs font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={qrTimer === 0}
                    className="flex-1 bg-brand-primary text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                  >
                    Pay ₹{grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </button>
                </div>
              </form>
            </div>
          );
        })()}

        {/* ─── CARD CHECKOUT ─── */}
        {paymentStep === 'card' && (
          <div className="w-full text-left space-y-4">
            <h3 className="text-sm font-bold text-dark-text border-b border-white/5 pb-2">Credit / Debit Card Details</h3>
            
            <div className="w-full flex justify-center mb-6">
              <div className={`flip-card w-72 h-40 ${isCardFlipped ? 'flipped' : ''}`}>
                <div className="flip-card-inner">
                  <div className="flip-card-front bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-500/20 border border-white/10 p-5 text-left flex flex-col justify-between shadow-lg">
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-7 rounded bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center">
                        <div className="w-6 h-4 border border-yellow-500/30 rounded-sm"></div>
                      </div>
                      <span className="text-[9px] font-black tracking-widest text-emerald-400 uppercase">Secure Card</span>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-sm font-bold tracking-widest text-slate-100 font-mono">
                        {cardNumber || '•••• •••• •••• ••••'}
                      </p>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[7px] text-slate-500 uppercase font-semibold">Holder</p>
                          <p className="text-xs font-semibold text-slate-200 uppercase truncate max-w-[130px] font-sans">
                            {cardHolder.toUpperCase() || 'NAME SURNAME'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[7px] text-slate-500 uppercase font-semibold">Expires</p>
                          <p className="text-xs font-semibold text-slate-200 font-mono">
                            {cardExpiry || 'MM/YY'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flip-card-back bg-gradient-to-br from-slate-800 to-slate-950 border border-white/10 text-left flex flex-col justify-between py-4 shadow-lg">
                    <div className="w-full h-8 bg-slate-900 mt-1"></div>
                    <div className="px-5 space-y-2">
                      <div className="flex items-center justify-end">
                        <span className="text-[8px] text-slate-500 uppercase font-semibold mr-2">CVV</span>
                        <div className="w-12 h-6 bg-slate-700/30 rounded border border-white/5 flex items-center justify-center">
                          <span className="text-xs font-bold text-slate-200 font-mono italic">
                            {cardCvv || '•••'}
                          </span>
                        </div>
                      </div>
                      <p className="text-[6.5px] text-slate-600 leading-normal">
                        Authorized for PCI-DSS secure online transactions on EventHub network.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {cardError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-semibold text-center flex items-center gap-2 justify-center">
                <AlertCircle className="w-4 h-4" />
                {cardError}
              </div>
            )}

            <form onSubmit={handleSecurePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] text-dark-muted uppercase font-bold mb-1">Card Number *</label>
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim();
                    setCardNumber(val);
                    setCardError('');
                  }}
                  placeholder="4111 2222 3333 4444"
                  maxLength="19"
                  className="glass-input w-full px-3 py-2.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-dark-muted uppercase font-bold mb-1">Cardholder Name *</label>
                <input
                  type="text"
                  required
                  value={cardHolder}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^A-Za-z\s]/g, '');
                    setCardHolder(val);
                    setCardError('');
                  }}
                  placeholder="Amit Patel"
                  className="glass-input w-full px-3 py-2.5 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-dark-muted uppercase font-bold mb-1">Expiry (MM/YY) *</label>
                  <input
                    type="text"
                    required
                    value={cardExpiry}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2, 4);
                      setCardExpiry(val);
                      setCardError('');
                    }}
                    placeholder="MM/YY"
                    maxLength="5"
                    className="glass-input w-full px-3 py-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-dark-muted uppercase font-bold mb-1">CVV *</label>
                  <input
                    type="text"
                    required
                    value={cardCvv}
                    onFocus={() => setIsCardFlipped(true)}
                    onBlur={() => setIsCardFlipped(false)}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                      setCardCvv(val);
                      setCardError('');
                    }}
                    placeholder="123"
                    maxLength="3"
                    className="glass-input w-full px-3 py-2.5 text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentStep('options')}
                  className="flex-1 bg-white/5 border border-white/10 text-dark-text py-2.5 rounded-xl text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-grow bg-[#10B981] hover:bg-[#059669] text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                >
                  Pay ₹{grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ─── NETBANKING CHECKOUT ─── */}
        {paymentStep === 'netbanking' && (
          <div className="w-full text-left space-y-4">
            <h3 className="text-sm font-bold text-dark-text border-b border-white/5 pb-2">Select Net Banking Option</h3>
            
            <form onSubmit={handleSecurePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] text-dark-muted uppercase font-bold mb-1">Select Bank *</label>
                <select
                  required
                  value={selectedBank}
                  onChange={(e) => { setSelectedBank(e.target.value); setCardError(''); }}
                  className="glass-input w-full px-3 py-2.5 text-xs bg-dark-bg text-dark-text"
                >
                  <option value="">Choose Bank...</option>
                  <option value="sbi">State Bank of India</option>
                  <option value="hdfc">HDFC Bank</option>
                  <option value="icici">ICICI Bank</option>
                  <option value="axis">Axis Bank</option>
                  <option value="kotak">Kotak Mahindra Bank</option>
                  <option value="bob">Bank of Baroda</option>
                  <option value="pnb">Punjab National Bank</option>
                </select>
              </div>

              {cardError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-2.5 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{cardError}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentStep('options')}
                  className="flex-1 bg-white/5 border border-white/10 text-dark-text py-2.5 rounded-xl text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-brand-primary text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Proceed to Bank
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ─── PROCESSING ─── */}
        {paymentStep === 'processing' && (
          <div className="py-8 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
            <p className="text-xs font-semibold text-dark-text">{processingMsg}</p>
            <p className="text-[10px] text-dark-muted">Please do not exit this checkout screen.</p>
          </div>
        )}

        {/* ─── SUCCESS ─── */}
        {paymentStep === 'success' && (
          <div className="py-8 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-dark-text">Payment Successful!</h3>
            <p className="text-xs text-dark-muted max-w-[280px]">
              Your rental has been reserved. The venue owner has been notified and will confirm your booking shortly.
            </p>
            {(bundleCatering || bundleDj || bundleDecor) && (
              <div className="flex flex-wrap gap-1.5 justify-center">
                {bundleCatering && <span className="text-[10px] bg-orange-500/10 text-orange-400 px-2 py-1 rounded-lg">✓ Catering ×{guestsCount}</span>}
                {bundleDj && <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-1 rounded-lg">✓ DJ Service</span>}
                {bundleDecor && <span className="text-[10px] bg-pink-500/10 text-pink-400 px-2 py-1 rounded-lg">✓ Decoration</span>}
              </div>
            )}
            <button
              onClick={onClose}
              className="bg-brand-primary hover:bg-[#0ea5e9] text-white px-8 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-md mt-6"
            >
              Done
            </button>
          </div>
        )}

        {paymentStep !== 'processing' && paymentStep !== 'success' && (
          <div className="flex items-center justify-center space-x-1.5 text-[9px] text-dark-muted border-t border-white/5 pt-4 mt-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Escrow Secured Contract Reservation Engine · EventHub</span>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default VenuePaymentModal;
