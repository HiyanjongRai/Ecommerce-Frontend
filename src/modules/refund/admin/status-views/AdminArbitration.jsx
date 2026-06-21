import React, { useState } from 'react';
import { Gavel } from 'lucide-react';
import { adminApproveRefund, adminRequestEvidence, adminRejectRefund } from '../../../../shared/api/refundApi';

export default function AdminArbitration({
  refund,
  onActionCompleted,
  setError
}) {
  const [busy, setBusy] = useState(false);

  const handleApprove = async () => {
    if (!window.confirm('Overrule seller and APPROVE return process for this claim?')) return;
    setBusy(true);
    setError('');
    try {
      await adminApproveRefund(refund.id);
      onActionCompleted();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm('Uphold seller decision and REJECT this claim? This will close the case.')) return;
    setBusy(true);
    setError('');
    try {
      await adminRejectRefund(refund.id);
      onActionCompleted();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const handleRequestEvidence = async () => {
    if (!window.confirm('Request additional evidence from the customer?')) return;
    setBusy(true);
    setError('');
    try {
      await adminRequestEvidence(refund.id);
      onActionCompleted();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-pink-200 bg-pink-50/20 rounded-xl p-4 space-y-3 animate-in fade-in duration-200">
      <p className="text-xs font-bold text-pink-955 flex items-center gap-1.5">
        <Gavel size={15} /> Arbitration Panel
      </p>
      <p className="text-xs text-pink-800 leading-relaxed font-semibold">
        You can overrule the seller's decision or uphold the rejection. Approving will request the customer to ship return product.
      </p>
      <div className="flex gap-3">
        <button
          onClick={handleApprove}
          disabled={busy}
          className="flex-1 py-2 rounded-lg bg-[#16A34A]/100 hover:bg-[#152F17] text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer"
        >
          Approve (Overrule Seller)
        </button>
        <button
          onClick={handleRequestEvidence}
          disabled={busy}
          className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer"
        >
          Request More Evidence
        </button>
        <button
          onClick={handleReject}
          disabled={busy}
          className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer"
        >
          Reject (Uphold Seller Rejection)
        </button>
      </div>
    </div>
  );
}
