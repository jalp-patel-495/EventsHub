import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../api/api';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Loader2, Sparkles, Building, Calendar, User } from 'lucide-react';

const VenueBookingChatModal = ({ booking, isOpen, onClose, currentUser, type }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Determine booking type (event ticket booking vs venue plot booking)
  const isEventBooking = type === 'event' || Boolean(booking?.event_details || booking?.event);
  const endpoint = isEventBooking 
    ? `events/bookings/${booking?.id}/messages/` 
    : `venues/bookings/${booking?.id}/messages/`;

  const isVenueOwner = currentUser?.id === booking?.venue_details?.owner || currentUser?.role === 'plot_owner';

  const fetchMessages = async () => {
    if (!booking || !booking.id) return;
    try {
      setLoading(true);
      const res = await api.get(endpoint);
      setMessages(res.data || []);
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && booking?.id) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 4000); // Auto refresh every 4s
      return () => clearInterval(interval);
    }
  }, [isOpen, booking?.id, endpoint]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const res = await api.post(endpoint, { message: textToSend });
      setMessages(prev => [...prev, res.data]);
    } catch (err) {
      console.error("Failed to send message:", err);
      alert(err.response?.data?.error || "Failed to send message.");
      setInputText(textToSend);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen || !booking) return null;

  // Determine Recipient Display Name
  let recipientName = "User";
  if (isEventBooking) {
    const isCustomer = currentUser?.id === booking?.user || currentUser?.id === booking?.user_details?.id || currentUser?.role === 'customer';
    const isOrganizer = currentUser?.id === booking?.event_details?.organizer || currentUser?.role === 'organizer';
    
    if (isCustomer) {
      const org = booking.event_details?.organizer_details;
      recipientName = org ? `${org.first_name || ''} ${org.last_name || ''}`.trim() || org.email : "Event Organizer";
    } else if (isOrganizer) {
      const cust = booking.user_details;
      recipientName = cust ? `${cust.first_name || ''} ${cust.last_name || ''}`.trim() || cust.email : "Customer";
    } else {
      const cust = booking.user_details;
      recipientName = cust ? `${cust.first_name || ''} ${cust.last_name || ''}`.trim() || cust.email : "Customer";
    }
  } else {
    // Venue Plot Booking
    if (isVenueOwner) {
      const booker = booking.organizer_details;
      recipientName = booker ? `${booker.first_name || ''} ${booker.last_name || ''}`.trim() || booker.email : "Booker";
    } else {
      recipientName = booking.venue_details ? `${booking.venue_details.name} (Venue Owner)` : "Venue Owner";
    }
  }

  const titleText = isEventBooking 
    ? (booking.event_details?.title || "Event Booking")
    : (booking.venue_details?.name || "Venue Plot Booking");

  const modalJSX = (
    <AnimatePresence>
      <div 
        onClick={onClose}
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-hidden"
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-[#0f172a] border border-slate-700/80 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col h-[580px] max-h-[85vh] my-auto"
        >
          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-[#1e293b] shrink-0">
            <div className="flex items-center space-x-3 flex-1 min-w-0 mr-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-base text-slate-100 flex items-center gap-2">
                  <span className="truncate">{titleText}</span>
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-400 font-bold px-2.5 py-0.5 rounded-full uppercase border border-emerald-500/30 shrink-0">
                    #{booking.id}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  Chatting with <strong className="text-slate-200">{recipientName}</strong>
                </p>
              </div>
            </div>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 rounded-xl transition-all flex items-center space-x-1 font-bold text-xs shrink-0 cursor-pointer"
              title="Close Chat Window"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-[#0b0f19] scrollbar-thin">
            {loading && messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400 space-x-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                <span className="text-xs font-semibold">Loading conversation...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400">
                <Sparkles className="w-8 h-8 text-blue-400 opacity-80 mb-2" />
                <p className="text-sm font-bold text-slate-200">No messages yet</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                  Start the conversation! Send a message below regarding entry details, timings, catering, or event queries.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const senderId = typeof msg.sender === 'object' ? msg.sender?.id : (msg.sender_details?.id || msg.sender);
                const isMe = Number(senderId) === Number(currentUser?.id);

                const senderName = msg.sender_details 
                  ? `${msg.sender_details.first_name || ''} ${msg.sender_details.last_name || ''}`.trim() || msg.sender_details.email 
                  : (isMe ? "You" : "User");

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center space-x-2 mb-1 px-1">
                      <span className={`text-[11px] font-bold ${isMe ? 'text-blue-400' : 'text-slate-300'}`}>
                        {senderName}
                      </span>
                      <span className="text-[9px] text-slate-500 font-medium">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div
                      className={`max-w-[82%] px-4 py-3 text-xs leading-relaxed shadow-lg font-medium ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none'
                          : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-2xl rounded-tl-none'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-[#1e293b] flex items-center space-x-3 shrink-0">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Write a message to ${recipientName}...`}
              className="flex-1 px-4 py-3 rounded-2xl text-xs bg-[#0b0f19] text-slate-100 placeholder:text-slate-500 border border-slate-700/80 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || sending}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-5 py-3 rounded-2xl font-bold text-xs flex items-center space-x-2 transition-all shadow-md shadow-blue-950/40 cursor-pointer shrink-0"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalJSX, document.body);
};

export default VenueBookingChatModal;
