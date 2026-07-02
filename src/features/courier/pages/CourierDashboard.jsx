import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getCourierAssignedShipments, 
  getCourierInfo, 
  clearCourierToken, 
  updateTrackingStatus, 
  resendDeliveryOtp 
} from '../api/courierApi';

const CourierDashboard = () => {
  const navigate = useNavigate();
  const [courier, setCourier] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  
  // Modal for status update
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [otp, setOtp] = useState('');
  const [collectedAmount, setCollectedAmount] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [otpSentMessage, setOtpSentMessage] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const info = getCourierInfo();
      if (!info) {
        navigate('/courier/login');
        return;
      }
      setCourier(info);
      
      const res = await getCourierAssignedShipments();
      setShipments(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assigned shipments.');
      if (err.response?.status === 401) {
        clearCourierToken();
        navigate('/courier/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleLogout = () => {
    clearCourierToken();
    navigate('/courier/login');
  };

  // Resend OTP
  const handleResendOtp = async (trackingId) => {
    setOtpSentMessage('');
    try {
      await resendDeliveryOtp(trackingId);
      setOtpSentMessage('OTP code resent successfully to customer!');
      setTimeout(() => setOtpSentMessage(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resend OTP.');
    }
  };

  // Submit Status Change
  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!newStatus) return;
    
    setUpdating(true);
    setUpdateError('');
    try {
      const payload = {
        trackingId: selectedShipment.trackingId,
        status: newStatus,
        location: location || courier?.currentDistrict || 'Transit Hub',
        note: note || `Shipment status updated to ${newStatus}`,
      };

      if (newStatus === 'DELIVERED') {
        if (!otp.trim()) {
          setUpdateError('OTP is required to deliver this shipment.');
          setUpdating(false);
          return;
        }
        payload.otp = otp.trim();
        if (selectedShipment.cashOnDelivery) {
          payload.collectedAmount = parseFloat(collectedAmount || selectedShipment.codAmount || 0);
        }
      }

      await updateTrackingStatus(payload);
      
      // Reset Modal & Reload
      setSelectedShipment(null);
      setNewStatus('');
      setLocation('');
      setNote('');
      setOtp('');
      setCollectedAmount('');
      
      await loadDashboard();
      alert('Shipment status updated successfully!');
    } catch (err) {
      setUpdateError(err.response?.data?.message || 'Failed to update status. Please verify constraints.');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'CREATED':
      case 'RIDER_ASSIGNED':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'PICKED_UP':
      case 'IN_TRANSIT':
      case 'OUT_FOR_DELIVERY':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'FAILED_DELIVERY':
      case 'CANCELLED':
      case 'RETURN_TO_SELLER':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  const filteredShipments = shipments.filter(shipment => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'PENDING') {
      return ['CREATED', 'RIDER_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELAYED'].includes(shipment.deliveryStatus);
    }
    if (activeTab === 'COMPLETED') {
      return shipment.deliveryStatus === 'DELIVERED';
    }
    if (activeTab === 'FAILED') {
      return ['FAILED_DELIVERY', 'CANCELLED', 'RETURN_TO_SELLER', 'CALL_NOT_PICKED', 'ADDRESS_NOT_FOUND'].includes(shipment.deliveryStatus);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 pb-12">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-slate-900/85 backdrop-blur-md border-b border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414A1 1 0 0121 11.414V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0"/>
              </svg>
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight leading-none text-white">Jhapcham Courier</h2>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Rider Dashboard</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {courier && (
              <div className="hidden md:block text-right">
                <p className="text-xs font-bold text-white leading-none">{courier.fullName}</p>
                <span className="text-[10px] text-slate-400 font-medium">{courier.email}</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-8">
        {/* Profile Card */}
        {courier && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 flex flex-wrap items-center justify-between gap-6 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-blue-500/5 pointer-events-none" />
            <div className="relative flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-lg">
                🏍️
              </div>
              <div>
                <p className="text-lg font-black text-white">{courier.fullName}</p>
                <div className="flex flex-wrap gap-2.5 mt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <span>📍 District: <strong className="text-white">{courier.currentDistrict || 'N/A'}</strong></span>
                  <span>•</span>
                  <span>Vehicle: <strong className="text-white">{courier.vehicleType || 'N/A'}</strong></span>
                  {courier.phoneNumber && (
                    <>
                      <span>•</span>
                      <span>Call: <strong className="text-white">{courier.phoneNumber}</strong></span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl px-5 py-3 text-center min-w-[120px]">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Total Assigned</span>
              <strong className="text-xl font-black text-emerald-400 mt-1 block">{shipments.length}</strong>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Tab Filters */}
        <div className="flex gap-2 overflow-x-auto border-b border-slate-800 pb-3 mb-6 scrollbar-hide">
          {[
            { id: 'ALL', label: 'All Parcels' },
            { id: 'PENDING', label: 'Pending Delivery' },
            { id: 'COMPLETED', label: 'Delivered' },
            { id: 'FAILED', label: 'Failed/Cancelled' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all border whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Shipment List */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-400 mx-auto mb-4" />
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Fetching assigned shipments...</p>
          </div>
        ) : filteredShipments.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl py-16 text-center shadow-lg">
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest">No shipments found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredShipments.map(shipment => (
              <div 
                key={shipment.trackingId} 
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl hover:border-slate-700/60 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Title Bar */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 mb-4">
                    <span className="font-mono text-emerald-400 text-xs font-black tracking-widest">{shipment.trackingId}</span>
                    <span className={`px-2.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${getStatusBadge(shipment.deliveryStatus)}`}>
                      {shipment.deliveryStatus.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Customer / Item Details */}
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[9px] font-black uppercase tracking-widest">Customer Details</span>
                      <strong className="text-white block mt-0.5">{shipment.customerName || 'Anonymous'}</strong>
                      <span className="text-slate-400 block font-medium mt-0.5">{shipment.customerPhone || 'No contact'}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[9px] font-black uppercase tracking-widest">Destination Address</span>
                      <span className="text-slate-300 block mt-0.5 font-medium">{shipment.destinationAddress || 'N/A'}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[9px] font-black uppercase tracking-widest">Item Summary</span>
                      <span className="text-slate-300 block mt-0.5 font-medium italic">"{shipment.itemSummary || 'No summary'}"</span>
                    </div>

                    <div className="flex justify-between items-center bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 mt-4">
                      <div>
                        <span className="text-slate-500 block text-[8px] font-black uppercase tracking-widest">Payment Mode</span>
                        <strong className="text-white text-[10px] font-black uppercase tracking-wider block mt-0.5">
                          {shipment.cashOnDelivery ? '💵 Cash On Delivery (COD)' : '💳 Prepaid (eSewa)'}
                        </strong>
                      </div>
                      {shipment.cashOnDelivery && (
                        <div className="text-right">
                          <span className="text-slate-500 block text-[8px] font-black uppercase tracking-widest">Collect Amount</span>
                          <strong className="text-emerald-400 text-xs font-black block mt-0.5">Rs. {shipment.codAmount?.toLocaleString()}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Update Status Trigger */}
                <div className="mt-5 pt-4 border-t border-slate-800/60">
                  <button
                    onClick={() => {
                      setSelectedShipment(shipment);
                      setNewStatus(shipment.deliveryStatus);
                    }}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700/80 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md border border-slate-700"
                  >
                    ✏️ Update Shipment Status
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Edit Status Modal */}
      {selectedShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleIn">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[8px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Status Manager
                </span>
                <h3 className="text-sm font-black text-white mt-1.5">
                  Update Shipment <span className="font-mono text-emerald-400 tracking-wider">#{selectedShipment.trackingId}</span>
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedShipment(null);
                  setUpdateError('');
                }}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStatusSubmit} className="p-6 space-y-4">
              {updateError && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[11px] font-semibold">
                  ⚠️ {updateError}
                </div>
              )}

              {/* Status Selector */}
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Select Delivery Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => {
                    setNewStatus(e.target.value);
                    setUpdateError('');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs font-bold outline-none cursor-pointer focus:border-emerald-500/60"
                >
                  <option value="CREATED">CREATED</option>
                  <option value="RIDER_ASSIGNED">RIDER ASSIGNED</option>
                  <option value="PICKED_UP">PICKED UP</option>
                  <option value="IN_TRANSIT">IN TRANSIT</option>
                  <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="FAILED_DELIVERY">FAILED DELIVERY</option>
                  <option value="DELAYED">DELAYED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="CALL_NOT_PICKED">CALL NOT PICKED</option>
                  <option value="ADDRESS_NOT_FOUND">ADDRESS NOT FOUND</option>
                </select>
              </div>

              {/* Location Input */}
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Current Location / District
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={courier?.currentDistrict || "Kathmandu Hub, Koteshwor"}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs font-semibold placeholder-slate-600 focus:outline-none focus:border-emerald-500/60"
                />
              </div>

              {/* Note / Remarks */}
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Operation Note / Remarks
                </label>
                <textarea
                  rows="2"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g., Package handed over to recipient / client was offline."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs font-semibold placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 resize-none"
                />
              </div>

              {/* Delivered Conditional Fields */}
              {newStatus === 'DELIVERED' && (
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">🔒 Delivery Verification</span>
                    <button
                      type="button"
                      onClick={() => handleResendOtp(selectedShipment.trackingId)}
                      className="text-[9px] font-black text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest"
                    >
                      Resend OTP Code
                    </button>
                  </div>

                  {otpSentMessage && (
                    <p className="text-[9px] font-bold text-blue-400 italic leading-none">{otpSentMessage}</p>
                  )}

                  {selectedShipment.cashOnDelivery && (
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Collect Cash Amount (COD)
                      </label>
                      <input
                        type="number"
                        value={collectedAmount !== '' ? collectedAmount : selectedShipment.codAmount}
                        onChange={(e) => setCollectedAmount(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs font-black text-emerald-400"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Enter Customer OTP Code
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="e.g. 123456"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs font-mono text-center tracking-widest placeholder-slate-600 focus:outline-none focus:border-emerald-500/60"
                    />
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-3 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedShipment(null);
                    setUpdateError('');
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700/80 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-wider flex-1 transition-all border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-wider flex-1 transition-all shadow-lg shadow-emerald-500/10 disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourierDashboard;
