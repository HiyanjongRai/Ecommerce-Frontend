import React, { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { processPayment, rejectPayoutProof } from '../../api/refundApi';

export default function AdminPayoutVerification({
  refund,
  onActionCompleted,
  setError,
  themeClasses
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
    <div className={`border rounded-[20px] p-5 space-y-4 animate-in fade-in duration-200 transition-colors ${themeClasses.status.info}`}>
      <p className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors ${themeClasses.text.info}`}>
        <CreditCard size={15} /> Payout Proof Verification Desk
      </p>
      <p className={`text-xs leading-relaxed font-semibold transition-colors ${themeClasses.text.secondary}`}>
        The seller has uploaded their payout screenshot and transaction reference. Please verify these details carefully.
      </p>
      <div className="flex gap-3">
        <button
          onClick={handleDisburse}
          disabled={busy}
          className="flex-1 py-2.5 rounded-xl bg-purple-650 hover:bg-purple-750 text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-xs cursor-pointer disabled:opacity-50"
        >
          {busy ? 'Verifying...' : 'Verify & Approve Refund'}
        </button>
        <button
          onClick={handleRejectPayout}
          disabled={busy}
          className={`flex-1 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors shadow-xs cursor-pointer disabled:opacity-50 ${themeClasses.button.danger}`}
        >
          Reject Payout Proof
        </button>
      </div>
    </div>
  );
}
