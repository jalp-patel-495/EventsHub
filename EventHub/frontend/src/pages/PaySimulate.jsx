import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ShieldCheck, CheckCircle2, Lock, Landmark, AlertCircle } from 'lucide-react';

const PaySimulate = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const amount = searchParams.get('amount') || '0.00';
  const label = searchParams.get('label') || 'EventHub Checkout';

  const [status, setStatus] = useState('ready'); // ready, loading, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const handleApprove = async () => {
    if (!token) return;
    setStatus('loading');
    try {
      // Make call to backend to approve payment
      let apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/';
      if (!apiBase.endsWith('/')) {
        apiBase += '/';
      }
      
      await axios.post(`${apiBase}venues/bookings/approve-payment/`, { token });
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.response?.data?.error || 'Failed to approve payment. Please check network connection.');
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0d0f14] text-gray-200 flex flex-col items-center justify-center p-6 text-center">
        <div className="glass-panel max-w-sm w-full p-8 rounded-2xl border border-red-500/20 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-lg font-black uppercase text-red-400">Invalid Payment Link</h2>
          <p className="text-xs text-gray-400">This payment simulation URL is missing a valid transaction token.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0f14] text-gray-200 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel max-w-md w-full p-6 rounded-2xl border border-white/10 shadow-2xl space-y-6 text-center"
        style={{
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-center space-x-2 border-b border-white/5 pb-4 w-full">
          <span className="text-[#F84464] font-black text-lg tracking-tight">Event</span>
          <span className="bg-[#F84464] text-white text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-tight">Hub</span>
          <span className="text-[9px] text-gray-400 font-bold ml-2 border-l border-white/10 pl-2 uppercase tracking-widest">Mobile Pay Gate</span>
        </div>

        {status === 'ready' && (
          <div className="space-y-6 text-left">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-[#10B981]/10 text-[#10B981] flex items-center justify-center mx-auto border border-[#10B981]/20">
                <Landmark className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-base font-bold mt-2">Authorize ESCROW Transaction</h3>
              <p className="text-[10px] text-gray-400">Secure simulated gateway confirmation</p>
            </div>

            {/* Bill Summary */}
            <div className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Merchant Name</span>
                <span className="font-semibold text-gray-200">Ahmedabad Event Hub</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Booking / Service</span>
                <span className="font-semibold text-gray-200">{label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Reference ID</span>
                <span className="font-mono text-gray-300 truncate max-w-[150px]">{token}</span>
              </div>
              <div className="flex justify-between items-center border-t border-white/5 pt-2 mt-2">
                <span className="text-gray-300 font-bold">Total Payable Amount</span>
                <span className="text-xl font-black text-emerald-400">₹{parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleApprove}
                className="w-full bg-[#10B981] hover:bg-[#059669] text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-950/20 text-center"
              >
                Approve Payment (OK)
              </button>
              <p className="text-[9px] text-center text-gray-500">By clicking OK, the amount will be authorized and the desktop checkout page will automatically confirm the booking.</p>
            </div>
          </div>
        )}

        {status === 'loading' && (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            <h4 className="text-sm font-bold text-gray-200">Securing Transaction...</h4>
            <p className="text-[10px] text-gray-400">Please do not close this mobile browser page.</p>
          </div>
        )}

        {status === 'success' && (
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="space-y-6 text-center"
          >
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-lg font-black text-white">Payment Authorized!</h3>
              <p className="text-[10px] text-gray-400">Your booking has been successfully verified.</p>
            </div>

            {/* Visual Mobile Ticket */}
            <div className="w-full rounded-xl overflow-hidden border border-[#F84464]/20 shadow-xl bg-[#0f172a] text-left">
              {/* Ticket Top */}
              <div className="bg-[#F84464] px-4 py-3 text-white flex justify-between items-center">
                <div>
                  <span className="text-[8px] font-extrabold bg-white/20 px-1.5 py-0.5 rounded uppercase tracking-wider">E-Ticket Summary</span>
                  <h4 className="text-sm font-black mt-1 leading-tight">{label}</h4>
                </div>
              </div>

              {/* Ticket Body */}
              <div className="p-4 space-y-3.5 text-xs text-gray-300">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Amount Paid</span>
                    <p className="font-extrabold text-emerald-400 mt-0.5">₹{parseFloat(amount).toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Transaction Ref</span>
                    <p className="font-semibold text-gray-200 mt-0.5 truncate max-w-[140px] font-mono">{token}</p>
                  </div>
                </div>

                <div className="bg-slate-900 border border-white/5 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <span className="text-[8px] text-gray-500 uppercase font-bold tracking-wider">Entry Scan QR</span>
                    <p className="text-[8px] text-gray-500 leading-normal">Show this code at entrance.</p>
                  </div>
                  <div className="bg-white p-1 rounded-lg">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=EVENTHUB:${token}`}
                      alt="Ticket entry QR"
                      className="w-14 h-14"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation / Back Buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <a
                href="/bookings"
                className="w-full bg-[#F84464] hover:bg-[#df3250] text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-center"
              >
                Go to My Bookings
              </a>
              <a
                href="/"
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all text-center"
              >
                Back to Homepage
              </a>
            </div>
          </motion.div>
        )}

        {status === 'error' && (
          <div className="py-6 flex flex-col items-center justify-center space-y-4 text-center">
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-red-400">Payment Authorization Failed</h3>
            <p className="text-xs text-gray-400">{errorMessage}</p>
            <button
              onClick={() => setStatus('ready')}
              className="px-6 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold rounded-xl"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-center space-x-1.5 text-[9px] text-gray-500 border-t border-white/5 pt-4">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>EventHub Escrow Verified Mobile Gateway</span>
        </div>
      </motion.div>
    </div>
  );
};

export default PaySimulate;
