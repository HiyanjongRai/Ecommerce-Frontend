import React, { useState } from 'react';
import { Gavel } from 'lucide-react';
import { adminApproveRefund, adminRequestEvidence, adminRejectRefund } from '../../../../services/refundApi';

export default function AdminArbitration({
  refund,
  onActionCompleted,
  setError,
  themeClasses
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
    <div className={`border rounded-[20px] p-5 space-y-4 animate-in fade-in duration-200 transition-colors ${themeClasses.status.danger}`}>
      <p className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors ${themeClasses.text.danger}`}>
        <Gavel size={15} /> Arbitration Panel
      </p>
      <p className={`text-xs leading-relaxed font-semibold transition-colors ${themeClasses.text.secondary}`}>
        You can overrule the seller's decision or uphold the rejection. Approving will request the customer to ship return product.
      </p>
      <div className="flex flex-wrap sm:flex-nowrap gap-3">
        <button
          onClick={handleApprove}
          disabled={busy}
          className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-xs cursor-pointer disabled:opacity-50"
        >
          Approve (Overrule)
        </button>
        <button
          onClick={handleRequestEvidence}
          disabled={busy}
          className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-xs cursor-pointer disabled:opacity-50"
        >
          Request Evidence
        </button>
        <button
          onClick={handleReject}
          disabled={busy}
          className="flex-1 py-2.5 rounded-xl bg-red-650 hover:bg-red-750 text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-xs cursor-pointer disabled:opacity-50"
        >
          Reject (Uphold)
        </button>
      </div>
    </div>
  );
}
