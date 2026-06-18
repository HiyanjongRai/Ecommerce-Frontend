import React, { useState } from 'react';
import { Info } from 'lucide-react';
import {
  approveSellerRefund,
  acceptNegotiation,
  rejectSellerRefund,
  escalateSellerRefund,
  requestSellerEvidence,
  offerPartialRefund,
  offerExchange,
  offerFullRefund
} from '../../../../shared/api/refundApi';

export default function SellerUnderReview({
  detail,
  isNegotiated,
  isFullRefundRequest,
  onRefresh,
  setError
}) {
  const [submitting, setSubmitting] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [returnRequired, setReturnRequired] = useState(isNegotiated ? false : true);
  const [offerType, setOfferType] = useState(isNegotiated ? 'PARTIAL_REFUND' : 'RETURN_REQUIRED'); // RETURN_REQUIRED, FULL_REFUND, PARTIAL_REFUND, EXCHANGE
  const [offerNotes, setOfferNotes] = useState('');
  const [offerAmount, setOfferAmount] = useState('');

  const executeAction = async (actionFn, successMessage) => {
    setSubmitting(true);
    setError('');
    try {
      await actionFn();
      onRefresh();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || `Failed to perform action.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptNegotiated = () => executeAction(() => acceptNegotiation(detail.id));
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectNotes.trim()) return;
    executeAction(async () => {
      await rejectSellerRefund(detail.id, rejectNotes.trim());
      setShowRejectModal(false);
      setRejectNotes('');
    });
  };
  const handleRequestEvidence = () => executeAction(() => requestSellerEvidence(detail.id));
  const handleEscalateClaim = () => executeAction(() => escalateSellerRefund(detail.id));

  const handleOfferSubmit = async (e) => {
    e.preventDefault();
    executeAction(async () => {
      if (offerType === 'RETURN_REQUIRED') {
        await approveSellerRefund(detail.id, true);
      } else if (offerType === 'FULL_REFUND') {
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

  return (
    <div className="border-t border-gray-200 pt-5 flex flex-wrap gap-3 items-center justify-between bg-gray-50/50 p-4 rounded-xl">
      <div>
        {isNegotiated && (
          <span className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-1.5 text-xs font-black text-indigo-700 animate-slide-in">
            <Info size={14} /> Customer counter-proposed a price. Respond below.
          </span>
        )}
        {isFullRefundRequest && (
          <span className="inline-flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5 text-xs font-black text-red-700 animate-slide-in">
            <Info size={14} /> Customer rejected offer and requested a Full Refund.
          </span>
        )}
      </div>

      <div className="flex gap-3">
        {isNegotiated ? (
          <>
            <button
              onClick={handleAcceptNegotiated}
              disabled={submitting}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              {submitting ? 'Processing...' : 'Accept Negotiated Price'}
            </button>
            <button
              onClick={() => {
                setReturnRequired(false);
                setOfferType('PARTIAL_REFUND');
                setShowOfferModal(true);
              }}
              disabled={submitting}
              className="px-4 py-2.5 border border-indigo-500 text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Offer New Price
            </button>
            <button
              onClick={() => {
                setRejectNotes('');
                setShowRejectModal(true);
              }}
              disabled={submitting}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Reject Claim
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => {
                setReturnRequired(true);
                setOfferType('RETURN_REQUIRED');
                setShowOfferModal(true);
              }}
              disabled={submitting}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Approve Claim
            </button>
            <button
              onClick={handleRequestEvidence}
              disabled={submitting}
              className="px-4 py-2.5 border border-amber-500 text-amber-700 hover:bg-amber-50 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Request Evidence
            </button>
            <button
              onClick={() => {
                setRejectNotes('');
                setShowRejectModal(true);
              }}
              disabled={submitting}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Reject Claim
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

      {/* Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-gray-200 rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-205">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">Choose Approval / Counter Option</h3>
              <button type="button" onClick={() => setShowOfferModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleOfferSubmit} className="p-5 space-y-4 text-xs font-semibold text-gray-700">
              
              {!isNegotiated && (
                <div className="space-y-2">
                  <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400">Return Process</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setReturnRequired(true);
                        setOfferType('RETURN_REQUIRED');
                      }}
                      className={`p-2.5 rounded-lg border text-center font-bold transition-all ${
                        returnRequired === true ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-xs' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      Need to return product
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReturnRequired(false);
                        setOfferType('FULL_REFUND');
                      }}
                      className={`p-2.5 rounded-lg border text-center font-bold transition-all ${
                        returnRequired === false ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-xs' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      Don't need to return product
                    </button>
                  </div>
                </div>
              )}

              {/* Sub offer options if Don't Need return is selected (or when negotiating) */}
              {(returnRequired === false || isNegotiated) && (
                <div className="space-y-2 pt-2 border-t border-gray-100 animate-in fade-in duration-200">
                  <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400">Select Resolution Offer</label>
                  <div className="grid grid-cols-3 gap-2">
                    {!isNegotiated && (
                      <button
                        type="button"
                        onClick={() => setOfferType('FULL_REFUND')}
                        className={`p-2 rounded-lg border text-[10px] text-center font-bold transition-all ${
                          offerType === 'FULL_REFUND' ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-xs' : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        Full Refund
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setOfferType('PARTIAL_REFUND')}
                      className={`p-2 rounded-lg border text-[10px] text-center font-bold transition-all ${
                        offerType === 'PARTIAL_REFUND' ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-xs' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      Partial Refund
                    </button>
                    <button
                      type="button"
                      onClick={() => setOfferType('EXCHANGE')}
                      className={`p-2 rounded-lg border text-[10px] text-center font-bold transition-all ${
                        offerType === 'EXCHANGE' ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-xs' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      Exchange Product
                    </button>
                  </div>
                </div>
              )}

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
                  placeholder="Provide return details, refund explanations or counter proposal remarks..."
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
                  Submit Choice
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
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">Reject Refund Claim</h3>
              <button type="button" onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-gray-650">✕</button>
            </div>
            <form onSubmit={handleRejectSubmit} className="p-5 space-y-4 text-xs font-semibold text-gray-700">
              <div className="space-y-1">
                <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400">Rejection Explanation Reason</label>
                <textarea
                  value={rejectNotes}
                  onChange={e => setRejectNotes(e.target.value)}
                  placeholder="Explain exactly why you are rejecting this refund request (e.g. item damaged by customer, wrong request reasoning)..."
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
