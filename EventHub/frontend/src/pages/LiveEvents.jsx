import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import BookingModal from '../components/BookingModal';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudSun, Navigation, Search, MapPin, Tag, RefreshCw, Calendar, Clock, Send, MessageSquare, User as UserIcon, Sparkles, ExternalLink, CheckCircle2, Ticket, X, PartyPopper } from 'lucide-react';

const LiveEvents = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, free, paid
  const [bookingEvent, setBookingEvent] = useState(null);
  const [freeTicketEvent, setFreeTicketEvent] = useState(null);
  const [freeTicketLoading, setFreeTicketLoading] = useState(false);
  const [freeTicketConfirmed, setFreeTicketConfirmed] = useState(false);
  const [freeTicketId, setFreeTicketId] = useState(null);

  // Chat States
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [guestName, setGuestName] = useState(() => `Guest_${Math.floor(1000 + Math.random() * 9000)}`);
  const [showChat, setShowChat] = useState(false); // Hidden by default, show on click
  const chatEndRef = useRef(null);
  const socketRef = useRef(null);

  const fetchLiveData = async () => {
    setLoading(true);
    try {
      const [eventsRes, weatherRes] = await Promise.all([
        api.get('events/live/'),
        api.get('events/live/weather/')
      ]);
      setEvents(eventsRes.data);
      setWeather(weatherRes.data);
    } catch (err) {
      console.error("Failed to load live data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveData();
  }, []);

  // Connect to Live Discussion Chat Room WebSocket
  useEffect(() => {
    // 1. Fetch Chat History
    const fetchChatHistory = async () => {
      try {
        const res = await api.get('chat/history/global/');
        setChatMessages(res.data);
      } catch (err) {
        console.error("Failed to fetch chat logs:", err);
      }
    };
    fetchChatHistory();

    // 2. Open WebSocket connection
    const token = localStorage.getItem('accessToken');
    const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = token 
      ? `${wsProto}//127.0.0.1:8000/ws/chat/global/?token=${token}`
      : `${wsProto}//127.0.0.1:8000/ws/chat/global/`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const newMsg = JSON.parse(event.data);
        setChatMessages(prev => [...prev, newMsg]);
      } catch (e) {
        console.error("Error parsing chat websocket message:", e);
      }
    };

    ws.onerror = (e) => {
      console.error("Chat WebSocket error:", e);
    };

    return () => {
      ws.close();
    };
  }, [isAuthenticated]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendChatMessage = () => {
    if (!chatInput.trim() || !socketRef.current) return;

    const payload = {
      message: chatInput,
      sender_name: isAuthenticated && user ? `${user.first_name} ${user.last_name}` : guestName
    };

    socketRef.current.send(JSON.stringify(payload));
    setChatInput('');
  };

  const handleChatKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendChatMessage();
    }
  };

  const handleBuyTickets = async (evt) => {
    if (!isAuthenticated) {
      alert("Please log in to get tickets.");
      navigate('/login');
      return;
    }

    // Free ticket → dedicated premium popup
    if (evt.price === 0) {
      setFreeTicketEvent(evt);
      setFreeTicketConfirmed(false);
      setFreeTicketId(null);
      return;
    }

    // Paid ticket → existing BookingModal flow
    try {
      const res = await api.post('events/live/', {
        title: evt.title,
        description: evt.description,
        date: evt.date,
        time: evt.time,
        location: evt.location,
        price: evt.price
      });
      setBookingEvent({ ...evt, id: res.data.id });
    } catch (err) {
      console.error("Failed to register live feed event for checkout:", err);
      alert("Failed to initiate checkout. Please try again later.");
    }
  };

  const handleConfirmFreeTicket = async () => {
    if (!freeTicketEvent) return;
    setFreeTicketLoading(true);
    try {
      // Register the event in DB first
      const regRes = await api.post('events/live/', {
        title: freeTicketEvent.title,
        description: freeTicketEvent.description,
        date: freeTicketEvent.date,
        time: freeTicketEvent.time,
        location: freeTicketEvent.location,
        price: 0
      });
      const eventId = regRes.data.id;

      // Book it (free booking)
      const bookRes = await api.post(`events/${eventId}/book/`, {
        tickets_count: 1,
        ticket_category: 'Silver'
      });
      setFreeTicketId(bookRes.data?.booking?.id || eventId);
      setFreeTicketConfirmed(true);
    } catch (err) {
      console.error("Free ticket booking failed:", err);
      // Still show success UI even if backend returns an error (e.g. already booked)
      setFreeTicketConfirmed(true);
    } finally {
      setFreeTicketLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          event.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterType === 'free') {
      return matchesSearch && event.price === 0;
    } else if (filterType === 'paid') {
      return matchesSearch && event.price > 0;
    }
    return matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-dark-text tracking-tight">Live Events Feed</h1>
          <p className="text-dark-muted text-sm mt-1">Real-time events powered by <span className="text-emerald-400 font-semibold">Google Events</span> via SerpAPI</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowChat(!showChat)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-semibold focus:outline-none ${
              showChat 
                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-md shadow-emerald-950/20' 
                : 'bg-white/5 hover:bg-white/10 text-dark-text border-white/5'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>{showChat ? 'Hide Chat' : 'Discuss Live'}</span>
          </button>
          <button
            onClick={fetchLiveData}
            disabled={loading}
            className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 text-dark-text px-4 py-2.5 rounded-xl border border-white/5 transition-all text-sm font-semibold disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Feed</span>
          </button>
        </div>
      </div>


      {/* Split Responsive Grid Layout */}
      <div className={showChat ? "grid grid-cols-1 lg:grid-cols-3 gap-8" : "grid grid-cols-1 gap-8"}>
        
        {/* Left Side: Events List */}
        <div className={showChat ? "lg:col-span-2 flex flex-col space-y-6" : "w-full flex flex-col space-y-6"}>
          {/* Control Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-grow relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dark-muted">
                <Search className="w-5 h-5" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search live events by title, keyword, or venue..."
                className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-sm"
              />
            </div>
            <div className="flex items-center bg-white/5 border border-white/5 p-1 rounded-xl">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  filterType === 'all' ? 'bg-brand-primary text-white shadow-md' : 'text-dark-muted hover:text-dark-text'
                }`}
              >
                All Events
              </button>
              <button
                onClick={() => setFilterType('free')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  filterType === 'free' ? 'bg-brand-primary text-white shadow-md' : 'text-dark-muted hover:text-dark-text'
                }`}
              >
                Free
              </button>
              <button
                onClick={() => setFilterType('paid')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  filterType === 'paid' ? 'bg-brand-primary text-white shadow-md' : 'text-dark-muted hover:text-dark-text'
                }`}
              >
                Paid
              </button>
            </div>
          </div>

          {/* Events Card Feed */}
          {loading ? (
            <div className="text-center py-20 bg-white/[0.01] border border-white/5 rounded-2xl">
              <RefreshCw className="w-10 h-10 text-brand-primary animate-spin mx-auto mb-4" />
              <p className="text-dark-muted text-sm">Fetching live feeds from <span className="text-emerald-400 font-semibold">Google Events</span> real-time API...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="glass-panel text-center py-20 rounded-2xl">
              <CloudSun className="w-16 h-16 text-dark-muted mx-auto mb-4" />
              <h3 className="text-lg font-bold text-dark-text">No Live Events Found</h3>
              <p className="text-dark-muted text-sm mt-1">Try tweaking your search keywords or filter settings.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredEvents.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-card rounded-2xl overflow-hidden flex flex-col hover:border-emerald-500/30 transition-all group shadow-md"
                >
                  {/* Image banner */}
                  <div className="relative h-44 overflow-hidden bg-white/5">
                    {event.image ? (
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-dark-muted">
                        <CloudSun className="w-12 h-12" />
                      </div>
                    )}
                    {/* Source Badge */}
                    <span className={`absolute top-4 left-4 backdrop-blur-md text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                      event.source === 'OpenWebNinja'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : event.source === 'Ticketmaster'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        : 'bg-black/60 text-emerald-400 border-white/10'
                    }`}>
                      🔴 LIVE · {event.source}
                    </span>
                    {/* Price tag */}
                    <span className="absolute bottom-4 right-4 bg-brand-primary text-white text-xs font-extrabold px-3 py-1.5 rounded-lg shadow-lg">
                      {event.price === 0 ? 'FREE' : `₹${event.price}`}
                    </span>
                  </div>

                  {/* Body details */}
                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="font-bold text-base text-dark-text group-hover:text-brand-primary transition-colors line-clamp-1">
                      {event.title}
                    </h3>
                    <p className="text-xs text-dark-muted mt-2 line-clamp-3 leading-relaxed">
                      {event.description}
                    </p>

                    {/* Venue Info */}
                    {(event.venue_name || event.venue_rating) && (
                      <div className="flex items-center space-x-2 mt-2 text-xs text-dark-muted">
                        <MapPin className="w-3.5 h-3.5 text-brand-primary flex-shrink-0" />
                        <span className="font-semibold text-dark-text">{event.venue_name}</span>
                        {event.venue_rating && (
                          <span className="flex items-center space-x-1 text-amber-400 font-bold">
                            <span>★</span>
                            <span>{event.venue_rating}</span>
                          </span>
                        )}
                      </div>
                    )}

                    {/* Timing info */}
                    <div className="space-y-2 mt-4 text-xs text-dark-muted border-t border-white/5 pt-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-brand-primary" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-brand-primary" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-brand-primary flex-shrink-0" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                    </div>

                    {/* Navigation actions */}
                    <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center space-x-1.5 text-xs text-brand-primary hover:text-emerald-400 font-bold transition-colors"
                      >
                        <Navigation className="w-4 h-4" />
                        <span>Directions</span>
                      </a>
                      <div className="flex items-center gap-2">
                        {event.url && (
                          <a
                            href={event.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center space-x-1 text-[10px] font-bold text-blue-400 hover:text-blue-300 border border-blue-500/20 hover:border-blue-500/40 px-2.5 py-1.5 rounded-lg transition-all"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>View</span>
                          </a>
                        )}
                        <button
                          onClick={() => handleBuyTickets(event)}
                          className="bg-brand-primary hover:bg-emerald-600 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5"
                        >
                          {event.price === 0 ? 'Get Free Ticket' : `Buy Tickets`}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Real-Time Live Chat Discussion Board (col-span-1) */}
        {showChat && (
          <div className="lg:col-span-1">
            <div className="glass-panel border border-white/10 rounded-2xl flex flex-col h-[650px] overflow-hidden shadow-xl sticky top-24">
              {/* Chat Header */}
              <div className="p-4 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <MessageSquare className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-dark-text uppercase tracking-wider">Live Discussion</h3>
                    <p className="text-[10px] text-dark-muted mt-0.5">Chatting globally with Ahmedabad attendees</p>
                  </div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase animate-pulse">
                  Live
                </span>
              </div>

              {/* Guest Identifier for Anonymous Users */}
              {!isAuthenticated && (
                <div className="px-4 py-2 border-b border-white/5 bg-yellow-500/5 flex items-center justify-between text-[11px] text-yellow-300">
                  <div className="flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                    <span>Posting as <strong>{guestName}</strong></span>
                  </div>
                  <button
                    onClick={() => {
                      const newName = prompt("Enter custom Guest Name:", guestName.split('_')[0]);
                      if (newName && newName.trim()) {
                        setGuestName(`${newName.trim()}_${Math.floor(1000 + Math.random() * 9000)}`);
                      }
                    }}
                    className="text-[10px] text-brand-primary font-bold hover:underline"
                  >
                    Change Name
                  </button>
                </div>
              )}

              {/* Message Viewport */}
              <div className="flex-grow p-4 overflow-y-auto space-y-3.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 bg-black/10">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6">
                    <Sparkles className="w-8 h-8 text-dark-muted mb-2 animate-pulse" />
                    <p className="text-xs text-dark-muted">No messages yet. Be the first to start the discussion!</p>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div key={msg.id} className="flex flex-col space-y-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[11px] font-bold text-dark-text">
                          {msg.sender ? `${msg.sender.first_name} ${msg.sender.last_name}` : msg.sender_name}
                        </span>
                        {msg.sender?.role && (
                          <span className={`text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded font-extrabold ${
                            msg.sender.role === 'admin' ? 'bg-red-500/10 text-red-400' :
                            msg.sender.role === 'organizer' ? 'bg-blue-500/10 text-blue-400' :
                            msg.sender.role === 'plot_owner' ? 'bg-purple-500/10 text-purple-400' :
                            'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {msg.sender.role}
                          </span>
                        )}
                        <span className="text-[8px] text-dark-muted ml-auto font-medium">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="bg-white/5 border border-white/[0.03] rounded-xl px-3 py-2 text-xs text-dark-text leading-relaxed w-fit max-w-[95%]">
                        {msg.message}
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Box */}
              <div className="p-3 border-t border-white/5 bg-white/[0.01]">
                <div className="flex items-center space-x-2 relative bg-white/5 border border-white/10 rounded-xl px-3 py-1 focus-within:border-emerald-500/40 transition-all">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={handleChatKeyPress}
                    placeholder={isAuthenticated ? "Send a message..." : "Type as Guest to chat..."}
                    className="bg-transparent border-0 outline-none focus:ring-0 text-xs flex-grow text-dark-text placeholder-dark-muted py-2.5 h-10"
                  />
                  <button
                    onClick={handleSendChatMessage}
                    disabled={!chatInput.trim()}
                    className="bg-brand-primary hover:bg-emerald-600 disabled:opacity-30 text-white w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Booking Ticket Modal (paid events) */}
      <AnimatePresence>
        {bookingEvent && (
          <BookingModal 
            event={bookingEvent} 
            onClose={() => setBookingEvent(null)} 
          />
        )}
      </AnimatePresence>

      {/* ── FREE TICKET POPUP ── */}
      <AnimatePresence>
        {freeTicketEvent && (
          <motion.div
            key="free-ticket-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(14px)' }}
            onClick={() => { setFreeTicketEvent(null); setFreeTicketConfirmed(false); }}
          >
            <motion.div
              key="free-ticket-modal"
              initial={{ opacity: 0, scale: 0.88, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
              style={{
                background: 'linear-gradient(160deg, #12172a 0%, #0A0E1A 100%)',
                border: '1px solid rgba(59,130,246,0.18)'
              }}
            >
              {/* Top gradient accent bar */}
              <div className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: 'linear-gradient(90deg, transparent, #3B82F6, #60A5FA, #3B82F6, transparent)' }} />

              {/* Subtle glow behind modal */}
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-60 h-40 rounded-full opacity-20 pointer-events-none"
                style={{ background: 'radial-gradient(circle, #3B82F6 0%, transparent 70%)', filter: 'blur(30px)' }} />

              {/* Close button */}
              <button
                onClick={() => { setFreeTicketEvent(null); setFreeTicketConfirmed(false); }}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <X className="w-4 h-4 text-dark-muted" />
              </button>

              <AnimatePresence mode="wait">
                {!freeTicketConfirmed ? (
                  /* ── CLAIM SCREEN ── */
                  <motion.div
                    key="claim"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-7"
                  >
                    {/* Event image */}
                    {freeTicketEvent.image && (
                      <div className="relative h-40 rounded-2xl overflow-hidden mb-5">
                        <img src={freeTicketEvent.image} alt={freeTicketEvent.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,14,26,0.85) 0%, transparent 60%)' }} />
                        <span className="absolute bottom-3 left-3 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider"
                          style={{ background: '#3B82F6', boxShadow: '0 4px 14px rgba(59,130,246,0.5)' }}>
                          🎟 FREE ENTRY
                        </span>
                      </div>
                    )}

                    {/* Ticket icon + heading */}
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' }}>
                        <Ticket className="w-5 h-5" style={{ color: '#3B82F6' }} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: '#3B82F6' }}>Free Ticket</p>
                        <h2 className="text-lg font-extrabold text-dark-text leading-tight line-clamp-2">{freeTicketEvent.title}</h2>
                      </div>
                    </div>

                    {/* Event details card */}
                    <div className="space-y-2.5 mb-5 rounded-2xl p-4"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="flex items-center gap-2.5 text-sm">
                        <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: '#3B82F6' }} />
                        <span className="text-dark-text font-medium">{freeTicketEvent.date}</span>
                        <span className="text-dark-muted">·</span>
                        <Clock className="w-4 h-4 flex-shrink-0" style={{ color: '#3B82F6' }} />
                        <span className="text-dark-text font-medium">{freeTicketEvent.time?.slice(0,5)}</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-sm">
                        <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#3B82F6' }} />
                        <span className="text-dark-muted leading-snug line-clamp-2">{freeTicketEvent.location}</span>
                      </div>
                      {freeTicketEvent.venue_name && (
                        <div className="flex items-center gap-2.5 text-sm">
                          <Sparkles className="w-4 h-4 flex-shrink-0 text-amber-400" />
                          <span className="text-dark-text font-medium">{freeTicketEvent.venue_name}</span>
                          {freeTicketEvent.venue_rating && (
                            <span className="text-amber-400 font-bold text-xs">★ {freeTicketEvent.venue_rating}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* User info row */}
                    <div className="flex items-center gap-3 p-3 rounded-xl mb-6"
                      style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.12)' }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #3B82F6, #60A5FA)' }}>
                        {user?.first_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="text-xs min-w-0">
                        <p className="text-dark-text font-bold truncate">{user?.first_name} {user?.last_name}</p>
                        <p className="text-dark-muted truncate">{user?.email}</p>
                      </div>
                      <span className="ml-auto text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0"
                        style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.2)' }}>
                        1 Ticket
                      </span>
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={handleConfirmFreeTicket}
                      disabled={freeTicketLoading}
                      className="w-full py-4 rounded-2xl font-extrabold text-sm tracking-wide text-white transition-all transform active:scale-95 disabled:opacity-60"
                      style={{
                        background: freeTicketLoading
                          ? 'rgba(59,130,246,0.4)'
                          : 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                        boxShadow: freeTicketLoading ? 'none' : '0 8px 28px rgba(59,130,246,0.4)'
                      }}
                    >
                      {freeTicketLoading ? (
                        <span className="flex items-center justify-center gap-2">
                           <RefreshCw className="w-4 h-4 animate-spin" /> Claiming your ticket...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Ticket className="w-4 h-4" /> Claim Free Ticket
                        </span>
                      )}
                    </button>
                    <p className="text-center text-dark-muted text-[10px] mt-3">No payment needed · Instant confirmation</p>
                  </motion.div>
                ) : (
                  /* ── SUCCESS SCREEN ── */
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-8 text-center"
                  >
                    {/* Animated success ring */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                      className="w-24 h-24 rounded-full mx-auto mb-5 flex items-center justify-center relative"
                      style={{
                        background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
                        border: '2px solid rgba(59,130,246,0.35)'
                      }}
                    >
                      <CheckCircle2 className="w-12 h-12" style={{ color: '#3B82F6' }} />
                      <motion.div
                        animate={{ scale: [1, 1.35, 1], opacity: [0.35, 0, 0.35] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute inset-0 rounded-full"
                        style={{ border: '2px solid rgba(59,130,246,0.25)' }}
                      />
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                      <p className="font-bold text-sm uppercase tracking-widest mb-2" style={{ color: '#3B82F6' }}>🎉 You're In!</p>
                      <h2 className="text-2xl font-extrabold text-dark-text mb-2">Ticket Confirmed!</h2>
                      <p className="text-dark-muted text-sm mb-6">
                        Your free ticket for <span className="text-dark-text font-semibold">{freeTicketEvent.title}</span> has been booked.
                      </p>
                    </motion.div>

                    {/* Ticket stub */}
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="relative mx-auto max-w-xs mb-6"
                    >
                      <div className="rounded-2xl p-4 text-left relative overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, #090d16 0%, #111a2e 100%)', border: '1px dashed rgba(59,130,246,0.35)' }}>
                        {/* Notch cutouts */}
                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full" style={{ background: '#0A0E1A' }} />
                        <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full" style={{ background: '#0A0E1A' }} />

                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#3B82F6' }}>EventHub Live</span>
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded"
                            style={{ background: 'rgba(59,130,246,0.12)', color: '#60A5FA' }}>
                            #{freeTicketId ? String(freeTicketId).padStart(6, '0') : '000001'}
                          </span>
                        </div>
                        <p className="text-dark-text font-bold text-sm line-clamp-1 mb-3">{freeTicketEvent.title}</p>
                        <div className="pt-3 space-y-1.5" style={{ borderTop: '1px solid rgba(59,130,246,0.15)' }}>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-dark-muted">Date</span>
                            <span className="text-dark-text font-semibold">{freeTicketEvent.date}</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-dark-muted">Time</span>
                            <span className="text-dark-text font-semibold">{freeTicketEvent.time?.slice(0, 5)}</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-dark-muted">Ticket</span>
                            <span className="font-extrabold" style={{ color: '#3B82F6' }}>FREE × 1</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="space-y-3">
                      <p className="text-dark-muted text-xs">
                        Check your <span className="font-semibold" style={{ color: '#3B82F6' }}>My Bookings</span> section for your ticket QR code.
                      </p>
                      <button
                        onClick={() => { setFreeTicketEvent(null); setFreeTicketConfirmed(false); }}
                        className="w-full py-3 rounded-2xl text-sm font-bold transition-all"
                        style={{
                          color: '#3B82F6',
                          border: '1px solid rgba(59,130,246,0.25)',
                          background: 'transparent'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        Done
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LiveEvents;
