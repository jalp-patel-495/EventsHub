import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AIChatbotWidget from './components/AIChatbotWidget';

// Pages
import LandingPage from './pages/LandingPage';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import CustomerDashboard from './pages/CustomerDashboard';
import OrganizerDashboard from './pages/OrganizerDashboard';
import TicketScanner from './pages/TicketScanner';
import PlotOwnerDashboard from './pages/PlotOwnerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import EventExplore from './pages/EventExplore';
import LiveEvents from './pages/LiveEvents';
import NotFound from './pages/NotFound';
import PaySimulate from './pages/PaySimulate';
import About from './pages/About';
import CateringExplore from './pages/CateringExplore';
import CateringDetail from './pages/CateringDetail';
import VenueExplore from './pages/VenueExplore';


// Testimonials shown only above footer on home page
const TestimonialsAboveFooter = () => {
  const location = useLocation();
  if (location.pathname !== '/') return null;
  const testimonials = [
    {
      stars: 5,
      review: '"EventHub completely transformed how I manage my events. The AI description generator alone saved me 3 hours per event. Ticket sales increased 40% after using the recommendation engine."',
      name: 'Jalp Patel',
      role: 'Event Organizer · Rangilo Events',
      avatar: 'PM',
      color: 'from-rose-500 to-pink-600'
    },
    {
      stars: 5,
      review: '"The AI chatbot found me a niche photography workshop I never would have discovered. The QR ticket and PDF invoice were professional and hassle-free. Best event platform in Ahmedabad."',
      name: 'Sumit Gohel',
      role: 'Tech Enthusiast · IIM Ahmedabad',
      avatar: 'AS',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      stars: 5,
      review: '"As someone who attends 10+ events a month, the personalized recommendations are uncannily accurate. The calendar integration and Google Maps links make it seamless from discovery to arrival."',
      name: 'Anirudh Chauhan',
      role: 'Community Manager · Startup Gujarat',
      avatar: 'KP',
      color: 'from-emerald-500 to-teal-600'
    }
  ];
  return (
    <section className="relative z-10 w-full max-w-none px-4 sm:px-6 lg:px-12 py-20 border-t border-white/5 bg-dark-bg">
      <div className="text-center mb-14">
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-dark-text font-sans">
          Loved in Ahmedabad
        </h2>
        <p className="text-dark-muted mt-3 text-sm sm:text-base">
          Organizers and attendees who trust EventHub
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {testimonials.map((t, idx) => (
          <div
            key={idx}
            className="glass-card rounded-2xl p-7 flex flex-col gap-5 border border-white/5"
          >
            <div className="flex gap-1">
              {Array.from({ length: t.stars }).map((_, i) => (
                <span key={i} className="text-yellow-400 text-lg">★</span>
              ))}
            </div>
            <p className="text-dark-muted text-sm leading-relaxed flex-1">{t.review}</p>
            <div className="flex items-center gap-3 pt-2 border-t border-white/5">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                {t.avatar}
              </div>
              <div>
                <div className="text-dark-text font-semibold text-sm">{t.name}</div>
                <div className="text-dark-muted text-xs">{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

function App() {

  return (
    <Router>
      <AuthProvider>
        <div className="flex flex-col min-h-screen bg-dark-bg text-dark-text relative theme-bg">
          <Navbar />
          <main className="flex-grow flex flex-col">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/explore" element={<EventExplore />} />
              <Route path="/live-feed" element={<LiveEvents />} />
              <Route path="/pay-simulate" element={<PaySimulate />} />
              <Route path="/catering" element={<CateringExplore />} />
              <Route path="/catering/:id" element={<CateringDetail />} />
              <Route path="/venues" element={<VenueExplore />} />

              {/* Protected Routes (General Authenticated) */}
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />

              {/* Protected Routes (Customer) */}
              <Route 
                path="/bookings" 
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Protected Routes (Organizer) */}
              <Route 
                path="/organizer/events" 
                element={
                  <ProtectedRoute allowedRoles={['organizer']}>
                    <OrganizerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/organizer/sales" 
                element={
                  <ProtectedRoute allowedRoles={['organizer']}>
                    <OrganizerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/organizer/rentals" 
                element={
                  <ProtectedRoute allowedRoles={['organizer']}>
                    <OrganizerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/organizer/reviews" 
                element={
                  <ProtectedRoute allowedRoles={['organizer']}>
                    <OrganizerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/organizer/analytics" 
                element={
                  <ProtectedRoute allowedRoles={['organizer']}>
                    <OrganizerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/organizer/scanner" 
                element={
                  <ProtectedRoute allowedRoles={['organizer']}>
                    <TicketScanner />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/organizer/refunds" 
                element={
                  <ProtectedRoute allowedRoles={['organizer']}>
                    <OrganizerDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Protected Routes (Plot Owner) */}
              <Route 
                path="/venues/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['plot_owner']}>
                    <PlotOwnerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/venues/manage" 
                element={
                  <ProtectedRoute allowedRoles={['plot_owner']}>
                    <PlotOwnerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/venues/services" 
                element={
                  <ProtectedRoute allowedRoles={['plot_owner']}>
                    <PlotOwnerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/venues/requests" 
                element={
                  <ProtectedRoute allowedRoles={['plot_owner']}>
                    <PlotOwnerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/venues/refunds" 
                element={
                  <ProtectedRoute allowedRoles={['plot_owner']}>
                    <PlotOwnerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/venues/reviews" 
                element={
                  <ProtectedRoute allowedRoles={['plot_owner']}>
                    <PlotOwnerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/venues/calendar" 
                element={
                  <ProtectedRoute allowedRoles={['plot_owner']}>
                    <PlotOwnerDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Protected Routes (Admin) */}
              <Route 
                path="/admin-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
               />
              <Route 
                path="/admin/overview" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/revenue" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/approvals" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/events" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/venues" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/users" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/finance" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/complaints" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/broadcast" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              {/* Catch-all 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            {/* Loved in Ahmedabad - above footer on home page */}
            <TestimonialsAboveFooter />
            <Footer />
          </main>
          <AIChatbotWidget />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
