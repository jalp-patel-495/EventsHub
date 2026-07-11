import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { User, Phone, Mail, Calendar, Upload, Save, CheckCircle2, Shield, MessageSquare, CornerDownRight } from 'lucide-react';
import api, { BACKEND_URL } from '../api/api';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  
  // Local state
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Support/Complaints state
  const [complaints, setComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const res = await api.get('events/contact/my-complaints/');
        setComplaints(res.data.results || res.data);
      } catch (err) {
        console.error("Failed to load complaints:", err);
      } finally {
        setLoadingComplaints(false);
      }
    };
    if (user) {
      fetchComplaints();
    }
  }, [user]);
  
  const fileInputRef = useRef(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setErrorMsg('Avatar image must be under 3MB.');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setSuccessMsg('');
    setErrorMsg('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    const nameRegex = /^[A-Za-z\s'-]+$/;
    if (!firstName.trim() || firstName.trim().length < 2) {
      setErrorMsg('First name must be at least 2 characters long.');
      setLoading(false);
      return;
    }
    if (!nameRegex.test(firstName.trim())) {
      setErrorMsg('First name must only contain alphabetical characters.');
      setLoading(false);
      return;
    }
    if (!lastName.trim() || lastName.trim().length < 2) {
      setErrorMsg('Last name must be at least 2 characters long.');
      setLoading(false);
      return;
    }
    if (!nameRegex.test(lastName.trim())) {
      setErrorMsg('Last name must only contain alphabetical characters.');
      setLoading(false);
      return;
    }
    if (phone && !/^\d{10}$/.test(phone)) {
      setErrorMsg('Phone number must be exactly 10 digits.');
      setLoading(false);
      return;
    }

    try {
      let data;
      if (avatarFile) {
        data = new FormData();
        data.append('first_name', firstName.trim());
        data.append('last_name', lastName.trim());
        data.append('phone', phone);
        data.append('avatar', avatarFile);
      } else {
        data = {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone,
        };
      }

      await updateProfile(data);
      setSuccessMsg('Profile updated successfully!');
      setAvatarFile(null);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Role greetings helper
  const renderRoleGreeting = () => {
    switch (user?.role) {
      case 'organizer':
        return (
          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 mt-6">
            <h4 className="text-sm font-semibold text-emerald-400">Organizer Dashboard Quick Actions</h4>
            <p className="text-xs text-dark-muted mt-1 leading-relaxed">
              As an Organizer, you have access to event creation utilities. Tap "My Events" in the navigation bar to start hosting.
            </p>
          </div>
        );
      case 'plot_owner':
        return (
          <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-4 mt-6">
            <h4 className="text-sm font-semibold text-purple-400">Venue Owner Dashboard Quick Actions</h4>
            <p className="text-xs text-dark-muted mt-1 leading-relaxed">
              As a Plot Owner, you can list venue spaces. Open "My Venues" in the header to register new rental grounds.
            </p>
          </div>
        );
      case 'admin':
        return (
          <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 mt-6">
            <h4 className="text-sm font-semibold text-red-400">Administrator Notice</h4>
            <p className="text-xs text-dark-muted mt-1 leading-relaxed">
              You are logged in with admin privileges. Manage users, databases, and platform configurations via the Admin Portal.
            </p>
          </div>
        );
      default: // customer
        return (
          <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 mt-6">
            <h4 className="text-sm font-semibold text-blue-400">Customer Booking Center</h4>
            <p className="text-xs text-dark-muted mt-1 leading-relaxed">
              Explore ongoing events in Ahmedabad on the home screen. View and manage booked tickets under "My Bookings".
            </p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
      >
        {/* Left Card: Avatar & Summary */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col items-center text-center h-fit">
          <div className="relative group cursor-pointer" onClick={triggerFileInput}>
            {avatarPreview || user?.avatar ? (
              <img
                src={avatarPreview || (user?.avatar?.startsWith('http') ? user.avatar : `${BACKEND_URL}${user?.avatar}`)}
                alt="Avatar"
                className="w-32 h-32 rounded-full object-cover border-2 border-white/10 group-hover:opacity-75 transition-opacity"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-emerald-500/10 text-emerald-400 border-2 border-dashed border-emerald-500/30 flex flex-col items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                <User className="w-10 h-10" />
                <span className="text-[10px] font-semibold mt-1 uppercase">Upload Image</span>
              </div>
            )}
            <div className="absolute bottom-0 right-0 p-1.5 bg-brand-primary text-white rounded-full shadow-md">
              <Upload className="w-3.5 h-3.5" />
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <h3 className="text-xl font-bold text-dark-text mt-4">{user?.first_name} {user?.last_name}</h3>
          <span className="mt-1 px-3 py-1 text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/10">
            {user?.role}
          </span>

          <div className="w-full border-t border-white/5 my-6"></div>

          <div className="w-full space-y-4 text-sm text-left">
            <div className="flex items-center space-x-2.5 text-dark-muted">
              <Mail className="w-4 h-4 text-brand-primary" />
              <span className="truncate">{user?.email}</span>
            </div>
            <div className="flex items-center space-x-2.5 text-dark-muted">
              <Calendar className="w-4 h-4 text-brand-primary" />
              <span>Joined {formatDate(user?.date_joined)}</span>
            </div>
            <div className="flex items-center space-x-2.5 text-dark-muted">
              <Shield className="w-4 h-4 text-brand-primary" />
              <span>Status: Verified</span>
            </div>
          </div>
          
          {renderRoleGreeting()}
        </div>

        {/* Right Card: Profile Form */}
        <div className="md:col-span-2 glass-panel rounded-2xl p-8">
          <h2 className="text-2xl font-bold tracking-tight text-dark-text mb-6">Profile Settings</h2>

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-start space-x-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-sm"
            >
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-start space-x-2 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm"
            >
              <User className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">
                  First Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dark-muted">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                    required
                  />
                </div>
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">
                  Last Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dark-muted">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dark-muted">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Email (Disabled) */}
              <div>
                <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">
                  Email Address (Not Editable)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dark-muted">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm opacity-50 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Save Buttons */}
            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium py-2.5 px-6 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all flex items-center space-x-2 shadow-md shadow-emerald-950/20 disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>

      {/* Support Queries & Complaints Section */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel rounded-2xl p-8 mt-8 border-white/5"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-dark-text">Support & Complaints</h2>
            <p className="text-xs text-dark-muted mt-0.5">Track your submitted queries and official administrative responses</p>
          </div>
        </div>

        {loadingComplaints ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <span className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
            <span className="text-sm text-dark-muted font-medium animate-pulse">Loading inquiries...</span>
          </div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
            <MessageSquare className="w-10 h-10 text-dark-muted mx-auto mb-3 opacity-60" />
            <h4 className="text-sm font-bold text-dark-text">No active support queries</h4>
            <p className="text-xs text-dark-muted mt-1 max-w-sm mx-auto leading-relaxed">
              If you have any issues or questions about events, venues, or payments, submit a message through our <Link to="/contact" className="text-emerald-400 hover:underline">Contact Support</Link> page.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map((complaint) => (
              <div 
                key={complaint.id} 
                className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.03] transition-all space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-emerald-400 tracking-wide uppercase px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/10">
                      {complaint.subject || 'General Inquiry'}
                    </span>
                    <span className="text-[10px] text-dark-muted ml-3 font-medium">
                      Submitted on {formatDate(complaint.created_at)}
                    </span>
                  </div>
                  <div>
                    {complaint.reply ? (
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/15">
                        Replied
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/15 animate-pulse">
                        Pending Reply
                      </span>
                    )}
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-dark-muted uppercase tracking-wider">Your Message</p>
                  <p className="text-sm text-dark-text bg-white/[0.01] border border-white/[0.02] p-3 rounded-xl leading-relaxed whitespace-pre-line">
                    {complaint.message}
                  </p>
                </div>

                {/* Admin Reply */}
                {complaint.reply && (
                  <div className="pl-4 sm:pl-6 border-l-2 border-emerald-500/30 space-y-2 mt-3 bg-emerald-500/[0.01] p-3.5 rounded-r-xl">
                    <div className="flex items-center space-x-2 text-emerald-400">
                      <CornerDownRight className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold uppercase tracking-wider">Official Response</span>
                      <span className="text-[10px] text-dark-muted font-medium">
                        • {formatDate(complaint.replied_at)}
                      </span>
                    </div>
                    <p className="text-sm text-emerald-300 leading-relaxed whitespace-pre-line">
                      {complaint.reply}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Profile;
