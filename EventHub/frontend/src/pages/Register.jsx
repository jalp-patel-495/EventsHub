import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Phone, CheckCircle2, AlertCircle, Eye, EyeOff, Sparkles, Building, Calendar } from 'lucide-react';
import ThreeDEventBackground from '../components/ThreeDEventBackground';
import api from '../api/api';

const Register = () => {
  const { register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      const dashboardPath = user.role === 'admin' ? '/admin-dashboard' : user.role === 'organizer' ? '/organizer/events' : user.role === 'plot_owner' ? '/venues/manage' : '/bookings';
      navigate(dashboardPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);
  
  // Form values
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('customer'); // default
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  
  // OTP states
  const [step, setStep] = useState(1); // 1 = registration details, 2 = OTP verification
  const [otpCode, setOtpCode] = useState('');
  const [otpSentMessage, setOtpSentMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Detailed Validations
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg('First Name and Last Name are required.');
      return;
    }

    const nameRegex = /^[A-Za-z]+$/;
    if (!nameRegex.test(firstName.trim())) {
      setErrorMsg('First Name must only contain alphabetical characters.');
      return;
    }
    if (!nameRegex.test(lastName.trim())) {
      setErrorMsg('Last Name must only contain alphabetical characters.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!phone || phone.length !== 10) {
      setErrorMsg('Phone number must be exactly 10 digits.');
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
      const res = await api.post('accounts/register-otp/', { email });
      setOtpSentMessage(res.data.message || 'OTP verification code has been sent!');
      setStep(2);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to send OTP verification email. Please check your SMTP settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!otpCode.trim() || otpCode.length !== 6) {
      setErrorMsg('Please enter a valid 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        role,
        password,
        password_confirm: passwordConfirm,
        otp: otpCode
      };
      await api.post('accounts/register/', payload);
      setSuccess(true);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || 'Registration failed. Please check inputs or OTP.');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    {
      id: 'customer',
      title: 'Customer',
      desc: 'Discover and book events',
      icon: <Sparkles className="w-5 h-5" />,
      colorClass: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    },
    {
      id: 'organizer',
      title: 'Organizer',
      desc: 'Plan and host events',
      icon: <Calendar className="w-5 h-5" />,
      colorClass: 'text-brand-primary bg-brand-primary/10 border-brand-primary/20'
    },
    {
      id: 'plot_owner',
      title: 'Plot Owner',
      desc: 'Rent out venues/plots',
      icon: <Building className="w-5 h-5" />,
      colorClass: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
    }
  ];

  if (success) {
    return (
      <div className="relative min-h-[80vh] flex items-center justify-center px-4 py-12 overflow-hidden z-10">
        <ThreeDEventBackground />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel w-full max-w-md rounded-2xl p-8 text-center shadow-glass flex flex-col items-center"
        >
          <div className="w-16 h-16 rounded-full bg-brand-primary/15 text-brand-primary flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-dark-text">Account Verified & Created!</h2>
          <p className="text-sm text-dark-muted mt-3 leading-relaxed">
            {role === 'customer'
              ? "Registration successful! Your account is active and you can now log in immediately."
              : "Registration successful! Your email is verified. Once your account is approved by an administrator, you will be able to log in."
            }
          </p>
          <Link
            to="/login"
            className="w-full bg-gradient-to-r from-brand-primary to-rose-600 text-white font-bold py-3.5 rounded-xl hover:from-brand-primary hover:to-rose-700 transition-all mt-6 shadow-md text-center block text-sm"
          >
            Go to Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[85vh] flex items-center justify-center px-4 py-12 overflow-hidden z-10">
      <ThreeDEventBackground />
      <div className="w-full max-w-xl mx-auto relative flex justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="glass-panel w-full max-w-xl rounded-2xl p-8 shadow-glass"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 font-sans">
              {step === 1 ? 'Join the Hub' : 'Verify Your Email'}
            </h2>
            <p className="text-sm text-dark-muted mt-2">
              {step === 1 ? 'Sign up for Ahmedabad Event Hub' : 'Enter the 6-digit verification code sent to your Gmail inbox'}
            </p>
          </div>

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-start space-x-2 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="break-words">{errorMsg}</span>
            </motion.div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Role Selector Card Grid */}
              <div>
                <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-3">
                  Choose your Account Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {roleOptions.map((opt) => {
                    const isSelected = role === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setRole(opt.id)}
                        className={`flex flex-col items-center p-4 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'bg-rose-500/10 border-rose-500/40 text-dark-text shadow-[0_0_15px_rgba(244,63,94,0.1)]'
                            : 'bg-white/5 border-white/5 text-dark-muted hover:bg-white/10 hover:border-white/10'
                        }`}
                      >
                        <div className={`p-2.5 rounded-lg mb-3 ${opt.colorClass}`}>
                          {opt.icon}
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider mb-1 block">
                          {opt.title}
                        </span>
                        <span className="text-[10px] text-dark-muted leading-tight block">
                          {opt.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">
                    First Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dark-muted">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">
                    Last Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dark-muted">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      placeholder="john@example.com"
                      className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dark-muted">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setPhone(val);
                      }}
                      placeholder="9876543210"
                      maxLength="10"
                      pattern="[0-9]{10}"
                      className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Password Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">
                    Password
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
                      autoComplete="new-password"
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
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-brand-primary to-rose-600 text-white font-medium py-3 px-4 rounded-xl hover:from-brand-primary hover:to-rose-700 transition-all transform hover:-translate-y-0.5 shadow-md shadow-brand-primary/20 disabled:opacity-50 disabled:pointer-events-none mt-2 text-sm font-bold"
              >
                {loading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Creating Account...</span>
                  </span>
                ) : (
                  'Sign Up'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndRegister} className="space-y-6">
              <div className="text-center">
                <p className="text-xs text-dark-muted mb-4">
                  We have sent a verification code to <strong className="text-dark-text">{email}</strong>.
                  Please check your inbox (and spam folder) and enter it below to complete registration.
                </p>
                
                {otpSentMessage && (
                  <div className="mb-4 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 py-2 px-3 rounded-lg">
                    {otpSentMessage}
                  </div>
                )}

                <div className="max-w-[240px] mx-auto">
                  <input
                    type="text"
                    maxLength="6"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full text-center text-2xl font-bold tracking-[0.5em] pl-[0.5em] py-3 glass-input rounded-xl focus:border-rose-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-brand-primary to-rose-600 text-white font-bold py-3.5 rounded-xl hover:from-brand-primary hover:to-rose-700 transition-all disabled:opacity-50 disabled:pointer-events-none text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Verifying Code...</span>
                  </span>
                ) : (
                  'Confirm & Verify'
                )}
              </button>

              <div className="flex justify-between items-center text-xs mt-2">
                <span className="text-dark-muted">Didn't receive the email?</span>
                <button
                  type="button"
                  disabled={loading}
                  onClick={async () => {
                    setLoading(true);
                    setErrorMsg('');
                    setOtpSentMessage('');
                    try {
                      const res = await api.post('accounts/resend-otp/', { email });
                      setOtpSentMessage(res.data.message || 'OTP verification code resent!');
                    } catch (err) {
                      setErrorMsg(err.response?.data?.error || 'Failed to resend OTP.');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="text-brand-primary hover:text-brand-primary/80 transition-colors font-semibold bg-transparent border-none outline-none cursor-pointer"
                >
                  Resend OTP Code
                </button>
              </div>
            </form>
          )}

          <div className="text-center mt-6 text-sm text-dark-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-primary hover:text-brand-primary/80 font-medium transition-colors">
              Sign In
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
