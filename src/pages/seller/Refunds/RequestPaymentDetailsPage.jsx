import React from 'react';
import { CreditCard, QrCode, AlertCircle } from 'lucide-react';
import PayoutInfoCard from '../../../components/common/Refund/components/PayoutInfoCard';

export default function RequestPaymentDetailsPage({
  detail,
  hooksContext,
  isDark = false
}) {
  const {
    setShowPayoutModal,
    setPayoutForm,
    setPayoutFile,
    submitting
  } = hooksContext;

  const hasPayoutDetails = detail.customerAccountDetails || detail.customerQrUrl;

  return (
    <div className="space-y-6">
      {/* 1. Show the customer's payment info */}
      <PayoutInfoCard detail={detail} isDark={isDark} />

      {/* 2. Action to upload payout proof */}
      {detail.status === 'REFUND_PROCESSING' && hasPayoutDetails && (
        <div className={`p-5 border rounded-2xl space-y-4 ${
          isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'
        }`}>
          <div className="flex items-start gap-3 text-xs">
            <CreditCard size={18} className="text-orange-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-orange-850 dark:text-orange-400">Payment Payout Required</h4>
              <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
                Please transfer the refund amount to the customer's account or wallet above, then upload the receipt proof below.
              </p>
            </div>
          </div>
          
          <div className="pt-2">
            <button
              onClick={() => {
                setPayoutForm({ paymentReference: '', paymentComment: '' });
                setPayoutFile(null);
                setShowPayoutModal(true);
              }}
              disabled={submitting}
              className="w-full py-2.5 bg-[#16A34A] hover:bg-[#152F17] text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer border-0 active:scale-[0.98]"
            >
              Confirm Payout & Upload Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
