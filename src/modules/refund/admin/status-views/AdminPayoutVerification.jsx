import React, { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { processPayment, rejectPayoutProof } from '../../../../shared/api/refundApi';

export default function AdminPayoutVerification({
  refund,
  onActionCompleted,
  setError
}) {
  const [busy, setBusy] = useState(false);

  const handleDisburse = async () => {
    if (!window.confirm("Confirm you have verified the seller's payout screenshot and want to complete this refund?")) return;
    setBusy(true);
    setError('');
    try {
      await processPayment(refund.id);
      onActionCompleted();
    } catch (err) {
      setError(err.response?.data?.message || 'Payout verification approval failed');
    } finally {
      setBusy(false);
    }
  };

  const handleRejectPayout = async () => {
    const reason = window.prompt('Enter reason for rejecting this payout proof:');
    if (reason === null) return;
    if (!reason.trim()) {
      alert('A rejection reason is required.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await rejectPayoutProof(refund.id, reason.trim());
      onActionCompleted();
    } catch (err) {
      setError(err.response?.data?.message || 'Payout proof rejection failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-purple-200 bg-purple-50/20 rounded-xl p-4 space-y-3 animate-in fade-in duration-200">
      <p className="text-xs font-bold text-purple-955 flex items-center gap-1.5">
        <CreditCard size={15} /> Payout Proof Verification Desk
      </p>
      <p className="text-xs text-purple-800 leading-relaxed font-semibold">
        The seller has uploaded their payout screenshot and transaction reference. Please verify these details carefully.
      </p>
      <div className="flex gap-3">
        <button
          onClick={handleDisburse}
          disabled={busy}
          className="flex-1 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer"
        >
          {busy ? 'Verifying...' : 'Verify & Approve Refund'}
        </button>
        <button
          onClick={handleRejectPayout}
          disabled={busy}
          className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer"
        >
          Reject Payout Proof
        </button>
      </div>
    </div>
  );
}
