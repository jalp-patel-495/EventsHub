import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
                path="/organizer/scanner" 
                element={
                  <ProtectedRoute allowedRoles={['organizer']}>
                    <TicketScanner />
                  </ProtectedRoute>
                } 
              />

              {/* Protected Routes (Plot Owner) */}
              <Route 
                path="/venues/manage" 
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
              {/* Catch-all 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Footer />
          </main>
          <AIChatbotWidget />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
