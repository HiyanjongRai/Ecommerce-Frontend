import React from 'react';
import { Coins, CheckCircle } from 'lucide-react';

export default function OfferFullRefundPage({
  detail,
  hooksContext,
  isDark = false
}) {
  const { setShowOfferModal, setOfferType, setAcceptStep, handleAskPayment, submitting } = hooksContext;

  const canAskPayment = ['SELLER_APPROVED', 'CUSTOMER_ACCEPTS', 'INSPECTION_COMPLETE'].includes(detail.status);

  return (
    <div className={`p-5 border rounded-2xl space-y-4 ${
      isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'
    }`}>
      <div className="flex items-start gap-3">
        <Coins size={18} className="text-[#e8f3e9]0 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-black uppercase tracking-wider text-[#16A34A] dark:text-[#2E5E2C]">Full Refund Resolution Offered</h4>
          <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
            A full refund has been selected. Please request payment details from the customer or modify the resolution.
          </p>
        </div>
      </div>
      
      <div className="pt-2 flex flex-col sm:flex-row gap-2">
        {canAskPayment && (
          <button
            onClick={handleAskPayment}
            disabled={submitting}
            className="flex-1 py-2.5 bg-[#16A34A] hover:bg-[#152F17] text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer border-0 active:scale-[0.98]"
          >
            💳 Ask Payment Request
          </button>
        )}
        <button
          onClick={() => {
            setAcceptStep('resolution_select');
            setOfferType('FULL_REFUND');
            setShowOfferModal(true);
          }}
          disabled={submitting}
          className={`flex-1 py-2.5 border rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer bg-transparent ${
            isDark ? 'border-white/10 hover:bg-white/5 text-white' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
          }`}
        >
          Modify Resolution Type Offer
        </button>
      </div>
    </div>
  );
}
