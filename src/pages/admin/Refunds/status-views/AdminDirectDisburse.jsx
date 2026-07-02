import React, { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { processPayment } from '../../../../services/refundApi';

export default function AdminDirectDisburse({
  refund,
  onActionCompleted,
  setError,
  themeClasses
}) {
  const [busy, setBusy] = useState(false);

  const handleDisburse = async () => {
    if (!window.confirm('Process refund payment and disburse funds to customer directly?')) return;
    setBusy(true);
    setError('');
    try {
      await processPayment(refund.id);
      onActionCompleted();
    } catch (err) {
      setError(err.response?.data?.message || 'Payment disbursement failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`border rounded-[20px] p-5 space-y-4 animate-in fade-in duration-200 transition-colors ${themeClasses.status.warning}`}>
      <p className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors ${themeClasses.text.warning}`}>
        <CreditCard size={15} /> Awaiting Seller Refund Payout
      </p>
      <p className={`text-xs leading-relaxed font-semibold transition-colors ${themeClasses.text.secondary}`}>
        The seller has been forced/requested to process the refund and submit a payment screenshot proof. 
        As an Admin, you can still bypass this and finalize/complete the refund directly if necessary.
      </p>
      <button
        onClick={handleDisburse}
        disabled={busy}
        className={`w-full py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors shadow-xs cursor-pointer disabled:opacity-50 ${themeClasses.button.primary}`}
      >
        {busy ? 'Processing...' : 'Directly Disburse & Finalize Refund'}
      </button>
    </div>
  );
}
