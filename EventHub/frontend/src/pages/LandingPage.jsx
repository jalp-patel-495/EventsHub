import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, useScroll, useTransform } from 'framer-motion';
import { User, Calendar, MapPin, Sparkles, ArrowRight } from 'lucide-react';
import About from './About';
import ThreeDEventBackground from '../components/ThreeDEventBackground';
import ThreeDPageScrollTicket from '../components/ThreeDPageScrollTicket';

const LandingPage = () => {
  const { isAuthenticated, user } = useAuth();

  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [0, 1]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [0.95, 1]);
  const heroY = useTransform(scrollYProgress, [0, 0.15], [40, 0]);

  if (isAuthenticated && user) {
    const dashboardPath = user.role === 'admin' ? '/admin-dashboard' : user.role === 'organizer' ? '/organizer/events' : user.role === 'plot_owner' ? '/venues/manage' : '/bookings';
    return <Navigate to={dashboardPath} replace />;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  const cardVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: 'easeOut' } }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center overflow-hidden">
      <ThreeDEventBackground interactive={false} />
      <ThreeDPageScrollTicket />
      {/* Hero Section */}
      <motion.section 
        className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
      >
        {/* Left Column: Hero Text */}
        <div className="lg:col-span-7 text-left flex flex-col items-start justify-center">
          <motion.div 
            variants={itemVariants}
            className="inline-flex items-center space-x-2 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-6 animate-pulse"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered Event Booking & Management</span>
          </motion.div>

          <motion.h1 
            variants={itemVariants}
            className="text-4xl sm:text-6xl font-black tracking-tight leading-none font-sans max-w-4xl text-left"
          >
            Discover & Host Remarkable Events in{' '}
            <span className="text-gradient-emerald">Ahmedabad</span>
          </motion.h1>

          <motion.p 
            variants={itemVariants}
            className="mt-6 text-base sm:text-xl text-dark-muted max-w-2xl font-light leading-relaxed text-left"
          >
            The ultimate digital platform connecting event enthusiasts, creative organizers, and premium venue owners across Ahmedabad.
          </motion.p>

          <motion.div 
            variants={itemVariants}
            className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            {isAuthenticated ? (
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Link
                  to={user?.role === 'admin' ? '/admin-dashboard' : user?.role === 'organizer' ? '/organizer/events' : user?.role === 'plot_owner' ? '/venues/manage' : '/bookings'}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-brand-primary to-rose-600 text-white font-medium px-8 py-3.5 rounded-xl hover:from-brand-primary hover:to-rose-700 shadow-lg shadow-brand-primary/20 transition-all transform hover:-translate-y-0.5"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/explore"
                  className="w-full sm:w-auto flex items-center justify-center border border-white/10 hover:border-brand-primary/20 text-dark-text bg-white/5 hover:bg-white/10 font-medium px-8 py-3.5 rounded-xl transition-all"
                >
                  Explore Events
                </Link>
              </div>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-brand-primary to-rose-600 text-white font-medium px-8 py-3.5 rounded-xl hover:from-brand-primary hover:to-rose-700 shadow-lg shadow-brand-primary/20 transition-all transform hover:-translate-y-0.5"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/explore"
                  className="w-full sm:w-auto flex items-center justify-center border border-white/10 hover:border-brand-primary/20 text-dark-text bg-white/5 hover:bg-white/10 font-medium px-8 py-3.5 rounded-xl transition-all"
                >
                  Explore Events
                </Link>
              </>
            )}
          </motion.div>
        </div>

        {/* Right Column: Placeholder space for page-wide 3D Scroll Ticket */}
        <motion.div 
          className="lg:col-span-5 flex items-center justify-center w-full"
          variants={itemVariants}
        >
          <div className="w-full max-w-[400px] h-[400px] relative rounded-3xl overflow-visible">
            {/* Soft backdrop glow matching BookMyShow primary color */}
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/20 to-blue-500/20 blur-[60px] -z-10 rounded-full scale-75 animate-pulse" />
          </div>
        </motion.div>
      </motion.section>

      {/* Roles Grid Section */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">One Platform, Endless Possibilities</h2>
          <p className="text-dark-muted mt-2">Tailored experiences for every stakeholder</p>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          {/* Customer Role Card */}
          <motion.div 
            variants={cardVariants}
            className="glass-card glass-card-hover rounded-2xl p-8 flex flex-col space-y-6"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-dark-text">For Customers</h3>
              <p className="text-sm text-dark-muted mt-2 leading-relaxed">
                Discover local festivals, conferences, concerts, and workshops. Book tickets instantly with Razorpay and secure your entry passes.
              </p>
            </div>
            <div className="mt-auto pt-4 border-t border-white/5">
              <span className="text-xs font-semibold text-blue-400 flex items-center space-x-1 hover:text-blue-300 transition-colors">
                <span>Book Events</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </motion.div>

          {/* Organizer Role Card */}
          <motion.div 
            variants={cardVariants}
            className="glass-card glass-card-hover rounded-2xl p-8 flex flex-col space-y-6"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-dark-text">For Organizers</h3>
              <p className="text-sm text-dark-muted mt-2 leading-relaxed">
                Create and manage events effortlessly. Keep track of sales, verify attendee tickets with QR codes, and analyze event performance.
              </p>
            </div>
            <div className="mt-auto pt-4 border-t border-white/5">
              <span className="text-xs font-semibold text-brand-primary flex items-center space-x-1 hover:text-brand-primary/80 transition-colors">
                <span>List Events</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </motion.div>

          {/* Plot Owner Role Card */}
          <motion.div 
            variants={cardVariants}
            className="glass-card glass-card-hover rounded-2xl p-8 flex flex-col space-y-6"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-dark-text">For Venue Owners</h3>
              <p className="text-sm text-dark-muted mt-2 leading-relaxed">
                Register your event plots, halls, or lawns. Rent them out to event planners in Ahmedabad and secure high utilization rates.
              </p>
            </div>
            <div className="mt-auto pt-4 border-t border-white/5">
              <span className="text-xs font-semibold text-purple-400 flex items-center space-x-1 hover:text-purple-300 transition-colors">
                <span>List Venues</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* About Section */}
      <section className="relative z-10 w-full border-t border-white/5">
        <About />
      </section>

      {/* Dedicated ticket spacing just above the footer */}
      <div className="relative z-10 w-full h-[460px] pointer-events-none mb-20" />
    </div>
  );
};

export default LandingPage;
