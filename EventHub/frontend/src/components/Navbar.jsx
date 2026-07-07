import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, LogOut, User as UserIcon, Calendar, Building, ShieldAlert, ChevronDown, Bell, Check, CheckCheck, Sun, Moon, QrCode, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/api';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState({ show: false, title: '', message: '' });
  const navigate = useNavigate();
  const location = useLocation();

  // Dark/Light Theme support
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Load notifications and connect WebSockets
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // 1. Fetch initial notifications
    const fetchNotifications = async () => {
      try {
        const res = await api.get('notifications/');
        setNotifications(res.data);
        const unread = res.data.filter(n => !n.is_read).length;
        setUnreadCount(unread);
      } catch (err) {
        console.error("Failed to load notifications:", err);
      }
    };
    fetchNotifications();

    // 2. Setup WebSocket connection
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Match Django development server port (8000)
    const wsUrl = `${wsProto}//127.0.0.1:8000/ws/notifications/?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const newNotification = JSON.parse(event.data);
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Show Toast Notification Alert
        setToast({
          show: true,
          title: newNotification.title,
          message: newNotification.message
        });

        // Auto-dismiss toast
        setTimeout(() => {
          setToast(prev => ({ ...prev, show: false }));
        }, 5000);
      } catch (e) {
        console.error("Error parsing websocket message:", e);
      }
    };

    ws.onerror = (e) => {
      console.error("Notifications WebSocket error:", e);
    };

    return () => {
      ws.close();
    };
  }, [isAuthenticated]);

  const handleLogout = async () => {
    try {
      await logout();
      setDropdownOpen(false);
      setNotificationsOpen(false);
      setMobileMenuOpen(false);
      navigate('/login');
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.post(`notifications/${id}/read/`);
      setNotifications(prev =>
        prev.map(n => (id === 'all' || n.id === id ? { ...n, is_read: true } : n))
      );
      if (id === 'all') {
        setUnreadCount(0);
      } else {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  };

  const navLinks = isAuthenticated
    ? [
        { name: 'Explore', path: '/explore' },
        { name: 'Live Feed', path: '/live-feed' },
        { name: 'Contact', path: '/contact' },
      ]
    : [
        { name: 'Home', path: '/' },
        { name: 'Explore', path: '/explore' },
        { name: 'Live Feed', path: '/live-feed' },
        { name: 'Contact', path: '/contact' },
      ];

  // Role-based links
  const getRoleLinks = () => {
    if (!user) return [];
    switch (user.role) {
      case 'organizer':
        return [
          { name: 'My Events', path: '/organizer/events', icon: <Calendar className="w-4 h-4" /> },
          { name: 'Ticket Scanner', path: '/organizer/scanner', icon: <QrCode className="w-4 h-4" /> },
        ];
      case 'plot_owner':
        return [
          { name: 'My Venues', path: '/venues/manage', icon: <Building className="w-4 h-4" /> },
        ];
      case 'admin':
        return [
          { name: 'Admin Portal', path: '/admin-dashboard', icon: <ShieldAlert className="w-4 h-4" /> },
        ];
      default: // customer
        return [
          { name: 'My Bookings', path: '/bookings', icon: <Calendar className="w-4 h-4" /> },
        ];
    }
  };

  const roleLinks = getRoleLinks();
  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Real-Time Toast Popup Banner */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, x: 50, scale: 0.9 }}
            className="fixed top-20 right-6 z-[99] bg-dark-card border border-emerald-500/30 text-white rounded-2xl shadow-2xl p-4 flex items-start space-x-3 w-80 backdrop-blur-xl"
          >
            <div className="bg-emerald-500/25 text-emerald-400 p-2 rounded-xl flex-shrink-0 animate-bounce">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-grow min-w-0">
              <h4 className="font-extrabold text-xs text-emerald-400 uppercase tracking-wider truncate">{toast.title}</h4>
              <p className="text-xs text-dark-text mt-1 leading-relaxed">{toast.message}</p>
            </div>
            <button 
              onClick={() => setToast(prev => ({ ...prev, show: false }))} 
              className="text-dark-muted hover:text-dark-text p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="glass-nav sticky top-0 z-50 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link 
              to={isAuthenticated ? (user?.role === 'admin' ? '/admin-dashboard' : user?.role === 'organizer' ? '/organizer/events' : user?.role === 'plot_owner' ? '/venues/manage' : '/bookings') : '/'} 
              className="flex items-center space-x-2"
            >
              <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 font-sans">
                AHMEDABAD EVENT HUB
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-sm font-medium transition-colors hover:text-brand-primary ${
                    isActive(link.path) ? 'text-brand-primary' : 'text-dark-muted'
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              {/* Role Specific Links */}
              {roleLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center space-x-1 text-sm font-medium transition-colors hover:text-brand-primary ${
                    isActive(link.path) ? 'text-brand-primary' : 'text-dark-muted'
                  }`}
                >
                  {link.icon}
                  <span>{link.name}</span>
                </Link>
              ))}
            </div>

            {/* Auth Actions (Desktop) */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 text-dark-muted hover:text-dark-text bg-white/5 hover:bg-white/10 rounded-full border border-white/5 transition-all focus:outline-none flex items-center justify-center"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? <Sun className="w-4.5 h-4.5 text-amber-400 animate-pulse" /> : <Moon className="w-4.5 h-4.5 text-indigo-400" />}
              </button>

              {isAuthenticated ? (
                <>
                  {/* Notifications Bell */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setNotificationsOpen(!notificationsOpen);
                        setDropdownOpen(false);
                      }}
                      className="relative p-2 text-dark-muted hover:text-dark-text bg-white/5 hover:bg-white/10 rounded-full border border-white/5 transition-all focus:outline-none"
                    >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 bg-brand-primary text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Notifications Dropdown Panel */}
                    <AnimatePresence>
                      {notificationsOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setNotificationsOpen(false)}></div>
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.15 }}
                            className="glass-panel absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl focus:outline-none z-25 overflow-hidden flex flex-col max-h-96"
                          >
                            <div className="px-4 py-3 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                              <span className="text-xs font-bold text-dark-text uppercase tracking-wider">Notifications</span>
                              {unreadCount > 0 && (
                                <button
                                  onClick={() => handleMarkAsRead('all')}
                                  className="flex items-center space-x-1 text-[10px] text-brand-primary hover:text-brand-primary/80 font-bold transition-all"
                                >
                                  <CheckCheck className="w-3.5 h-3.5" />
                                  <span>Mark all read</span>
                                </button>
                              )}
                            </div>
                            
                            <div className="flex-grow overflow-y-auto divide-y divide-white/5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                              {notifications.length === 0 ? (
                                <div className="p-6 text-center text-xs text-dark-muted">
                                  No notifications yet.
                                </div>
                              ) : (
                                notifications.map((n) => (
                                  <div
                                    key={n.id}
                                    className={`p-4 transition-colors flex items-start justify-between space-x-2 ${
                                      n.is_read ? 'opacity-60 bg-transparent' : 'bg-brand-primary/[0.02] hover:bg-brand-primary/[0.04]'
                                    }`}
                                  >
                                    <div className="min-w-0">
                                      <h5 className="text-xs font-bold text-dark-text leading-tight">{n.title}</h5>
                                      <p className="text-[11px] text-dark-muted mt-1 leading-normal">{n.message}</p>
                                      <span className="text-[9px] text-dark-muted mt-2 block font-medium">
                                        {new Date(n.created_at).toLocaleDateString()} at {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                    {!n.is_read && (
                                      <button
                                        onClick={() => handleMarkAsRead(n.id)}
                                        className="text-brand-primary hover:text-brand-primary/80 p-1 flex-shrink-0"
                                        title="Mark as read"
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Profile Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setDropdownOpen(!dropdownOpen);
                        setNotificationsOpen(false);
                      }}
                      className="flex items-center space-x-2 text-sm font-medium text-dark-text bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/5 transition-all focus:outline-none"
                    >
                      {user.avatar ? (
                        <img
                          src={user.avatar.startsWith('http') ? user.avatar : `http://127.0.0.1:8000${user.avatar}`}
                          alt="Avatar"
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center font-bold text-xs uppercase">
                          {user.first_name?.[0] || user.email?.[0]}
                        </div>
                      )}
                      <span>{user.first_name || 'Account'}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
 
                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {dropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)}></div>
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.15 }}
                            className="glass-panel absolute right-0 mt-2 w-56 rounded-xl shadow-lg focus:outline-none z-20 py-2"
                          >
                            <div className="px-4 py-2 border-b border-white/5">
                              <p className="text-sm font-semibold text-dark-text truncate">{user.first_name} {user.last_name}</p>
                              <p className="text-xs text-dark-muted truncate">{user.email}</p>
                              <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-brand-primary/10 text-brand-primary rounded">
                                {user.role}
                              </span>
                            </div>
                            <Link
                              to={user?.role === 'admin' ? '/admin-dashboard' : user?.role === 'organizer' ? '/organizer/events' : user?.role === 'plot_owner' ? '/venues/manage' : '/bookings'}
                              className="flex items-center space-x-2 px-4 py-2 text-sm text-dark-muted hover:text-dark-text hover:bg-white/5 transition-colors"
                              onClick={() => setDropdownOpen(false)}
                            >
                              <LayoutDashboard className="w-4 h-4 text-brand-primary" />
                              <span>My Dashboard</span>
                            </Link>
                            <Link
                              to="/profile"
                              className="flex items-center space-x-2 px-4 py-2 text-sm text-dark-muted hover:text-dark-text hover:bg-white/5 transition-colors"
                              onClick={() => setDropdownOpen(false)}
                            >
                              <UserIcon className="w-4 h-4" />
                              <span>My Profile</span>
                            </Link>
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors text-left"
                            >
                              <LogOut className="w-4 h-4" />
                              <span>Sign Out</span>
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-medium text-dark-muted hover:text-dark-text transition-colors">
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="text-sm font-medium bg-gradient-to-r from-brand-primary to-rose-600 text-white px-4 py-2 rounded-lg hover:from-brand-primary hover:to-rose-700 shadow-md shadow-brand-primary/20 transition-all transform hover:-translate-y-0.5"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-dark-muted hover:text-dark-text p-2 rounded-lg"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden theme-drawer backdrop-blur-lg"
            >
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                {/* Theme Toggle Mobile */}
                <div className="flex items-center justify-between px-3 py-2 text-sm font-medium text-dark-muted border-b border-white/5 pb-3 mb-2">
                  <span>Theme Mode</span>
                  <button
                    onClick={toggleTheme}
                    className="p-1.5 text-dark-muted hover:text-dark-text bg-white/5 hover:bg-white/10 rounded-full border border-white/5 transition-all focus:outline-none flex items-center justify-center"
                  >
                    {theme === 'dark' ? (
                      <div className="flex items-center space-x-2">
                        <Sun className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-semibold">Light</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Moon className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-semibold">Dark</span>
                      </div>
                    )}
                  </button>
                </div>

                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive(link.path) ? 'bg-brand-primary/10 text-brand-primary' : 'text-dark-muted hover:bg-white/5 hover:text-dark-text'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}
                
                {roleLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
                      isActive(link.path) ? 'bg-brand-primary/10 text-brand-primary' : 'text-dark-muted hover:bg-white/5 hover:text-dark-text'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.icon}
                    <span>{link.name}</span>
                  </Link>
                ))}
 
                {isAuthenticated ? (
                  <>
                    <div className="border-t border-white/5 my-2 pt-2"></div>
                    <Link
                      to="/profile"
                      className="block px-3 py-2 rounded-md text-base font-medium text-dark-muted hover:bg-white/5 hover:text-dark-text"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Profile ({user.role})
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-400 hover:bg-white/5 hover:text-red-300"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <div className="border-t border-white/5 my-2 pt-2"></div>
                    <Link
                      to="/login"
                      className="block px-3 py-2 rounded-md text-base font-medium text-dark-muted hover:bg-white/5 hover:text-dark-text"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="block text-center mt-2 mx-3 bg-gradient-to-r from-brand-primary to-rose-600 text-white px-4 py-2.5 rounded-lg font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
};

export default Navbar;
