import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, useScroll, useTransform } from 'framer-motion';
import { User, Calendar, MapPin, Sparkles, ArrowRight, Music, Code, Rocket, Briefcase, Utensils, Dumbbell, GraduationCap, Building2, Gamepad2, Palette, Handshake, Heart } from 'lucide-react';
import About from './About';
import ThreeDEventBackground from '../components/ThreeDEventBackground';
import ThreeDPageScrollTicket from '../components/ThreeDPageScrollTicket';

const categoriesData = [
  { name: 'Music', icon: Music, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { name: 'Tech', icon: Code, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { name: 'Startup', icon: Rocket, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { name: 'Business', icon: Briefcase, color: 'text-teal-400', bg: 'bg-teal-500/10' },
  { name: 'Food', icon: Utensils, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  { name: 'Sports', icon: Dumbbell, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  { name: 'Education', icon: GraduationCap, color: 'text-sky-400', bg: 'bg-sky-500/10' },
  { name: 'Cultural', icon: Building2, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { name: 'Gaming', icon: Gamepad2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { name: 'Art', icon: Palette, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { name: 'Workshop', icon: Handshake, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  { name: 'Charity', icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/10' }
];

const LandingPage = () => {
  const { isAuthenticated, user } = useAuth();

  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.20], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.20], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 0.20], [0, -40]);

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
    <div className="relative min-h-screen flex flex-col items-center overflow-hidden z-10">
      <ThreeDEventBackground />
      {/* Hero Section */}
      <motion.section 
        className="relative z-10 w-full max-w-none px-4 sm:px-6 lg:px-12 pt-20 pb-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
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

        {/* Right Column: Embedded 3D Ticket */}
        <motion.div 
          className="lg:col-span-5 flex items-center justify-center w-full"
          variants={itemVariants}
        >
          <div className="w-full max-w-[400px] h-[400px] relative rounded-3xl overflow-visible">
            {/* Soft backdrop glow matching BookMyShow primary color */}
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/20 to-blue-500/20 blur-[60px] -z-10 rounded-full scale-75 animate-pulse" />
            <ThreeDPageScrollTicket />
          </div>
        </motion.div>
      </motion.section>

      {/* Roles Grid Section */}
      <section className="relative z-10 w-full max-w-none px-4 sm:px-6 lg:px-12 py-16">
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
          </motion.div>
        </motion.div>
      </section>

      {/* About Section - Tailored Portal */}
      <section className="relative z-10 w-full border-t border-white/5">
        <About showTabsOnly={true} />
      </section>

      {/* Featured Categories Section */}
      <section className="relative z-10 w-full max-w-none px-4 sm:px-6 lg:px-12 py-16 border-t border-white/5">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs uppercase font-extrabold tracking-widest text-cyan-400">
            Featured Categories
          </span>
          <h2 className="text-3xl sm:text-5xl font-black mt-2 text-dark-text tracking-tight leading-none font-sans">
            Every Ahmedabad moment, curated by AI
          </h2>
          <p className="text-dark-muted mt-4 text-sm sm:text-base font-light max-w-2xl mx-auto leading-relaxed">
            From campus hackathons to riverfront concerts, discover categories that match your mood, location, budget, and social circle.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
          {categoriesData.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <Link
                key={idx}
                to="/explore"
                className="glass-card glass-card-hover rounded-2xl p-6 flex flex-col items-start gap-4 transition-all duration-300 relative group overflow-hidden border border-white/5"
              >
                {/* subtle hover background glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className={`p-3 rounded-xl ${cat.bg} ${cat.color} flex items-center justify-center border border-white/5 transition-transform group-hover:scale-110 duration-300`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-lg font-bold text-dark-text group-hover:text-cyan-400 transition-colors">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* About Section - Stats & Vision */}
      <section className="relative z-10 w-full border-t border-white/5">
        <About showStatsAndVisionOnly={true} />
      </section>
    </div>
  );
};

export default LandingPage;
