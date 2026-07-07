import React, { useState } from 'react';
import api from '../api/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  Building,
  Compass,
  CheckCircle2,
  Clock
} from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'customer',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const roles = [
    { id: 'customer', label: 'Customer', placeholder: 'Event discovery, booking, or payment query...' },
    { id: 'organizer', label: 'Organizer', placeholder: 'Event hosting, scanning app, or payout query...' },
    { id: 'owners', label: 'Plot/Venue Owner', placeholder: 'Listing plots, rental calendar, or dashboard query...' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRoleChange = (roleId) => {
    setFormData(prev => ({
      ...prev,
      role: roleId
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setErrorMsg('Please enter your full name (at least 2 characters).');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!formData.message.trim() || formData.message.trim().length < 20) {
      setErrorMsg('Message must be at least 20 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('events/contact/', formData);
      setIsSubmitted(true);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'customer',
      subject: '',
      message: ''
    });
    setIsSubmitted(false);
  };

  const selectedRoleInfo = roles.find(r => r.id === formData.role);

  return (
    <div className="max-w-6xl mx-auto px-4 py-16 sm:py-24">
      {/* Page Header */}
      <div className="text-center mb-16">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl sm:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-500 mb-4 font-sans"
        >
          Let's Start a Conversation
        </motion.h1>
        <p className="text-dark-muted text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
          Need support? Want to partner up? Select your role and send us a message — our Ahmedabad team is ready to help.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Contact Info Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel rounded-2xl p-6 border-white/5 space-y-6">
            <h3 className="text-lg font-bold text-dark-text border-b border-dark-border pb-3">
              Direct Contact
            </h3>

            <div className="flex gap-4 items-start">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-dark-muted uppercase tracking-wider block">Email Support</span>
                <a href="mailto:ahmedabadeventhub@gmail.com" className="text-sm font-semibold text-dark-text hover:text-emerald-400 transition-colors">
                  ahmedabadeventhub@gmail.com
                </a>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-dark-muted uppercase tracking-wider block">Call Office</span>
                <a href="tel:+917567466735" className="text-sm font-semibold text-dark-text hover:text-blue-400 transition-colors">
                  +91 75674 66735
                </a>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-dark-muted uppercase tracking-wider block">Corporate HQ</span>
                <span className="text-sm font-semibold text-dark-text">
                  C.G. Road, Navrangpura,<br />Ahmedabad, Gujarat 380009
                </span>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 border-white/5 flex gap-4 items-start">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-bold text-dark-muted uppercase tracking-wider block">Response Time</span>
              <span className="text-sm font-semibold text-dark-text">
                Usually reply in &lt; 24 hours. Monday - Saturday (9 AM - 6 PM IST).
              </span>
            </div>
          </div>
        </div>

        {/* Contact Form Section */}
        <div className="lg:col-span-2">
          <div className="glass-panel rounded-3xl p-6 sm:p-10 border-white/5 shadow-glass relative overflow-hidden">
            <AnimatePresence mode="wait">
              {!isSubmitted ? (
                <motion.form
                  key="contact-form"
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Role Selector Tabs */}
                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-dark-muted block mb-3">
                      Select Your Role
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      {roles.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => handleRoleChange(r.id)}
                          className={`px-4 py-3 rounded-xl text-xs font-bold transition-all duration-300 border flex-1 text-center ${formData.role === r.id
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-transparent shadow-lg shadow-emerald-500/10'
                              : 'glass-card border-white/5 text-dark-muted hover:text-dark-text hover:border-white/10'
                            }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                    <span className="text-xs text-dark-muted mt-2 block italic">
                      {selectedRoleInfo.placeholder}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="text-xs font-bold text-dark-muted uppercase tracking-wider block mb-2">
                        Full Name <span className="text-emerald-400">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Jalp Patel"
                        className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="text-xs font-bold text-dark-muted uppercase tracking-wider block mb-2">
                        Email Address <span className="text-emerald-400">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="jalppatel1580@gmail.com"
                        className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="text-xs font-bold text-dark-muted uppercase tracking-wider block mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder={formData.role === 'customer' ? 'Help with ticket refund' : formData.role === 'organizer' ? 'Integrating custom payments' : 'Updating venue location coordinates'}
                      className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="text-xs font-bold text-dark-muted uppercase tracking-wider block mb-2">
                      Your Message <span className="text-emerald-400">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Type your message here..."
                      className="w-full px-4 py-3 rounded-xl glass-input text-sm resize-none"
                    />
                  </div>

                  {errorMsg && (
                    <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm">
                      <span className="flex-shrink-0">⚠</span>
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/10 hover:opacity-95 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-55 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Sending Message...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Secure Message
                      </>
                    )}
                  </button>
                </motion.form>
              ) : (
                <motion.div
                  key="success-message"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center py-10 space-y-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
                    className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400"
                  >
                    <CheckCircle2 className="w-10 h-10" />
                  </motion.div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-dark-text">Message Sent Successfully!</h3>
                    <p className="text-dark-muted text-sm max-w-md mx-auto leading-relaxed">
                      Thank you, <strong className="text-dark-text">{formData.name}</strong>. Our support team has logged your inquiry regarding <span className="text-emerald-400 font-semibold">{roles.find(r => r.id === formData.role).label}</span> services. We will reply to <strong className="text-dark-text">{formData.email}</strong> shortly.
                    </p>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={resetForm}
                      className="px-6 py-2.5 rounded-xl font-bold text-xs glass-card hover:bg-white/5 text-dark-text transition-all duration-300"
                    >
                      Send Another Message
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
