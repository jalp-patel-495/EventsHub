import React from 'react';
import { motion } from 'framer-motion';

const Bookings = () => (
  <div className="max-w-4xl mx-auto px-4 py-16 text-center">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel rounded-2xl p-8 shadow-glass">
      <h1 className="text-3xl font-bold mb-4">My Bookings</h1>
      <p className="text-dark-muted">No active bookings found. Explore the latest events in Ahmedabad to reserve your tickets!</p>
    </motion.div>
  </div>
);

export default Bookings;
