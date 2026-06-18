import React, { useState } from 'react';
import {
  submitInspection,
  escalateSellerRefund,
  offerFullRefund,
  offerPartialRefund,
  offerExchange,
  rejectSellerRefund
} from '../../../../shared/api/refundApi';

export default function SellerQualityInspection({
  detail,
  onRefresh,
  setError
}) {
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
    <div className="border-t border-gray-200 pt-5 flex flex-wrap gap-3 items-center justify-end bg-gray-50/50 p-4 rounded-xl">
      <div className="flex gap-3">
        {detail.status === 'PRODUCT_INSPECTION' && (
          <button
            onClick={() => setShowInspectionModal(true)}
            disabled={submitting}
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
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
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Offer Resolution
            </button>
            <button
              onClick={() => {
                setRejectNotes('');
                setShowRejectModal(true);
              }}
              disabled={submitting}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Reject Request
            </button>
            <button
              onClick={handleEscalateClaim}
              disabled={submitting}
              className="px-4 py-2.5 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Escalate to Admin
            </button>
          </>
        )}
      </div>

      {/* Quality Inspection Modal */}
      {showInspectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-gray-200 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-205">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">Merchandise Quality Assessment Form</h3>
              <button type="button" onClick={() => setShowInspectionModal(false)} className="text-gray-400 hover:text-gray-655">✕</button>
            </div>
            <form onSubmit={handleInspectionSubmit} className="p-5 space-y-4 text-xs font-semibold text-gray-700">
              <div className="space-y-2">
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400">Damage Checklist</label>
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
                    <label key={chk.key} className="flex items-center gap-2 cursor-pointer p-1">
                      <input
                        type="checkbox"
                        checked={inspectionForm[chk.key]}
                        onChange={e => setInspectionForm(prev => ({ ...prev, [chk.key]: e.target.checked }))}
                        className="rounded text-emerald-600 border-gray-300 focus:ring-emerald-500 w-3.5 h-3.5"
                      />
                      <span>{chk.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400">Severity Score (1-10)</label>
                  <input
                    type="number"
                    min="1" max="10"
                    value={inspectionForm.severityScore}
                    onChange={e => setInspectionForm(prev => ({ ...prev, severityScore: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-lg p-2 bg-white font-semibold outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400">Inspection Verdict</label>
                  <select
                    value={inspectionForm.verdict}
                    onChange={e => setInspectionForm(prev => ({ ...prev, verdict: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg p-2 bg-white font-semibold outline-none"
                  >
                    <option value="VALID_DAMAGE">Valid Damage (Approve claim)</option>
                    <option value="FRAUDULENT_CLAIM">Fraudulent Claim (Empty box, wrong item)</option>
                    <option value="DAMAGED_BY_CUSTOMER">Damaged by Customer</option>
                    <option value="PARTIAL_DAMAGE">Partial Damage</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400">Inspection Notes</label>
                <textarea
                  value={inspectionForm.inspectorNotes}
                  onChange={e => setInspectionForm(prev => ({ ...prev, inspectorNotes: e.target.value }))}
                  placeholder="Describe returned item visual inspection results..."
                  className="w-full border border-gray-200 rounded-lg p-2.5 bg-white font-semibold outline-none h-16"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInspectionModal(false)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-lg font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold disabled:opacity-50 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-gray-200 rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-205">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">Make Resolution Offer (Post-Inspection)</h3>
              <button type="button" onClick={() => setShowOfferModal(false)} className="text-gray-400 hover:text-gray-655">✕</button>
            </div>
            <form onSubmit={handleOfferSubmit} className="p-5 space-y-4 text-xs font-semibold text-gray-700">
              <div className="space-y-2">
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400">Select Resolution Offer</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setOfferType('FULL_REFUND')}
                    className={`p-2.5 rounded-lg border text-[10px] text-center font-bold transition-all ${
                      offerType === 'FULL_REFUND' ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-xs' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Full Refund
                  </button>
                  <button
                    type="button"
                    onClick={() => setOfferType('PARTIAL_REFUND')}
                    className={`p-2.5 rounded-lg border text-[10px] text-center font-bold transition-all ${
                      offerType === 'PARTIAL_REFUND' ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-xs' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Partial Refund
                  </button>
                  <button
                    type="button"
                    onClick={() => setOfferType('EXCHANGE')}
                    className={`p-2.5 rounded-lg border text-[10px] text-center font-bold transition-all ${
                      offerType === 'EXCHANGE' ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-xs' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Exchange Product
                  </button>
                </div>
              </div>

              {offerType === 'PARTIAL_REFUND' && (
                <div className="space-y-1">
                  <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400">Partial Offer Amount (NPR)</label>
                  <input
                    type="number"
                    value={offerAmount}
                    onChange={e => setOfferAmount(e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full border border-gray-200 rounded-lg p-2.5 bg-white font-semibold outline-none focus:border-[#10B981]"
                    required
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400">Explanation Note</label>
                <textarea
                  value={offerNotes}
                  onChange={e => setOfferNotes(e.target.value)}
                  placeholder="Provide resolution offer details or counter proposal remarks..."
                  className="w-full border border-gray-200 rounded-lg p-2.5 bg-white font-semibold outline-none focus:border-[#10B981] h-20"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOfferModal(false)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-lg font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold disabled:opacity-50 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-gray-200 rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-205">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">Reject Refund Claim (Post-Inspection)</h3>
              <button type="button" onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-gray-650">✕</button>
            </div>
            <form onSubmit={handleRejectSubmit} className="p-5 space-y-4 text-xs font-semibold text-gray-700">
              <div className="space-y-1">
                <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400">Rejection Explanation Reason</label>
                <textarea
                  value={rejectNotes}
                  onChange={e => setRejectNotes(e.target.value)}
                  placeholder="Explain exactly why you are rejecting this refund request (e.g. item returned was severely damaged by customer)..."
                  className="w-full border border-gray-200 rounded-lg p-2.5 bg-white font-semibold outline-none focus:border-red-500 h-24"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-lg font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !rejectNotes.trim()}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold disabled:opacity-50 cursor-pointer"
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
