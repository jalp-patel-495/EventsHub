import React, { useState, useRef, useEffect } from 'react';
import api from '../api/api';

const AICateringChatbot = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I am your AI Catering assistant. Ask me anything about menu recommendations, plate estimators, or booking steps!"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const scrollChat = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollChat();
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const messageText = textToSend || input.strip ? input.trim() : input;
    if (!messageText) return;

    if (!textToSend) setInput('');
    setMessages(prev => [...prev, { role: 'user', content: messageText }]);
    setLoading(true);

    try {
      const res = await api.post('/api/ai/chatbot/', { message: messageText });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I ran into an issue connecting to the AI helper. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "What catering packages are available?",
    "Suggest a Punjabi wedding menu",
    "How do I add catering to a venue book?"
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 h-[450px] flex flex-col justify-between shadow-lg">
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold">
          👩‍🍳
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-white">Catering Assistant Chat</h4>
          <span className="text-[10px] text-brand-primary font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            Online & Ready
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-2 scrollbar-thin">
        {messages.map((msg, index) => (
          <div 
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-brand-primary text-white rounded-br-none' 
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none shadow-sm'
              }`}
            >
              {/* Parse simple markdown tags if any */}
              <div className="whitespace-pre-line font-medium">
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-none p-3 text-xs flex gap-1 items-center shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Prompts & Input */}
      <div>
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {quickPrompts.map((prompt, i) => (
              <button 
                key={i}
                onClick={() => handleSend(prompt)}
                className="text-[10px] bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-full transition-all text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about foods, budgets, or setup..."
            className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
          <button 
            onClick={() => handleSend()}
            className="bg-brand-primary hover:bg-rose-600 text-white p-2.5 rounded-xl transition-all shadow-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9-7-9-7-9 7 9 7z" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AICateringChatbot;
