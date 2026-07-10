import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Calendar, Shield, IndianRupee, Activity, FileText, Send, 
  Check, X, Search, Filter, ShieldAlert, Award, Home, Lock, Unlock, 
  RefreshCw, AlertCircle, Eye, CornerDownRight, Landmark, MessageSquare, Trash, Building
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { user } = useAuth();
  const routeLocation = useLocation();
  const navigate = useNavigate();
  const activeTab = routeLocation.pathname === '/admin/approvals'
    ? 'approvals'
    : routeLocation.pathname === '/admin/events'
      ? 'all_events'
      : routeLocation.pathname === '/admin/venues'
        ? 'all_venues'
        : routeLocation.pathname === '/admin/revenue'
          ? 'platform_revenue'
          : routeLocation.pathname === '/admin/users'
            ? 'users'
            : routeLocation.pathname === '/admin/finance'
              ? 'finance'
              : routeLocation.pathname === '/admin/complaints'
                ? 'complaints'
                : routeLocation.pathname === '/admin/broadcast'
                  ? 'broadcast'
                  : 'overview';
  const setActiveTab = (tabId) => {
    const paths = {
      overview: '/admin/overview',
      platform_revenue: '/admin/revenue',
      approvals: '/admin/approvals',
      all_events: '/admin/events',
      all_venues: '/admin/venues',
      users: '/admin/users',
      finance: '/admin/finance',
      complaints: '/admin/complaints',
      broadcast: '/admin/broadcast'
    };
    navigate(paths[tabId] || '/admin/overview');
  };
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Dashboard Data States
  const [summary, setSummary] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [pendingVenues, setPendingVenues] = useState([]);
  const [bookingsList, setBookingsList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [eventSearch, setEventSearch] = useState('');
  const [allVenues, setAllVenues] = useState([]);
  const [venueSearch, setVenueSearch] = useState('');
  const [eventsPage, setEventsPage] = useState(1);
  const [venuesPage, setVenuesPage] = useState(1);
  const itemsPerPage = 10;

  // Search & Filter States
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('');

  // Broadcast Form State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSuccess, setBroadcastSuccess] = useState('');

  // Complaints States
  const [complaintsList, setComplaintsList] = useState([]);
  const [complaintSearch, setComplaintSearch] = useState('');
  const [complaintRoleFilter, setComplaintRoleFilter] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');

  // Feedback State
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Refund Modal State
  const [refundModal, setRefundModal] = useState({ show: false, booking: null });

  const fetchSummary = async () => {
    try {
      const res = await api.get('admin/summary/');
      setSummary(res.data);
    } catch (err) {
      console.error("Failed to load summary stats:", err);
      showFeedback("Failed to load dashboard metrics.", "error");
    }
  };

  const fetchUsers = async () => {
    try {
      let url = 'admin/users/';
      const params = [];
      if (userSearch) params.push(`search=${userSearch}`);
      if (userRoleFilter) params.push(`role=${userRoleFilter}`);
      if (params.length) url += `?${params.join('&')}`;
      
      const res = await api.get(url);
      setUsersList(res.data);
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  };

  const fetchApprovals = async () => {
    try {
      const [eventsRes, venuesRes] = await Promise.all([
        api.get('admin/events/'),
        api.get('admin/venues/')
      ]);
      setPendingEvents(eventsRes.data);
      setPendingVenues(venuesRes.data);
    } catch (err) {
      console.error("Failed to load pending approvals:", err);
    }
  };

  const fetchAllEvents = async () => {
    try {
      let url = 'events/listings/?page_size=1000';
      if (eventSearch) {
        url += `&search=${eventSearch}`;
      }
      const res = await api.get(url);
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setAllEvents(data);
    } catch (err) {
      console.error("Failed to load all events:", err);
    }
  };

  const fetchAllVenues = async () => {
    try {
      let url = 'venues/listings/';
      if (venueSearch) {
        url += `?search=${venueSearch}`;
      }
      const res = await api.get(url);
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setAllVenues(data);
    } catch (err) {
      console.error("Failed to load all venues:", err);
    }
  };

  const fetchBookings = async () => {
    try {
      let url = 'admin/bookings/';
      const params = [];
      if (bookingSearch) params.push(`search=${bookingSearch}`);
      if (bookingStatusFilter) params.push(`status=${bookingStatusFilter}`);
      if (params.length) url += `?${params.join('&')}`;
      
      const res = await api.get(url);
      setBookingsList(res.data);
    } catch (err) {
      console.error("Failed to load bookings list:", err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      let url = 'admin/audit-logs/';
      const params = [];
      if (auditSearch) params.push(`search=${auditSearch}`);
      if (auditActionFilter) params.push(`action=${auditActionFilter}`);
      if (params.length) url += `?${params.join('&')}`;
      
      const res = await api.get(url);
      setAuditLogs(res.data);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    }
  };

  const fetchComplaints = async () => {
    try {
      let url = 'admin/complaints/';
      const params = [];
      if (complaintSearch) params.push(`search=${complaintSearch}`);
      if (complaintRoleFilter) params.push(`role=${complaintRoleFilter}`);
      if (params.length) url += `?${params.join('&')}`;
      
      const res = await api.get(url);
      setComplaintsList(res.data);
    } catch (err) {
      console.error("Failed to load complaints:", err);
    }
  };

  const loadTabContent = async () => {
    setLoading(true);
    if (activeTab === 'overview' || activeTab === 'platform_revenue') {
      await fetchSummary();
    } else if (activeTab === 'approvals') {
      await fetchApprovals();
      await fetchUsers(); // Users are checked for pending registrations
    } else if (activeTab === 'all_events') {
      await fetchAllEvents();
    } else if (activeTab === 'all_venues') {
      await fetchAllVenues();
    } else if (activeTab === 'users') {
      await fetchUsers();
    } else if (activeTab === 'finance') {
      await fetchBookings();
    } else if (activeTab === 'complaints') {
      await fetchComplaints();
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTabContent();
  }, [activeTab]);

  // Handle Search triggers
  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [userSearch, userRoleFilter]);

  useEffect(() => {
    setEventsPage(1);
    if (activeTab === 'all_events') fetchAllEvents();
  }, [eventSearch]);

  useEffect(() => {
    setVenuesPage(1);
    if (activeTab === 'all_venues') fetchAllVenues();
  }, [venueSearch]);

  useEffect(() => {
    if (activeTab === 'finance') fetchBookings();
  }, [bookingSearch, bookingStatusFilter]);

  useEffect(() => {
    if (activeTab === 'complaints') fetchComplaints();
  }, [complaintSearch, complaintRoleFilter]);

  const showFeedback = (text, type = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Admin Actions
  const handleUserBlockToggle = async (userId) => {
    setActionLoading(`block-${userId}`);
    try {
      const res = await api.post(`admin/users/${userId}/toggle-active/`);
      showFeedback(res.data.message);
      fetchUsers();
    } catch (err) {
      showFeedback("Failed to update user block status.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUserApprove = async (userId) => {
    setActionLoading(`approve-user-${userId}`);
    try {
      const res = await api.post(`admin/users/${userId}/approve/`);
      showFeedback(res.data.message);
      fetchApprovals();
      fetchUsers();
      fetchSummary();
    } catch (err) {
      showFeedback("Failed to approve organizer/owner account.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleEventApproval = async (eventId, decision) => {
    setActionLoading(`event-${eventId}`);
    try {
      const res = await api.post(`admin/events/${eventId}/decision/`, { decision });
      showFeedback(res.data.message);
      fetchApprovals();
      fetchAllEvents();
      fetchSummary();
    } catch (err) {
      showFeedback("Failed to process event decision.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleEventDelete = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    setActionLoading(`delete-event-${eventId}`);
    try {
      await api.delete(`events/listings/${eventId}/`);
      showFeedback("Event deleted successfully.");
      fetchAllEvents();
      fetchSummary();
    } catch (err) {
      showFeedback("Failed to delete event.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleVenueApproval = async (venueId, decision) => {
    setActionLoading(`venue-${venueId}`);
    try {
      const res = await api.post(`admin/venues/${venueId}/decision/`, { decision });
      showFeedback(res.data.message);
      fetchApprovals();
      fetchAllVenues();
      fetchSummary();
    } catch (err) {
      showFeedback("Failed to process venue decision.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleVenueDelete = async (venueId) => {
    if (!window.confirm("Are you sure you want to delete this venue?")) return;
    setActionLoading(`delete-venue-${venueId}`);
    try {
      await api.delete(`venues/listings/${venueId}/`);
      showFeedback("Venue deleted successfully.");
      fetchAllVenues();
      fetchSummary();
    } catch (err) {
      showFeedback("Failed to delete venue.", "error");
    } finally {
      setActionLoading(null);
    }
  };



  const handleIssueRefund = async (bookingId) => {
    setActionLoading(`refund-${bookingId}`);
    try {
      const res = await api.post(`admin/bookings/${bookingId}/refund/`);
      showFeedback(res.data.message);
      setRefundModal({ show: false, booking: null });
      fetchBookings();
      fetchSummary();
    } catch (err) {
      showFeedback(err.response?.data?.error || "Failed to issue refund.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
    
    setActionLoading('broadcast');
    setBroadcastSuccess('');
    try {
      const res = await api.post('admin/broadcast/', {
        title: broadcastTitle,
        message: broadcastMessage
      });
      setBroadcastSuccess(res.data.message);
      setBroadcastTitle('');
      setBroadcastMessage('');
      showFeedback("Broadcast alert dispatched successfully!");
    } catch (err) {
      showFeedback("Failed to send broadcast alert.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplaintDelete = async (complaintId) => {
    if (!window.confirm("Are you sure you want to delete this complaint?")) return;
    setActionLoading(`delete-complaint-${complaintId}`);
    try {
      await api.delete(`admin/complaints/${complaintId}/`);
      showFeedback("Complaint deleted successfully.");
      fetchComplaints();
    } catch (err) {
      showFeedback("Failed to delete complaint.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !replyingTo) return;

    setActionLoading(`reply-${replyingTo.id}`);
    try {
      const res = await api.post(`admin/complaints/${replyingTo.id}/reply/`, {
        message: replyMessage
      });
      showFeedback(res.data.message);
      setReplyingTo(null);
      setReplyMessage('');
      fetchComplaints();
    } catch (err) {
      showFeedback(err.response?.data?.error || "Failed to send reply.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Helper to draw SVG Charts cleanly
  const renderSVGLineChart = (data, valueKey, strokeColor, isFinance = false) => {
    if (!data || data.length === 0) return null;
    
    const width = 500;
    const height = 150;
    const padding = 20;
    
    const values = data.map(d => d[valueKey]);
    const maxVal = Math.max(...values, 10);
    const minVal = Math.min(...values, 0);
    const range = maxVal - minVal;
    
    const getX = (index) => padding + (index * (width - padding * 2)) / (data.length - 1);
    const getY = (val) => height - padding - ((val - minVal) * (height - padding * 2)) / range;
    
    let pathD = '';
    let areaD = `M ${getX(0)} ${height - padding}`;
    
    data.forEach((d, idx) => {
      const x = getX(idx);
      const y = getY(d[valueKey]);
      if (idx === 0) {
        pathD = `M ${x} ${y}`;
      } else {
        pathD += ` L ${x} ${y}`;
      }
      areaD += ` L ${x} ${y}`;
    });
    areaD += ` L ${getX(data.length - 1)} ${height - padding} Z`;
    
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40">
        <defs>
          <linearGradient id={`grad-${valueKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.2"/>
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0"/>
          </linearGradient>
        </defs>
        {/* Grid lines */}
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.05)" />
        <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="rgba(255,255,255,0.05)" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.1)" />
        
        {/* Fill Area */}
        <path d={areaD} fill={`url(#grad-${valueKey})`} />
        
        {/* Stroke Line */}
        <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
        
        {/* Min/Max value indicator */}
        <text x={padding + 5} y={padding + 10} fill="#6b7280" fontSize="8" fontWeight="bold">
          {isFinance ? `₹${maxVal}` : maxVal}
        </text>
        <text x={padding + 5} y={height - padding - 5} fill="#6b7280" fontSize="8" fontWeight="bold">
          {isFinance ? `₹${minVal}` : minVal}
        </text>
      </svg>
    );
  };

  const paginatedEvents = allEvents.slice((eventsPage - 1) * itemsPerPage, eventsPage * itemsPerPage);
  const totalEventPages = Math.ceil(allEvents.length / itemsPerPage);

  const paginatedVenues = allVenues.slice((venuesPage - 1) * itemsPerPage, venuesPage * itemsPerPage);
  const totalVenuePages = Math.ceil(allVenues.length / itemsPerPage);

  const renderPagination = (currentPage, totalPages, onPageChange, totalItems) => {
    if (totalItems === 0) return null;
    
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    const pagesCount = Math.max(totalPages, 1);

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5 text-xs text-dark-muted font-semibold mt-4">
        <div>
          Showing <span className="text-white">{startItem}</span> to <span className="text-white">{endItem}</span> of <span className="text-white">{totalItems}</span> entries
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-40 disabled:hover:bg-white/5 transition-all"
          >
            Previous
          </button>
          {[...Array(pagesCount)].map((_, i) => {
            const pageNum = i + 1;
            if (pagesCount > 6 && Math.abs(currentPage - pageNum) > 2 && pageNum !== 1 && pageNum !== pagesCount) {
              if (pageNum === 2 || pageNum === pagesCount - 1) {
                return <span key={pageNum} className="px-2">...</span>;
              }
              return null;
            }
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`w-8 h-8 rounded-lg transition-all ${
                  currentPage === pageNum
                    ? 'bg-red-500 text-white font-bold'
                    : 'bg-white/5 hover:bg-white/10 text-dark-text'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => onPageChange(Math.min(currentPage + 1, pagesCount))}
            disabled={currentPage === pagesCount}
            className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-40 disabled:hover:bg-white/5 transition-all"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-12 py-10">
      
      {/* Toast Alert Feedback */}
      <AnimatePresence>
        {feedbackMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-24 right-6 z-50 px-5 py-3.5 rounded-xl border shadow-xl flex items-center space-x-3 backdrop-blur-md ${
              feedbackMsg.type === 'error'
                ? 'bg-red-500/10 border-red-500/35 text-red-400'
                : 'bg-emerald-500/10 border-emerald-500/35 text-emerald-400'
            }`}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-semibold">{feedbackMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center space-x-2 text-red-400 font-bold uppercase tracking-wider text-xs">
            <Shield className="w-4 h-4" />
            <span>Platform Administration Security Control</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white mt-1 tracking-tight">Admin Dashboard</h1>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadTabContent}
            className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 text-dark-text border border-white/5 px-4 py-2.5 rounded-xl transition-all text-sm font-bold"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Panel Data</span>
          </button>
        </div>
      </div>

      {/* Grid Tabs Navigation & Views */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Navigation Panel */}
        {sidebarOpen && (
          <div className="lg:col-span-1 flex flex-col space-y-2">
            <div className="flex items-center justify-between px-2 py-1.5 mb-2 border-b border-white/5 pb-2">
              <span className="text-[10px] font-bold text-dark-muted uppercase tracking-wider">Control Menu</span>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="text-dark-muted hover:text-red-400 p-1 hover:bg-white/5 rounded transition-all"
                title="Close Sidebar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {[
              { id: 'users', label: 'User Control', icon: Users },
              { id: 'finance', label: 'Transactions & Refunds', icon: IndianRupee },
              { id: 'complaints', label: 'Complaints Panel', icon: MessageSquare },
              { id: 'broadcast', label: 'Broadcast Alerts', icon: Send }
            ].map(tab => {
              const Icon = tab.icon;
              const hasBadge = tab.countKey && summary && (
                (tab.countKey === 'approvals' && (summary.pending.organizers + summary.pending.plot_owners + summary.pending.events + summary.pending.venues) > 0)
              );
              const badgeCount = hasBadge && (
                summary.pending.organizers + summary.pending.plot_owners + summary.pending.events + summary.pending.venues
              );
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-bold transition-all ${
                    activeTab === tab.id
                      ? 'bg-red-500/10 border-red-500/20 text-red-400 shadow-md shadow-red-950/10'
                      : 'bg-white/5 hover:bg-white/10 text-dark-muted hover:text-dark-text border-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                  {hasBadge && (
                    <span className="bg-red-500/20 text-red-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-red-500/30">
                      {badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Viewport Panels */}
        <div className={`${sidebarOpen ? 'lg:col-span-4' : 'lg:col-span-5'} min-h-[500px]`}>
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center space-x-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3.5 py-2 rounded-xl text-xs font-bold mb-6 transition-all shadow-md shadow-red-950/10"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Show Control Menu</span>
            </button>
          )}
          
          {loading ? (
            <div className="glass-panel border border-white/10 rounded-2xl p-16 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-red-500/20 border-t-red-400 rounded-full animate-spin"></div>
              <p className="text-dark-muted text-sm font-semibold">Synchronizing systems analytics records...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-8"
              >

                {/* TAB: OVERVIEW */}
                {activeTab === 'overview' && summary && (
                  <div className="space-y-8">
                    
                    {/* Stat boxes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                      
                      <div className="glass-panel border border-white/10 rounded-2xl p-5 shadow-lg">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-dark-muted font-bold uppercase tracking-wider">Total Booking Revenue</p>
                          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                            <Landmark className="w-4.5 h-4.5" />
                          </div>
                        </div>
                        <h2 className="text-2xl font-extrabold text-white mt-3">₹{summary.finance.revenue.toLocaleString()}</h2>
                        <p className="text-[10px] text-emerald-400 font-semibold mt-1 flex items-center">
                          <span>Verified Razorpay receipts</span>
                        </p>
                      </div>

                      <div className="glass-panel border border-white/10 rounded-2xl p-5 shadow-lg">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-dark-muted font-bold uppercase tracking-wider">Active Bookings</p>
                          <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                            <Calendar className="w-4.5 h-4.5" />
                          </div>
                        </div>
                        <h2 className="text-2xl font-extrabold text-white mt-3">{summary.finance.bookings_count}</h2>
                        <p className="text-[10px] text-dark-muted font-semibold mt-1">Confirmed event seats reserved</p>
                      </div>

                      <div className="glass-panel border border-white/10 rounded-2xl p-5 shadow-lg">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-dark-muted font-bold uppercase tracking-wider">Total Events</p>
                          <div className="w-9 h-9 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center border border-pink-500/20">
                            <Calendar className="w-4.5 h-4.5" />
                          </div>
                        </div>
                        <h2 className="text-2xl font-extrabold text-white mt-3">{summary.total_events || 0}</h2>
                        <p className="text-[10px] text-dark-muted font-semibold mt-1">Registered events in system</p>
                      </div>

                      <div className="glass-panel border border-white/10 rounded-2xl p-5 shadow-lg">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-dark-muted font-bold uppercase tracking-wider">Total Venues</p>
                          <div className="w-9 h-9 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
                            <Building className="w-4.5 h-4.5" />
                          </div>
                        </div>
                        <h2 className="text-2xl font-extrabold text-white mt-3">{summary.total_venues || 0}</h2>
                        <p className="text-[10px] text-dark-muted font-semibold mt-1">Registered venue plots</p>
                      </div>

                      <div className="glass-panel border border-white/10 rounded-2xl p-5 shadow-lg">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-dark-muted font-bold uppercase tracking-wider">Total Venues Booked</p>
                          <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                            <Building className="w-4.5 h-4.5" />
                          </div>
                        </div>
                        <h2 className="text-2xl font-extrabold text-white mt-3">{summary.finance.venue_bookings_count || 0}</h2>
                        <p className="text-[10px] text-dark-muted font-semibold mt-1">Approved venue hire slots</p>
                      </div>

                      <div className="glass-panel border border-white/10 rounded-2xl p-5 shadow-lg">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-dark-muted font-bold uppercase tracking-wider">Registered Accounts</p>
                          <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                            <Users className="w-4.5 h-4.5" />
                          </div>
                        </div>
                        <h2 className="text-2xl font-extrabold text-white mt-3">
                          {summary.users.customers + summary.users.organizers + summary.users.plot_owners}
                        </h2>
                        <p className="text-[10px] text-dark-muted mt-1 font-semibold leading-relaxed">
                          Cust: {summary.users.customers} | Org: {summary.users.organizers} | Plot: {summary.users.plot_owners}
                        </p>
                      </div>

                      <div className="glass-panel border border-white/10 rounded-2xl p-5 shadow-lg border-red-500/15">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-dark-muted font-bold uppercase tracking-wider">Pending Actions</p>
                          <div className="w-9 h-9 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
                            <ShieldAlert className="w-4.5 h-4.5" />
                          </div>
                        </div>
                        <h2 className="text-2xl font-extrabold text-white mt-3">
                          {summary.pending.organizers + summary.pending.plot_owners + summary.pending.events + summary.pending.venues}
                        </h2>
                        <p className="text-[10px] text-red-400 font-semibold mt-1">Approvals required in system</p>
                      </div>

                    </div>

                    {/* Chart Panels */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      
                      <div className="glass-panel border border-white/10 rounded-2xl p-6 shadow-lg">
                        <h3 className="text-sm font-bold text-dark-text uppercase tracking-wider border-b border-white/5 pb-3">Financial Sales Trend (Past 30 Days)</h3>
                        <div className="mt-4">
                          {renderSVGLineChart(summary.charts.sales, 'revenue', '#3B82F6', true)}
                        </div>
                      </div>

                      <div className="glass-panel border border-white/10 rounded-2xl p-6 shadow-lg">
                        <h3 className="text-sm font-bold text-dark-text uppercase tracking-wider border-b border-white/5 pb-3">User Signups Velocity (Past 30 Days)</h3>
                        <div className="mt-4">
                          {renderSVGLineChart(summary.charts.signups, 'count', '#3B82F6', false)}
                        </div>
                      </div>

                    </div>

                  </div>
                )}

                {/* TAB: PLATFORM REVENUE */}
                {activeTab === 'platform_revenue' && summary && (
                  <div className="space-y-8">
                    {/* Platform Commission Summary */}
                    <div className="glass-panel border border-white/10 rounded-2xl p-6 shadow-lg bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/15">
                      <div className="flex items-center space-x-2 border-b border-white/5 pb-4 mb-4">
                        <IndianRupee className="w-5 h-5 text-[#3B82F6]" />
                        <h2 className="font-extrabold text-base text-dark-text uppercase tracking-wider">
                          Platform Revenue & Commission (20% Cut)
                        </h2>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {/* Total Commission */}
                        <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                          <p className="text-[10px] text-dark-muted font-bold uppercase tracking-wider">Total Commission Earned</p>
                          <h3 className="text-3xl font-black text-emerald-400 mt-2">
                            ₹{(summary.finance.admin_total_commission || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </h3>
                          <p className="text-[9px] text-dark-muted mt-1 leading-relaxed">
                            Accrued from completed events and finished venue rentals.
                          </p>
                        </div>
                        {/* Organizer Commission */}
                        <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                          <p className="text-[10px] text-dark-muted font-bold uppercase tracking-wider">From Event Bookings (Organizers)</p>
                          <h3 className="text-2xl font-black text-white mt-2">
                            ₹{(summary.finance.admin_organizer_commission || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </h3>
                          <p className="text-[9px] text-dark-muted mt-1 leading-relaxed">
                            20% of active bookings (₹{(summary.finance.completed_events_revenue || 0).toLocaleString()}) + 10% of cancelled bookings (₹{(summary.finance.refunded_events_revenue || 0).toLocaleString()}).
                          </p>
                        </div>
                        {/* Venue Booking Commission */}
                        <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                          <p className="text-[10px] text-dark-muted font-bold uppercase tracking-wider">From Venue Bookings (Plot Owners)</p>
                          <h3 className="text-2xl font-black text-white mt-2">
                            ₹{(summary.finance.admin_venue_commission || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </h3>
                          <p className="text-[9px] text-dark-muted mt-1 leading-relaxed">
                            20% share of ₹{(summary.finance.completed_venues_revenue || 0).toLocaleString()} from finished venue rentals.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Event Ticketing Profit & Loss Audit */}
                    <div className="glass-panel border border-white/10 rounded-2xl p-6 shadow-lg bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/15">
                      <div className="flex items-center space-x-2 border-b border-white/5 pb-4 mb-4">
                        <Activity className="w-5 h-5 text-emerald-400" />
                        <h2 className="font-extrabold text-base text-dark-text uppercase tracking-wider">
                          Event Ticketing Sales & Cancellation Splits
                        </h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        
                        {/* Event Gross Sales */}
                        <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                          <p className="text-[10px] text-dark-muted font-bold uppercase tracking-wider">Gross Ticketing Sales</p>
                          <h3 className="text-2xl font-black text-white mt-2">
                            ₹{(summary.finance.event_gross_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </h3>
                          <div className="mt-3 space-y-1 text-[9px] text-dark-muted border-t border-white/5 pt-2">
                            <div className="flex justify-between">
                              <span>Active Bookings (80% / 20%):</span>
                              <span className="text-dark-text font-medium">₹{(summary.finance.event_active_sales || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Cancelled Bookings:</span>
                              <span className="text-red-400 font-medium">₹{(summary.finance.event_cancelled_sales || 0).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Customer Refunds */}
                        <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                          <p className="text-[10px] text-dark-muted font-bold uppercase tracking-wider">Total Customer Refunds (50%)</p>
                          <h3 className="text-2xl font-black text-blue-400 mt-2">
                            ₹{(summary.finance.customer_refunds || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </h3>
                          <div className="mt-3 space-y-1 text-[9px] text-dark-muted border-t border-white/5 pt-2">
                            <div className="flex justify-between">
                              <span>Cancellations Count:</span>
                              <span className="text-dark-text font-medium">{summary.finance.event_cancelled_count} bookings</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Refund policy rate:</span>
                              <span className="text-blue-400 font-medium">50% ticket price</span>
                            </div>
                          </div>
                        </div>

                        {/* Organizer Net & Loss Impact */}
                        <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                          <p className="text-[10px] text-dark-muted font-bold uppercase tracking-wider">Organizer Sales Net Retained</p>
                          <h3 className="text-2xl font-black text-emerald-400 mt-2">
                            ₹{(summary.finance.organizer_active_sales + summary.finance.organizer_cancelled_retained || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </h3>
                          <div className="mt-3 space-y-1 text-[9px] text-dark-muted border-t border-white/5 pt-2">
                            <div className="flex justify-between">
                              <span>Active Organizer Cut (80%):</span>
                              <span className="text-dark-text font-medium">₹{(summary.finance.organizer_active_sales || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Cut/Loss from Refunds (40%):</span>
                              <span className="text-red-400 font-medium">-₹{(summary.finance.organizer_refund_impact || 0).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Admin Net & Loss Impact */}
                        <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                          <p className="text-[10px] text-dark-muted font-bold uppercase tracking-wider">Admin Commission Retained</p>
                          <h3 className="text-2xl font-black text-brand-primary mt-2">
                            ₹{(summary.finance.admin_active_commission + summary.finance.admin_cancelled_commission || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </h3>
                          <div className="mt-3 space-y-1 text-[9px] text-dark-muted border-t border-white/5 pt-2">
                            <div className="flex justify-between">
                              <span>Active Admin Cut (20%):</span>
                              <span className="text-dark-text font-medium">₹{(summary.finance.admin_active_commission || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Cut/Loss from Refunds (10%):</span>
                              <span className="text-red-400 font-medium">-₹{(summary.finance.admin_cut_refund_impact || 0).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: APPROVALS */}
                {activeTab === 'approvals' && (
                  <div className="space-y-8">
                    
                    {/* Organizer & Owner accounts pending approval */}
                    <div className="glass-panel border border-white/10 rounded-2xl p-6 shadow-lg">
                      <div className="flex items-center space-x-2 border-b border-white/5 pb-4 mb-4">
                        <Users className="w-4.5 h-4.5 text-red-400" />
                        <h2 className="font-extrabold text-base text-dark-text uppercase tracking-wider">Account Approvals</h2>
                      </div>
                      
                      {usersList.filter(u => u.role !== 'customer' && !u.is_approved).length === 0 ? (
                        <p className="text-xs text-dark-muted py-2">No pending organizer or plot owner registration requests.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-white/5 text-dark-muted font-bold">
                                <th className="pb-3">User</th>
                                <th className="pb-3">Role</th>
                                <th className="pb-3">Joined Date</th>
                                <th className="pb-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {usersList.filter(u => u.role !== 'customer' && !u.is_approved).map(u => (
                                <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.01]">
                                  <td className="py-3">
                                    <p className="font-bold text-dark-text">{u.first_name} {u.last_name}</p>
                                    <p className="text-[10px] text-dark-muted">{u.email}</p>
                                  </td>
                                  <td className="py-3">
                                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                      {u.role.replace('_', ' ')}
                                    </span>
                                  </td>
                                  <td className="py-3 text-dark-muted">
                                    {new Date(u.date_joined).toLocaleDateString()}
                                  </td>
                                  <td className="py-3 text-right">
                                    <button
                                      onClick={() => handleUserApprove(u.id)}
                                      disabled={actionLoading === `approve-user-${u.id}`}
                                      className="bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/25 text-emerald-400 px-3 py-1.5 rounded-lg font-bold text-[10px] disabled:opacity-40 transition-colors"
                                    >
                                      {actionLoading === `approve-user-${u.id}` ? 'Approving...' : 'Approve Account'}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Pending Events */}
                    <div className="glass-panel border border-white/10 rounded-2xl p-6 shadow-lg">
                      <div className="flex items-center space-x-2 border-b border-white/5 pb-4 mb-4">
                        <Calendar className="w-4.5 h-4.5 text-red-400" />
                        <h2 className="font-extrabold text-base text-dark-text uppercase tracking-wider">Event Approvals</h2>
                      </div>

                      {pendingEvents.length === 0 ? (
                        <p className="text-xs text-dark-muted py-2">No pending event listings.</p>
                      ) : (
                        <div className="space-y-4">
                          {pendingEvents.map(event => (
                            <div key={event.id} className="border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
                              <div>
                                <h3 className="font-extrabold text-sm text-dark-text">{event.title}</h3>
                                <p className="text-xs text-dark-muted mt-1">Host: {event.organizer_details?.email}</p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[10px] text-dark-muted">
                                  <span>Price: ₹{event.price}</span>
                                  <span>Tickets: {event.tickets_total}</span>
                                  <span>Location: {event.location}</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleEventApproval(event.id, 'approve')}
                                  disabled={actionLoading === `event-${event.id}`}
                                  className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleEventApproval(event.id, 'reject')}
                                  disabled={actionLoading === `event-${event.id}`}
                                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Pending Venues */}
                    <div className="glass-panel border border-white/10 rounded-2xl p-6 shadow-lg">
                      <div className="flex items-center space-x-2 border-b border-white/5 pb-4 mb-4">
                        <Home className="w-4.5 h-4.5 text-red-400" />
                        <h2 className="font-extrabold text-base text-dark-text uppercase tracking-wider">Venue Approvals</h2>
                      </div>

                      {pendingVenues.length === 0 ? (
                        <p className="text-xs text-dark-muted py-2">No pending venue listings.</p>
                      ) : (
                        <div className="space-y-4">
                          {pendingVenues.map(venue => (
                            <div key={venue.id} className="border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
                              <div>
                                <h3 className="font-extrabold text-sm text-dark-text">{venue.name}</h3>
                                <p className="text-xs text-dark-muted mt-1">Owner: {venue.owner_details?.email}</p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[10px] text-dark-muted">
                                  <span>Rent: ₹{venue.price_per_day}/day</span>
                                  <span>Location: {venue.location}</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleVenueApproval(venue.id, 'approve')}
                                  disabled={actionLoading === `venue-${venue.id}`}
                                  className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleVenueApproval(venue.id, 'reject')}
                                  disabled={actionLoading === `venue-${venue.id}`}
                                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    
                  </div>
                )}

                {/* TAB: USER CONTROL */}
                {activeTab === 'users' && (
                  <div className="glass-panel border border-white/10 rounded-2xl p-6 shadow-lg space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4.5 h-4.5 text-red-400" />
                        <h2 className="font-extrabold text-base text-dark-text uppercase tracking-wider">User Directory Management</h2>
                      </div>
                      
                      {/* Search and Filters */}
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dark-muted">
                            <Search className="w-4 h-4" />
                          </span>
                          <input
                            type="text"
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            placeholder="Search by name/email..."
                            className="glass-input pl-9 pr-4 py-2.5 rounded-xl text-xs w-48 placeholder-dark-muted text-white bg-dark-bg focus:outline-none"
                          />
                        </div>
                        <select
                          value={userRoleFilter}
                          onChange={(e) => setUserRoleFilter(e.target.value)}
                          className="glass-input px-3 py-2.5 rounded-xl text-xs text-dark-text bg-dark-bg focus:outline-none w-32"
                        >
                          <option value="">All Roles</option>
                          <option value="customer">Customer</option>
                          <option value="organizer">Organizer</option>
                          <option value="plot_owner">Plot Owner</option>
                        </select>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/5 text-dark-muted font-bold">
                            <th className="pb-3">User Details</th>
                            <th className="pb-3">Role</th>
                            <th className="pb-3">Security status</th>
                            <th className="pb-3 text-right">Administration Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {usersList.length === 0 ? (
                            <tr>
                              <td colSpan="4" className="text-center py-6 text-dark-muted">No users found.</td>
                            </tr>
                          ) : (
                            usersList.map(u => (
                              <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.01]">
                                <td className="py-4">
                                  <p className="font-bold text-dark-text">{u.first_name} {u.last_name}</p>
                                  <p className="text-[10px] text-dark-muted mt-0.5">{u.email}</p>
                                </td>
                                <td className="py-4">
                                  <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-extrabold ${
                                    u.role === 'customer' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' :
                                    u.role === 'organizer' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/10' :
                                    u.role === 'plot_owner' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/10' :
                                    'bg-red-500/10 text-red-400 border border-red-500/10'
                                  }`}>
                                    {u.role.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="py-4">
                                  <div className="flex items-center space-x-2">
                                    <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-400' : 'bg-red-500'}`} />
                                    <span className="text-[10px] font-bold text-dark-text">{u.is_active ? 'Active' : 'Blocked'}</span>
                                    <span className="text-[9px] text-dark-muted font-bold">
                                      ({u.is_approved ? 'Approved' : 'Pending Approve'})
                                    </span>
                                  </div>
                                </td>
                                <td className="py-4 text-right">
                                  <div className="flex items-center justify-end space-x-2">
                                    {/* Action: Approve */}
                                    {u.role !== 'customer' && !u.is_approved && (
                                      <button
                                        onClick={() => handleUserApprove(u.id)}
                                        disabled={actionLoading === `approve-user-${u.id}`}
                                        className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-2.5 py-1.5 rounded-lg font-bold text-[9px] flex items-center space-x-1"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Approve</span>
                                      </button>
                                    )}
                                    {/* Action: Block/Unblock */}
                                    <button
                                      onClick={() => handleUserBlockToggle(u.id)}
                                      disabled={actionLoading === `block-${u.id}`}
                                      className={`px-2.5 py-1.5 rounded-lg font-bold text-[9px] flex items-center space-x-1 border transition-colors ${
                                        u.is_active
                                          ? 'bg-red-500/5 hover:bg-red-500/10 text-red-400 border-red-500/15'
                                          : 'bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 border-emerald-500/15'
                                      }`}
                                    >
                                      {u.is_active ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                      <span>{u.is_active ? 'Block' : 'Unblock'}</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB: TRANSACTIONS & REFUNDS */}
                {activeTab === 'finance' && (
                  <div className="glass-panel border border-white/10 rounded-2xl p-6 shadow-lg space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                      <div className="flex items-center space-x-2">
                        <IndianRupee className="w-4.5 h-4.5 text-red-400" />
                        <h2 className="font-extrabold text-base text-dark-text uppercase tracking-wider">Bookings & Razorpay Payments</h2>
                      </div>
                      
                      {/* Search and Filters */}
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dark-muted">
                            <Search className="w-4 h-4" />
                          </span>
                          <input
                            type="text"
                            value={bookingSearch}
                            onChange={(e) => setBookingSearch(e.target.value)}
                            placeholder="Search by customer/event..."
                            className="glass-input pl-9 pr-4 py-2.5 rounded-xl text-xs w-48 placeholder-dark-muted text-white bg-dark-bg focus:outline-none"
                          />
                        </div>
                        <select
                          value={bookingStatusFilter}
                          onChange={(e) => setBookingStatusFilter(e.target.value)}
                          className="glass-input px-3 py-2.5 rounded-xl text-xs text-dark-text bg-dark-bg focus:outline-none w-36"
                        >
                          <option value="">All Statuses</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="pending">Pending</option>
                        </select>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/5 text-dark-muted font-bold">
                            <th className="pb-3">Booking ID</th>
                            <th className="pb-3">Event & Attendees</th>
                            <th className="pb-3">Receipt Info</th>
                            <th className="pb-3">Status</th>
                            <th className="pb-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bookingsList.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="text-center py-6 text-dark-muted">No transaction receipts found.</td>
                            </tr>
                          ) : (
                            bookingsList.map(booking => (
                              <tr key={booking.id} className="border-b border-white/5 hover:bg-white/[0.01]">
                                <td className="py-4">
                                  <p className="font-bold text-dark-text">#{booking.id}</p>
                                  <p className="text-[9px] text-dark-muted font-mono">{new Date(booking.created_at).toLocaleDateString()}</p>
                                </td>
                                <td className="py-4">
                                  <p className="font-bold text-white line-clamp-1">{booking.event_details?.title}</p>
                                  <p className="text-[10px] text-dark-muted mt-0.5 flex items-center">
                                    <CornerDownRight className="w-3.5 h-3.5 mr-1" />
                                    <span>{booking.user_details?.email} ({booking.tickets_count} tickets • {booking.ticket_category})</span>
                                  </p>
                                </td>
                                <td className="py-4">
                                  <p className="font-extrabold text-emerald-400 font-mono">₹{booking.total_price}</p>
                                  <p className="text-[9px] text-dark-muted mt-0.5 font-mono">ID: {booking.payment_id || 'MOCK_REF'}</p>
                                </td>
                                <td className="py-4">
                                  <div className="flex flex-col space-y-1">
                                    <span className={`w-fit px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold ${
                                      booking.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400' :
                                      booking.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                                      'bg-yellow-500/10 text-yellow-400'
                                    }`}>
                                      {booking.status}
                                    </span>
                                    <span className="text-[9px] font-semibold text-dark-muted font-mono">
                                      Pay: {booking.payment_status}
                                    </span>
                                    {booking.refund_requested && (
                                      <span className="px-2 py-0.5 rounded text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/15 font-bold w-fit mt-1 animate-pulse">
                                        Refund Requested
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-4 text-right">
                                  {booking.payment_status === 'paid' ? (
                                    booking.event_details ? (
                                      <span className="text-[10px] text-dark-muted font-semibold">Handled by Organizer</span>
                                    ) : (
                                      <button
                                        onClick={() => setRefundModal({ show: true, booking })}
                                        disabled={actionLoading === `refund-${booking.id}`}
                                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/15 px-2.5 py-1.5 rounded-lg font-bold text-[9px] disabled:opacity-40 transition-colors"
                                      >
                                        {actionLoading === `refund-${booking.id}` ? 'Processing...' : 'Refund Order'}
                                      </button>
                                    )
                                  ) : (
                                    <span className="text-[10px] text-dark-muted font-semibold">Processed</span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB: BROADCAST ALERTS */}
                {activeTab === 'broadcast' && (
                  <div className="glass-panel border border-white/10 rounded-2xl p-6 shadow-lg space-y-6 max-w-xl mx-auto">
                    <div className="flex items-center space-x-2 border-b border-white/5 pb-4">
                      <Send className="w-4.5 h-4.5 text-red-400" />
                      <h2 className="font-extrabold text-base text-dark-text uppercase tracking-wider">Broadcast Live Alert</h2>
                    </div>

                    <form onSubmit={handleSendBroadcast} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">Alert Title</label>
                        <input
                          type="text"
                          value={broadcastTitle}
                          onChange={(e) => setBroadcastTitle(e.target.value)}
                          placeholder="e.g. System Maintenance or Ahmedabad Rain Alerts"
                          className="glass-input w-full px-4 py-3 rounded-xl text-xs placeholder-dark-muted text-white bg-dark-bg focus:outline-none"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">Message Body</label>
                        <textarea
                          rows="4"
                          value={broadcastMessage}
                          onChange={(e) => setBroadcastMessage(e.target.value)}
                          placeholder="Write a clear notification message to be broadcasted to all connected user WebSockets instantly..."
                          className="glass-input w-full px-4 py-3 rounded-xl text-xs placeholder-dark-muted text-white bg-dark-bg focus:outline-none resize-none"
                          required
                        ></textarea>
                      </div>

                      {broadcastSuccess && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl font-medium">
                          {broadcastSuccess}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={actionLoading === 'broadcast' || !broadcastTitle.trim() || !broadcastMessage.trim()}
                        className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md shadow-red-950/20 text-xs uppercase tracking-wider flex items-center justify-center space-x-2"
                      >
                        <Send className="w-4 h-4" />
                        <span>{actionLoading === 'broadcast' ? 'Sending broadcast...' : 'Broadcast Live Notification'}</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* TAB: ALL EVENTS */}
                {activeTab === 'all_events' && (
                  <div className="glass-panel border border-white/10 rounded-2xl p-6 shadow-lg space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-5 h-5 text-red-400" />
                        <h2 className="font-extrabold text-base text-dark-text uppercase tracking-wider">All Events</h2>
                      </div>
                      
                      {/* Search Bar */}
                      <div className="relative max-w-md w-full md:w-80">
                        <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-dark-muted" />
                        <input
                          type="text"
                          placeholder="Search events..."
                          value={eventSearch}
                          onChange={(e) => setEventSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/5 focus:border-red-500/35 rounded-xl text-sm text-dark-text focus:outline-none transition-all placeholder:text-dark-muted font-semibold"
                        />
                      </div>
                    </div>

                    {allEvents.length === 0 ? (
                      <p className="text-xs text-dark-muted py-4 text-center">No events found matching your search.</p>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-white/5 text-dark-muted font-bold">
                                <th className="pb-3">Event Title</th>
                                <th className="pb-3">Organizer</th>
                                <th className="pb-3">Price</th>
                                <th className="pb-3">Location</th>
                                <th className="pb-3">Tickets Sold</th>
                                <th className="pb-3">Status</th>
                                <th className="pb-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginatedEvents.map(event => (
                                <tr key={event.id} className="border-b border-white/5 hover:bg-white/[0.01]">
                                  <td className="py-3 font-bold text-dark-text">
                                    <div className="flex items-center space-x-3">
                                      <img
                                        src={event.image || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=80&q=80'}
                                        alt={event.title}
                                        className="w-10 h-10 object-cover rounded-lg border border-white/10 flex-shrink-0"
                                        onError={(e) => {
                                          e.target.src = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=80&q=80';
                                        }}
                                      />
                                      <span>{event.title}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 text-dark-muted">{event.organizer_details?.email || event.organizer}</td>
                                  <td className="py-3 text-dark-text font-semibold">₹{event.price}</td>
                                  <td className="py-3 text-dark-muted">{event.location}</td>
                                  <td className="py-3 text-dark-muted">{event.tickets_sold} / {event.tickets_total}</td>
                                  <td className="py-3">
                                    {event.is_approved ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Approved</span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Pending</span>
                                    )}
                                  </td>
                                  <td className="py-3 text-right space-x-2">
                                    {!event.is_approved && (
                                      <button
                                        onClick={() => handleEventApproval(event.id, 'approve')}
                                        disabled={actionLoading === `event-${event.id}`}
                                        className="bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/25 text-emerald-400 px-2 py-1 rounded-lg font-bold text-[10px] disabled:opacity-40 transition-colors"
                                      >
                                        Approve
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleEventDelete(event.id)}
                                      disabled={actionLoading === `delete-event-${event.id}`}
                                      className="bg-red-500/15 hover:bg-red-500/25 border border-red-500/25 text-red-400 px-2 py-1 rounded-lg font-bold text-[10px] disabled:opacity-40 transition-colors"
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {renderPagination(eventsPage, totalEventPages, setEventsPage, allEvents.length)}
                      </>
                    )}
                  </div>
                )}

                {/* TAB: ALL VENUES */}
                {activeTab === 'all_venues' && (
                  <div className="glass-panel border border-white/10 rounded-2xl p-6 shadow-lg space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                      <div className="flex items-center space-x-2">
                        <Building className="w-5 h-5 text-red-400" />
                        <h2 className="font-extrabold text-base text-dark-text uppercase tracking-wider">All Venues</h2>
                      </div>
                      
                      {/* Search Bar */}
                      <div className="relative max-w-md w-full md:w-80">
                        <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-dark-muted" />
                        <input
                          type="text"
                          placeholder="Search venues..."
                          value={venueSearch}
                          onChange={(e) => setVenueSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/5 focus:border-red-500/35 rounded-xl text-sm text-dark-text focus:outline-none transition-all placeholder:text-dark-muted font-semibold"
                        />
                      </div>
                    </div>

                    {allVenues.length === 0 ? (
                      <p className="text-xs text-dark-muted py-4 text-center">No venues found matching your search.</p>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-white/5 text-dark-muted font-bold">
                                <th className="pb-3">Venue Name</th>
                                <th className="pb-3">Owner</th>
                                <th className="pb-3">Rent/Day</th>
                                <th className="pb-3">Location</th>
                                <th className="pb-3">Capacity</th>
                                <th className="pb-3">Status</th>
                                <th className="pb-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginatedVenues.map(venue => (
                                <tr key={venue.id} className="border-b border-white/5 hover:bg-white/[0.01]">
                                  <td className="py-3 font-bold text-dark-text">
                                    <div className="flex items-center space-x-3">
                                      <img
                                        src={venue.image || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=80&q=80'}
                                        alt={venue.name}
                                        className="w-10 h-10 object-cover rounded-lg border border-white/10 flex-shrink-0"
                                        onError={(e) => {
                                          e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=80&q=80';
                                        }}
                                      />
                                      <span>{venue.name}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 text-dark-muted">{venue.owner_details?.email || venue.owner}</td>
                                  <td className="py-3 text-dark-text font-semibold">₹{venue.price_per_day}</td>
                                  <td className="py-3 text-dark-muted">{venue.location}</td>
                                  <td className="py-3 text-dark-muted">{venue.capacity} guests</td>
                                  <td className="py-3">
                                    {venue.is_approved ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Approved</span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Pending</span>
                                    )}
                                  </td>
                                  <td className="py-3 text-right space-x-2">
                                    {!venue.is_approved && (
                                      <button
                                        onClick={() => handleVenueApproval(venue.id, 'approve')}
                                        disabled={actionLoading === `venue-${venue.id}`}
                                        className="bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/25 text-emerald-400 px-2 py-1 rounded-lg font-bold text-[10px] disabled:opacity-40 transition-colors"
                                      >
                                        Approve
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleVenueDelete(venue.id)}
                                      disabled={actionLoading === `delete-venue-${venue.id}`}
                                      className="bg-red-500/15 hover:bg-red-500/25 border border-red-500/25 text-red-400 px-2 py-1 rounded-lg font-bold text-[10px] disabled:opacity-40 transition-colors"
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {renderPagination(venuesPage, totalVenuePages, setVenuesPage, allVenues.length)}
                      </>
                    )}
                  </div>
                )}

                {/* TAB: COMPLAINTS */}
                {activeTab === 'complaints' && (
                  <div className="glass-panel border border-white/10 rounded-2xl p-6 shadow-lg space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4.5 h-4.5 text-red-400" />
                        <h2 className="font-extrabold text-base text-dark-text uppercase tracking-wider">Complaints & Inquiries</h2>
                      </div>
                      
                      {/* Search and Filters */}
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dark-muted">
                            <Search className="w-4 h-4" />
                          </span>
                          <input
                            type="text"
                            value={complaintSearch}
                            onChange={(e) => setComplaintSearch(e.target.value)}
                            placeholder="Search complaints..."
                            className="glass-input pl-9 pr-4 py-2.5 rounded-xl text-xs w-48 placeholder-dark-muted text-white bg-dark-bg focus:outline-none"
                          />
                        </div>
                        <select
                          value={complaintRoleFilter}
                          onChange={(e) => setComplaintRoleFilter(e.target.value)}
                          className="glass-input px-3 py-2.5 rounded-xl text-xs text-dark-text bg-dark-bg focus:outline-none w-36"
                        >
                          <option value="">All Roles</option>
                          <option value="customer">Customer</option>
                          <option value="organizer">Organizer</option>
                          <option value="owners">Venue Owner</option>
                        </select>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/5 text-dark-muted font-bold">
                            <th className="pb-3">Submitted</th>
                            <th className="pb-3">User Details</th>
                            <th className="pb-3">Role</th>
                            <th className="pb-3">Subject & Message</th>
                            <th className="pb-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {complaintsList.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="text-center py-6 text-dark-muted">No complaints or inquiries found.</td>
                            </tr>
                          ) : (
                            complaintsList.map(complaint => (
                              <tr key={complaint.id} className="border-b border-white/5 hover:bg-white/[0.01]">
                                <td className="py-4 font-mono text-[9px] text-dark-muted">
                                  {new Date(complaint.created_at).toLocaleString()}
                                </td>
                                <td className="py-4">
                                  <p className="font-bold text-dark-text">{complaint.name}</p>
                                  <p className="text-[10px] text-dark-muted mt-0.5">{complaint.email}</p>
                                </td>
                                <td className="py-4">
                                  <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold ${
                                    complaint.role === 'customer' ? 'bg-blue-500/10 text-blue-400' :
                                    complaint.role === 'organizer' ? 'bg-emerald-500/10 text-emerald-400' :
                                    'bg-purple-500/10 text-purple-400'
                                  }`}>
                                    {complaint.role === 'owners' ? 'Venue Owner' : complaint.role}
                                  </span>
                                </td>
                                <td className="py-4 max-w-xs">
                                  <p className="font-bold text-white line-clamp-1">{complaint.subject || 'No Subject'}</p>
                                  <p className="text-[10px] text-dark-muted mt-0.5 line-clamp-2 whitespace-pre-wrap">{complaint.message}</p>
                                </td>
                                <td className="py-4 text-right">
                                  <div className="flex items-center justify-end space-x-2">
                                    <button
                                      onClick={() => setReplyingTo(complaint)}
                                      className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/15 px-2.5 py-1.5 rounded-lg font-bold text-[9px] transition-colors"
                                    >
                                      Reply
                                    </button>
                                    <button
                                      onClick={() => handleComplaintDelete(complaint.id)}
                                      disabled={actionLoading === `delete-complaint-${complaint.id}`}
                                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/15 p-1.5 rounded-lg transition-colors disabled:opacity-40"
                                    >
                                      <Trash className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          )}

        </div>

      </div>

      {/* Reply Modal */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="glass-panel border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl bg-dark-bg/95"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Reply to {replyingTo.name}</h3>
                <button
                  onClick={() => { setReplyingTo(null); setReplyMessage(''); }}
                  className="text-dark-muted hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-white/5 p-4 rounded-xl space-y-2 border border-white/5 text-xs text-dark-muted">
                  <p><strong className="text-white">From:</strong> {replyingTo.name} ({replyingTo.email})</p>
                  <p><strong className="text-white">Role:</strong> <span className="capitalize">{replyingTo.role}</span></p>
                  <p><strong className="text-white">Subject:</strong> {replyingTo.subject || 'No Subject'}</p>
                  <div className="border-t border-white/5 my-2 pt-2 text-white italic whitespace-pre-wrap max-h-32 overflow-y-auto">
                    "{replyingTo.message}"
                  </div>
                </div>

                <form onSubmit={handleSendReply} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">Your Reply Message</label>
                    <textarea
                      rows="6"
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Write your email response here..."
                      className="glass-input w-full px-4 py-3 rounded-xl text-xs placeholder-dark-muted text-white bg-dark-bg focus:outline-none resize-none"
                      required
                    ></textarea>
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => { setReplyingTo(null); setReplyMessage(''); }}
                      className="px-4 py-2.5 rounded-xl border border-white/5 text-dark-muted hover:text-white hover:bg-white/5 transition-all text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading === `reply-${replyingTo.id}` || !replyMessage.trim()}
                      className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-md shadow-emerald-950/20 text-xs uppercase tracking-wider flex items-center space-x-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{actionLoading === `reply-${replyingTo.id}` ? 'Sending Reply...' : 'Send Reply via Email'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Refund Confirmation Modal */}
      <AnimatePresence>
        {refundModal.show && refundModal.booking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="glass-panel border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl bg-dark-bg/95"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Confirm Refund</h3>
                <button
                  onClick={() => setRefundModal({ show: false, booking: null })}
                  className="text-dark-muted hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-red-500/10 border border-red-500/15 p-4 rounded-xl flex items-start space-x-3 text-red-400 text-xs">
                  <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold uppercase tracking-wider">Warning</h4>
                    <p className="mt-1 leading-relaxed">This action will cancel the booking ticket permanently and initiate a refund transfer of the transaction amount.</p>
                  </div>
                </div>

                <div className="bg-white/5 p-4 rounded-xl space-y-2 border border-white/5 text-xs text-dark-muted">
                  <p><strong className="text-white">Booking ID:</strong> #{refundModal.booking.id}</p>
                  <p><strong className="text-white">Event:</strong> {refundModal.booking.event_details?.title}</p>
                  <p><strong className="text-white">Customer:</strong> {refundModal.booking.user_details?.email}</p>
                  <p><strong className="text-white">Tickets Count:</strong> {refundModal.booking.tickets_count}</p>
                  <p><strong className="text-white">Original Payment:</strong> <span className="text-dark-text font-bold">₹{parseFloat(refundModal.booking.total_price).toFixed(2)}</span></p>
                  <p><strong className="text-white">Refund Amount (50% Policy):</strong> <span className="text-emerald-400 font-extrabold">₹{(parseFloat(refundModal.booking.total_price) * 0.5).toFixed(2)}</span></p>
                  {refundModal.booking.razorpay_payment_id ? (
                    <p><strong className="text-white">Payment Ref:</strong> {refundModal.booking.razorpay_payment_id}</p>
                  ) : (
                    <p><strong className="text-white">Payment Ref:</strong> Local / Free Booking</p>
                  )}
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRefundModal({ show: false, booking: null })}
                    className="px-4 py-2.5 rounded-xl border border-white/5 text-dark-muted hover:text-white hover:bg-white/5 transition-all text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleIssueRefund(refundModal.booking.id)}
                    disabled={actionLoading === `refund-${refundModal.booking.id}`}
                    className="bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-md shadow-red-950/20 text-xs uppercase tracking-wider flex items-center space-x-2"
                  >
                    <span>{actionLoading === `refund-${refundModal.booking.id}` ? 'Processing...' : 'Confirm & Issue Refund'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminDashboard;
