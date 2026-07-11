import React, { useState, useRef } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  X, Ticket, CheckCircle2, Lock, Smartphone, CreditCard, 
  ShieldCheck, Download, ChevronLeft, ChevronRight, Landmark 
} from 'lucide-react';

const BookingModal = ({ event, onClose, onBookingSuccess }) => {
  const { user } = useAuth();
  
  // State variables for checkout
  const [ticketsCount, setTicketsCount] = useState(1);
  const [selectedTier, setSelectedTier] = useState('Silver');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // Post-payment ticket states
  const [bookingId, setBookingId] = useState(null);
  const [confirmedAmount, setConfirmedAmount] = useState(0);
  const ticketRef = useRef(null);

  // Payment Selection Custom States
  const [paymentStep, setPaymentStep] = useState(event.price > 0 ? 'options' : 'setup'); // setup, options, card, upi, netbanking, processing
  const [selectedMethod, setSelectedMethod] = useState(''); // card, upi, netbanking
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [cardError, setCardError] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [processingMsg, setProcessingMsg] = useState('');
  const [qrTimer, setQrTimer] = useState(180);
  const [paymentToken, setPaymentToken] = useState('');

  // UPI QR Code countdown timer
  React.useEffect(() => {
    let interval = null;
    if (paymentStep === 'upi-details' && qrTimer > 0) {
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
    if (paymentStep === 'upi-details' && paymentToken && qrTimer > 0) {
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

  const uuid = () => Math.random().toString(36).substring(2, 15);

  // Safety fallback for dynamic feed events to prevent NaN
  const ticketsRemaining = (event.tickets_total !== undefined && event.tickets_sold !== undefined)
    ? (event.tickets_total - event.tickets_sold)
    : 100;

  // Pricing calculations
  const multipliers = {
    Silver: 1.0,
    Gold: 1.5,
    Diamond: 2.5,
    Fanpit: 4.0
  };
  const currentMultiplier = multipliers[selectedTier] || 1.0;
  const unitPrice = event.price * currentMultiplier;
  const handlingFeePerTicket = event.price > 0 ? 15 : 0;
  const basePrice = ticketsCount * unitPrice;
  const discountAmount = appliedCoupon ? (basePrice * (appliedCoupon.discount_percent / 100)) : 0;
  const totalHandlingFee = ticketsCount * handlingFeePerTicket;
  const finalPrice = Math.max(0, basePrice - discountAmount + totalHandlingFee);

  const applySuggestedCoupon = async (code) => {
    setCouponCode(code);
    setCouponLoading(true);
    setCouponError('');
    try {
      const response = await api.post('events/coupons/apply/', { code });
      setAppliedCoupon(response.data);
    } catch (err) {
      setCouponError(err.response?.data?.error || "Invalid coupon code.");
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const response = await api.post('events/coupons/apply/', { code: couponCode });
      setAppliedCoupon(response.data);
    } catch (err) {
      setCouponError(err.response?.data?.error || "Invalid coupon code.");
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    
    if (finalPrice <= 0) {
      // Direct free booking
      setBookingLoading(true);
      try {
        const freeRes = await api.post(`events/${event.id}/book/`, {
          tickets_count: ticketsCount,
          ticket_category: selectedTier,
          coupon_code: appliedCoupon ? appliedCoupon.code : null
        });
        setBookingId(freeRes.data?.id ? `EH-${String(freeRes.data.id).padStart(7, '0')}` : `EH-${Date.now()}`);
        setConfirmedAmount(0);
        setBookingSuccess(true);
        if (onBookingSuccess) onBookingSuccess();
      } catch (err) {
        alert(err.response?.data?.error || "Booking failed.");
      } finally {
        setBookingLoading(false);
      }
    } else {
      // Paid ticket, go to method choices
      setPaymentStep('options');
    }
  };

  const handleSecurePaymentSubmit = async (e) => {
    e.preventDefault();
    setCardError('');
    
    if (selectedMethod === 'card') {
      const cleanedCardNumber = cardNumber.replace(/\s/g, '');
      if (cleanedCardNumber.length !== 16) {
        setCardError('Card Number must be exactly 16 digits.');
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
      const currentMonth = new Date().getMonth() + 1; // 1-12
      if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
        setCardError('Expiry Date cannot be in the past.');
        return;
      }
      if (cardCvv.length !== 3) {
        setCardError('CVV must be exactly 3 digits.');
        return;
      }
    }

    setPaymentStep('processing');
    
    const messages = [
      "Connecting with EventHub secured payment engine...",
      "Routing request to 3D-Secure payment gateway...",
      "Authorizing and verifying ticket availability...",
      "Generating EventHub secure entry QR codes..."
    ];
    
    let msgIdx = 0;
    setProcessingMsg(messages[0]);
    const logInterval = setInterval(() => {
      msgIdx++;
      if (msgIdx < messages.length) {
        setProcessingMsg(messages[msgIdx]);
      }
    }, 750);

    try {
      // Create checkout booking order
      const bookingRes = await api.post(`events/${event.id}/book/`, {
        tickets_count: ticketsCount,
        ticket_category: selectedTier,
        coupon_code: appliedCoupon ? appliedCoupon.code : null
      });

      const orderId = bookingRes.data.razorpay_order_id;

      // Simulate payment processing latency
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify signature on backend
      const verifyRes = await api.post('events/bookings/verify/', {
        razorpay_order_id: orderId,
        razorpay_payment_id: `pay_mock_${uuid()}`,
        razorpay_signature: `sig_mock_${uuid()}`
      });

      clearInterval(logInterval);
      const bData = verifyRes.data;
      setBookingId(bData?.id ? `EH-${String(bData.id).padStart(7, '0')}` : `EH-${Date.now()}`);
      setConfirmedAmount(finalPrice);
      setBookingSuccess(true);
      if (onBookingSuccess) onBookingSuccess();
    } catch (err) {
      clearInterval(logInterval);
      alert(err.response?.data?.error || "Transaction failed.");
      setPaymentStep('options');
    }
  };

  const handleQrPaymentConfirm = async () => {
    setPaymentStep('processing');
    
    const messages = [
      "Verifying QR Code transaction status...",
      "Connecting with EventHub secured payment engine...",
      "Routing request to 3D-Secure payment gateway...",
      "Authorizing and verifying ticket availability...",
      "Generating EventHub secure entry QR codes..."
    ];
    
    let msgIdx = 0;
    setProcessingMsg(messages[0]);
    const logInterval = setInterval(() => {
      msgIdx++;
      if (msgIdx < messages.length) {
        setProcessingMsg(messages[msgIdx]);
      }
    }, 750);

    try {
      // Create checkout booking order
      const bookingRes = await api.post(`events/${event.id}/book/`, {
        tickets_count: ticketsCount,
        ticket_category: selectedTier,
        coupon_code: appliedCoupon ? appliedCoupon.code : null
      });

      const orderId = bookingRes.data.razorpay_order_id;

      // Simulate payment processing latency
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify signature on backend
      const verifyRes = await api.post('events/bookings/verify/', {
        razorpay_order_id: orderId,
        razorpay_payment_id: `pay_mock_qr_${uuid()}`,
        razorpay_signature: `sig_mock_${uuid()}`
      });

      clearInterval(logInterval);
      const bData = verifyRes.data;
      setBookingId(bData?.id ? `EH-${String(bData.id).padStart(7, '0')}` : `EH-${Date.now()}`);
      setConfirmedAmount(finalPrice);
      setBookingSuccess(true);
      if (onBookingSuccess) onBookingSuccess();
    } catch (err) {
      clearInterval(logInterval);
      alert(err.response?.data?.error || "Transaction failed.");
      setPaymentStep('options');
    }
  };

  const downloadTicket = async () => {
    if (!ticketRef.current) return;
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');
      const canvas = await html2canvas(ticketRef.current, { useCORS: true, scale: 2, backgroundColor: '#0f172a' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [100, 170] });
      pdf.addImage(imgData, 'PNG', 0, 0, 100, 170);
      pdf.save(`EventHub_Ticket_${bookingId}.pdf`);
    } catch (err) {
      console.error('PDF download failed:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* 3D Flip Card CSS Injection */}
      <style dangerouslySetInnerHTML={{__html: `
        .flip-card {
          perspective: 1000px;
        }
        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.6s;
          transform-style: preserve-3d;
        }
        .flip-card.flipped .flip-card-inner {
          transform: rotateY(180deg);
        }
        .flip-card-front, .flip-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          border-radius: 0.75rem;
        }
        .flip-card-back {
          transform: rotateY(180deg);
        }
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}} />

      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm"
      ></div>

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-glass z-10 text-center flex flex-col items-center relative max-h-[92vh] overflow-y-auto border border-white/10"
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-dark-muted hover:text-dark-text"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="flex items-center space-x-2 mb-6 border-b border-white/5 pb-3.5 w-full text-left">
          <span className="text-[#3B82F6] font-black text-xl tracking-tight">Event</span>
          <span className="bg-[#3B82F6] text-white text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-tight">Hub</span>
          <span className="text-[9px] text-dark-muted font-bold ml-2 border-l border-white/10 pl-2 uppercase tracking-widest">Secure Checkout</span>
        </div>

        {bookingSuccess ? (
          <div className="w-full">
            {/* Success Header */}
            <div className="flex flex-col items-center mb-5">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="w-14 h-14 rounded-full bg-[#3B82F6]/10 text-[#3B82F6] flex items-center justify-center mb-3 border border-[#3B82F6]/20"
              >
                <CheckCircle2 className="w-8 h-8" />
              </motion.div>
              <h3 className="text-xl font-bold text-dark-text">Booking Confirmed!</h3>
              <p className="text-xs text-dark-muted mt-1">Show this ticket at the entrance</p>
            </div>

            {/* Visual Ticket */}
            <div ref={ticketRef} className="w-full rounded-xl overflow-hidden border border-[#3B82F6]/20 shadow-xl">
              {/* Ticket Top - Red Header */}
              <div className="bg-[#3B82F6] px-5 py-4 text-white text-left flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-1">
                    <span className="text-white text-[8px] font-extrabold bg-white/20 px-1.5 py-0.5 rounded tracking-wider uppercase">E-Ticket</span>
                    <span className="text-[9px] font-bold opacity-80">EventHub Verified</span>
                  </div>
                  <h4 className="text-base font-black mt-2 leading-tight">{event.title}</h4>
                </div>
                <div className="bg-black/20 rounded-lg px-2.5 py-1.5 text-center min-w-[45px]">
                  <p className="text-[8px] uppercase font-bold opacity-80">Tickets</p>
                  <p className="text-lg font-black">{ticketsCount}</p>
                </div>
              </div>

              {/* Ticket Middle - Details */}
              <div className="bg-slate-950 px-5 py-4 space-y-4 text-left border-x border-white/5">
                <div className="grid grid-cols-2 gap-y-3.5 gap-x-2">
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Show Date & Time</p>
                    <p className="text-xs font-semibold text-slate-200 mt-0.5">
                      {event.date ? new Date(event.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'} at {event.time}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Venue Location</p>
                    <p className="text-xs font-semibold text-slate-200 mt-0.5 truncate">{event.location || 'Ahmedabad'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Seat Category</p>
                    <p className="text-xs font-semibold text-[#3B82F6] mt-0.5 uppercase tracking-wide">
                      {selectedTier} Tier
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Paid Amount</p>
                    <p className="text-xs font-extrabold text-emerald-400 mt-0.5">₹{confirmedAmount.toFixed(2)}</p>
                  </div>
                </div>

                {/* Ticket ID Box */}
                <div className="bg-slate-900 rounded-lg px-3 py-2.5 flex justify-between items-center border border-white/5">
                  <div>
                    <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">Booking ID</p>
                    <p className="text-xs font-mono font-bold text-slate-200 mt-0.5">{bookingId}</p>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse"></div>
                </div>
              </div>

              {/* Ticket Tear Line (notches) */}
              <div className="relative bg-slate-950 h-3 border-x border-white/5">
                <div className="absolute -left-3 -top-1 w-6 h-6 rounded-full bg-dark-bg"></div>
                <div className="absolute -right-3 -top-1 w-6 h-6 rounded-full bg-dark-bg"></div>
                <div className="border-t border-dashed border-slate-800 mx-4 pt-1.5"></div>
              </div>

              {/* Ticket Bottom - QR Code */}
              <div className="bg-slate-950 px-5 py-4 flex items-center justify-between text-left rounded-b-xl border-x border-b border-white/5">
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">EventHub Entry Scan</p>
                  <p className="text-[9px] text-slate-600 mt-0.5 leading-normal">Do not share this ticket code.</p>
                </div>
                <div className="bg-white p-1 rounded-lg">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=EVENTHUB:${bookingId}:${event.id}:${ticketsCount}`}
                    alt="Ticket QR Code"
                    className="w-16 h-16"
                    crossOrigin="anonymous"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-5">
              <button
                onClick={downloadTicket}
                className="flex-1 flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-slate-300 font-semibold py-3 rounded-xl hover:bg-white/10 transition-all text-xs uppercase tracking-wider"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-[#3B82F6] text-white font-bold py-3 rounded-xl hover:bg-[#1D4ED8] transition-all text-xs uppercase tracking-wider"
              >
                Done
              </button>
            </div>
          </div>
        ) : paymentStep === 'setup' ? (
          <>
            <h3 className="text-lg font-bold text-dark-text text-left">Confirm Event Tickets</h3>
            <p className="text-xs text-dark-muted mt-1 text-left">Select details for: <strong>{event.title}</strong></p>

            <form onSubmit={handleBookingSubmit} className="w-full mt-5 space-y-4 text-left">
              {/* Ticket Tier Selector */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-dark-muted uppercase tracking-wider">
                  Select Pass Category / Tier
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'Silver', multiplier: 1.0, color: 'border-slate-500 text-slate-300' },
                    { key: 'Gold', multiplier: 1.5, color: 'border-yellow-600 text-yellow-400' },
                    { key: 'Diamond', multiplier: 2.5, color: 'border-cyan-500 text-cyan-400' },
                    { key: 'Fanpit', multiplier: 4.0, color: 'border-purple-500 text-purple-400' }
                  ].map((tier) => {
                    const priceForTier = event.price * tier.multiplier;
                    const isSelected = selectedTier === tier.key;
                    return (
                      <button
                        key={tier.key}
                        type="button"
                        onClick={() => setSelectedTier(tier.key)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected 
                            ? 'bg-[#3B82F6]/15 border-[#3B82F6] shadow-md shadow-blue-950/20' 
                            : 'bg-white/5 border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className={`text-xs font-extrabold uppercase ${tier.color}`}>
                            {tier.key}
                          </span>
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                          )}
                        </div>
                        <p className="text-sm font-black text-dark-text mt-1">
                          ₹{priceForTier.toFixed(0)}
                        </p>
                        <p className="text-[8px] text-dark-muted mt-0.5 font-semibold uppercase tracking-wider">
                          {tier.multiplier === 1.0 ? 'Base Price' : `${tier.multiplier}x Multiplier`}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tickets counter */}
              <div className="flex items-center justify-between bg-white/5 border border-white/5 p-4 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-dark-text">Number of Tickets</p>
                  <p className="text-[10px] text-dark-muted mt-0.5">Maximum 10 tickets per user</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setTicketsCount(c => Math.max(1, c - 1))}
                    className="w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10 rounded-lg font-bold text-dark-text hover:bg-white/10"
                  >
                    -
                  </button>
                  <span className="font-bold text-dark-text">{ticketsCount}</span>
                  <button
                    type="button"
                    onClick={() => setTicketsCount(c => Math.min(ticketsRemaining, 10, c + 1))}
                    className="w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10 rounded-lg font-bold text-dark-text hover:bg-white/10"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Coupon Code Input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-dark-muted uppercase tracking-wider">Promotional Discount Coupons</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SAVE20"
                    disabled={appliedCoupon}
                    className="glass-input flex-grow px-3 py-2 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || appliedCoupon || !couponCode}
                    className="bg-white/5 border border-white/10 hover:bg-white/10 px-3 py-2 rounded-lg text-xs font-semibold text-dark-text transition-colors disabled:opacity-30"
                  >
                    {couponLoading ? 'Checking...' : appliedCoupon ? 'Applied' : 'Apply'}
                  </button>
                </div>

                {/* Selectable Coupon Offers */}
                {!appliedCoupon && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[9px] font-bold text-dark-muted uppercase tracking-wider">Active Offers:</span>
                    <div className="flex gap-2">
                      {[
                        { code: 'SAVE20', label: '20% OFF' },
                        { code: 'SAVE75', label: '75% OFF' }
                      ].map((offer) => (
                        <button
                          key={offer.code}
                          type="button"
                          onClick={() => applySuggestedCoupon(offer.code)}
                          className="px-2.5 py-1 rounded bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20 border border-[#3B82F6]/20 text-[9px] font-extrabold text-[#3B82F6] transition-all"
                        >
                          {offer.code} ({offer.label})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {couponError && <p className="text-[10px] text-red-400 font-medium">{couponError}</p>}
                {appliedCoupon && (
                  <div className="flex justify-between items-center text-[10px] text-emerald-400 font-bold bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                    <span>Discount Applied: {appliedCoupon.discount_percent}% Off</span>
                    <button 
                      type="button" 
                      onClick={() => setAppliedCoupon(null)} 
                      className="text-dark-muted hover:text-red-400 ml-2 text-[9px] uppercase font-extrabold"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 bg-white/[0.01] border border-white/5 p-4 rounded-xl text-xs">
                <p className="font-bold text-dark-text uppercase tracking-wider text-[10px] border-b border-white/5 pb-1.5 mb-2">Detailed Price Breakdown</p>
                <div className="flex justify-between text-dark-muted">
                  <span>Ticket Price ({ticketsCount} x ₹{unitPrice.toFixed(0)})</span>
                  <span>₹{basePrice.toFixed(2)}</span>
                </div>
                {handlingFeePerTicket > 0 && (
                  <div className="flex justify-between text-dark-muted">
                    <span>Internet Handling Fees (₹15 x {ticketsCount})</span>
                    <span>₹{totalHandlingFee.toFixed(2)}</span>
                  </div>
                )}
                {appliedCoupon && (
                  <div className="flex justify-between text-[#3B82F6] font-bold">
                    <span>Coupon Discount</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm font-bold border-t border-white/5 pt-2 mt-2">
                  <span className="text-dark-text">Grand Total Amount</span>
                  <span className="text-[#3B82F6] text-lg">₹{finalPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={bookingLoading}
                className="w-full bg-[#3B82F6] text-white font-bold py-3.5 rounded-xl hover:bg-[#1D4ED8] transition-all transform hover:-translate-y-0.5 shadow-md shadow-blue-950/20 disabled:opacity-50 text-xs uppercase tracking-wider"
              >
                {bookingLoading ? 'Processing Booking...' : event.price > 0 && !(appliedCoupon && appliedCoupon.discount_percent === 100) ? 'Proceed to Pay' : 'Confirm Free Booking'}
              </button>
            </form>
          </>
        ) : paymentStep === 'options' ? (
          <>
            <div className="w-12 h-12 rounded-xl bg-white/5 text-[#3B82F6] flex items-center justify-center mb-4 border border-white/10">
              <Lock className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-dark-text">Select Payment Option</h3>
            <p className="text-xs text-dark-muted mt-1">Select your preferred payment method</p>

            <div className="w-full mt-6 space-y-3">
              {/* UPI */}
              <button
                onClick={() => { 
                  setSelectedMethod('upi'); 
                  setPaymentStep('upi-details'); 
                  setQrTimer(180); 
                  setPaymentToken(`pay_tok_${uuid()}`);
                }}
                className="w-full p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-[#3B82F6]/30 flex items-center justify-between text-left group transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-[#3B82F6]/10 rounded-lg text-[#3B82F6]">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-dark-text group-hover:text-[#3B82F6] transition-colors">GPay / PhonePe / UPI</p>
                    <p className="text-[9px] text-dark-muted mt-0.5">Pay instantly using mobile applications</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-dark-muted group-hover:text-dark-text" />
              </button>

              {/* Cards */}
              <button
                onClick={() => { setSelectedMethod('card'); setPaymentStep('card-details'); }}
                className="w-full p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-[#3B82F6]/30 flex items-center justify-between text-left group transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-[#3B82F6]/10 rounded-lg text-[#3B82F6]">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-dark-text group-hover:text-[#3B82F6] transition-colors">Credit / Debit Card</p>
                    <p className="text-[9px] text-dark-muted mt-0.5">Support Visa, MasterCard, RuPay, Amex</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-dark-muted group-hover:text-dark-text" />
              </button>

              {/* NetBanking */}
              <button
                onClick={() => { setSelectedMethod('netbanking'); setPaymentStep('netbanking-details'); }}
                className="w-full p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-[#3B82F6]/30 flex items-center justify-between text-left group transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-[#3B82F6]/10 rounded-lg text-[#3B82F6]">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-dark-text group-hover:text-[#3B82F6] transition-colors">Net Banking</p>
                    <p className="text-[9px] text-dark-muted mt-0.5">Secure direct bank account transfer</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-dark-muted group-hover:text-dark-text" />
              </button>
            </div>

            <button
              onClick={() => setPaymentStep('setup')}
              className="mt-6 text-[10px] text-dark-muted hover:text-dark-text font-bold uppercase tracking-wider"
            >
              Back to Ticket Info
            </button>
          </>
        ) : paymentStep === 'card-details' ? (
          <div className="w-full">
            {/* Visual Flip Card container */}
            <div className="w-full flex justify-center mb-6">
              <div className={`flip-card w-72 h-40 ${isCardFlipped ? 'flipped' : ''}`}>
                <div className="flip-card-inner">
                  {/* Front */}
                  <div className="flip-card-front bg-gradient-to-br from-slate-900 via-slate-800 to-[#3B82F6]/20 border border-white/10 p-5 text-left flex flex-col justify-between shadow-lg">
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-7 rounded bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center">
                        <div className="w-6 h-4 border border-yellow-500/30 rounded-sm"></div>
                      </div>
                      <span className="text-[9px] font-black tracking-widest text-[#3B82F6] uppercase">Secure Card</span>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-sm font-bold tracking-widest text-slate-100 font-mono">
                        {cardNumber || '•••• •••• •••• ••••'}
                      </p>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[7px] text-slate-500 uppercase font-semibold">Holder</p>
                          <p className="text-xs font-semibold text-slate-200 uppercase truncate max-w-[130px] font-sans">
                            {cardHolder || 'NAME SURNAME'}
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
                  {/* Back */}
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
                        Authorized for PCI-DSS secure online transactions on EventHub network. Non-refundable ticket reservation card.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-sm font-bold text-dark-text mb-4 text-left border-b border-white/5 pb-2">Credit / Debit Card Details</h3>
            
            {cardError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-semibold mb-4 text-center">
                {cardError}
              </div>
            )}

            <form onSubmit={handleSecurePaymentSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] text-dark-muted uppercase font-bold mb-1">Card Number</label>
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
                  className="glass-input w-full px-3 py-2.5 text-xs focus:ring-1 focus:ring-[#3B82F6]/30"
                />
              </div>
              <div>
                <label className="block text-[10px] text-dark-muted uppercase font-bold mb-1">Card Holder Name</label>
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
                  className="glass-input w-full px-3 py-2.5 text-xs focus:ring-1 focus:ring-[#3B82F6]/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-dark-muted uppercase font-bold mb-1">Expiry Date</label>
                  <input
                    type="text"
                    required
                    value={cardExpiry}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.length > 2) {
                        val = val.substring(0, 2) + '/' + val.substring(2, 4);
                      }
                      setCardExpiry(val);
                      setCardError('');
                    }}
                    placeholder="MM/YY"
                    maxLength="5"
                    className="glass-input w-full px-3 py-2.5 text-xs focus:ring-1 focus:ring-[#3B82F6]/30"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-dark-muted uppercase font-bold mb-1">CVV</label>
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
                    className="glass-input w-full px-3 py-2.5 text-xs focus:ring-1 focus:ring-[#3B82F6]/30"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setPaymentStep('options')}
                  className="flex-1 bg-white/5 border border-white/10 text-dark-text py-3 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-grow bg-[#3B82F6] text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Pay ₹{finalPrice.toFixed(2)}
                </button>
              </div>
            </form>
          </div>
        ) : paymentStep === 'upi-details' ? (() => {
          const qrUrl = `${window.location.protocol}//${window.location.host}/pay-simulate?token=${paymentToken}&amount=${finalPrice}&label=${encodeURIComponent('Tickets for ' + event.title)}`;
          return (
            <div className="w-full">
              {/* Combined QR Scanner & VPA input panel */}
              <h3 className="text-sm font-bold text-dark-text mb-4 text-left border-b border-white/5 pb-2">Scan & Pay or Enter UPI ID</h3>
              
              {/* 1. QR code scanner visual */}
              <div className="w-full flex flex-col items-center mb-5 bg-white/[0.01] border border-white/5 py-5 px-4 rounded-xl relative overflow-hidden">
                {/* Pulsing Active / Expired Badge */}
                <div className="flex items-center gap-1.5 mb-3 relative">
                  {qrTimer > 0 ? (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] animate-ping"></span>
                      <span className="w-2 h-2 rounded-full bg-[#3B82F6] absolute left-0.5 top-0.5"></span>
                      <span className="text-[11px] font-bold text-[#3B82F6] uppercase tracking-wider ml-1">QR Code Active</span>
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
                    <>
                      {/* Scanner animation bar */}
                      <div className="absolute inset-x-0 top-0 h-0.5 bg-[#3B82F6] shadow-md shadow-[#3B82F6]/50 animate-pulse" style={{
                        animation: 'scan 2s linear infinite',
                        backgroundImage: 'linear-gradient(to bottom, #3b82f6, #3b82f6)'
                      }}></div>
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrUrl)}`}
                        alt="UPI Payment QR Code" 
                        className="w-28 h-28 rounded-lg opacity-90"
                      />
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-2 absolute inset-0 bg-black/80 backdrop-blur-sm">
                      <span className="w-2 h-2 rounded-full bg-red-500 mb-1"></span>
                      <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Session Timeout</span>
                      <span className="text-[9px] text-dark-muted mt-0.5">Please regenerate code</span>
                    </div>
                  )}
                </div>
                
                {/* Timer Display */}
                {qrTimer > 0 ? (
                  <div className="text-center mt-3 space-y-1">
                    <p className="text-[11px] font-mono text-dark-text bg-white/5 px-3 py-1 rounded-full border border-white/5">
                      Time Remaining: <span className="font-bold text-[#3B82F6]">{formatTime(qrTimer)}</span>
                    </p>
                    <p className="text-[8px] text-dark-muted">Amount: ₹{finalPrice.toFixed(2)}</p>
                    <div className="pt-1">
                      <a
                        href={qrUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-[#3B82F6] hover:underline font-bold"
                      >
                        Testing locally? Open Simulator
                      </a>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setQrTimer(180); setPaymentToken(`pay_tok_${uuid()}`); }}
                    className="mt-3 px-4 py-1.5 bg-[#3B82F6]/10 border border-[#3B82F6]/20 hover:bg-[#3B82F6]/20 text-[#3B82F6] rounded-full text-[10px] font-bold uppercase tracking-wider transition-all"
                  >
                    Regenerate QR Code
                  </button>
                )}
              </div>

              {/* Separator Divider */}
              <div className="relative flex items-center justify-center my-4 w-full">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                <span className="relative px-3 text-[10px] text-dark-muted bg-[#121824] uppercase font-extrabold tracking-wider">Or Pay Via VPA ID</span>
              </div>

              {/* 2. VPA Form */}
              <form onSubmit={handleSecurePaymentSubmit} className="space-y-4 text-left">
                <div>
                  <label className="block text-[10px] text-dark-muted uppercase font-bold mb-1">Enter UPI VPA ID</label>
                  <input
                    type="text"
                    required
                    value={upiId}
                    disabled={qrTimer === 0}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="amit@okhdfcbank"
                    className="glass-input w-full px-3 py-2.5 text-xs disabled:opacity-50"
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setPaymentStep('options')}
                    className="flex-1 bg-white/5 border border-white/10 text-dark-text py-3 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={qrTimer === 0}
                    className="flex-grow bg-[#3B82F6] text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                  >
                    Pay ₹{finalPrice.toFixed(2)}
                  </button>
                </div>
              </form>
            </div>
          );
        })() : paymentStep === 'netbanking-details' ? (
          <div className="w-full">
            <h3 className="text-lg font-bold text-dark-text mb-4 text-left">Choose your Bank</h3>
            <form onSubmit={handleSecurePaymentSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] text-dark-muted uppercase font-bold mb-1">Select Bank</label>
                <select
                  required
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="glass-input w-full px-3 py-2.5 text-xs bg-dark-bg text-dark-text"
                >
                  <option value="">Choose Bank...</option>
                  <option value="sbi">State Bank of India</option>
                  <option value="hdfc">HDFC Bank</option>
                  <option value="icici">ICICI Bank</option>
                  <option value="axis">Axis Bank</option>
                  <option value="kotak">Kotak Mahindra Bank</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setPaymentStep('options')}
                  className="flex-1 bg-white/5 border border-white/10 text-dark-text py-3 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-grow bg-[#3B82F6] text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Proceed
                </button>
              </div>
            </form>
          </div>
        ) : paymentStep === 'processing' ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-[#3B82F6]/20 border-t-[#3B82F6] rounded-full animate-spin"></div>
            <p className="text-xs font-semibold text-dark-text">{processingMsg}</p>
            <p className="text-[10px] text-dark-muted">Please do not refresh the page or click back.</p>
          </div>
        ) : null}

        {/* Footnotes */}
        {paymentStep !== 'processing' && !bookingSuccess && (
          <div className="mt-6 flex items-center justify-center space-x-1.5 text-[10px] text-dark-muted">
            <ShieldCheck className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span>256-bit secured connection</span>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default BookingModal;
