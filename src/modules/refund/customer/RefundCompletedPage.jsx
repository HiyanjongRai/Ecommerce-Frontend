import React from 'react';
import { CheckCircle } from 'lucide-react';

export default function RefundCompletedPage({
  detail
}) {
  const isExchange = detail.status === 'EXCHANGE_COMPLETED';

  return (
    <div className="bg-[#16A34A]/10 border border-[#16A34A]/20 rounded-2xl p-6 text-center space-y-3 max-w-xl mx-auto shadow-sm">
      <CheckCircle size={36} className="text-[#10B981] mx-auto animate-bounce" />
      <h3 className="text-base font-black text-gray-900 uppercase tracking-wide">
        {isExchange ? 'Exchange Completed Successfully!' : 'Refund Disbursed successfully!'}
      </h3>
      <p className="text-xs text-gray-600 leading-relaxed font-semibold">
        {isExchange 
          ? 'Your replacement product has been delivered and the transaction has been completed.'
          : 'The refund amount has been successfully credited back to your payment account. Please verify with your bank / wallet balance.'
        }
      </p>
      <div className="text-[10px] text-gray-400 font-bold uppercase pt-2">
        Case Reference: {detail.refundNumber}
      </div>
    </div>
  );
}
