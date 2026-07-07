import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-500/10 rounded-full filter blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-blue-500/10 rounded-full filter blur-3xl pointer-events-none animate-pulse delay-700" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="max-w-md w-full text-center relative z-10 glass-panel rounded-3xl p-8 sm:p-10 border-white/5 shadow-glass"
      >
        {/* Animated Icon Container */}
        <motion.div 
          initial={{ scale: 0.8, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="w-20 h-20 bg-gradient-to-tr from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-950/20"
        >
          <Compass className="w-10 h-10 animate-spin" style={{ animationDuration: '10s' }} />
        </motion.div>

        {/* 404 Text */}
        <h1 className="text-6xl sm:text-7xl font-black font-sans bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-500 tracking-tight mb-2">
          404
        </h1>
        <h2 className="text-xl sm:text-2xl font-bold text-dark-text mb-4">
          Lost in Ahmedabad?
        </h2>
        
        {/* Description */}
        <p className="text-dark-muted text-sm sm:text-base mb-8 leading-relaxed">
          It looks like the page you are looking for has been moved, deleted, or never existed in the first place. Let's get you back on track!
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-600 shadow-md shadow-emerald-950/20 transition-all transform hover:-translate-y-0.5"
          >
            <Home className="w-4 h-4" />
            <span>Go Home</span>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center space-x-2 border border-white/10 hover:border-white/20 text-dark-text bg-white/5 hover:bg-white/10 font-semibold text-sm px-6 py-3 rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
