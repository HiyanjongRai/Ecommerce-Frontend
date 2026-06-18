import React, { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { processPayment } from '../../../../shared/api/refundApi';

export default function AdminDirectDisburse({
  refund,
  onActionCompleted,
  setError
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
    <div className="border border-orange-200 bg-orange-50/20 rounded-xl p-4 space-y-3 animate-in fade-in duration-200">
      <p className="text-xs font-bold text-orange-955 flex items-center gap-1.5">
        <CreditCard size={15} /> Awaiting Seller Refund Payout
      </p>
      <p className="text-xs text-orange-850 leading-relaxed font-semibold">
        The seller has been forced/requested to process the refund and submit a payment screenshot proof. 
        As an Admin, you can still bypass this and finalize/complete the refund directly if necessary.
      </p>
      <button
        onClick={handleDisburse}
        disabled={busy}
        className="w-full py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer"
      >
        {busy ? 'Processing...' : 'Directly Disburse & Finalize Refund'}
      </button>
    </div>
  );
}
