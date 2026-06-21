import React from 'react';
import { CheckCircle2, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';

export default function ReviewRequestPage({
  detail,
  hooksContext,
  isDark = false
}) {
  const {
    setShowOfferModal,
    setShowRejectModal,
    handleApproveWithReturn,
    handleRequestEvidence,
    submitting
  } = hooksContext;

  return (
    <div className={`p-5 border rounded-2xl space-y-4 ${
      isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'
    }`}>
      <div className="space-y-1">
        <h4 className="text-xs font-black uppercase tracking-wider text-[#16A34A] flex items-center gap-1.5">
          <AlertTriangle size={14} /> Initial Claim Review
        </h4>
        <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
          Please review the customer's return statement and proof details, then select a claim resolution.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <button
          onClick={() => {
            if (detail.inspection) {
              hooksContext.setNeedsReturn(false);
              hooksContext.setAcceptStep('resolution_select');
            } else {
              hooksContext.setAcceptStep('return_check');
            }
            hooksContext.setOfferType('FULL_REFUND');
            setShowOfferModal(true);
          }}
          disabled={submitting}
          className="flex items-center justify-center gap-2 p-3 bg-[#16A34A] hover:bg-[#152F17] text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer border-0 transition-all"
        >
          <CheckCircle2 size={15} /> Accept Claim / Resolution
        </button>

        <button
          onClick={() => setShowRejectModal(true)}
          disabled={submitting}
          className="flex items-center justify-center gap-2 p-3 bg-red-650 hover:bg-red-700 bg-red-600 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer border-0 transition-all"
        >
          <XCircle size={15} /> Reject Claim
        </button>

        <button
          onClick={handleApproveWithReturn}
          disabled={submitting}
          className="flex items-center justify-center gap-2 p-3 border rounded-xl font-bold text-xs cursor-pointer bg-transparent transition-all border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white"
        >
          Request Product Return
        </button>

        <button
          onClick={handleRequestEvidence}
          disabled={submitting}
          className="flex items-center justify-center gap-2 p-3 border rounded-xl font-bold text-xs cursor-pointer bg-transparent transition-all border-indigo-500 text-indigo-650 hover:bg-indigo-500 hover:text-white"
        >
          Request More Evidence
        </button>
      </div>
    </div>
  );
}
