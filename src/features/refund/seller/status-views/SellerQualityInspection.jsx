import React, { useState } from 'react';
import {
  submitInspection,
  escalateSellerRefund,
  offerFullRefund,
  offerPartialRefund,
  offerExchange,
  rejectSellerRefund
} from '../../api/refundApi';
import { useSellerTheme } from '../../../seller/hooks/useSellerTheme';

export default function SellerQualityInspection({
  detail,
  onRefresh,
  setError
}) {
  const { darkMode } = useSellerTheme();
  const isDark = darkMode;
  const [submitting, setSubmitting] = useState(false);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [offerType, setOfferType] = useState('FULL_REFUND'); // FULL_REFUND, PARTIAL_REFUND, EXCHANGE
  const [offerNotes, setOfferNotes] = useState('');
  const [offerAmount, setOfferAmount] = useState('');

  const [inspectionForm, setInspectionForm] = useState({
    physicalDamage: false,
    waterDamage: false,
    missingParts: false,
    burnDamage: false,
    tampering: false,
    packagingIntact: true,
    productMatches: true,
    severityScore: 1,
    inspectorNotes: '',
    verdict: 'VALID_DAMAGE'
  });

  const executeAction = async (actionFn) => {
    setSubmitting(true);
    setError('');
    try {
      await actionFn();
      onRefresh();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to complete visual inspection action.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInspectionSubmit = async (e) => {
    e.preventDefault();
    executeAction(async () => {
      await submitInspection(detail.id, inspectionForm);
      setShowInspectionModal(false);
    });
  };

  const handleOfferSubmit = async (e) => {
    e.preventDefault();
    executeAction(async () => {
      if (offerType === 'FULL_REFUND') {
        await offerFullRefund(detail.id, { notes: offerNotes });
      } else if (offerType === 'PARTIAL_REFUND') {
        await offerPartialRefund(detail.id, { amount: Number(offerAmount), notes: offerNotes });
      } else if (offerType === 'EXCHANGE') {
        await offerExchange(detail.id, { notes: offerNotes });
      }
      setShowOfferModal(false);
      setOfferNotes('');
      setOfferAmount('');
    });
  };

  const handleEscalateClaim = () => executeAction(() => escalateSellerRefund(detail.id));
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectNotes.trim()) return;
    executeAction(async () => {
      await rejectSellerRefund(detail.id, rejectNotes.trim());
      setShowRejectModal(false);
      setRejectNotes('');
    });
  };

  return (
    <div className={`border-t pt-5 flex flex-wrap gap-3 items-center justify-end p-4 rounded-xl transition-colors ${
      isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50/50'
    }`}>
      <div className="flex gap-3">
        {detail.status === 'PRODUCT_INSPECTION' && (
          <button
            onClick={() => setShowInspectionModal(true)}
            disabled={submitting}
            className="px-5 py-2.5 bg-[#16A34A] hover:bg-[#152F17] text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer border-0"
          >
            Perform Quality Inspection
          </button>
        )}

        {detail.status === 'INSPECTION_COMPLETE' && (
          <>
            <button
              onClick={() => {
                setOfferType('FULL_REFUND');
                setShowOfferModal(true);
              }}
              disabled={submitting}
              className="px-5 py-2.5 bg-[#16A34A] hover:bg-[#152F17] text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer border-0"
            >
              Offer Resolution
            </button>
            <button
              onClick={() => {
                setRejectNotes('');
                setShowRejectModal(true);
              }}
              disabled={submitting}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer border-0"
            >
              Reject Request
            </button>
            <button
              onClick={handleEscalateClaim}
              disabled={submitting}
              className={`px-4 py-2.5 border rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer bg-transparent ${
                isDark ? 'border-white/10 text-white hover:bg-white/5' : 'border-gray-300 text-gray-650 hover:bg-gray-50'
              }`}
            >
              Escalate to Admin
            </button>
          </>
        )}
      </div>

      {/* Quality Inspection Modal */}
      {showInspectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className={`border rounded-xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 transition-colors ${
            isDark ? 'bg-[#0b0c10] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-700'
          }`}>
            <div className={`px-5 py-4 border-b flex justify-between items-center ${
              isDark ? 'border-white/10 bg-[#111827]' : 'border-gray-100 bg-gray-55'
            }`}>
              <h3 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>Merchandise Quality Assessment Form</h3>
              <button type="button" onClick={() => setShowInspectionModal(false)} className={`bg-transparent border-0 cursor-pointer transition-colors ${isDark ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-650'}`}>✕</button>
            </div>
            <form onSubmit={handleInspectionSubmit} className="p-5 space-y-4 text-xs font-semibold">
              <div className="space-y-2">
                <label className={`block text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Damage Checklist</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'physicalDamage', label: 'Physical Damage' },
                    { key: 'waterDamage', label: 'Water Damage' },
                    { key: 'missingParts', label: 'Missing Parts' },
                    { key: 'burnDamage', label: 'Burn Damage' },
                    { key: 'tampering', label: 'Tampering / Modification' },
                    { key: 'packagingIntact', label: 'Packaging Intact' },
                    { key: 'productMatches', label: 'Product Matches Record' },
                  ].map(chk => (
                    <label key={chk.key} className={`flex items-center gap-2 cursor-pointer p-1 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <input
                        type="checkbox"
                        checked={inspectionForm[chk.key]}
                        onChange={e => setInspectionForm(prev => ({ ...prev, [chk.key]: e.target.checked }))}
                        className="rounded text-[#16A34A] border-gray-300 focus:ring-[#16A34A] w-3.5 h-3.5"
                      />
                      <span>{chk.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={`block text-[8px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Severity Score (1-10)</label>
                  <input
                    type="number"
                    min="1" max="10"
                    value={inspectionForm.severityScore}
                    onChange={e => setInspectionForm(prev => ({ ...prev, severityScore: Number(e.target.value) }))}
                    className={`w-full border rounded-lg p-2 font-semibold outline-none focus:border-[#16A34A] transition-colors ${
                      isDark 
                        ? 'bg-[#111827] border-white/10 text-white placeholder-gray-600' 
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className={`block text-[8px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Inspection Verdict</label>
                  <select
                    value={inspectionForm.verdict}
                    onChange={e => setInspectionForm(prev => ({ ...prev, verdict: e.target.value }))}
                    className={`w-full border rounded-lg p-2 font-semibold outline-none focus:border-[#16A34A] transition-colors ${
                      isDark 
                        ? 'bg-[#111827] border-white/10 text-white' 
                        : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  >
                    <option value="VALID_DAMAGE">Valid Damage (Approve claim)</option>
                    <option value="FRAUDULENT_CLAIM">Fraudulent Claim (Empty box, wrong item)</option>
                    <option value="DAMAGED_BY_CUSTOMER">Damaged by Customer</option>
                    <option value="PARTIAL_DAMAGE">Partial Damage</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className={`block text-[8px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Inspection Notes</label>
                <textarea
                  value={inspectionForm.inspectorNotes}
                  onChange={e => setInspectionForm(prev => ({ ...prev, inspectorNotes: e.target.value }))}
                  placeholder="Describe returned item visual inspection results..."
                  className={`w-full border rounded-lg p-2.5 font-semibold outline-none h-16 focus:border-[#16A34A] transition-colors ${
                    isDark 
                      ? 'bg-[#111827] border-white/10 text-white placeholder-gray-600' 
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInspectionModal(false)}
                  className={`px-4 py-2 border rounded-lg font-bold cursor-pointer transition-colors bg-transparent ${
                    isDark ? 'border-white/10 hover:bg-white/5 text-white' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#16A34A] hover:bg-[#152F17] text-white rounded-lg font-bold disabled:opacity-50 cursor-pointer border-0"
                >
                  Complete Inspection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolution Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className={`border rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 transition-colors ${
            isDark ? 'bg-[#0b0c10] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-700'
          }`}>
            <div className={`px-5 py-4 border-b flex justify-between items-center ${
              isDark ? 'border-white/10 bg-[#111827]' : 'border-gray-100 bg-gray-55'
            }`}>
              <h3 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>Make Resolution Offer (Post-Inspection)</h3>
              <button type="button" onClick={() => setShowOfferModal(false)} className={`bg-transparent border-0 cursor-pointer transition-colors ${isDark ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-650'}`}>✕</button>
            </div>
            <form onSubmit={handleOfferSubmit} className="p-5 space-y-4 text-xs font-semibold">
              <div className="space-y-2">
                <label className={`block text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Select Resolution Offer</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setOfferType('FULL_REFUND')}
                    className={`p-2.5 rounded-lg border text-[10px] text-center font-bold transition-all cursor-pointer bg-transparent ${
                      offerType === 'FULL_REFUND' 
                        ? 'border-[#16A34A] bg-[#16A34A]/10 text-[#16A34A] shadow-xs' 
                        : (isDark ? 'border-white/10 hover:bg-white/5 text-gray-300' : 'border-gray-200 hover:bg-gray-55')
                    }`}
                  >
                    Full Refund
                  </button>
                  <button
                    type="button"
                    onClick={() => setOfferType('PARTIAL_REFUND')}
                    className={`p-2.5 rounded-lg border text-[10px] text-center font-bold transition-all cursor-pointer bg-transparent ${
                      offerType === 'PARTIAL_REFUND' 
                        ? 'border-[#16A34A] bg-[#16A34A]/10 text-[#16A34A] shadow-xs' 
                        : (isDark ? 'border-white/10 hover:bg-white/5 text-gray-300' : 'border-gray-200 hover:bg-gray-55')
                    }`}
                  >
                    Partial Refund
                  </button>
                  <button
                    type="button"
                    onClick={() => setOfferType('EXCHANGE')}
                    className={`p-2.5 rounded-lg border text-[10px] text-center font-bold transition-all cursor-pointer bg-transparent ${
                      offerType === 'EXCHANGE' 
                        ? 'border-[#16A34A] bg-[#16A34A]/10 text-[#16A34A] shadow-xs' 
                        : (isDark ? 'border-white/10 hover:bg-white/5 text-gray-300' : 'border-gray-200 hover:bg-gray-55')
                    }`}
                  >
                    Exchange Product
                  </button>
                </div>
              </div>

              {offerType === 'PARTIAL_REFUND' && (
                <div className="space-y-1">
                  <label className={`block text-[8px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Partial Offer Amount (NPR)</label>
                  <input
                    type="number"
                    value={offerAmount}
                    onChange={e => setOfferAmount(e.target.value)}
                    placeholder="e.g. 1500"
                    className={`w-full border rounded-lg p-2.5 font-semibold outline-none focus:border-[#16A34A] transition-colors ${
                      isDark 
                        ? 'bg-[#111827] border-white/10 text-white placeholder-gray-600' 
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                    required
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className={`block text-[8px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Explanation Note</label>
                <textarea
                  value={offerNotes}
                  onChange={e => setOfferNotes(e.target.value)}
                  placeholder="Provide resolution offer details or counter proposal remarks..."
                  className={`w-full border rounded-lg p-2.5 font-semibold outline-none h-20 focus:border-[#16A34A] h-20 transition-colors ${
                    isDark 
                      ? 'bg-[#111827] border-white/10 text-white placeholder-gray-600' 
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                  }`}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOfferModal(false)}
                  className={`px-4 py-2 border rounded-lg font-bold cursor-pointer transition-colors bg-transparent ${
                    isDark ? 'border-white/10 hover:bg-white/5 text-white' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#16A34A] hover:bg-[#152F17] text-white rounded-lg font-bold disabled:opacity-50 cursor-pointer border-0"
                >
                  Submit Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className={`border rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 transition-colors ${
            isDark ? 'bg-[#0b0c10] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-700'
          }`}>
            <div className={`px-5 py-4 border-b flex justify-between items-center ${
              isDark ? 'border-white/10 bg-[#111827]' : 'border-gray-100 bg-gray-55'
            }`}>
              <h3 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>Reject Refund Claim (Post-Inspection)</h3>
              <button type="button" onClick={() => setShowRejectModal(false)} className={`bg-transparent border-0 cursor-pointer transition-colors ${isDark ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-650'}`}>✕</button>
            </div>
            <form onSubmit={handleRejectSubmit} className="p-5 space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className={`block text-[8px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Rejection Explanation Reason</label>
                <textarea
                  value={rejectNotes}
                  onChange={e => setRejectNotes(e.target.value)}
                  placeholder="Explain exactly why you are rejecting this refund request (e.g. item returned was severely damaged by customer)..."
                  className={`w-full border rounded-lg p-2.5 font-semibold outline-none focus:border-red-500 h-24 transition-colors ${
                    isDark 
                      ? 'bg-[#111827] border-white/10 text-white placeholder-gray-600' 
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                  }`}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className={`px-4 py-2 border rounded-lg font-bold cursor-pointer transition-colors bg-transparent ${
                    isDark ? 'border-white/10 hover:bg-white/5 text-white' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !rejectNotes.trim()}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold disabled:opacity-50 cursor-pointer border-0"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
