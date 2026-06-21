import React, { useState } from 'react';
import { Truck, CheckCircle2, XCircle, Barcode, Calendar } from 'lucide-react';
import { acceptExchange, rejectExchange } from '../../../../shared/api/refundApi';

export default function CustomerReplacementTracking({
  detail,
  onRefresh,
  setActionError
}) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAccept = async () => {
    if (!window.confirm("Are you sure you have received and accepted the replacement product? This will resolve and close the dispute.")) return;
    setSubmitting(true);
    setActionError('');
    try {
      await acceptExchange(detail.id);
      onRefresh();
    } catch (err) {
      console.error(err);
      setActionError(err.response?.data?.message || 'Failed to accept exchange product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectNotes.trim()) return;

    setSubmitting(true);
    setActionError('');
    try {
      await rejectExchange(detail.id, {
        notes: rejectNotes.trim()
      });
      setShowRejectModal(false);
      setRejectNotes('');
      onRefresh();
    } catch (err) {
      console.error(err);
      setActionError(err.response?.data?.message || 'Failed to reject exchange replacement');
    } finally {
      setSubmitting(false);
    }
  };

  if (detail.status !== 'REPLACEMENT_SHIPPED') {
    return null;
  }

  const dateLabel = (v) => v ? new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <div className="bg-indigo-50/20 border border-indigo-200 rounded-xl p-5 mb-6 space-y-4 animate-in fade-in duration-200 font-sans">
      <div className="flex items-center gap-2 border-b border-indigo-100 pb-3">
        <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
          <Truck size={16} />
        </div>
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-indigo-900">Replacement Package Shipped</h4>
          <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">The seller has dispatched your replacement product. Please monitor delivery.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white border border-gray-150 p-4 rounded-lg text-xs font-semibold text-gray-700">
        <div className="space-y-1">
          <span className="text-gray-400 block text-[9px] uppercase tracking-wider">Courier Service</span>
          <span className="text-gray-900 font-bold flex items-center gap-1.5">
            <Truck size={13} className="text-gray-400" />
            {detail.replacementCourier || 'N/A'}
          </span>
        </div>
        <div className="space-y-1">
          <span className="text-gray-400 block text-[9px] uppercase tracking-wider">Tracking Reference</span>
          <span className="text-gray-950 font-mono font-bold flex items-center gap-1.5">
            <Barcode size={13} className="text-gray-400" />
            {detail.replacementTrackingNumber || 'N/A'}
          </span>
        </div>
        <div className="space-y-1">
          <span className="text-gray-400 block text-[9px] uppercase tracking-wider">Dispatched Date</span>
          <span className="text-gray-900 flex items-center gap-1.5">
            <Calendar size={13} className="text-gray-400" />
            {dateLabel(detail.replacementShippedAt)}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          onClick={handleAccept}
          disabled={submitting}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-[#152F17] hover:bg-[#0D1E0F] text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
        >
          <CheckCircle2 size={14} />
          Accept & Complete Exchange
        </button>
        <button
          onClick={() => {
            setRejectNotes('');
            setShowRejectModal(true);
          }}
          disabled={submitting}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
        >
          <XCircle size={14} />
          Reject Replacement Product
        </button>
      </div>

      {/* Rejection Modal Dialog */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-gray-200 rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-205">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">Explain Replacement Rejection</h3>
              <button type="button" onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleRejectSubmit} className="p-5 space-y-4 text-xs font-semibold text-gray-700">
              <p className="text-[11px] text-gray-500 font-semibold leading-relaxed">
                By rejecting the replacement, this dispute request will revert to <strong>Under Review</strong> and change the request type to a <strong>Refund</strong> claim so you can request your money back.
              </p>
              <div className="space-y-1">
                <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400">Rejection Explanation Reason</label>
                <textarea
                  value={rejectNotes}
                  onChange={e => setRejectNotes(e.target.value)}
                  placeholder="Describe the issues with the replacement product (e.g. still broken, wrong size shipped, not delivered)..."
                  className="w-full border border-gray-200 rounded-lg p-2.5 bg-white font-semibold outline-none focus:border-red-500 h-24 shadow-2xs"
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
                  Confirm Rejection & Seek Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
