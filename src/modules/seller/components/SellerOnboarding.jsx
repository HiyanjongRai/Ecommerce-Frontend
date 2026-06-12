import React, { useState, useEffect, useCallback } from 'react';
import { getSellerApplicationStatus, submitSellerApplication } from '../services/sellerService';
import { useCustomer } from '../../customer/contexts/CustomerContext';

const SellerOnboarding = ({ onApproved }) => {
  const { user, logoutUser } = useCustomer();
  const [appStatus, setAppStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form fields state
  const [storeName, setStoreName] = useState('');
  const [address, setAddress] = useState('');
  const [idDocument, setIdDocument] = useState(null);
  const [businessLicense, setBusinessLicense] = useState(null);
  const [taxCertificate, setTaxCertificate] = useState(null);

  const fetchStatus = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await getSellerApplicationStatus(user.id);
      if (res.data) {
        setAppStatus(res.data);
        if (res.data.status === 'APPROVED') {
          if (onApproved) onApproved();
        }
      }
    } catch (err) {
      console.error('Failed to load application status', err);
      setError('Could not fetch onboarding status. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  }, [user, onApproved]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!storeName.trim() || !address.trim()) {
      setError('Store name and address are required.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('userId', user.id);
    formData.append('storeName', storeName);
    formData.append('address', address);
    if (idDocument) formData.append('idDocument', idDocument);
    if (businessLicense) formData.append('businessLicense', businessLicense);
    if (taxCertificate) formData.append('taxCertificate', taxCertificate);

    try {
      const res = await submitSellerApplication(formData);
      setSuccess(res.data?.message || 'Documents submitted successfully!');
      setTimeout(() => {
        fetchStatus();
      }, 1500);
    } catch (err) {
      console.error('Failed to submit onboarding docs', err);
      setError(err.response?.data?.message || 'Failed to submit application. Please verify document types.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-white">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500 mb-4" />
        <p className="text-xs uppercase tracking-widest font-black text-gray-500">Loading Onboarding Manager...</p>
      </div>
    );
  }

  // Under Review Screen
  if (appStatus?.status === 'PENDING') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-6">
        <div className="backdrop-blur-md bg-white/[0.02] border border-white/[0.08] rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          
          {/* Animated clock/processing icon */}
          <div className="w-20 h-20 rounded-full bg-purple-500/10 border border-purple-500/25 flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-purple-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight">Application Under Review</h2>
          <p className="text-gray-400 text-xs mt-1 uppercase tracking-widest font-semibold">Status: Pending Verification</p>

          <div className="bg-purple-500/5 border border-purple-500/10 rounded-2xl p-6 my-6 text-sm text-gray-300 leading-relaxed text-left">
            💡 <strong>Hello, {user?.username}!</strong> Your Jhapcham seller credentials and shop documents have been successfully filed. Our administrative verification team is actively reviewing your application. This normally takes between 12-24 hours.
          </div>

          <div className="flex flex-col gap-3 max-w-sm mx-auto text-left text-xs text-gray-400 border-t border-white/[0.05] pt-6">
            <div className="flex justify-between">
              <span>Submitted On:</span>
              <span className="font-semibold text-white">{appStatus.submittedAt ? new Date(appStatus.submittedAt).toLocaleDateString() : 'Just now'}</span>
            </div>
            <div className="flex justify-between">
              <span>Application ID:</span>
              <span className="font-mono text-purple-400 font-bold">#APP-{appStatus.applicationId || 'NEW'}</span>
            </div>
          </div>

          <div className="flex justify-center gap-3 mt-8">
            <button 
              onClick={fetchStatus}
              className="px-6 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
            >
              Check Status
            </button>
            <button 
              onClick={logoutUser}
              className="px-6 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Upload/Registration Screen (For NONE or REJECTED states)
  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="backdrop-blur-md bg-[#111827] border border-[#1f2937]/80 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-gray-200">
        
        {/* Glows */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Heading */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-800/80">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">Seller Onboarding</h2>
            <p className="text-purple-400 text-[10px] mt-0.5 uppercase tracking-wider font-bold">Submit store credentials & docs</p>
          </div>
          <button
            onClick={logoutUser}
            className="text-[10px] font-black uppercase tracking-wider border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer"
          >
            Log Out
          </button>
        </div>

        {/* Rejection Notice */}
        {appStatus?.status === 'REJECTED' && (
          <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl p-4 mb-6 text-xs text-rose-400 font-semibold leading-relaxed">
            💥 <strong>Previous Application Rejected:</strong> {appStatus.message || 'Verification of files failed.'}
            {appStatus.reviewNote && (
              <div className="mt-2 text-white bg-black/40 p-3 rounded-lg border border-rose-500/20 font-normal">
                ✍️ <strong>Admin Feedback:</strong> {appStatus.reviewNote}
              </div>
            )}
          </div>
        )}

        {/* Status Alerts */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl p-3.5 mb-6 text-xs text-rose-400 font-medium flex items-center gap-2">
            <span>✕</span> {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-3.5 mb-6 text-xs text-emerald-400 font-medium flex items-center gap-2">
            <span>✓</span> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Shop Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-black text-gray-400 mb-1.5">
                Store Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Nepal Crafts Studio"
                value={storeName}
                onChange={e => setStoreName(e.target.value)}
                className="w-full bg-[#1f2937]/50 border border-gray-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-black text-gray-400 mb-1.5">
                Physical Shop Address
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Thamel, Kathmandu"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full bg-[#1f2937]/50 border border-gray-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Files Upload */}
          <div className="space-y-3.5">
            <h4 className="text-[10px] uppercase tracking-widest font-black text-purple-400 border-b border-gray-800/80 pb-2">
              Required Documentation (PDF / Images)
            </h4>

            {/* Document 1: ID Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#1f2937]/20 border border-gray-800/60 rounded-xl p-4 hover:border-purple-500/20 transition-all">
              <div>
                <h5 className="text-xs font-bold text-white">Owner Identity Document</h5>
                <p className="text-[10px] text-gray-400 mt-0.5">Government ID, Passport, or Citizenship Certificate</p>
              </div>
              <input
                type="file"
                required={appStatus?.status !== 'REJECTED'}
                onChange={e => setIdDocument(e.target.files[0])}
                className="text-[10px] text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[9px] file:font-black file:uppercase file:tracking-wider file:bg-purple-500/10 file:text-purple-400 file:hover:bg-purple-500/25 file:cursor-pointer"
              />
            </div>

            {/* Document 2: Business License */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#1f2937]/20 border border-gray-800/60 rounded-xl p-4 hover:border-purple-500/20 transition-all">
              <div>
                <h5 className="text-xs font-bold text-white">Business Registration License</h5>
                <p className="text-[10px] text-gray-400 mt-0.5">Official company registration document</p>
              </div>
              <input
                type="file"
                required={appStatus?.status !== 'REJECTED'}
                onChange={e => setBusinessLicense(e.target.files[0])}
                className="text-[10px] text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[9px] file:font-black file:uppercase file:tracking-wider file:bg-purple-500/10 file:text-purple-400 file:hover:bg-purple-500/25 file:cursor-pointer"
              />
            </div>

            {/* Document 3: Tax Certificate */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#1f2937]/20 border border-gray-800/60 rounded-xl p-4 hover:border-purple-500/20 transition-all">
              <div>
                <h5 className="text-xs font-bold text-white">PAN / VAT Tax Certificate</h5>
                <p className="text-[10px] text-gray-400 mt-0.5">Valid tax filing certificate registration</p>
              </div>
              <input
                type="file"
                required={appStatus?.status !== 'REJECTED'}
                onChange={e => setTaxCertificate(e.target.files[0])}
                className="text-[10px] text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[9px] file:font-black file:uppercase file:tracking-wider file:bg-purple-500/10 file:text-purple-400 file:hover:bg-purple-500/25 file:cursor-pointer"
              />
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 hover:shadow-purple-500/10 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all transform active:scale-95 cursor-pointer shadow-lg disabled:opacity-50 mt-4"
          >
            {submitting ? 'Filing Application...' : 'Submit Documentation for Review'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default SellerOnboarding;


