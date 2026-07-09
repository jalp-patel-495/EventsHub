import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import { MessageSquare, X, Send, Sparkles, RefreshCw, Calendar, ShieldCheck, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AIChatbotWidget = () => {
  const { isAuthenticated, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Hello! I am your **Ahmedabad Event Hub AI Assistant**. How can I help you today? Ask me about upcoming events, booking status, party plots, or cancel policies!",
      time: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Quick Action Chips
  const quickActions = [
    { label: "My Bookings Status", query: "What is the status of my bookings?", icon: <Calendar className="w-3.5 h-3.5" /> },
    { label: "Suggest Wedding Plots", query: "Suggest some good party plots for a wedding reception in Ahmedabad.", icon: <Sparkles className="w-3.5 h-3.5" /> },
    { label: "Refund & Cancellation", query: "What is the ticket cancellation and refund policy?", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  ];

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText.trim();
    if (!text) return;

    // Add User Message
    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: text,
      time: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await api.post('ai/chatbot/', { message: text });
      
      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: response.data.reply || "I'm having trouble retrieving a response. Please try again.",
        time: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error("Chatbot API failed:", err);
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: "Sorry, I couldn't reach the AI service right now. Please verify your connection or try again.",
        time: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Helper to render basic markdown bold/list formatting in replies
  const formatMarkdown = (text) => {
    if (!text) return '';
    // Bold
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Bullet points
    formatted = formatted.replace(/^\s*-\s+(.*?)$/gm, '<li class="ml-4 list-disc">$1</li>');
    // Numbered list
    formatted = formatted.replace(/^\s*\d+\.\s+(.*?)$/gm, '<li class="ml-4 list-decimal">$1</li>');
    // Line breaks
    formatted = formatted.replace(/\n/g, '<br />');
    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  // Chatbot is only available for logged-in accounts
  if (!isAuthenticated) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-full flex items-center justify-center text-white shadow-xl shadow-blue-950/30 transition-all border border-blue-400/20"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}>
              <MessageSquare className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Window Container */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute bottom-20 right-0 w-[420px] max-w-[calc(100vw-2rem)] h-[580px] bg-dark-card border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex items-center justify-between shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-blue-300 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide">Event Hub AI Assistant</h3>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-ping"></span>
                    <span className="text-[10px] text-blue-100 font-semibold tracking-wider uppercase">AI Live Active</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white p-1 bg-white/10 hover:bg-white/25 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Viewport */}
            <div className="flex-grow p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-md ${
                      msg.sender === 'user'
                        ? 'bg-brand-primary text-white rounded-tr-none'
                        : 'bg-white/5 text-dark-text border border-white/5 rounded-tl-none'
                    }`}
                  >
                    <div>{formatMarkdown(msg.text)}</div>
                    <span className="block text-[9px] text-dark-muted mt-1.5 text-right font-medium">
                      {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}

              {/* Typing Loader */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/5 text-dark-text border border-white/5 rounded-2xl rounded-tl-none px-4 py-3 shadow-md">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action suggestions */}
            {messages.length === 1 && (
              <div className="px-4 py-2 border-t border-white/5 bg-white/[0.01]">
                <p className="text-[10px] text-dark-muted uppercase font-bold tracking-wider mb-2">Recommended Queries:</p>
                <div className="flex flex-col gap-1.5">
                  {quickActions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(action.query)}
                      className="flex items-center space-x-2 text-left bg-white/5 hover:bg-white/10 text-xs text-dark-muted hover:text-dark-text px-3 py-2 rounded-xl border border-white/5 hover:border-blue-500/20 transition-all"
                    >
                      {action.icon}
                      <span className="truncate">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Footer */}
            <div className="p-4 border-t border-white/5 bg-dark-bg/60 backdrop-blur-md">
              <div className="flex items-center space-x-2 relative bg-white/5 border border-white/10 rounded-xl px-3 py-1 focus-within:border-blue-500/40 transition-all">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask Ahmedabad Event Hub AI..."
                  className="bg-transparent border-0 outline-none focus:ring-0 text-sm flex-grow text-dark-text placeholder-dark-muted py-2 h-10"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim() || isTyping}
                  className="bg-brand-primary hover:bg-blue-600 disabled:opacity-30 text-white w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIChatbotWidget;
