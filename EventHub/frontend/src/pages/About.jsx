import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Ticket, 
  QrCode, 
  MapPin, 
  ShieldCheck, 
  BarChart3, 
  Building2, 
  CalendarRange, 
  Wallet, 
  Heart,
  Zap,
  Users,
  Compass,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const About = ({ showTabsOnly = false, showStatsAndVisionOnly = false }) => {
  const [activeTab, setActiveTab] = useState('customers');

  const tabs = [
    {
      id: 'customers',
      label: 'For Customers',
      icon: Ticket,
      gradient: 'from-blue-500 to-blue-600',
      tagline: 'Discover & Experience Seamless Bookings',
      features: [
        {
          title: 'Curated Local Events',
          description: 'Explore handpicked concerts, traditional garba nights, stand-up comedy, art exhibitions, and food festivals around Ahmedabad.',
          icon: Compass,
          color: 'text-blue-400'
        },
        {
          title: 'Instant Booking & QR Passes',
          description: 'Secure your seats in seconds. Receive a secure, encrypted QR code pass that can be scanned seamlessly at the venue gate.',
          icon: QrCode,
          color: 'text-blue-400'
        },
        {
          title: 'Secure Payments via Razorpay',
          description: 'Rest easy with a high-grade security backend. Complete transactions in a click using cards, UPI, or net banking.',
          icon: Wallet,
          color: 'text-blue-400'
        },
        {
          title: 'Live Updates & Notifications',
          description: 'Receive real-time push alerts and live feeds about event timing, schedule changes, and weather alerts.',
          icon: Zap,
          color: 'text-amber-400'
        }
      ]
    },
    {
      id: 'organizers',
      label: 'For Organizers',
      icon: CalendarRange,
      gradient: 'from-blue-400 to-indigo-500',
      tagline: 'End-to-End Dynamic Event Management',
      features: [
        {
          title: 'Dynamic Ticketing & Coupons',
          description: 'Set custom pricing tiers, early-bird slots, and discount coupon codes to boost your ticket sales campaign.',
          icon: Ticket,
          color: 'text-blue-400'
        },
        {
          title: 'Real-Time Sales Dashboard',
          description: 'Analyze charts, revenue flows, and attendee lists directly from our clean, premium dashboard.',
          icon: BarChart3,
          color: 'text-indigo-400'
        },
        {
          title: 'QR Code Verification App',
          description: 'Use our built-in scanner tool on the day of the event to check in attendees instantly and completely eliminate fraud.',
          icon: QrCode,
          color: 'text-purple-400'
        },
        {
          title: 'Direct Client Relations',
          description: 'Enjoy seamless messaging and direct announcement boards to keep your ticketholders engaged.',
          icon: Users,
          color: 'text-blue-400'
        }
      ]
    },
    {
      id: 'owners',
      label: 'For Venue Owners',
      icon: Building2,
      gradient: 'from-indigo-500 to-blue-600',
      tagline: 'Maximize Revenue from Plots & Lawns',
      features: [
        {
          title: 'Interactive Spatial Listing',
          description: 'Showcase banquet halls, open plots, and lawns in Ahmedabad with high-res galleries, capacities, and geolocations.',
          icon: Building2,
          color: 'text-purple-400'
        },
        {
          title: 'Smart Availability Calendars',
          description: 'Lock slots, adjust off-season prices, and list slots available for hire so organizers can query directly.',
          icon: CalendarRange,
          color: 'text-blue-400'
        },
        {
          title: 'Secure Contracting & Billing',
          description: 'Process security deposits, lease agreements, and rentals directly with transparent payout dashboards.',
          icon: ShieldCheck,
          color: 'text-blue-400'
        },
        {
          title: 'Increased Ahmedabad Footprint',
          description: 'Tap directly into Ahmedabad\'s premier organizer network. Rent your property for festivals, weddings, or corporate events.',
          icon: MapPin,
          color: 'text-blue-400'
        }
      ]
    }
  ];

  const currentTab = tabs.find(t => t.id === activeTab);

  const showAll = !showTabsOnly && !showStatsAndVisionOnly;

  return (
    <div className="w-full max-w-none px-4 sm:px-6 lg:px-12 py-8 sm:py-12">
      {(showAll || showTabsOnly) && (
        <>
          {/* Tabs list */}
          <div className="flex justify-center p-1 rounded-xl glass-panel max-w-lg mx-auto mb-16 border-white/5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-2 flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 relative ${
                    isSelected ? 'text-white' : 'text-dark-muted hover:text-dark-text'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="active-pill"
                      className={`absolute inset-0 rounded-lg bg-gradient-to-r ${tab.gradient} opacity-85 shadow-md`}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10 hidden sm:inline">{tab.label}</span>
                  <span className="relative z-10 sm:hidden">{tab.label.split(' ').pop()}</span>
                </button>
              );
            })}
          </div>

          {/* Tab content panel */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="glass-panel rounded-3xl p-6 sm:p-10 border-white/5 shadow-glass mb-16"
            >
              <div className="mb-8">
                <span className={`text-xs uppercase font-extrabold tracking-widest bg-clip-text text-transparent bg-gradient-to-r ${currentTab.gradient}`}>
                  Tailored Portal
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold mt-2 text-dark-text">
                  {currentTab.tagline}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentTab.features.map((feature, idx) => {
                  const FeatIcon = feature.icon;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.1 }}
                      className="glass-card glass-card-hover rounded-2xl p-6 flex gap-4 items-start"
                    >
                      <div className={`p-3 rounded-xl bg-dark-bg/60 border border-white/5 ${feature.color}`}>
                        <FeatIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-dark-text mb-1">{feature.title}</h3>
                        <p className="text-dark-muted text-sm leading-relaxed">{feature.description}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-10 pt-8 border-t border-dark-border flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-dark-muted text-sm">
                  Ready to explore {currentTab.label.toLowerCase()} dashboards?
                </p>
                <div className="flex gap-4">
                  <Link 
                    to="/register" 
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r ${currentTab.gradient} text-white shadow-lg shadow-emerald-500/10 hover:opacity-90 transition-all duration-300 flex items-center gap-1.5`}
                  >
                    Join as {activeTab === 'customers' ? 'Customer' : activeTab === 'organizers' ? 'Organizer' : 'Plot Owner'}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

              </div>
            </motion.div>
          </AnimatePresence>
        </>
      )}

      {(showAll || showStatsAndVisionOnly) && (
        <>
          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-16"
          >
            {[
              { number: '15k+', label: 'Happy Customers' },
              { number: '500+', label: 'Events Hosted' },
              { number: '80+', label: 'Premium Party Plots' },
              { number: '99.9%', label: 'Scan Verification Rate' }
            ].map((stat, idx) => (
              <div key={idx} className="glass-card rounded-2xl p-6 text-center border-white/5">
                <div className="text-2xl sm:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-500 mb-1">
                  {stat.number}
                </div>
                <div className="text-xs sm:text-sm text-dark-muted font-medium uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Mission statement */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-panel rounded-3xl p-8 sm:p-10 border-white/5 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full filter blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full filter blur-3xl pointer-events-none" />
            
            <Heart className="w-10 h-10 text-emerald-400 mx-auto mb-4 animate-pulse" />
            <h3 className="text-xl sm:text-2xl font-bold mb-4 text-dark-text">Our Vision for Ahmedabad</h3>
            <p className="text-dark-muted text-sm sm:text-base max-w-3xl mx-auto leading-relaxed">
              Ahmedabad is a city rich in cultural heritage, festivals, and entrepreneurship. Our mission is to digitize this vibrant culture. We want to remove ticketing queues, make stunning banquets accessible, and allow organizers to create with peace of mind. We build technology that connects the people of Ahmedabad to life's finest moments.
            </p>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default About;

