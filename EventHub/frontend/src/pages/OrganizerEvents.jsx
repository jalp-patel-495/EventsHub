import React from 'react';
import { motion } from 'framer-motion';

const OrganizerEvents = () => (
  <div className="max-w-4xl mx-auto px-4 py-16 text-center">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel rounded-2xl p-8 shadow-glass">
      <h1 className="text-3xl font-bold mb-4 text-emerald-400">My Events</h1>
      <p className="text-dark-muted">No events listed yet. Tap the button to schedule and host a new event in Ahmedabad.</p>
    </motion.div>
  </div>
);

export default OrganizerEvents;
