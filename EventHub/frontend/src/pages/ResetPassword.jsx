import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/api';
import { motion } from 'framer-motion';
import ThreeDEventBackground from '../components/ThreeDEventBackground';
import { Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const uid = searchParams.get('uid');
    const token = searchParams.get('token');

    if (!uid || !token) {
      setErrorMsg('Invalid or expired password reset parameters.');
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
      await api.post('accounts/reset-password/', {
        uid,
        token,
        password,
        password_confirm: passwordConfirm,
      });
      setSuccess(true);
    } catch (err) {
      const errData = err.response?.data;
      if (errData) {
        if (errData.error) {
          setErrorMsg(errData.error);
        } else if (typeof errData === 'object') {
          const errors = Object.entries(errData).map(([key, val]) => {
            const fieldName = key === 'non_field_errors' ? 'Error' : key;
            const cleanVal = Array.isArray(val) ? val.join(' ') : val;
            return `${fieldName}: ${cleanVal}`;
          });
          setErrorMsg(errors.join(' | '));
        } else {
          setErrorMsg('Password reset failed. The link may have expired or is invalid.');
        }
      } else {
        setErrorMsg('Password reset failed. The link may have expired or is invalid.');
      }
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
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 font-sans">
              Set New Password
            </h2>
            <p className="text-sm text-dark-muted mt-2">Enter your new secure password below.</p>
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

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
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
                  placeholder="••••••••"
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

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dark-muted">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                  required
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-primary to-rose-600 text-white font-medium py-3 px-4 rounded-xl hover:from-brand-primary hover:to-rose-700 transition-all transform hover:-translate-y-0.5 shadow-md shadow-brand-primary/20 disabled:opacity-50 disabled:pointer-events-none mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center space-x-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Resetting password...</span>
                </span>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword;
