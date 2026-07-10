import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';

const Footer = () => {
  const location = useLocation();

  // Hide the footer on auth pages, ticket scanner, and admin dashboard
  const hideFooterRoutes = [
    '/organizer/scanner',
    '/admin-dashboard',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
  ];

  const shouldHide = hideFooterRoutes.includes(location.pathname) ||
                     location.pathname.startsWith('/admin');
  if (shouldHide) {
    return null;
  }

  return (
    <footer className="theme-footer relative z-20 backdrop-blur-md pt-16 pb-8 mt-auto w-full border-t border-slate-200 dark:border-slate-800/80 transition-all duration-300">
      <div className="w-full px-4 sm:px-6 lg:px-12">
        
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          
          {/* Column 1: Brand & Socials */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 font-sans">
                AHMEDABAD EVENT HUB
              </span>
            </Link>
            <p className="text-xs text-dark-muted leading-relaxed">
              Discover, host, and experience the best events, concert nights, and party plots across Ahmedabad. Powered by AI catering and smart ticketing verification.
            </p>
            {/* Social Icons with hover micro-animations */}
            <div className="flex items-center space-x-4 pt-2">
              <a href="#" className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-rose-500 hover:text-white rounded-xl transition-all duration-300 text-dark-muted hover:-translate-y-1 inline-flex items-center justify-center" aria-label="Instagram">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
              <a href="#" className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-blue-600 hover:text-white rounded-xl transition-all duration-300 text-dark-muted hover:-translate-y-1 inline-flex items-center justify-center" aria-label="Facebook">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a href="#" className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-900 dark:hover:bg-white dark:hover:text-black hover:text-white rounded-xl transition-all duration-300 text-dark-muted hover:-translate-y-1 inline-flex items-center justify-center" aria-label="Twitter">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </a>
              <a href="mailto:support@eventhub.com" className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-emerald-500 hover:text-white rounded-xl transition-all duration-300 text-dark-muted hover:-translate-y-1 inline-flex items-center justify-center" aria-label="Email">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Discover Events */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-dark-text uppercase tracking-wider">
              Discover Events
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/explore" className="text-dark-muted hover:text-brand-primary transition-colors flex items-center gap-1">
                  Browse Events
                </Link>
              </li>
              <li>
                <Link to="/venues" className="text-dark-muted hover:text-brand-primary transition-colors flex items-center gap-1">
                  Book Venues & Plots
                </Link>
              </li>
              <li>
                <Link to="/catering" className="text-dark-muted hover:text-brand-primary transition-colors flex items-center gap-1">
                  AI Catering Services
                </Link>
              </li>
              <li>
                <Link to="/live-feed" className="text-dark-muted hover:text-brand-primary transition-colors flex items-center gap-1">
                  Live Event Feeds
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: For Partners */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-dark-text uppercase tracking-wider">
              For Partners
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/login" className="text-dark-muted hover:text-brand-primary transition-colors">
                  List Your Venue
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-dark-muted hover:text-brand-primary transition-colors">
                  Host a Ticketed Event
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-dark-muted hover:text-brand-primary transition-colors">
                  QR Ticket Scanner
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-dark-muted hover:text-brand-primary transition-colors">
                  About Event Hub
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact Hub */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-dark-text uppercase tracking-wider">
              Contact Us
            </h4>
            <ul className="space-y-3 text-xs text-dark-muted">
              <li className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-brand-primary flex-shrink-0 mt-0.5" />
                <span>S.G. Highway, Ahmedabad, Gujarat, India</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-brand-primary flex-shrink-0" />
                <span>+91 79 4001 0203</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-brand-primary flex-shrink-0" />
                <a href="mailto:ahmedabadeventhub@gmail.com" className="hover:text-brand-primary transition-colors">
                  ahmedabadeventhub@gmail.com
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Separator */}
        <div className="border-t border-slate-200 dark:border-slate-800/60 my-6" />

        {/* Bottom Bar: Copyright & Legal */}
        <div className="flex flex-col md:flex-row items-center justify-between text-xs text-dark-muted space-y-4 md:space-y-0">
          <div>
            &copy; {new Date().getFullYear()} Ahmedabad Event Hub. All rights reserved.
          </div>
          <div className="flex items-center space-x-6">
            <a href="#" className="hover:text-brand-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-brand-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-brand-primary transition-colors">Cookie Settings</a>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
