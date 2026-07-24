import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import ThreeDEventBackground from '../components/ThreeDEventBackground';

const Login = () => {
  const { login, isAuthenticated, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/profile';

  useEffect(() => {
    if (isAuthenticated && user) {
      setEmail('');
      setPassword('');
      const dashboardPath = user.role === 'admin' ? '/admin-dashboard' : user.role === 'organizer' ? '/organizer/events' : user.role === 'plot_owner' ? '/venues/manage' : '/bookings';
      navigate(dashboardPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    if (!email.trim() || !password) {
      setFormError('Please fill in all fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setFormError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const loggedInUser = await login(email, password);
      setEmail('');
      setPassword('');
      let targetPath = from;
      if (from === '/' || from === '/profile' || from === '/login' || from === '/register') {
        if (loggedInUser?.role === 'admin') {
          targetPath = '/admin-dashboard';
        } else if (loggedInUser?.role === 'organizer') {
          targetPath = '/organizer/events';
        } else if (loggedInUser?.role === 'plot_owner') {
          targetPath = '/venues/manage';
        } else {
          targetPath = '/bookings';
        }
      }
      navigate(targetPath, { replace: true });
    } catch (err) {
      setFormError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[75vh] flex items-center justify-center px-4 py-4 sm:py-6 overflow-hidden z-10">

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
              Welcome Back
            </h2>
            <p className="text-sm text-dark-muted mt-2">Sign in to your Ahmedabad Event Hub account</p>
          </div>

          {formError && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-start space-x-2 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{formError}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Dummy hidden inputs to absorb browser autofill */}
            <input 
              type="text" 
              name="prevent_autofill_email" 
              style={{ position: 'absolute', top: -9999, left: -9999 }} 
              tabIndex={-1} 
              autoComplete="off"
            />
            <input 
              type="password" 
              name="prevent_autofill_password" 
              style={{ position: 'absolute', top: -9999, left: -9999 }} 
              tabIndex={-1} 
              autoComplete="new-password"
            />

            {/* Email */}
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
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider">
                  Password
                </label>
                <Link 
                  to="/forgot-password" 
                  className="text-xs text-brand-primary hover:text-brand-primary/80 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dark-muted">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  className="glass-input w-full pl-10 pr-10 py-2.5 rounded-xl text-sm"
                  required
                  autoComplete="new-password"
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

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-primary to-rose-600 text-white font-medium py-3 px-4 rounded-xl hover:from-brand-primary hover:to-rose-700 transition-all transform hover:-translate-y-0.5 shadow-md shadow-brand-primary/20 disabled:opacity-50 disabled:pointer-events-none mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center space-x-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Authenticating...</span>
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="text-center mt-6 text-sm text-dark-muted">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-primary hover:text-brand-primary/80 font-medium transition-colors">
              Sign Up
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
