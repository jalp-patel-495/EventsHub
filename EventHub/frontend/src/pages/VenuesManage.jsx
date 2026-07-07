import React from 'react';
import { motion } from 'framer-motion';

const VenuesManage = () => (
  <div className="max-w-4xl mx-auto px-4 py-16 text-center">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel rounded-2xl p-8 shadow-glass">
      <h1 className="text-3xl font-bold mb-4 text-purple-400">My Venues</h1>
      <p className="text-dark-muted">No plot properties listed. Register your lawngrounds or convention centers to start receiving bookings.</p>
    </motion.div>
  </div>
);

export default VenuesManage;
