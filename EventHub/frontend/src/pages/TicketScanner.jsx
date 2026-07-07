import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Clipboard, CheckCircle, XCircle, Search, HelpCircle, Loader2, ArrowRight, UserCheck, RefreshCw, Camera, CameraOff, Calendar, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import { Html5Qrcode } from 'html5-qrcode';

const TicketScanner = () => {
  const { user } = useAuth();
  
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null); // { success: boolean, message: string, data?: any }
  const [ticketHashInput, setTicketHashInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [popupModal, setPopupModal] = useState(null); // { type: 'before' | 'after', title: string, message: string, eventDate?: string }
  const qrScannerRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Cleanup camera scanner on unmount
  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop().catch(err => console.error("Error stopping scanner on unmount:", err));
      }
    };
  }, []);

  const startCamera = async () => {
    setCameraError('');
    setCameraActive(true);
    
    // Allow React to render the #camera-reader element first
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode("camera-reader");
        qrScannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 220, height: 220 }
          },
          (decodedText) => {
            console.log("Scanned QR code:", decodedText);
            let code = decodedText.trim();
            if (code.startsWith("EVENTHUB:")) {
              const parts = code.split(":");
              if (parts[1]) {
                const matchedBooking = bookings.find(b => 
                  String(b.id) === parts[1] || 
                  `EH-${String(b.id).padStart(7, '0')}` === parts[1]
                );
                if (matchedBooking && matchedBooking.qr_code_hash) {
                  code = matchedBooking.qr_code_hash;
                }
              }
            }

            setTicketHashInput(code);
            handleVerifyTicket(code);
            stopCamera();
          },
          (errorMessage) => {
            // Ignore normal scanning logs
          }
        );
      } catch (err) {
        console.error("Failed to start camera scanner:", err);
        setCameraError("Could not access camera. Please check permissions.");
        setCameraActive(false);
      }
    }, 100);
  };

  const stopCamera = async () => {
    if (qrScannerRef.current) {
      try {
        await qrScannerRef.current.stop();
        qrScannerRef.current = null;
      } catch (err) {
        console.error("Failed to stop camera scanner:", err);
      }
    }
    setCameraActive(false);
  };

  const toggleCamera = () => {
    if (cameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eventsRes, bookingsRes] = await Promise.all([
        api.get(`events/listings/?organizer=${user.id}`),
        api.get('events/bookings/')
      ]);
      const fetchedEvents = eventsRes.data.results || eventsRes.data;
      setEvents(fetchedEvents);
      
      const confirmedBookings = bookingsRes.data.filter(b => b.status === 'confirmed');
      setBookings(confirmedBookings);

      if (fetchedEvents.length > 0) {
        setSelectedEventId(fetchedEvents[0].id.toString());
      }
    } catch (err) {
      console.error("Failed to fetch scanner data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTicket = async (hash) => {
    const finalHash = hash || ticketHashInput.trim();
    if (!finalHash) return;

    setScanning(true);
    setScanResult(null);
    try {
      const res = await api.post('events/bookings/scan-verify/', { qr_code_hash: finalHash });
      setScanResult({
        success: true,
        message: res.data.message || 'Ticket successfully checked in!',
        data: res.data
      });
      // Refresh local bookings list to reflect the checked-in state
      setBookings(prev => 
        prev.map(b => b.qr_code_hash === finalHash ? { ...b, is_checked_in: true } : b)
      );
      setTicketHashInput('');
    } catch (err) {
      console.error(err);
      const errData = err.response?.data;
      const errMsg = errData?.error || 'Failed to verify ticket. Invalid QR hash.';
      setScanResult({
        success: false,
        message: errMsg,
        data: errData
      });
      if (errData?.code === 'EVENT_BEFORE' || errData?.code === 'EVENT_AFTER') {
        setPopupModal({
          type: errData.code === 'EVENT_BEFORE' ? 'before' : 'after',
          title: errData.code === 'EVENT_BEFORE' ? 'Scan Attempt Blocked' : 'Ticket Expired',
          message: errMsg,
          eventDate: errData.event_date
        });
      }
    } finally {
      setScanning(false);
    }
  };

  const currentEvent = events.find(e => e.id.toString() === selectedEventId);
  const eventBookings = bookings.filter(b => b.event.toString() === selectedEventId);

  const filteredBookings = eventBookings.filter(b => {
    const name = `${b.user_details?.first_name} ${b.user_details?.last_name}`.toLowerCase();
    const email = (b.user_details?.email || '').toLowerCase();
    const hash = (b.qr_code_hash || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || email.includes(query) || hash.includes(query);
  });

  const checkedInCount = eventBookings.filter(b => b.is_checked_in).length;
  const totalTicketsBooked = eventBookings.reduce((sum, b) => sum + b.tickets_count, 0);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-dark-bg">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
          <p className="text-dark-muted font-medium">Initializing Ticket Scanner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hide html5-qrcode default UI components (buttons, icons, boxes, texts, borders) */}
      <style dangerouslySetInnerHTML={{__html: `
        #camera-reader img,
        #camera-reader svg,
        #camera-reader button,
        #camera-reader span,
        #camera-reader canvas,
        #camera-reader div:not([id="camera-reader"]) {
          display: none !important;
        }
        #camera-reader {
          border: none !important;
        }
      `}} />
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-dark-text flex items-center gap-2">
            <QrCode className="w-8 h-8 text-emerald-400" />
            <span>Gate Ticket Scanner</span>
          </h1>
          <p className="text-dark-muted mt-1">Verify event attendee passes, scan QR codes, and log entrances</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-xl border border-white/5"
        >
          <RefreshCw className="w-4 h-4 animate-spin-slow" />
          <span>Refresh Data</span>
        </button>
      </div>

      {events.length === 0 ? (
        <div className="glass-panel text-center py-16 rounded-3xl border-white/5">
          <QrCode className="w-16 h-16 text-dark-muted mx-auto mb-4" />
          <h3 className="text-lg font-bold text-dark-text mb-2">No Events Found</h3>
          <p className="text-dark-muted max-w-sm mx-auto">
            You must have active events listed and approved to access gate ticket scanning features.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Scanner Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Selector & Metrics */}
            <div className="glass-panel rounded-3xl p-6 border-white/5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-dark-muted uppercase tracking-wider mb-2">
                  Select Event for Gate Entry
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => {
                    setSelectedEventId(e.target.value);
                    setScanResult(null);
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-dark-text font-medium outline-none focus:border-emerald-500 transition-colors"
                >
                  {events.map((e) => (
                    <option key={e.id} value={e.id} className="bg-dark-card text-dark-text">
                      {e.title} ({e.date})
                    </option>
                  ))}
                </select>
              </div>

              {currentEvent && (
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                    <span className="text-[10px] font-semibold text-dark-muted uppercase">Bookings</span>
                    <p className="text-lg font-bold text-dark-text mt-0.5">{eventBookings.length}</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                    <span className="text-[10px] font-semibold text-dark-muted uppercase">Total Tickets</span>
                    <p className="text-lg font-bold text-emerald-400 mt-0.5">{totalTicketsBooked}</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                    <span className="text-[10px] font-semibold text-dark-muted uppercase">Checked In</span>
                    <p className="text-lg font-bold text-blue-400 mt-0.5">
                      {checkedInCount} <span className="text-xs font-medium text-dark-muted">/ {eventBookings.length}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Scanning Simulator UI */}
            <div className="glass-panel rounded-3xl p-6 border-white/5 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-dark-text">Scan Viewfinder Simulation</h3>
                  <p className="text-xs text-dark-muted mt-0.5">Use camera or type simulated pass code</p>
                </div>
                
                {/* Camera Toggle Button */}
                <button
                  onClick={toggleCamera}
                  className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider border transition-all ${
                    cameraActive 
                      ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' 
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                  }`}
                >
                  {cameraActive ? (
                    <>
                      <CameraOff className="w-3.5 h-3.5" />
                      <span>Stop Camera</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-3.5 h-3.5" />
                      <span>Start Camera</span>
                    </>
                  )}
                </button>
              </div>

              {cameraError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs font-semibold text-center">
                  {cameraError}
                </div>
              )}

              {/* Camera Scanner or Simulated Camera Box */}
              {cameraActive ? (
                <div className="w-full aspect-[16/9] sm:aspect-[21/9] bg-black border border-white/10 rounded-2xl overflow-hidden relative shadow-2xl">
                  {/* Camera stream container */}
                  <div id="camera-reader" className="w-full h-full overflow-hidden" />
                  
                  {/* Overlay scanning viewfinder bracket guides over html5-qrcode video */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4 bg-black/10">
                    <div className="w-36 sm:w-44 aspect-square border-2 border-dashed border-emerald-500/70 rounded-xl relative flex items-center justify-center">
                      <div className="absolute left-0 right-0 h-[2px] bg-emerald-400 shadow-[0_0_10px_#10b981] animate-bounce-slow" />
                    </div>
                    <p className="text-[10px] text-white/70 font-semibold uppercase tracking-wider mt-3 bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
                      Align QR inside target box
                    </p>
                  </div>
                </div>
              ) : (
                /* Simulated Camera Box */
                <div className="w-full aspect-[16/9] sm:aspect-[21/9] bg-dark-bg/60 border border-white/5 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center p-4">
                  {/* Viewfinder Target */}
                  <div className="w-32 sm:w-40 aspect-square border-2 border-dashed border-emerald-500/60 rounded-xl relative flex items-center justify-center mb-2 shadow-emerald-950/20 shadow-2xl">
                    {/* Glowing Laser Scan Bar */}
                    <div className="absolute left-0 right-0 h-[2px] bg-emerald-400 shadow-[0_0_10px_#10b981] animate-bounce-slow" />
                    <QrCode className="w-16 h-16 text-emerald-400/20" />
                  </div>
                  <p className="text-[10px] sm:text-xs text-dark-muted font-medium text-center">
                    Position ticket QR code inside the viewfinder window
                  </p>

                  {/* Decorative brackets */}
                  <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-white/10" />
                  <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-white/10" />
                  <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-white/10" />
                  <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-white/10" />
                </div>
              )}

              {/* Scan inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-dark-muted uppercase tracking-wider mb-2">
                    Simulated Scanner Input (Hash Pass Code)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g., EH-C93B2F0E-9218"
                      value={ticketHashInput}
                      onChange={(e) => setTicketHashInput(e.target.value)}
                      className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-emerald-500 text-dark-text"
                    />
                    <button
                      onClick={() => handleVerifyTicket()}
                      disabled={scanning || !ticketHashInput.trim()}
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm px-6 py-2.5 rounded-xl hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 transition-all flex items-center gap-1.5"
                    >
                      {scanning && <Loader2 className="w-4 h-4 animate-spin" />}
                      <span>Verify</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Scan Response Panel */}
              <AnimatePresence mode="wait">
                {scanResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`rounded-2xl p-5 border flex items-start gap-4 ${
                      scanResult.success 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}
                  >
                    {scanResult.success ? (
                      <CheckCircle className="w-8 h-8 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-8 h-8 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-grow text-left">
                      <h4 className="font-extrabold text-sm uppercase tracking-wide">
                        {scanResult.success ? 'Access Granted' : 'Access Denied'}
                      </h4>
                      <p className="text-xs text-dark-text mt-1 font-medium">{scanResult.message}</p>
                      
                      {scanResult.success && scanResult.data && (
                        <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-2 gap-4 text-xs text-dark-text">
                          <div>
                            <span className="text-[10px] text-dark-muted font-semibold uppercase block">Attendee</span>
                            <span className="font-bold">{scanResult.data.attendee_name}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-dark-muted font-semibold uppercase block">Tickets Booked</span>
                            <span className="font-bold">{scanResult.data.tickets_count} Person(s)</span>
                          </div>
                        </div>
                      )}

                      {scanResult.data?.already_checked_in && (
                        <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-2 gap-4 text-xs text-dark-text">
                          <div>
                            <span className="text-[10px] text-dark-muted font-semibold uppercase block">Attendee</span>
                            <span className="font-bold">{scanResult.data.attendee_name}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-dark-muted font-semibold uppercase block">Tickets Booked</span>
                            <span className="font-bold">{scanResult.data.tickets_count} Person(s)</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Attendee Checklist Side Panel */}
          <div className="space-y-6">
            <div className="glass-panel rounded-3xl p-6 border-white/5 h-[645px] flex flex-col">
              <h3 className="text-lg font-bold text-dark-text mb-2">Confirmed Tickets Checklist</h3>
              <p className="text-xs text-dark-muted mb-4">Click a ticket to simulate scan/entry at the gate</p>
              
              {/* Search Attendee */}
              <div className="relative mb-4">
                <Search className="w-4 h-4 text-dark-muted absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search attendee, email, code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold outline-none focus:border-emerald-500 text-dark-text"
                />
              </div>

              {/* Attendee List */}
              <div className="flex-grow overflow-y-auto divide-y divide-white/5 pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                {filteredBookings.length === 0 ? (
                  <div className="text-center py-16 text-xs text-dark-muted">
                    No confirmed bookings match this query.
                  </div>
                ) : (
                  filteredBookings.map((b) => (
                    <div 
                      key={b.id} 
                      className={`py-3.5 flex items-center justify-between gap-3 text-left transition-all ${
                        b.is_checked_in ? 'opacity-55' : 'hover:bg-white/5 rounded-xl px-2 -mx-2'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-xs text-dark-text truncate">
                            {b.user_details?.first_name} {b.user_details?.last_name}
                          </p>
                          <span className="text-[9px] font-bold bg-white/5 text-dark-muted px-1.5 py-0.5 rounded">
                            x{b.tickets_count}
                          </span>
                        </div>
                        <p className="text-[10px] text-dark-muted truncate mt-0.5">{b.user_details?.email}</p>
                        
                        {/* Copy Code */}
                        <div className="flex items-center gap-1 mt-1 text-[9px] font-bold text-emerald-400 font-mono">
                          <span>{b.qr_code_hash}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(b.qr_code_hash);
                              setTicketHashInput(b.qr_code_hash);
                            }}
                            title="Copy ticket hash code to simulator"
                            className="p-0.5 hover:bg-white/5 rounded text-dark-muted hover:text-emerald-400"
                          >
                            <Clipboard className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Status/Check-In Trigger */}
                      {b.is_checked_in ? (
                        <div className="flex items-center gap-1 bg-blue-500/10 text-blue-400 text-[10px] font-extrabold px-2 py-1 rounded-lg border border-blue-500/10">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>In Gate</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleVerifyTicket(b.qr_code_hash)}
                          className="text-[10px] font-extrabold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-1"
                        >
                          <span>Scan</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Date Validation Pop-up Modal */}
      <AnimatePresence>
        {popupModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="glass-panel max-w-md w-full rounded-3xl p-8 border border-white/10 shadow-2xl relative text-center flex flex-col items-center overflow-hidden theme-bg"
            >
              {/* Radial gradient background accent */}
              <div className={`absolute top-0 inset-x-0 h-40 bg-gradient-to-b ${
                popupModal.type === 'before' ? 'from-amber-500/10' : 'from-red-500/10'
              } to-transparent -z-10`} />

              {/* Animated Warning Icon */}
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 relative ${
                popupModal.type === 'before' 
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                <div className={`absolute inset-0 rounded-full animate-ping opacity-25 ${
                  popupModal.type === 'before' ? 'bg-amber-500' : 'bg-red-500'
                }`} style={{ animationDuration: '3s' }} />
                
                {popupModal.type === 'before' ? (
                  <Calendar className="w-10 h-10" />
                ) : (
                  <AlertTriangle className="w-10 h-10" />
                )}
              </div>

              {/* Status Header Badge */}
              <span className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full mb-3 border ${
                popupModal.type === 'before' 
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
              }`}>
                {popupModal.type === 'before' ? 'Early Scan Detected' : 'Expired Ticket Scan'}
              </span>

              {/* Title */}
              <h3 className="text-2xl font-black text-dark-text tracking-tight mb-3">
                {popupModal.title}
              </h3>

              {/* Error Message */}
              <p className="text-sm text-dark-muted font-medium leading-relaxed px-2 mb-6">
                {popupModal.message}
              </p>

              {/* Event Date Badge / Meta info */}
              {popupModal.eventDate && (
                <div className="bg-white/5 border border-white/5 w-full rounded-2xl p-4 mb-6 flex items-center justify-between text-left">
                  <div>
                    <span className="text-[10px] text-dark-muted font-semibold uppercase block">Scheduled Date</span>
                    <span className="font-extrabold text-sm text-dark-text">
                      {new Date(popupModal.eventDate).toLocaleDateString(undefined, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <Calendar className="w-5 h-5 text-dark-muted" />
                </div>
              )}

              {/* Actions */}
              <button
                onClick={() => setPopupModal(null)}
                className={`w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all transform hover:-translate-y-0.5 shadow-lg active:translate-y-0 ${
                  popupModal.type === 'before' 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-950/20' 
                    : 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 shadow-red-950/20'
                }`}
              >
                Acknowledge & Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TicketScanner;
