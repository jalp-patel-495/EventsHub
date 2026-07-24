import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import { motion, AnimatePresence } from 'framer-motion';
import ThreeDEventBackground from '../components/ThreeDEventBackground';
import ThreeDTicket from '../components/ThreeDTicket';
import { Mail, CheckCircle2, AlertCircle, ArrowLeft, Lock, Key, Eye, EyeOff } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await api.post('accounts/forgot-password/', { email: email.trim() });
      setOtpSent(true);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to send recovery email. Please check your SMTP settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!otpCode.trim() || otpCode.length !== 6) {
      setErrorMsg('Please enter a valid 6-digit OTP code.');
      return;
    }

    if (password !== passwordConfirm) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setErrorMsg('Password must contain at least one uppercase letter.');
      return;
    }
    if (!/[a-z]/.test(password)) {
      setErrorMsg('Password must contain at least one lowercase letter.');
      return;
    }
    if (!/[0-9]/.test(password)) {
      setErrorMsg('Password must contain at least one number.');
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setErrorMsg('Password must contain at least one special character (e.g. !, @, #, $, etc.).');
      return;
    }

    setLoading(true);
    try {
      await api.post('accounts/reset-password-otp/', {
        email: email.trim(),
        otp: otpCode.trim(),
        password,
        password_confirm: passwordConfirm
      });
      setSuccess(true);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to reset password. Please check your recovery code.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="relative min-h-[85vh] flex items-center justify-center px-4 py-12 overflow-hidden z-10">
        <ThreeDEventBackground />
        <div className="w-full max-w-md mx-auto relative flex justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel w-full max-w-md rounded-2xl p-8 text-center shadow-glass flex flex-col items-center"
          >
            <div className="w-16 h-16 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-dark-text">Password Reset Complete</h2>
            <p className="text-sm text-dark-muted mt-3 leading-relaxed">
              Your password has been successfully updated. You can now log in using your new credentials.
            </p>
            <Link
              to="/login"
              className="w-full bg-gradient-to-r from-brand-primary to-rose-600 text-white font-medium py-3 rounded-xl hover:from-brand-primary hover:to-rose-700 transition-all mt-6 shadow-md"
            >
              Go to Login
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[85vh] flex items-center justify-center px-4 py-12 overflow-hidden z-10">
      <ThreeDEventBackground />
      <div className="w-full max-w-md mx-auto relative flex justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="glass-panel w-full max-w-md rounded-2xl p-8 shadow-glass"
        >
          <div className="mb-6">
            <button 
              type="button"
              onClick={() => {
                if (otpSent) {
                  setOtpSent(false);
                  setErrorMsg('');
                } else {
                  window.history.back();
                }
              }} 
              className="inline-flex items-center text-xs font-semibold text-dark-muted hover:text-brand-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              {otpSent ? 'Back' : 'Back to Login'}
            </button>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 font-sans">
              Reset Password
            </h2>
            <p className="text-sm text-dark-muted mt-2">
              {otpSent ? 'Enter the OTP and set your new password' : 'Enter your email to request a reset link'}
            </p>
          </div>

          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-start space-x-2 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {!otpSent ? (
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dark-muted">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter Email Address"
                    className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-brand-primary to-rose-600 text-white font-medium py-3 px-4 rounded-xl hover:from-brand-primary hover:to-rose-700 transition-all transform hover:-translate-y-0.5 shadow-md shadow-brand-primary/20 disabled:opacity-50 disabled:pointer-events-none mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Sending Code...</span>
                  </span>
                ) : (
                  'Send Reset Code'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">
                  Verification Code (OTP)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dark-muted">
                    <Key className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    maxLength="6"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter OTP Code"
                    className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-center tracking-widest font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">
                  New Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dark-muted">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Password"
                    autoComplete="new-password"
                    className="glass-input w-full pl-10 pr-10 py-2.5 rounded-xl text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-dark-muted hover:text-dark-text"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dark-muted">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="Re-enter Password"
                    autoComplete="new-password"
                    className="glass-input w-full pl-10 pr-10 py-2.5 rounded-xl text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-dark-muted hover:text-dark-text"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-brand-primary to-rose-600 text-white font-medium py-3 px-4 rounded-xl hover:from-brand-primary hover:to-rose-700 transition-all transform hover:-translate-y-0.5 shadow-md shadow-brand-primary/20 disabled:opacity-50 disabled:pointer-events-none mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Updating password...</span>
                  </span>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
